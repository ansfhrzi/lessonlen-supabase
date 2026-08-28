# Tahap 5 — Frontend Lessonlen (Next.js + TypeScript)

Antarmuka **Ruang Guru** dan **Ruang Siswa** yang tersambung ke database Supabase
(Tahap 3) dan Edge Functions AI (Tahap 4).

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Server Components + Server Actions) |
| Bahasa | TypeScript (strict) |
| Gaya | Tailwind CSS 3 |
| Auth & data | `@supabase/ssr` + `@supabase/supabase-js` |
| Proteksi rute | `src/proxy.ts` (pengganti `middleware.ts` di Next.js 16) |

---

## 1. Prasyarat

1. **Database sudah dimigrasi** — jalankan `supabase/migrations/0001_init.sql`
   (lihat `supabase/migrations/README-MIGRASI.md`).
2. **Edge Functions sudah di-deploy** — lihat `supabase/functions/README-TAHAP-4.md`.
   Tanpa ini, tombol AI Generator dan aktivasi guru akan gagal.
3. **Auth provider aktif** — Authentication → Providers → **Email** (dan **Google**
   bila memakai SSO), dengan redirect URL `https://<domain-anda>/auth/callback`.

## 2. Instalasi

```bash
cd frontend
cp .env.example .env.local   # lalu isi nilainya
npm install
npm run dev                  # http://localhost:3000
```

Isi `.env.local`:

| Variabel | Sumber |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard → Settings → API → publishable/anon key |
| `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` | opsional; default `<PROJECT_URL>/functions/v1` |

> Bila env belum diisi, aplikasi tidak akan error — yang tampil adalah halaman
> panduan konfigurasi (`src/components/env-setup-notice.tsx`).

Perintah lain:

```bash
npm run build      # build produksi (sekaligus menjalankan type check)
npm run start      # jalankan hasil build
npm run typecheck  # tsc --noEmit
```

## 3. Struktur

```
frontend/
├── src/
│   ├── proxy.ts                     # refresh session + proteksi /teacher & /student
│   ├── app/
│   │   ├── login/ signup/           # auth email/password + Google SSO
│   │   ├── auth/callback/route.ts   # tukar code OAuth / konfirmasi email
│   │   ├── teacher/                 # Ruang Guru
│   │   │   ├── page.tsx                      # daftar kelas + statistik
│   │   │   ├── activate/                     # aktivasi peran guru (kode lisensi)
│   │   │   └── courses/[courseId]/
│   │   │       ├── page.tsx                  # modul, aktivitas, kode kelas, siswa
│   │   │       ├── modules/[moduleId]/       # Content Builder + AI Studio
│   │   │       ├── roster/                   # daftar presensi (preset name)
│   │   │       ├── gradebook/                # rekap nilai kuis & tugas
│   │   │       └── activities/[activityId]/submissions/  # penilaian + AI grading
│   │   └── student/                 # Ruang Siswa
│   │       ├── page.tsx                      # gabung kelas + progres
│   │       ├── journal/                      # rekap jurnal refleksi
│   │       └── courses/[courseId]/
│   │           ├── page.tsx                  # klaim nama + navigasi modul
│   │           └── activities/[activityId]/  # materi / kuis / tugas / refleksi
│   ├── components/
│   │   ├── ui.tsx                   # Button, Card, Input, Badge, Alert, dll.
│   │   ├── teacher/                 # form kelas/modul, AI generators, quiz bank, grading
│   │   └── student/                 # join course, roster claim, quiz runner, dll.
│   └── lib/
│       ├── actions/                 # Server Actions (auth, teacher, student)
│       ├── supabase/                # client browser & server
│       ├── types/database.ts        # tipe sesuai 0001_init.sql
│       ├── edge.ts                  # pemanggil Edge Function + JWT user
│       ├── markdown.ts              # draf AI → Markdown, Markdown → HTML, parse rubrik
│       ├── session.ts               # requireSession / requireRole
│       └── format.ts, config.ts, cn.ts
```

## 4. Cara data mengalir

| Kebutuhan | Jalur | Alasan |
|---|---|---|
| Baca data (halaman) | Server Component → `createClient()` (cookie session) | RLS tetap berlaku, tidak ada key bocor |
| Tulis data | Server Action (`lib/actions/*`) → `requireRole()` | Validasi role di server sebelum query |
| Soal kuis siswa | Browser → RPC `get_quiz_payload` | `correct_keys` tidak pernah keluar dari DB |
| Penilaian kuis | Server Action → RPC `submit_quiz` | Skor dihitung server-side + idempoten |
| Semua fitur AI | Browser → Edge Function + `Authorization: Bearer <JWT>` | API key Gemini tetap di Supabase Secrets |
| Refresh token | `src/proxy.ts` | Cookie session selalu terbarui |

**Teacher-in-the-loop:** hasil AI selalu muncul sebagai *draf* di panel pratinjau.
Guru mengedit, lalu menekan "Simpan" — AI tidak pernah menulis langsung ke tabel utama.

## 5. Alur utama

**Guru**
1. Daftar/login → default role `student`.
2. `/teacher/activate` → masukkan kode lisensi sekolah → Edge Function `setup-teacher`
   menaikkan role menjadi `teacher`.
3. Buat kelas → sistem membuat **kode kelas** unik otomatis.
4. Tambah modul → buka Content Builder → pakai **AI Studio** (Materi / Soal Kuis /
   Tugas / Refleksi) → tinjau draf → simpan.
5. Unggah daftar presensi di **Daftar presensi**.
6. Nilai tugas di **Penilaian tugas** (bisa minta draf dari `generate-grading`).
7. Pantau hasil di **Rekap nilai**.

**Siswa**
1. Daftar/login → gabung kelas dengan kode kelas.
2. **Klaim nama** pada daftar presensi yang diunggah guru.
3. Kerjakan modul berurutan — modul dengan prasyarat terkunci sampai modul
   sebelumnya selesai.
4. Kerjakan kuis (dinilai server), kumpulkan tugas, tulis refleksi.
5. Lihat rekap di **Jurnal Refleksi**.

## 6. Catatan keamanan

- Tidak ada `service_role`/secret key di frontend — hanya publishable/anon key.
- Role tidak pernah dipilih dari client; aktivasi guru lewat kode lisensi di server.
- Kunci jawaban hanya terbaca oleh guru (kebijakan RLS `quiz_questions_select_teacher`).
- Nilai AI disimpan terpisah di kolom `ai_feedback`; nilai resmi di `grade`.

## 7. Status verifikasi

Yang sudah dijalankan saat tahap ini dibuat:

- `npm run build` — lolos, 16 rute + proxy terdeteksi, type check bersih.
- Uji runtime dengan `npm run start`: seluruh rute guru & siswa dirender nyata
  terhadap backend Supabase (dipakai stub lokal berbentuk respons Supabase karena
  sandbox tidak punya akses ke project produksi), termasuk:
  - `/teacher`, `/teacher/activate`, `/teacher/courses/[id]`, Content Builder,
    roster, gradebook, dan halaman penilaian (rubrik terbaca dari Markdown tugas).
  - `/student`, `/student/journal`, `/student/courses/[id]`, serta halaman aktivitas
    materi/kuis/tugas/refleksi.
  - Proteksi rute: tanpa session `/teacher` → `307 /login?next=%2Fteacher`;
    siswa yang membuka `/teacher` → `307 /student`; sudah login membuka `/login` → `307 /`.

Yang **belum** diuji di sini: pemanggilan nyata ke Gemini/Edge Functions dan RPC
`submit_quiz`/`claim_roster` terhadap project Supabase produksi — perlu project ref
dan API key Anda.
