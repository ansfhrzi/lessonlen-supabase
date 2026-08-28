"use client";

import { createBrowserClient } from "@supabase/ssr";
import { functionsBaseUrl, supabaseAnonKey, supabaseUrl } from "@/lib/config";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Klien Supabase untuk komponen client (React). */
export function createClient() {
  if (client) return client;
  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}

export { functionsBaseUrl };
