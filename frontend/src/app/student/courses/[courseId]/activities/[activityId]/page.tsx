import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { LessonView } from "@/components/student/lesson-view";
import { QuizRunner } from "@/components/student/quiz-runner";
import { AssignmentSubmitter } from "@/components/student/assignment-submitter";
import { ReflectionForm } from "@/components/student/reflection-form";
import { Badge, Card } from "@/components/ui";
import { activityTypeAccent, activityTypeLabel, formatDateTime } from "@/lib/format";
import type { Activity } from "@/lib/types/database";

export default async function StudentActivityPage({
  params,
}: {
  params: Promise<{ courseId: string; activityId: string }>;
}) {
  const { courseId, activityId } = await params;
  const { userId } = await requireRole("student");
  const supabase = await createClient();

  const [{ data: enrollment }, { data: activity }] = await Promise.all([
    supabase
      .from("course_enrollments")
      .select("id, is_active")
      .eq("course_id", courseId)
      .eq("student_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("activities")
      .select("*, modules ( id, course_id, title )")
      .eq("id", activityId)
      .eq("is_published", true)
      .maybeSingle(),
  ]);

  if (!enrollment || !activity) notFound();

  const activityRow = activity as Activity & {
    modules?: { id: string; course_id: string; title: string } | null;
  };

  if (activityRow.modules?.course_id !== courseId) notFound();

  const [
    { data: completion },
    { data: submission },
    { data: reflection },
    { data: attempts },
  ] = await Promise.all([
    supabase
      .from("completions")
      .select("id, completed_at")
      .eq("activity_id", activityId)
      .eq("student_id", userId)
      .maybeSingle(),
    activityRow.type === "assignment"
      ? supabase
          .from("assignment_submissions")
          .select("*")
          .eq("activity_id", activityId)
          .eq("student_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    activityRow.type === "reflection"
      ? supabase
          .from("reflections")
          .select("*")
          .eq("activity_id", activityId)
          .eq("student_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    activityRow.type === "quiz"
      ? supabase
          .from("quiz_submissions")
          .select("attempt_no, score, submitted_at")
          .eq("activity_id", activityId)
          .eq("student_id", userId)
          .order("attempt_no", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const moodLine = (activityRow.reflection_prompt ?? "")
    .split(/\r?\n/)
    .find((line) => line.startsWith("Pilihan suasana hati:"));
  const moodOptions = moodLine
    ? moodLine
        .replace("Pilihan suasana hati:", "")
        .split("·")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const assignmentRow = submission as
    | {
        submission_link: string | null;
        submission_text: string | null;
        grade: number | null;
        feedback: string | null;
        submitted_at: string;
      }
    | null;

  const reflectionRow = reflection as
    | { reflection_text: string; mood_tracker: string | null }
    | null;

  const attemptRows = (attempts ?? []) as { attempt_no: number; score: number; submitted_at: string }[];

  return (
    <div className="space-y-6">
      <nav className="text-xs text-ink-500">
        <Link href="/student" className="hover:text-brand-600">
          Kelas Saya
        </Link>
        <span className="px-1.5">/</span>
        <Link href={`/student/courses/${courseId}`} className="hover:text-brand-600">
          {activityRow.modules?.title ?? "Modul"}
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-ink-700">{activityRow.title}</span>
      </nav>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={activityTypeAccent[activityRow.type]}>
            {activityTypeLabel[activityRow.type]}
          </Badge>
          {activityRow.due_at ? (
            <Badge className="bg-amber-50 text-amber-700 ring-amber-200">
              Tenggat {formatDateTime(activityRow.due_at)}
            </Badge>
          ) : null}
          {completion ? (
            <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Selesai</Badge>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold text-ink-900">{activityRow.title}</h1>
        {activityRow.description ? (
          <p className="max-w-2xl text-sm text-ink-600">{activityRow.description}</p>
        ) : null}
      </header>

      {attemptRows.length ? (
        <Card title="Riwayat percobaan kuis">
          <ul className="space-y-1 text-sm text-ink-600">
            {attemptRows.map((row) => (
              <li key={row.attempt_no} className="flex justify-between gap-3">
                <span>Percobaan #{row.attempt_no}</span>
                <span>
                  {row.score} poin · {formatDateTime(row.submitted_at)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {activityRow.type === "lesson" ? (
        <LessonView
          activityId={activityId}
          courseId={courseId}
          title={activityRow.title}
          description={activityRow.description}
          contentMarkdown={activityRow.content_markdown}
          completed={Boolean(completion)}
        />
      ) : null}

      {activityRow.type === "quiz" ? (
        <QuizRunner activityId={activityId} courseId={courseId} title={activityRow.title} />
      ) : null}

      {activityRow.type === "assignment" ? (
        <AssignmentSubmitter
          activityId={activityId}
          courseId={courseId}
          initialLink={assignmentRow?.submission_link ?? null}
          initialText={assignmentRow?.submission_text ?? null}
          grade={assignmentRow?.grade ?? null}
          feedback={assignmentRow?.feedback ?? null}
          submittedAt={assignmentRow?.submitted_at ?? null}
        />
      ) : null}

      {activityRow.type === "reflection" ? (
        <ReflectionForm
          activityId={activityId}
          courseId={courseId}
          prompt={activityRow.reflection_prompt}
          moodOptions={moodOptions}
          initialText={reflectionRow?.reflection_text ?? null}
          initialMood={reflectionRow?.mood_tracker ?? null}
        />
      ) : null}

      {activityRow.type !== "lesson" && !completion ? (
        <p className="text-xs text-ink-400">
          Status selesai dicatat otomatis saat Anda mengirim pekerjaan.
        </p>
      ) : null}
    </div>
  );
}
