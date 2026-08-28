import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/lib/config";

/**
 * Klien Supabase untuk Server Component, Server Action, dan Route Handler.
 * Selalu dibuat baru per request agar session tidak bocor antar user.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Dipanggil dari Server Component. Penyegaran token sudah ditangani
          // oleh proxy.ts, jadi kegagalan menulis cookie di sini aman diabaikan.
        }
      },
    },
  });
}
