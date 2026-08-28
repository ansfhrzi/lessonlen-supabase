# Blueprint Dokumentasi Sistem Learning Management System (LMS)

Dokumen ini berisi spesifikasi teknis, arsitektur, dan alur operasional lengkap untuk pengembangan platform **Learning Management System (LMS)** berbasis **Supabase** yang dirancang untuk mendukung pendekatan *Deep Learning* (Pembelajaran Mendalam) serta **integrasi kecerdasan buatan (AI Assistant)**.

---

## 1. Arsitektur & Infrastruktur Utama

* **Backend & Database:** **Supabase (PostgreSQL)** mengelola *Authentication*, *Relational Database*, *Storage*, dan *Row Level Security (RLS)*.
* **AI Engine Integration:** Menggunakan **Gemini API** via *Supabase Edge Functions* untuk menjaga kerahasiaan API Key dari sisi *frontend*, mempercepat *stream response*, serta memvalidasi skema JSON.
* **Keamanan Akses:** Aturan RLS di tingkat database memisahkan penuh hak akses antara Guru (`teacher`) dan Siswa (`student`).
* **Storage & Kuota:** Menampung hingga 500 MB data teks/relasi dan 1 GB media/dokumen PDF pada paket gratis Supabase.
* **Mitigasi Auto-Pause:** *Cron Job* otomatis (GitHub Actions / Vercel Cron) melakukan ping HTTP berkala agar proyek *Free Tier* tetap aktif.

---

## 2. Alur Pendaftaran (Sign Up) & Autentikasi Hibrida

Sistem membedakan alur pendaftaran secara tegas berdasarkan peran (*role*) pengguna untuk menjaga integritas data dan hak akses:

### A. Pendaftaran & Autentikasi Guru (`teacher`)
1. **Akses Menu:** Guru memilih **"Daftar sebagai Guru"** pada halaman awal.
2. **Formulir Pendaftaran:** Mengisi Nama Lengkap & Gelar (misal: *Ahmad Fauzi, S.Pd.*), Email/Gmail, Nomor WhatsApp, Instansi/Sekolah, serta Password (atau memilih **Google SSO**).
3. **Aktivasi & Role Assignment:** Supabase Auth mencatat `role = 'teacher'` pada tabel `profiles`. Akun berhak penuh untuk membuat dan mengelola kelas secara mandiri tanpa perlu mengklaim nama presensi.
4. **Opsi Proteksi (Sekolah):** Dapat dipasangi **Kode Lisensi Sekolah** saat pendaftaran untuk mencegah siswa mendaftar sebagai guru.

### B. Pendaftaran & Autentikasi Siswa (`student`)
Untuk mengatasi masalah *typo*, nama gaul, serta kendala 2FA Google saat menggunakan komputer laboratorium sekolah, alur siswa menggunakan pendekatan **Preset Name + Hibrida Login**:
1. **Input Kode Kelas:** Siswa memasukkan Kode Kelas resmi dari guru.
2. **Klaim Nama Presensi (*Preset Name*):** Siswa memilih nama lengkap resminya dari daftar presensi yang telah diunggah guru.
3. **Input Data Tambahan:** Siswa memasukkan Nomor WhatsApp aktif.
4. **Pilih Metode Autentikasi:**
   * **Jalur Google SSO:** Tautkan akun Google untuk akses 1-klik di HP/Laptop pribadi.
   * **Jalur Manual:** Buat **Username/NIS** dan **Password/PIN** sederhana untuk akses di komputer sekolah.

### C. Alur Login & Pemulihan Akses Siswa
* **Komputer Lab Sekolah:** Gunakan **Tab Login Manual** (Username + Password) tanpa verifikasi 2FA HP.
* **Perangkat Pribadi:** Gunakan **Tab Google SSO** untuk masuk langsung ke *dashboard*.
* **Bantuan Guru:** Guru dapat melakukan *Reset Password* manual atau *Unlink Google Account* siswa langsung via *dashboard* guru.

---

## 3. Fitur AI Generator Guru (AI Co-Pilot)

Fitur AI dirancang sebagai asisten pembuat konten di *Content Builder* guru untuk memangkas waktu persiapan mengajar secara signifikan. Guru memegang kendali penuh untuk meninjau (*review*) dan mengedit hasil sebelum diterbitkan.

### A. AI Generate Materi
* **Input Guru:** Guru memasukkan Topik/Bab, Tingkat Kelas, dan *Prompt* instruksi (atau mengunggah draf/rangkuman teks pendek).
* **Hasil AI:** Menghasilkan draf materi terstruktur (Pengenalan, Konsep Utama, Contoh Kasus, dan Kesimpulan) dalam format Rich Text / Markdown yang langsung siap diedit.

### B. AI Generate Tugas (Individu & Kelompok)
* **Input Guru:** Memilih mode (Individu/Kelompok), memasukkan topik pembelajaran, dan indikator pencapaian.
* **Hasil AI:**
  * **Tugas Individu:** Instruksi langkah kerja, studi kasus nyata, serta rubrik kriteria penilaian.
  * **Tugas Kelompok:** Skenario problem-solving kelompok, pembagian peran antar-anggota, serta pedoman kolaborasi.

### C. AI Generate Kuis & Soal Evaluasi (*Context-Aware Mechanism*)
AI menentukan dan menghasilkan soal yang akurat sesuai Bab melalui alur **Context Injection & Structured Output**:
1. **Pengumpulan Konteks Bab (*Context Injection*):** Sistem mengambil seluruh teks/rangkuman materi dari `module_id` bab terkait di Supabase, beserta metadata kelas dan tingkat kognitif Bloom's Taxonomy pilihan guru.
2. **Structured Prompting:** *System prompt* menginstruksikan Gemini API untuk menyusun pertanyaan yang 100% bersumber dari materi bab tersebut, menyajikan 1 jawaban benar + 3 pengecoh logis, serta memberikan pembahasan singkat.
3. **Structured JSON Output:** AI mengembalikan data berupa *payload* JSON murni (`question_text`, `options`, `correct_key`, `explanation`, `points`).
4. **Pratinjau Guru (*Teacher-in-the-Loop*):** Guru meninjau, mengedit, atau menepis soal di *Preview Editor* sebelum disimpan resmi ke database `quiz_questions`.

### D. AI Generate Pertanyaan Refleksi (*Deep Learning Prompting*)
* **Input Guru:** Menentukan fokus refleksi (misal: *Pemahaman Konsep*, *Kesulitan Teknis*, atau *Keterkaitan Dunia Nyata*).
* **Hasil AI:** Menghasilkan 2–3 pertanyaan pemicu terbuka yang memancing pemikiran kritis siswa (*metacognition*), lengkap dengan opsi rekomendasi *Mood Tracker*.

---

## 4. Hierarki & Isi Kelas

Struktur isi kelas tersusun secara sistematis dari tingkat tertinggi hingga aktivitas terkecil:

* **Level 1 - Kelas (Course):** Menampung satu mata pelajaran/rombel. Mengelola daftar presensi (*preset name*), kode kelas, dan rekap nilai akhir.
* **Level 2 - Bab / Modul (Module):** Pengelompokan unit materi berdasarkan bab kurikulum yang disusun berurutan menggunakan `order_index`.
* **Level 3 - Aktivitas Pembelajaran (Activity):** Elemen di dalam bab tanpa batasan jumlah (*unlimited*), dibuat manual atau via **AI Generator**, meliputi:
  * **Materi (Lesson):** Teks/PDF/Video + tombol *Tandai Selesai* (*completion tracking*).
  * **Tugas Individu:** Pengumpulan via tempel link eksternal (Google Drive/GitHub/Notion).
  * **Tugas Kelompok:** Manajemen anggota/ketua + pengumpulan link khusus ketua.
  * **Kuis:** Evaluasi otomatis *server-side*.
* **Level 4 - Lembar Refleksi (Reflection):** Form evaluasi formatif *Deep Learning* yang menempel di akhir materi, tugas, atau kuis.

---

## 5. Rincian Fitur Utama LMS

### A. Fitur Tugas Individu & Kelompok
* **Tugas Individu:** Pengumpulan karya cukup menempelkan (*paste*) link dokumen/karya eksternal. Penilaian dilakukan per individu.
* **Tugas Kelompok:**
  * **Pembentukan:** Dibuat manual oleh guru atau otomatis (*random assignment*).
  * **Peran Ketua:** Guru menunjuk 1 ketua. **Hanya ketua kelompok yang memiliki hak akses untuk mengumpulkan/mengubah link tugas.**
  * **Akses Anggota:** Anggota lain berstatus *read-only* (melihat instruksi, status, dan link terkirim).
  * **Modus Penilaian:** Opsi *Mode Kelompok* (1 nilai berlaku untuk seluruh anggota) atau *Mode Individu* (nilai bervariasi per anggota berdasarkan kontribusi).

### B. Refleksi Pembelajaran (*Deep Learning*)
* **Pemicu (*Prompting*):** Ditempatkan di akhir materi, kuis, atau tugas.
* **Pertanyaan Pemicu:** Guru menyediakan pertanyaan terbuka (dibuat manual/AI Generator).
* **Evaluasi Formatif:** Guru membaca jurnal refleksi dan melihat rekap *Mood Tracker* untuk mengukur pemahaman kelas.

### C. Kuis & Strategi Skalabilitas (300+ Concurrent Users)
1. **Load All Questions First:** Seluruh soal ditarik sekaligus di awal kuis (tanpa kunci jawaban). Navigasi antar-soal berjalan penuh di *browser*.
2. **Local Storage Auto-Save:** Jawaban disimpan sementara di `localStorage` dan baru dikirimkan saat *Submit* atau waktu habis.
3. **Single Payload via RPC:** Pengiriman seluruh jawaban dilakukan dalam 1 paket JSON ke *Stored Procedure* PostgreSQL untuk kalkulasi nilai yang cepat dan aman di sisi server.
4. **Nonaktifkan Realtime:** Fitur *Supabase Realtime* dimatikan khusus di halaman kuis untuk menghemat konsumsi memori server.

---

## 6. Spesifikasi Dashboard

### Dashboard Guru (Teacher Workspace)
* **Overview (My Classes):** Kartu kelas, tombol **"Buat Kelas Baru"**, dan fitur salin kode kelas.
* **Content Builder (dengan AI Assistant):** Tempat menyusun Bab, materi, tugas, kuis, dan refleksi dengan urutan *drag-and-drop* serta bantuan tombol cepat **"Generate with AI"**.
* **User Management:** Pemantauan status klaim nama siswa, tombol **Reset Password**, dan **Unlink Google Account**.
* **Gradebook & Refleksi:** Matriks nilai kuis/tugas (mode kelompok atau individu) serta rekapitulasi respon refleksi siswa.

### Dashboard Siswa (Student Workspace)
* **Student Home:** Kartu kelas yang diikuti, *Progress Bar* kelas, widget *Deadline* tugas, dan tombol **"Gabung Kelas Baru"**.
* **Course View (Accordion):** Tampilan bab dan daftar aktivitas berurutan lengkap dengan indikator status visual (Selesai 🟢, Belum Dikerjakan 🟡, Terlewat 🔴).
* **Activity Workspace:** Halaman baca materi, ruang kirim link tugas, dan antarmuka pengerjaan kuis yang bersih dilengkapi indikator waktu (*timer*).
* **My Grades:** Rekapitulasi nilai transparan beserta catatan *feedback* dari guru.

---

## 7. Fitur Lanjutan & Penguatan Sistem (Saran Tambahan)

### A. Kontrol Alur Belajar & AI Grading
* **Materi Berkelanjutan (*Prerequisite Content*):** Akses bab atau kuis berikutnya dikunci sampai siswa menyelesaikan materi dan mengisi jurnal refleksi bab sebelumnya.
* **AI Grading Assistant (Esai & Tugas):** Menggunakan Gemini API untuk memberikan draf nilai awal dan umpan balik (*feedback*) analisis otomatis pada jawaban esai atau link tugas siswa berdasarkan rubrik guru.

### B. Integritas & Anti-Curang pada Kuis
* **Acak Soal & Opsi (*Randomization*):** Urutan soal dan pilihan jawaban diacak otomatis untuk tiap siswa.
* **Deteksi Perpindahan Tab (*Tab-Switch Detection*):** Memberikan peringatan atau otomatis mengirimkan kuis jika siswa terdeteksi membuka tab/aplikasi lain.
* **Proteksi Salin Teks (*Disable Copy-Paste*):** Mematikan fitur klik kanan dan *copy* teks pada antarmuka kuis untuk mencegah pencarian jawaban eksternal.

### C. Efisiensi Operasional Guru & Akses Siswa
* **Ekspor Rekap Nilai (Excel/CSV):** Unduh matriks nilai kuis, tugas, dan refleksi yang siap diimpor ke format buku nilai resmi sekolah.
* **Duplikasi Struktur Kelas (*Duplicate Course*):** Fitur ganda kelas untuk menyalin seluruh struktur bab dan materi ke tahun ajaran baru tanpa input ulang.
* **Notifikasi WhatsApp (*Webhook Notification*):** Pengiriman notifikasi otomatis via WhatsApp Gateway untuk pengingat *deadline* tugas atau pengumuman kelas.
* **Akses Hemat Kuota (PWA / Caching):** Penyimpanan materi di *cache browser* agar tetap dapat dibaca siswa dalam kondisi sinyal lemah (*low-bandwidth*).

---

## 8. Rancangan Skema Database (PostgreSQL Supabase)

Spesifikasi rancangan skema database yang telah dioptimalkan untuk kebutuhan LMS, autentikasi hibrida, fitur AI, serta fleksibilitas tugas dan kuis.

### A. ERD & Struktur Tabel Utama

#### 1. Autentikasi & Pengguna
* **`profiles`**
  * `id` (UUID, PK) $\rightarrow$ `auth.users.id`
  * `full_name` (Text)
  * `role` (Enum: `'teacher'`, `'student'`)
  * `whatsapp_number` (Text)
  * `school_institution` (Text, Nullable)
  * `created_at` (Timestamptz)

#### 2. Manajemen Kelas & Keanggotaan
* **`courses`**
  * `id` (UUID, PK)
  * `teacher_id` (UUID, FK) $\rightarrow$ `profiles.id`
  * `title` (Text) — Nama mata pelajaran / kelas
  * `subject` (Text)
  * `class_code` (Varchar(10), Unique) — Kode gabung kelas
  * `school_license_code` (Text, Nullable)
  * `created_at` (Timestamptz)
* **`class_members`** (Daftar Presensi & Klaim Nama Siswa)
  * `id` (UUID, PK)
  * `course_id` (UUID, FK) $\rightarrow$ `courses.id`
  * `student_id` (UUID, FK, Nullable) $\rightarrow$ `profiles.id` (Diisi saat siswa mengklaim nama)
  * `preset_name` (Text) — Nama resmi dari presensi yang diunggah guru
  * `is_claimed` (Boolean, Default: `false`)
  * `claimed_at` (Timestamptz, Nullable)

#### 3. Hierarki Materi & Pembelajaran
* **`modules`** (Bab / Modul)
  * `id` (UUID, PK)
  * `course_id` (UUID, FK) $\rightarrow$ `courses.id`
  * `title` (Text)
  * `description` (Text, Nullable)
  * `order_index` (Integer) — Urutan bab
  * `is_locked` (Boolean, Default: `false`) — Opsi *Prerequisite*
* **`activities`** (Aktivitas / Konten Pembelajaran)
  * `id` (UUID, PK)
  * `module_id` (UUID, FK) $\rightarrow$ `modules.id`
  * `title` (Text)
  * `type` (Enum: `'lesson'`, `'assignment'`, `'quiz'`)
  * `content` (Text, Nullable) — Teks materi / instruksi tugas
  * `assignment_mode` (Enum: `'individual'`, `'group'`, Nullable)
  * `reflection_prompt` (Text, Nullable) — Pertanyaan refleksi *Deep Learning*
  * `order_index` (Integer)

#### 4. Kuis & Bank Soal (AI Generated)
* **`quiz_questions`**
  * `id` (UUID, PK)
  * `activity_id` (UUID, FK) $\rightarrow$ `activities.id`
  * `question_text` (Text)
  * `options` (JSONB) — Opsi jawaban `["A", "B", "C", "D"]`
  * `correct_key` (Integer) — Indeks jawaban benar (0, 1, 2, 3)
  * `explanation` (Text, Nullable) — Pembahasan dari AI
  * `points` (Integer, Default: `10`)
* **`quiz_submissions`**
  * `id` (UUID, PK)
  * `activity_id` (UUID, FK) $\rightarrow$ `activities.id`
  * `student_id` (UUID, FK) $\rightarrow$ `profiles.id`
  * `score` (Numeric(5,2))
  * `answers_payload` (JSONB) — Salinan jawaban yang dikirimkan siswa
  * `submitted_at` (Timestamptz)
  * *Constraint:* Unique `(activity_id, student_id)`

#### 5. Kolaborasi & Tugas Kelompok
* **`groups`** (Kelompok Belajar)
  * `id` (UUID, PK)
  * `activity_id` (UUID, FK) $\rightarrow$ `activities.id`
  * `group_name` (Text)
  * `leader_id` (UUID, FK) $\rightarrow$ `profiles.id` — **Hanya ketua yang berhak submit link**
* **`group_members`**
  * `id` (UUID, PK)
  * `group_id` (UUID, FK) $\rightarrow$ `groups.id`
  * `student_id` (UUID, FK) $\rightarrow$ `profiles.id`
* **`assignment_submissions`** (Pengumpulan Link Tugas)
  * `id` (UUID, PK)
  * `activity_id` (UUID, FK) $\rightarrow$ `activities.id`
  * `student_id` (UUID, FK, Nullable) $\rightarrow$ `profiles.id` — Untuk tugas individu
  * `group_id` (UUID, FK, Nullable) $\rightarrow$ `groups.id` — Untuk tugas kelompok
  * `submission_link` (Text) — Link Drive/GitHub/Notion
  * `ai_feedback` (Text, Nullable) — Draf *feedback* otomatis dari AI
  * `grade` (Numeric(5,2), Nullable)
  * `submitted_at` (Timestamptz)

#### 6. Evaluasi Formatif & Tracking
* **`reflections`** (Jurnal Refleksi Siswa)
  * `id` (UUID, PK)
  * `activity_id` (UUID, FK) $\rightarrow$ `activities.id`
  * `student_id` (UUID, FK) $\rightarrow$ `profiles.id`
  * `reflection_text` (Text)
  * `mood_tracker` (Varchar(20)) — Emoji / tingkat pemahaman (misal: `'paham'`, `'bingung'`)
  * `created_at` (Timestamptz)

### B. Point Penting Optimization
1. **Efisiensi JSONB pada Kuis:** `quiz_questions.options` menggunakan format JSONB untuk fleksibilitas penyimpanan pilihan ganda tanpa memerlukan tabel *options* terpisah.
2. **Keamanan Tugas Kelompok:** Terikat pada `groups.leader_id` di mana aturan RLS memverifikasi `auth.uid() == leader_id` sebelum mengizinkan *upsert* pada `assignment_submissions`.
3. **Kinerja Kuis Massal:** Tabel `quiz_submissions` terintegrasi langsung dengan fungsi RPC `submit_quiz()` untuk memproses penilaian otomatis di sisi *database server* dalam sekali transaksi.

---

## 9. Ringkasan Matriks Autentikasi & Fitur

| Peran / Fitur | Metode Sign Up & Login | Identitas Utama / Mekanisme | Hak Akses Utama (RLS) |
| :--- | :--- | :--- | :--- |
| **Guru (`teacher`)** | Form Mandiri / Google SSO | Nama Lengkap + Gelar & Instansi | Mengelola kelas, materi, kuis, tugas, AI generator, dan memberi nilai |
| **Siswa (`student`)** | Google SSO / Login Manual via Kode Kelas | Mengklaim nama dari daftar presensi guru (*Preset Name*) | Membaca materi, mengerjakan kuis, dan mengumpulkan tugas |
| **AI Generator & Grading** | Integrasi Gemini API via Edge Function | *Context Injection* dari Bab $\rightarrow$ JSON Output | Khusus diakses oleh pengguna ber-`role = 'teacher'` |
| **Integritas Kuis** | Randomization + Tab Detection | Anti-cheating client-side script | Evaluasi nilai *server-side* via Stored Procedure (RPC) |
| **Materi & Tracking** | Akses langsung / Prerequisite | Terikat ke `module_id` | RLS berdasarkan keanggotaan di `class_members` |
| **Refleksi** | Form di akhir aktivitas | Terikat ke `lesson_id` / `assignment_id` / `quiz_id` | Hanya dibaca oleh Guru & Siswa bersangkutan |
| **Tugas Kelompok** | Pengumpulan link khusus oleh Ketua Kelompok | Terikat ke `group_id` | Hanya ketua yang dapat melakukan *upsert* link tugas |