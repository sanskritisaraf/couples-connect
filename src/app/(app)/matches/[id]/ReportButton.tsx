"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ReportButton({ coupleId, coupleName, userId }: { coupleId: string; coupleName: string; userId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await createClient()
      .from("reports")
      .insert({ reporter_id: userId, reported_couple: coupleId, reason: reason.trim() });
    setState(error ? "error" : "sent");
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs font-semibold text-muted hover:text-clay">Report</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {state === "sent" ? (
              <>
                <h2 className="font-display text-2xl font-semibold">Thanks for telling us</h2>
                <p className="mt-2 text-sm text-muted">We review every report. If you feel unsafe, please contact local authorities.</p>
                <button className="btn-ghost mt-5" onClick={() => setOpen(false)}>Close</button>
              </>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h2 className="font-display text-2xl font-semibold">Report {coupleName}</h2>
                <textarea className="field min-h-28" required minLength={3} maxLength={1000}
                  placeholder="What happened?" value={reason} onChange={(e) => setReason(e.target.value)} />
                {state === "error" && <p className="text-sm text-clay-dark">Couldn&apos;t send. Please try again.</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="btn-primary" disabled={state === "sending"}>Send report</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
