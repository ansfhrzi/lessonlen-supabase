// Edge Function: generate-reflection
// Guru menentukan fokus refleksi (pemahaman konsep / kesulitan teknis /
// keterkaitan dunia nyata), kemudian Gemini membuat pertanyaan pemicu terbuka
// untuk refleksi Deep Learning siswa + rekomendasi mood tracker.

import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireTeacher, assertCourseTeacher } from "../_shared/auth.ts";
import { checkAiQuota, generateJson, logAiGeneration } from "../_shared/ai.ts";

const schema = z.object({
  course_id: z.string().uuid().optional(),
  focus: z
    .enum(["concept", "technical", "real_world", "metacognition"])
    .default("concept"),
  topic: z.string().min(2),
  question_count: z.number().int().min(1).max(5).default(3),
  extra_instructions: z.string().optional(),
});

const outputSchema = z.object({
  questions: z.array(z.string()),
  mood_options: z.array(z.string()),
  teacher_note: z.string().optional(),
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
Anda adalah guru yang sangat paham pembelajaran mendalam (deep learning) dan refleksi metakognitif.
Buat pertanyaan refleksi terbuka yang mendorong siswa berpikir kritis, jujur, dan berhubungan dengan dunia nyata.
Pertanyaan harus memancing jawaban panjang, bukan jawaban "ya/tidak".
Balas hanya dengan JSON valid sesuai skema berikut:
{
  "questions": string[],
  "mood_options": string[],
  "teacher_note": string
}
`;

    const userPrompt = `
Fokus refleksi: ${input.focus}
Topik: ${input.topic}
Jumlah pertanyaan: ${input.question_count}
${input.extra_instructions ? `Instruksi tambahan: ${input.extra_instructions}` : ""}
`;

    const { data, usage } = await generateJson(
      systemPrompt,
      userPrompt,
      { temperature: 0.8, maxOutputTokens: 2048 },
    );

    const output = outputSchema.parse(data);

    await logAiGeneration({
      teacher_id: teacher.id,
      course_id: input.course_id ?? null,
      feature_type: "reflection",
      model_name: "gemini-2.5-flash",
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      status: "ok",
    });

    return json({
      ok: true,
      feature: "reflection",
      usage: { used: quota.used + 1, limit: quota.limit },
      data: output,
    });
  } catch (err) {
    const message = normalizeError(err);
    console.error("generate-reflection error:", err);
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
