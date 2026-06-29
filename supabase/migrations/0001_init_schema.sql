-- 0001_init_schema — Costas car service log
-- RLS on every table from migration #1 (Qualia constitution).
-- Authorization is on app_metadata.role via auth.jwt(), never user_metadata.

create extension if not exists pgcrypto;

-- ───────────────────────── tables ─────────────────────────

-- one row per auth user; mirrors the app_metadata role for convenient joins
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'mechanic')),
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  model text not null,
  plate text not null unique,
  created_at timestamptz not null default now()
);

-- one history, written from both sides of the counter (owner_log | workshop_job)
create table public.service_entries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  kind text not null check (kind in ('owner_log', 'workshop_job')),
  service_code text not null,
  note text,
  place text,
  serviced_on date not null default current_date,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index service_entries_vehicle_date_idx
  on public.service_entries (vehicle_id, serviced_on desc);

create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  serial text not null,
  cert_path text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── helpers ─────────────────────────

-- current caller's role, read from the JWT app_metadata claim (not user_metadata)
create or replace function public.current_role_claim()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'owner')
$$;

-- ───────────────────────── RLS ─────────────────────────

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_entries enable row level security;
alter table public.workshops enable row level security;

-- profiles: a user sees and edits only their own row
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- vehicles: owner sees own; a mechanic may read any (to resolve a plate)
create policy "vehicles_select" on public.vehicles
  for select using (owner_id = auth.uid() or public.current_role_claim() = 'mechanic');
create policy "vehicles_insert_owner" on public.vehicles
  for insert with check (owner_id = auth.uid());
create policy "vehicles_update_owner" on public.vehicles
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- service_entries: owner sees entries for their vehicles; creator sees own
create policy "entries_select" on public.service_entries
  for select using (
    created_by = auth.uid()
    or exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = auth.uid())
  );
-- owner logs against their own vehicle
create policy "entries_insert_owner" on public.service_entries
  for insert with check (
    kind = 'owner_log'
    and created_by = auth.uid()
    and exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = auth.uid())
  );
-- mechanic logs a job against any vehicle
create policy "entries_insert_mechanic" on public.service_entries
  for insert with check (
    kind = 'workshop_job'
    and created_by = auth.uid()
    and public.current_role_claim() = 'mechanic'
  );

-- workshops: a mechanic owns exactly one
create policy "workshops_select_own" on public.workshops
  for select using (owner_id = auth.uid());
create policy "workshops_insert_own" on public.workshops
  for insert with check (owner_id = auth.uid());
create policy "workshops_update_own" on public.workshops
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ───────────────── auto-create profile on signup ─────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_app_meta_data ->> 'role', 'owner')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── storage ─────────────────────────

insert into storage.buckets (id, name, public)
values ('workshop-certs', 'workshop-certs', false)
on conflict (id) do nothing;

-- private bucket: each mechanic reads/writes only their own {uid}/… folder
-- (INSERT + SELECT + UPDATE so upsert works — constitution storage rule)
create policy "certs_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'workshop-certs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "certs_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'workshop-certs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "certs_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'workshop-certs' and (storage.foldername(name))[1] = auth.uid()::text);
