"use client";

import { functionsBaseUrl } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

export type EdgeCallResult<T> =
  | { ok: true; data: T; usage?: { used: number; limit: number } }
  | { ok: false; error: string; status: number };

/**
 * Memanggil Supabase Edge Function dari browser dengan JWT user yang sedang
 * login. API key Gemini tidak pernah menyentuh client.
 */
export async function callEdgeFunction<T>(
  functionName: string,
  body: unknown,
): Promise<EdgeCallResult<T>> {
  if (!functionsBaseUrl) {
    return {
      ok: false,
      status: 0,
      error:
        "NEXT_PUBLIC_SUPABASE_URL belum diisi, jadi Edge Function tidak bisa dipanggil.",
    };
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let response: Response;
  try {
    response = await fetch(`${functionsBaseUrl}/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    return { ok: false, status: 0, error: "Gagal terhubung ke Edge Function (jaringan/CORS)." };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `Edge Function membalas status ${response.status}`;
    return { ok: false, status: response.status, error: message };
  }

  if (!payload || typeof payload !== "object") {
    return { ok: false, status: response.status, error: "Response Edge Function tidak dikenali." };
  }

  // Generator AI memakai amplop { ok, feature, usage, data }.
  // `setup-teacher` memakai bentuk { ok, school } — jadi bila tidak ada `data`,
  // seluruh payload diperlakukan sebagai hasilnya.
  const envelope = payload as { data?: T; usage?: { used: number; limit: number } };
  const data = ("data" in envelope ? envelope.data : (payload as T)) as T;

  if (data === undefined || data === null) {
    return { ok: false, status: response.status, error: "Response Edge Function kosong." };
  }

  return { ok: true, data, usage: envelope.usage };
}
