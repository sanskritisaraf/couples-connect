-- Couples Connect: final setup step (paste into Supabase → SQL Editor → Run)
-- These parts contain DELETE / REVOKE statements, which need your confirmation.

-- Like a couple. First partner proposes; the other partner liking the same couple approves it.
-- Returns 'proposed' | 'approved' | 'matched' | 'already_proposed'
create or replace function public.like_couple(target uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  mine uuid := public.my_couple_id();
  existing public.couple_likes;
  a uuid; b uuid;
begin
  if mine is null then raise exception 'Set up your couple first'; end if;
  if (select status from public.couples where id = mine) <> 'active' then
    raise exception 'Your partner needs to join before you can like couples';
  end if;
  if target = mine then raise exception 'That is you'; end if;
  if not exists (select 1 from public.couples where id = target and status = 'active') then
    raise exception 'Couple not found';
  end if;

  select * into existing from public.couple_likes where from_couple = mine and to_couple = target;

  if existing.id is null then
    insert into public.couple_likes (from_couple, to_couple, proposed_by)
    values (mine, target, me);
    delete from public.couple_passes where from_couple = mine and to_couple = target;
    return 'proposed';
  end if;

  if existing.status = 'approved' then return 'approved'; end if;
  if existing.proposed_by = me then return 'already_proposed'; end if;

  update public.couple_likes set status = 'approved', approved_by = me where id = existing.id;

  if exists (select 1 from public.couple_likes
             where from_couple = target and to_couple = mine and status = 'approved') then
    a := least(mine, target); b := greatest(mine, target);
    insert into public.matches (couple_a, couple_b) values (a, b) on conflict do nothing;
    return 'matched';
  end if;
  return 'approved';
end $$;

-- Pass on a couple (hides it for both partners; also withdraws a pending proposal)
create or replace function public.pass_couple(target uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare mine uuid := public.my_couple_id();
begin
  if mine is null then raise exception 'Set up your couple first'; end if;
  delete from public.couple_likes where from_couple = mine and to_couple = target and status = 'pending';
  insert into public.couple_passes (from_couple, to_couple) values (mine, target) on conflict do nothing;
end $$;

-- Only signed-in users may call the app's functions
revoke execute on function public.create_couple(text), public.join_couple(text),
  public.like_couple(uuid), public.pass_couple(uuid), public.discover_couples(),
  public.my_couple_id(), public.is_match_member(uuid)
  from public, anon;
grant execute on function public.create_couple(text), public.join_couple(text),
  public.like_couple(uuid), public.pass_couple(uuid), public.discover_couples(),
  public.my_couple_id(), public.is_match_member(uuid)
  to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Let a couple remove its own photos
create policy "couple photo delete" on storage.objects for delete to authenticated
  using (bucket_id = 'couple-photos'
         and (storage.foldername(name))[1] = (select public.my_couple_id())::text);
