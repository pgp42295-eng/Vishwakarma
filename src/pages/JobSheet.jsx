import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { CATEGORIES } from '../config'
import { Shell, Spinner } from '../components/ui'
import { code } from '../lib/util'

// Printable daily sheet per worker — for workers without smartphones.
export default function JobSheet() {
  const [workers, setWorkers] = useState(null)
  const [rows, setRows] = useState([])
  const [wid, setWid] = useState('all')

  useEffect(() => {
    Promise.all([api.listWorkers(), api.listAllComplaints()]).then(([w, r]) => { setWorkers(w); setRows(r) }).catch(() => {})
  }, [])
  if (!workers) return <Shell admin><Spinner /></Shell>

  const list = workers.filter((w) => wid === 'all' || String(w.id) === wid)
    .map((w) => ({ w, jobs: rows.filter((r) => r.worker_id === w.id && r.status === 'assigned') }))
    .filter((x) => x.jobs.length)

  return (
    <Shell admin>
      <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-brand-700">Student Affairs Office</div>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight">Job sheets</h1>
          <p className="text-sm text-slate-500">Print and hand over at the start of the day. Workers return them signed. Students also confirm in the app.</p>
        </div>
        <div className="flex gap-2">
          <select className="input !w-auto" value={wid} onChange={(e) => setWid(e.target.value)}>
            <option value="all">All workers</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button className="btn-primary" onClick={() => window.print()}>Print</button>
        </div>
      </div>
      {list.length === 0 && <div className="card p-8 text-center text-sm text-slate-500">No open assigned jobs.</div>}
      <div className="space-y-6">
        {list.map(({ w, jobs }) => (
          <div key={w.id} className="card break-after-page p-6">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-lg font-extrabold">{w.name}</div>
                <div className="text-xs text-slate-500">{CATEGORIES[w.trade].worker} · {w.phone}</div>
              </div>
              <div className="text-xs text-slate-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr><th className="py-2">Job</th><th>Room</th><th>Issue</th><th>When</th><th className="w-32">Student sign</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((j) => (
                  <tr key={j.id} className="align-top">
                    <td className="py-3 font-semibold">{code(j.id)}</td>
                    <td className="py-3">{j.hostel}<br /><b>{j.room}</b></td>
                    <td className="py-3">{j.issue}<div className="text-xs text-slate-500">{j.description}</div><div className="text-xs">{j.student_name} · {j.phone}</div></td>
                    <td className="py-3 text-xs">{j.scheduled_slot}{j.absent_ok && <div className="text-emerald-700">Absence OK</div>}</td>
                    <td className="py-3"><div className="mt-6 border-b border-slate-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Shell>
  )
}
