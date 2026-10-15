import Link from "next/link";
import { getSession } from "@/lib/session";
import { Onboarding } from "./Onboarding";
import { CopyCode } from "@/components/CopyCode";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>;
}) {
  const { supabase, couple, profile, members } = await getSession();
  const { join } = await searchParams;

  if (!couple) {
    return <Onboarding firstName={profile?.display_name ?? ""} startWithJoin={join === "1"} />;
  }

  const { data: invite } = await supabase
    .from("couple_invites")
    .select("code")
    .eq("couple_id", couple.id)
    .maybeSingle();

  if (couple.status === "pending") {
    return (
      <div className="space-y-6 py-6">
        <div className="card text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">Step 2 of 2</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Invite your partner</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Ask them to sign up, choose <b>&ldquo;My partner invited me&rdquo;</b> and enter this code.
            {" "}{couple.name} goes live once you&apos;ve both joined.
          </p>
          {invite?.code && <CopyCode code={invite.code} />}
        </div>
        <div className="card flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted">Meanwhile, fill in your interests so you&apos;re ready to match.</p>
          <Link href="/profile" className="btn-primary">Build our profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card my-6 text-center">
      <h1 className="font-display text-3xl font-semibold">You&apos;re all set 🎉</h1>
      <p className="mt-2 text-sm text-muted">
        {members.map((m) => m.display_name).join(" & ")} are live as {couple.name}.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/profile" className="btn-ghost">Edit profile</Link>
        <Link href="/discover" className="btn-primary">Discover couples</Link>
      </div>
    </div>
  );
}
