import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/discover");

  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/login" className="btn-ghost">Sign in</Link>
      </header>

      <section className="grid items-center gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-sage">Couple friends, not dates</p>
          <h1 className="font-display text-5xl leading-[1.05] font-semibold md:text-6xl">
            Your friends became <em className="text-clay">our</em> friends.
            <br />Time for some new ones.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            Meet other couples in your city who love the same food, music and weekend plans.
            Both of you say yes before anyone else knows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login?mode=signup" className="btn-primary px-7 py-3 text-base">Start as a couple</Link>
            <Link href="/login?mode=signup&join=1" className="btn-ghost px-7 py-3 text-base">My partner invited me</Link>
          </div>
        </div>

        <div className="relative mx-auto h-72 w-72 md:h-80 md:w-80" aria-hidden>
          <div className="absolute inset-0 rounded-full bg-sand" />
          <div className="absolute left-6 top-10 h-40 w-40 rounded-full border-[10px] border-clay/80" />
          <div className="absolute right-6 bottom-10 h-40 w-40 rounded-full border-[10px] border-sage/80" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow">
            🍜 🎸 🎲 shared
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-20 md:grid-cols-3">
        {[
          ["One profile, two of you", "Sign up, invite your partner with a code. You go live only when you've both joined."],
          ["Four yeses to match", "A like counts only when both partners approve it, and a match needs both couples."],
          ["From chat to plans", "A shared chat for all four of you, opened with what you have in common."],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <h3 className="font-display text-xl font-semibold">{t}</h3>
            <p className="mt-2 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-line py-6 text-xs text-muted">
        Couples Connect is for friendship between couples. Be kind, meet in public, and report anything that feels off.
      </footer>
    </main>
  );
}
