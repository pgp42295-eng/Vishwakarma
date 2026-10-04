import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CATEGORIES, STATUS, ADMIN_STATUS_LABEL } from '../config'
import { useAuth } from '../auth'
import { api, isDemo } from '../lib/api'
import { fmtDateTime } from '../lib/util'

const WRENCH = 'M40.5 14.5a10 10 0 0 0-12.3 12.6L14.6 40.7a4.2 4.2 0 1 0 6 6l13.6-13.6a10 10 0 0 0 12.6-12.3l-6 6-5.6-1.4-1.4-5.6z'

export function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl'
  return (
    <div className="flex items-center gap-3">
      <div className={`${box} grid place-items-center bg-brand-50 ring-1 ring-brand-200`}>
        <svg viewBox="0 0 64 64" className="h-3/5 w-3/5"><path d={WRENCH} fill="#2f766c" /></svg>
      </div>
      <div className="leading-tight">
        <div className={`font-extrabold tracking-tight text-ink ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>Vishwakarma</div>
        <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-brand-700">Hostel Repairs · IIM Lucknow</div>
      </div>
    </div>
  )
}

export function DemoBanner() {
  if (!isDemo) return null
  return (
    <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
      Demo mode: sample data is stored in your browser only.{' '}
      <button className="font-semibold underline underline-offset-2" onClick={async () => { await api.resetDemo(); window.location.reload() }}>Reset demo data</button>
    </div>
  )
}

// Thin institutional strip shown on every page
export function TopStrip() {
  return (
    <div className="no-print border-b border-brand-100 bg-brand-50/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-xs text-brand-800">
        <span className="font-semibold">Indian Institute of Management Lucknow · Hostel Maintenance Portal</span>
        <span className="hidden md:inline">Emergency (sparking, flooding)? Call the SAO landline from your hostel.</span>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="no-print mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 text-sm text-slate-500 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-xs leading-relaxed">Raise, schedule and close hostel repair requests at IIM Lucknow. No phone calls, no paper receipts.</p>
        </div>
        <div className="text-xs leading-relaxed">
          <div className="mb-2 font-semibold uppercase tracking-wide text-slate-700">Trades covered</div>
          Electrical · Carpentry · Plumbing<br />Requests handled by the Student Affairs Office
        </div>
        <div className="text-xs leading-relaxed md:text-right">
          <div className="mb-2 font-semibold uppercase tracking-wide text-slate-700">About</div>
          Student project for IIM Lucknow, built for Team SynapsE Overtures 2026.<br />Not an official IIM Lucknow website.
        </div>
      </div>
    </footer>
  )
}

export function Shell({ children, admin = false }) {
  const { profile } = useAuth()
  const nav = useNavigate()
  const link = ({ isActive }) =>
    `relative px-1 py-5 text-sm font-semibold transition ${isActive ? 'text-brand-700 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand-600' : 'text-slate-500 hover:text-ink'}`
  const links = admin
    ? [['/admin', 'Repair queue', true], ['/admin/workers', 'Workers'], ['/admin/sheet', 'Job sheets']]
    : [['/', 'Dashboard', true], ['/new', 'Raise a request'], ['/profile', 'My profile']]
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <TopStrip />
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-10">
            <Link to={admin ? '/admin' : '/'} className="py-3"><Logo /></Link>
            <nav className="hidden items-center gap-7 md:flex">
              {links.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={link}>{label}</NavLink>)}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-xs leading-tight sm:block">
              <div className="font-semibold text-slate-800">{profile?.full_name}</div>
              <div className="text-slate-500">{admin ? 'Student Affairs Office' : `${profile?.hostel} · Room ${profile?.room}`}</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
              {(profile?.full_name || '?').split(' ').map((x) => x[0]).slice(0, 2).join('')}
            </div>
            <button className="btn-ghost !px-3 !py-1.5" onClick={async () => { await api.signOut(); nav('/login') }}>Sign out</button>
          </div>
        </div>
        <nav className="flex items-center gap-6 border-t border-slate-100 px-6 md:hidden">
          {links.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={link}>{label}</NavLink>)}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-10 pt-8">{children}</main>
      <Footer />
    </div>
  )
}

export function PageHeader({ eyebrow, title, children, actions }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="text-sm font-semibold text-brand-700">{eyebrow}</div>}
        <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
        {children && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{children}</p>}
      </div>
      {actions}
    </div>
  )
}

export function StatusBadge({ status, admin = false }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {admin ? ADMIN_STATUS_LABEL[status] : s.label}
    </span>
  )
}

export function CategoryPill({ category }) {
  const c = CATEGORIES[category]
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${c.tone}`}>
      <span>{c.icon}</span>{c.label}
    </span>
  )
}

export function Timeline({ events }) {
  return (
    <ol className="relative ml-2 border-l-2 border-slate-200">
      {events.map((e, i) => (
        <li key={e.id} className="relative pb-5 pl-5 last:pb-0">
          <span className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${i === events.length - 1 ? STATUS[e.status]?.dot || 'bg-slate-400' : 'bg-slate-300'}`} />
          <div className="text-sm font-semibold text-slate-800">{e.note}</div>
          <div className="text-xs text-slate-500">
            {fmtDateTime(e.created_at)} · {e.actor_name} {e.actor_role === 'admin' ? '(SAO)' : ''}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Stars({ value, onChange, size = 'text-2xl' }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n} star`} disabled={!onChange} onClick={() => onChange?.(n)}
          className={`${size} leading-none transition ${n <= value ? 'text-amber-400' : 'text-slate-300'} ${onChange ? 'hover:scale-110' : ''}`}>
          ★
        </button>
      ))}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      {label}
    </div>
  )
}

export function Empty({ title, children }) {
  return (
    <div className="card px-6 py-10 text-center">
      <div className="text-base font-bold text-slate-800">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{children}</div>
    </div>
  )
}
