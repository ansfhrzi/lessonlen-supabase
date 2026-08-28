import Link from "next/link";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { NewCourseCard } from "@/components/teacher/new-course-card";
import { Card, EmptyState, LinkButton, Stat } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { AiUsageRow, Course } from "@/lib/types/database";

type CourseWithCounts = Course & {
  modules?: { count: number }[];
  course_enrollments?: { count: number }[];
};

export default async function TeacherDashboardPage() {
  const { userId, profile } = await requireRole("teacher");
  const supabase = await createClient();

  const [{ data: courses }, { data: usage }] = await Promise.all([
    supabase
      .from("courses")
      .select("*, modules(count), course_enrollments(count)")
      .eq("teacher_id", userId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase.from("ai_usage_today").select("teacher_id, usage_count").eq("teacher_id", userId),
  ]);

  const list = (courses ?? []) as CourseWithCounts[];
  const aiUsed = ((usage ?? []) as AiUsageRow[]).reduce(
    (total, row) => total + Number(row.usage_count ?? 0),
    0,
  );
  const totalStudents = list.reduce(
    (total, course) => total + Number(course.course_enrollments?.[0]?.count ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Halo, {profile.full_name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-ink-500">
            Kelola kelas, bangun materi dengan AI, dan pantau progres siswa.
          </p>
        </div>
        {!profile.school_id ? (
          <LinkButton href="/teacher/activate" variant="secondary">
            Aktifkan peran guru
          </LinkButton>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Kelas aktif" value={list.length} />
        <Stat label="Total siswa" value={totalStudents} />
        <Stat label="Pemakaian AI (24 jam)" value={aiUsed} hint="Batas diatur lewat secret AI_DAILY_LIMIT" />
      </div>

      <NewCourseCard />

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon="🗂️"
            title="Belum ada kelas"
            description="Buat kelas pertama Anda, lalu bagikan kode kelasnya ke siswa agar mereka bisa bergabung."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((course) => (
            <Link
              key={course.id}
              href={`/teacher/courses/${course.id}`}
              className="group rounded-xl border border-ink-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink-900 group-hover:text-brand-700">{course.title}</h2>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {[course.subject, course.grade_level].filter(Boolean).join(" · ") || "Tanpa mata pelajaran"}
                  </p>
                </div>
                <span className="rounded-lg bg-ink-900 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-white">
                  {course.class_code}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
                <span>{course.modules?.[0]?.count ?? 0} modul</span>
                <span>{course.course_enrollments?.[0]?.count ?? 0} siswa</span>
                <span>Dibuat {formatDate(course.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
