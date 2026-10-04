# Deploying Vishwakarma (step by step, no coding needed)

Total time: **about 25 minutes.** You need three free accounts: **GitHub**, **Supabase** and **Vercel**.

> **Short on time?** Skip Part A and deploy straight to Vercel (Parts B and C, without adding environment variables). The site will run in **demo mode** with sample data. It's fully clickable, but data stays in each visitor's browser. You can add the database later and redeploy.

---

## Part A: Database and login (Supabase), about 10 min

1. Go to **https://supabase.com** → *Start your project* → sign in with GitHub.
2. Click **New project**:
   - Name: `vishwakarma`
   - Database password: generate one and **save it somewhere**
   - Region: **South Asia (Mumbai)**
   - Click **Create new project** and wait about 2 minutes.
3. In the left sidebar click **SQL Editor** → **New query**.
4. Open the file `supabase/schema.sql` from this folder, **copy everything**, paste it into the editor and click **Run**.
   You should see *"Success. No rows returned"*.
5. Left sidebar → **Authentication** → **Sign In / Providers** → **Email**:
   - Keep *Email* enabled.
   - **Turn OFF "Confirm email"**, then **Save**. (The free tier only sends a few emails per hour, which would block demo sign-ups. Turn it back on for a real launch.)
6. Left sidebar → **Project Settings** → **API** (or the **Connect** button at the top). Copy these two values:
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **anon public** key (a long string starting with `eyJ…`, or `sb_publishable_…`)

## Part B: Put the code on GitHub, about 5 min

1. Go to **https://github.com/new** → Repository name `vishwakarma` → **Public** → **Create repository**.
2. On the next page click **"uploading an existing file"**.
3. Unzip the project on your computer. Open the `vishwakarma` folder, **select everything inside it** (including the `src`, `public` and `supabase` folders) and drag it into the GitHub upload box.
   - Don't upload `node_modules` or `dist` if you have them. They aren't included in the zip anyway.
   - On a Mac, hidden files like `.env.example` and `.gitignore` aren't required. Skip them if they don't show up.
4. Click **Commit changes**.

## Part C: Host it (Vercel), about 5 min

1. Go to **https://vercel.com** → sign up with GitHub.
2. **Add New… → Project** → find `vishwakarma` → **Import**.
3. Vercel detects **Vite** automatically. Leave the build settings as they are.
4. Open **Environment Variables** and add two:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Project URL from A6 |
   | `VITE_SUPABASE_ANON_KEY` | your anon public key from A6 |
5. Click **Deploy**. After about 1 minute you get a link like `https://vishwakarma-xyz.vercel.app`. **This is your live app.**

> If you added the variables after deploying: Vercel → your project → **Deployments** → ⋯ on the latest → **Redeploy**.

## Part D: Create the demo accounts, about 5 min

1. Open your live link → **Create an account** → name `Demo Student`, email `demo.student@iiml.ac.in`, any password (6+ characters) → complete the profile (Hostel 5, Room 214, any 10-digit phone).
2. Sign out → **Create an account** again → name `SAO Desk`, email `sao.desk@iiml.ac.in`.
3. Back in **Supabase → SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin' where email = 'sao.desk@iiml.ac.in';
   ```
4. Sign out and sign back in as `sao.desk@iiml.ac.in`. You'll now land on the **SAO dashboard**.
5. Test the full loop: raise a request as the student → assign it as SAO → mark done → confirm as the student.
6. Try signing up with a Gmail address. It should be **rejected**. That's your domain lock working, and it's worth showing in the interview.

## Updating names and lists
- Hostel names, issue lists and time slots are in `src/config.js`. Edit the file on GitHub (pencil icon) → **Commit**, and Vercel redeploys automatically.
- Workers can be added from the app (SAO → Workers).

## Troubleshooting
| Problem | Fix |
|---|---|
| Site shows the orange "Demo mode" bar | Environment variables are missing or misspelled. Check the exact names, then Redeploy |
| "Only @iiml.ac.in email addresses can sign up" | Working as intended. Use an iiml.ac.in address |
| Sign-up says "check your inbox" | "Confirm email" is still on (A5) |
| "Could not find the function…" | The SQL in A4 didn't run fully. Run `schema.sql` again (it's safe to re-run) |
| Admin account still sees the student screen | Run the `update … role = 'admin'` SQL, then sign out and back in |
