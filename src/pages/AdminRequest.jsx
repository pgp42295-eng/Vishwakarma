import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useToast } from '../auth'
import { CATEGORIES } from '../config'
import { Shell, StatusBadge, CategoryPill, Timeline, Stars, Spinner } from '../components/ui'
import { code, windowLabel, timeAgo, whatsappLink, jobSheetText } from '../lib/util'

export default function AdminRequest() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const [c, setC] = useState(null)
  const [workers, setWorkers] = useState([])
  const [load, setLoad] = useState({})
  const [workerId, setWorkerId] = useState('')
  const [slot, setSlot] = useState('')
  const [customSlot, setCustomSlot] = useState('')
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const [r, ws, all] = await Promise.all([api.getComplaint(id), api.listWorkers(), api.listAllComplaints()])
    setC(r)
    setWorkers(ws)
    const l = {}
    for (const x of all) if (x.status === 'assigned' && x.worker_id) l[x.worker_id] = (l[x.worker_id] || 0) + 1
    setLoad(l)
  }, [id])
  useEffect(() => { refresh().catch(() => {}) }, [refresh])

  if (!c) return <Shell admin><Spinner /></Shell>

  const tradeWorkers = workers.filter((w) => w.trade === c.category && w.active)
  const finalSlot = slot === '__custom' ? customSlot.trim() : slot
  const showAssign = c.status === 'submitted' || editing

  async function assign() {
    setBusy(true)
    try {
      await api.assignComplaint(c.id, workerId, finalSlot, note)
      toast('Assigned. Send the job sheet on WhatsApp.')
      setEditing(false)
      await refresh()
    } catch (e) {
      toast(e.message, 'err')
    } finally {
      setBusy(false)
    }
  }
  async function done() {
    setBusy(true)
    try {
      await api.markWorkDone(c.id)
      toast('Marked done. Waiting for student to confirm.')
      await refresh()
    } catch (e) {
      toast(e.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell admin>
      <button className="mb-4 text-sm font-semibold text-slate-500 hover:text-brand-700" onClick={() => nav('/admin')}>← Back to queue</button>
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <CategoryPill category={c.category} />
                  <span className="text-xs font-semibold text-slate-500">{code(c.id)} · raised {timeAgo(c.created_at)}</span>
                </div>
                <h1 className="text-xl font-extrabold tracking-tight">{c.issue}</h1>
                {c.description && <p className="mt-1 text-sm text-slate-600">{c.description}</p>}
                {c.reopen_count > 0 && <p className="mt-2 text-xs font-semibold text-red-600">Reopened {c.reopen_count}× by student. Kept its original queue position.</p>}
              </div>
              <StatusBadge status={c.status} admin />
            </div>
            <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <Info label="Student">{c.student_name}</Info>
              <Info label="Location">{c.hostel}, Room {c.room}</Info>
              <Info label="Phone"><a className="font-semibold underline underline-offset-2" href={`tel:${c.phone}`}>{c.phone}</a></Info>
            </div>
          </div>

          {/* Assign panel */}
          {showAssign && (
            <div className="card p-5">
              <h2 className="font-bold">{editing ? 'Reassign' : 'Assign a worker'}</h2>
              <label className="label mt-4">{CATEGORIES[c.category].worker}</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {tradeWorkers.map((w) => (
                  <button key={w.id} onClick={() => setWorkerId(String(w.id))}
                    className={`rounded-xl border-2 p-3 text-left transition ${String(w.id) === workerId ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500' : 'border-slate-200 hover:border-brand-300'}`}>
                    <div className="text-sm font-bold">{w.name}</div>
                    <div className={`text-xs ${String(w.id) === workerId ? 'text-brand-700' : 'text-slate-500'}`}>{load[w.id] || 0} open job{load[w.id] === 1 ? '' : 's'}</div>
                  </button>
                ))}
                {tradeWorkers.length === 0 && <div className="text-sm text-slate-500">No active workers for this trade. Add one in Workers.</div>}
              </div>

              <label className="label mt-5">Visit slot (from student&apos;s availability)</label>
              <div className="flex flex-wrap gap-2">
                {c.availability.map((w, i) => {
                  const l = windowLabel(w)
                  return <button key={i} className={slot === l ? 'chip-on' : 'chip-off'} onClick={() => setSlot(l)}>{l}</button>
                })}
                <button className={slot === '__custom' ? 'chip-on' : 'chip-off'} onClick={() => setSlot('__custom')}>Other…</button>
              </div>
              {c.absent_ok && <p className="mt-2 text-xs text-emerald-700">Student is OK with the work being done in their absence.</p>}
              {slot === '__custom' && (
                <input className="input mt-3" placeholder="e.g. Sun 5 Oct, 11 AM (call student first)" value={customSlot} onChange={(e) => setCustomSlot(e.target.value)} />
              )}

              <label className="label mt-5">Note to worker / student (optional)</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bring a spare regulator" maxLength={160} />

              <div className="mt-5 flex gap-2">
                {editing && <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>}
                <button className="btn-accent flex-1 !py-3" disabled={!workerId || !finalSlot || busy} onClick={assign}>
                  {busy ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </div>
          )}

          {/* After assignment */}
          {c.status === 'assigned' && !editing && (
            <div className="card p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned</div>
              <div className="mt-1 text-lg font-extrabold">{c.worker?.name}</div>
              <div className="text-sm text-slate-600">{c.scheduled_slot}</div>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-sans text-xs leading-relaxed text-slate-700">{jobSheetText(c, c.worker)}</pre>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <a className="btn bg-[#25D366] text-white hover:brightness-95" target="_blank" rel="noreferrer" href={whatsappLink(c.worker?.phone, jobSheetText(c, c.worker))}>
                  Send on WhatsApp
                </a>
                <button className="btn-primary" disabled={busy} onClick={done}>Worker reported done</button>
                <button className="btn-ghost" onClick={() => { setEditing(true); setWorkerId(String(c.worker_id)) }}>Reassign</button>
              </div>
            </div>
          )}
          {c.status === 'work_done' && (
            <div className="card p-5 text-sm">
              <div className="font-bold">Waiting for {c.student_name} to confirm</div>
              <div className="mt-1 text-slate-500">The student signs off in their app. If the fix didn&apos;t hold, they can reopen it and it goes back to the front of the queue.</div>
            </div>
          )}
          {c.status === 'closed' && (
            <div className="card flex items-center justify-between p-5 text-sm">
              <div>
                <div className="font-bold text-emerald-700">Closed by student</div>
                <div className="text-slate-500">{c.worker?.name}{c.feedback ? ` · “${c.feedback}”` : ''}</div>
              </div>
              <Stars value={c.rating} size="text-lg" />
            </div>
          )}
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Audit trail</h2>
          <Timeline events={c.events} />
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            Every step is time-stamped with who did it. This replaces the paper receipt and protects both the student and the worker.
          </p>
        </div>
      </div>
    </Shell>
  )
}

function Info({ label, children }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  )
}
