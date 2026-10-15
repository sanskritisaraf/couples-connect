# Couples Connect

Couples meet other couples in their city who share their taste in food, music, movies and weekend plans.

**Stack:** Next.js 15 (App Router) on **Vercel** · **Supabase** (Postgres, Auth, Realtime, Storage) · **GitHub** (push to `main` → production deploy).

## How it works
- **Two logins, one couple.** Partner 1 signs up and creates the couple; partner 2 signs up and joins with the 8-character invite code. The couple goes live only when both have joined.
- **Dual consent.** A like is only sent once *both* partners like the same couple. A match needs both couples, so four yeses in all.
- **Discover** shows active couples in the same city, ranked by shared interests (Postgres function `discover_couples`).
- **Chat** is one shared thread for all four people, live via Supabase Realtime, with icebreakers built from shared interests.
- **Safety:** Row Level Security on every table, private invite codes, incoming likes are never visible, and every match chat has a report button.

## Project layout
```
src/app/page.tsx                 landing
src/app/login                    sign in / sign up
src/app/auth/*                   email-confirm callback, sign out
src/app/(app)/onboarding         create couple / join with code
src/app/(app)/profile            couple profile, photo, interests
src/app/(app)/discover           feed + like/pass
src/app/(app)/matches            match list + 4-way chat
src/lib/supabase/*               browser/server clients + session middleware
supabase/migrations/             database schema (tables, RPCs, RLS, storage)
```

## Run locally
```bash
cp .env.example .env.local   # fill in from Supabase → Project Settings → API
npm install
npm run dev                  # http://localhost:3000
```

## Environment variables (set in Vercel too)
| Name | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (publishable) |

## Supabase Auth settings
In Supabase → Authentication → URL Configuration, set **Site URL** to your Vercel production URL and add
`https://<your-app>.vercel.app/**` and `http://localhost:3000/**` to **Redirect URLs**, so email confirmation links come back to the app.

## Database changes
Schema lives in `supabase/migrations/`. Apply new files in order through the Supabase SQL Editor or `supabase db push`.
