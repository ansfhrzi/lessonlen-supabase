// Helper integrasi Google Gemini API untuk Supabase Edge Functions.
//
// Menggunakan SDK resmi: @google/genai
//   https://ai.google.dev/gemini-api/docs/sdks
//
// Semua pemanggilan AI dilakukan di SERVER (Edge Function), sehingga
// GEMINI_API_KEY tidak pernah terlihat oleh browser.

import { GoogleGenAI } from "npm:@google/genai";
import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_MODEL = "gemini-2.5-flash";

function getClient() {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY secret");
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Ambil JSON dari Gemini. Semua prompt ke Gemini meminta `application/json`,
 * lalu kita validasi dengan zod.
 */
export async function generateJson<T>(
  systemPrompt: string,
  userPrompt: string,
  options: { model?: string; temperature?: number; maxOutputTokens?: number } = {},
): Promise<{ data: T; usage: { promptTokens: number; completionTokens: number } }> {
  const client = getClient();
  const model = options.model ?? DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.6;
  const maxOutputTokens = options.maxOutputTokens ?? 4096;

  const response = await client.models.generateContent({
    model,
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Saya siap membantu. Kirimkan input berikutnya." }] },
      { role: "user", parts: [{ text: userPrompt }] },
    ],
    config: {
      responseMimeType: "application/json",
      temperature,
      maxOutputTokens,
    },
  });

  const text = response.text ?? "";
  const data = JSON.parse(text) as T;

  const usage = {
    promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
  };

  return { data, usage };
}

/**
 * Simpan log AI + cek kuota harian.
 * Menggunakan tabel `ai_generations` yang sudah dibuat di migrasi.
 */
export async function logAiGeneration(input: {
  teacher_id: string;
  course_id: string | null;
  feature_type: string;
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  status?: "ok" | "error";
}) {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { error } = await admin.from("ai_generations").insert({
    teacher_id: input.teacher_id,
    course_id: input.course_id,
    feature_type: input.feature_type,
    model_name: input.model_name,
    prompt_tokens: input.prompt_tokens,
    completion_tokens: input.completion_tokens,
    status: input.status ?? "ok",
  });

  if (error) {
    console.error("logAiGeneration error:", error);
  }
}

/**
 * Cek kuota AI harian. Default 50 kali / guru / 24 jam.
 */
export async function checkAiQuota(teacher_id: string) {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const limit = parseInt(Deno.env.get("AI_DAILY_LIMIT") ?? "50", 10);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await admin
    .from("ai_generations")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", teacher_id)
    .gte("created_at", since);

  if (error) {
    console.error("checkAiQuota error:", error);
    return { ok: true, used: 0, limit };
  }

  const used = count ?? 0;
  return { ok: used < limit, used, limit };
}

/**
 * Ekstrak daftar teks dari semua materi di dalam modul.
 * Ini dipakai sebagai "context injection" saat generate kuis.
 */
export async function getModuleContext(course_id: string, module_id: string) {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: module } = await admin
    .from("modules")
    .select("id, title, description")
    .eq("id", module_id)
    .eq("course_id", course_id)
    .single();

  if (!module) return null;

  const { data: activities } = await admin
    .from("activities")
    .select("id, title, type, content_markdown, description")
    .eq("module_id", module_id)
    .order("order_index", { ascending: true });

  const lessons = (activities ?? [])
    .filter((a) => a.type === "lesson" && a.content_markdown)
    .map((a) => `[${a.title}]\n${a.content_markdown}`);

  const content =
    `${module.description ?? ""}\n\n${lessons.join("\n\n---\n\n")}`.trim();

  return {
    module,
    activities: activities ?? [],
    content,
  };
}
