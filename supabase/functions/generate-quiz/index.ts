// Edge Function: generate-quiz
// Guru memilih module_id (bab) dan Gemini membuat draft soal berdasarkan
// konten materi bab tersebut (context injection + structured JSON output).
//
// PENTING: fungsi ini HANYA menghasilkan DRAFT soal untuk di-review guru.
// Guru tetap menyimpan resmi ke `quiz_questions` dari frontend setelah review.

import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireTeacher, assertCourseTeacher } from "../_shared/auth.ts";
import {
  checkAiQuota,
  generateJson,
  getModuleContext,
  logAiGeneration,
} from "../_shared/ai.ts";

const schema = z.object({
  course_id: z.string().uuid(),
  module_id: z.string().uuid(),
  count: z.number().int().min(3).max(30).default(10),
  bloom_taxonomy: z
    .enum(["remember", "understand", "apply", "analyze", "evaluate", "create"])
    .default("understand"),
  question_type: z.enum(["single", "multiple"]).default("single"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  extra_instructions: z.string().optional(),
});

const optionSchema = z.object({
  key: z.string().regex(/^[A-Z]$/),
  text: z.string().min(2),
});

const questionSchema = z.object({
  question_type: z.enum(["single", "multiple"]),
  question_text: z.string().min(10),
  options: z.array(optionSchema).min(2).max(5),
  correct_keys: z.array(z.string().regex(/^[A-Z]$/)),
  explanation: z.string(),
  points: z.number().int().min(1).max(100).default(10),
  difficulty: z.string().optional(),
  bloom_taxonomy: z.string().optional(),
});

const outputSchema = z.object({
  questions: z.array(questionSchema),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCors(req);

  try {
    const { teacher } = await requireTeacher(req);

    const body = await req.json();
    const input = schema.parse(body);

    await assertCourseTeacher(teacher.id, input.course_id);

    const quota = await checkAiQuota(teacher.id);
    if (!quota.ok) {
      return json(
        { error: "Daily AI quota exceeded", used: quota.used, limit: quota.limit },
        429,
      );
    }

    // Context injection: ambil seluruh teks materi dari bab/modul terkait.
    const context = await getModuleContext(input.course_id, input.module_id);
    if (!context || !context.content) {
      return json(
        { error: "Module has no material. Add a lesson first or provide context." },
        400,
      );
    }

    const systemPrompt = `
Anda adalah penyusun soal evaluasi sekolah yang teliti.
Soal harus 100% bersumber dari konteks materi yang diberikan.
Sajikan soal pilihan ganda dalam Bahasa Indonesia.
Untuk setiap soal: berikan 1 jawaban benar (single) atau beberapa jawaban benar (multiple),
serta pengecoh logis. Sertakan pembahasan singkat.
Balas hanya dengan JSON valid sesuai skema berikut:
{
  "questions": [
    {
      "question_type": "single" | "multiple",
      "question_text": string,
      "options": [{ "key": "A", "text": string }, ...],
      "correct_keys": ["A"],
      "explanation": string,
      "points": number,
      "difficulty": "easy" | "medium" | "hard",
      "bloom_taxonomy": "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create"
    }
  ]
}
`;

    const userPrompt = `
Konteks materi bab (${context.module.title}):
"""${context.content.slice(0, 9000)}"""

Jumlah soal: ${input.count}
Jenis soal: ${input.question_type}
Tingkat Bloom: ${input.bloom_taxonomy}
Kesulitan: ${input.difficulty}
${input.extra_instructions ? `Instruksi tambahan: ${input.extra_instructions}` : ""}

Jangan membuat soal yang jawabannya tidak ada di dalam konteks.
Jika konteks kurang, kurangi jumlah soal dan beri soal yang benar-benar didukung konteks.
`;

    const { data, usage } = await generateJson(
      systemPrompt,
      userPrompt,
      { temperature: 0.5, maxOutputTokens: 8192 },
    );

    const output = outputSchema.parse(data);

    await logAiGeneration({
      teacher_id: teacher.id,
      course_id: input.course_id,
      feature_type: "quiz",
      model_name: "gemini-2.5-flash",
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      status: "ok",
    });

    return json({
      ok: true,
      feature: "quiz",
      sourceModuleId: input.module_id,
      usage: { used: quota.used + 1, limit: quota.limit },
      data: output,
    });
  } catch (err) {
    const message = normalizeError(err);
    console.error("generate-quiz error:", err);
    if (message === "AUTH_REQUIRED") return json({ error: "Unauthorized" }, 401);
    if (message === "NOT_TEACHER") return json({ error: "Teacher only" }, 403);
    if (message === "COURSE_NOT_FOUND") return json({ error: "Course not found" }, 404);
    if (message === "NOT_COURSE_TEACHER") return json({ error: "Forbidden" }, 403);
    return json({ error: message }, 400);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeError(err: unknown): string {
  if (err instanceof z.ZodError) return "Invalid input";
  if (err instanceof Error) return err.message;
  return "Internal error";
}
