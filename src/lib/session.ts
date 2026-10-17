import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Couple, Profile } from "@/lib/types";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, couple_id, birth_year")
    .eq("id", user.id)
    .single<Profile>();

  let couple: Couple | null = null;
  let members: Profile[] = [];
  if (profile?.couple_id) {
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from("couples").select("*").eq("id", profile.couple_id).single<Couple>(),
      supabase.from("profiles").select("id, display_name, couple_id, birth_year").eq("couple_id", profile.couple_id),
    ]);
    couple = c;
    members = (m as Profile[]) ?? [];
  }
  return { supabase, user, profile, couple, members };
}

/** For pages that need a couple to exist. Sends people without one to onboarding. */
export async function requireCouple() {
  const s = await getSession();
  if (!s.couple) redirect("/onboarding");
  return { ...s, couple: s.couple };
}
