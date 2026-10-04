import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { CATEGORIES, HOSTELS } from '../config'
import { Shell, StatusBadge, CategoryPill, Spinner } from '../components/ui'
import { code, timeAgo, windowLabel, repeatKeys, repeatKey, hoursBetween } from '../lib/util'

const TABS = [
  ['submitted', 'Unassigned'],
  ['assigned', 'Assigned'],
  ['work_done', 'Awaiting student'],
  ['closed', 'Closed'],
  ['all', 'All'],
]

export default function AdminDashboard() {
  const nav = useNavigate()
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('submitted')
  const [trade, setTrade] = useState('')
  const [hostel, setHostel] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { api.listAllComplaints().then(setRows).catch(() => {}) }, [])

  const repeats = useMemo(() => (rows ? repeatKeys(rows.filter((r) => r.status !== 'cancelled')) : new Set()), [rows])

  if (!rows) return <Shell admin><Spinner /></Shell>

  const count = (s) => rows.filter((r) => r.status === s).length
  const week = rows.filter((r) => r.status === 'closed' && Date.now() - new Date(r.closed_at) < 7 * 86400000)
  const avgHrs = week.length ? week.reduce((a, r) => a + hoursBetween(r.created_at, r.closed_at), 0) / week.length : 0
  const rated = rows.filter((r) => r.rating)
  const avgRating = rated.length ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : 0
  const oldest = rows.filter((r) => r.status === 'submitted').sort((a, b) => a.queued_at.localeCompare(b.queued_at))[0]

  const filtered = rows
    .filter((r) => (tab === 'all' ? true : r.status === tab))
    .filter((r) => (trade ? r.category === trade : true))
    .filter((r) => (hostel ? r.hostel === hostel : true))
    .filter((r) => {
      if (!q) return true
      const s = `${code(r.id)} ${r.student_name} ${r.room} ${r.issue}`.toLowerCase()
      return s.includes(q.toLowerCase())
    })
    .sort((a, b) => (tab === 'closed' || tab === 'all' ? b.created_at.localeCompare(a.created_at) : a.queued_at.localeCompare(b.queued_at)))

  return (
    <Shell admin>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-brand-700">Student Affairs Office</div>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight">Repair queue</h1>
        </div>
        {oldest && (
          <div className="rounded-xl bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
            Oldest unassigned: <b className="text-ink">{code(oldest.id)}</b>, waiting {timeAgo(oldest.queued_at).replace(' ago', '')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Unassigned" value={count('submitted')} accent />
        <Kpi label="Assigned (open)" value={count('assigned')} />
        <Kpi label="Awaiting student" value={count('work_done')} />
        <Kpi label="Avg. resolution (7d)" value={week.length ? `${avgHrs.toFixed(1)}h` : '–'} />
        <Kpi label="Avg. rating" value={avgRating ? `${avgRating.toFixed(1)}★` : '–'} />
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <div className="flex flex-wrap gap-1">
            {TABS.map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === k ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200' : 'text-slate-600 hover:bg-slate-100'}`}>
                {l}{k !== 'all' && <span className="ml-1.5 text-xs opacity-60">{count(k)}</span>}
              </button>
            ))}
          </div>
          <div className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
            <select className="input !w-auto !py-1.5" value={trade} onChange={(e) => setTrade(e.target.value)}>
              <option value="">All trades</option>
              {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
            </select>
            <select className="input !w-auto !py-1.5" value={hostel} onChange={(e) => setHostel(e.target.value)}>
              <option value="">All hostels</option>
              {HOSTELS.map((h) => <option key={h}>{h}</option>)}
            </select>
            <input className="input !w-40 !py-1.5" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Nothing here. 🎉</div>
        ) : (
          <>
            {/* desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Request</th>
                  <th className="px-4 py-2.5">Room</th>
                  <th className="px-4 py-2.5">Student free</th>
                  <th className="px-4 py-2.5">Worker</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Waiting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-slate-50" onClick={() => nav(`/admin/r/${r.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CategoryPill category={r.category} />
                        <span className="font-semibold">{r.issue}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        {code(r.id)} · {r.student_name}
                        {repeats.has(repeatKey(r)) && <Flag>Repeat</Flag>}
                        {r.reopen_count > 0 && <Flag tone="red">Reopened ×{r.reopen_count}</Flag>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.hostel}<div className="text-xs text-slate-500">Room {r.room}</div></td>
                    <td className="px-4 py-3 text-xs">
                      {r.availability[0] ? windowLabel(r.availability[0]) : '—'}
                      {r.availability.length > 1 && <span className="text-slate-500"> +{r.availability.length - 1}</span>}
                      {r.absent_ok && <div className="text-emerald-700">Absence OK</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{r.worker ? <><div className="font-semibold">{r.worker.name}</div><div className="text-slate-500">{r.scheduled_slot}</div></> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} admin /></td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">{timeAgo(r.queued_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((r) => (
                <Link key={r.id} to={`/admin/r/${r.id}`} className="block p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{CATEGORIES[r.category].icon} {r.issue}</div>
                      <div className="text-xs text-slate-500">{code(r.id)} · {r.hostel} {r.room} · {timeAgo(r.queued_at)}</div>
                    </div>
                    <StatusBadge status={r.status} admin />
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    {repeats.has(repeatKey(r)) && <Flag>Repeat</Flag>}
                    {r.reopen_count > 0 && <Flag tone="red">Reopened</Flag>}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        <b>Repeat</b> = same room and trade raised more than once in 30 days. Usually means a deeper fault, such as wiring or pipes, that needs inspection instead of another quick fix.
      </p>
    </Shell>
  )
}

function Kpi({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? 'border border-brand-200 bg-brand-50 text-brand-900' : 'card'}`}>
      <div className={`text-xs font-semibold ${accent ? 'text-brand-700' : 'text-slate-500'}`}>{label}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>
    </div>
  )
}

export function Flag({ children, tone = 'amber' }) {
  const t = tone === 'red' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-800 ring-amber-200'
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${t}`}>{children}</span>
}
