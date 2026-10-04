// ---------------------------------------------------------------------------
// App-wide configuration. Edit these lists to match campus reality.
// ---------------------------------------------------------------------------

export const APP_NAME = 'Vishwakarma'
export const ALLOWED_DOMAIN = 'iiml.ac.in'

// Hostel blocks shown in the profile dropdown. Replace with actual IIML hostel names.
export const HOSTELS = [
  'Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5', 'Hostel 6',
  'Hostel 7', 'Hostel 8', 'Hostel 9', 'Hostel 10', 'Hostel 11', 'Hostel 12',
  'Married Hostel (MDP)',
]

// Trades and the common one-tap issues under each.
export const CATEGORIES = {
  electrical: {
    label: 'Electrical',
    worker: 'Electrician',
    icon: '⚡',
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
    issues: ['Fan not working', 'Fan regulator broken', 'Tube light / bulb not working', 'Switch or socket broken', 'No power in room', 'Geyser not heating'],
  },
  carpentry: {
    label: 'Carpentry',
    worker: 'Carpenter',
    icon: '🪚',
    tone: 'bg-orange-50 text-orange-800 border-orange-200',
    issues: ['Chair broken', 'Table / study desk broken', 'Bed / cot issue', 'Door or lock problem', 'Wardrobe / drawer issue', 'Window not closing'],
  },
  plumbing: {
    label: 'Plumbing',
    worker: 'Plumber',
    icon: '🚰',
    tone: 'bg-sky-50 text-sky-800 border-sky-200',
    issues: ['Tap leaking', 'Flush not working', 'Drain / basin blocked', 'No water supply', 'Shower broken', 'Pipe leakage / seepage'],
  },
}

// Availability slots (24h, 2-hour blocks) — covers class gaps and evenings.
export const SLOTS = [
  { id: '08-10', label: '8–10 AM' },
  { id: '10-12', label: '10 AM–12 PM' },
  { id: '12-14', label: '12–2 PM' },
  { id: '14-16', label: '2–4 PM' },
  { id: '16-18', label: '4–6 PM' },
  { id: '18-20', label: '6–8 PM' },
]

export const STATUS = {
  submitted: { label: 'In queue', tone: 'bg-slate-100 text-slate-700 ring-slate-300', dot: 'bg-slate-400' },
  assigned: { label: 'Worker assigned', tone: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  work_done: { label: 'Awaiting your confirmation', tone: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  closed: { label: 'Resolved', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', tone: 'bg-slate-100 text-slate-500 ring-slate-200', dot: 'bg-slate-300' },
}

// Admin sees a slightly different wording for work_done
export const ADMIN_STATUS_LABEL = {
  submitted: 'Unassigned',
  assigned: 'Assigned',
  work_done: 'Awaiting student',
  closed: 'Closed',
  cancelled: 'Cancelled',
}
