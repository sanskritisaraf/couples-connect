"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CoupleCard } from "@/components/CoupleCard";
import type { DiscoverCouple } from "@/lib/types";

type Toast = { tone: "ok" | "match" | "err"; text: string; matchName?: string };

export function DiscoverDeck({ initial, partnerName }: { initial: DiscoverCouple[]; partnerName: string }) {
  const [queue, setQueue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const current = queue[0];

  async function act(kind: "like" | "pass") {
    if (!current) return;
    setBusy(true);
    const supabase = createClient();
    if (kind === "pass") {
      const { error } = await supabase.rpc("pass_couple", { target: current.id });
      setBusy(false);
      if (error) return setToast({ tone: "err", text: error.message });
      setToast(null);
    } else {
      const { data, error } = await supabase.rpc("like_couple", { target: current.id });
      setBusy(false);
      if (error) return setToast({ tone: "err", text: error.message });
      if (data === "matched") setToast({ tone: "match", text: `It's a match with ${current.name}!`, matchName: current.name });
      else if (data === "approved") setToast({ tone: "ok", text: `Like sent to ${current.name}. If they like you back, it's a match.` });
      else setToast({ tone: "ok", text: `Saved. We'll send it once ${partnerName} likes ${current.name} too.` });
    }
    setQueue((q) => q.slice(1));
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`rounded-2xl px-5 py-3 text-sm font-medium ${
          toast.tone === "match" ? "bg-clay text-white" : toast.tone === "ok" ? "bg-sage/15 text-sage" : "bg-clay/10 text-clay-dark"
        }`}>
          {toast.text}
          {toast.tone === "match" && <Link href="/matches" className="ml-2 underline">Say hello →</Link>}
        </div>
      )}

      {current ? (
        <>
          {current.partner_proposed && (
            <p className="rounded-2xl border border-clay/30 bg-clay/5 px-5 py-3 text-sm">
              <b>{partnerName}</b> liked this couple. Like them too to send it.
            </p>
          )}
          <CoupleCard c={current} />
          <div className="sticky bottom-20 z-10 flex justify-center gap-4 md:bottom-4">
            <button onClick={() => act("pass")} disabled={busy} className="btn-ghost h-14 w-36 text-base shadow-lg">
              Not for us
            </button>
            <button onClick={() => act("like")} disabled={busy} className="btn-primary h-14 w-36 text-base shadow-lg">
              {current.partner_proposed ? "Approve ♥" : "Like ♥"}
            </button>
          </div>
        </>
      ) : (
        <div className="card text-center">
          <p className="font-display text-2xl font-semibold">You&apos;re all caught up</p>
          <p className="mt-2 text-sm text-muted">
            New couples join every week. Add more interests to your profile to get better suggestions.
          </p>
          <Link href="/profile" className="btn-ghost mt-5">Update interests</Link>
        </div>
      )}
    </div>
  );
}
