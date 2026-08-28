"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { generateClassCode } from "@/lib/format";
import type {
  Activity,
  ActivityType,
  AssignmentMode,
  QuizDraftQuestion,
} from "@/lib/types/database";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  id?: string;
}

async function teacherClient() {
  const { userId } = await requireRole("teacher");
  const supabase = await createClient();
  return { supabase, userId };
}

async function nextOrderIndex(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "modules" | "activities",
  scope: { column: "course_id" | "module_id"; value: string },
): Promise<number> {
  const { data } = await supabase
    .from(table)
    .select("order_index")
    .eq(scope.column, scope.value)
    .order("order_index", { ascending: false })
    .limit(1);

  const rows = (data ?? []) as { order_index: number }[];
  return rows.length ? Number(rows[0].order_index) + 1 : 0;
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export async function createCourse(input: {
  title: string;
  subject?: string;
  grade_level?: string;
  description?: string;
  year_term?: string;
}): Promise<ActionResult> {
  const { supabase, userId } = await teacherClient();

  if (input.title.trim().length < 3) {
    return { ok: false, error: "Judul kelas minimal 3 karakter." };
  }

  let courseId: string | null = null;
  for (let attempt = 0; attempt < 4 && !courseId; attempt += 1) {
    const classCode = generateClassCode();
    const { data, error } = await supabase
      .from("courses")
      .insert({
        teacher_id: userId,
        title: input.title.trim(),
        subject: input.subject?.trim() || null,
        grade_level: input.grade_level?.trim() || null,
        description: input.description?.trim() || null,
        year_term: input.year_term?.trim() || null,
        class_code: classCode,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") continue; // class_code bentrok, coba lagi
      return { ok: false, error: error.message };
    }
    courseId = (data as { id: string }).id;
  }

  if (!courseId) return { ok: false, error: "Gagal membuat kode kelas. Coba lagi." };

  revalidatePath("/teacher");
  return { ok: true, message: "Kelas dibuat.", id: courseId };
}

export async function updateCourse(
  courseId: string,
  input: {
    title?: string;
    subject?: string;
    grade_level?: string;
    description?: string;
    year_term?: string;
    is_archived?: boolean;
  },
): Promise<ActionResult> {
  const { supabase } = await teacherClient();
  const { error } = await supabase.from("courses").update(input).eq("id", courseId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/teacher");
  revalidatePath(`/teacher/courses/${courseId}`);
  return { ok: true, message: "Perubahan tersimpan." };
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export async function createModule(input: {
  course_id: string;
  title: string;
  description?: string;
}): Promise<ActionResult> {
  const { supabase } = await teacherClient();
  const orderIndex = await nextOrderIndex(supabase, "modules", {
    column: "course_id",
    value: input.course_id,
  });

  const { error } = await supabase.from("modules").insert({
    course_id: input.course_id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    order_index: orderIndex,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${input.course_id}`);
  return { ok: true, message: "Modul ditambahkan." };
}

export async function updateModule(
  moduleId: string,
  input: { title?: string; description?: string | null; is_published?: boolean },
): Promise<ActionResult> {
  const { supabase } = await teacherClient();
  const { error } = await supabase.from("modules").update(input).eq("id", moduleId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/teacher");
  return { ok: true, message: "Modul diperbarui." };
}

export async function deleteModule(moduleId: string, courseId: string): Promise<ActionResult> {
  const { supabase } = await teacherClient();
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${courseId}`);
  return { ok: true, message: "Modul dihapus." };
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export async function createActivity(input: {
  module_id: string;
  courseId: string;
  title: string;
  type: ActivityType;
  description?: string;
  content_markdown?: string;
  assignment_mode?: AssignmentMode;
  reflection_prompt?: string;
  due_at?: string | null;
}): Promise<ActionResult> {
  const { supabase } = await teacherClient();
  const orderIndex = await nextOrderIndex(supabase, "activities", {
    column: "module_id",
    value: input.module_id,
  });

  const { data, error } = await supabase
    .from("activities")
    .insert({
      module_id: input.module_id,
      title: input.title.trim(),
      type: input.type,
      description: input.description?.trim() || null,
      content_markdown: input.content_markdown?.trim() || null,
      assignment_mode: input.type === "assignment" ? (input.assignment_mode ?? "individual") : null,
      reflection_prompt: input.type === "reflection" ? input.reflection_prompt?.trim() || null : null,
      order_index: orderIndex,
      due_at: input.due_at || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${input.courseId}`);
  revalidatePath(`/teacher/courses/${input.courseId}/modules/${input.module_id}`);
  return { ok: true, message: "Aktivitas dibuat.", id: (data as { id: string }).id };
}

export async function updateActivity(
  activityId: string,
  courseId: string,
  moduleId: string,
  input: Partial<
    Pick<
      Activity,
      | "title"
      | "description"
      | "content_markdown"
      | "reflection_prompt"
      | "assignment_mode"
      | "due_at"
      | "is_published"
    >
  >,
): Promise<ActionResult> {
  const { supabase } = await teacherClient();
  const { error } = await supabase.from("activities").update(input).eq("id", activityId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${courseId}/modules/${moduleId}`);
  revalidatePath(`/teacher/courses/${courseId}`);
  return { ok: true, message: "Aktivitas diperbarui." };
}

export async function deleteActivity(
  activityId: string,
  courseId: string,
  moduleId: string,
): Promise<ActionResult> {
  const { supabase } = await teacherClient();
  const { error } = await supabase.from("activities").delete().eq("id", activityId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${courseId}/modules/${moduleId}`);
  revalidatePath(`/teacher/courses/${courseId}`);
  return { ok: true, message: "Aktivitas dihapus." };
}

// ---------------------------------------------------------------------------
// Quiz questions (hasil AI disetujui guru dulu, baru disimpan di sini)
// ---------------------------------------------------------------------------

export async function saveQuizQuestions(input: {
  activity_id: string;
  courseId: string;
  moduleId: string;
  questions: QuizDraftQuestion[];
  replace: boolean;
}): Promise<ActionResult> {
  const { supabase } = await teacherClient();

  if (!input.questions.length) return { ok: false, error: "Belum ada soal untuk disimpan." };

  const rows = input.questions.map((question) => ({
    activity_id: input.activity_id,
    question_type: question.question_type,
    question_text: question.question_text,
    options: question.options,
    correct_keys: question.correct_keys,
    explanation: question.explanation,
    points: question.points,
    difficulty: question.difficulty ?? null,
    bloom_taxonomy: question.bloom_taxonomy ?? null,
    source_ref: "ai-gemini",
    is_active: true,
  }));

  if (input.replace) {
    const { error } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("activity_id", input.activity_id);
    if (error) return { ok: false, error: error.message };
  }

  const { error } = await supabase.from("quiz_questions").insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${input.courseId}/modules/${input.moduleId}`);
  return { ok: true, message: `${rows.length} soal tersimpan di bank soal.` };
}

export async function deleteQuizQuestion(
  questionId: string,
  activityId: string,
  courseId: string,
  moduleId: string,
): Promise<ActionResult> {
  const { supabase } = await teacherClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${courseId}/modules/${moduleId}`);
  return { ok: true, message: "Soal dihapus." };
}

// ---------------------------------------------------------------------------
// Roster (preset name)
// ---------------------------------------------------------------------------

export async function addRosterNames(input: {
  course_id: string;
  names: string;
}): Promise<ActionResult> {
  const { supabase } = await teacherClient();

  const names = input.names
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!names.length) return { ok: false, error: "Daftar nama masih kosong." };

  const { data: existing } = await supabase
    .from("class_rosters")
    .select("sort_order")
    .eq("course_id", input.course_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const startOrder = ((existing ?? []) as { sort_order: number }[]).length
    ? Number(((existing ?? []) as { sort_order: number }[])[0].sort_order) + 1
    : 0;

  const rows = names.map((name, index) => ({
    course_id: input.course_id,
    full_name: name,
    sort_order: startOrder + index,
  }));

  const { error } = await supabase
    .from("class_rosters")
    .upsert(rows, { onConflict: "course_id,full_name", ignoreDuplicates: true });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${input.course_id}/roster`);
  return { ok: true, message: `${rows.length} nama diproses (nama duplikat dilewati).` };
}

export async function deleteRoster(
  rosterId: string,
  courseId: string,
): Promise<ActionResult> {
  const { supabase } = await teacherClient();
  const { error } = await supabase.from("class_rosters").delete().eq("id", rosterId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${courseId}/roster`);
  return { ok: true, message: "Nama dihapus." };
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

export async function gradeAssignment(input: {
  submission_id: string;
  activityId: string;
  courseId: string;
  grade: number;
  feedback?: string;
  ai_feedback?: string;
}): Promise<ActionResult> {
  const { supabase } = await teacherClient();

  const { error } = await supabase
    .from("assignment_submissions")
    .update({
      grade: input.grade,
      feedback: input.feedback?.trim() || null,
      ai_feedback: input.ai_feedback?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.submission_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/teacher/courses/${input.courseId}/activities/${input.activityId}/submissions`);
  revalidatePath(`/teacher/courses/${input.courseId}/gradebook`);
  return { ok: true, message: "Nilai tersimpan." };
}
