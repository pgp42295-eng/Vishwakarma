// ---------------------------------------------------------------------------
// Demo backend: same interface as supaApi.js, but data lives in this browser's
// localStorage. Used automatically when Supabase keys are not configured, so
// evaluators can explore every screen without an account.
// ---------------------------------------------------------------------------
import { isoDate, windowLabel } from './util'

const KEY = 'vk-demo-v2'
const SESSION = 'vk-demo-session'
const listeners = new Set()

const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString()
const dayOffset = (d) => {
  const x = new Date()
  x.setDate(x.getDate() + d)
  return isoDate(x)
}

function seed() {
  const users = [
    { id: 'u-student', email: 'demo.student@iiml.ac.in', full_name: 'Demo Student', hostel: 'Hostel 5', room: '214', phone: '9876500001', role: 'student' },
    { id: 'u-admin', email: 'sao.desk@iiml.ac.in', full_name: 'SAO Desk', hostel: '', room: '', phone: '', role: 'admin' },
    { id: 'u-2', email: 'priya.s@iiml.ac.in', full_name: 'Priya Sharma', hostel: 'Hostel 3', room: '108', phone: '9876500002', role: 'student' },
    { id: 'u-3', email: 'rahul.m@iiml.ac.in', full_name: 'Rahul Mehta', hostel: 'Hostel 7', room: '322', phone: '9876500003', role: 'student' },
    { id: 'u-4', email: 'ananya.k@iiml.ac.in', full_name: 'Ananya Iyer', hostel: 'Hostel 5', room: '119', phone: '9876500004', role: 'student' },
    { id: 'u-5', email: 'karan.b@iiml.ac.in', full_name: 'Karan Bansal', hostel: 'Hostel 2', room: '205', phone: '9876500005', role: 'student' },
  ]
  const workers = [
    { id: 1, name: 'Ramesh Kumar', trade: 'electrical', phone: '9000000001', active: true },
    { id: 2, name: 'Suresh Yadav', trade: 'electrical', phone: '9000000002', active: true },
    { id: 3, name: 'Mohd. Irfan', trade: 'carpentry', phone: '9000000003', active: true },
    { id: 4, name: 'Rajesh Verma', trade: 'carpentry', phone: '9000000004', active: true },
    { id: 5, name: 'Anil Gupta', trade: 'plumbing', phone: '9000000005', active: true },
  ]
  const u = Object.fromEntries(users.map((x) => [x.id, x]))
  let id = 30
  const complaints = []
  const events = []
  const mk = (uid, category, issue, description, hAgo, status, extra = {}) => {
    id += 1
    const s = u[uid]
    const c = {
      id, student_id: uid, student_name: s.full_name, hostel: s.hostel, room: s.room, phone: s.phone,
      category, issue, description, absent_ok: !!extra.absent_ok,
      availability: extra.availability || [{ date: dayOffset(1), slot: '16-18' }, { date: dayOffset(2), slot: '18-20' }],
      status: 'submitted', worker_id: null, scheduled_slot: null, admin_note: null, rating: null, feedback: null,
      reopen_count: 0, created_at: hoursAgo(hAgo), queued_at: hoursAgo(hAgo),
      assigned_at: null, work_done_at: null, closed_at: null,
    }
    events.push({ id: events.length + 1, complaint_id: id, status: 'submitted', note: 'Request raised', actor_name: s.full_name, actor_role: 'student', created_at: c.created_at })
    const step = (st, h, note, actor = 'SAO Desk', role = 'admin') => {
      events.push({ id: events.length + 1, complaint_id: id, status: st, note, actor_name: actor, actor_role: role, created_at: hoursAgo(h) })
    }
    if (['assigned', 'work_done', 'closed'].includes(status)) {
      c.status = 'assigned'; c.worker_id = extra.worker; c.scheduled_slot = extra.slot; c.assigned_at = hoursAgo(hAgo - 1)
      step('assigned', hAgo - 1, `Assigned to ${workers.find((w) => w.id === extra.worker).name} · ${extra.slot}`)
    }
    if (['work_done', 'closed'].includes(status)) {
      c.status = 'work_done'; c.work_done_at = hoursAgo(hAgo - 3)
      step('work_done', hAgo - 3, 'Worker reported job complete')
    }
    if (status === 'closed') {
      c.status = 'closed'; c.closed_at = hoursAgo(hAgo - 4); c.rating = extra.rating; c.feedback = extra.feedback || null
      step('closed', hAgo - 4, `Student confirmed · ${extra.rating}★${extra.feedback ? ' · "' + extra.feedback + '"' : ''}`, s.full_name, 'student')
    }
    complaints.push(c)
  }
  // History
  mk('u-student', 'carpentry', 'Chair broken', 'Back rest came off', 200, 'closed', { worker: 3, slot: 'Mon, 4–6 PM', rating: 5, feedback: 'Quick and neat' })
  mk('u-2', 'plumbing', 'Tap leaking', '', 150, 'closed', { worker: 5, slot: 'Tue, 10–12 PM', rating: 4 })
  mk('u-3', 'electrical', 'Fan not working', 'Fan hums but does not spin', 120, 'closed', { worker: 1, slot: 'Wed, 6–8 PM', rating: 5 })
  mk('u-4', 'electrical', 'Switch or socket broken', 'Laptop charging socket sparks', 96, 'closed', { worker: 2, slot: 'Thu, 2–4 PM', rating: 3, feedback: 'Came late' })
  mk('u-4', 'electrical', 'Switch or socket broken', 'Same socket sparking again', 30, 'assigned', { worker: 1, slot: windowLabel({ date: dayOffset(1), slot: '16-18' }) })
  // Live queue
  mk('u-5', 'plumbing', 'Flush not working', 'Washroom 2nd floor, near stairs', 20, 'work_done', { worker: 5, slot: windowLabel({ date: dayOffset(0), slot: '10-12' }) })
  mk('u-2', 'carpentry', 'Door or lock problem', 'Door does not lock from inside', 9, 'submitted', { absent_ok: false })
  mk('u-3', 'electrical', 'Tube light / bulb not working', '', 6, 'submitted', { absent_ok: true })
  mk('u-5', 'electrical', 'Fan regulator broken', 'Stuck at speed 5', 3, 'submitted')
  mk('u-student', 'electrical', 'Fan not working', 'Fan stopped after power cut', 2, 'submitted', { availability: [{ date: dayOffset(1), slot: '12-14' }, { date: dayOffset(1), slot: '16-18' }, { date: dayOffset(2), slot: '18-20' }] })

  return { users, workers, complaints, events, nextId: id + 1, nextWorkerId: 6 }
}

function db() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const s = seed()
  save(s)
  return s
}
function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
}
const delay = (v) => new Promise((r) => setTimeout(() => r(v), 120))

function currentUserId() {
  try { return localStorage.getItem(SESSION) } catch { return null }
}
function me() {
  const s = db()
  return s.users.find((u) => u.id === currentUserId()) || null
}
function requireAdmin() {
  const u = me()
  if (!u || u.role !== 'admin') throw new Error('Only SAO admins can do this')
  return u
}
function addEvent(s, complaint_id, status, note, actor) {
  s.events.push({ id: s.events.length + 1, complaint_id, status, note, actor_name: actor.full_name, actor_role: actor.role, created_at: new Date().toISOString() })
}
const emit = () => listeners.forEach((fn) => fn())

export const mockApi = {
  mode: 'demo',

  // ---- auth -----------------------------------------------------------
  async getUser() {
    const u = me()
    return delay(u ? { id: u.id, email: u.email } : null)
  },
  onAuthChange(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  async demoLogin(role) {
    localStorage.setItem(SESSION, role === 'admin' ? 'u-admin' : 'u-student')
    emit()
  },
  async signIn() { throw new Error('Demo mode: use the demo buttons below') },
  async signUp() { throw new Error('Demo mode: use the demo buttons below') },
  async signOut() {
    localStorage.removeItem(SESSION)
    emit()
  },
  async resetDemo() {
    localStorage.removeItem(KEY)
    emit()
  },

  // ---- profile --------------------------------------------------------
  async getMyProfile() {
    return delay(me())
  },
  async saveProfile(p) {
    const s = db()
    const u = s.users.find((x) => x.id === currentUserId())
    Object.assign(u, { full_name: p.full_name, hostel: p.hostel, room: p.room, phone: p.phone })
    save(s)
    return delay(u)
  },

  // ---- student --------------------------------------------------------
  async listMyComplaints() {
    const s = db()
    const uid = currentUserId()
    return delay(s.complaints.filter((c) => c.student_id === uid).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((c) => withWorker(s, c)))
  },
  async getComplaint(id) {
    const s = db()
    const u = me()
    const c = s.complaints.find((x) => x.id === Number(id))
    if (!c || (u.role !== 'admin' && c.student_id !== u.id)) throw new Error('Request not found')
    return delay({
      ...withWorker(s, c),
      events: s.events.filter((e) => e.complaint_id === c.id).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    })
  },
  async queuePosition(id) {
    const s = db()
    const c = s.complaints.find((x) => x.id === Number(id))
    if (!c || c.status !== 'submitted') return null
    return s.complaints.filter((x) => x.status === 'submitted' && x.category === c.category && x.queued_at <= c.queued_at).length
  },
  async createComplaint({ category, issue, description, availability, absent_ok }) {
    const s = db()
    const u = me()
    if (!u.hostel || !u.room) throw new Error('Complete your profile first')
    const open = s.complaints.filter((c) => c.student_id === u.id && ['submitted', 'assigned', 'work_done'].includes(c.status))
    if (open.length >= 5) throw new Error('You already have 5 open requests')
    const now = new Date().toISOString()
    const c = {
      id: s.nextId++, student_id: u.id, student_name: u.full_name, hostel: u.hostel, room: u.room, phone: u.phone,
      category, issue, description: description || '', availability, absent_ok, status: 'submitted',
      worker_id: null, scheduled_slot: null, admin_note: null, rating: null, feedback: null, reopen_count: 0,
      created_at: now, queued_at: now, assigned_at: null, work_done_at: null, closed_at: null,
    }
    s.complaints.push(c)
    addEvent(s, c.id, 'submitted', 'Request raised', u)
    save(s)
    return delay(c)
  },
  async cancelComplaint(id) {
    return mutateOwn(id, ['submitted', 'assigned'], (c, s, u) => {
      c.status = 'cancelled'
      addEvent(s, c.id, 'cancelled', 'Cancelled by student', u)
    })
  },
  async confirmComplaint(id, rating, feedback) {
    return mutateOwn(id, ['assigned', 'work_done'], (c, s, u) => {
      c.status = 'closed'; c.closed_at = new Date().toISOString(); c.rating = rating; c.feedback = feedback || null
      addEvent(s, c.id, 'closed', `Student confirmed · ${rating}★${feedback ? ' · "' + feedback + '"' : ''}`, u)
    })
  },
  async reopenComplaint(id, reason) {
    return mutateOwn(id, ['assigned', 'work_done'], (c, s, u) => {
      c.status = 'submitted'; c.reopen_count += 1; c.worker_id = null; c.scheduled_slot = null; c.work_done_at = null
      // keeps original queued_at → goes back to the front of the line
      addEvent(s, c.id, 'submitted', `Reopened: ${reason || 'Not fixed'}`, u)
    })
  },

  // ---- admin ----------------------------------------------------------
  async listAllComplaints() {
    requireAdmin()
    const s = db()
    return delay(s.complaints.map((c) => withWorker(s, c)))
  },
  async assignComplaint(id, worker_id, scheduled_slot, admin_note) {
    const u = requireAdmin()
    const s = db()
    const c = s.complaints.find((x) => x.id === Number(id))
    // optimistic lock: only assign if still unassigned (or reassigning an assigned one)
    if (!c || !['submitted', 'assigned'].includes(c.status)) throw new Error('This request was already handled by someone else. Refresh.')
    const w = s.workers.find((x) => x.id === Number(worker_id))
    const re = c.status === 'assigned'
    Object.assign(c, { status: 'assigned', worker_id: w.id, scheduled_slot, admin_note: admin_note || null, assigned_at: new Date().toISOString() })
    addEvent(s, c.id, 'assigned', `${re ? 'Reassigned' : 'Assigned'} to ${w.name} · ${scheduled_slot}`, u)
    save(s)
    return delay(withWorker(s, c))
  },
  async markWorkDone(id) {
    const u = requireAdmin()
    const s = db()
    const c = s.complaints.find((x) => x.id === Number(id))
    if (c.status !== 'assigned') throw new Error('Only assigned jobs can be marked done')
    c.status = 'work_done'; c.work_done_at = new Date().toISOString()
    addEvent(s, c.id, 'work_done', 'Worker reported job complete', u)
    save(s)
    return delay(c)
  },
  async listWorkers() {
    const s = db()
    return delay([...s.workers])
  },
  async addWorker({ name, trade, phone }) {
    requireAdmin()
    const s = db()
    const w = { id: s.nextWorkerId++, name, trade, phone, active: true }
    s.workers.push(w)
    save(s)
    return delay(w)
  },
  async setWorkerActive(id, active) {
    requireAdmin()
    const s = db()
    s.workers.find((w) => w.id === id).active = active
    save(s)
    return delay(true)
  },
}

function withWorker(s, c) {
  return { ...c, worker: c.worker_id ? s.workers.find((w) => w.id === c.worker_id) || null : null }
}
function mutateOwn(id, allowed, fn) {
  const s = db()
  const u = me()
  const c = s.complaints.find((x) => x.id === Number(id))
  if (!c || c.student_id !== u.id) throw new Error('Request not found')
  if (!allowed.includes(c.status)) throw new Error('This action is no longer available')
  fn(c, s, u)
  save(s)
  return delay(c)
}
