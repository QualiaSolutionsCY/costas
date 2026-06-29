-- 0007_signup_role_trigger.sql
-- Applied via Supabase MCP (project kxjzntbilkkskpfgcelr), not the CLI.
-- Operator runs apply_migration after merge — builder writes the file only.
--
-- Stamps app_metadata.role = 'owner' and auto-confirms the email for every
-- self-service email signup BEFORE the row is finalized, so the AFTER-INSERT
-- trigger on_auth_user_created (0001) reads the stamped role when it creates
-- the profile (0001: "coalesce(new.raw_app_meta_data ->> 'role', 'owner')").
-- Only touches rows with no role already present, so admin/mechanic seeds are
-- untouched.

create or replace function public.stamp_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_app_meta_data ->> 'role' is null then
    new.raw_app_meta_data := jsonb_set(
      coalesce(new.raw_app_meta_data, '{}'::jsonb)
        || '{"provider":"email","providers":["email"]}'::jsonb,
      '{role}',
      '"owner"'
    );
    new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  end if;
  return new;
end;
$$;

-- BEFORE INSERT so the role is present when on_auth_user_created (AFTER INSERT,
-- 0001) builds the profile row.
drop trigger if exists on_auth_user_before_insert on auth.users;
create trigger on_auth_user_before_insert
  before insert on auth.users
  for each row execute function public.stamp_new_user_role();
