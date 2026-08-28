import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ClassCodeCard } from "@/components/teacher/class-code-card";
import { NewModuleForm } from "@/components/teacher/new-module-form";
import { ActivityRow } from "@/components/teacher/activity-row";
import { Badge, Card, EmptyState, LinkButton, Stat } from "@/components/ui";
import { activityTypeIcon } from "@/lib/format";
import type { Activity, Module } from "@/lib/types/database";

export default async function TeacherCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { userId } = await requireRole("teacher");
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("teacher_id", userId)
    .maybeSingle();

  if (!course) notFound();

  const [{ data: modules }, { data: enrollments }] = await Promise.all([
    supabase
      .from("modules")
      .select("*, activities (*)")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true }),
    supabase
      .from("course_enrollments")
      .select("id, profiles ( id, full_name )")
      .eq("course_id", courseId)
      .eq("is_active", true),
  ]);

  const moduleList = ((modules ?? []) as (Module & { activities?: Activity[] })[]).map((item) => ({
    ...item,
    activities: (item.activities ?? []).sort((a, b) => a.order_index - b.order_index),
  }));

  const students = ((enrollments ?? []) as unknown as {
    profiles?: { full_name: string } | null;
  }[]).map((row) => row.profiles?.full_name ?? "Siswa");

  const activityTotal = moduleList.reduce((total, item) => total + item.activities.length, 0);
  const publishedTotal = moduleList.reduce(
    (total, item) => total + item.activities.filter((activity) => activity.is_published).length,
    0,
  );

  return (
    <div className="space-y-6">
      <nav className="text-xs text-ink-500">
        <Link href="/teacher" className="hover:text-brand-600">
          Kelas Saya
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-ink-700">{course.title}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">{course.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {[course.subject, course.grade_level, course.year_term].filter(Boolean).join(" · ") ||
              "Detail belum dilengkapi"}
          </p>
          {course.description ? (
            <p className="mt-2 max-w-2xl text-sm text-ink-600">{course.description}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/teacher/courses/${courseId}/roster`} variant="secondary">
            Daftar presensi
          </LinkButton>
          <LinkButton href={`/teacher/courses/${courseId}/gradebook`} variant="secondary">
            Nilai
          </LinkButton>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Modul" value={moduleList.length} />
        <Stat label="Aktivitas terbit" value={`${publishedTotal} / ${activityTotal}`} />
        <Stat label="Siswa bergabung" value={students.length} />
      </div>

      <ClassCodeCard classCode={course.class_code} />

      <Card
        title="Modul & aktivitas"
        description="Susun urutan bab, lalu isi tiap modul dengan materi, kuis, tugas, atau refleksi."
      >
        {moduleList.length === 0 ? (
          <EmptyState
            icon="📚"
            title="Belum ada modul"
            description="Tambahkan modul pertama, misalnya 'Bab 1 — Ekosistem'."
          />
        ) : (
          <div className="space-y-4">
            {moduleList.map((module) => (
              <div key={module.id} className="rounded-lg border border-ink-200">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-4 py-3">
                  <div>
                    <Link
                      href={`/teacher/courses/${courseId}/modules/${module.id}`}
                      className="font-medium text-ink-900 hover:text-brand-700"
                    >
                      {module.title}
                    </Link>
                    {module.description ? (
                      <p className="mt-0.5 text-sm text-ink-500">{module.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {!module.is_published ? <Badge className="bg-amber-50 text-amber-700 ring-amber-200">Draf</Badge> : null}
                    <LinkButton
                      href={`/teacher/courses/${courseId}/modules/${module.id}`}
                      size="sm"
                      variant="ghost"
                    >
                      Buka builder →
                    </LinkButton>
                  </div>
                </div>

                <ul className="divide-y divide-ink-100">
                  {module.activities.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-ink-500">
                      Belum ada aktivitas di modul ini.
                    </li>
                  ) : (
                    module.activities.map((activity) => (
                      <ActivityRow
                        key={activity.id}
                        courseId={courseId}
                        moduleId={module.id}
                        activity={activity}
                      />
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Tambah modul">
        <NewModuleForm courseId={courseId} />
      </Card>

      {students.length ? (
        <Card title="Siswa yang sudah bergabung" description="Mereka bergabung lewat kode kelas di atas.">
          <div className="flex flex-wrap gap-2">
            {students.map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-700"
              >
                <span aria-hidden>👤</span>
                {name}
              </span>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
