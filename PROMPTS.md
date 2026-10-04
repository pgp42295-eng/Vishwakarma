# Prompt log

**Tool used:** Claude (Cowork mode, by Anthropic). One continuous conversation.
**What the AI did:** wrote the React code, the Supabase SQL schema and security rules, this documentation, and designed the Instagram launch posters. It also tested the app automatically (browser screenshots, plus database security tests on a local Postgres).
**What I did:** chose the problem from my own hostel experience, described the current process, made the product decisions listed below, reviewed every screen, deployed the app, and _[fill in: user conversations / testing with batchmates]_.

Prompts are copied as I typed or dictated them, with only light cleanup of voice-dictation filler words.

---

### Prompt 1: Context
> *(Attached: Overtures 2026 Applicant Guide PDF and Round 2 Description PDF)*
> Two files are attached — one for round 1 and the other for round 2. I have qualified round 1 and I need to prepare a submission for round 2.

**AI response:** Summarised the Round 2 requirements and scoring. Proposed a plan: account setup, a prompt log, criteria for picking an idea, deliverables and a timeline.

### Prompt 2: Choosing the tool
> I'm still thinking about it, I will give the idea in some time, by then I need you to give me directions on other steps. How should we proceed?

> Do I need to use Claude Code? Or Cowork will do?

**AI response:** Confirmed that any AI tool is allowed if disclosed. Cowork can generate the full app and docs. I handle accounts and deployment.

### Prompt 3: The idea (my own)
> In the hostels, there are a lot of carpenter works required, or electrical works, or plumbing work. For example, in my room, if the fan is not working or if my chair is broken or my table is broken, I need to get these services. These services are available on campus. The carpenter is there, electrician is there, plumber is there. The issue is that right now we have the numbers and we need to call them. What we usually do is go to security to get their number if we don't already have it. In the hostel groups they might have shared it. So we call them. Or in each hostel there is a landline that directly connects to the Student Affairs Office. There we need to say our hostel number, room and issue, and they'll assign someone who will come and do the work. Or we need to go directly to the Student Affairs Office and register the complaint, and they'll allocate the required person.
>
> My idea is to suggest a portal where we can do that in a single click: what the issue is, what service we need, and they already have our profile.
>
> Another issue is that we have classes regularly, and sometimes the electrician might come when we are in class or not available or busy with something else. So add a provision like "I'll be available from this time to this time".
>
> Then we can add a queuing system where whoever registers the complaint first gets resolved first.
>
> Also, the workers have a receipt kind of thing where we sign once the work is done. They also need proof. So the portal will help them track everything too.
>
> You can shoot any questions if you have, or if you need more clarity, or else we can start working.

### Prompt 4: My answers to the AI's clarifying questions
| Question | My decision |
|---|---|
| Who assigns the worker to a complaint? | **SAO admin assigns.** Mirrors today's process, so SAO keeps control |
| How should workers use it, given they may not have IIML emails or be comfortable with apps? | **No worker login.** SAO shares the job sheet (WhatsApp or print) and updates the status |
| How should the student sign off that work is done? | **Student taps "Confirm work done"** (plus a rating) |
| Deadline? | **Less than 12 hours** |

**AI response:** Built the MVP: a React + Supabase app with a demo mode, the student and SAO screens, the database schema with server-side security, deployment guide, documentation and posters.

---

### Prompt 5: Design changes (my own)
> There are two major changes. One is that I do not need this as a mobile application. I need this as a website, so change it accordingly. And with the color scheme, go for a white and some other light color contrast. Lighter shades, like some white and not too bright some color. These are the two major changes.

> Also try to include IIML somewhere in the web page, in the home, in any of the screens.

**AI response:** Rebuilt the layouts as a desktop website: a landing page (hero, how it works, before vs after, who it's for), top navigation, a student dashboard with summary cards and sidebar, a two-column raise-request form with a weekly availability grid and summary panel, and two-column detail pages. Switched to a white and muted-teal theme. Added IIM Lucknow branding as text (header tagline, institutional strip, footer) without copying the official logo, plus a "Not an official IIM Lucknow website" note. Redid the posters and screenshots to match.

### Prompts after this point
> _[Add any further prompts you send, for example design tweaks, renames or fixes, in the same format.]_

---

## How the AI worked under the hood (for transparency)
After my prompts, Claude broke the work into steps. These were its own internal steps, not extra prompts from me:
1. Scaffold a Vite + React + Tailwind project.
2. Write a data layer with two interchangeable backends (Supabase live, and browser demo).
3. Write `supabase/schema.sql`: tables, row-level security, server functions and the domain-restricted sign-up trigger.
4. Build the screens: login, profile, student home, raise request, tracker, SAO queue, assign, workers, job sheets.
5. Test it: Playwright browser run-through of both roles with screenshots, plus SQL security tests on a local Postgres (a Gmail sign-up is blocked, a student can't assign or escalate their own role, students only see their own requests, the full lifecycle is logged).
6. Write README and DEPLOY guide. Design the posters as HTML and render them to PNG.
