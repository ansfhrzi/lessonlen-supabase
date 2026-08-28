import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { RosterManager, type RosterRow } from "@/components/teacher/roster-manager";
import { Card, Stat } from "@/components/ui";

export default async function TeacherRosterPage({
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

  const { data: rosters } = await supabase
    .from("class_rosters")
    .select("*, roster_claims ( id, claimed_at, course_enrollments ( id, profiles ( id, full_name ) ) )")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  type ClaimJoin = {
    id: string;
    claimed_at: string;
    course_enrollments?: { profiles?: { full_name: string } | null } | null;
  };

  const rows: RosterRow[] = ((rosters ?? []) as (Omit<RosterRow, "claimed_by" | "claimed_at"> & {
    roster_claims?: ClaimJoin[];
  })[]).map((roster) => {
    const claim = roster.roster_claims?.[0];
    return {
      id: roster.id,
      nis: roster.nis,
      full_name: roster.full_name,
      sort_order: roster.sort_order,
      claimed_by: claim?.course_enrollments?.profiles?.full_name ?? null,
      claimed_at: claim?.claimed_at ?? null,
    };
  });

  const claimedCount = rows.filter((row) => row.claimed_by).length;

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
        <span className="text-ink-700">Daftar presensi</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Daftar presensi ({course.title})</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-500">
          Unggah nama siswa lebih dulu, lalu siswa &quot;mengklaim&quot; namanya sendiri setelah
          bergabung dengan kode kelas. Ini membuat presensi rapi tanpa guru mengetik ulang nama.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Nama terdaftar" value={rows.length} />
        <Stat label="Sudah diklaim" value={claimedCount} />
        <Stat label="Menunggu klaim" value={rows.length - claimedCount} />
      </div>

      <Card title="Kelola daftar presensi">
        <RosterManager courseId={courseId} rows={rows} />
      </Card>
    </div>
  );
}
