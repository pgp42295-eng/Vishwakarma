import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useToast } from '../auth'
import { CATEGORIES } from '../config'
import { Shell, Spinner, Stars, PageHeader } from '../components/ui'
import { hoursBetween } from '../lib/util'

export default function AdminWorkers() {
  const toast = useToast()
  const [workers, setWorkers] = useState(null)
  const [rows, setRows] = useState([])
  const [f, setF] = useState({ name: '', trade: 'electrical', phone: '' })

  const load = async () => {
    const [w, r] = await Promise.all([api.listWorkers(), api.listAllComplaints()])
    setWorkers(w); setRows(r)
  }
  useEffect(() => { load().catch(() => {}) }, [])

  async function add(e) {
    e.preventDefault()
    if (!/^\d{10}$/.test(f.phone)) return toast('Enter a 10-digit phone number', 'err')
    try {
      await api.addWorker(f)
      setF({ name: '', trade: f.trade, phone: '' })
      toast('Worker added')
      load()
    } catch (err) { toast(err.message, 'err') }
  }
  async function toggle(w) {
    await api.setWorkerActive(w.id, !w.active)
    load()
  }

  if (!workers) return <Shell admin><Spinner /></Shell>

  const stats = (w) => {
    const mine = rows.filter((r) => r.worker_id === w.id)
    const open = mine.filter((r) => r.status === 'assigned').length
    const closed = mine.filter((r) => r.status === 'closed')
    const rated = closed.filter((r) => r.rating)
    const avg = rated.length ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : 0
    const hrs = closed.length ? closed.reduce((a, r) => a + hoursBetween(r.assigned_at || r.created_at, r.closed_at), 0) / closed.length : 0
    return { open, closed: closed.length, avg, hrs }
  }

  return (
    <Shell admin>
      <PageHeader eyebrow="Student Affairs Office" title="Workers">Campus electricians, carpenters and plumbers. Mark someone on leave to hide them from assignment.</PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {Object.entries(CATEGORIES).map(([k, c]) => (
            <div key={k}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{c.icon} {c.worker}s</h2>
              <div className="card divide-y divide-slate-100">
                {workers.filter((w) => w.trade === k).map((w) => {
                  const s = stats(w)
                  return (
                    <div key={w.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 ${w.active ? '' : 'opacity-50'}`}>
                      <div>
                        <div className="font-bold">{w.name}</div>
                        <div className="text-xs text-slate-500">{w.phone}</div>
                      </div>
                      <div className="flex items-center gap-5 text-xs">
                        <Stat label="Open" value={s.open} />
                        <Stat label="Done" value={s.closed} />
                        <Stat label="Avg. time" value={s.closed ? `${s.hrs.toFixed(0)}h` : '–'} />
                        <div className="text-center">
                          {s.avg ? <Stars value={Math.round(s.avg)} size="text-sm" /> : <span className="text-slate-400">No ratings</span>}
                          {s.avg ? <div className="text-slate-500">{s.avg.toFixed(1)}</div> : null}
                        </div>
                        <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => toggle(w)}>{w.active ? 'Mark on leave' : 'Activate'}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={add} className="card h-fit p-5">
          <h2 className="font-bold">Add worker</h2>
          <p className="mt-1 text-xs text-slate-500">Workers don&apos;t need an account. They get job sheets on WhatsApp or as a printout.</p>
          <label className="label mt-4">Name</label>
          <input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <label className="label mt-3">Trade</label>
          <select className="input" value={f.trade} onChange={(e) => setF({ ...f, trade: e.target.value })}>
            {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.worker}</option>)}
          </select>
          <label className="label mt-3">Phone</label>
          <input className="input" required inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <button className="btn-accent mt-4 w-full">Add</button>
        </form>
      </div>
    </Shell>
  )
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-base font-extrabold text-ink">{value}</div>
      <div className="text-slate-500">{label}</div>
    </div>
  )
}
