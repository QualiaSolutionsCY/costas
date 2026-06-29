-- Migration 0009: bookings — owner books a service slot at a workshop; the
-- workshop sees incoming requests and confirms / marks done. Backs M4.P1
-- (BOOK-01..03, BOOK-05..07). Demo-permissive RLS to match the existing demo_*
-- posture (anonymous owner + anonymous workshop both use the app): owner_id and
-- vehicle_id are nullable, and select/insert/update are all `using(true)` /
-- `with check(true)`. Idempotent: guarded table + policy creation so re-running
-- on an environment that already has them is a no-op rather than an error.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles (id) on delete set null,
  plate text,
  workshop_name text,
  owner_id uuid,
  service_code text,
  requested_date date,
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'done', 'cancelled')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_status_created_idx
  on public.bookings (status, created_at desc);

alter table public.bookings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings'
      and policyname = 'demo_bookings_select'
  ) then
    create policy "demo_bookings_select" on public.bookings
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings'
      and policyname = 'demo_bookings_insert'
  ) then
    create policy "demo_bookings_insert" on public.bookings
      for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings'
      and policyname = 'demo_bookings_update'
  ) then
    create policy "demo_bookings_update" on public.bookings
      for update using (true) with check (true);
  end if;
end $$;
