import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/";

  return (
    <div className="grid min-h-screen bg-ink-50 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-sm font-bold">
            LL
          </span>
          <span className="text-sm font-semibold">Lessonlen</span>
        </div>

        <div className="space-y-5">
          <h1 className="text-3xl font-semibold leading-snug">
            Pembelajaran mendalam, dimulai dari kelas yang terstruktur.
          </h1>
          <p className="max-w-md text-sm text-ink-300">
            Guru menyusun materi, kuis, tugas, dan refleksi dengan bantuan AI — tetap dengan
            kendali penuh di tangan guru. Siswa belajar lewat alur modul, kuis yang dinilai
            otomatis di server, dan jurnal refleksi.
          </p>
          <ul className="space-y-2 text-sm text-ink-200">
            <li>• Kunci jawaban kuis tidak pernah dikirim ke browser</li>
            <li>• Peran guru hanya bisa diaktifkan lewat kode lisensi sekolah</li>
            <li>• Progres &amp; refleksi siswa terekap otomatis</li>
          </ul>
        </div>

        <p className="text-xs text-ink-400">Supabase · PostgreSQL · RLS · Edge Functions · Gemini</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-ink-900">Masuk</h2>
            <p className="mt-1 text-sm text-ink-500">
              Gunakan akun yang sudah terdaftar di sekolah Anda.
            </p>
          </div>

          <LoginForm next={next} />

          <p className="text-center text-sm text-ink-600">
            Belum punya akun?{" "}
            <Link href="/signup" className="font-medium text-brand-600 hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
