import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../auth'
import { CATEGORIES } from '../config'
import { Shell, StatusBadge, Spinner, Stars, PageHeader, CategoryPill } from '../components/ui'
import { code, timeAgo, fmtDateTime } from '../lib/util'

const OPEN = ['submitted', 'assigned', 'work_done']

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function StudentHome() {
  const { profile } = useAuth()
  const [list, setList] = useState(null)
  const [pos, setPos] = useState({})

  useEffect(() => {
    api.listMyComplaints().then(async (rows) => {
      setList(rows)
      const p = {}
      for (const c of rows.filter((x) => x.status === 'submitted')) p[c.id] = await api.queuePosition(c.id)
      setPos(p)
    })
  }, [])

  if (!list) return <Shell><Spinner /></Shell>
  const open = list.filter((c) => OPEN.includes(c.status))
  const past = list.filter((c) => !OPEN.includes(c.status))
  const needsAction = open.filter((c) => c.status === 'work_done')

  return (
    <Shell>
      <PageHeader
        eyebrow={`${greeting()}, ${profile?.full_name?.split(' ')[0]}`}
        title="Your repair requests"
        actions={<Link to="/new" className="btn-primary !px-5 !py-3">+ Raise a request</Link>}
      >
        {profile?.hostel}, Room {profile?.room}. Everything you raise is tracked here until you confirm it&apos;s fixed.
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open requests" value={open.length} />
        <Stat label="Waiting for your confirmation" value={needsAction.length} highlight={needsAction.length > 0} />
        <Stat label="Resolved" value={list.filter((c) => c.status === 'closed').length} />
        <Stat label="Total raised" value={list.length} />
      </div>

      {needsAction.length > 0 && (
        <Link to={`/r/${needsAction[0].id}`} className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div>
            <div className="font-bold text-amber-900">Was your {needsAction[0].issue.toLowerCase()} fixed?</div>
            <div className="text-sm text-amber-800">{needsAction[0].worker?.name} reported the job done. Confirm to close it, or send it back to the queue.</div>
          </div>
          <span className="btn bg-white text-amber-900 ring-1 ring-amber-300">Review</span>
        </Link>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Active requests</h2>
            {open.length === 0 ? (
              <div className="card px-6 py-12 text-center">
                <div className="font-bold">Nothing pending</div>
                <div className="mt-1 text-sm text-slate-500">Pick a trade on the right to raise a request.</div>
              </div>
            ) : (
              <div className="card divide-y divide-slate-100">
                {open.map((c) => (
                  <Link key={c.id} to={`/r/${c.id}`} className="grid items-center gap-4 px-5 py-4 transition hover:bg-brand-50/40 md:grid-cols-[1.4fr_1.4fr_auto]">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-lg ring-1 ring-slate-200">{CATEGORIES[c.category].icon}</span>
                      <div>
                        <div className="font-bold">{c.issue}</div>
                        <div className="text-xs text-slate-500">{code(c.id)} · raised {timeAgo(c.created_at)}</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      {c.status === 'submitted' && (
                        <>
                          {pos[c.id] ? <><b className="text-ink">#{pos[c.id]}</b> in the {CATEGORIES[c.category].worker.toLowerCase()} queue</> : 'In queue'}
                          {c.reopen_count > 0 && <div className="text-xs font-semibold text-brand-700">Reopened, priority kept</div>}
                        </>
                      )}
                      {c.status === 'assigned' && <><b className="text-ink">{c.worker?.name}</b><div className="text-xs">Visiting {c.scheduled_slot}</div></>}
                      {c.status === 'work_done' && <>Reported done by <b className="text-ink">{c.worker?.name}</b></>}
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">History</h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr><th className="px-5 py-2.5">Request</th><th className="hidden px-5 py-2.5 sm:table-cell">Trade</th><th className="hidden px-5 py-2.5 md:table-cell">Closed</th><th className="px-5 py-2.5 text-right">Outcome</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {past.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3"><Link to={`/r/${c.id}`} className="font-semibold hover:text-brand-700">{c.issue}</Link><div className="text-xs text-slate-500">{code(c.id)}</div></td>
                        <td className="hidden px-5 py-3 sm:table-cell"><CategoryPill category={c.category} /></td>
                        <td className="hidden px-5 py-3 text-slate-500 md:table-cell">{fmtDateTime(c.closed_at || c.created_at)}</td>
                        <td className="px-5 py-3"><div className="flex justify-end">{c.rating ? <Stars value={c.rating} size="text-sm" /> : <StatusBadge status={c.status} />}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h3 className="font-bold">Raise a new request</h3>
            <p className="mt-0.5 text-xs text-slate-500">Takes about 10 seconds.</p>
            <div className="mt-4 space-y-2">
              {Object.entries(CATEGORIES).map(([k, c]) => (
                <Link key={k} to={`/new?c=${k}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-50/50">
                  <span className="flex items-center gap-3"><span className="text-xl">{c.icon}</span><span><span className="block text-sm font-bold">{c.label}</span><span className="block text-xs text-slate-500">{c.worker}</span></span></span>
                  <span className="text-slate-400">→</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Your details</h3>
              <Link to="/profile" className="text-xs font-semibold text-brand-700 hover:underline">Edit</Link>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Hostel</dt><dd className="font-semibold">{profile?.hostel}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Room</dt><dd className="font-semibold">{profile?.room}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd className="font-semibold">{profile?.phone}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
            <div className="font-bold">How the queue works</div>
            <p className="mt-1 leading-relaxed text-brand-800">Requests are served first come, first served within each trade. If a fix doesn&apos;t hold, tap <b>Not fixed</b> and your request returns to its original place in line.</p>
          </div>
        </aside>
      </div>
    </Shell>
  )
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? 'border-amber-200 bg-amber-50' : 'card'}`}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-extrabold tracking-tight text-ink">{value}</div>
    </div>
  )
}
