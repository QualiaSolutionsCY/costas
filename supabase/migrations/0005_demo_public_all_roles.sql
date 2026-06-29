-- The anon-only demo policies didn't apply to signed-in sessions, so a logged-in
-- owner couldn't register a workshop_job. Recreate them for ALL roles (public)
-- so the demo works whether guest or signed in, owner or mechanic.
drop policy if exists "demo_anon_vehicles_select" on public.vehicles;
drop policy if exists "demo_anon_vehicles_insert" on public.vehicles;
drop policy if exists "demo_anon_entries_select" on public.service_entries;
drop policy if exists "demo_anon_entries_insert" on public.service_entries;

create policy "demo_vehicles_select" on public.vehicles
  for select using (true);
create policy "demo_vehicles_insert" on public.vehicles
  for insert with check (true);
create policy "demo_entries_select" on public.service_entries
  for select using (true);
create policy "demo_entries_insert" on public.service_entries
  for insert with check (kind in ('owner_log', 'workshop_job'));
