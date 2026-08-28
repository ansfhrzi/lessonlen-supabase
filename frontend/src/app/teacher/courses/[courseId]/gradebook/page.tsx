import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, Stat } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import type { Activity } from "@/lib/types/database";

interface StudentRow {
  id: string;
  name: string;
  quizScores: Map<string, number>;
  assignmentGrades: Map<string, number | null>;
  completed: number;
}

export default async function TeacherGradebookPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { userId } = await requireRole("teacher");
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .eq("teacher_id", userId)
    .maybeSingle();

  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, order_index, activities ( id, title, type, order_index )")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  type ModuleWithActivities = {
    id: string;
    title: string;
    activities?: Pick<Activity, "id" | "title" | "type" | "order_index">[];
  };

  const activities = ((modules ?? []) as ModuleWithActivities[])
    .flatMap((item) => item.activities ?? [])
    .sort((a, b) => a.order_index - b.order_index);

  const quizActivities = activities.filter((item) => item.type === "quiz");
  const assignmentActivities = activities.filter((item) => item.type === "assignment");
  const activityIds = activities.map((item) => item.id);

  const [{ data: enrollments }, { data: quizSubs }, { data: assignmentSubs }, { data: completions }] =
    await Promise.all([
      supabase
        .from("course_enrollments")
        .select("student_id, profiles ( id, full_name )")
        .eq("course_id", courseId)
        .eq("is_active", true),
      activityIds.length
        ? supabase
            .from("quiz_submissions")
            .select("activity_id, student_id, score, attempt_no")
            .in("activity_id", activityIds)
        : Promise.resolve({ data: [] as unknown[] }),
      activityIds.length
        ? supabase
            .from("assignment_submissions")
            .select("activity_id, student_id, grade")
            .in("activity_id", activityIds)
        : Promise.resolve({ data: [] as unknown[] }),
      activityIds.length
        ? supabase.from("completions").select("student_id, activity_id").in("activity_id", activityIds)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

  const rows = new Map<string, StudentRow>();

  for (const enrollment of (enrollments ?? []) as unknown as {
    student_id: string;
    profiles?: { id: string; full_name: string } | null;
  }[]) {
    rows.set(enrollment.student_id, {
      id: enrollment.student_id,
      name: enrollment.profiles?.full_name ?? "Siswa",
      quizScores: new Map(),
      assignmentGrades: new Map(),
      completed: 0,
    });
  }

  for (const submission of (quizSubs ?? []) as {
    activity_id: string;
    student_id: string;
    score: number;
    attempt_no: number;
  }[]) {
    const row = rows.get(submission.student_id);
    if (!row) continue;
    const previous = row.quizScores.get(submission.activity_id);
    if (previous === undefined || Number(submission.score) > previous) {
      row.quizScores.set(submission.activity_id, Number(submission.score));
    }
  }

  for (const submission of (assignmentSubs ?? []) as {
    activity_id: string;
    student_id: string;
    grade: number | null;
  }[]) {
    rows.get(submission.student_id)?.assignmentGrades.set(submission.activity_id, submission.grade);
  }

  for (const completion of (completions ?? []) as { student_id: string; activity_id: string }[]) {
    const row = rows.get(completion.student_id);
    if (row) row.completed += 1;
  }

  const students = [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
  const columns = [...quizActivities, ...assignmentActivities];
  const gradedAssignments = ((assignmentSubs ?? []) as { grade: number | null }[]).filter(
    (item) => item.grade !== null,
  ).length;

  return (
    <div className="space-y-6">
      <nav className="text-xs text-ink-500">
        <Link href="/teacher" className="hover:text-brand-600">
          Kelas Saya
        </Link>
        <span className="px-1.5">/</span>
        <Link href={`/teacher/courses/${courseId}`} className="hover:text-brand-600">
          {course.title}
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-ink-700">Rekap nilai</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Rekap nilai</h1>
        <p className="mt-1 text-sm text-ink-500">
          Nilai kuis dihitung otomatis oleh RPC <code className="rounded bg-ink-100 px-1.5 py-0.5">submit_quiz</code>{" "}
          (skor terbaik tiap kuis). Nilai tugas diisi guru dari halaman penilaian.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Siswa" value={students.length} />
        <Stat label="Kuis dinilai otomatis" value={quizActivities.length} />
        <Stat label="Tugas sudah dinilai" value={formatNumber(gradedAssignments)} />
      </div>

      <Card title="Tabel nilai" description={`${columns.length} aktivitas dinilai`}>
        {students.length === 0 || columns.length === 0 ? (
          <EmptyState
            icon="📊"
            title="Belum ada data nilai"
            description={
              students.length === 0
                ? "Belum ada siswa yang bergabung ke kelas ini."
                : "Tambahkan aktivitas kuis atau tugas terlebih dahulu."
            }
          />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="sticky left-0 bg-white px-3 py-2">Siswa</th>
                  {columns.map((activity) => (
                    <th key={activity.id} className="px-3 py-2 whitespace-nowrap">
                      <span className="block font-medium text-ink-700">{activity.title}</span>
                      <span className="text-[10px] text-ink-400">
                        {activity.type === "quiz" ? "kuis" : "tugas"}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2">Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="sticky left-0 bg-white px-3 py-2 font-medium text-ink-800">
                      {student.name}
                    </td>
                    {columns.map((activity) => {
                      if (activity.type === "quiz") {
                        const score = student.quizScores.get(activity.id);
                        return (
                          <td key={activity.id} className="px-3 py-2 text-ink-700">
                            {score === undefined ? <span className="text-ink-300">-</span> : score}
                          </td>
                        );
                      }
                      const grade = student.assignmentGrades.get(activity.id);
                      return (
                        <td key={activity.id} className="px-3 py-2 text-ink-700">
                          {grade === undefined ? (
                            <span className="text-ink-300">-</span>
                          ) : grade === null ? (
                            <span className="text-amber-600">belum dinilai</span>
                          ) : (
                            grade
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-ink-600">
                      {student.completed}/{activityIds.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
