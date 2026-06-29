-- seed.sql — demo accounts + sample history for the Costas demo.
-- owner@costas.demo / costas123   (role: owner)
-- mechanic@costas.demo / costas123 (role: mechanic)
-- Accounts are auto-confirmed (AUTH-04). Roles are stamped on app_metadata.

do $$
declare
  v_owner uuid := gen_random_uuid();
  v_mech  uuid := gen_random_uuid();
  v_veh   uuid := gen_random_uuid();
begin
  -- ── owner account ──
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_owner, 'authenticated', 'authenticated',
    'owner@costas.demo', crypt('costas123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"role":"owner"}', '{"full_name":"Andreas"}',
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_owner::text, v_owner, jsonb_build_object('sub', v_owner::text, 'email', 'owner@costas.demo', 'email_verified', true), 'email', now(), now(), now());

  -- ── mechanic account ──
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_mech, 'authenticated', 'authenticated',
    'mechanic@costas.demo', crypt('costas123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"role":"mechanic"}', '{"full_name":"Maria"}',
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_mech::text, v_mech, jsonb_build_object('sub', v_mech::text, 'email', 'mechanic@costas.demo', 'email_verified', true), 'email', now(), now(), now());

  -- ── demo vehicle (owned by Andreas) ──
  -- plates are stored canonicalized to Latin (see src/lib/plate.ts)
  insert into public.vehicles (id, owner_id, model, plate)
  values (v_veh, v_owner, 'VW Golf 2019', 'KXP 412');

  -- ── workshop (owned by Maria) ──
  insert into public.workshops (owner_id, name, serial)
  values (v_mech, 'AutoCheck', 'CY-MOT-4471');

  -- ── service history (owner logs + one mechanic job on the same plate) ──
  insert into public.service_entries (vehicle_id, kind, service_code, note, place, serviced_on, created_by) values
    (v_veh, 'owner_log',    'brakes',      null, 'AutoCheck, Nicosia',   '2025-02-12', v_owner),
    (v_veh, 'owner_log',    'service_oil', null, 'ProMotors, Limassol',  '2024-11-03', v_owner),
    (v_veh, 'owner_log',    'clutch',      null, 'CarFix, Larnaca',      '2024-07-21', v_owner),
    (v_veh, 'owner_log',    'mot',         null, 'SpeedCheck, Nicosia',  '2024-03-15', v_owner),
    (v_veh, 'workshop_job', 'diagnostic',  'Diagnostic check', null,     '2025-06-20', v_mech);
end $$;
