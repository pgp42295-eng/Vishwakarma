import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth, useToast } from '../auth'
import { HOSTELS } from '../config'
import { Shell, Logo, DemoBanner, TopStrip } from '../components/ui'

export default function Profile({ firstTime = false }) {
  const { profile, refresh } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const [f, setF] = useState({
    full_name: profile?.full_name || '',
    hostel: profile?.hostel || '',
    room: profile?.room || '',
    phone: profile?.phone || '',
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    if (!/^\d{10}$/.test(f.phone)) return toast('Enter a 10-digit phone number', 'err')
    setBusy(true)
    try {
      await api.saveProfile(f)
      await refresh()
      toast('Profile saved')
      nav('/')
    } catch (err) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  const form = (
    <form onSubmit={save} className="card p-8">
      <h1 className="text-xl font-extrabold">{firstTime ? 'One-time setup' : 'Your profile'}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Saved once, attached to every request, so you never have to dictate your room number on the phone again.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input className="input" required value={f.full_name} onChange={set('full_name')} />
        </div>
        <div>
          <label className="label">Hostel</label>
          <select className="input" required value={f.hostel} onChange={set('hostel')}>
            <option value="">Select hostel</option>
            {HOSTELS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Room number</label>
          <input className="input" required value={f.room} onChange={set('room')} placeholder="e.g. 214" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Phone (worker may call before visiting)</label>
          <input className="input" required inputMode="numeric" maxLength={10} value={f.phone} onChange={set('phone')} placeholder="10-digit mobile" />
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        {!firstTime && <button type="button" className="btn-ghost" onClick={() => nav(-1)}>Cancel</button>}
        <button className="btn-accent flex-1" disabled={busy}>{busy ? 'Saving…' : firstTime ? 'Save & continue' : 'Save changes'}</button>
      </div>
      <p className="mt-4 text-xs text-slate-500">Your phone number is shared only with the SAO and the worker assigned to your request.</p>
    </form>
  )

  if (firstTime) {
    return (
      <div className="min-h-screen">
        <DemoBanner />
        <TopStrip />
        <div className="mx-auto max-w-xl px-6 py-14">
          <div className="mb-6"><Logo /></div>
          {form}
        </div>
      </div>
    )
  }
  return <Shell><div className="mx-auto max-w-2xl">{form}</div></Shell>
}
