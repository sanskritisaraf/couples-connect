import Link from "next/link";
import { requireCouple } from "@/lib/session";
import type { DiscoverCouple } from "@/lib/types";
import { DiscoverDeck } from "./DiscoverDeck";

export default async function DiscoverPage() {
  const { supabase, couple, user, members } = await requireCouple();

  if (couple.status === "pending") {
    return (
      <Empty title="Waiting for your partner" body="You'll start seeing couples once your partner joins with your invite code.">
        <Link href="/onboarding" className="btn-primary">See invite code</Link>
      </Empty>
    );
  }
  if (!couple.city) {
    return (
      <Empty title="Add your city first" body="We show you couples in the same city, so we need to know where you are.">
        <Link href="/profile" className="btn-primary">Complete profile</Link>
      </Empty>
    );
  }

  const [{ data: couples, error }, { data: myPending }] = await Promise.all([
    supabase.rpc("discover_couples"),
    supabase
      .from("couple_likes")
      .select("id, to_couple, couples!couple_likes_to_couple_fkey(name)")
      .eq("from_couple", couple.id)
      .eq("status", "pending")
      .eq("proposed_by", user.id),
  ]);

  const partner = members.find((m) => m.id !== user.id)?.display_name ?? "your partner";
  const waiting = (myPending ?? []).map((l) => {
    const rel = l.couples as unknown as { name: string } | { name: string }[] | null;
    return Array.isArray(rel) ? rel[0]?.name : rel?.name;
  }).filter(Boolean) as string[];

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="font-display text-4xl font-semibold">Couples in {couple.city}</h1>
        <p className="mt-1 text-sm text-muted">
          A like is sent only after you and {partner} both like the same couple.
        </p>
      </div>
      {error ? (
        <p className="card text-sm text-clay-dark">Couldn&apos;t load couples: {error.message}</p>
      ) : (
        <DiscoverDeck initial={(couples ?? []) as DiscoverCouple[]} partnerName={partner} />
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

function Empty({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="card my-8 text-center">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
