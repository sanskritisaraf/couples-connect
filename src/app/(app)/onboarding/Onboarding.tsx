"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Onboarding({ firstName, startWithJoin }: { firstName: string; startWithJoin: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">(startWithJoin ? "join" : "create");
  const [coupleName, setCoupleName] = useState(firstName ? `${firstName} & ` : "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } =
      tab === "create"
        ? await supabase.rpc("create_couple", { couple_name: coupleName.trim() })
        : await supabase.rpc("join_couple", { invite_code: code.trim() });
    setBusy(false);
    if (error) return setError(error.message);
    router.push(tab === "create" ? "/onboarding" : "/profile");
    router.refresh();
  }

  return (
    <div className="py-6">
      <h1 className="font-display text-4xl font-semibold">
        Hi{firstName ? ` ${firstName}` : ""}. Let&apos;s set up the two of you.
      </h1>
      <p className="mt-2 text-muted">One of you creates the couple profile, the other joins with a code.</p>

      <div className="mt-8 inline-flex rounded-full border border-line bg-white p-1">
        {(["create", "join"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError(null); }}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === t ? "bg-ink text-cream" : "text-muted"}`}
          >
            {t === "create" ? "I'm starting" : "I have a code"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="card mt-4 space-y-4">
        {tab === "create" ? (
          <div>
            <label className="label" htmlFor="cname">What should other couples call you?</label>
            <input id="cname" className="field" required minLength={2} maxLength={60}
              placeholder="e.g. Aisha & Rohan" value={coupleName} onChange={(e) => setCoupleName(e.target.value)} />
            <p className="mt-2 text-xs text-muted">You&apos;ll get an invite code for your partner next.</p>
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="code">Invite code from your partner</label>
            <input id="code" className="field font-mono text-lg uppercase tracking-[0.3em]" required maxLength={8}
              placeholder="AB12CD34" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        )}
        {error && <p className="rounded-xl bg-clay/10 px-4 py-2 text-sm text-clay-dark">{error}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? "Please wait…" : tab === "create" ? "Create our couple" : "Join my partner"}
        </button>
      </form>
    </div>
  );
}
