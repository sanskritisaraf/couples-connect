import { requireCouple } from "@/lib/session";
import { ProfileForm } from "./ProfileForm";
import { CopyCode } from "@/components/CopyCode";
import { memberLine } from "@/lib/constants";

export default async function ProfilePage() {
  const { supabase, couple, members, user } = await requireCouple();
  const { data: invite } =
    couple.status === "pending"
      ? await supabase.from("couple_invites").select("code").eq("couple_id", couple.id).maybeSingle()
      : { data: null };
  const me = members.find((m) => m.id === user.id);

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="font-display text-4xl font-semibold">Our profile</h1>
        <p className="mt-1 text-muted">
          {memberLine(members)}
          {couple.status === "pending" && " · waiting for your partner to join"}
        </p>
      </div>
      {invite?.code && (
        <div className="card text-center">
          <p className="text-sm text-muted">Your partner&apos;s invite code</p>
          <CopyCode code={invite.code} />
        </div>
      )}
      <ProfileForm couple={couple} myName={me?.display_name ?? ""} myBirthYear={me?.birth_year ?? null} userId={user.id} />
    </div>
  );
}
