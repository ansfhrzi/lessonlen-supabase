import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { GradingPanel } from "@/components/teacher/grading-panel";
import { Alert, Card, EmptyState, Stat } from "@/components/ui";
import { parseRubricFromMarkdown } from "@/lib/markdown";
import { formatDateTime } from "@/lib/format";
import type { Activity } from "@/lib/types/database";

export default async function TeacherSubmissionsPage({
  params,
}: {
  params: Promise<{ courseId: string; activityId: string }>;
}) {
  const { courseId, activityId } = await params;
  const { userId } = await requireRole("teacher");
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .eq("teacher_id", userId)
    .maybeSingle();

  if (!course) notFound();

  const [{ data: activity }, { data: submissions }] = await Promise.all([
    supabase
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .eq("type", "assignment")
      .maybeSingle(),
    supabase
      .from("assignment_submissions")
      .select("*, profiles ( id, full_name )")
      .eq("activity_id", activityId)
      .order("submitted_at", { ascending: false }),
  ]);

  if (!activity) notFound();

  const rubric = parseRubricFromMarkdown((activity as Activity).content_markdown);
  const maxGrade = rubric.reduce((total, row) => total + row.max_score, 0) || 100;

  type SubmissionRow = {
    id: string;
    submission_link: string | null;
    submission_text: string | null;
    grade: number | null;
    feedback: string | null;
    ai_feedback: string | null;
    submitted_at: string;
    profiles?: { full_name: string } | null;
  };

  const rows = (submissions ?? []) as SubmissionRow[];
  const graded = rows.filter((row) => row.grade !== null).length;

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
        <span className="text-ink-700">Penilaian tugas</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{activity.title}</h1>
        <p className="mt-1 text-sm text-ink-500">
          Mode {activity.assignment_mode === "group" ? "kelompok" : "individu"} · rubrik{" "}
          {rubric.length} kriteria · skor maksimum {maxGrade}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Pengumpulan" value={rows.length} />
        <Stat label="Sudah dinilai" value={graded} />
        <Stat label="Menunggu" value={rows.length - graded} />
      </div>

      {rubric.length === 0 ? (
        <Alert tone="warning" title="Rubrik tidak terbaca">
          <p>
            AI grading membutuhkan rubrik. Simpan tugas dari AI Generator (yang menyertakan tabel
            rubrik), atau tambahkan tabel rubrik berformat Markdown pada isi aktivitas ini.
          </p>
        </Alert>
      ) : null}

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon="📥"
            title="Belum ada pengumpulan"
            description="Siswa dapat mengumpulkan lewat halaman aktivitas di ruang siswa."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="space-y-2">
              <GradingPanel
                submissionId={row.id}
                activityId={activityId}
                courseId={courseId}
                studentName={row.profiles?.full_name ?? "Siswa"}
                submissionText={row.submission_text}
                submissionLink={row.submission_link}
                currentGrade={row.grade}
                currentFeedback={row.feedback}
                currentAiFeedback={row.ai_feedback}
                rubric={rubric}
                maxGrade={maxGrade}
              />
              <p className="pl-1 text-xs text-ink-400">
                Dikumpulkan {formatDateTime(row.submitted_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
