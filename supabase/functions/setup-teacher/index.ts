// Edge Function: setup-teacher
//
// Fungsi khusus untuk mempromosikan user menjadi GURU dengan aman.
// Ini dipanggil dari SERVER saat guru mendaftar dan memasukkan kode lisensi
// sekolah yang valid. Client tidak boleh langsung mengubah role = teacher.
//
// Input:
//   license_code: string (mis. "SCHOOL-0001")
//
// Prasyarat:
//   - User harus sudah login (JWT valid)
//   - Tabel schools harus sudah berisi baris dengan license_code tersebut

import { z } from "npm:zod@3";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getUserFromRequest } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const schema = z.object({
  license_code: z.string().min(3).max(50),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCors(req);

  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const input = schema.parse(body);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: school, error: schoolError } = await admin
      .from("schools")
      .select("id, name")
      .eq("license_code", input.license_code.trim())
      .eq("is_active", true)
      .single();

    if (schoolError || !school) {
      return json({ error: "Invalid school license code" }, 404);
    }

    // Promosikan role + hubungkan ke sekolah.
    // Full name tetap bisa diisi dari metadata user.
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        role: "teacher",
        school_id: school.id,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("setup-teacher update error:", updateError);
      return json({ error: "Failed to update profile" }, 500);
    }

    return json({
      ok: true,
      school: school,
    });
  } catch (err) {
    const message = err instanceof z.ZodError ? "Invalid input" : err instanceof Error ? err.message : "Internal error";
    console.error("setup-teacher error:", err);
    return json({ error: message }, 400);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
