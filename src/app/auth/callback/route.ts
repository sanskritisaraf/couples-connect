import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/discover";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/discover";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  // The email is already confirmed by Supabase before it redirects here. If the link was opened
  // on a different device or browser, the session can't be created, so just ask them to sign in.
  return NextResponse.redirect(`${origin}/login?confirmed=1&next=${encodeURIComponent(next)}`);
}
