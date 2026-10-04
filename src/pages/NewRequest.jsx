import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth, useToast } from '../auth'
import { CATEGORIES, SLOTS } from '../config'
import { Shell, PageHeader } from '../components/ui'
import { nextDays } from '../lib/util'

export default function NewRequest() {
  const [params] = useSearchParams()
  const { profile } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const [category, setCategory] = useState(params.get('c') || '')
  const [issue, setIssue] = useState('')
  const [custom, setCustom] = useState('')
  const [description, setDescription] = useState('')
  const [slots, setSlots] = useState([]) // [{date, slot}]
  const [absentOk, setAbsentOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const days = nextDays(4)
  const nowHour = new Date().getHours()

  const has = (date, slot) => slots.some((s) => s.date === date && s.slot === slot)
  const toggle = (date, slot) =>
    setSlots(has(date, slot) ? slots.filter((s) => !(s.date === date && s.slot === slot)) : [...slots, { date, slot }])

  const finalIssue = issue === '__other' ? custom.trim() : issue
  const ready = category && finalIssue && (slots.length > 0 || absentOk)

  async function submit() {
    setBusy(true)
    try {
      const sorted = [...slots].sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot))
      const c = await api.createComplaint({ category, issue: finalIssue, description, availability: sorted, absent_ok: absentOk })
      toast('Request raised. You are in the queue.')
      nav(`/r/${c.id}`, { replace: true })
    } catch (e) {
      toast(e.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  const visibleDays = days.filter((d, di) => di > 0 || SLOTS.some((x) => Number(x.id.split('-')[1]) > nowHour))
  const isPast = (d, sl) => d.date === days[0].date && Number(sl.id.split('-')[1]) <= nowHour

  return (
    <Shell>
      <PageHeader eyebrow="New request" title="Raise a repair request" actions={<button className="btn-ghost" onClick={() => nav('/')}>Cancel</button>}>
        Takes about 10 seconds. Your hostel, room and phone come from your profile automatically.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          {/* Step 1: trade */}
          <section className="card p-6">
            <StepTitle n="1" title="Which trade do you need?" />
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(CATEGORIES).map(([k, c]) => (
                <button key={k} onClick={() => { setCategory(k); setIssue('') }}
                  className={`rounded-xl border-2 p-4 text-left transition ${category === k ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500' : 'border-slate-200 hover:border-brand-300'}`}>
                  <div className="text-2xl">{c.icon}</div>
                  <div className="mt-2 font-bold">{c.label}</div>
                  <div className="text-xs text-slate-500">{c.worker}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: issue */}
          <section className={`card p-6 ${category ? '' : 'pointer-events-none opacity-50'}`}>
            <StepTitle n="2" title="What's the problem?" />
            {category ? (
              <div className="flex flex-wrap gap-2">
                {CATEGORIES[category].issues.map((i) => (
                  <button key={i} className={issue === i ? 'chip-on' : 'chip-off'} onClick={() => setIssue(i)}>{i}</button>
                ))}
                <button className={issue === '__other' ? 'chip-on' : 'chip-off'} onClick={() => setIssue('__other')}>Something else</button>
              </div>
            ) : <p className="text-sm text-slate-500">Choose a trade first.</p>}
            {issue === '__other' && (
              <input className="input mt-3" maxLength={80} placeholder="Short title, e.g. Curtain rod fell" value={custom} onChange={(e) => setCustom(e.target.value)} />
            )}
            <label className="label mt-5">Details for the worker (optional)</label>
            <textarea className="input min-h-[80px]" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fan hums but doesn't spin. Started after yesterday's power cut." />
          </section>

          {/* Step 3: availability */}
          <section className="card p-6">
            <StepTitle n="3" title="When are you free?" sub="Select every slot that works around your classes. SAO schedules the visit in one of them." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-separate border-spacing-1.5 text-sm">
                <thead>
                  <tr>
                    <th className="w-28" />
                    {SLOTS.map((sl) => <th key={sl.id} className="pb-1 text-xs font-semibold text-slate-500">{sl.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleDays.map((d) => (
                    <tr key={d.date}>
                      <td className="pr-2"><div className="font-bold">{d.label}</div><div className="text-xs text-slate-500">{d.sub}</div></td>
                      {SLOTS.map((sl) => {
                        if (isPast(d, sl)) return <td key={sl.id}><div className="h-10 rounded-lg bg-slate-50" /></td>
                        const on = has(d.date, sl.id)
                        return (
                          <td key={sl.id}>
                            <button onClick={() => toggle(d.date, sl.id)} aria-label={`${d.label} ${sl.label}`}
                              className={`h-10 w-full rounded-lg border text-xs font-bold transition ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-400 hover:border-brand-300 hover:bg-brand-50'}`}>
                              {on ? '✓ Free' : ''}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={absentOk} onChange={(e) => setAbsentOk(e.target.checked)} />
              <span className="text-sm">
                <b>OK to fix while I&apos;m away</b>
                <span className="block text-xs text-slate-500">Worker may enter with the caretaker&apos;s key. Leave unticked if you need to be present.</span>
              </span>
            </label>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h3 className="font-bold">Request summary</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Row k="Location">{profile?.hostel}, Room {profile?.room}</Row>
              <Row k="Contact">{profile?.phone}</Row>
              <Row k="Trade">{category ? CATEGORIES[category].label : <span className="text-slate-400">Not selected</span>}</Row>
              <Row k="Issue">{finalIssue || <span className="text-slate-400">Not selected</span>}</Row>
              <Row k="Free slots">{slots.length ? `${slots.length} selected` : <span className="text-slate-400">None yet</span>}</Row>
              <Row k="Absence OK">{absentOk ? 'Yes' : 'No'}</Row>
            </dl>
            <button className="btn-primary mt-6 w-full !py-3" disabled={!ready || busy} onClick={submit}>
              {busy ? 'Submitting…' : 'Submit request'}
            </button>
            {!ready && <p className="mt-2 text-center text-xs text-slate-500">Pick a trade, an issue and at least one slot.</p>}
          </div>
          <p className="mt-3 px-1 text-xs leading-relaxed text-slate-500">You can raise up to 5 open requests at a time. For emergencies like sparking or flooding, call the SAO landline directly.</p>
        </aside>
      </div>
    </Shell>
  )
}

function Row({ k, children }) {
  return <div className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold">{children}</dd></div>
}

function StepTitle({ n, title, sub }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{n}</span>
        <h2 className="font-bold">{title}</h2>
      </div>
      {sub && <p className="ml-7 mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}
