import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            LL
          </span>
          <span className="text-sm font-semibold text-ink-900">Lessonlen</span>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Buat akun</h1>
          <p className="mt-1 text-sm text-ink-500">
            Akun baru selalu dibuat sebagai <strong>siswa</strong>. Guru mengaktifkan peran lewat
            kode lisensi sekolah setelah mendaftar.
          </p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-ink-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
