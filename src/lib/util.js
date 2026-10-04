import { SLOTS } from '../config'

export const code = (id) => 'VK-' + String(id).padStart(4, '0')

export const isoDate = (d) => {
  const x = new Date(d)
  const off = x.getTimezoneOffset()
  return new Date(x.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function nextDays(n = 4) {
  const out = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    out.push({
      date: isoDate(d),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      sub: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    })
  }
  return out
}

export const slotLabel = (id) => SLOTS.find((s) => s.id === id)?.label || id

export function windowLabel(w) {
  const d = new Date(w.date + 'T00:00:00')
  const day = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${day}, ${slotLabel(w.slot)}`
}

export function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export const fmtDateTime = (ts) =>
  ts ? new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''

export const hoursBetween = (a, b) => (new Date(b) - new Date(a)) / 3600000

// Same room + same trade raised more than once in 30 days → likely a deeper fault
export function repeatKeys(complaints) {
  const cutoff = Date.now() - 30 * 86400000
  const counts = {}
  for (const c of complaints) {
    if (new Date(c.created_at).getTime() < cutoff) continue
    const k = `${c.hostel}|${c.room}|${c.category}`
    counts[k] = (counts[k] || 0) + 1
  }
  return new Set(Object.keys(counts).filter((k) => counts[k] > 1))
}
export const repeatKey = (c) => `${c.hostel}|${c.room}|${c.category}`

export function whatsappLink(phone, text) {
  const digits = (phone || '').replace(/\D/g, '')
  const intl = digits.length === 10 ? '91' + digits : digits
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`
}

export function jobSheetText(c, worker) {
  return [
    `*Vishwakarma job ${code(c.id)}*`,
    `${c.issue}${c.description ? ' — ' + c.description : ''}`,
    `📍 ${c.hostel}, Room ${c.room}`,
    `🕒 Visit: ${c.scheduled_slot || 'Please call student'}`,
    `👤 ${c.student_name} · ${c.phone}`,
    c.absent_ok ? '✅ Student OK with work in their absence (caretaker key)' : '⚠️ Student must be present',
    c.admin_note ? `📝 ${c.admin_note}` : null,
    '',
    `Assigned to ${worker?.name || ''}. Call SAO after completion.`,
  ]
    .filter((x) => x !== null)
    .join('\n')
}
