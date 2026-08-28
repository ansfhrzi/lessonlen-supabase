# Blueprint Dokumentasi Sistem Learning Management System (LMS)

[... Bagian 1 hingga 9 tetap sesuai dokumentasi sebelumnya ...]

---

## 10. Peta Jalan Pengembangan Aplikasi (6 Tahap Implementasi)

Untuk menyelesaikan pengembangan aplikasi LMS berbasis Supabase ini hingga **siap pakai (Production Ready)**, alur kerja dibagi ke dalam 6 tahap berikut:

### Tahap 1: Analisis & Perancangan Spesifikasi Sistem (Selesai)
* Menyusun blueprint sistem, spesifikasi fitur utama, serta arsitektur integrasi AI Gemini.
* Merancang alur autentikasi hibrida (Google SSO & manual) dan mekanisme klaim presensi siswa (*Preset Name*).

### Tahap 2: Perancangan Skema Database & ERD (Selesai)
* Merancang struktur tabel relasional, penetapan tipe data, serta pembuatan batasan (*constraints*).
* Memetakan struktur kuis berbasis JSONB dan skema pengerjaan tugas kelompok.

### Tahap 3: Implementasi Database & Security (Tahap Berjalan)
* Eksekusi skrip DDL ke dalam **Supabase SQL Editor** untuk pembuatan tabel, indeks, dan tipe Enum.
* Penerapan aturan keamanan jaringan di tingkat database menggunakan **Row Level Security (RLS)** untuk pemisahan peran Guru dan Siswa.
* Pembuatan *Stored Procedure* (RPC `submit_quiz`) untuk kalkulasi kuis *server-side* dalam sekali transaksi payload.

### Tahap 4: Pembuatan API & Backend Logic (Edge Functions)
* Pengembangan **Supabase Edge Function** menggunakan Deno/TypeScript untuk menjembatani integrasi Gemini API.
* Pengaturan *System Prompt* untuk ekstraksi konteks materi, pembuatan soal JSON murni, dan pemrosesan refleksi.
* Konfigurasi *Environment Variables* dan *API Key Secrets* secara terenkripsi di Supabase Admin.

### Tahap 5: Pengembangan Antarmuka Frontend App
* Membangun **Dashboard Guru (Teacher Workspace)**: *Content Builder*, manajemen pengguna (reset/unlink), *Gradebook*, dan modul pemicu AI Generator.
* Membangun **Dashboard Siswa (Student Workspace)**: Halaman alur klaim nama, navigasi modul pembelajaran, *Workspace* pengerjaan kuis/tugas, dan rekap jurnal refleksi.
* Integrasi *Client App* dengan Supabase JavaScript SDK.

### Tahap 6: Pengujian, Optimasi & Deployment
* **Pengujian Beban & Kuis Massal:** Simulasi pengerjaan kuis bersamaan (*concurrent users*) untuk memastikan stabilitas RPC.
* **Audit Keamanan:** Pengetesan ulang RLS policy, validasi token JWT, dan pengujian isolasi data antar-kelas.
* **Deployment & Maintenance:** Peluncuran aplikasi ke platform hosting (Vercel/Netlify) serta konfigurasi *Cron Job* otomatis untuk pencegahan *auto-pause* pada Supabase Free Tier.