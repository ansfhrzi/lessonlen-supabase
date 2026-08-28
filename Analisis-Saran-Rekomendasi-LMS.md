# Analisis & Rekomendasi Sistem LMS Berbasis Supabase (Lessonlen)

> Dokumen ini adalah **review blueprint** (`Blueprint ... bagian ke 1` dan `bagian ke 2`) beserta rekomendasi implementasi terbaik. Dibuat untuk dijadikan acuan sebelum masuk ke Tahap 3 (implementasi database), Tahap 4 (Edge Functions), dan Tahap 5 (Frontend).

---

## 1. Ringkasan Penilaian (TL;DR)

| Aspek | Skor | Catatan |
|---|---|---|
| Kelengkapan visi & fitur | 🟢 Sangat baik | Deep learning + AI + tugas kelompok + refleksi sudah lengkap |
| Arsitektur umum | 🟢 Baik | Supabase + Edge Functions + RLS adalah pilihan tepat |
| Keunikan (differentiator) | 🟢 Baik | *Preset Name* + autentikasi hibrida sangat cocok untuk konteks sekolah/lab |
| Skema database | 🟡 Perlu disempurnakan | Beberapa tabel kurang normalisasi & kurang constraint keamanan |
| Keamanan data | 🟡 Perlu penguatan | RLS belum detail, `correct_key` berisiko bocor ke siswa |
| Skalabilitas kuis | 🟡 Perlu penyesuaian | Strategi 300+ user bagus, tapi ada beberapa lubang teknis |
| Integrasi AI | 🟡 Perlu penguatan | Perlu validasi output, quota, audit, dan aturan grading link |
| Kelayakan produksi | 🟡 Perlu roadmap MVP | Jangan langsung semua fitur; bangun MVP yang bisa dipakai guru |

**Kesimpulan utama:** Rancangan Anda sudah **di atas rata-rata** untuk blueprint awal — arah arsitekturnya benar. Yang perlu diperbaiki bukan konsep besarnya, melainkan **detail engineering, keamanan data, konsistensi skema, dan prioritas pengembangan**. Rekomendasi saya: **bangun MVP dulu (tanpa AI, tanpa WhatsApp) → lalu tambah AI → lalu fitur operasional.**

---

## 2. Kekuatan Rancangan (Pertahankan)

1. **Pemilihan stack yang tepat** — Supabase (PostgreSQL + Auth + Storage + RLS) + Edge Functions untuk Gemini adalah kombinasi yang hemat biaya dan aman untuk hidden API key.
2. **Autentikasi hibrida siswa** — *Preset Name* mengatasi typo, nama gaul, dan kendala 2FA di lab sekolah. Ini solusi yang *intelligent* dan jarang ada di LMS komersial.
3. **Konsep *teacher-in-the-loop*** — AI Generator hanya material/konten, guru tetap meninjau sebelum publish. Ini sangat benar dan menghindari konten AI liar.
4. **Kuis massal via "load all + localStorage + single RPC"** — pendekatan yang tepat untuk mengurangi chatter ke server saat 300+ user mengerjakan bersamaan.
5. **Hierarki konten yang jelas** — Kelas → Modul → Aktivitas → Refleksi. Struktur ini mudah dipahami frontend dan mudah dianalisis.
6. **Gagasan fitur pendukung kuat** — prerequisite content, duplicate course, export nilai, WhatsApp, dan PWA bernilai tinggi untuk operasional guru.

---

## 3. Kelemahan, Risiko, dan Perbaikan (Prioritas Tertinggi)

### 3.1 Skema Database — konsistensi & integritas data

#### Masalah yang ditemukan
- **`class_members` menggabungkan 2 konsep berbeda** (daftar presensi vs keanggotaan siswa). Ini menyulitkan saat guru mengunggah ulang absensi atau saat siswa pindah/keluar.
- **Tidak ada tabel `schools`** — hanya `school_institution` (teks) pada `profiles`. Padahal rencana Anda melibatkan *Kode Lisensi Sekolah* dan banyak guru pada satu sekolah. `school_license_code` yang dilekatkan ke `courses` membuat lisensi tidak konsisten.
- **Tidak ada tabel `activity_assets`** — materi bisa PDF/video/audio/gambar, tetapi `activities.content` hanya satu kolom teks. Storage Supabase tidak tersambung ke skema.
- **`quiz_questions` menyimpan `correct_key` sebagai indeks angka** pada array JSONB. Jika soal/opsi diacak, indeks akan rusak.
- **Tidak ada `due_at`, `max_attempts`, `late_policy`** pada tugas/kuis, sehingga deadline dan kebijakan ulang belum tertangani.
- **Refleksi & completion** belum punya situs kebenaran (single source of truth) untuk *prerequisite* dan progress bar.
- **Tidak ada tabel `notifications` / `ai_usage` / `audit_logs`** — padahal blueprint menyebut WhatsApp notification, AI quota, dan audit security.

#### Rekomendasi skema (reinventasi)

> Hapus/moduifikasi beberapa tabel berikut agar lebih kuat dan mudah di-RLS.

```text
profiles
  id, full_name, role(teacher|student), whatsapp_number, email,
  school_id (nullable), created_at, is_active

schools
  id, name, license_code (unique), is_active, created_at

courses
  id, teacher_id, school_id?, title, subject, grade_level,
  class_code (unique, random 7-8 char), description,
  year_term, is_archived, created_at

course_enrollments          # keanggotaan siswa ke kursus
  id, course_id, student_id, enrolled_via, is_active,
  joined_at, UNIQUE(course_id, student_id)

class_rosters               # "preset name" original yang diupload guru
  id, course_id, nis (nullable), full_name, sort_order,
  is_pre_allocated, UNIQUE(course_id, nis), UNIQUE(course_id, full_name)

roster_claims               # klaim nama oleh siswa (link ke enrollment)
  id, roster_id, enrollment_id, claimed_at, UNIQUE(roster_id)
  -- satu enrollment boleh klaim 1 roster; satu roster dipakai 1 kali

modules
  id, course_id, title, description, order_index,
  is_published, created_at, updated_at

module_prerequisites        # baru: relasi syarat antar modul
  module_id, prereq_module_id, PRIMARY KEY(module_id, prereq_module_id)

activities
  id, module_id, title, type(lesson|assignment|quiz|reflection),
  description, content_markdown, assignment_mode, reflection_prompt,
  order_index, is_published, due_at (nullable),
  UNIQUE(module_id, order_index)  -- for clean ordering

activity_assets            # materi PDF/video/gambar
  id, activity_id, asset_type(pdf|video|image|audio), storage_path,
  file_name, size_bytes, mime_type, created_at

quiz_questions
  id, activity_id, question_type(single|multiple|short_answer),
  question_text, options JSONB,   -- options: [{"key":"A","text":".."}]
  correct_keys TEXT[],            -- array of keys, bukan indeks
  explanation, points, difficulty, bloom_taxonomy, source_ref,
  is_active, created_at

quiz_submissions
  id, activity_id, student_id, attempt_no, score,
  answers_payload JSONB,          -- {"qid":"A","qid2":["B","C"]}
  results_payload JSONB,          -- per-soal benar/salah
  time_taken_seconds, status, submitted_at,
  UNIQUE(activity_id, student_id, attempt_no)

groups
  id, activity_id, group_name, leader_id, assignment_method, created_at

group_members
  id, group_id, student_id, is_active, UNIQUE(group_id, student_id)

assignment_submissions
  id, activity_id, student_id (nullable), group_id (nullable),
  submission_link, submission_text, grade, ai_feedback,
  feedback, submitted_at, updated_at,
  CHECK( (student_id IS NOT NULL AND group_id IS NULL)
      OR (student_id IS NULL AND group_id IS NOT NULL) )

reflections
  id, activity_id, student_id, reflection_text, mood_tracker,
  created_at, UNIQUE(activity_id, student_id)

completions                 # single source of truth untuk progress/prereq
  id, student_id, activity_id, completed_at,
  UNIQUE(student_id, activity_id)

notifications               # WhatsApp / in-app
  id, recipient_id, channel(whatsapp|email|inapp), title,
  body, status, external_id, sent_at

ai_generations              # audit + quota AI
  id, teacher_id, feature_type(material|quiz|assignment|reflection|grading),
  prompt_hash, model_name, prompt_tokens, completion_tokens,
  status(ok|error), created_at

audit_logs                  # opsional untuk keamanan lanjutan
  id, actor_id, action, entity, entity_id, metadata JSONB, created_at
```

#### Database migrations & indexing (penting)
- Jalankan semua perubahan lewat **Supabase CLI migrations** (`supabase migration new ...`), bukan manual SQL Editor, agar bisa di-version-control dan rollback.
- Buat **index** untuk hot path:
  - `courses(teacher_id)`
  - `module_prerequisites(module_id)`
  - `activities(module_id, order_index)`
  - `quiz_questions(activity_id)`
  - `quiz_submissions(activity_id, student_id)`
  - `assignment_submissions(activity_id, group_id)`
  - `reflections(activity_id, student_id)`
  - `class_rosters(course_id)`
- Gunakan **view + security barrier** untuk payload kuis tanpa `correct_key`.

---

### 3.2 Keamanan & RLS (Wajib diselesaikan sebelum Tahap 3)

Blueprint hanya menyebut "RLS memisahkan guru/siswa", tetapi tidak mendefinisikan policy. Ini **risiko kebocoran data terbesar**. Rekomendasi kebijakan:

| Tabel | Guru | Siswa |
|---|---|---|
| `profiles` | baca semua di kelasnya | baca & ubah sendiri |
| `schools` | baca milik sekolah | baca milik sekolah (atau tidak) |
| `courses` | tulis (pemilik) | baca (anggota via enrollment) |
| `course_enrollments` | tulis (roster via guru) | baca sendiri, tulis saat join |
| `class_rosters` | tulis | baca (hanya nama) saat claim, tidak bisa ubah |
| `roster_claims` | baca | tulis hanya untuk dirinya |
| `modules` / `activities` | tulis | baca jika anggota & published |
| `activity_assets` | tulis | baca jika anggota & published |
| `quiz_questions` | **baca penuh** | **JANGAN langsung expose `correct_keys`** |
| `quiz_submissions` | baca milik kelas | baca/tulis sendiri |
| `groups` / `group_members` | tulis | baca miliknya, ketua bisa kelola |
| `assignment_submissions` | tulis nilai | siswa: baca sendiri; ketua: upsert group link |
| `reflections` | baca milik kelas | tulis/baca sendiri |
| `completions` | baca milik kelas | tulis/baca sendiri |
| `ai_generations` | tulis sendiri | tidak ada akses |

#### Aturan RLS wajib
1. **Semua tabel aktifkan RLS** (`alter table ... enable row level security`).
2. Tulis **helper function** untuk mengecek keanggotaan agar tidak mengulang query:
   ```sql
   create or replace function is_course_member(cid uuid)
   returns boolean language sql security definer stable as $$
     select exists (
       select 1 from course_enrollments e
       join courses c on c.id = e.course_id
       where c.id = cid and e.student_id = auth.uid() and e.is_active
     ) or exists (
       select 1 from courses c
       where c.id = cid and c.teacher_id = auth.uid()
     );
   $$;
   ```
3. **Jangan langsung expose `correct_keys`**: buat fungsi `get_quiz_payload(activity_id)` yang mengembalikan soal + options **tanpa `correct_keys`**. RLS pada `quiz_questions` hanya untuk guru; siswa memanggil RPC tertentu.
4. **Storage bucket RLS** pada `course-assets` (baca hanya anggota) dan `submissions` (tulis hanya pemilik).
5. **Jangan pernah memakai `security definer` tanpa pengawasan** — batasi `search_path` dan selalu validasi `auth.uid()`.

---

### 3.3 Skalabilitas & performa kuis (300+ concurrent)

Rancangan Anda (load-all + localStorage + single RPC) **sudah bagus**, tetapi perlu diperbaiki beberapa hal:

1. **localStorage bisa hilang** (mode privat, browser lab, clear cache). Tambahkan **backup jawaban berkala** (mis. tiap 30 detik) ke server? Tidak perlu setiap detik — cukup:
   - Simpan jawaban di localStorage
   - Kirim `save_draft` secara throttled (mis. setelah setiap 3 soal atau tiap 15–30 detik)
   - Saat submit, kirim payload penuh ke `submit_quiz()`
2. **Jangan buka semua soal dalam 1 query tanpa pagination** jika bank soal > 50–100. Untuk kuis sekolah (< 30 soal) load-all OK. Sediakan `get_quiz_payload()` dengan `LIMIT` dan id daftar.
3. **Single RPC: buat versi retry + idempotency**. Beri `submission_id` (UUID) dan di RPC cek apakah sudah ada; kalau sudah, update (bukan insert) → mencegah nilai dobel saat timeout.
4. **Timer** harus berbasis **server time** saat mulai (payload berisi `started_at`), bukan hanya `setInterval` client. Saat submit, validasi `time_taken` untuk mencegah cheat waktu.
5. **Anti-cheating** — tab-switch, disable copy, dll. hanyalah **pencegah** dan mudah di-bypass. Jangan anggap sebagai keamanan sungguhan. Gunakan sebagai *deterrent + analytics*, bukan enforcement.
6. **Realtime dimatikan** di halaman kuis: benar. Nonaktifkan global subscribe pada route `/quiz/*`.

---

### 3.4 Integrasi AI (Gemini via Edge Function)

#### Rekomendasi teknis
- Gunakan **Edge Function Deno/TypeScript** + GenAI SDK yang mendukung **structured output** (`response_mime_type: application/json`), lalu validasi dengan **Zod** di server sebelum menyimpan.
- **Jangan simpan API key di client** — hanya di `supabase secrets`. Sudah benar di blueprint.
- **Rate limit & quota**:
  ```sql
  -- contoh batas
  create table ai_usage (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id),
    feature_type text,
    used_at timestamptz default now()
  );
  ```
  Di Edge Function: cek jumlah `ai_usage` dalam 24 jam; jika melebihi kuota, return 429 + pesan.
- **Token & konteks**: saat konten materi panjang, potong/chunk sebelum dikirim. Set `max_tokens` dan `temperature` per fitur.
- **Audit**: simpan `prompt_hash`, `model`, usage tokens ke `ai_generations` — berguna untuk debug dan billing.
- **Jangan biarkan AI meng-haji link eksternal** saat AI grading assignment. Submission berupa link Drive/GitHub/Notion — AI **tidak bisa membukanya secara aman**. Solusi:
  - Siswa menempelkan **teks** artikel/jawaban → AI memberi draf grading + feedback.
  - Kalau hanya link: AI hanya kasih **rubric checklist** untuk guru, **bukan nilai otomatis**.
- **Sistem prompt** harus menyatakan "100% bersumber dari materi bab yang diberikan; jika konteks kurang, tandai & minta guru tambah." Ini mencegah halusinasi.

---

### 3.5 Produk & UX

- **Onboarding guru**: buat `Buat Kelas → Pilih rombel → Tempel daftar nama (atau CSV/NIS) → Buat kode kelas`. Jangan minta guru meng-upload file jika bisa tempel teks.
- **Kode kelas**: 7–8 karakter alfanumerik, unik, bisa di-regenerate, opsional expiry. Saat join, validasi kode + jumlah slot.
- **Klaim nama**: tampilkan daftar nama dengan search. Jika ada nama dobel (2 siswa bernama sama), minta pilih berdasarkan NIS — makanya `nis` wajib di roster.
- **Notif WhatsApp**: WhatsApp Cloud API/Twilio/Fonnte/Wablas memerlukan nomor yang terverifikasi + consent. Simpan `whatsapp_number` di `profiles`, tapi **minta opt-in**. Mulailah dengan **email + in-app** gratis, lalu tambah WhatsApp sebagai fitur opsional.
- **PWA**: cache materi (teks) agar bisa dibaca offline; kuis/tugas tetap online. Jangan cache halaman grading/gradebook.
- **Accessibility**: mode kontras tinggi, ukuran font, dan dukungan low-bandwidth.

---

### 3.6 Deployment & Operasional (Free Tier)

- Target 300 concurrent di **Supabase Free** sangat optimis (batas koneksi, egress, memory). Untuk uji coba 1 sekolah fine; untuk produksi serius, **Naikkan ke Pro** atau **self-hosted** saat traffic besar.
- **Cron ping** untuk anti auto-pause: gunakan **Vercel Cron** (gratis di hobby) atau GitHub Actions. Buat endpoint `GET /api/ping` yang tidak memakai AI.
- **Monitoring**: gunakan Supabase Logs/analytics + Vercel logs + error tracking (Sentry) sejak awal.
- **Backup**: aktifkan PITR (jika Pro) atau cadangkan DB via `pg_dump` rutin.
- **CI/CD**: GitHub Actions untuk `supabase db push`, test RLS, tipe-check.

---

### 3.7 Pemilihan stack & struktur proyek (rekomendasi)

**Rekomendasi utama:**
- **Frontend:** Next.js 15 (App Router) + TypeScript + TailwindCSS + shadcn/ui. MVC yang solid, SSR untuk SEO, Vercel deployment mudah.
- **Data layer:** `@supabase/ssr` + repository pattern, Zod untuk validasi.
- **Edge functions:** Deno + TypeScript di folder `supabase/functions/`.
- **Testing:** Vitest (unit), Playwright (E2E), dan **tes RLS** dengan peran user berbeda.
- **Auth enum:** pakai custom claim `role = app_metadata.role` **di auth.users** → lebih cepat di RLS daripada join ke `profiles` setiap query.

Struktur folder ideal:
```
lessonlen-supabase/
├── analytics/                # feature-flag & usage (opsional)
├── docs/                     # blueprint & keputusan keputusan
├── src/
│   ├── app/                  # Next.js App Router (user/teacher/student)
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase/         # server/client/admin
│   │   └── ai/               # Gemini client + zod schemas
│   └── ...
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── tests/                # RLS tests
│   └── config.toml
└── .github/workflows/        # CI/CD
```

---

## 4. Peta Jalan yang Saya Rekomendasikan (Roadmap Terbaru)

### Fase 0 — Fondasi (1–2 minggu)
- Migrasi skema final (dengan sekolah, roster, asset, completion).
- RLS lengkap + helper + backup.
- Auth hibrida (teacher sign-up, student join via code + claim nama + manual/Google).
- CI/CD dasar + testing RLS.

### Fase 1 — MVP Guru (2–3 minggu)
- Teacher dashboard: buat kelas, buat modul, buat aktivitas (materi manual, tugas individu, kuis manual).
- Student dashboard: join kelas, lihat materi, kerjakan kuis (tanpa AI), submit link, lihat nilai.
- **Belum: AI, WhatsApp, PWA, anti-cheat.**

### Fase 2 — AI Generator (2–3 minggu)
- Edge Function `generate-material`, `generate-quiz`, `generate-assignment`, `generate-reflection`.
- Structured JSON + Zod + teacher preview/edit.
- `ai_usage` quota + audit.

### Fase 3 — Deep Learning & Kolaborasi (2–3 minggu)
- Refleksi + mood tracker + rekap guru.
- Tugas kelompok (random/leader) + submission hanya ketua.
- Gradebook + export Excel/CSV + prerequisite content.

### Fase 4 — Kualitas & Produksi (2–3 minggu)
- Kuis massal: draft backup, timer server, anti-cheat deterrent, `submit_quiz` idempotent.
- AI grading (teks) + WhatsApp/webhook + duplicate course + PWA cache.
- Load test, audit security, dataset sampling, monitoring, docs.

---

## 5. Backlog Prioritas (Prioritized)

| Prioritas | Item | Dampak | Effort |
|---|---|---|---|
| P0 | Data model final + migration + RLS | 🔴 High | L |
| P0 | Auth hibrida + klaim nama | 🔴 High | M |
| P0 | Kelas + Modul + Materi (manual) | 🔴 High | M |
| P1 | Kuis dasar + submit RPC | 🔴 High | M |
| P1 | Dashboard Guru & Siswa | 🔴 High | L |
| P1 | Tugas Individu + nilai | 🔴 High | M |
| P2 | AI generator (materi/kuis) | 🟠 Medium | L |
| P2 | Refleksi + mood tracker | 🟠 Medium | M |
| P2 | Tugas kelompok | 🟠 Medium | M |
| P3 | AI grading, WhatsApp, PWA, export | 🟡 Nice | L |
| P3 | Anti-cheat + prerequisite | 🟡 Nice | M |

---

## 6. Rekomendasi Tambahan yang *Belum Ada* di Blueprint

1. **Kelas multi-guru** — tambahkan peran `teacher` sebagai *member* pada `course_enrollments`/`course_roles`, supaya guru mapel yang sama bisa berkolaborasi.
2. **Announcements** — tabel pengumuman per kelas (dengan notifikasi) sangat dibutuhkan guru.
3. **Audit activity log** — untuk kebutuhan sekolah & audit keamanan.
4. **Pemulihan dan revoke class code** — guru bisa mengganti kode kelas jika bocor.
5. **Pengingat deadline otomatis** — buat scheduler (Vercel Cron) yang mengirim notifikasi H-1/H-3.
6. **Mode kuis latihan vs penilaian** — latihan (unlimited retry, langsung feedback) vs penilaian (1 attempt, timer).
7. **Data isolasi antar sekolah** — jika nanti multi-sekolah, pertimbangkan schema-per-school atau `school_id` di seluruh tabel inti.
8. **Kebijakan retensi data** — siswa yang lulus/keluar di-archive, bukan dihapus, agar rekap arsip tetap terjaga.

---

## 7. Saran Tahap Berikutnya (Jika Anda Setuju)

Saya sarankan kita lanjut ke **Tahap 3** dengan langkah ini:
1. Saya buatkan **file migrasi Supabase awal** (`supabase/migrations/0001_init.sql`) berisi skema final di atas.
2. Saya buatkan **helper + RLS policies** lengkap.
3. Saya buatkan **fungsi `get_quiz_payload`** dan **`submit_quiz`**.
4. Saya tulisi **test RLS** sederhana untuk memastikan siswa tidak bisa membaca `correct_keys`.
5. Kemudian lanjut ke **Edge Function pertama** (`generate-quiz`) jika Anda ingin cepat merasakan AI.

Tolong konfirmasi **ukuran target** (single sekolah vs multi-sekolah) dan **stack frontend** yang Anda inginkan (Next.js vs React/Vite vs lainnya) supaya langkah berikutnya (Tahap 3–5) bisa langsung saya kerjakan dengan presisi.
