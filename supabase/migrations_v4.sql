-- ============================================================
--  Discipline Tracker — Migration v4 (optional)
--  Adds a SECURITY DEFINER RPC that lets a signed-in user
--  permanently delete their own auth.users entry.
--
--  Because public.users.id references auth.users(id) ON DELETE CASCADE,
--  and every other table references public.users(id) ON DELETE CASCADE,
--  deleting the auth row wipes every byte of user data automatically.
--
--  Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer          -- runs with owner privileges so it can touch auth.users
set search_path = public  -- pin search_path for safety
as $$
begin
  -- auth.uid() returns the UUID of the currently authenticated caller.
  -- Deleting this row cascades to public.users → all child tables.
  delete from auth.users where id = auth.uid();
end;
$$;

-- Only authenticated users may call this function
revoke all on function public.delete_user_account() from public;
grant execute on function public.delete_user_account() to authenticated;
