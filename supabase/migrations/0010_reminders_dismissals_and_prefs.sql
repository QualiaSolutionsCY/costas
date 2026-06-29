-- Migration 0010: M5 Reminders & Notifications backing store.
-- Reminders themselves are DERIVED from service_entries at read time (no rows to
-- precompute). This migration only persists (a) per-vehicle dismiss state for the
-- in-app indicator and (b) per-owner reminder preferences on profiles.
-- Demo-permissive RLS (using(true)/with check(true)) matches the existing demo_*
-- posture (0005) so the anonymous owner flow keeps working. Idempotent throughout:
-- ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS, guarded policy creates.

-- (a) Reminder preferences on profiles. Defaults: in-app on, email off (no email
-- provider wired in this demo), 30-day advance-notice window (matches NOTIF-01/02).
alter table public.profiles
  add column if not exists reminders_inapp_enabled boolean not null default true;
alter table public.profiles
  add column if not exists reminders_email_enabled boolean not null default false;
alter table public.profiles
  add column if not exists reminders_advance_days int not null default 30;

-- (b) Dismiss state for the in-app indicator. A reminder is identified by its
-- vehicle, kind ('mot' | 'service'), and the ISO due-date of the current cycle —
-- so a NEW cycle (a freshly computed due date) re-surfaces even after a prior
-- dismissal (NOTIF-06: "does not reappear until the next reminder cycle").
create table if not exists public.reminder_dismissals (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  reminder_kind text not null check (reminder_kind in ('mot', 'service')),
  due_on date not null,
  dismissed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (vehicle_id, reminder_kind, due_on)
);
create index if not exists reminder_dismissals_vehicle_idx
  on public.reminder_dismissals (vehicle_id, reminder_kind, due_on);

alter table public.reminder_dismissals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reminder_dismissals'
      and policyname = 'demo_reminder_dismissals_select'
  ) then
    create policy "demo_reminder_dismissals_select" on public.reminder_dismissals
      for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reminder_dismissals'
      and policyname = 'demo_reminder_dismissals_insert'
  ) then
    create policy "demo_reminder_dismissals_insert" on public.reminder_dismissals
      for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reminder_dismissals'
      and policyname = 'demo_reminder_dismissals_delete'
  ) then
    create policy "demo_reminder_dismissals_delete" on public.reminder_dismissals
      for delete using (true);
  end if;
end $$;
