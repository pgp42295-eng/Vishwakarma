# Vishwakarma: Hostel Repairs, IIM Lucknow

> **Hostel repairs, without the phone calls.**
> A web portal for raising, scheduling and closing electrical, carpentry and plumbing requests in IIM Lucknow hostels.

| | |
|---|---|
| **Live website** | `https://vishwakarma-iiml.vercel.app` |
| **Demo (no login)** | Same link. If the backend isn't connected, the site opens in demo mode with sample data |
| **Demo accounts (live mode)** | Student: `demo.student@iiml.ac.in` · SAO admin: `saodesk@iiml.ac.in` (passwords shared in submission form) |
| **Built by** | Athul Krishna · Overtures 2026, Round 2 |
| **AI used** | Claude (Cowork mode, by Anthropic) for code, documentation and poster design. Full prompt log in [`PROMPTS.md`](PROMPTS.md) |

---

## 1. The problem

### Who faces it
- **Every hostel resident** (_[fill in: approx. number of hostel residents]_) whenever a fan, light, chair, table, door, tap or flush breaks.
- **The Student Affairs Office (SAO)**, which takes complaints by phone and in person and dispatches workers.
- **The campus workers** (carpenter, electrician, plumber), who keep paper receipts as proof of work.

### How often
Room-level breakdowns happen every week across campus, and they spike after power cuts, during monsoon (plumbing and seepage) and at the start of term when rooms change hands.
*Survey result: _[fill in: e.g. "7 of 10 batchmates I asked had raised at least one repair request this term; 3 said the worker came while they were in class at least once."]_*

### How it works today (as-is)
1. Student needs a carpenter, electrician or plumber.
2. Finds the number by **asking security**, **scrolling the hostel WhatsApp group**, or uses the **hostel landline that connects to SAO**.
3. Reads out hostel, room and issue over the phone, **every single time**. Or **walks to the SAO office** to register it.
4. SAO assigns someone. The student has **no visibility** into when they will come.
5. The worker often arrives **while the student is in class**. The visit is wasted and the job goes back to the start.
6. Once fixed, the student **signs a paper receipt** for the worker. That is the only record of the job.

### Pain points
| For students | For SAO | For workers |
|---|---|---|
| Hunting for numbers | Complaints come in from phone, walk-ins and WhatsApp | Wasted trips to empty rooms |
| Repeating details every time | No queue, so no fairness or priority | Paper receipts get lost |
| No status or ETA | Can't see backlog or worker load | No proof when a student disputes |
| Visits clash with classes | No data on recurring faults | |

### How I came up with it
I've had this problem in my own room. The fix is never the slow part. Finding the right person, explaining the problem and being in the room when they arrive are what take time. I broke the problem into four questions and each became a feature:
1. **Who do I contact?** → One portal, three trade buttons.
2. **Where am I?** → Profile saved once, attached automatically.
3. **When am I free?** → Availability slots that fit around classes.
4. **How do we prove it was done?** → A digital sign-off and an audit trail instead of paper.

---

## 2. The solution (MVP)

### User roles
| Role | Access | What they do |
|---|---|---|
| **Student** | `@iiml.ac.in` email login | Raise, track, confirm or reopen, cancel, rate |
| **SAO admin** | Same login, marked `admin` in the database | View queue, assign worker and slot, send job sheet, mark worker-reported done, manage workers |
| **Worker** | **No login (deliberate)** | Receives the job sheet on WhatsApp or as a printout |

### Screens
| # | Screen | Purpose |
|---|---|---|
| 1 | **Landing page + sign-in** | Hero, how it works, before vs after, who it's for, IIML-only sign-in |
| 2 | **One-time profile** | Hostel, room and phone, saved once |
| 3 | **Student dashboard** | Summary cards, active requests with **queue position (#3 in electrician queue)**, history table with ratings, quick-raise sidebar, your details |
| 4 | **Raise request** | Trade → one-click issue chips → optional details → **weekly availability grid (next 4 days × 2-hour slots)** → "OK to fix while I'm away", with a live summary panel |
| 5 | **Request tracker** | Progress bar, queue position or worker and visit time, **Confirm work done + rating** / **Not fixed (reopen)** / cancel, full activity log |
| 6 | **SAO queue dashboard** | KPIs (unassigned, open, awaiting student, avg resolution time, avg rating), FIFO queue, filters by status, trade and hostel, search, **Repeat** and **Reopened** flags |
| 7 | **SAO assign** | Pick worker (with current load), pick slot **from the student's availability**, add a note, then **one-click WhatsApp job sheet** to the worker |
| 8 | **Workers** | Roster per trade, open and done counts, avg time, avg rating, add worker, mark on leave |
| 9 | **Printable job sheets** | Daily sheet per worker with a signature column, for workers without smartphones |

Screenshots are in [`/screenshots`](screenshots/).

### Request lifecycle
```
 Student raises ──► [In queue] ──SAO assigns worker + slot──► [Assigned] ──worker calls SAO──► [Work done]
       ▲                │                                        │                              │
       │           cancel by student                  student can confirm early         student confirms + rates
       │                                                         │                              ▼
       └────────── "Not fixed" (keeps original queue position) ◄─┴──────────────────────────  [Resolved]
```

### Design decisions
- **A website, not a mobile app.** Nothing to install, it works on hostel laptops and the SAO desk PC, and it still works in a phone browser. Light white and muted-teal theme so it reads like a calm campus portal.
- **SAO stays in control of dispatch.** It mirrors how things already work, so SAO doesn't lose authority and is more likely to adopt it.
- **Workers don't need an app.** Many may not be comfortable with one. WhatsApp and printouts reach them where they already are.
- **The student's confirmation is the receipt.** It is time-stamped, tied to their IIML login and can't be faked by anyone else.
- **Fair queue, first come first served per trade.** A reopened job keeps its original place, so a bad fix doesn't push the student to the back.
- **Repeat flag.** The same room and trade twice in 30 days usually points to a deeper fault (wiring, pipes) that needs inspection, not another patch.

---

## 3. Technical documentation

### Tech stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | **React 19 + Vite**, **Tailwind CSS** | Fast to build, desktop-first website that still works on phones, small static bundle (~100 KB gzipped) |
| Routing | React Router (hash routes) | Works on any static host with no server config |
| Backend | **Supabase** (managed **PostgreSQL** + Auth) | Real relational DB, built-in login, row-level security, free tier is enough for one campus |
| Hosting | **Vercel** (static site, global CDN) | Free, deploys from GitHub on every push, HTTPS by default |
| Demo mode | Same interface backed by browser `localStorage` | Evaluators can explore without accounts, and there's a fallback if the backend is down |

### Main database tables
```
profiles            one row per user (created automatically at sign-up)
  id (= auth user id) · email · full_name · hostel · room · phone · role ('student' | 'admin')

workers             campus staff, no login
  id · name · trade ('electrical' | 'carpentry' | 'plumbing') · phone · active

complaints          one row per repair request
  id · student_id → profiles · student_name, hostel, room, phone  (snapshot at time of raising)
  category · issue · description
  availability (JSON list of {date, slot}) · absent_ok
  status ('submitted' → 'assigned' → 'work_done' → 'closed' | 'cancelled')
  worker_id → workers · scheduled_slot · admin_note
  rating (1–5) · feedback · reopen_count
  created_at · queued_at (FIFO key) · assigned_at · work_done_at · closed_at

complaint_events    append-only audit log (the digital receipt)
  id · complaint_id → complaints · status · note · actor_id · actor_name · actor_role · created_at
```
Full SQL with constraints, indexes, policies and functions: [`supabase/schema.sql`](supabase/schema.sql).

### How login works
1. The student signs up with **email + password** through Supabase Auth.
2. A **database trigger rejects any email not ending in `@iiml.ac.in`**. This check runs on the server, so it can't be bypassed from the browser.
3. The same trigger creates their `profiles` row with role `student`.
4. SAO staff are promoted to `admin` with a one-line SQL update. There is no "make me admin" button anywhere in the app.
5. Supabase returns a signed session token (JWT). Every database request carries it, and Postgres knows who is asking (`auth.uid()`).
6. **Row-level security:** students can only read their own requests. Admins can read all of them.
7. **All writes go through server-side functions** (`create_complaint`, `assign_complaint`, `confirm_complaint`, …). Each one checks the caller's role and the request's current state. A student can't mark their own ticket "assigned", and nobody can edit the audit log.

**Production upgrade:** switch to **Google sign-in restricted to the IIML Google Workspace domain**. Students already have these accounts, there are no passwords to manage, and email ownership is verified by Google. The MVP uses email + password because it needs no Google Cloud setup. In the MVP, email confirmation can be turned on in Supabase to prove inbox ownership.

### Where it's hosted
- **Frontend:** Vercel. Static files on a CDN, auto-deployed from GitHub.
- **Database + Auth:** Supabase project in the **Mumbai (ap-south-1)** region, close to Lucknow and keeping data in India.
- **Secrets:** only the Supabase *public* (anon) key is in the frontend. That is safe by design because row-level security and the server functions enforce every rule. The service key is never shipped.

### What happens under heavy load
- **Scale reality:** about 1,000–2,000 users and maybe 50–200 requests on a bad day. The busiest moment is after a campus-wide power cut, when many fan or light complaints come in within minutes.
- **Frontend:** static files on a CDN. Vercel serves this from cache and it won't slow down.
- **Database:** each request is one small row. Postgres handles thousands of writes per second. Indexes on `(status, category, queued_at)` keep the queue fast.
- **Two admins assigning the same job at once:** the assign function **locks the row** first (`SELECT … FOR UPDATE`). The second admin gets "already handled by someone else", so there's no double dispatch.
- **Spam or abuse:** the server caps each student at **5 open requests**. Every action is logged with the user's identity.
- **Burst handling:** the "Repeat" flag and the trade/hostel filters let SAO spot a hostel-wide outage (for example 20 "No power" requests from one hostel) and handle it as one job.

### What if something fails
| Failure | Effect | Mitigation |
|---|---|---|
| Supabase down | Students can't raise requests in the app | SAO landline keeps working as fallback. Supabase has daily backups. Status banner (roadmap) |
| Vercel down | Site unreachable | Static build can be redeployed to Netlify in minutes |
| Worker doesn't show up | Request stays "Assigned" | Student taps **Not fixed**, the job returns to the front of the queue and the reopen count is visible to SAO |
| Worker says done but it isn't | Student disputes | Student must confirm. Reopens are logged against that worker's record |
| Student never confirms | Job stuck at "Awaiting student" | Roadmap: auto-close after 48 hours with a reminder |
| Data mistakes | Wrong assignment | Reassign at any time. Full audit trail shows who changed what |

---

## 4. Feasibility: timeline and cuts

### What I built in this round (under 12 hours)
- Full student flow, SAO flow, worker roster, printable sheets and WhatsApp hand-off.
- Real database schema with security rules, tested locally.
- Demo mode, deployment and documentation.

### What I deliberately cut, and why
| Cut | Why it's OK for now | When to add it |
|---|---|---|
| Photo upload of the issue | Text plus one-click issues covers most cases | v2 (Supabase Storage) |
| Worker app or login | Workers may not use apps. WhatsApp and paper work today | v3, only if workers ask |
| SMS / push notifications | Students check the tracker. WhatsApp reaches workers | v2 (WhatsApp Business API / email) |
| Google SSO | Needs IIML IT to approve OAuth | Pilot phase |
| Auto-close and reminders | Needs a scheduled job | v2 (Supabase cron) |
| Analytics export | KPIs on the dashboard are enough to start | v2 |

### Rollout plan
| Week | Milestone |
|---|---|
| 1 | Demo to SAO. Load real worker list and hostel names. Switch to Google SSO with IT |
| 2 | **Pilot in 2 hostels.** SAO desk uses the dashboard alongside the landline |
| 3–4 | Fix feedback, add notifications and photo upload. Measure time-to-resolve against the paper baseline |
| 5 | Campus-wide launch with Instagram campaign and QR posters at hostel entrances |

---

## 5. Why past attempts fail and how this gets adopted

**Why this hasn't been solved already**
- **WhatsApp groups and phone numbers are just good enough.** The pain is spread across many small moments, so nobody owns the problem.
- **Generic complaint forms (Google Forms and similar) die quietly.** They have no tracking, no feedback loop and nobody on the other side is accountable. Students go back to calling.
- **Tools that ignore the operator fail.** If SAO has to do more work, they stop using it. If workers are forced onto an app, they ignore it.

**How Vishwakarma avoids those traps**
1. **Less work for SAO, not more.** One screen replaces phone notes, and WhatsApp hand-off is one click.
2. **Nothing new for workers.** The same WhatsApp and paper they use today, just pre-filled.
3. **A visible loop for students.** Queue position, ETA and the ability to reopen, so they trust it more than a phone call.
4. **The landline isn't removed.** It runs in parallel during the pilot and can be phased out once the portal is used more.
5. **Launch:** Instagram post and story campaign, QR stickers on every hostel floor ("Fan broken? Scan me"), and announcements by hostel representatives and in batch groups.

**Success metrics:** % of requests raised in the app vs the landline · median time to resolve · % of first visits where the student was present · reopen rate · avg rating.

---

## 6. Running locally
```bash
npm install
npm run dev            # opens in demo mode
# for live mode: copy .env.example → .env and fill in the Supabase URL + anon key
```
Deployment steps: [`DEPLOY.md`](DEPLOY.md).

## 7. AI disclosure
This MVP was built with **Claude (Cowork mode, by Anthropic)**. Claude generated the code, database schema, documentation and launch posters from my prompts. I chose the problem, described the current process from my own experience, made the product decisions (SAO-led dispatch, no worker login, student sign-off instead of OTP, availability slots, the 12-hour scope) and reviewed and tested the output. Every prompt is logged in [`PROMPTS.md`](PROMPTS.md).
