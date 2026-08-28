import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { AiStudio } from "@/components/teacher/ai-studio";
import { ActivityRow } from "@/components/teacher/activity-row";
import { ModuleSettings } from "@/components/teacher/module-settings";
import { QuizBank } from "@/components/teacher/quiz-bank";
import { Badge, Card } from "@/components/ui";
import type { Activity, QuizQuestion } from "@/lib/types/database";

export default async function ModuleBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = await params;
  const { userId } = await requireRole("teacher");
  const supabase = await createClient();

  const [{ data: course }, { data: module }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, grade_level")
      .eq("id", courseId)
      .eq("teacher_id", userId)
      .maybeSingle(),
    supabase.from("modules").select("*").eq("id", moduleId).maybeSingle(),
  ]);

  if (!course || !module || module.course_id !== courseId) notFound();

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: true });

  const activityList = (activities ?? []) as Activity[];
  const quizActivityIds = activityList.filter((item) => item.type === "quiz").map((item) => item.id);
  const assignmentActivityIds = activityList
    .filter((item) => item.type === "assignment")
    .map((item) => item.id);

  const [{ data: questions }, { data: submissions }] = await Promise.all([
    quizActivityIds.length
      ? supabase
          .from("quiz_questions")
          .select("*")
          .in("activity_id", quizActivityIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as QuizQuestion[] }),
    assignmentActivityIds.length
      ? supabase.from("assignment_submissions").select("id, activity_id").in("activity_id", assignmentActivityIds)
      : Promise.resolve({ data: [] as { id: string; activity_id: string }[] }),
  ]);

  const questionsByActivity = new Map<string, QuizQuestion[]>();
  for (const question of (questions ?? []) as QuizQuestion[]) {
    const list = questionsByActivity.get(question.activity_id) ?? [];
    list.push(question);
    questionsByActivity.set(question.activity_id, list);
  }

  const submissionCountByActivity = new Map<string, number>();
  for (const row of (submissions ?? []) as { activity_id: string }[]) {
    submissionCountByActivity.set(
      row.activity_id,
      (submissionCountByActivity.get(row.activity_id) ?? 0) + 1,
    );
  }

  const quizActivities = activityList
    .filter((item) => item.type === "quiz")
    .map((item) => ({ id: item.id, title: item.title }));

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
        <span className="text-ink-700">{module.title}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">{module.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {activityList.length} aktivitas ·{" "}
            {activityList.filter((item) => item.is_published).length} terbit
          </p>
        </div>
        {!module.is_published ? (
          <Badge className="bg-amber-50 text-amber-700 ring-amber-200">Modul belum terbit</Badge>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <AiStudio
            courseId={courseId}
            moduleId={moduleId}
            moduleTitle={module.title}
            gradeLevel={course.grade_level ?? null}
            quizActivities={quizActivities}
          />

          <Card title="Aktivitas di modul ini">
            {activityList.length === 0 ? (
              <p className="text-sm text-ink-500">
                Belum ada aktivitas. Simpan hasil AI Generator, atau tambahkan manual lewat tombol di
                panel kanan.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {activityList.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    courseId={courseId}
                    moduleId={moduleId}
                    questionCount={
                      activity.type === "quiz"
                        ? questionsByActivity.get(activity.id)?.length ?? 0
                        : undefined
                    }
                    submissionCount={
                      activity.type === "assignment"
                        ? submissionCountByActivity.get(activity.id) ?? 0
                        : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </Card>

          {quizActivities.map((activity) => (
            <QuizBank
              key={activity.id}
              activityId={activity.id}
              activityTitle={activity.title}
              courseId={courseId}
              moduleId={moduleId}
              questions={questionsByActivity.get(activity.id) ?? []}
            />
          ))}
        </div>

        <aside className="space-y-6">
          <Card title="Pengaturan modul">
            <ModuleSettings
              moduleId={moduleId}
              initialTitle={module.title}
              initialDescription={module.description}
              isPublished={module.is_published}
            />
          </Card>

          <Card title="Alur yang disarankan">
            <ol className="space-y-2 text-sm text-ink-600">
              <li>1. Buat <strong>Materi</strong> sebagai fondasi bab.</li>
              <li>2. Susun <strong>Kuis</strong> dari materi tersebut.</li>
              <li>3. Tambahkan <strong>Tugas</strong> dengan rubrik.</li>
              <li>4. Tutup dengan <strong>Refleksi</strong> Deep Learning.</li>
            </ol>
            <p className="mt-3 text-xs text-ink-500">
              Siswa hanya melihat aktivitas berstatus terbit. Penilaian kuis dikerjakan server-side
              lewat RPC <code className="rounded bg-ink-100 px-1 py-0.5">submit_quiz</code>.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
