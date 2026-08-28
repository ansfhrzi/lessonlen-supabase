"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import type { SubmitQuizResult } from "@/lib/types/database";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  data?: unknown;
}

async function studentClient() {
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  return { supabase, userId };
}

/** Siswa bergabung ke kelas lewat kode kelas (RPC `join_course`). */
export async function joinCourse(classCode: string): Promise<ActionResult> {
  const { supabase } = await studentClient();

  const code = classCode.trim().toUpperCase();
  if (code.length < 4) return { ok: false, error: "Kode kelas terlalu pendek." };

  const { data, error } = await supabase.rpc("join_course", { p_class_code: code });
  if (error) return { ok: false, error: translateRpcError(error.message) };

  revalidatePath("/student");
  return { ok: true, message: "Berhasil bergabung ke kelas.", data: data as string };
}

/** Siswa mengklaim nama presensi yang diupload guru (RPC `claim_roster`). */
export async function claimRoster(rosterId: string, courseId: string): Promise<ActionResult> {
  const { supabase } = await studentClient();

  const { error } = await supabase.rpc("claim_roster", { p_roster_id: rosterId });
  if (error) return { ok: false, error: translateRpcError(error.message) };

  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}/roster`);
  return { ok: true, message: "Nama Anda berhasil diklaim." };
}

/**
 * Menyerahkan kuis. Penilaian dihitung di server (RPC `submit_quiz`) sehingga
 * kunci jawaban tidak pernah dikirim ke browser.
 */
export async function submitQuiz(input: {
  activity_id: string;
  courseId: string;
  answers: Record<string, string | string[]>;
  client_submission_id: string;
  time_taken_seconds: number;
}): Promise<ActionResult> {
  const { supabase } = await studentClient();

  const { data, error } = await supabase.rpc("submit_quiz", {
    p_activity_id: input.activity_id,
    p_answers: input.answers,
    p_client_submission_id: input.client_submission_id,
    p_time_taken_seconds: input.time_taken_seconds,
    p_started_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: translateRpcError(error.message) };

  revalidatePath(`/student/courses/${input.courseId}`);
  revalidatePath("/student/journal");
  return { ok: true, message: "Kuis terkirim.", data: data as SubmitQuizResult };
}

export async function submitAssignment(input: {
  activity_id: string;
  courseId: string;
  submission_link?: string;
  submission_text?: string;
}): Promise<ActionResult> {
  const { supabase, userId } = await studentClient();

  const link = input.submission_link?.trim() || null;
  const text = input.submission_text?.trim() || null;

  if (!link && !text) {
    return { ok: false, error: "Isi tautan atau teks jawaban terlebih dahulu." };
  }

  const { error } = await supabase.from("assignment_submissions").upsert(
    {
      activity_id: input.activity_id,
      student_id: userId,
      group_id: null,
      submission_link: link,
      submission_text: text,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "activity_id,student_id" },
  );

  if (error) return { ok: false, error: error.message };

  await upsertCompletion(supabase, userId, input.activity_id);
  revalidatePath(`/student/courses/${input.courseId}`);
  return { ok: true, message: "Tugas terkirim." };
}

export async function saveReflection(input: {
  activity_id: string;
  courseId: string;
  reflection_text: string;
  mood_tracker?: string | null;
}): Promise<ActionResult> {
  const { supabase, userId } = await studentClient();

  if (input.reflection_text.trim().length < 20) {
    return { ok: false, error: "Refleksi minimal 20 karakter agar bermakna." };
  }

  const { error } = await supabase.from("reflections").upsert(
    {
      activity_id: input.activity_id,
      student_id: userId,
      reflection_text: input.reflection_text.trim(),
      mood_tracker: input.mood_tracker ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "activity_id,student_id" },
  );

  if (error) return { ok: false, error: error.message };

  await upsertCompletion(supabase, userId, input.activity_id);
  revalidatePath(`/student/courses/${input.courseId}`);
  revalidatePath("/student/journal");
  return { ok: true, message: "Refleksi tersimpan." };
}

export async function markActivityComplete(
  activityId: string,
  courseId: string,
  done = true,
): Promise<ActionResult> {
  const { supabase, userId } = await studentClient();

  if (!done) {
    const { error } = await supabase
      .from("completions")
      .delete()
      .eq("activity_id", activityId)
      .eq("student_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/student/courses/${courseId}`);
    return { ok: true, message: "Status selesai dibatalkan." };
  }

  await upsertCompletion(supabase, userId, activityId);
  revalidatePath(`/student/courses/${courseId}`);
  return { ok: true, message: "Ditandai selesai." };
}

async function upsertCompletion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  activityId: string,
): Promise<void> {
  await supabase
    .from("completions")
    .upsert(
      {
        student_id: userId,
        activity_id: activityId,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "student_id,activity_id", ignoreDuplicates: true },
    );
}

function translateRpcError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid class code")) return "Kode kelas tidak ditemukan.";
  if (lower.includes("roster already claimed")) return "Nama ini sudah diklaim siswa lain.";
  if (lower.includes("already claimed a roster"))
    return "Anda sudah mengklaim satu nama di kelas ini.";
  if (lower.includes("not enrolled")) return "Anda belum bergabung ke kelas ini.";
  if (lower.includes("roster not found")) return "Nama tidak tersedia di daftar presensi.";
  if (lower.includes("forbidden")) return "Anda tidak punya akses ke aktivitas ini.";
  if (lower.includes("quiz not available")) return "Kuis belum dipublikasikan guru.";
  if (lower.includes("only students")) return "Hanya siswa yang bisa memakai fitur ini.";
  return message;
}
