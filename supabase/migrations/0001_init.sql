-- ============================================================================
-- Lessonlen LMS — Initial Database Schema + Row Level Security
-- Target: 1 sekolah / beberapa rombel
-- Stack: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
--
-- Cara pakai:
--   1) Tempel/execute file ini di Supabase SQL Editor, ATAU
--   2) jalankan `supabase db push` setelah file ini ada di supabase/migrations.
--
-- CATATAN KEAMANAN:
--   - `correct_keys` kuis TIDAK boleh di-expose ke siswa via query langsung.
--     Siswa hanya bisa mendapat soal lewat RPC public.get_quiz_payload().
--   - Role 'teacher' harus ditetapkan server-side (Edge Function / admin),
--     jangan hanya mengandalkan metadata yang bisa diubah dari client.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
do $$ begin
  create type public.app_role as enum ('teacher', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_type as enum ('lesson', 'assignment', 'quiz', 'reflection');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assignment_mode as enum ('individual', 'group');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.asset_type as enum ('pdf', 'video', 'image', 'audio', 'file');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.question_type as enum ('single', 'multiple', 'short_answer');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 2. TABEL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Layout sekolah. Untuk "1 sekolah", cukup 1 baris (diseed di bawah).
-- Tetap dibuat agar mudah di-upgrade ke multi-sekolah.
-- ----------------------------------------------------------------------------
create table if not exists public.schools (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  license_code   text not null unique,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Profil pengguna (link ke auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text not null,
  role               public.app_role not null default 'student',
  whatsapp_number    text,
  school_id          uuid references public.schools(id) on delete set null,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- ----------------------------------------------------------------------------
-- Kelas / mata pelajaran per rombel
-- ----------------------------------------------------------------------------
create table if not exists public.courses (
  id             uuid primary key default gen_random_uuid(),
  teacher_id     uuid not null references public.profiles(id) on delete cascade,
  school_id      uuid references public.schools(id) on delete set null,
  title          text not null,
  subject        text,
  grade_level    text,
  class_code     text not null unique,
  description    text,
  year_term      text,
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists courses_teacher_idx on public.courses (teacher_id);
create index if not exists courses_school_idx  on public.courses (school_id);

-- ----------------------------------------------------------------------------
-- Keanggotaan siswa di kursus
-- ----------------------------------------------------------------------------
create table if not exists public.course_enrollments (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  student_id   uuid not null references public.profiles(id) on delete cascade,
  is_active    boolean not null default true,
  joined_at    timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint course_enrollments_unique unique (course_id, student_id)
);

create index if not exists course_enrollments_student_idx on public.course_enrollments (student_id);
create index if not exists course_enrollments_course_idx  on public.course_enrollments (course_id, student_id);

-- ----------------------------------------------------------------------------
-- Daftar presensi ("preset name") yang diupload guru.
-- Ini adalah data MASTER nama, terpisah dari keanggotaan.
-- ----------------------------------------------------------------------------
create table if not exists public.class_rosters (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  nis          text,
  full_name    text not null,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint class_rosters_unique_course_nis  unique (course_id, nis),
  constraint class_rosters_unique_course_name unique (course_id, full_name)
);

create index if not exists class_rosters_course_idx on public.class_rosters (course_id, sort_order);

-- ----------------------------------------------------------------------------
-- Klaim nama presensi oleh siswa (1 roster hanya boleh diklaim 1x)
-- ----------------------------------------------------------------------------
create table if not exists public.roster_claims (
  id              uuid primary key default gen_random_uuid(),
  roster_id       uuid not null references public.class_rosters(id) on delete cascade,
  enrollment_id   uuid not null references public.course_enrollments(id) on delete cascade,
  claimed_at      timestamptz not null default now(),
  constraint roster_claims_unique_roster   unique (roster_id),
  constraint roster_claims_unique_enrollment unique (enrollment_id)
);

-- ----------------------------------------------------------------------------
-- Bab / Modul
-- ----------------------------------------------------------------------------
create table if not exists public.modules (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses(id) on delete cascade,
  title          text not null,
  description    text,
  order_index    integer not null default 0,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint modules_unique_order unique (course_id, order_index)
);

create index if not exists modules_course_idx on public.modules (course_id, order_index);

-- ----------------------------------------------------------------------------
-- Prerequisite antar modul (fitur akses berkelanjutan)
-- ----------------------------------------------------------------------------
create table if not exists public.module_prerequisites (
  module_id        uuid not null references public.modules(id) on delete cascade,
  prereq_module_id uuid not null references public.modules(id) on delete cascade,
  primary key (module_id, prereq_module_id),
  constraint module_prereq_not_self check (module_id <> prereq_module_id)
);

-- ----------------------------------------------------------------------------
-- Lokasi penyimpanan file kegiatan (PDF/video/gambar) di Supabase Storage.
-- `storage_path` diisi dari bucket `course-assets`, mis. course-assets/<course_id>/<file>.
-- ----------------------------------------------------------------------------
create table if not exists public.activity_assets (
  id            uuid primary key default gen_random_uuid(),
  activity_id   uuid not null,
  asset_type    public.asset_type not null default 'file',
  storage_path  text not null,
  file_name     text not null,
  size_bytes    bigint,
  mime_type     text,
  created_at    timestamptz not null default now(),
  constraint activity_assets_storage_path_unique unique (storage_path)
);

-- ----------------------------------------------------------------------------
-- Aktivitas pembelajaran (Materi/Tugas/Kuis/Refleksi)
-- ----------------------------------------------------------------------------
create table if not exists public.activities (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references public.modules(id) on delete cascade,
  title             text not null,
  type              public.activity_type not null,
  description       text,
  content_markdown  text,
  assignment_mode   public.assignment_mode,
  reflection_prompt text,
  order_index       integer not null default 0,
  is_published      boolean not null default true,
  due_at            timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint activities_unique_order unique (module_id, order_index)
);

create index if not exists activities_module_idx on public.activities (module_id, order_index);

-- FK dua arah: activity_assets -> activities ditambahkan setelah tabel activities dibuat
alter table public.activity_assets
  add constraint activity_assets_activity_fk
  foreign key (activity_id) references public.activities(id) on delete cascade;

-- ----------------------------------------------------------------------------
-- Bank soal kuis.
-- options: [{"key":"A","text":"..."}, ...]
-- correct_keys: array KARAKTER key, bukan indeks array, agar aman saat diacak.
-- ----------------------------------------------------------------------------
create table if not exists public.quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid not null references public.activities(id) on delete cascade,
  question_type   public.question_type not null default 'single',
  question_text   text not null,
  options         jsonb not null default '[]'::jsonb,
  correct_keys    text[] not null default '{}',
  explanation     text,
  points          integer not null default 10 check (points >= 0),
  difficulty      text,
  bloom_taxonomy  text,
  source_ref      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint quiz_questions_type_check check (
    (question_type = 'single' and cardinality(correct_keys) = 1) or
    (question_type = 'multiple' and cardinality(correct_keys) >= 1) or
    (question_type = 'short_answer' and cardinality(correct_keys) <= 1)
  )
);

create index if not exists quiz_questions_activity_idx on public.quiz_questions (activity_id);

-- ----------------------------------------------------------------------------
-- Submission kuis. `client_submission_id` dipakai untuk idempotensi.
-- ----------------------------------------------------------------------------
create table if not exists public.quiz_submissions (
  id                   uuid primary key default gen_random_uuid(),
  activity_id          uuid not null references public.activities(id) on delete cascade,
  student_id           uuid not null references public.profiles(id) on delete cascade,
  attempt_no           integer not null default 1,
  client_submission_id uuid unique,
  score                numeric(5,2) not null default 0,
  answers_payload      jsonb not null default '{}'::jsonb,
  results_payload      jsonb not null default '[]'::jsonb,
  time_taken_seconds   integer,
  status               text not null default 'submitted' check (status in ('draft','submitted','timeout')),
  submitted_at         timestamptz not null default now(),
  constraint quiz_submissions_unique_attempt unique (activity_id, student_id, attempt_no)
);

create index if not exists quiz_submissions_student_idx on public.quiz_submissions (student_id, activity_id);

-- ----------------------------------------------------------------------------
-- Kelompok belajar (untuk tugas kelompok)
-- ----------------------------------------------------------------------------
create table if not exists public.groups (
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid not null references public.activities(id) on delete cascade,
  group_name      text not null,
  leader_id       uuid not null references public.profiles(id) on delete cascade,
  assignment_method text,
  created_at      timestamptz not null default now()
);

create index if not exists groups_activity_idx on public.groups (activity_id);

create table if not exists public.group_members (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint group_members_unique unique (group_id, student_id)
);

create index if not exists group_members_student_idx on public.group_members (student_id);

-- ----------------------------------------------------------------------------
-- Pengumpulan tugas (link) — individu atau kelompok
-- ----------------------------------------------------------------------------
create table if not exists public.assignment_submissions (
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid not null references public.activities(id) on delete cascade,
  student_id      uuid references public.profiles(id) on delete cascade,
  group_id        uuid references public.groups(id) on delete cascade,
  submission_link text,
  submission_text text,
  grade           numeric(5,2) check (grade >= 0),
  ai_feedback     text,
  feedback        text,
  submitted_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint assignment_submissions_check_owner check (
    (student_id is not null and group_id is null) or
    (student_id is null and group_id is not null)
  ),
  constraint assignment_submissions_unique_individu unique (activity_id, student_id),
  constraint assignment_submissions_unique_group   unique (activity_id, group_id)
);

create index if not exists assignment_submissions_activity_idx on public.assignment_submissions (activity_id);

-- ----------------------------------------------------------------------------
-- Refleksi pembelajaran (Deep Learning)
-- ----------------------------------------------------------------------------
create table if not exists public.reflections (
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid not null references public.activities(id) on delete cascade,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  reflection_text text not null,
  mood_tracker    varchar(20),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint reflections_unique unique (activity_id, student_id)
);

-- ----------------------------------------------------------------------------
-- Completion tracking — sumber kebenaran untuk progress & prerequisite
-- ----------------------------------------------------------------------------
create table if not exists public.completions (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles(id) on delete cascade,
  activity_id  uuid not null references public.activities(id) on delete cascade,
  completed_at timestamptz not null default now(),
  constraint completions_unique unique (student_id, activity_id)
);

create index if not exists completions_student_idx on public.completions (student_id, activity_id);

-- ----------------------------------------------------------------------------
-- Notifikasi (in-app / email / WhatsApp webhook)
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  course_id    uuid references public.courses(id) on delete cascade,
  channel      text not null check (channel in ('inapp','email','whatsapp')),
  title        text not null,
  body         text,
  status       text not null default 'pending' check (status in ('pending','sent','failed','read')),
  external_id  text,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_id, status);

-- ----------------------------------------------------------------------------
-- Quota & audit AI
-- ----------------------------------------------------------------------------
create table if not exists public.ai_generations (
  id                  uuid primary key default gen_random_uuid(),
  teacher_id          uuid not null references public.profiles(id) on delete cascade,
  course_id           uuid references public.courses(id) on delete cascade,
  feature_type        text not null,
  prompt_hash         text,
  model_name          text,
  prompt_tokens       integer,
  completion_tokens   integer,
  status              text not null default 'ok' check (status in ('ok','error')),
  created_at          timestamptz not null default now()
);

create index if not exists ai_generations_teacher_idx on public.ai_generations (teacher_id, created_at);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Updated-at helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['schools','profiles','courses','course_enrollments','activities','quiz_questions','assignment_submissions','reflections'] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Buat otomatis profil saat pengguna baru di auth.users.
-- Keamanan: role SELALU default 'student' di sini. JANGAN percaya role dari
-- client-side metadata. Promosi ke 'teacher' harus dilakukan server-side
-- (Edge Function / Supabase Admin) setelah memverifikasi kode lisensi sekolah.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role, whatsapp_number)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    'student',
    nullif(new.raw_user_meta_data ->> 'whatsapp_number', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Pastikan database punya sekolah default (1 sekolah)
-- ----------------------------------------------------------------------------
insert into public.schools (name, license_code)
values ('Sekolah Utama', 'SCHOOL-0001')
on conflict (license_code) do nothing;

-- ============================================================================
-- 4. HELPER FUNCTIONS (untuk RLS & RPC)
-- ============================================================================

create or replace function public.get_current_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_teacher()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'teacher' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.course_teacher_id(p_course_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select teacher_id from public.courses where id = p_course_id;
$$;

create or replace function public.is_course_teacher(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select auth.uid() = public.course_teacher_id(p_course_id);
$$;

create or replace function public.is_course_student_member(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.course_enrollments e
    where e.course_id = p_course_id
      and e.student_id = auth.uid()
      and e.is_active
  );
$$;

-- Anggota = siswa terdaftar ATAU guru pengampu kursus
create or replace function public.is_course_member(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_course_teacher(p_course_id) or public.is_course_student_member(p_course_id);
$$;

-- ID kursus untuk sebuah aktivitas
create or replace function public.course_id_for_activity(p_activity_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select a.course_id
  from public.modules a
  join public.activities m on m.module_id = a.id
  where m.id = p_activity_id;
$$;

-- Guru bisa melihat profil siswa milik kursus yang dia ampu
create or replace function public.is_teacher_of_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.courses c
    join public.course_enrollments e on e.course_id = c.id
    where c.teacher_id = auth.uid() and e.student_id = p_student_id
  );
$$;

-- ID kursus untuk sebuah kelompok
create or replace function public.course_id_for_group(p_group_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select m.course_id
  from public.groups g
  join public.activities a on a.id = g.activity_id
  join public.modules m on m.id = a.module_id
  where g.id = p_group_id;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'schools','profiles','courses','course_enrollments','class_rosters',
    'roster_claims','modules','module_prerequisites','activities','activity_assets',
    'quiz_questions','quiz_submissions','groups','group_members','assignment_submissions',
    'reflections','completions','notifications','ai_generations'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ---------------- schools ----------------
drop policy if exists schools_select on public.schools;
create policy schools_select on public.schools
  for select using (is_active = true);

-- ---------------- profiles ----------------
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_select_teacher on public.profiles;
create policy profiles_select_teacher on public.profiles
  for select using (public.is_teacher() and public.is_teacher_of_student(id));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------- courses ----------------
drop policy if exists courses_select_member on public.courses;
create policy courses_select_member on public.courses
  for select using (public.is_course_member(id));

drop policy if exists courses_insert_teacher on public.courses;
create policy courses_insert_teacher on public.courses
  for insert with check (auth.uid() = teacher_id and public.is_teacher());

drop policy if exists courses_update_owner on public.courses;
create policy courses_update_owner on public.courses
  for update using (public.is_course_teacher(id)) with check (public.is_course_teacher(id));

drop policy if exists courses_delete_owner on public.courses;
create policy courses_delete_owner on public.courses
  for delete using (public.is_course_teacher(id));

-- ---------------- course_enrollments ----------------
drop policy if exists enrollments_select on public.course_enrollments;
create policy enrollments_select on public.course_enrollments
  for select using (
    student_id = auth.uid()
    or public.is_course_teacher(course_id)
    or public.is_course_student_member(course_id)
  );

drop policy if exists enrollments_insert_teacher on public.course_enrollments;
create policy enrollments_insert_teacher on public.course_enrollments
  for insert with check (public.is_course_teacher(course_id));

drop policy if exists enrollments_insert_self on public.course_enrollments;
create policy enrollments_insert_self on public.course_enrollments
  for insert with check (student_id = auth.uid());

drop policy if exists enrollments_update on public.course_enrollments;
create policy enrollments_update on public.course_enrollments
  for update using (
    student_id = auth.uid() or public.is_course_teacher(course_id)
  ) with check (
    student_id = auth.uid() or public.is_course_teacher(course_id)
  );

drop policy if exists enrollments_delete on public.course_enrollments;
create policy enrollments_delete on public.course_enrollments
  for delete using (student_id = auth.uid() or public.is_course_teacher(course_id));

-- ---------------- class_rosters ----------------
drop policy if exists rosters_select on public.class_rosters;
create policy rosters_select on public.class_rosters
  for select using (public.is_course_member(course_id));

drop policy if exists rosters_insert_teacher on public.class_rosters;
create policy rosters_insert_teacher on public.class_rosters
  for insert with check (public.is_course_teacher(course_id));

drop policy if exists rosters_update_teacher on public.class_rosters;
create policy rosters_update_teacher on public.class_rosters
  for update using (public.is_course_teacher(course_id)) with check (public.is_course_teacher(course_id));

drop policy if exists rosters_delete_teacher on public.class_rosters;
create policy rosters_delete_teacher on public.class_rosters
  for delete using (public.is_course_teacher(course_id));

-- ---------------- roster_claims ----------------
drop policy if exists claims_select on public.roster_claims;
create policy claims_select on public.roster_claims
  for select using (
    exists (
      select 1 from public.course_enrollments e
      where e.id = enrollment_id and (e.student_id = auth.uid() or public.is_course_teacher(e.course_id))
    )
    or public.is_teacher()
  );

drop policy if exists claims_insert_self on public.roster_claims;
create policy claims_insert_self on public.roster_claims
  for insert with check (
    exists (
      select 1 from public.course_enrollments e
      where e.id = enrollment_id and e.student_id = auth.uid()
    )
    and not exists (select 1 from public.roster_claims rc where rc.roster_id = roster_id)
  );

drop policy if exists claims_delete_teacher on public.roster_claims;
create policy claims_delete_teacher on public.roster_claims
  for delete using (public.is_teacher());

-- ---------------- modules ----------------
drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules
  for select using (public.is_course_member(course_id));

drop policy if exists modules_write_teacher on public.modules;
create policy modules_write_teacher on public.modules
  for all using (public.is_course_teacher(course_id)) with check (public.is_course_teacher(course_id));

-- ---------------- module_prerequisites ----------------
drop policy if exists prereqs_select on public.module_prerequisites;
create policy prereqs_select on public.module_prerequisites
  for select using (public.is_course_member((select course_id from public.modules where id = module_id)));

drop policy if exists prereqs_write_teacher on public.module_prerequisites;
create policy prereqs_write_teacher on public.module_prerequisites
  for all using (
    public.is_course_teacher((select course_id from public.modules where id = module_id))
  ) with check (
    public.is_course_teacher((select course_id from public.modules where id = module_id))
  );

-- ---------------- activities ----------------
drop policy if exists activities_select_member on public.activities;
create policy activities_select_member on public.activities
  for select using (
    public.is_course_member((select course_id from public.modules where id = module_id))
    and (is_published = true or public.is_course_teacher((select course_id from public.modules where id = module_id)))
  );

drop policy if exists activities_write_teacher on public.activities;
create policy activities_write_teacher on public.activities
  for all using (
    public.is_course_teacher((select course_id from public.modules where id = module_id))
  ) with check (
    public.is_course_teacher((select course_id from public.modules where id = module_id))
  );

-- ---------------- activity_assets ----------------
drop policy if exists assets_select on public.activity_assets;
create policy assets_select on public.activity_assets
  for select using (
    public.is_course_member(
      (select course_id from public.modules where id = (select module_id from public.activities where id = activity_id))
    )
  );

drop policy if exists assets_write_teacher on public.activity_assets;
create policy assets_write_teacher on public.activity_assets
  for all using (
    public.is_course_teacher(
      (select course_id from public.modules where id = (select module_id from public.activities where id = activity_id))
    )
  ) with check (
    public.is_course_teacher(
      (select course_id from public.modules where id = (select module_id from public.activities where id = activity_id))
    )
  );

-- ---------------- quiz_questions ----------------
-- PENTING: siswa TIDAK boleh select langsung dari tabel ini.
-- Siswa memakai RPC public.get_quiz_payload() yang sudah menyaring correct_keys.
drop policy if exists quiz_questions_select_teacher on public.quiz_questions;
create policy quiz_questions_select_teacher on public.quiz_questions
  for select using (
    public.is_course_teacher(
      (select course_id from public.modules where id = (select module_id from public.activities where id = activity_id))
    )
  );

drop policy if exists quiz_questions_write_teacher on public.quiz_questions;
create policy quiz_questions_write_teacher on public.quiz_questions
  for all using (
    public.is_course_teacher(
      (select course_id from public.modules where id = (select module_id from public.activities where id = activity_id))
    )
  ) with check (
    public.is_course_teacher(
      (select course_id from public.modules where id = (select module_id from public.activities where id = activity_id))
    )
  );

-- ---------------- quiz_submissions ----------------
drop policy if exists submissions_select on public.quiz_submissions;
create policy submissions_select on public.quiz_submissions
  for select using (
    student_id = auth.uid()
    or public.is_course_teacher((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id)))
  );

drop policy if exists submissions_insert_self on public.quiz_submissions;
create policy submissions_insert_self on public.quiz_submissions
  for insert with check (student_id = auth.uid());

drop policy if exists submissions_update_self on public.quiz_submissions;
create policy submissions_update_self on public.quiz_submissions
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ---------------- groups ----------------
drop policy if exists groups_select_member on public.groups;
create policy groups_select_member on public.groups
  for select using (public.is_course_member((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id))));

drop policy if exists groups_write_teacher on public.groups;
create policy groups_write_teacher on public.groups
  for all using (
    public.is_course_teacher((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id)))
  ) with check (
    public.is_course_teacher((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id)))
  );

-- ---------------- group_members ----------------
drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members
  for select using (public.is_course_member(public.course_id_for_group(group_id)));

drop policy if exists group_members_write_teacher on public.group_members;
create policy group_members_write_teacher on public.group_members
  for all using (public.is_course_teacher(public.course_id_for_group(group_id)))
  with check (public.is_course_teacher(public.course_id_for_group(group_id)));

-- ---------------- assignment_submissions ----------------
drop policy if exists assignment_sub_select on public.assignment_submissions;
create policy assignment_sub_select on public.assignment_submissions
  for select using (
    student_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.leader_id = auth.uid())
    or public.is_course_teacher((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id)))
  );

drop policy if exists assignment_sub_insert on public.assignment_submissions;
create policy assignment_sub_insert on public.assignment_submissions
  for insert with check (
    student_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.leader_id = auth.uid())
  );

drop policy if exists assignment_sub_update on public.assignment_submissions;
create policy assignment_sub_update on public.assignment_submissions
  for update using (
    student_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.leader_id = auth.uid())
    or public.is_course_teacher((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id)))
  ) with check (
    student_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.leader_id = auth.uid())
    or public.is_course_teacher((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id)))
  );

-- ---------------- reflections ----------------
drop policy if exists reflections_select on public.reflections;
create policy reflections_select on public.reflections
  for select using (
    student_id = auth.uid()
    or public.is_course_teacher((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id)))
  );

drop policy if exists reflections_insert_self on public.reflections;
create policy reflections_insert_self on public.reflections
  for insert with check (student_id = auth.uid());

drop policy if exists reflections_update_self on public.reflections;
create policy reflections_update_self on public.reflections
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists reflections_delete_teacher on public.reflections;
create policy reflections_delete_teacher on public.reflections
  for delete using (
    public.is_course_teacher((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id)))
  );

-- ---------------- completions ----------------
drop policy if exists completions_select on public.completions;
create policy completions_select on public.completions
  for select using (
    student_id = auth.uid()
    or public.is_course_teacher((select course_id from public.modules where id = (select module_id from public.activities where id = activity_id)))
  );

drop policy if exists completions_insert_self on public.completions;
create policy completions_insert_self on public.completions
  for insert with check (student_id = auth.uid());

drop policy if exists completions_delete on public.completions;
create policy completions_delete on public.completions
  for delete using (student_id = auth.uid() or public.is_teacher());

-- ---------------- notifications ----------------
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (recipient_id = auth.uid());

-- Tidak ada policy insert/update/delete publik: dibuat server-side (Edge/RPC).

-- ---------------- ai_generations ----------------
drop policy if exists ai_generations_select_self on public.ai_generations;
create policy ai_generations_select_self on public.ai_generations
  for select using (teacher_id = auth.uid());

drop policy if exists ai_generations_insert_self on public.ai_generations;
create policy ai_generations_insert_self on public.ai_generations
  for insert with check (teacher_id = auth.uid());

-- ============================================================================
-- 6. STORAGE BUCKETS + POLICIES
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('course-assets', 'course-assets', false, 52428800, array['application/pdf','video/mp4','video/webm','image/png','image/jpeg','image/webp','audio/mpeg','audio/wav']),
  ('submissions', 'submissions', false, 52428800, array['application/pdf','text/plain','application/zip'])
on conflict (id) do nothing;

-- Helper: ambil course_id dari path storage, mis. "course-assets/<course_id>/file"
create or replace function public.storage_course_id(path text)
returns uuid language sql immutable set search_path = public as $$
  select nullif((string_to_array(path, '/'))[2], '')::uuid;
$$;

drop policy if exists course_assets_read on storage.objects;
create policy course_assets_read on storage.objects
  for select using (
    bucket_id = 'course-assets' and public.is_course_member(public.storage_course_id(name))
  );

drop policy if exists course_assets_write on storage.objects;
create policy course_assets_write on storage.objects
  for insert with check (
    bucket_id = 'course-assets' and public.is_course_teacher(public.storage_course_id(name))
  );

drop policy if exists submissions_read on storage.objects;
create policy submissions_read on storage.objects
  for select using (
    bucket_id = 'submissions' and (auth.uid()::text = (string_to_array(name, '/'))[2])
  );

drop policy if exists submissions_write on storage.objects;
create policy submissions_write on storage.objects
  for insert with check (
    bucket_id = 'submissions' and auth.uid()::text = (string_to_array(name, '/'))[2]
  );

-- ============================================================================
-- 7. RPC: JOIN COURSE (via kode kelas)
-- ============================================================================

create or replace function public.join_course(p_class_code text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_course_id uuid;
  v_student_id uuid := auth.uid();
  v_enrollment uuid;
begin
  if v_student_id is null then raise exception 'not authenticated'; end if;
  if (select role from public.profiles where id = v_student_id) <> 'student' then
    raise exception 'only students can join a course';
  end if;

  select c.id into v_course_id
  from public.courses c
  where c.class_code = upper(trim(p_class_code)) and c.is_archived = false;

  if v_course_id is null then
    raise exception 'invalid class code';
  end if;

  select e.id into v_enrollment
  from public.course_enrollments e
  where e.course_id = v_course_id and e.student_id = v_student_id;

  if v_enrollment is null then
    insert into public.course_enrollments (course_id, student_id)
    values (v_course_id, v_student_id)
    returning id into v_enrollment;
  end if;

  return v_course_id;
end;
$$;

grant execute on function public.join_course(text) to authenticated;

-- ============================================================================
-- 8. RPC: CLAIM ROSTER (preset name)
-- ============================================================================

create or replace function public.claim_roster(p_roster_id uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_claim_id uuid;
  v_student_id uuid := auth.uid();
  v_course_id uuid;
  v_enrollment uuid;
begin
  if v_student_id is null then raise exception 'not authenticated'; end if;

  select r.course_id into v_course_id
  from public.class_rosters r
  where r.id = p_roster_id and r.is_active;

  if v_course_id is null then raise exception 'roster not found'; end if;

  select e.id into v_enrollment
  from public.course_enrollments e
  where e.course_id = v_course_id and e.student_id = v_student_id;

  if v_enrollment is null then raise exception 'student is not enrolled in this course'; end if;

  -- prevent double claim (roster yang sama)
  if exists (select 1 from public.roster_claims where roster_id = p_roster_id) then
    raise exception 'roster already claimed';
  end if;

  -- prevent siswa mengklaim lebih dari satu nama di kursus yang sama
  if exists (
    select 1
    from public.roster_claims rc
    join public.course_enrollments e on e.id = rc.enrollment_id
    where e.student_id = v_student_id and e.course_id = v_course_id
  ) then
    raise exception 'student already claimed a roster in this course';
  end if;

  insert into public.roster_claims (roster_id, enrollment_id)
  values (p_roster_id, v_enrollment)
  returning id into v_claim_id;

  return v_claim_id;
end;
$$;

grant execute on function public.claim_roster(uuid) to authenticated;

-- ============================================================================
-- 9. RPC: GET QUIZ PAYLOAD (tanpa correct_keys)
-- ============================================================================

create or replace function public.get_quiz_payload(p_activity_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_course_id uuid;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  v_course_id := public.course_id_for_activity(p_activity_id);
  if v_course_id is null then raise exception 'activity not found'; end if;

  if not public.is_course_member(v_course_id) then
    raise exception 'forbidden';
  end if;

  if not exists (select 1 from public.activities a where a.id = p_activity_id and a.type = 'quiz' and a.is_published) then
    raise exception 'quiz not available';
  end if;

  select jsonb_build_object(
    'activity_id', p_activity_id,
    'title', a.title,
    'due_at', a.due_at,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id,
        'question_type', q.question_type,
        'question_text', q.question_text,
        'options', q.options,
        'difficulty', q.difficulty,
        'bloom_taxonomy', q.bloom_taxonomy,
        'points', q.points
      ) order by q.created_at)
      from public.quiz_questions q
      where q.activity_id = p_activity_id and q.is_active
    ), '[]'::jsonb)
  )
  into v_result
  from public.activities a
  where a.id = p_activity_id;

  return v_result;
end;
$$;

grant execute on function public.get_quiz_payload(uuid) to authenticated;

-- ============================================================================
-- 10. RPC: SUBMIT QUIZ (server-side scoring, idempotent)
-- ============================================================================

create or replace function public.submit_quiz(
  p_activity_id uuid,
  p_answers jsonb,
  p_client_submission_id uuid default null,
  p_time_taken_seconds integer default null,
  p_started_at timestamptz default now()
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_student_id uuid := auth.uid();
  v_course_id uuid;
  v_score numeric(5,2) := 0;
  v_max_points integer := 0;
  v_attempt_no integer;
  v_submission_id uuid;
  v_results jsonb := '[]'::jsonb;
  v_question record;
  v_selected jsonb;
  v_selected_texts text[];
  v_is_correct boolean;
  v_points_earned integer;
begin
  if v_student_id is null then raise exception 'not authenticated'; end if;

  v_course_id := public.course_id_for_activity(p_activity_id);
  if v_course_id is null then raise exception 'activity not found'; end if;

  if not public.is_course_student_member(v_course_id) then
    raise exception 'forbidden';
  end if;

  if not exists (select 1 from public.activities a where a.id = p_activity_id and a.type = 'quiz' and a.is_published) then
    raise exception 'quiz not available';
  end if;

  -- Idempotensi: kalau submission dengan client_submission_id yang sama sudah ada, update saja.
  if p_client_submission_id is not null then
    select id, attempt_no into v_submission_id, v_attempt_no
    from public.quiz_submissions
    where client_submission_id = p_client_submission_id;
  end if;

  if v_submission_id is null then
    select coalesce(max(attempt_no), 0) + 1 into v_attempt_no
    from public.quiz_submissions
    where activity_id = p_activity_id and student_id = v_student_id;
  end if;

  -- Hitung skor server-side
  for v_question in
    select q.id, q.question_type, q.correct_keys, q.points
    from public.quiz_questions q
    where q.activity_id = p_activity_id and q.is_active
  loop
    v_selected := p_answers -> (v_question.id)::text;
    v_max_points := v_max_points + coalesce(v_question.points, 10);
    v_is_correct := false;
    v_points_earned := 0;

    if v_selected is not null and v_selected <> 'null'::jsonb then
      if v_question.question_type = 'multiple' then
        select coalesce(array_agg(x), '{}') into v_selected_texts
        from jsonb_array_elements_text(v_selected) x;
        v_is_correct :=
          v_selected_texts @> v_question.correct_keys
          and v_question.correct_keys @> v_selected_texts;
      else
        v_is_correct := (v_selected #>> '{}') = v_question.correct_keys[1];
      end if;
    end if;

    if v_is_correct then
      v_points_earned := coalesce(v_question.points, 10);
    end if;

    v_score := v_score + v_points_earned;
    v_results := v_results || jsonb_build_object(
      'question_id', v_question.id,
      'correct', v_is_correct,
      'selected', v_selected,
      'points_earned', v_points_earned,
      'max_points', v_question.points
    );
  end loop;

  if v_submission_id is not null then
    -- Update idempotent
    update public.quiz_submissions
    set score = v_score,
        answers_payload = p_answers,
        results_payload = v_results,
        time_taken_seconds = p_time_taken_seconds,
        status = 'submitted',
        submitted_at = now()
    where id = v_submission_id
    returning id into v_submission_id;

    return jsonb_build_object(
      'submission_id', v_submission_id,
      'attempt_no', v_attempt_no,
      'score', v_score,
      'max_points', v_max_points,
      'results', v_results,
      'updated', true
    );
  end if;

  insert into public.quiz_submissions (
    activity_id, student_id, attempt_no, client_submission_id,
    score, answers_payload, results_payload, time_taken_seconds, status, submitted_at
  )
  values (
    p_activity_id, v_student_id, v_attempt_no, p_client_submission_id,
    v_score, p_answers, v_results, p_time_taken_seconds, 'submitted', now()
  )
  returning id into v_submission_id;

  return jsonb_build_object(
    'submission_id', v_submission_id,
    'attempt_no', v_attempt_no,
    'score', v_score,
    'max_points', v_max_points,
    'results', v_results,
    'updated', false
  );
end;
$$;

grant execute on function public.submit_quiz(uuid, jsonb, uuid, integer, timestamptz) to authenticated;

-- ============================================================================
-- 11. USEFUL VIEWS (non-sensitive)
-- ============================================================================

-- Ringkasan progress siswa per kursus
-- security_invoker = true supaya RLS pada tabel dasar tetap berlaku.
create or replace view public.course_progress
with (security_invoker = true)
as
select
  e.student_id,
  e.course_id,
  count(a.id) as total_activities,
  count(c.activity_id) as completed_activities,
  coalesce(round(100.0 * count(c.activity_id) / nullif(count(a.id), 0), 1), 0) as progress_percent
from public.course_enrollments e
left join public.modules m on m.course_id = e.course_id
left join public.activities a on a.module_id = m.id and a.is_published
left join public.completions c on c.activity_id = a.id and c.student_id = e.student_id
group by e.student_id, e.course_id;

-- Jumlah kuota AI per guru dalam 24 jam terakhir
create or replace view public.ai_usage_today
with (security_invoker = true)
as
select teacher_id, count(*) as usage_count
from public.ai_generations
where created_at >= now() - interval '24 hours'
group by teacher_id;

-- ============================================================================
-- 12. GRANTS (default)
-- ============================================================================

grant usage on schema public to anon, authenticated;
grant select on public.course_progress to authenticated;
grant select on public.ai_usage_today to authenticated;

-- Nilai dan kunci jawaban tidak boleh dibaca anon langsung.
revoke all on public.quiz_questions from anon;
revoke all on public.quiz_submissions from anon;
revoke all on public.assignment_submissions from anon;
revoke all on public.reflections from anon;

-- ============================================================================
-- END OF INITIAL MIGRATION
-- ============================================================================
