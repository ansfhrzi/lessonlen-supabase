'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  Activity,
  ClassRoster,
  Completion,
  Course,
  CourseEnrollment,
  CourseModule,
  Profile,
  QuizQuestion,
  QuizSubmission,
  Reflection,
  AssignmentSubmission,
  StudyGroup,
} from '@/lib/types';

type DbRow = Record<string, any>;
type DbClient = SupabaseClient;

export interface LmsSnapshot {
  courses: Course[];
  enrollments: CourseEnrollment[];
  rosters: ClassRoster[];
  modules: CourseModule[];
  activities: Activity[];
  quizQuestions: QuizQuestion[];
  quizSubmissions: QuizSubmission[];
  studyGroups: StudyGroup[];
  assignmentSubmissions: AssignmentSubmission[];
  reflections: Reflection[];
  completions: Completion[];
}

function requireClient(): DbClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return client;
}

function throwIfError(error: { message: string } | null | undefined, operation: string): void {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

function profileName(profiles: Map<string, Profile>, id?: string | null): string | undefined {
  return id ? profiles.get(id)?.full_name : undefined;
}

function mapCourse(row: DbRow, profiles: Map<string, Profile>): Course {
  return {
    id: row.id,
    teacher_id: row.teacher_id,
    teacher_name: profileName(profiles, row.teacher_id) || 'Guru Pengampu',
    school_id: row.school_id || undefined,
    title: row.title,
    subject: row.subject || '',
    grade_level: row.grade_level || '',
    class_code: row.class_code,
    description: row.description || undefined,
    year_term: row.year_term || undefined,
    is_archived: row.is_archived,
    created_at: row.created_at,
  };
}

function mapEnrollment(row: DbRow): CourseEnrollment {
  // The migration intentionally derives enrollment origin from the action/RPC;
  // the table itself does not store an enrolled_via column.
  return {
    id: row.id,
    course_id: row.course_id,
    student_id: row.student_id,
    enrolled_via: 'manual',
    is_active: row.is_active,
    joined_at: row.joined_at,
  };
}

function mapRoster(row: DbRow, claims: Map<string, DbRow>, enrollments: Map<string, DbRow>): ClassRoster {
  const claim = claims.get(row.id);
  const enrollment = claim ? enrollments.get(claim.enrollment_id) : undefined;
  return {
    id: row.id,
    course_id: row.course_id,
    nis: row.nis || undefined,
    full_name: row.full_name,
    sort_order: row.sort_order,
    is_claimed: Boolean(claim),
    claimed_by_student_id: enrollment?.student_id,
    claimed_at: claim?.claimed_at,
  };
}

function mapModule(row: DbRow, prerequisites: Map<string, string[]>): CourseModule {
  return {
    id: row.id,
    course_id: row.course_id,
    title: row.title,
    description: row.description || undefined,
    order_index: row.order_index,
    is_published: row.is_published,
    created_at: row.created_at,
    prerequisites: prerequisites.get(row.id) || [],
  };
}

function mapActivity(row: DbRow): Activity {
  return {
    id: row.id,
    module_id: row.module_id,
    title: row.title,
    type: row.type,
    description: row.description || undefined,
    content_markdown: row.content_markdown || undefined,
    assignment_mode: row.assignment_mode || undefined,
    reflection_prompt: row.reflection_prompt || undefined,
    order_index: row.order_index,
    is_published: row.is_published,
    due_at: row.due_at || undefined,
    created_at: row.created_at,
  };
}

function mapQuizQuestion(row: DbRow): QuizQuestion {
  return {
    id: row.id,
    activity_id: row.activity_id,
    question_type: row.question_type,
    question_text: row.question_text,
    options: Array.isArray(row.options) ? row.options : [],
    correct_keys: row.correct_keys || undefined,
    explanation: row.explanation || undefined,
    points: row.points ?? 10,
    difficulty: row.difficulty || undefined,
    bloom_taxonomy: row.bloom_taxonomy || undefined,
    is_active: row.is_active,
  };
}

function mapQuizSubmission(row: DbRow, profiles: Map<string, Profile>): QuizSubmission {
  return {
    id: row.id,
    activity_id: row.activity_id,
    student_id: row.student_id,
    student_name: profileName(profiles, row.student_id),
    attempt_no: row.attempt_no,
    client_submission_id: row.client_submission_id || undefined,
    score: Number(row.score || 0),
    answers_payload: row.answers_payload || {},
    results_payload: row.results_payload || [],
    time_taken_seconds: row.time_taken_seconds || undefined,
    status: row.status === 'draft' || row.status === 'timeout' ? 'in_progress' : 'submitted',
    submitted_at: row.submitted_at,
  };
}

function mapGroups(rows: DbRow[], members: DbRow[], profiles: Map<string, Profile>): StudyGroup[] {
  return rows.map((row) => ({
    id: row.id,
    activity_id: row.activity_id,
    group_name: row.group_name,
    leader_id: row.leader_id,
    leader_name: profileName(profiles, row.leader_id),
    members: members
      .filter((member) => member.group_id === row.id && member.is_active)
      .map((member) => ({
        student_id: member.student_id,
        full_name: profileName(profiles, member.student_id) || 'Siswa',
      })),
  }));
}

function mapAssignment(row: DbRow, profiles: Map<string, Profile>, groups: Map<string, DbRow>): AssignmentSubmission {
  return {
    id: row.id,
    activity_id: row.activity_id,
    student_id: row.student_id || undefined,
    student_name: profileName(profiles, row.student_id),
    group_id: row.group_id || undefined,
    group_name: row.group_id ? groups.get(row.group_id)?.group_name : undefined,
    submission_link: row.submission_link || '',
    submission_text: row.submission_text || undefined,
    grade: row.grade === null || row.grade === undefined ? undefined : Number(row.grade),
    feedback: row.feedback || undefined,
    ai_feedback: row.ai_feedback || undefined,
    submitted_at: row.submitted_at,
  };
}

function mapReflection(row: DbRow, profiles: Map<string, Profile>): Reflection {
  return {
    id: row.id,
    activity_id: row.activity_id,
    student_id: row.student_id,
    student_name: profileName(profiles, row.student_id),
    reflection_text: row.reflection_text,
    mood_tracker: row.mood_tracker || 'paham',
    created_at: row.created_at,
  };
}

function mapCompletion(row: DbRow): Completion {
  return {
    id: row.id,
    student_id: row.student_id,
    activity_id: row.activity_id,
    completed_at: row.completed_at,
  };
}

/**
 * Load the relational LMS state through PostgREST. Every query is protected by
 * the RLS policies in 0001_init.sql; no service-role key is ever used here.
 */
export async function loadLmsSnapshot(role: 'teacher' | 'student'): Promise<LmsSnapshot> {
  const client = requireClient();

  const baseQueries = await Promise.all([
    client.from('courses').select('*').order('created_at', { ascending: false }),
    client.from('course_enrollments').select('*'),
    client.from('class_rosters').select('*').order('sort_order', { ascending: true }),
    client.from('roster_claims').select('*'),
    client.from('profiles').select('*'),
    client.from('modules').select('*').order('order_index', { ascending: true }),
    client.from('module_prerequisites').select('*'),
    client.from('activities').select('*').order('order_index', { ascending: true }),
    client.from('quiz_submissions').select('*').order('submitted_at', { ascending: false }),
    client.from('groups').select('*'),
    client.from('group_members').select('*'),
    client.from('assignment_submissions').select('*').order('submitted_at', { ascending: false }),
    client.from('reflections').select('*').order('created_at', { ascending: false }),
    client.from('completions').select('*'),
  ]);

  const [courses, enrollments, rosters, claims, profiles, modules, prerequisites, activities, quizSubmissions, groups, groupMembers, assignments, reflections, completions] = baseQueries;
  const firstError = baseQueries.find((result) => result.error)?.error;
  throwIfError(firstError, 'Memuat data LMS');

  const profileMap = new Map<string, Profile>(
    ((profiles.data || []) as DbRow[]).map((row) => [row.id, {
      id: row.id,
      full_name: row.full_name,
      role: row.role,
      whatsapp_number: row.whatsapp_number || undefined,
      school_id: row.school_id || undefined,
      is_active: row.is_active,
      created_at: row.created_at,
    }])
  );
  const enrollmentRows = (enrollments.data || []) as DbRow[];
  const enrollmentMap = new Map(enrollmentRows.map((row) => [row.id, row]));
  const claimMap = new Map(((claims.data || []) as DbRow[]).map((row) => [row.roster_id, row]));
  const prereqMap = new Map<string, string[]>();
  for (const row of (prerequisites.data || []) as DbRow[]) {
    prereqMap.set(row.module_id, [...(prereqMap.get(row.module_id) || []), row.prereq_module_id]);
  }
  const groupRows = (groups.data || []) as DbRow[];
  const groupMap = new Map(groupRows.map((row) => [row.id, row]));

  // Students must never query quiz_questions directly. The only path to a quiz
  // payload for them is getQuizPayload(), which calls the sanitising RPC below.
  let quizQuestions: QuizQuestion[] = [];
  if (role === 'teacher') {
    const questions = await client.from('quiz_questions').select('*').order('created_at', { ascending: true });
    throwIfError(questions.error, 'Memuat bank soal');
    quizQuestions = ((questions.data || []) as DbRow[]).map(mapQuizQuestion);
  }

  return {
    courses: ((courses.data || []) as DbRow[]).map((row) => mapCourse(row, profileMap)),
    enrollments: enrollmentRows.map(mapEnrollment),
    rosters: ((rosters.data || []) as DbRow[]).map((row) => mapRoster(row, claimMap, enrollmentMap)),
    modules: ((modules.data || []) as DbRow[]).map((row) => mapModule(row, prereqMap)),
    activities: ((activities.data || []) as DbRow[]).map(mapActivity),
    quizQuestions,
    quizSubmissions: ((quizSubmissions.data || []) as DbRow[]).map((row) => mapQuizSubmission(row, profileMap)),
    studyGroups: mapGroups(groupRows, (groupMembers.data || []) as DbRow[], profileMap),
    assignmentSubmissions: ((assignments.data || []) as DbRow[]).map((row) => mapAssignment(row, profileMap, groupMap)),
    reflections: ((reflections.data || []) as DbRow[]).map((row) => mapReflection(row, profileMap)),
    completions: ((completions.data || []) as DbRow[]).map(mapCompletion),
  };
}

export async function joinCourse(classCode: string): Promise<string> {
  const { data, error } = await requireClient().rpc('join_course', {
    p_class_code: classCode.trim().toUpperCase(),
  });
  throwIfError(error, 'Bergabung ke kelas');
  if (!data) throw new Error('Kode kelas tidak ditemukan.');
  return data as string;
}

export async function claimRoster(rosterId: string): Promise<string> {
  const { data, error } = await requireClient().rpc('claim_roster', {
    p_roster_id: rosterId,
  });
  throwIfError(error, 'Klaim nama presensi');
  if (!data) throw new Error('Klaim nama tidak menghasilkan data.');
  return data as string;
}

export async function getQuizPayload(activityId: string, isTeacher: boolean): Promise<QuizQuestion[]> {
  const client = requireClient();

  if (isTeacher) {
    const { data, error } = await client.from('quiz_questions').select('*').eq('activity_id', activityId).eq('is_active', true).order('created_at', { ascending: true });
    throwIfError(error, 'Memuat bank soal');
    return ((data || []) as DbRow[]).map(mapQuizQuestion);
  }

  const { data, error } = await client.rpc('get_quiz_payload', {
    p_activity_id: activityId,
  });
  throwIfError(error, 'Memuat soal kuis');

  const payload = (data || {}) as DbRow;
  return Array.isArray(payload.questions)
    ? payload.questions.map((question: DbRow) => mapQuizQuestion({
        ...question,
        activity_id: question.activity_id || payload.activity_id || activityId,
      }))
    : [];
}

export interface SubmitQuizResult {
  submissionId: string;
  attemptNo: number;
  score: number;
  maxPoints: number;
  results: any[];
}

export async function submitQuiz(
  activityId: string,
  answers: Record<string, string | string[]>,
  timeTakenSeconds: number,
  clientSubmissionId: string,
): Promise<SubmitQuizResult> {
  const { data, error } = await requireClient().rpc('submit_quiz', {
    p_activity_id: activityId,
    p_answers: answers,
    p_client_submission_id: clientSubmissionId,
    p_time_taken_seconds: timeTakenSeconds,
    p_started_at: new Date(Date.now() - timeTakenSeconds * 1000).toISOString(),
  });
  throwIfError(error, 'Mengirim jawaban kuis');
  const result = (data || {}) as DbRow;
  return {
    submissionId: result.submission_id,
    attemptNo: Number(result.attempt_no || 1),
    score: Number(result.score || 0),
    maxPoints: Number(result.max_points || 0),
    results: Array.isArray(result.results) ? result.results : [],
  };
}

export async function createCourse(data: {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  description?: string;
  teacherId: string;
  schoolId?: string;
  classCode: string;
}): Promise<void> {
  const { error } = await requireClient().from('courses').insert({
    id: data.id,
    teacher_id: data.teacherId,
    school_id: data.schoolId || null,
    title: data.title,
    subject: data.subject,
    grade_level: data.grade_level,
    description: data.description || null,
    class_code: data.classCode,
    year_term: '2026/2027 Ganjil',
    is_archived: false,
  });
  throwIfError(error, 'Membuat kelas');
}

export async function insertRosters(courseId: string, rows: Array<{ nis?: string; full_name: string; sort_order: number }>): Promise<void> {
  const { error } = await requireClient().from('class_rosters').insert(rows.map((row) => ({
    id: crypto.randomUUID(),
    course_id: courseId,
    nis: row.nis || null,
    full_name: row.full_name,
    sort_order: row.sort_order,
    is_active: true,
  })));
  throwIfError(error, 'Menyimpan daftar presensi');
}

export async function insertModule(data: {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  prerequisites?: string[];
}): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('modules').insert({
    id: data.id,
    course_id: data.courseId,
    title: data.title,
    description: data.description || null,
    order_index: data.orderIndex,
    is_published: true,
  });
  throwIfError(error, 'Menyimpan modul');

  if (data.prerequisites && data.prerequisites.length > 0) {
    const prerequisiteRows = data.prerequisites.map((prereqModuleId) => ({
      module_id: data.id,
      prereq_module_id: prereqModuleId,
    }));
    const prerequisiteResult = await client.from('module_prerequisites').insert(prerequisiteRows);
    throwIfError(prerequisiteResult.error, 'Menyimpan prasyarat modul');
  }
}

export async function insertActivity(data: {
  id: string;
  moduleId: string;
  title: string;
  type: Activity['type'];
  description?: string;
  content_markdown?: string;
  assignment_mode?: Activity['assignment_mode'];
  reflection_prompt?: string;
  due_at?: string;
  orderIndex: number;
}): Promise<void> {
  const { error } = await requireClient().from('activities').insert({
    id: data.id,
    module_id: data.moduleId,
    title: data.title,
    type: data.type,
    description: data.description || null,
    content_markdown: data.content_markdown || null,
    assignment_mode: data.assignment_mode || null,
    reflection_prompt: data.reflection_prompt || null,
    due_at: data.due_at || null,
    order_index: data.orderIndex,
    is_published: true,
  });
  throwIfError(error, 'Menyimpan aktivitas');
}

export async function updateActivity(activityId: string, updates: Partial<Activity>): Promise<void> {
  const { id: _id, module_id: _moduleId, created_at: _createdAt, ...allowed } = updates;
  const { error } = await requireClient().from('activities').update(allowed).eq('id', activityId);
  throwIfError(error, 'Memperbarui aktivitas');
}

export async function insertQuizQuestion(question: Omit<QuizQuestion, 'id'> & { id: string }): Promise<void> {
  const { error } = await requireClient().from('quiz_questions').insert({
    id: question.id,
    activity_id: question.activity_id,
    question_type: question.question_type,
    question_text: question.question_text,
    options: question.options,
    correct_keys: question.correct_keys || [],
    explanation: question.explanation || null,
    points: question.points,
    difficulty: question.difficulty || null,
    bloom_taxonomy: question.bloom_taxonomy || null,
    is_active: question.is_active ?? true,
  });
  throwIfError(error, 'Menyimpan soal kuis');
}

export async function saveAssignment(data: {
  activityId: string;
  studentId?: string;
  groupId?: string;
  link: string;
  text?: string;
}): Promise<void> {
  const client = requireClient();
  const ownerColumn = data.groupId ? 'group_id' : 'student_id';
  const { error } = await client.from('assignment_submissions').upsert({
    id: crypto.randomUUID(),
    activity_id: data.activityId,
    student_id: data.groupId ? null : data.studentId,
    group_id: data.groupId || null,
    submission_link: data.link,
    submission_text: data.text || null,
    submitted_at: new Date().toISOString(),
  }, { onConflict: `activity_id,${ownerColumn}` });
  throwIfError(error, 'Menyimpan pengumpulan tugas');
}

export async function gradeAssignment(submissionId: string, grade: number, feedback: string): Promise<void> {
  const { error } = await requireClient().from('assignment_submissions').update({ grade, feedback }).eq('id', submissionId);
  throwIfError(error, 'Menyimpan nilai tugas');
}

export async function saveReflection(data: {
  activityId: string;
  studentId: string;
  text: string;
  mood: Reflection['mood_tracker'];
}): Promise<void> {
  const { error } = await requireClient().from('reflections').upsert({
    id: crypto.randomUUID(),
    activity_id: data.activityId,
    student_id: data.studentId,
    reflection_text: data.text,
    mood_tracker: data.mood,
    created_at: new Date().toISOString(),
  }, { onConflict: 'activity_id,student_id' });
  throwIfError(error, 'Menyimpan refleksi');
}

export async function markCompleted(studentId: string, activityId: string): Promise<void> {
  const { error } = await requireClient().from('completions').upsert({
    id: crypto.randomUUID(),
    student_id: studentId,
    activity_id: activityId,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'student_id,activity_id' });
  throwIfError(error, 'Menyimpan progres');
}
