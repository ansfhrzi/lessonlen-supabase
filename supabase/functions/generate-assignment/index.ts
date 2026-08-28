// Edge Function: generate-assignment
// Guru memilih mode (individual/group), topik, dan indikator pencapaian.
// Gemini menghasilkan draft instruksi tugas + rubrik penilaian.

import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireTeacher, assertCourseTeacher } from "../_shared/auth.ts";
import { checkAiQuota, generateJson, logAiGeneration } from "../_shared/ai.ts";

const schema = z.object({
  course_id: z.string().uuid().optional(),
  assignment_mode: z.enum(["individual", "group"]).default("individual"),
  topic: z.string().min(2),
  learning_indicator: z.string().optional(),
  extra_instructions: z.string().optional(),
});

const outputSchema = z.object({
  title: z.string(),
  objective: z.string(),
  instructions: z.array(z.string()),
  rubric: z.array(
    z.object({
      criteria: z.string(),
      description: z.string(),
      max_score: z.number().int().min(1),
    }),
  ),
  submission_guidelines: z.string(),
  group_roles: z.array(z.string()).optional(),
  tips_for_students: z.array(z.string()).optional(),
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
Anda adalah guru yang terbiasa menyusun tugas yang efektif dan menantang.
Buat tugas dengan instruksi yang jelas, dapat dinilai, dan sesuai indikator pencapaian.
Untuk tugas kelompok, sertakan pembagian peran kolaboratif.
Balas hanya dengan JSON valid sesuai skema berikut:
{
  "title": string,
  "objective": string,
  "instructions": string[],
  "rubric": [{ "criteria": string, "description": string, "max_score": number }],
  "submission_guidelines": string,
  "group_roles": string[],
  "tips_for_students": string[]
}
`;

    const userPrompt = `
Mode tugas: ${input.assignment_mode}
Topik: ${input.topic}
Indikator pencapaian: ${input.learning_indicator ?? "umum sesuai topik"}
${input.extra_instructions ? `Instruksi tambahan: ${input.extra_instructions}` : ""}
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
      feature_type: "assignment",
      model_name: "gemini-2.5-flash",
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      status: "ok",
    });

    return json({
      ok: true,
      feature: "assignment",
      usage: { used: quota.used + 1, limit: quota.limit },
      data: output,
    });
  } catch (err) {
    const message = normalizeError(err);
    console.error("generate-assignment error:", err);
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
