-- widen the profile role check to allow an 'admin' role (demo admin account)
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('owner', 'mechanic', 'admin'));
