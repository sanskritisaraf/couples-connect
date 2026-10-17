-- Demo data: 4 couples (8 people, ages 25–35) in Delhi so the app has something to explore.
-- Every demo login uses the password  CouplesDemo@2026  and an @example.com address (no email is ever sent).
-- Safe to re-run: it skips if the demo accounts already exist.
-- Remove before launch with supabase/seed/remove_demo_couples.sql

do $$
declare
  pw text := extensions.crypt('CouplesDemo@2026', extensions.gen_salt('bf'));
  people jsonb := '[
    {"key":"arjun",   "name":"Arjun",     "email":"arjun.demo@example.com",     "birth_year":1997, "couple":1},
    {"key":"kabir",   "name":"Kabir",     "email":"kabir.demo@example.com",     "birth_year":1995, "couple":1},
    {"key":"ananya",  "name":"Ananya",    "email":"ananya.demo@example.com",    "birth_year":1999, "couple":2},
    {"key":"riya",    "name":"Riya",      "email":"riya.demo@example.com",      "birth_year":1998, "couple":2},
    {"key":"priya",   "name":"Priya",     "email":"priya.demo@example.com",     "birth_year":1994, "couple":3},
    {"key":"rahul",   "name":"Rahul",     "email":"rahul.demo@example.com",     "birth_year":1992, "couple":3},
    {"key":"meera",   "name":"Meera",     "email":"meera.demo@example.com",     "birth_year":2000, "couple":4},
    {"key":"sid",     "name":"Siddharth", "email":"siddharth.demo@example.com", "birth_year":1998, "couple":4}
  ]';
  p jsonb;
  uid uuid;
  ids jsonb := '{}';
  c1 uuid; c2 uuid; c3 uuid; c4 uuid;
  m12 uuid;
  user_couple uuid;
begin
  if exists (select 1 from auth.users where email = 'arjun.demo@example.com') then
    raise notice 'Demo couples already exist, skipping';
    return;
  end if;

  -- 1. Couples
  insert into public.couples (name, bio, how_we_met, city, neighbourhood, together_since,
                              cuisines, music, movies, activities, drinks, kids, status)
  values ('Arjun & Kabir',
          'Weekends are for long brunches, a gig at a tiny venue, or losing badly at pub quiz. Kabir plans every trip; Arjun finds the food.',
          'Same table at a quiz night in Hauz Khas Village. We lost, but swapped numbers.',
          'Delhi', 'Hauz Khas', '2021-02-14',
          '{Japanese,"Cafés & brunch",Italian,"Street food"}', '{Indie,Electronic,"Live gigs"}',
          '{Documentaries,"Indie films",Sci-fi}', '{"Quiz nights","Gym & fitness",Travel,Theatre,"Board games"}',
          'sometimes', 'none', 'active')
  returning id into c1;

  insert into public.couples (name, bio, how_we_met, city, neighbourhood, together_since,
                              cuisines, music, movies, activities, drinks, kids, status)
  values ('Ananya & Riya',
          'Two cats, one pottery wheel, too many books. We''re looking for couples up for slow Sunday plans: a dosa breakfast, a museum, a long walk in Lodhi Garden.',
          'Met at a pottery class in Shahpur Jat. Riya''s bowl collapsed; Ananya helped save it.',
          'Delhi', 'Saket', '2022-06-03',
          '{"South Indian",Korean,Vegan,Desserts}', '{Indie,K-pop,Sufi}',
          '{K-dramas,Rom-com,Anime}', '{"Pottery & art","Book club",Yoga,Pets,"Board games"}',
          'no', 'none', 'active')
  returning id into c2;

  insert into public.couples (name, bio, how_we_met, city, neighbourhood, together_since,
                              cuisines, music, movies, activities, drinks, kids, status)
  values ('Priya & Rahul',
          'Married, one very energetic 3-year-old. We miss having couple friends who don''t mind a playdate turning into a dinner party. Big on cricket, road trips and Old Delhi food walks.',
          'Introduced by college friends at a Diwali party. Rahul talked about cricket for an hour; Priya stayed anyway.',
          'Delhi', 'Vasant Kunj', '2018-11-25',
          '{"North Indian",Biryani,"Street food",Chinese}', '{Bollywood,Punjabi,Retro}',
          '{Bollywood,Comedy,Thriller,Sports}', '{Cricket,"Road trips","Board games","Cooking together"}',
          'yes', 'have_kids', 'active')
  returning id into c3;

  insert into public.couples (name, bio, how_we_met, city, neighbourhood, together_since,
                              cuisines, music, movies, activities, drinks, kids, status)
  values ('Meera & Siddharth',
          'Moved to Delhi last year for work and know almost no one here! Into weekend treks, anime marathons, stand-up nights and finding the best momos in the city.',
          'Coworkers in Bengaluru who kept ending up on the same Saturday trek.',
          'Delhi', 'Lajpat Nagar', '2023-01-08',
          '{Korean,Japanese,"Cafés & brunch","Street food"}', '{Hip-hop,Pop,Indie}',
          '{Anime,Sci-fi,Thriller}', '{"Treks & hikes",Gaming,"Board games",Running,"Stand-up comedy"}',
          'sometimes', 'none', 'active')
  returning id into c4;

  -- 2. Login accounts (email already confirmed) + profiles
  for p in select * from jsonb_array_elements(people) loop
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
            p->>'email', pw, now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('display_name', p->>'name'),
            now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text, 'email',
            jsonb_build_object('sub', uid::text, 'email', p->>'email', 'email_verified', true),
            now(), now(), now());
    -- the on_auth_user_created trigger made the profile; attach it to its couple
    update public.profiles
       set couple_id = case (p->>'couple')::int when 1 then c1 when 2 then c2 when 3 then c3 else c4 end,
           birth_year = (p->>'birth_year')::int
     where id = uid;
    ids := ids || jsonb_build_object(p->>'key', uid);
  end loop;

  insert into public.couple_invites (couple_id) values (c1), (c2), (c3), (c4);

  -- 3. Activity so every feature has something to show
  -- Arjun & Kabir matched with Ananya & Riya, with a chat going
  insert into public.couple_likes (from_couple, to_couple, proposed_by, approved_by, status) values
    (c1, c2, (ids->>'kabir')::uuid,  (ids->>'arjun')::uuid, 'approved'),
    (c2, c1, (ids->>'riya')::uuid,   (ids->>'ananya')::uuid, 'approved');
  insert into public.matches (couple_a, couple_b) values (least(c1, c2), greatest(c1, c2)) returning id into m12;
  insert into public.messages (match_id, sender_id, body, created_at) values
    (m12, (ids->>'kabir')::uuid,  'Hi both! Fellow board game people 🎲 What are you playing these days?', now() - interval '2 days'),
    (m12, (ids->>'riya')::uuid,   'Hiii! Wingspan, on repeat. Ananya refuses to lose gracefully 😂', now() - interval '2 days' + interval '20 minutes'),
    (m12, (ids->>'ananya')::uuid, 'Lies. Also, are you two up for a games evening? There''s a nice café in Saket.', now() - interval '1 day'),
    (m12, (ids->>'arjun')::uuid,  'Absolutely in. Saturday 6pm? We''ll bring Codenames.', now() - interval '20 hours');

  -- Kabir liked Priya & Rahul and is waiting for Arjun to approve
  insert into public.couple_likes (from_couple, to_couple, proposed_by, status)
    values (c1, c3, (ids->>'kabir')::uuid, 'pending');

  -- Meera & Siddharth already like Arjun & Kabir: if Arjun and Kabir both like them back, it's an instant match
  insert into public.couple_likes (from_couple, to_couple, proposed_by, approved_by, status)
    values (c4, c1, (ids->>'meera')::uuid, (ids->>'sid')::uuid, 'approved');

  -- Meera & Siddharth have also liked the first real couple in Delhi (if there is one), so they can try an instant match
  select id into user_couple from public.couples
   where status = 'active' and lower(city) = 'delhi' and id not in (c1, c2, c3, c4)
   order by created_at limit 1;
  if user_couple is not null then
    insert into public.couple_likes (from_couple, to_couple, proposed_by, approved_by, status)
      values (c4, user_couple, (ids->>'meera')::uuid, (ids->>'sid')::uuid, 'approved')
      on conflict do nothing;
  end if;
end $$;
