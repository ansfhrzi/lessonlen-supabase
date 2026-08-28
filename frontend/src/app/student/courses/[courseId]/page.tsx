import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { RosterClaim, type RosterOption } from "@/components/student/roster-claim";
import { Alert, Badge, Card, EmptyState, ProgressBar, Stat } from "@/components/ui";
import { activityTypeAccent, activityTypeIcon, activityTypeLabel, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Activity, Course, Module } from "@/lib/types/database";

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { userId, profile } = await requireRole("student");
  const supabase = await createClient();

  const [{ data: enrollment }, { data: course }] = await Promise.all([
    supabase
      .from("course_enrollments")
      .select("id, is_active")
      .eq("course_id", courseId)
      .eq("student_id", userId)
      .maybeSingle(),
    supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
  ]);

  if (!course) notFound();
  if (!enrollment || !enrollment.is_active) redirect("/student");

  const [{ data: modules }, { data: completions }, { data: rosters }, { data: claims }, { data: progress }] =
    await Promise.all([
      supabase
        .from("modules")
        .select("*, activities (*), module_prerequisites ( prereq_module_id )")
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("order_index", { ascending: true }),
      supabase.from("completions").select("activity_id").eq("student_id", userId),
      supabase
        .from("class_rosters")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("roster_claims").select("roster_id").eq("enrollment_id", enrollment.id),
      supabase.from("course_progress").select("*").eq("student_id", userId).eq("course_id", courseId),
    ]);

  type ModuleRow = Module & {
    activities?: Activity[];
    module_prerequisites?: { prereq_module_id: string }[];
  };

  const moduleRows = ((modules ?? []) as ModuleRow[]).map((item) => ({
    ...item,
    activities: (item.activities ?? []).sort((a, b) => a.order_index - b.order_index),
    prereqIds: (item.module_prerequisites ?? []).map((row) => row.prereq_module_id),
  }));

  const completedIds = new Set(((completions ?? []) as { activity_id: string }[]).map((row) => row.activity_id));

  const moduleStats = new Map<string, { total: number; done: number }>();
  for (const module of moduleRows) {
    const total = module.activities.length;
    const done = module.activities.filter((activity) => completedIds.has(activity.id)).length;
    moduleStats.set(module.id, { total, done });
  }

  const quizActivityIds = moduleRows
    .flatMap((module) => module.activities)
    .filter((activity) => activity.type === "quiz")
    .map((activity) => activity.id);

  const { data: quizSubs } = quizActivityIds.length
    ? await supabase
        .from("quiz_submissions")
        .select("activity_id, score")
        .eq("student_id", userId)
        .in("activity_id", quizActivityIds)
    : { data: [] as { activity_id: string; score: number }[] };

  const bestScoreByQuiz = new Map<string, number>();
  for (const row of (quizSubs ?? []) as { activity_id: string; score: number }[]) {
    const current = bestScoreByQuiz.get(row.activity_id);
    if (current === undefined || Number(row.score) > current) {
      bestScoreByQuiz.set(row.activity_id, Number(row.score));
    }
  }

  const claimedRosterId = ((claims ?? []) as { roster_id: string }[])[0]?.roster_id ?? null;

  // Catatan RLS: siswa hanya bisa melihat klaim miliknya sendiri, jadi status
  // "sudah diklaim siswa lain" tidak bisa ditampilkan. Bila nama ternyata sudah
  // diambil, RPC `claim_roster` menolak dan pesan errornya ditampilkan di form.
  const rosterOptions: RosterOption[] = ((rosters ?? []) as {
    id: string;
    full_name: string;
    nis: string | null;
  }[]).map((roster) => ({
    id: roster.id,
    full_name: roster.full_name,
    nis: roster.nis,
    claimed: false,
  }));

  const hasRoster = rosterOptions.length > 0;
  const needsClaim = hasRoster && !claimedRosterId;
  const claimedName = rosterOptions.find((option) => option.id === claimedRosterId)?.full_name ?? null;

  const stats = ((progress ?? []) as { progress_percent: number; completed_activities: number; total_activities: number }[])[0];
  const courseData = course as Course;

  function isModuleUnlocked(module: (typeof moduleRows)[number]): boolean {
    return module.prereqIds.every((prereqId) => {
      const stat = moduleStats.get(prereqId);
      if (!stat) return true; // modul prasyarat belum terbit
      return stat.total > 0 && stat.done >= stat.total;
    });
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-ink-500">
        <Link href="/student" className="hover:text-brand-600">
          Kelas Saya
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-ink-700">{courseData.title}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">{courseData.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {[courseData.subject, courseData.grade_level].filter(Boolean).join(" · ") || "Kelas"}
            {claimedName ? ` · ${claimedName}` : ""}
          </p>
        </div>
        <div className="min-w-56 flex-1 sm:max-w-xs">
          <div className="mb-1 flex items-center justify-between text-xs text-ink-500">
            <span>
              {stats?.completed_activities ?? 0} / {stats?.total_activities ?? 0} aktivitas
            </span>
            <span>{stats?.progress_percent ?? 0}%</span>
          </div>
          <ProgressBar percent={Number(stats?.progress_percent ?? 0)} />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Modul tersedia" value={moduleRows.length} />
        <Stat label="Aktivitas selesai" value={stats?.completed_activities ?? 0} />
        <Stat label="Presensi" value={claimedName ? "Terkonfirmasi" : hasRoster ? "Menunggu klaim" : "—"} />
      </div>

      {needsClaim ? (
        <Card
          title="Klaim nama Anda dulu"
          description="Langkah wajib sebelum mengerjakan aktivitas di kelas ini."
        >
          <RosterClaim courseId={courseId} options={rosterOptions} />
        </Card>
      ) : null}

      {claimedName ? (
        <Alert tone="success" title={`Presensi terkonfirmasi sebagai ${claimedName}`}>
          <p>Nilai dan kehadiran Anda tercatat pada nama ini.</p>
        </Alert>
      ) : null}

      {moduleRows.length === 0 ? (
        <Card>
          <EmptyState
            icon="📚"
            title="Belum ada modul"
            description="Guru Anda belum menerbitkan modul untuk kelas ini."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {moduleRows.map((module, index) => {
            const unlocked = isModuleUnlocked(module);
            const stat = moduleStats.get(module.id)!;

            return (
              <section
                key={module.id}
                className={cn(
                  "overflow-hidden rounded-xl border bg-white shadow-sm",
                  unlocked ? "border-ink-200" : "border-ink-100 opacity-70",
                )}
              >
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-400">
                      Modul {index + 1}
                    </p>
                    <h2 className="font-semibold text-ink-900">{module.title}</h2>
                    {module.description ? (
                      <p className="mt-1 max-w-2xl text-sm text-ink-500">{module.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {!unlocked ? (
                      <Badge className="bg-amber-50 text-amber-700 ring-amber-200">🔒 Terkunci</Badge>
                    ) : null}
                    <Badge>
                      {stat.done} / {stat.total} selesai
                    </Badge>
                  </div>
                </header>

                <ul className="divide-y divide-ink-100">
                  {module.activities.length === 0 ? (
                    <li className="px-5 py-4 text-sm text-ink-500">Belum ada aktivitas terbit.</li>
                  ) : (
                    module.activities.map((activity) => {
                      const done = completedIds.has(activity.id);
                      const score = bestScoreByQuiz.get(activity.id);
                      const href = `/student/courses/${courseId}/activities/${activity.id}`;

                      return (
                        <li key={activity.id}>
                          {unlocked ? (
                            <Link
                              href={href}
                              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition hover:bg-ink-50"
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <span aria-hidden>{activityTypeIcon[activity.type]}</span>
                                <span className="min-w-0">
                                  <span className="block truncate font-medium text-ink-900">
                                    {activity.title}
                                  </span>
                                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                                    <Badge className={activityTypeAccent[activity.type]}>
                                      {activityTypeLabel[activity.type]}
                                    </Badge>
                                    {activity.due_at ? (
                                      <span>Tenggat {formatDateTime(activity.due_at)}</span>
                                    ) : null}
                                    {score !== undefined ? <span>Nilai terbaik {score}</span> : null}
                                  </span>
                                </span>
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  done ? "text-emerald-600" : "text-ink-400",
                                )}
                              >
                                {done ? "Selesai ✓" : "Buka →"}
                              </span>
                            </Link>
                          ) : (
                            <span className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                              <span className="flex min-w-0 items-center gap-3 text-ink-400">
                                <span aria-hidden>🔒</span>
                                <span className="truncate">{activity.title}</span>
                              </span>
                              <span className="text-xs">Selesaikan modul sebelumnya</span>
                            </span>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-xs text-ink-500">
        Masuk sebagai {profile.full_name}. Nilai kuis dihitung di server; kunci jawaban tidak pernah
        dikirim ke perangkat Anda.
      </p>
    </div>
  );
}
