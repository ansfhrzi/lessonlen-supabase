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
| 5. Antarmuka Frontend App | ✅ Selesai | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| 6. Testing & Deployment | 🚀 Berjalan | Dev server / Live preview aktif di port 3000 |

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

Tersedia tombol pintas di navbar dan halaman depan untuk pengujian instan:
- **Guru Pengampu**: `Ahmad Fauzi, S.Pd., M.Kom.` (SMP Labschool Cendekia)
- **Siswa 1**: `Budi Santoso` (NIS: `202401`) — Ketua Kelompok Turing
- **Siswa 2**: `Siti Nurhaliza` (NIS: `202402`) — Anggota Kelompok Turing
- **Kode Kelas Contoh**: `INF701` (Informatika VII - Berpikir Komputasional & AI)
- **Kode Lisensi Sekolah**: `SCHOOL-0001`

---

## Struktur Folder Repositori

```text
lessonlen-supabase/
├── src/
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
│   │   ├── teacher/
│   │   │   ├── ai-generator-modal.tsx     # Gemini AI Content Builder Drawer
│   │   │   ├── roster-manager.tsx         # Manajemen Presensi & Preset Name
│   │   │   ├── gradebook-view.tsx         # Rekap Nilai, AI Grading, Export CSV
│   │   │   └── reflections-tab.tsx        # Analitik Mood Tracker & Jurnal Siswa
│   │   └── student/
│   │       ├── quiz-runner.tsx            # Anti-Cheat Scalable Quiz Interface
│   │       ├── assignment-view.tsx        # Pengumpulan Link (Leader Only for Group)
│   │       └── reflection-view.tsx        # Lembar Refleksi Deep Learning
│   ├── context/
│   │   ├── auth-context.tsx               # Context Autentikasi Hibrida
│   │   └── lms-context.tsx                # Context State Store & Supabase Sync
│   └── lib/
│       ├── types.ts                       # TypeScript Data Models
│       ├── mock-data.ts                   # Realistic Initial Dataset
│       └── supabase/client.ts             # Supabase Client SDK Wrapper
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
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Cara Menjalankan di Lingkungan Lokal

### 1. Instal dependensi
```bash
npm install
```

### 2. Jalankan server pengembangan
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 3. Hubungkan ke Supabase Live (Opsional)
Aplikasi sudah berjalan dengan data mock interaktif. Untuk menyambungkan ke proyek Supabase milikmu:
1. Klik tombol **"Mode Demo Aktif" / "Konfigurasi Supabase"** di pojok kanan atas Navbar.
2. Masukkan **Project URL** dan **Anon Key**.
3. Pastikan skrip `supabase/migrations/0001_init.sql` sudah dijalankan di Supabase SQL Editor.
