-- Couples Connect: initial schema
-- A "couple" is the unit that matches. Each couple has two members (profiles).
-- A like only counts once BOTH partners approve it; a match needs both couples' approved likes.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tables

create table public.couples (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 60),
  bio           text check (char_length(bio) <= 600),
  how_we_met    text check (char_length(how_we_met) <= 400),
  city          text,
  neighbourhood text,
  together_since date,
  photo_url     text,
  cuisines      text[] not null default '{}',
  music         text[] not null default '{}',
  movies        text[] not null default '{}',
  activities    text[] not null default '{}',
  drinks        text check (drinks in ('yes','sometimes','no')),
  kids          text check (kids in ('none','have_kids','expecting','prefer_not_say')),
  status        text not null default 'pending' check (status in ('pending','active')),
  created_at    timestamptz not null default now()
);

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  couple_id    uuid references public.couples(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index profiles_couple_id_idx on public.profiles(couple_id);

-- kept separate so the code is only visible to the couple itself
create table public.couple_invites (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  code      text not null unique default upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8))
);

create table public.couple_likes (
  id          uuid primary key default gen_random_uuid(),
  from_couple uuid not null references public.couples(id) on delete cascade,
  to_couple   uuid not null references public.couples(id) on delete cascade,
  proposed_by uuid not null references public.profiles(id) on delete cascade,
  approved_by uuid references public.profiles(id) on delete set null,
  status      text not null default 'pending' check (status in ('pending','approved')),
  created_at  timestamptz not null default now(),
  unique (from_couple, to_couple),
  check (from_couple <> to_couple)
);
create index couple_likes_to_idx on public.couple_likes(to_couple);
create index couple_likes_proposed_by_idx on public.couple_likes(proposed_by);
create index couple_likes_approved_by_idx on public.couple_likes(approved_by);

create table public.couple_passes (
  from_couple uuid not null references public.couples(id) on delete cascade,
  to_couple   uuid not null references public.couples(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (from_couple, to_couple)
);
create index couple_passes_to_idx on public.couple_passes(to_couple);

create table public.matches (
  id         uuid primary key default gen_random_uuid(),
  couple_a   uuid not null references public.couples(id) on delete cascade,
  couple_b   uuid not null references public.couples(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (couple_a < couple_b),
  unique (couple_a, couple_b)
);
create index matches_couple_b_idx on public.matches(couple_b);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_match_idx on public.messages(match_id, created_at);
create index messages_sender_idx on public.messages(sender_id);

create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  reported_couple  uuid not null references public.couples(id) on delete cascade,
  reason           text not null check (char_length(reason) between 3 and 1000),
  created_at       timestamptz not null default now()
);
create index reports_reporter_idx on public.reports(reporter_id);
create index reports_reported_idx on public.reports(reported_couple);

-- ---------------------------------------------------------------- helpers

create or replace function public.my_couple_id()
returns uuid language sql stable security definer set search_path = ''
as $$ select couple_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_match_member(m uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.matches
    where id = m
      and public.my_couple_id() in (couple_a, couple_b)
  )
$$;

-- new auth user -> profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 40));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- RPCs

-- Partner 1 creates the couple and gets an invite code
create or replace function public.create_couple(couple_name text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if public.my_couple_id() is not null then raise exception 'You are already in a couple'; end if;
  insert into public.couples (name) values (couple_name) returning id into new_id;
  insert into public.couple_invites (couple_id) values (new_id);
  update public.profiles set couple_id = new_id where id = auth.uid();
  return new_id;
end $$;

-- Partner 2 joins with the code; the couple goes live
create or replace function public.join_couple(invite_code text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare target uuid; member_count int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if public.my_couple_id() is not null then raise exception 'You are already in a couple'; end if;
  select couple_id into target from public.couple_invites where code = upper(trim(invite_code));
  if target is null then raise exception 'Invite code not found'; end if;
  select count(*) into member_count from public.profiles where couple_id = target;
  if member_count >= 2 then raise exception 'This couple already has two partners'; end if;
  update public.profiles set couple_id = target where id = auth.uid();
  update public.couples set status = 'active' where id = target;
  return target;
end $$;

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

-- Couples in my city I haven't acted on, ranked by shared interests
create or replace function public.discover_couples()
returns table (
  id uuid, name text, bio text, city text, neighbourhood text, together_since date, photo_url text,
  cuisines text[], music text[], movies text[], activities text[], drinks text, kids text,
  shared_cuisines text[], shared_music text[], shared_movies text[], shared_activities text[],
  shared_count int, partner_proposed boolean
)
language sql stable security definer set search_path = ''
as $$
  with me as (select c.* from public.couples c where c.id = public.my_couple_id())
  select
    c.id, c.name, c.bio, c.city, c.neighbourhood, c.together_since, c.photo_url,
    c.cuisines, c.music, c.movies, c.activities, c.drinks, c.kids,
    array(select unnest(c.cuisines)   intersect select unnest(me.cuisines)),
    array(select unnest(c.music)      intersect select unnest(me.music)),
    array(select unnest(c.movies)     intersect select unnest(me.movies)),
    array(select unnest(c.activities) intersect select unnest(me.activities)),
    ( cardinality(array(select unnest(c.cuisines)   intersect select unnest(me.cuisines)))
    + cardinality(array(select unnest(c.music)      intersect select unnest(me.music)))
    + cardinality(array(select unnest(c.movies)     intersect select unnest(me.movies)))
    + cardinality(array(select unnest(c.activities) intersect select unnest(me.activities))) )::int,
    exists (select 1 from public.couple_likes l
            where l.from_couple = me.id and l.to_couple = c.id
              and l.status = 'pending' and l.proposed_by <> auth.uid())
  from public.couples c, me
  where c.status = 'active'
    and c.id <> me.id
    and me.city is not null
    and lower(trim(c.city)) = lower(trim(me.city))
    and not exists (select 1 from public.couple_passes p where p.from_couple = me.id and p.to_couple = c.id)
    and not exists (select 1 from public.couple_passes p where p.from_couple = c.id and p.to_couple = me.id)
    and not exists (select 1 from public.couple_likes l
                    where l.from_couple = me.id and l.to_couple = c.id
                      and (l.status = 'approved' or l.proposed_by = auth.uid()))
    and not exists (select 1 from public.matches m
                    where (m.couple_a = me.id and m.couple_b = c.id) or (m.couple_b = me.id and m.couple_a = c.id))
  order by 19 desc, 18 desc, c.created_at desc
  limit 50
$$;

revoke execute on function public.create_couple(text), public.join_couple(text),
  public.like_couple(uuid), public.pass_couple(uuid), public.discover_couples(),
  public.my_couple_id(), public.is_match_member(uuid)
  from public, anon;
grant execute on function public.create_couple(text), public.join_couple(text),
  public.like_couple(uuid), public.pass_couple(uuid), public.discover_couples(),
  public.my_couple_id(), public.is_match_member(uuid)
  to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------- RLS

alter table public.couples        enable row level security;
alter table public.profiles       enable row level security;
alter table public.couple_invites enable row level security;
alter table public.couple_likes   enable row level security;
alter table public.couple_passes  enable row level security;
alter table public.matches        enable row level security;
alter table public.messages       enable row level security;
alter table public.reports        enable row level security;

-- couples: active couples are visible to signed-in users; your own couple always
create policy "couples readable" on public.couples for select to authenticated
  using (status = 'active' or id = (select public.my_couple_id()));
create policy "members update own couple" on public.couples for update to authenticated
  using (id = (select public.my_couple_id()))
  with check (id = (select public.my_couple_id()));

-- profiles: names are shown on couple cards and in chat
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "update own profile name" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and couple_id is not distinct from (select public.my_couple_id()));

create policy "own invite code" on public.couple_invites for select to authenticated
  using (couple_id = (select public.my_couple_id()));

-- likes: you only see your own couple's outgoing likes (incoming likes stay private)
create policy "own likes" on public.couple_likes for select to authenticated
  using (from_couple = (select public.my_couple_id()));

create policy "own passes" on public.couple_passes for select to authenticated
  using (from_couple = (select public.my_couple_id()));

create policy "own matches" on public.matches for select to authenticated
  using ((select public.my_couple_id()) in (couple_a, couple_b));

create policy "read match messages" on public.messages for select to authenticated
  using ((select public.is_match_member(match_id)));
create policy "send match messages" on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and (select public.is_match_member(match_id)));

create policy "file reports" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

-- ---------------------------------------------------------------- realtime + storage

alter publication supabase_realtime add table public.messages;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('couple-photos', 'couple-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- files live under <couple_id>/...; only that couple's members can write
create policy "couple photo upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'couple-photos'
              and (storage.foldername(name))[1] = (select public.my_couple_id())::text);
create policy "couple photo update" on storage.objects for update to authenticated
  using (bucket_id = 'couple-photos'
         and (storage.foldername(name))[1] = (select public.my_couple_id())::text);
create policy "couple photo delete" on storage.objects for delete to authenticated
  using (bucket_id = 'couple-photos'
         and (storage.foldername(name))[1] = (select public.my_couple_id())::text);
