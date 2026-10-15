import Link from "next/link";
import { requireCouple } from "@/lib/session";
import type { Couple } from "@/lib/types";

export default async function MatchesPage() {
  const { supabase, couple } = await requireCouple();
  const { data: matches } = await supabase
    .from("matches")
    .select("id, couple_a, couple_b, created_at")
    .order("created_at", { ascending: false });

  const otherIds = (matches ?? []).map((m) => (m.couple_a === couple.id ? m.couple_b : m.couple_a));
  const { data: others } = otherIds.length
    ? await supabase.from("couples").select("id, name, photo_url, neighbourhood, city").in("id", otherIds)
    : { data: [] as Pick<Couple, "id" | "name" | "photo_url" | "neighbourhood" | "city">[] };
  const byId = new Map((others ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6 py-4">
      <h1 className="font-display text-4xl font-semibold">Matches</h1>
      {!matches?.length ? (
        <div className="card text-center">
          <p className="font-display text-2xl font-semibold">No matches yet</p>
          <p className="mt-2 text-sm text-muted">When a couple you both liked likes you back, they&apos;ll show up here.</p>
          <Link href="/discover" className="btn-primary mt-5">Discover couples</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => {
            const other = byId.get(m.couple_a === couple.id ? m.couple_b : m.couple_a);
            if (!other) return null;
            return (
              <li key={m.id}>
                <Link href={`/matches/${m.id}`} className="card flex items-center gap-4 p-4 transition hover:border-ink">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-sand">
                    {other.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={other.photo_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{other.name}</p>
                    <p className="text-xs text-muted">
                      {[other.neighbourhood, other.city].filter(Boolean).join(", ")} · matched{" "}
                      {new Date(m.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-clay">Chat →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
