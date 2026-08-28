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
| 5. Frontend | ⏳ Belum dimulai |
| 6. Testing & Deployment | ⏳ Belum dimulai |

## Struktur repo

```
lessonlen-supabase/
├── Analisis-Saran-Rekomendasi-LMS.md
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 0001_init.sql
│   │   └── README-MIGRASI.md
│   └── functions/
│       ├── _shared/
│       │   ├── ai.ts
│       │   ├── auth.ts
│       │   └── cors.ts
│       ├── generate-material/
│       ├── generate-quiz/
│       ├── generate-assignment/
│       ├── generate-reflection/
│       ├── generate-grading/
│       ├── setup-teacher/
│       └── README-TAHAP-4.md
```

## Mulai sekarang

1. **Database**: jalankan `supabase/migrations/0001_init.sql` di Supabase SQL Editor.
2. **Edge Functions**: ikuti `supabase/functions/README-TAHAP-4.md`.
3. **Frontend**: tahap selanjutnya (Next.js + TypeScript).

## Keamanan

- Semua tabel memakai **Row Level Security (RLS)**.
- Kunci jawaban kuis tidak bisa dibaca siswa (via `get_quiz_payload`).
- API key Gemini hanya disimpan sebagai **Supabase Secret** di Edge Functions.
- Role `teacher` hanya dapat diberikan dari server (Edge Function/dashboard), bukan dari client.
