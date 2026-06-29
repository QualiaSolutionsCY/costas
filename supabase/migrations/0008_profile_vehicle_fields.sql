-- Migration 0008: profile phone + vehicle year + demo-permissive vehicle delete.
-- Backs M3.P2 ACCT-04/05 (profile edit incl. phone) and ACCT-06/07/08
-- (vehicle add/edit/remove). Idempotent: ADD COLUMN IF NOT EXISTS + a guarded
-- policy create so re-running on an environment that already has the policy is
-- a no-op rather than an error.

alter table public.profiles add column if not exists phone text;
alter table public.vehicles add column if not exists year int;

-- Demo-permissive DELETE on vehicles. Vehicles are created anonymously in this
-- demo (owner_id nullable since 0004; the 0005 demo_* policies are all
-- `using (true)`), so a scoped delete would silently fail for anonymous rows.
-- Match the existing permissive demo posture. Guarded so the migration is
-- idempotent.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vehicles'
      and policyname = 'demo_vehicles_delete'
  ) then
    create policy "demo_vehicles_delete" on public.vehicles
      for delete using (true);
  end if;
end $$;
