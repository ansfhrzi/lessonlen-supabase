# Panduan Migrasi Database — Lessonlen LMS (Tahap 3)

File utama: **`supabase/migrations/0001_init.sql`**

## Apa saja yang sudah dibuat?

| Komponen | Status |
|---|---|
| Tabel sekolah (`schools`) | ✅ |
| Tabel profil (`profiles`) + auto-create dari `auth.users` | ✅ |
| Kelas (`courses`) + kode kelas unik | ✅ |
| Keanggotaan (`course_enrollments`) | ✅ |
| Daftar presensi guru (`class_rosters`) + klaim nama (`roster_claims`) | ✅ |
| Modul + Prerequisite (`modules`, `module_prerequisites`) | ✅ |
| Aktivitas (`activities`) + aset file (`activity_assets`) | ✅ |
| Bank soal (`quiz_questions`) — kunci jawaban disimpan sebagai array `text[]` | ✅ |
| Pengumpulan kuis (`quiz_submissions`) — `client_submission_id` idempotent | ✅ |
| Kelompok & anggota (`groups`, `group_members`) | ✅ |
| Pengumpulan tugas (`assignment_submissions`) | ✅ |
| Refleksi (`reflections`) + progress (`completions`) | ✅ |
| Notifikasi (`notifications`) + quota AI (`ai_generations`) | ✅ |
| RLS pada semua tabel + 2 bucket Storage | ✅ |
| RPC: `join_course`, `claim_roster`, `get_quiz_payload`, `submit_quiz` | ✅ |
| View: `course_progress`, `ai_usage_today` | ✅ |

---

## Cara menjalankan

### Opsi A — Supabase SQL Editor (paling mudah untuk coba cepat)
1. Buka **Supabase → SQL Editor → New query**.
2. Salin seluruh isi `supabase/migrations/0001_init.sql`.
3. Jalankan (**Run**).
4. Cek log error. Jika ada error, perbaiki lalu jalankan ulang — file ini dibuat memakai `CREATE OR REPLACE` / `DROP POLICY IF EXISTS`, jadi **idempotent** untuk sebagian besar langkah.

### Opsi B — Supabase CLI (disarankan untuk produksi)
```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
```

### Opsi C — melalui file ini di GitHub Actions (nanti saat CI/CD)
```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

---

## Langkah setelah migrasi

### 1. Aktifkan autentikasi email/password + Google
- **Authentication → Providers** → aktifkan **Email** dan (opsional) **Google**.
- Isi redirect URL `https://<domain>.vercel.app/auth/callback` (atau domain pribadi Anda).
- Untuk **manual login lab**, aktifkan email/password (tanpa wajib verifikasi jika diperlukan).

### 2. Buat akun guru (promosi role)
`handle_new_user` otomatis membuat profil dengan role `student`. Untuk membuat akun **guru** dengan aman:
1. Daftarkan guru via form pendaftaran (bisa email/password atau Google).
2. **Promosikan role** dari sisi server/admin (mis. Supabase Dashboard atau Edge Function dengan service role key):
   ```sql
   update public.profiles set role = 'teacher' where id = '<USER_ID>';
   ```
3. Jangan pernah memperbolehkan client memilih `role` sendiri.

### 3. Buat sekolah default + hubungkan guru
```sql
update public.profiles set school_id = '...' where id = '<GURU_ID>';
```

---

## Checklist pengujian keamanan (WAJIB sebelum produksi)

Jalankan sebagai **siswa** dan pastikan query ini **gagal / tidak mengembalikan kunci jawaban**:

```sql
-- Harus ditolak RLS
select * from public.quiz_questions;

-- Harus hanya mengembalikan soal TANPA correct_keys
select * from public.get_quiz_payload('<ACTIVITY_QUIZ_UUID>');

-- Harus gagal
insert into public.courses (teacher_id, title, class_code) values ('<ID_GURU>', 'Tinggal', 'XXX999');
```

Jalankan sebagai **guru pengampu** dan pastikan:
```sql
-- Boleh, hanya kursus miliknya
select * from public.courses where teacher_id = auth.uid();

-- Tidak boleh melihat course guru lain
select * from public.courses; -- hasilnya kosong untuk course yang bukan miliknya
select * from public.quiz_questions; -- hanya soal di aktivitas miliknya
```
Script otomatis bisa ditambahkan ke `supabase/tests/` menggunakan **pgTAP** atau CLI integration test.

---

## Catatan pending yang perlu dikerjakan di Tahap 4/5
- Promosi role guru di **Edge Function** `setup-teacher`.
- Validasi **kode lisensi sekolah** saat pendaftaran guru.
- `notifications` dibuat hanya dari **server-side** (Edge / cron).
- Penerapan **kuota AI** via `ai_generations` di Edge Function.
- Test **load 300+ user** untuk `submit_quiz`.
