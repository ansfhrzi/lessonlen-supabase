# Tahap 4 — Supabase Edge Functions (Backend AI)

Semua logika yang menyentuh **Gemini API** dan **service role key** dijauhkan dari
frontend dengan menempatkannya di **Edge Functions**. Frontend hanya memanggil
URL fungsi ini, dan API key tetap aman di server.

---

## Daftar Edge Function

| Nama | Fungsi | Dipakai untuk |
|---|---|---|
| `generate-material` | Buat draf materi sesuai topik & kelas | Content Builder |
| `generate-quiz` | Buat draft soal dari materi bab (context injection) | Kuis |
| `generate-assignment` | Buat draft tugas individu/kelompok + rubrik | Tugas |
| `generate-reflection` | Buat pertanyaan refleksi Deep Learning | Refleksi |
| `generate-grading` | Draf nilai + umpan balik dari teks jawaban | Penilaian |
| `setup-teacher` | Promosikan user jadi guru setelah kode lisensi valid | Autentikasi |

---

## Prasyarat / Instalasi Supabase CLI

Kamu perlu **Supabase CLI** untuk deploy. Instal:

### macOS / Linux
```bash
npm install -g supabase
```

### Windows (jika belum ada)
Buka PowerShell sebagai admin, jalankan salah satu:

```bash
npm install -g supabase
```
atau
```bash
winget install supabase
```

Cek berhasil:
```bash
supabase --version
```

---

## Koneksikan ke project Supabase

Jalankan dari *root folder* repo ini (`lessonlen-supabase`):

```bash
supabase login
supabase link --project-ref <PROJECT_REF_KAMU>
```

Ganti `<PROJECT_REF_KAMU>` dengan **Project Ref** Supabase kamu.
Cara cari Project Ref:
- Buka Dashboard Supabase → **Settings → General → Project Settings**.
- Salin **Project Ref** (biasanya 21 karakter alfanumerik).
- Atau project ref adalah bagian depan dari Project URL:
  - Project URL: `https://abcdefghijk.supabase.co`
  - Project Ref: `abcdefghijk`

---

## Set Secret Environment Variables

Ganti `YOUR_GEMINI_KEY` dengan API key dari **Google AI Studio**
(https://aistudio.google.com/apikey).

### Cara 1 — Via CLI (disarankan)
```bash
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_KEY
supabase secrets set AI_DAILY_LIMIT=50
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<KEY_SERVICE_ROLE_DARI_DASHBOARD>
```

### Cara 2 — Via Dashboard
1. Dashboard → **Settings → API Keys** → salin **service_role** key.
2. Dashboard → **Settings → Edge Functions → Secrets** (atau **Secrets**).
3. Tambahkan:
   - `GEMINI_API_KEY` = kunci Gemini
   - `AI_DAILY_LIMIT` = `50`
   - `SUPABASE_SERVICE_ROLE_KEY` = service role key

> ⚠️ **JANGAN memasukkan service_role key ke frontend.** Hanya Edge Function
> yang berhak memakainya, dan itu dilakukan lewat secret di server.

---

## Deploy semua fungsi

```bash
supabase functions deploy generate-material
supabase functions deploy generate-quiz
supabase functions deploy generate-assignment
supabase functions deploy generate-reflection
supabase functions deploy generate-grading
supabase functions deploy setup-teacher
```

Atau deploy sekaligus satu per satu di atas.

---

## Menguji fungsi dari terminal

### Test `setup-teacher`
```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/setup-teacher" \
  -H "Authorization: Bearer <ACCESS_TOKEN_USER_GURU>" \
  -H "Content-Type: application/json" \
  -d '{"license_code":"SCHOOL-0001"}'
```

### Test `generate-material`
```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/generate-material" \
  -H "Authorization: Bearer <ACCESS_TOKEN_USER_GURU>" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Fotosintesis","grade_level":"Kelas 7","course_id":"<COURSE_ID>"}'
```

- `<ACCESS_TOKEN_USER_GURU>` = token JWT user guru yang sudah login
  (nanti didapat dari frontend, atau lewat browser DevTools).
- `<COURSE_ID>` = UUID kursus yang dibuat guru.

### Test `generate-quiz`
```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/generate-quiz" \
  -H "Authorization: Bearer <ACCESS_TOKEN_USER_GURU>" \
  -H "Content-Type: application/json" \
  -d '{"course_id":"<COURSE_ID>","module_id":"<MODULE_ID>","count":5,"bloom_taxonomy":"understand","difficulty":"medium"}'
```

---

## Kode kesalahan yang mungkin muncul

| Kode | Arti | Penyebab |
|---|---|---|
| `401 Unauthorized` | Tidak login / JWT invalid | Belum pakai token, token kadaluarsa |
| `403 Teacher only` | Bukan guru | Role belum diubah ke `teacher` |
| `403 Forbidden` | Bukan guru pengampu course | `course_id` bukan milik guru itu |
| `404 Course not found` | ID kursus salah | Pastikan `course_id` benar |
| `404 Invalid school license code` | Kode sekolah salah | Pastikan `SCHOOL-0001` ada di tabel `schools` |
| `400 Module has no material` | Modul belum ada materi | Tambahkan materi dulu sebelum generate kuis |
| `429 Daily AI quota exceeded` | Kuota habis | Naikkan `AI_DAILY_LIMIT` atau tunggu besok |
| `500` | Server error | Cek log Edge Function |

---

## Flow yang benar di aplikasi

1. Guru menekan tombol **Generate with AI**.
2. Frontend memanggil Edge Function yang sesuai.
3. Edge Function:
   - Verifikasi JWT + role teacher.
   - Ambil konteks (jika perlu) dari database.
   - Panggil Gemini dengan `responseMimeType: application/json`.
   - Validasi JSON dengan Zod.
   - Simpan log ke `ai_generations`.
   - Return JSON draft ke frontend.
4. Frontend menampilkan hasil di **Preview Editor**.
5. Guru mengedit / menyetujui / membuang.
6. Guru menyimpan resmi ke database (materi, soal, tugas, atau refleksi).

> AI **tidak pernah menyimpan langsung** ke tabel utama. Guru selalu *teacher-in-the-loop*.

---

## Catatan keamanan penting

- **Jangan pernah memblokir atau membiarkan client menetapkan role `teacher`**
  lewat form pendaftaran. Gunakan `setup-teacher` dengan kode lisensi sekolah
  yang hanya diketahui sekolah.
- **Jangan pernah menaruh API key Gemini di frontend** atau di repo GitHub.
  Simpan hanya di Supabase secrets.
- **Umpan balik AI grading bukan keputusan final.** Guru harus mereview sebelum
  menentukan nilai resmi.
