import Link from "next/link";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, Stat } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export default async function StudentJournalPage() {
  const { userId } = await requireRole("student");
  const supabase = await createClient();

  const { data: reflections } = await supabase
    .from("reflections")
    .select(
      "*, activities ( id, title, module_id, modules ( id, title, course_id, courses ( id, title ) ) )",
    )
    .eq("student_id", userId)
    .order("created_at", { ascending: false });

  type ReflectionRow = {
    id: string;
    reflection_text: string;
    mood_tracker: string | null;
    created_at: string;
    updated_at: string;
    activities?: {
      id: string;
      title: string;
      module_id: string;
      modules?: {
        id: string;
        title: string;
        course_id: string;
        courses?: { id: string; title: string } | null;
      } | null;
    } | null;
  };

  const rows = (reflections ?? []) as ReflectionRow[];

  const moods = rows
    .map((row) => row.mood_tracker)
    .filter((mood): mood is string => Boolean(mood));
  const topMood = moods.length
    ? Object.entries(
        moods.reduce<Record<string, number>>((counts, mood) => {
          counts[mood] = (counts[mood] ?? 0) + 1;
          return counts;
        }, {}),
      ).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">Jurnal refleksi</h1>
        <p className="mt-1 text-sm text-ink-500">
          Rekap semua refleksi yang sudah Anda tulis. Guru membaca jurnal ini untuk memahami
          perkembangan belajar Anda.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Refleksi tertulis" value={rows.length} />
        <Stat label="Suasana hati terbanyak" value={topMood ?? "-"} />
        <Stat
          label="Terakhir menulis"
          value={rows[0] ? formatDateTime(rows[0].updated_at) : "-"}
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon="🪞"
            title="Belum ada refleksi"
            description="Buka aktivitas Refleksi di salah satu kelas Anda untuk mulai menulis."
            action={
              <Link href="/student" className="text-sm font-medium text-brand-600 hover:underline">
                Ke Kelas Saya →
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const course = row.activities?.modules?.courses;
            const module = row.activities?.modules;

            return (
              <article key={row.id} className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-ink-900">{row.activities?.title ?? "Refleksi"}</h2>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {[course?.title, module?.title].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {row.mood_tracker ? (
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
                      {row.mood_tracker}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {row.reflection_text}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-ink-400">{formatDateTime(row.created_at)}</p>
                  {course ? (
                    <Link
                      href={`/student/courses/${course.id}`}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Buka kelas →
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
