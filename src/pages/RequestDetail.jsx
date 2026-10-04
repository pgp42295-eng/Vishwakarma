import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useToast } from '../auth'
import { CATEGORIES } from '../config'
import { Shell, StatusBadge, CategoryPill, Timeline, Stars, Spinner } from '../components/ui'
import { code, windowLabel, fmtDateTime } from '../lib/util'

const STEPS = [
  ['submitted', 'Raised'],
  ['assigned', 'Assigned'],
  ['work_done', 'Work done'],
  ['closed', 'Confirmed'],
]

export default function RequestDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const [c, setC] = useState(null)
  const [pos, setPos] = useState(null)
  const [err, setErr] = useState('')
  const [panel, setPanel] = useState(null) // 'confirm' | 'reopen'
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.getComplaint(id)
      setC(r)
      setPos(r.status === 'submitted' ? await api.queuePosition(id) : null)
    } catch (e) {
      setErr(e.message)
    }
  }, [id])
  useEffect(() => { load() }, [load])

  async function act(fn, okMsg) {
    setBusy(true)
    try {
      await fn()
      toast(okMsg)
      setPanel(null); setText(''); setRating(0)
      await load()
    } catch (e) {
      toast(e.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  if (err) return <Shell><div className="card p-6 text-sm">{err}</div></Shell>
  if (!c) return <Shell><Spinner /></Shell>

  const stepIdx = c.status === 'cancelled' ? -1 : STEPS.findIndex(([s]) => s === c.status)
  const canConfirm = ['assigned', 'work_done'].includes(c.status)

  return (
    <Shell>
      <button className="mb-4 text-sm font-semibold text-slate-500 hover:text-brand-700" onClick={() => nav('/')}>← Back to dashboard</button>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="card h-fit p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <CategoryPill category={c.category} />
              <span className="text-xs font-semibold text-slate-500">{code(c.id)}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">{c.issue}</h1>
            {c.description && <p className="mt-1 text-sm text-slate-600">{c.description}</p>}
          </div>
          <StatusBadge status={c.status} />
        </div>

        {/* progress */}
        {stepIdx >= 0 && (
          <div className="mt-5 grid grid-cols-4 gap-1.5">
            {STEPS.map(([s, label], i) => (
              <div key={s}>
                <div className={`h-1.5 rounded-full ${i <= stepIdx ? 'bg-brand-500' : 'bg-slate-200'}`} />
                <div className={`mt-1.5 text-[11px] font-semibold ${i <= stepIdx ? 'text-ink' : 'text-slate-400'}`}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* headline status box */}
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          {c.status === 'submitted' && (
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-xl font-extrabold text-white">#{pos ?? '–'}</div>
              <div className="text-sm">
                <div className="font-bold">In the {CATEGORIES[c.category].worker.toLowerCase()} queue</div>
                <div className="text-slate-500">First come, first served. SAO will assign a worker in one of your slots.</div>
              </div>
            </div>
          )}
          {(c.status === 'assigned' || c.status === 'work_done') && (
            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.status === 'assigned' ? 'Visit scheduled' : 'Worker reported job complete'}</div>
              <div className="mt-1 text-lg font-extrabold">{c.scheduled_slot}</div>
              <div className="text-slate-600">{c.worker?.name} · {CATEGORIES[c.category].worker}</div>
              {c.admin_note && <div className="mt-2 text-xs text-slate-500">Note from SAO: {c.admin_note}</div>}
            </div>
          )}
          {c.status === 'closed' && (
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-bold text-emerald-700">Resolved {fmtDateTime(c.closed_at)}</div>
                <div className="text-slate-500">Fixed by {c.worker?.name}{c.feedback ? ` · “${c.feedback}”` : ''}</div>
              </div>
              <Stars value={c.rating} size="text-lg" />
            </div>
          )}
          {c.status === 'cancelled' && <div className="text-sm text-slate-500">You cancelled this request.</div>}
        </div>

        {/* actions */}
        {canConfirm && !panel && (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button className="btn-accent !py-3" onClick={() => setPanel('confirm')}>✓ Confirm work done</button>
            <button className="btn-ghost !py-3" onClick={() => setPanel('reopen')}>Not fixed</button>
          </div>
        )}
        {panel === 'confirm' && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-bold">How was the service?</div>
            <div className="mt-2"><Stars value={rating} onChange={setRating} /></div>
            <input className="input mt-3" placeholder="Optional feedback" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} />
            <p className="mt-2 text-xs text-slate-500">Confirming is your digital signature. It closes the job and is recorded with a timestamp.</p>
            <div className="mt-3 flex gap-2">
              <button className="btn-ghost" onClick={() => setPanel(null)}>Back</button>
              <button className="btn-accent flex-1" disabled={!rating || busy} onClick={() => act(() => api.confirmComplaint(c.id, rating, text), 'Thanks! Job closed.')}>
                {rating ? 'Confirm & close' : 'Tap a rating'}
              </button>
            </div>
          </div>
        )}
        {panel === 'reopen' && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-bold">What&apos;s still wrong?</div>
            <input className="input mt-2" placeholder="e.g. Worker didn't come / fan still not spinning" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} />
            <p className="mt-2 text-xs text-slate-500">Your request goes back to the queue with its original position, not to the end.</p>
            <div className="mt-3 flex gap-2">
              <button className="btn-ghost" onClick={() => setPanel(null)}>Back</button>
              <button className="btn-primary flex-1" disabled={busy} onClick={() => act(() => api.reopenComplaint(c.id, text), 'Reopened. Back in the queue.')}>Send back to queue</button>
            </div>
          </div>
        )}
        {['submitted', 'assigned'].includes(c.status) && !panel && (
          <button className="mt-3 w-full text-center text-xs font-semibold text-slate-500 hover:text-red-600" disabled={busy}
            onClick={() => act(() => api.cancelComplaint(c.id), 'Request cancelled')}>
            Fixed it yourself? Cancel request
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div className="card p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Your availability</h2>
          {c.availability.length === 0 && <div className="text-sm text-slate-500">No slots selected.</div>}
          <ul className="space-y-1.5">
            {c.availability.map((w, i) => (
              <li key={i} className="text-sm font-medium">{windowLabel(w)}</li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-slate-500">{c.absent_ok ? '✓ OK to fix in your absence' : 'You need to be present'}</div>
          <div className="mt-1 text-xs text-slate-500">{c.hostel}, Room {c.room}</div>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Activity log</h2>
          <Timeline events={c.events} />
        </div>
      </div>
      </div>
    </Shell>
  )
}
