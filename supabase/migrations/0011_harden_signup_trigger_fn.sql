-- stop the signup trigger fn being RPC-callable (it's a trigger only)
revoke execute on function public.stamp_new_user_role() from anon, authenticated, public;
