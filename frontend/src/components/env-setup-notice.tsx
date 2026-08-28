import { missingEnvVars } from "@/lib/config";

export function EnvSetupNotice() {
  return (
    <div className="min-h-screen bg-ink-50 px-4 py-16">
      <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-ink-200 bg-white p-8 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Lessonlen LMS — Tahap 5
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink-900">
            Hubungkan frontend ke project Supabase Anda
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            Aplikasi sudah siap dijalankan, tetapi environment variable Supabase belum diisi.
            Tanpa koneksi ini, autentikasi dan semua query database tidak bisa berjalan.
          </p>
        </div>

        <ol className="space-y-3 text-sm text-ink-700">
          <li className="flex gap-3">
            <span className="font-semibold text-brand-600">1.</span>
            <span>
              Jalankan migrasi{" "}
              <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">
                supabase/migrations/0001_init.sql
              </code>{" "}
              di Supabase SQL Editor atau lewat <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">supabase db push</code>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-brand-600">2.</span>
            <span>
              Salin <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">frontend/.env.example</code>{" "}
              menjadi <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">frontend/.env.local</code>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-brand-600">3.</span>
            <span>
              Isi Project URL dan publishable/anon key dari Dashboard Supabase →
              Settings → API Keys.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-brand-600">4.</span>
            <span>
              Deploy Edge Functions AI (lihat{" "}
              <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">
                supabase/functions/README-TAHAP-4.md
              </code>
              ), lalu jalankan ulang <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">npm run dev</code>.
            </span>
          </li>
        </ol>

        <div className="rounded-lg bg-ink-900 px-4 py-3 font-mono text-xs text-ink-100">
          <p className="text-ink-400"># frontend/.env.local</p>
          {missingEnvVars.map((item) => (
            <p key={item.name}>
              {item.name}=<span className="text-amber-300">&lt;isi nilai ini&gt;</span>
            </p>
          ))}
        </div>

        <p className="text-xs text-ink-500">
          Keamanan: jangan pernah menaruh <em>secret key</em> atau API key Gemini di frontend.
          Keduanya hanya boleh berada di Supabase Secrets untuk Edge Functions.
        </p>
      </div>
    </div>
  );
}
