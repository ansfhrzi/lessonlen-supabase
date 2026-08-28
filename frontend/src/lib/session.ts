import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/types/database";

export interface SessionContext {
  userId: string;
  profile: Profile;
}

/** Ambil user + profil. Return null bila belum login atau profil belum dibuat. */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, schools ( name )")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { userId: user.id, profile: {
      id: user.id,
      full_name: user.email ?? "Pengguna",
      role: "student",
      whatsapp_number: null,
      school_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } };
  }

  return { userId: user.id, profile: profile as Profile };
}

/** Wajib login. Redirect ke /login bila belum ada session. */
export async function requireSession(next?: string): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) {
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  return context;
}

/** Wajib role tertentu. Redirect ke halaman role-nya sendiri bila tidak cocok. */
export async function requireRole(role: AppRole, next?: string): Promise<SessionContext> {
  const context = await requireSession(next);

  if (context.profile.role !== role) {
    redirect(context.profile.role === "teacher" ? "/teacher" : "/student");
  }

  return context;
}
