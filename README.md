# Lessonlen — LMS berbasis Supabase

Platform **Learning Management System (LMS)** untuk mendukung pembelajaran
mendalam (*Deep Learning*) dan asisten AI untuk guru.

## Status pengembangan

| Tahap | Status |
|---|---|
| 1. Analisis & Perancangan | ✅ Selesai |
| 2. Skema Database & ERD | ✅ Selesai |
| 3. Implementasi Database & Security | ✅ Selesai (migrasi Supabase) |
| 4. Backend / Edge Functions AI | ✅ Selesai (struktur + petunjuk deploy) |
| 5. Frontend | ✅ Selesai (Next.js + TypeScript, ruang guru & siswa) |
| 6. Testing & Deployment | ⏳ Belum dimulai |

## Struktur repo

```
lessonlen-supabase/
├── Analisis-Saran-Rekomendasi-LMS.md
├── Blueprint Dokumentasi ... bagian ke 1.md
├── Blueprint Dokumentasi ... bagian ke 2.md
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 0001_init.sql
│   │   └── README-MIGRASI.md
│   └── functions/
│       ├── _shared/ (ai.ts, auth.ts, cors.ts)
│       ├── generate-material/
│       ├── generate-quiz/
│       ├── generate-assignment/
│       ├── generate-reflection/
│       ├── generate-grading/
│       ├── setup-teacher/
│       └── README-TAHAP-4.md
└── frontend/                        ← Tahap 5
    ├── README.md
    ├── package.json
    └── src/
        ├── proxy.ts                 # proteksi rute + refresh session
        ├── app/{login,signup,auth,teacher,student}/
        ├── components/{ui,teacher,student}/
        └── lib/{actions,supabase,types}/
```

## Mulai sekarang

1. **Database** — jalankan `supabase/migrations/0001_init.sql` di Supabase SQL
   Editor (atau `supabase db push`).
2. **Edge Functions** — ikuti `supabase/functions/README-TAHAP-4.md`.
3. **Frontend** — ikuti `frontend/README.md`:
   ```bash
   cd frontend
   cp .env.example .env.local   # isi Project URL + anon key
   npm install
   npm run dev
   ```
4. **Akun guru** — daftar seperti biasa, lalu aktifkan peran guru dari menu
   *Aktivasi Guru* memakai kode lisensi sekolah (default `SCHOOL-0001`).

## Keamanan

- Semua tabel memakai **Row Level Security (RLS)**.
- Kunci jawaban kuis tidak bisa dibaca siswa (via `get_quiz_payload`); penilaian
  dihitung server-side lewat RPC `submit_quiz`.
- API key Gemini hanya disimpan sebagai **Supabase Secret** di Edge Functions —
  frontend hanya memakai anon/publishable key.
- Role `teacher` hanya dapat diberikan dari server (Edge Function `setup-teacher`
  dengan kode lisensi), bukan dari client.
- Hasil AI selalu berupa **draf** yang harus disetujui guru sebelum tersimpan.

## Tahap selanjutnya (Tahap 6)

- Uji beban `submit_quiz` untuk 300+ pengguna bersamaan.
- Audit ulang RLS + isolasi data antar kelas (pgTAP / CLI integration test).
- Deploy frontend ke Vercel/Netlify + cron anti auto-pause Supabase Free Tier.
