// Edge Function: generate-material
// Guru memberikan topik + tingkat kelas, dan Gemini membuat draf materi
// terstruktur (Pengenalan, Konsep Utama, Contoh Kasus, Kesimpulan).
//
// Alur:
//   - Cek JWT + role teacher
//   - (Opsional) cek kepemilikan course
//   - Cek kuota AI
//   - Kirim prompt ke Gemini (JSON output)
//   - Simpan log ke `ai_generations`
//   - Return JSON ke guru untuk di-review

import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireTeacher, assertCourseTeacher } from "../_shared/auth.ts";
import {
  checkAiQuota,
  generateJson,
  logAiGeneration,
} from "../_shared/ai.ts";

const schema = z.object({
  topic: z.string().min(2).describe("Topik/bab materi"),
  grade_level: z.string().optional(),
  course_id: z.string().uuid().optional(),
  extra_instructions: z.string().optional(),
});

const outputSchema = z.object({
  title: z.string(),
  learning_objectives: z.array(z.string()),
  introduction: z.string(),
  key_concepts: z.array(
    z.object({
      concept: z.string(),
      explanation: z.string(),
    }),
  ),
  real_world_example: z.string(),
  conclusion: z.string(),
  study_questions: z.array(z.string()).optional(),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCors(req);

  try {
    const { teacher } = await requireTeacher(req);

    const body = await req.json();
    const input = schema.parse(body);

    if (input.course_id) {
      await assertCourseTeacher(teacher.id, input.course_id);
    }

    const quota = await checkAiQuota(teacher.id);
    if (!quota.ok) {
      return json(
        { error: "Daily AI quota exceeded", used: quota.used, limit: quota.limit },
        429,
      );
    }

    const systemPrompt = `
Anda adalah guru senior yang membantu menyusun materi pembelajaran dalam Bahasa Indonesia.
Buat materi yang jelas, benar, sesuai kurikulum, dan mudah dipahami siswa.
Selalu balas hanya dengan JSON valid yang cocok dengan skema berikut:
{
  "title": string,
  "learning_objectives": string[],
  "introduction": string,
  "key_concepts": [{ "concept": string, "explanation": string }],
  "real_world_example": string,
  "conclusion": string,
  "study_questions": string[]
}
`;

    const userPrompt = `
Topik: ${input.topic}
Tingkat kelas: ${input.grade_level ?? "umum"}
${input.extra_instructions ? `Instruksi tambahan: ${input.extra_instructions}` : ""}

Buat draf materi lengkap. Gunakan bahasa yang mudah dipahami. Jangan mengarang fakta yang tidak pasti.
`;

    const { data, usage } = await generateJson(
      systemPrompt,
      userPrompt,
      { temperature: 0.7, maxOutputTokens: 4096 },
    );
    const output = outputSchema.parse(data);

    await logAiGeneration({
      teacher_id: teacher.id,
      course_id: input.course_id ?? null,
      feature_type: "material",
      model_name: "gemini-2.5-flash",
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      status: "ok",
    });

    return json({
      ok: true,
      feature: "material",
      usage: { used: quota.used + 1, limit: quota.limit },
      data: output,
    });
  } catch (err) {
    const message = normalizeError(err);
    console.error("generate-material error:", err);
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
