// Helper autentikasi & otorisasi untuk Edge Functions.
//
// Semua Edge Function yang memakai file ini akan:
//   1. Membaca JWT dari header Authorization
//   2. Mendapatkan user dari Supabase Auth
//   3. Mengecek role = 'teacher' di tabel profiles
//   4. (Opsional) Mengecek apakah guru tersebut pengampu course tertentu

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

// UI: prioritas dukung key baru Supabase, tapi fallback ke legacy key jadul.
// - Baru: SB_PUBLISHABLE_KEY (sb_publishable_...)  <-> ganti anon
// - Baru: SUPABASE_SECRET_KEY (sb_secret_...)        <-> ganti service_role
// - Lama: SUPABASE_ANON_KEY                          <-> anon (eyJ...)
// - Lama: SUPABASE_SERVICE_ROLE_KEY                  <-> service_role (eyJ...)
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export type TeacherProfile = {
  id: string;
  full_name: string;
  school_id: string | null;
};

export type AuthResult = {
  user: any;
  teacher: TeacherProfile;
};

/**
 * Mendapatkan user dari header Authorization.
 * Kembali null kalau tidak ada token / token invalid.
 */
export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

/**
 * Wajib user = guru. Kalau bukan guru, lempar error dengan pesan yang jelas.
 */
export async function requireTeacher(req: Request): Promise<AuthResult> {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, full_name, school_id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  if (profile.role !== "teacher") {
    throw new Error("NOT_TEACHER");
  }

  return {
    user,
    teacher: {
      id: profile.id,
      full_name: profile.full_name,
      school_id: profile.school_id,
    },
  };
}

/**
 * Wajib guru tersebut adalah pengampu course_id yang dikirim.
 */
export async function assertCourseTeacher(
  teacher_id: string,
  course_id: string,
) {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: course, error } = await admin
    .from("courses")
    .select("id, teacher_id")
    .eq("id", course_id)
    .single();

  if (error || !course) {
    throw new Error("COURSE_NOT_FOUND");
  }
  if (course.teacher_id !== teacher_id) {
    throw new Error("NOT_COURSE_TEACHER");
  }
}
