import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, isDemo } from '../lib/api'
import { useToast } from '../auth'
import { Logo, DemoBanner, TopStrip, Footer } from '../components/ui'
import { ALLOWED_DOMAIN, CATEGORIES } from '../config'

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <DemoBanner />
      <TopStrip />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#how" className="hover:text-brand-700">How it works</a>
            <a href="#who" className="hover:text-brand-700">Who it&apos;s for</a>
            <a href="#signin" className="btn-soft !py-2">Sign in</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> For IIM Lucknow hostel residents
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-ink lg:text-6xl">
              Hostel repairs,<br />without the <span className="text-brand-600">phone calls.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Fan stopped? Chair broke? Tap leaking? Raise a request in one click, tell us when you&apos;re free between classes,
              and track it until you confirm it&apos;s fixed.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {Object.values(CATEGORIES).map((c) => (
                <span key={c.label} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold ${c.tone}`}>{c.icon} {c.label}</span>
              ))}
            </div>
          </div>
          <div id="signin"><SignInCard /></div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="text-sm font-semibold text-brand-700">How it works</div>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight">Four steps, one portal</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {[
            ['Raise', 'Pick the trade and tap the issue. Your hostel, room and phone are already on your profile.'],
            ['Schedule', 'Choose 2-hour slots that work around your classes, or allow the work while you are away.'],
            ['Track', 'See your place in the queue, then the worker’s name and visit time once SAO assigns it.'],
            ['Confirm', 'Sign off in one click and rate the job. That replaces the paper receipt.'],
          ].map(([t, d], i) => (
            <div key={t} className="card p-6">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-sm font-extrabold text-brand-700 ring-1 ring-brand-200">0{i + 1}</div>
              <div className="mt-4 text-lg font-bold">{t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Before / after */}
      <section className="border-y border-slate-200 bg-[#f7faf9]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Today</div>
            <ul className="mt-4 space-y-3 text-slate-500">
              {['Ask security or scroll WhatsApp for the number', 'Call the SAO landline and spell out your room', 'Worker turns up while you are in class', 'Sign a paper receipt that nobody can find later'].map((x) => (
                <li key={x} className="flex gap-3"><span className="text-red-400">✕</span>{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-7">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-700">With Vishwakarma</div>
            <ul className="mt-4 space-y-3 font-medium text-brand-900">
              {['One click: trade, issue, done', 'Profile already knows your hostel and room', 'Visit scheduled inside your free slots', 'Digital sign-off with a time-stamped audit trail'].map((x) => (
                <li key={x} className="flex gap-3"><span className="text-brand-600">✓</span>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Who */}
      <section id="who" className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="text-sm font-semibold text-brand-700">Who it&apos;s for</div>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight">Built for all three sides of a repair</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ['Students', 'Raise in seconds, schedule around classes, see your queue position, confirm or reopen.'],
            ['Student Affairs Office', 'One first-come-first-served queue instead of calls and walk-ins. Assign in two clicks and spot repeat faults.'],
            ['Campus workers', 'No app to learn. Job sheets arrive on WhatsApp or as a daily printout, with time-stamped proof of every job.'],
          ].map(([t, d]) => (
            <div key={t} className="card p-6">
              <div className="text-lg font-bold">{t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  )
}

function SignInCard() {
  const nav = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      if (mode === 'signin') {
        await api.signIn(form.email, form.password)
        nav('/')
      } else {
        const r = await api.signUp(form.email, form.password, form.full_name)
        if (r.needsConfirmation) setMsg('Check your IIML inbox for a confirmation link, then sign in.')
        else nav('/')
      }
    } catch (err) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }
  async function demo(role) {
    await api.demoLogin(role)
    nav(role === 'admin' ? '/admin' : '/')
  }

  if (isDemo) {
    return (
      <div className="card mx-auto w-full max-w-md p-8 shadow-lift">
        <h2 className="text-xl font-extrabold">Explore the demo</h2>
        <p className="mt-1 text-sm text-slate-500">No account needed. Sample requests are already loaded.</p>
        <div className="mt-6 space-y-3">
          <button className="btn-primary w-full !py-3.5 text-base" onClick={() => demo('student')}>Continue as a student</button>
          <button className="btn-soft w-full !py-3.5 text-base" onClick={() => demo('admin')}>Continue as SAO admin</button>
        </div>
        <p className="mt-6 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          In the live version, only <b>@{ALLOWED_DOMAIN}</b> accounts can sign in. SAO staff are marked as admins in the database.
        </p>
      </div>
    )
  }
  return (
    <form onSubmit={submit} className="card mx-auto w-full max-w-md p-8 shadow-lift">
      <h2 className="text-xl font-extrabold">{mode === 'signin' ? 'Sign in' : 'Create your account'}</h2>
      <p className="mt-1 text-sm text-slate-500">Only @{ALLOWED_DOMAIN} email addresses are allowed.</p>
      <div className="mt-6 space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.full_name} onChange={set('full_name')} placeholder="Athul Krishna" />
          </div>
        )}
        <div>
          <label className="label">IIML email</label>
          <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder={`you@${ALLOWED_DOMAIN}`} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
        </div>
      </div>
      {msg && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</p>}
      <button className="btn-primary mt-6 w-full !py-3" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      <p className="mt-4 text-center text-sm text-slate-500">
        {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
        <button type="button" className="font-semibold text-brand-700 underline underline-offset-2" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
    </form>
  )
}
