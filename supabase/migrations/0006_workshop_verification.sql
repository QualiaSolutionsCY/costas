-- 0006_workshop_verification — admin review state for workshop registrations
-- Applied via Supabase MCP (project kxjzntbilkkskpfgcelr) by operator — not the CLI.
-- Additive: leaves the existing workshops_select_own / workshops_insert_own /
-- workshops_update_own policies (0001:100-105) intact. RLS already enabled (0001:62).

-- ───────────────────────── verification columns ─────────────────────────

alter table public.workshops
  add column status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected'));

alter table public.workshops
  add column reviewed_at timestamptz;

alter table public.workshops
  add column rejection_reason text;

-- ───────────────────────── admin RLS ─────────────────────────

-- an admin (app_metadata.role = 'admin') may read and write every workshop row
create policy "workshops_admin_all" on public.workshops
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
