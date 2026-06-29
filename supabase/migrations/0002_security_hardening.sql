-- pin search_path on the RLS helper, and stop the signup trigger fn being RPC-callable
alter function public.current_role_claim() set search_path = '';
revoke execute on function public.handle_new_user() from anon, authenticated, public;
