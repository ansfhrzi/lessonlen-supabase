import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ActivateTeacherForm } from "@/components/teacher/activate-teacher-form";
import { Card, Alert } from "@/components/ui";

export default async function ActivateTeacherPage() {
  const { profile } = await requireRole("teacher", "/teacher/activate");
  const supabase = await createClient();

  const { data: schools } = await supabase
    .from("schools")
    .select("name, license_code")
    .eq("is_active", true)
    .order("name");

  const schoolList = ((schools ?? []) as { name: string; license_code: string }[]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Aktivasi peran guru</h1>
        <p className="mt-1 text-sm text-ink-500">
          Peran guru tidak bisa dipilih sendiri dari formulir pendaftaran. Masukkan kode lisensi
          sekolah — Edge Function <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">setup-teacher</code>{" "}
          akan memverifikasi kode tersebut lalu menaikkan peran Anda di server.
        </p>
      </div>

      {profile.role === "teacher" && profile.school_id ? (
        <Alert tone="success" title="Peran guru Anda sudah aktif">
          <p>
            Sekolah terdaftar: <strong>{profile.schools?.name ?? "-"}</strong>. Anda sudah bisa
            membuat kelas dan memakai AI Generator.
          </p>
        </Alert>
      ) : null}

      <Card title="Kode lisensi sekolah" description="Diberikan oleh administrator sekolah.">
        <ActivateTeacherForm />
      </Card>

      {schoolList.length ? (
        <Card title="Kode lisensi yang tersedia di sistem">
          <ul className="space-y-2 text-sm text-ink-700">
            {schoolList.map((school) => (
              <li key={school.license_code} className="flex items-center justify-between gap-3">
                <span>{school.name}</span>
                <code className="rounded bg-ink-100 px-2 py-1 font-mono text-xs">{school.license_code}</code>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-500">
            Daftar ini tampil karena kebijakan RLS <code>schools_select</code> hanya membuka sekolah
            yang aktif. Migrasi awal menyiapkan sekolah default dengan kode{" "}
            <code className="rounded bg-ink-100 px-1 py-0.5">SCHOOL-0001</code>.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
