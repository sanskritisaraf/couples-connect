"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "link" ? "That link has expired or was already used. Try signing in." : null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const rawNext = params.get("next") || (params.get("join") ? "/onboarding?join=1" : "/discover");
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/discover";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setBusy(false);
      if (error) return setError(error.message);
      if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setNotice(`Check ${email} for a confirmation link, then come back here.`);
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card w-full space-y-4">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "signup"
            ? "Each partner gets their own login. You'll link up with an invite code next."
            : "Sign in to see couples near you."}
        </p>
      </div>

      {mode === "signup" && (
        <div>
          <label className="label" htmlFor="name">Your first name</label>
          <input id="name" className="field" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="field" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password" type="password" className="field" required minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="rounded-xl bg-clay/10 px-4 py-2 text-sm text-clay-dark">{error}</p>}
      {notice && <p className="rounded-xl bg-sage/10 px-4 py-2 text-sm text-sage">{notice}</p>}

      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy ? "Please wait…" : mode === "signup" ? "Sign up" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
        <button type="button" className="font-semibold text-clay underline-offset-4 hover:underline"
          onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); setNotice(null); }}>
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </form>
  );
}
