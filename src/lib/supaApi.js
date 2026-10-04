// ---------------------------------------------------------------------------
// Live backend: Supabase (Postgres + Auth). Reads go through row-level
// security; every write is a server-side function (see supabase/schema.sql).
// ---------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js'
import { ALLOWED_DOMAIN } from '../config'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseConfigured = Boolean(url && key)
const sb = supabaseConfigured ? createClient(url, key) : null

function check({ data, error }) {
  if (error) {
    const msg = error.message || 'Something went wrong'
    if (/Database error saving new user/i.test(msg)) throw new Error(`Only @${ALLOWED_DOMAIN} email addresses can sign up`)
    throw new Error(msg)
  }
  return data
}
async function uid() {
  const { data } = await sb.auth.getUser()
  return data.user?.id
}

export const supaApi = {
  mode: 'live',

  // ---- auth -----------------------------------------------------------
  async getUser() {
    const { data } = await sb.auth.getSession()
    return data.session?.user ?? null
  },
  onAuthChange(fn) {
    const { data } = sb.auth.onAuthStateChange(() => fn())
    return () => data.subscription.unsubscribe()
  },
  async signIn(email, password) {
    check(await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }))
  },
  async signUp(email, password, full_name) {
    email = email.trim().toLowerCase()
    if (!email.endsWith('@' + ALLOWED_DOMAIN)) throw new Error(`Use your @${ALLOWED_DOMAIN} email`)
    const data = check(await sb.auth.signUp({ email, password, options: { data: { full_name } } }))
    return { needsConfirmation: !data.session }
  },
  async signOut() {
    await sb.auth.signOut()
  },
  async demoLogin() { throw new Error('Demo login is only available in demo mode') },

  // ---- profile --------------------------------------------------------
  async getMyProfile() {
    const id = await uid()
    if (!id) return null
    return check(await sb.from('profiles').select('*').eq('id', id).maybeSingle())
  },
  async saveProfile(p) {
    return check(await sb.rpc('save_profile', { p_full_name: p.full_name, p_hostel: p.hostel, p_room: p.room, p_phone: p.phone }))
  },

  // ---- student --------------------------------------------------------
  async listMyComplaints() {
    const id = await uid()
    return check(await sb.from('complaints').select('*, worker:workers(*)').eq('student_id', id).order('created_at', { ascending: false }))
  },
  async getComplaint(id) {
    const c = check(await sb.from('complaints').select('*, worker:workers(*), events:complaint_events(*)').eq('id', id).maybeSingle())
    if (!c) throw new Error('Request not found')
    c.events.sort((a, b) => a.created_at.localeCompare(b.created_at))
    return c
  },
  async queuePosition(id) {
    return check(await sb.rpc('queue_position', { p_id: Number(id) }))
  },
  async createComplaint({ category, issue, description, availability, absent_ok }) {
    return check(await sb.rpc('create_complaint', { p_category: category, p_issue: issue, p_description: description, p_availability: availability, p_absent_ok: absent_ok }))
  },
  async cancelComplaint(id) {
    return check(await sb.rpc('cancel_complaint', { p_id: Number(id) }))
  },
  async confirmComplaint(id, rating, feedback) {
    return check(await sb.rpc('confirm_complaint', { p_id: Number(id), p_rating: rating, p_feedback: feedback || '' }))
  },
  async reopenComplaint(id, reason) {
    return check(await sb.rpc('reopen_complaint', { p_id: Number(id), p_reason: reason || '' }))
  },

  // ---- admin ----------------------------------------------------------
  async listAllComplaints() {
    // MVP: last 500 is plenty for one campus; paginate when it isn't.
    return check(await sb.from('complaints').select('*, worker:workers(*)').order('queued_at', { ascending: true }).limit(500))
  },
  async assignComplaint(id, worker_id, scheduled_slot, admin_note) {
    return check(await sb.rpc('assign_complaint', { p_id: Number(id), p_worker_id: Number(worker_id), p_slot: scheduled_slot, p_note: admin_note || '' }))
  },
  async markWorkDone(id) {
    return check(await sb.rpc('mark_work_done', { p_id: Number(id) }))
  },
  async listWorkers() {
    return check(await sb.from('workers').select('*').order('trade').order('name'))
  },
  async addWorker({ name, trade, phone }) {
    return check(await sb.from('workers').insert({ name, trade, phone }).select().single())
  },
  async setWorkerActive(id, active) {
    check(await sb.from('workers').update({ active }).eq('id', id))
    return true
  },
}
