import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Menangani:
 *  - redirect OAuth Google (`?code=`)
 *  - konfirmasi email (`?token_hash=` & `?type=`)
 *
 * Setelah session terbentuk, user diarahkan ke ruang sesuai role-nya.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=oauth`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email",
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=verify`);
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing-code`);
  }

  if (next && next.startsWith("/")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = "/student";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    destination = (profile as { role?: string } | null)?.role === "teacher" ? "/teacher" : "/student";
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
