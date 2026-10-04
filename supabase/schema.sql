-- =============================================================================
-- Vishwakarma · Hostel repair requests for IIM Lucknow
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
--
-- Design principle: students and admins can READ through row-level security,
-- but every WRITE goes through a server-side function below that checks who is
-- calling and what state the request is in. Nobody can edit tables directly
-- from the browser, so a student can't mark their own ticket "assigned" or make
-- themselves an admin.
-- =============================================================================

-- ---------- Tables -----------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null unique,
  full_name   text,
  hostel      text,
  room        text,
  phone       text,
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now()
);

create table if not exists public.workers (
  id          bigint generated always as identity primary key,
  name        text not null,
  trade       text not null check (trade in ('electrical', 'carpentry', 'plumbing')),
  phone       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.complaints (
  id              bigint generated always as identity primary key,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  -- snapshot of where/who at the time of raising (profile may change later)
  student_name    text not null,
  hostel          text not null,
  room            text not null,
  phone           text,
  category        text not null check (category in ('electrical', 'carpentry', 'plumbing')),
  issue           text not null,
  description     text default '',
  availability    jsonb not null default '[]',      -- [{ "date": "2026-10-04", "slot": "16-18" }, ...]
  absent_ok       boolean not null default false,   -- OK to do work with caretaker key
  status          text not null default 'submitted'
                  check (status in ('submitted', 'assigned', 'work_done', 'closed', 'cancelled')),
  worker_id       bigint references public.workers(id),
  scheduled_slot  text,
  admin_note      text,
  rating          int check (rating between 1 and 5),
  feedback        text,
  reopen_count    int not null default 0,
  created_at      timestamptz not null default now(),
  queued_at       timestamptz not null default now(),  -- FIFO key; kept on reopen so reopened jobs go to the front
  assigned_at     timestamptz,
  work_done_at    timestamptz,
  closed_at       timestamptz
);

create index if not exists complaints_queue_idx   on public.complaints (status, category, queued_at);
create index if not exists complaints_student_idx on public.complaints (student_id, created_at desc);

-- Append-only audit trail: the digital replacement for the paper receipt.
create table if not exists public.complaint_events (
  id            bigint generated always as identity primary key,
  complaint_id  bigint not null references public.complaints(id) on delete cascade,
  status        text not null,
  note          text,
  actor_id      uuid,
  actor_name    text,
  actor_role    text,
  created_at    timestamptz not null default now()
);
create index if not exists events_complaint_idx on public.complaint_events (complaint_id, created_at);

-- ---------- Helpers ----------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.log_event(p_complaint bigint, p_status text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare me profiles;
begin
  select * into me from profiles where id = auth.uid();
  insert into complaint_events (complaint_id, status, note, actor_id, actor_name, actor_role)
  values (p_complaint, p_status, p_note, me.id, me.full_name, me.role);
end $$;
revoke all on function public.log_event(bigint, text, text) from public, anon, authenticated;

-- ---------- Sign-up gate: only @iiml.ac.in ------------------------------------

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(split_part(new.email, '@', 2)) <> 'iiml.ac.in' then
    raise exception 'Only @iiml.ac.in email addresses can sign up';
  end if;
  insert into profiles (id, email, full_name)
  values (new.id, lower(new.email),
          coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Row-level security (reads) ----------------------------------------

alter table public.profiles         enable row level security;
alter table public.workers          enable row level security;
alter table public.complaints       enable row level security;
alter table public.complaint_events enable row level security;

drop policy if exists "own profile or admin" on public.profiles;
create policy "own profile or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "workers readable" on public.workers;
create policy "workers readable" on public.workers
  for select to authenticated using (true);
drop policy if exists "admins manage workers" on public.workers;
create policy "admins manage workers" on public.workers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own complaints or admin" on public.complaints;
create policy "own complaints or admin" on public.complaints
  for select to authenticated using (student_id = auth.uid() or public.is_admin());

drop policy if exists "events of visible complaints" on public.complaint_events;
create policy "events of visible complaints" on public.complaint_events
  for select to authenticated using (
    exists (select 1 from public.complaints c
            where c.id = complaint_id and (c.student_id = auth.uid() or public.is_admin())));

-- ---------- Writes: server-side functions ------------------------------------

create or replace function public.save_profile(p_full_name text, p_hostel text, p_room text, p_phone text)
returns profiles language plpgsql security definer set search_path = public as $$
declare r profiles;
begin
  if p_phone !~ '^[0-9]{10}$' then raise exception 'Enter a 10-digit phone number'; end if;
  update profiles set full_name = trim(p_full_name), hostel = p_hostel, room = upper(trim(p_room)), phone = p_phone
  where id = auth.uid() returning * into r;
  return r;
end $$;

create or replace function public.create_complaint(
  p_category text, p_issue text, p_description text, p_availability jsonb, p_absent_ok boolean)
returns complaints language plpgsql security definer set search_path = public as $$
declare me profiles; r complaints; open_count int;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'Not signed in'; end if;
  if coalesce(me.hostel, '') = '' or coalesce(me.room, '') = '' then raise exception 'Complete your profile first'; end if;
  select count(*) into open_count from complaints
   where student_id = me.id and status in ('submitted', 'assigned', 'work_done');
  if open_count >= 5 then raise exception 'You already have 5 open requests'; end if;
  if jsonb_array_length(coalesce(p_availability, '[]')) = 0 and not p_absent_ok then
    raise exception 'Pick at least one time slot, or allow work in your absence';
  end if;

  insert into complaints (student_id, student_name, hostel, room, phone, category, issue, description, availability, absent_ok)
  values (me.id, me.full_name, me.hostel, me.room, me.phone, p_category, left(p_issue, 120),
          left(coalesce(p_description, ''), 500), coalesce(p_availability, '[]'), p_absent_ok)
  returning * into r;
  perform log_event(r.id, 'submitted', 'Request raised');
  return r;
end $$;

create or replace function public.queue_position(p_id bigint) returns int
language sql stable security definer set search_path = public as $$
  select case when c.status <> 'submitted' or (c.student_id <> auth.uid() and not is_admin()) then null
         else (select count(*)::int from complaints x
               where x.status = 'submitted' and x.category = c.category and x.queued_at <= c.queued_at) end
  from complaints c where c.id = p_id;
$$;

create or replace function public.cancel_complaint(p_id bigint) returns complaints
language plpgsql security definer set search_path = public as $$
declare r complaints;
begin
  update complaints set status = 'cancelled'
   where id = p_id and student_id = auth.uid() and status in ('submitted', 'assigned')
  returning * into r;
  if r.id is null then raise exception 'This action is no longer available'; end if;
  perform log_event(p_id, 'cancelled', 'Cancelled by student');
  return r;
end $$;

create or replace function public.confirm_complaint(p_id bigint, p_rating int, p_feedback text) returns complaints
language plpgsql security definer set search_path = public as $$
declare r complaints;
begin
  update complaints set status = 'closed', closed_at = now(), rating = p_rating, feedback = nullif(trim(p_feedback), '')
   where id = p_id and student_id = auth.uid() and status in ('assigned', 'work_done')
  returning * into r;
  if r.id is null then raise exception 'This action is no longer available'; end if;
  perform log_event(p_id, 'closed', format('Student confirmed · %s★%s', p_rating,
          case when coalesce(trim(p_feedback), '') = '' then '' else ' · "' || trim(p_feedback) || '"' end));
  return r;
end $$;

create or replace function public.reopen_complaint(p_id bigint, p_reason text) returns complaints
language plpgsql security definer set search_path = public as $$
declare r complaints;
begin
  -- queued_at is NOT reset: a reopened job returns to the front of its queue
  update complaints set status = 'submitted', reopen_count = reopen_count + 1,
         worker_id = null, scheduled_slot = null, work_done_at = null
   where id = p_id and student_id = auth.uid() and status in ('assigned', 'work_done')
  returning * into r;
  if r.id is null then raise exception 'This action is no longer available'; end if;
  perform log_event(p_id, 'submitted', 'Reopened: ' || coalesce(nullif(trim(p_reason), ''), 'Not fixed'));
  return r;
end $$;

create or replace function public.assign_complaint(p_id bigint, p_worker_id bigint, p_slot text, p_note text)
returns complaints language plpgsql security definer set search_path = public as $$
declare r complaints; w workers; prev text;
begin
  if not is_admin() then raise exception 'Only SAO admins can assign'; end if;
  select * into w from workers where id = p_worker_id and active;
  if w.id is null then raise exception 'Worker not found'; end if;
  -- lock the row so two admins clicking at once can't both assign it
  select status into prev from complaints where id = p_id for update;
  if prev is null or prev not in ('submitted', 'assigned') then
    raise exception 'This request was already handled by someone else. Refresh.';
  end if;
  update complaints set status = 'assigned', worker_id = w.id, scheduled_slot = p_slot,
         admin_note = nullif(trim(p_note), ''), assigned_at = now()
   where id = p_id returning * into r;
  perform log_event(p_id, 'assigned',
          format('%s to %s · %s', case when prev = 'assigned' then 'Reassigned' else 'Assigned' end, w.name, p_slot));
  return r;
end $$;

create or replace function public.mark_work_done(p_id bigint) returns complaints
language plpgsql security definer set search_path = public as $$
declare r complaints;
begin
  if not is_admin() then raise exception 'Only SAO admins can do this'; end if;
  update complaints set status = 'work_done', work_done_at = now()
   where id = p_id and status = 'assigned' returning * into r;
  if r.id is null then raise exception 'Only assigned jobs can be marked done'; end if;
  perform log_event(p_id, 'work_done', 'Worker reported job complete');
  return r;
end $$;

-- Only signed-in users may call the functions
revoke execute on function public.save_profile(text, text, text, text)                 from public, anon;
revoke execute on function public.create_complaint(text, text, text, jsonb, boolean)   from public, anon;
revoke execute on function public.queue_position(bigint)                               from public, anon;
revoke execute on function public.cancel_complaint(bigint)                             from public, anon;
revoke execute on function public.confirm_complaint(bigint, int, text)                 from public, anon;
revoke execute on function public.reopen_complaint(bigint, text)                       from public, anon;
revoke execute on function public.assign_complaint(bigint, bigint, text, text)         from public, anon;
revoke execute on function public.mark_work_done(bigint)                               from public, anon;
grant  execute on function public.save_profile(text, text, text, text)                 to authenticated;
grant  execute on function public.create_complaint(text, text, text, jsonb, boolean)   to authenticated;
grant  execute on function public.queue_position(bigint)                               to authenticated;
grant  execute on function public.cancel_complaint(bigint)                             to authenticated;
grant  execute on function public.confirm_complaint(bigint, int, text)                 to authenticated;
grant  execute on function public.reopen_complaint(bigint, text)                       to authenticated;
grant  execute on function public.assign_complaint(bigint, bigint, text, text)         to authenticated;
grant  execute on function public.mark_work_done(bigint)                               to authenticated;

-- ---------- Starter data -----------------------------------------------------

insert into public.workers (name, trade, phone)
select * from (values
  ('Ramesh Kumar', 'electrical', '9000000001'),
  ('Suresh Yadav', 'electrical', '9000000002'),
  ('Mohd. Irfan',  'carpentry',  '9000000003'),
  ('Rajesh Verma', 'carpentry',  '9000000004'),
  ('Anil Gupta',   'plumbing',   '9000000005')
) v(name, trade, phone)
where not exists (select 1 from public.workers);

-- ---------- Make yourself an admin (run AFTER signing up in the app) ----------
-- update public.profiles set role = 'admin' where email = 'sao.desk@iiml.ac.in';
