import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCouple } from "@/lib/session";
import { INTEREST_KEYS } from "@/lib/constants";
import type { Couple, Message, Profile } from "@/lib/types";
import { Chat } from "./Chat";
import { ReportButton } from "./ReportButton";

export default async function MatchChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, couple, user } = await requireCouple();

  const { data: match } = await supabase.from("matches").select("id, couple_a, couple_b").eq("id", id).maybeSingle();
  if (!match) notFound();
  const otherId = match.couple_a === couple.id ? match.couple_b : match.couple_a;

  const [{ data: other }, { data: people }, { data: messages }] = await Promise.all([
    supabase.from("couples").select("*").eq("id", otherId).single<Couple>(),
    supabase.from("profiles").select("id, display_name, couple_id").in("couple_id", [couple.id, otherId]),
    supabase.from("messages").select("*").eq("match_id", id).order("created_at").limit(500),
  ]);
  if (!other) notFound();

  const shared = INTEREST_KEYS.flatMap((k) => couple[k].filter((t) => other[k].includes(t)));
  const names: Record<string, { name: string; mine: boolean }> = {};
  for (const p of (people ?? []) as Profile[]) {
    names[p.id] = { name: p.display_name ?? "Someone", mine: p.couple_id === couple.id };
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col py-2 md:h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <Link href="/matches" className="text-muted hover:text-ink" aria-label="Back">←</Link>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-tight">{other.name}</h1>
            <p className="text-xs text-muted">
              Chat with all four of you · {[other.neighbourhood, other.city].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
        <ReportButton coupleId={other.id} coupleName={other.name} userId={user.id} />
      </div>
      <Chat matchId={id} userId={user.id} names={names} initial={(messages ?? []) as Message[]} shared={shared} />
    </div>
  );
}
