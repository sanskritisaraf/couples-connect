-- Removes the demo couples and their logins (run in Supabase → SQL Editor before launch).
delete from public.couples c
 where exists (select 1 from public.profiles p join auth.users u on u.id = p.id
               where p.couple_id = c.id and u.email like '%.demo@example.com');
delete from auth.users where email like '%.demo@example.com';
