// Edge Function: generate-grading (AI Grading Assistant)
//
// PENTING: AI hanya memberi DRAFT nilai + umpan balik berdasarkan TEKS yang
// siswa tempel. AI TIDAK bisa membuka link Google Drive/GitHub/Notion dengan
// aman, jadi fungsi ini hanya menerima `submission_text`.
//
// Jika siswa hanya mengumpulkan link, guru tetap menilai manual / pakai
// checklist rubrik yang diberikan AI.

import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireTeacher } from "../_shared/auth.ts";
import { checkAiQuota, generateJson, logAiGeneration } from "../_shared/ai.ts";

const schema = z.object({
  student_text: z.string().min(20, "Student text is too short"),
  rubric: z.array(
    z.object({
      criteria: z.string(),
      description: z.string(),
      max_score: z.number().int().min(1),
    }),
  ).min(1),
  max_grade: z.number().min(1).default(100),
  course_id: z.string().uuid().optional(),
});

const outputSchema = z.object({
  draft_grade: z.number().min(0).max(100),
  per_criteria_score: z.array(
    z.object({
      criteria: z.string(),
      score: z.number(),
      max_score: z.number(),
      comment: z.string(),
    }),
  ),
  feedback: z.string(),
  suggestions: z.array(z.string()),
  rubrics_checklist: z.array(z.string()),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCors(req);

  try {
    const { teacher } = await requireTeacher(req);

    const body = await req.json();
    const input = schema.parse(body);

    const quota = await checkAiQuota(teacher.id);
    if (!quota.ok) {
      return json(
        { error: "Daily AI quota exceeded", used: quota.used, limit: quota.limit },
        429,
      );
    }

    const rubricText = input.rubric
      .map((r) => `- ${r.criteria} (max ${r.max_score}): ${r.description}`)
      .join("\n");

    const systemPrompt = `
Anda adalah guru senior yang membantu menilai tugas siswa dengan adil dan konstruktif.
Berikan DRAFT nilai berdasarkan rubrik yang diberikan, bukan keputusan akhir.
Umpan balik harus mendorong perbaikan, jelas, dan spesifik.
Balas hanya dengan JSON valid sesuai skema berikut:
{
  "draft_grade": number (0-100),
  "per_criteria_score": [{ "criteria": string, "score": number, "max_score": number, "comment": string }],
  "feedback": string,
  "suggestions": string[],
  "rubrics_checklist": string[]
}
`;

    const userPrompt = `
Rubrik:
${rubricText}

Jawaban siswa:
"""${input.student_text.slice(0, 8000)}"""

Beri draf nilai dalam skala ${input.max_grade}.
`;

    const { data, usage } = await generateJson(
      systemPrompt,
      userPrompt,
      { temperature: 0.3, maxOutputTokens: 4096 },
    );

    const output = outputSchema.parse(data);

    await logAiGeneration({
      teacher_id: teacher.id,
      course_id: input.course_id ?? null,
      feature_type: "grading",
      model_name: "gemini-2.5-flash",
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      status: "ok",
    });

    return json({
      ok: true,
      feature: "grading",
      note: "Draf nilai. Guru harus meninjau & menentukan nilai akhir.",
      usage: { used: quota.used + 1, limit: quota.limit },
      data: output,
    });
  } catch (err) {
    const message = normalizeError(err);
    console.error("generate-grading error:", err);
    if (message === "AUTH_REQUIRED") return json({ error: "Unauthorized" }, 401);
    if (message === "NOT_TEACHER") return json({ error: "Teacher only" }, 403);
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
