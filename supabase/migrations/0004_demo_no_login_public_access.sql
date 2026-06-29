-- No-login demo mode: let anonymous callers use the app, and relax the
-- auth-derived NOT NULLs so anonymous rows are valid. (The anon-only policies
-- below are superseded by 0005, which opens them to all roles.)
alter table public.vehicles alter column owner_id drop not null;
alter table public.service_entries alter column created_by drop not null;

create policy "demo_anon_vehicles_select" on public.vehicles
  for select to anon using (true);
create policy "demo_anon_vehicles_insert" on public.vehicles
  for insert to anon with check (true);
create policy "demo_anon_entries_select" on public.service_entries
  for select to anon using (true);
create policy "demo_anon_entries_insert" on public.service_entries
  for insert to anon with check (kind in ('owner_log', 'workshop_job'));

create policy "demo_anon_certs_all" on storage.objects
  for all to anon
  using (bucket_id = 'workshop-certs')
  with check (bucket_id = 'workshop-certs');
