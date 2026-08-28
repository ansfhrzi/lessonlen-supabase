# Lessonlen — LMS Berbasis Supabase & Pembelajaran Mendalam (Deep Learning)

Platform **Learning Management System (LMS)** modern untuk mendukung pendekatan
pembelajaran mendalam (*Deep Learning*), integrasi kecerdasan buatan (**AI Co-Pilot Gemini**),
autentikasi hibrida presensi sekolah (**Preset Name**), dan kuis massal dengan skalabilitas tinggi (300+ concurrent user).

---

## Status Pengembangan (Roadmap)

| Tahap | Status | Catatan |
|---|---|---|
| 1. Analisis & Perancangan | ✅ Selesai | Blueprint & dokumen rekomendasi arsitektur |
| 2. Skema Database & ERD | ✅ Selesai | Perancangan 15 tabel relasional + constraints |
| 3. Implementasi Database & Security | ✅ Selesai | `0001_init.sql` (RLS + RPC `submit_quiz`, `get_quiz_payload`) |
| 4. Backend / Edge Functions AI | ✅ Selesai | 6 Edge Functions Deno/TS + Gemini SDK |
| 5. Antarmuka Frontend App | ✅ Selesai | Dua implementasi, lihat bagian di bawah |
| 6. Testing & Deployment | ⏳ Belum dimulai | Uji beban, audit RLS, deploy produksi |

---

## Dua implementasi frontend (Tahap 5)

Repo ini memuat **dua** aplikasi frontend hasil dua sesi pengerjaan. Keduanya
dipertahankan agar tidak ada pekerjaan yang hilang:

| | `src/` (root) | `frontend/` |
|---|---|---|
| Asal | PR #2 (`arena/01a0475b`) | PR ini (`arena/01a0495d`) |
| Stack | Next.js 14 + Tailwind | Next.js 16 + TypeScript strict + Tailwind + `@supabase/ssr` |
| Sumber data | **Mock** (`src/lib/mock-data.ts`), Supabase opsional | **Supabase live** (RLS + RPC + Edge Functions) |
| Auth | Demo 1-klik / NIS lab, role di client | Supabase Auth (email + Google), role dari `profiles` + `setup-teacher` |
| Mutasi data | State di browser | Server Actions → RPC (`join_course`, `claim_roster`, `submit_quiz`) |
| Proteksi rute | Context React | `src/proxy.ts` + `requireRole()` di server |
| Cocok untuk | Demo UI / presentasi tanpa backend | Jalan produksi terhadap project Supabase |

Dokumentasi lengkap `frontend/`: [`frontend/README.md`](frontend/README.md).

> **Rekomendasi:** bila prototipe `src/` sudah tidak diperlukan, hapus dalam satu
> commit terpisah agar riwayatnya tetap jelas.

---

## Fitur Utama Frontend (Tahap 5)

### 1. Autentikasi Hibrida & Preset Name (Lab-Friendly)
- **Portal Guru**: Form masuk dan pendaftaran guru berlisensi dengan validasi **Kode Lisensi Sekolah** (`SCHOOL-0001`) via proteksi server.
- **Portal Siswa**:
  - **Login Manual Komputer Lab**: Menggunakan NIS/Username + Password/PIN tanpa bergantung pada smartphone atau 2FA OTP Google.
  - **Klaim Nama Presensi (*Preset Name*)**: Siswa memasukkan kode kelas guru, lalu memilih nama resminya dari daftar presensi yang diunggah guru (mencegah typo, nama samaran, dan akun duplikat).

### 2. Workspace Guru (*Teacher Workspace*)
- **Manajemen Kelas**: Buat kelas baru dengan otomatisasi pembuatan Kode Kelas unik 6 digit alfanumerik.
- **Content Builder**:
  - Struktur hierarki berurutan: **Kelas → Bab / Modul → Aktivitas Pembelajaran**.
  - Mendukung prasyarat (*prerequisite lock*) antar bab.
  - Tipe aktivitas: **Materi Bacaan (Lesson)**, **Kuis Evaluasi (Quiz)**, **Tugas Mandiri/Kelompok (Assignment)**, dan **Jurnal Refleksi (Reflection)**.
- **AI Co-Pilot Content Builder (Gemini)**:
  - 📖 **Generate Draf Materi**: Masukkan topik dan instruksi guru → draf tersusun rapi.
  - ❓ **Generate Kuis Kontekstual**: Context injection dari materi bab + Bloom Taxonomy (C1–C4) + tingkat kesulitan.
  - 📋 **Generate Tugas & Rubrik**: Skenario tugas mandiri atau kelompok beserta rubrik kriteria penilaian.
  - 💭 **Generate Refleksi**: Pertanyaan pemantik metakognisi deep learning.
  - *Prinsip Teacher-in-the-Loop:* Guru selalu meninjau dan dapat mengedit draf sebelum disimpan ke database.
- **Manajemen Presensi (Roster)**:
  - Tempel massal (*bulk paste*) daftar nama dan NIS dari Excel/CSV.
  - Pantau status klaim siswa ("Sudah Terhubung" vs "Belum Klaim").
  - Fitur Reset Password/PIN siswa lab.
- **Buku Rekap Nilai & AI Grading**:
  - Matriks nilai otomatis untuk kuis, tugas, dan status refleksi.
  - **AI Grading Assistant**: Memberikan analisis dan draf skor tugas berdasarkan teks/link siswa.
  - **Export Nilai ke CSV**: Sekali klik untuk mengunduh rekap nilai format sekolah.
- **Jurnal Refleksi Kelas**:
  - Diagram visual agregat *Mood Tracker* (🤩 Paham Penuh, 🤔 Tertantang, 🆘 Butuh Diskusi, 😵 Masih Bingung).
  - Pembacaan jurnal metakognisi kualitatif dari tiap siswa.

### 3. Workspace Siswa (*Student Workspace*)
- **Dashboard Siswa**:
  - Ringkasan kartu kelas dan *Progress Bar* (0–100%).
  - Widget agenda dan pengingat deadline kuis/tugas.
  - Modal gabung kelas baru dengan kode kelas.
- **Tampilan Kelas & Pembelajaran**:
  - Bab yang terkunci prasyarat menampilkan indikator visual 🔒.
  - **Materi**: Pembaca format markdown bersih + tombol *Tandai Selesai*.
  - **Tugas Kelompok**: Menampilkan anggota kelompok dan ketua. **Hanya ketua kelompok yang dapat mengunggah link tugas**, anggota lain melihat status secara transparan.
  - **Kuis Skalabilitas Tinggi**:
    - Anti-kebocoran: Kunci jawaban disembunyikan di database (via RPC `get_quiz_payload`).
    - *Anti-cheat tab-switch detection*: Peringatan jika siswa membuka tab lain.
    - *LocalStorage auto-save*: Jawaban tidak hilang jika komputer lab restart atau koneksi terputus.
    - Timer hitung mundur pengerjaan.
    - *Single payload RPC submit*: Kalkulasi nilai cepat di sisi server.
    - Hasil instan: Skor, review jawaban benar/salah, dan pembahasan.
  - **Refleksi Deep Learning**:
    - Form evaluasi formatif dengan pemilih *Mood Tracker* dan refleksi proses berpikir.

---

## Akun Demo Cepat (1-Klik Tanpa Login)

Khusus aplikasi prototipe di `src/` — tersedia tombol pintas di navbar dan halaman depan:
- **Guru Pengampu**: `Ahmad Fauzi, S.Pd., M.Kom.` (SMP Labschool Cendekia)
- **Siswa 1**: `Budi Santoso` (NIS: `202401`) — Ketua Kelompok Turing
- **Siswa 2**: `Siti Nurhaliza` (NIS: `202402`) — Anggota Kelompok Turing
- **Kode Kelas Contoh**: `INF701` (Informatika VII - Berpikir Komputasional & AI)
- **Kode Lisensi Sekolah**: `SCHOOL-0001`

Aplikasi `frontend/` tidak memakai akun demo: login dilakukan ke Supabase Auth sungguhan.

---

## Struktur Folder Repositori

```text
lessonlen-supabase/
├── Analisis-Saran-Rekomendasi-LMS.md
├── Blueprint Dokumentasi ... bagian ke 1.md
├── Blueprint Dokumentasi ... bagian ke 2.md
│
├── src/                                   # Prototipe frontend (mock data) — PR #2
│   ├── app/                               # Next.js App Router
│   │   ├── page.tsx                       # Landing Page & Demo Launcher
│   │   ├── layout.tsx                     # Global Root Layout
│   │   ├── globals.css                    # Tailwind CSS Directives
│   │   ├── auth/
│   │   │   ├── teacher/page.tsx           # Portal Masuk & Daftar Guru (License Protected)
│   │   │   └── student/page.tsx           # Portal Siswa (Preset Name & NIS Lab Login)
│   │   ├── teacher/
│   │   │   ├── page.tsx                   # Teacher Workspace Dashboard
│   │   │   └── courses/[id]/page.tsx      # Course Builder, Roster, Gradebook, AI Drawer
│   │   └── student/
│   │       ├── page.tsx                   # Student Workspace Dashboard
│   │       └── courses/[id]/page.tsx      # Learning Accordion, Quiz Runner, Assignment
│   ├── components/
│   │   ├── layout/navbar.tsx              # Top Navbar & Role Switcher
│   │   ├── modals/supabase-modal.tsx      # Modal Konfigurasi Supabase URL & Anon Key
│   │   ├── teacher/                       # ai-generator-modal, roster-manager,
│   │   │                                  # gradebook-view, reflections-tab
│   │   └── student/                       # quiz-runner, assignment-view, reflection-view
│   ├── context/                           # auth-context.tsx, lms-context.tsx
│   └── lib/                               # types.ts, mock-data.ts, supabase/client.ts
│
├── frontend/                              # Frontend Supabase live — PR ini
│   ├── README.md                          # Panduan lengkap Tahap 5
│   ├── package.json
│   └── src/
│       ├── proxy.ts                       # refresh session + proteksi rute
│       ├── app/{login,signup,auth,teacher,student}/
│       ├── components/{ui,teacher,student}/
│       └── lib/{actions,supabase,types}/
│
├── supabase/
│   ├── config.toml                        # Supabase CLI Configuration
│   ├── migrations/
│   │   ├── 0001_init.sql                  # Database Schema, RLS, Functions & RPC
│   │   └── README-MIGRASI.md              # Petunjuk Eksekusi SQL
│   └── functions/                         # Supabase Edge Functions (Deno AI Backend)
│       ├── _shared/                       # CORS, Auth, Gemini & Quota Helpers
│       ├── generate-material/             # AI Generator Materi
│       ├── generate-quiz/                 # AI Generator Kuis (Context Aware)
│       ├── generate-assignment/           # AI Generator Tugas & Rubrik
│       ├── generate-reflection/           # AI Generator Refleksi
│       ├── generate-grading/              # AI Assistant Grading Tugas
│       ├── setup-teacher/                 # Promosi Role Guru via Lisensi
│       └── README-TAHAP-4.md              # Panduan Deploy Edge Functions
│
├── package.json                           # Dependensi prototipe src/
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Cara Menjalankan

### A. Prototipe UI (`src/`, data mock)

```bash
npm install
npm run dev          # http://localhost:3000
```

Untuk menyambungkan prototipe ke Supabase:
1. Klik **"Mode Demo Aktif" / "Konfigurasi Supabase"** di pojok kanan atas Navbar.
2. Masukkan **Project URL** dan **Anon Key**.
3. Pastikan `supabase/migrations/0001_init.sql` sudah dijalankan.

### B. Aplikasi Supabase live (`frontend/`)

```bash
cd frontend
cp .env.example .env.local   # isi Project URL + anon/publishable key
npm install
npm run dev                  # http://localhost:3000
```

Urutan yang disarankan:
1. **Database** — jalankan `supabase/migrations/0001_init.sql` (atau `supabase db push`).
2. **Edge Functions** — ikuti `supabase/functions/README-TAHAP-4.md`.
3. **Frontend** — ikuti `frontend/README.md`.
4. **Akun guru** — daftar, lalu aktifkan peran guru dari menu *Aktivasi Guru*
   memakai kode lisensi sekolah (default `SCHOOL-0001`).

Bila `.env.local` belum diisi, `frontend/` tidak error — yang tampil adalah halaman
panduan konfigurasi.

---

## Keamanan

- Semua tabel memakai **Row Level Security (RLS)**.
- Kunci jawaban kuis tidak bisa dibaca siswa (via `get_quiz_payload`); penilaian
  dihitung server-side lewat RPC `submit_quiz`.
- API key Gemini hanya disimpan sebagai **Supabase Secret** di Edge Functions —
  frontend hanya memakai anon/publishable key.
- Role `teacher` hanya dapat diberikan dari server (Edge Function `setup-teacher`
  dengan kode lisensi), bukan dari client.
- Hasil AI selalu berupa **draf** yang harus disetujui guru sebelum tersimpan.
- Nilai draf AI disimpan terpisah di `ai_feedback`; nilai resmi tetap di `grade`.

---

## Tahap selanjutnya (Tahap 6)

- Uji beban `submit_quiz` untuk 300+ pengguna bersamaan.
- Audit ulang RLS + isolasi data antar kelas (pgTAP / CLI integration test).
- Putuskan implementasi frontend yang dipakai produksi, lalu deploy ke
  Vercel/Netlify + cron anti auto-pause Supabase Free Tier.
