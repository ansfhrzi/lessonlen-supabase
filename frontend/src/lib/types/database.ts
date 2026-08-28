// Tipe data yang mencerminkan `supabase/migrations/0001_init.sql`.
// Nama kolom sengaja mengikuti skema database (snake_case) agar hasil query
// Supabase bisa dipakai langsung tanpa pemetaan ulang.

export type AppRole = "teacher" | "student";
export type ActivityType = "lesson" | "assignment" | "quiz" | "reflection";
export type AssignmentMode = "individual" | "group";
export type AssetType = "pdf" | "video" | "image" | "audio" | "file";
export type QuestionType = "single" | "multiple" | "short_answer";
export type BloomTaxonomy =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";
export type Difficulty = "easy" | "medium" | "hard";
export type ReflectionFocus = "concept" | "technical" | "real_world" | "metacognition";

export interface School {
  id: string;
  name: string;
  license_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: AppRole;
  whatsapp_number: string | null;
  school_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  schools?: { name: string } | null;
}

export interface Course {
  id: string;
  teacher_id: string;
  school_id: string | null;
  title: string;
  subject: string | null;
  grade_level: string | null;
  class_code: string;
  description: string | null;
  year_term: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
}

export interface ClassRoster {
  id: string;
  course_id: string;
  nis: string | null;
  full_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  roster_claims?: RosterClaim[];
}

export interface RosterClaim {
  id: string;
  roster_id: string;
  enrollment_id: string;
  claimed_at: string;
  course_enrollments?: (CourseEnrollment & { profiles?: Pick<Profile, "id" | "full_name"> | null }) | null;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  activities?: Activity[];
  module_prerequisites?: { module_id: string; prereq_module_id: string }[];
}

export interface Activity {
  id: string;
  module_id: string;
  title: string;
  type: ActivityType;
  description: string | null;
  content_markdown: string | null;
  assignment_mode: AssignmentMode | null;
  reflection_prompt: string | null;
  order_index: number;
  is_published: boolean;
  due_at: string | null;
  created_at: string;
  updated_at: string;
  quiz_questions?: QuizQuestion[];
  completions?: { student_id: string; completed_at: string }[];
}

export interface QuizOption {
  key: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  activity_id: string;
  question_type: QuestionType;
  question_text: string;
  options: QuizOption[];
  correct_keys: string[];
  explanation: string | null;
  points: number;
  difficulty: string | null;
  bloom_taxonomy: string | null;
  source_ref: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Bentuk soal yang dikembalikan RPC `get_quiz_payload` — TANPA `correct_keys`. */
export interface QuizPayloadQuestion {
  id: string;
  question_type: QuestionType;
  question_text: string;
  options: QuizOption[];
  difficulty: string | null;
  bloom_taxonomy: string | null;
  points: number;
}

export interface QuizPayload {
  activity_id: string;
  title: string;
  due_at: string | null;
  questions: QuizPayloadQuestion[];
}

export interface QuizSubmission {
  id: string;
  activity_id: string;
  student_id: string;
  attempt_no: number;
  client_submission_id: string | null;
  score: number;
  answers_payload: Record<string, unknown>;
  results_payload: QuizResultRow[];
  time_taken_seconds: number | null;
  status: "draft" | "submitted" | "timeout";
  submitted_at: string;
  profiles?: Pick<Profile, "id" | "full_name"> | null;
}

export interface QuizResultRow {
  question_id: string;
  correct: boolean;
  selected: unknown;
  points_earned: number;
  max_points: number;
}

/** Nilai yang dikembalikan RPC `submit_quiz`. */
export interface SubmitQuizResult {
  submission_id: string;
  attempt_no: number;
  score: number;
  max_points: number;
  results: QuizResultRow[];
  updated: boolean;
}

export interface Group {
  id: string;
  activity_id: string;
  group_name: string;
  leader_id: string;
  assignment_method: string | null;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  activity_id: string;
  student_id: string | null;
  group_id: string | null;
  submission_link: string | null;
  submission_text: string | null;
  grade: number | null;
  ai_feedback: string | null;
  feedback: string | null;
  submitted_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "id" | "full_name"> | null;
}

export interface Reflection {
  id: string;
  activity_id: string;
  student_id: string;
  reflection_text: string;
  mood_tracker: string | null;
  created_at: string;
  updated_at: string;
  activities?: Pick<Activity, "id" | "title" | "module_id"> | null;
}

export interface Completion {
  id: string;
  student_id: string;
  activity_id: string;
  completed_at: string;
}

export interface CourseProgressRow {
  student_id: string;
  course_id: string;
  total_activities: number;
  completed_activities: number;
  progress_percent: number;
}

export interface AiUsageRow {
  teacher_id: string;
  usage_count: number;
}

// ---------------------------------------------------------------------------
// Kontrak response Edge Function (lihat supabase/functions/*)
// ---------------------------------------------------------------------------

export interface EdgeEnvelope<T> {
  ok: true;
  feature: string;
  usage?: { used: number; limit: number };
  data: T;
}

export interface EdgeError {
  error: string;
  used?: number;
  limit?: number;
}

export interface MaterialDraft {
  title: string;
  learning_objectives: string[];
  introduction: string;
  key_concepts: { concept: string; explanation: string }[];
  real_world_example: string;
  conclusion: string;
  study_questions?: string[];
}

export interface QuizDraftQuestion {
  question_type: "single" | "multiple";
  question_text: string;
  options: QuizOption[];
  correct_keys: string[];
  explanation: string;
  points: number;
  difficulty?: string;
  bloom_taxonomy?: string;
}

export interface QuizDraft {
  questions: QuizDraftQuestion[];
}

export interface AssignmentDraft {
  title: string;
  objective: string;
  instructions: string[];
  rubric: { criteria: string; description: string; max_score: number }[];
  submission_guidelines: string;
  group_roles?: string[];
  tips_for_students?: string[];
}

export interface ReflectionDraft {
  questions: string[];
  mood_options: string[];
  teacher_note?: string;
}

export interface GradingDraft {
  draft_grade: number;
  per_criteria_score: {
    criteria: string;
    score: number;
    max_score: number;
    comment: string;
  }[];
  feedback: string;
  suggestions: string[];
  rubrics_checklist: string[];
}
