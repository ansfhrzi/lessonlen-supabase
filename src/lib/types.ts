export type UserRole = 'teacher' | 'student';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  whatsapp_number?: string;
  school_id?: string;
  school_name?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface School {
  id: string;
  name: string;
  license_code: string;
  is_active: boolean;
  created_at?: string;
}

export interface Course {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  school_id?: string;
  title: string;
  subject: string;
  grade_level: string;
  class_code: string;
  description?: string;
  year_term?: string;
  is_archived?: boolean;
  created_at?: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  enrolled_via: 'code' | 'manual' | 'roster';
  is_active: boolean;
  joined_at: string;
}

export interface ClassRoster {
  id: string;
  course_id: string;
  nis?: string;
  full_name: string;
  sort_order: number;
  is_pre_allocated?: boolean;
  is_claimed?: boolean;
  claimed_by_student_id?: string;
  claimed_at?: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at?: string;
  prerequisites?: string[]; // IDs of required modules
}

export type ActivityType = 'lesson' | 'assignment' | 'quiz' | 'reflection';
export type AssignmentMode = 'individual' | 'group';

export interface Activity {
  id: string;
  module_id: string;
  title: string;
  type: ActivityType;
  description?: string;
  content_markdown?: string;
  assignment_mode?: AssignmentMode;
  reflection_prompt?: string;
  order_index: number;
  is_published: boolean;
  due_at?: string;
  created_at?: string;
}

export interface QuizOption {
  key: string; // "A", "B", "C", "D"
  text: string;
}

export interface QuizQuestion {
  id: string;
  activity_id: string;
  question_type: 'single' | 'multiple' | 'short_answer';
  question_text: string;
  options: QuizOption[];
  correct_keys?: string[]; // Hidden from students via RPC
  explanation?: string;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  bloom_taxonomy?: string;
  is_active?: boolean;
}

export interface QuizSubmission {
  id: string;
  activity_id: string;
  student_id: string;
  student_name?: string;
  attempt_no: number;
  client_submission_id?: string;
  score: number;
  max_points?: number;
  answers_payload: Record<string, any>;
  results_payload?: {
    question_id: string;
    correct: boolean;
    selected: any;
    points_earned: number;
    max_points: number;
  }[];
  time_taken_seconds?: number;
  status: 'in_progress' | 'submitted';
  submitted_at: string;
}

export interface StudyGroup {
  id: string;
  activity_id: string;
  group_name: string;
  leader_id: string;
  leader_name?: string;
  members: {
    student_id: string;
    full_name: string;
  }[];
}

export interface AssignmentSubmission {
  id: string;
  activity_id: string;
  student_id?: string;
  student_name?: string;
  group_id?: string;
  group_name?: string;
  submission_link: string;
  submission_text?: string;
  grade?: number;
  feedback?: string;
  ai_feedback?: string;
  submitted_at: string;
}

export interface Reflection {
  id: string;
  activity_id: string;
  student_id: string;
  student_name?: string;
  reflection_text: string;
  mood_tracker: 'paham' | 'tertantang' | 'bantuan' | 'bingung';
  created_at: string;
}

export interface Completion {
  id: string;
  student_id: string;
  activity_id: string;
  completed_at: string;
}

export interface CourseProgressSummary {
  student_id: string;
  course_id: string;
  total_activities: number;
  completed_activities: number;
  progress_percent: number;
}
