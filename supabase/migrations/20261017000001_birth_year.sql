alter table public.profiles
  add column if not exists birth_year int check (birth_year between 1940 and 2008);
