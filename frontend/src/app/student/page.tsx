import Link from "next/link";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { JoinCourseForm } from "@/components/student/join-course-form";
import { Card, EmptyState, ProgressBar, Stat } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Course, CourseProgressRow } from "@/lib/types/database";

export default async function StudentDashboardPage() {
  const { userId, profile } = await requireRole("student");
  const supabase = await createClient();

  const [{ data: enrollments }, { data: progress }, { data: reflections }] = await Promise.all([
    supabase
      .from("course_enrollments")
      .select("course_id, joined_at, courses ( id, title, subject, grade_level, class_code, description )")
      .eq("student_id", userId)
      .eq("is_active", true)
      .order("joined_at", { ascending: false }),
    supabase.from("course_progress").select("*").eq("student_id", userId),
    supabase.from("reflections").select("id").eq("student_id", userId),
  ]);

  type EnrollmentRow = {
    course_id: string;
    joined_at: string;
    courses?: Course | null;
  };

  // Select berelasi mengembalikan array; kita ambil elemen pertamanya.
  const rows = ((enrollments ?? []) as unknown as EnrollmentRow[]).filter((row) => row.courses);
  const progressByCourse = new Map(
    ((progress ?? []) as CourseProgressRow[]).map((row) => [row.course_id, row]),
  );

  const totalActivities = rows.reduce(
    (total, row) => total + Number(progressByCourse.get(row.course_id)?.total_activities ?? 0),
    0,
  );
  const completedActivities = rows.reduce(
    (total, row) => total + Number(progressByCourse.get(row.course_id)?.completed_activities ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">
          Halo, {profile.full_name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Lanjutkan modul yang belum selesai, kerjakan kuis, dan isi jurnal refleksi.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Kelas diikuti" value={rows.length} />
        <Stat label="Aktivitas selesai" value={`${completedActivities} / ${totalActivities}`} />
        <Stat label="Refleksi tertulis" value={reflections?.length ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {rows.length === 0 ? (
            <Card>
              <EmptyState
                icon="🎒"
                title="Belum ada kelas"
                description="Minta kode kelas kepada guru Anda, lalu masukkan di panel sebelah kanan."
              />
            </Card>
          ) : (
            rows.map((row) => {
              const course = row.courses as Course;
              const stats = progressByCourse.get(course.id);
              const percent = Number(stats?.progress_percent ?? 0);

              return (
                <Link
                  key={row.course_id}
                  href={`/student/courses/${course.id}`}
                  className="block rounded-xl border border-ink-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-ink-900">{course.title}</h2>
                      <p className="mt-0.5 text-sm text-ink-500">
                        {[course.subject, course.grade_level].filter(Boolean).join(" · ") ||
                          "Kelas"}
                      </p>
                    </div>
                    <span className="rounded-lg bg-ink-100 px-2.5 py-1 font-mono text-xs tracking-wider text-ink-700">
                      {course.class_code}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-ink-500">
                      <span>
                        {stats?.completed_activities ?? 0} / {stats?.total_activities ?? 0} aktivitas
                        selesai
                      </span>
                      <span>{percent}%</span>
                    </div>
                    <ProgressBar percent={percent} />
                  </div>

                  <p className="mt-3 text-xs text-ink-400">Bergabung {formatDate(row.joined_at)}</p>
                </Link>
              );
            })
          )}
        </div>

        <aside className="space-y-4">
          <Card title="Gabung kelas baru" description="Masukkan kode kelas dari guru.">
            <JoinCourseForm />
          </Card>

          <Card title="Cara belajar di Lessonlen">
            <ol className="space-y-2 text-sm text-ink-600">
              <li>1. Gabung kelas dengan kode dari guru.</li>
              <li>2. Klaim nama Anda di daftar presensi kelas.</li>
              <li>3. Ikuti modul berurutan — modul lanjutan terbuka setelah modul awal selesai.</li>
              <li>4. Kerjakan kuis; nilai dihitung otomatis di server.</li>
              <li>5. Tulis refleksi agar guru paham perkembangan Anda.</li>
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}
