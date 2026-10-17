import Link from "next/link";
import { getSession } from "@/lib/session";
import { CITIES } from "@/lib/constants";
import type { DiscoverCouple, Member } from "@/lib/types";
import { DiscoverDeck } from "./DiscoverDeck";
import { CityFilter } from "./CityFilter";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { supabase, couple, user, members } = await getSession();
  const { city: cityParam } = await searchParams;

  // Default to the couple's own city; "all" (or no city yet) shows everyone.
  const city = cityParam === "all" ? "" : cityParam ?? couple?.city ?? "";
  const canLike = couple?.status === "active";

  const [{ data: couples, error }, { data: myPending }] = await Promise.all([
    supabase.rpc("browse_couples", { city_filter: city || null }),
    couple
      ? supabase
          .from("couple_likes")
          .select("id, to_couple, couples!couple_likes_to_couple_fkey(name)")
          .eq("from_couple", couple.id)
          .eq("status", "pending")
          .eq("proposed_by", user.id)
      : Promise.resolve({ data: [] as { couples: unknown }[] }),
  ]);

  const list = (couples ?? []) as DiscoverCouple[];
  const { data: people } = list.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, couple_id, birth_year")
        .in("couple_id", list.map((c) => c.id))
    : { data: [] as Member[] };
  const membersByCouple: Record<string, Member[]> = {};
  for (const m of (people ?? []) as Member[]) (membersByCouple[m.couple_id!] ??= []).push(m);

  const partner = members.find((m) => m.id !== user.id)?.display_name ?? "your partner";
  const waiting = (myPending ?? [])
    .map((l) => {
      const rel = l.couples as { name: string } | { name: string }[] | null;
      return Array.isArray(rel) ? rel[0]?.name : rel?.name;
    })
    .filter(Boolean) as string[];

  const cityOptions = Array.from(new Set([...(couple?.city ? [couple.city] : []), ...CITIES]));

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-semibold">{city ? `Couples in ${city}` : "Couples near you"}</h1>
          <p className="mt-1 text-sm text-muted">
            {canLike
              ? `A like is sent only after you and ${partner} both like the same couple.`
              : "Have a look around. You can start liking once your couple profile is live."}
          </p>
        </div>
        <CityFilter value={city} options={cityOptions} />
      </div>

      {!couple && (
        <Banner text="Set up your couple profile, or join your partner with their code, to start liking couples.">
          <Link href="/onboarding" className="btn-primary">Set up our couple</Link>
        </Banner>
      )}
      {couple?.status === "pending" && (
        <Banner text="Your partner hasn't joined yet. Share your invite code so you can start liking couples together.">
          <Link href="/onboarding" className="btn-primary">See invite code</Link>
        </Banner>
      )}
      {couple?.status === "active" && !couple.city && (
        <Banner text="Add your city and interests to see who you have the most in common with.">
          <Link href="/profile" className="btn-primary">Complete profile</Link>
        </Banner>
      )}

      {error ? (
        <p className="card text-sm text-clay-dark">Couldn&apos;t load couples: {error.message}</p>
      ) : (
        <DiscoverDeck
          key={city || "all"}
          initial={list}
          members={membersByCouple}
          partnerName={partner}
          canLike={canLike}
          showingCity={city}
        />
      )}

      {waiting.length > 0 && (
        <div className="card">
          <p className="label">Waiting for {partner} to approve</p>
          <p className="text-sm">{waiting.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}

function Banner({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-clay/30 bg-clay/5 px-5 py-4">
      <p className="text-sm">{text}</p>
      {children}
    </div>
  );
}
