'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  Activity,
  ActivityType,
  AssignmentSubmission,
  ClassRoster,
  Completion,
  Course,
  CourseEnrollment,
  CourseModule,
  QuizQuestion,
  QuizSubmission,
  Reflection,
  StudyGroup,
} from '@/lib/types';
import {
  initialActivities,
  initialAssignmentSubmissions,
  initialCompletions,
  initialCourses,
  initialEnrollments,
  initialModules,
  initialQuizQuestions,
  initialQuizSubmissions,
  initialReflections,
  initialRosters,
  initialStudyGroups,
} from '@/lib/mock-data';
import {
  claimRoster as claimRosterLive,
  createCourse as createCourseLive,
  getQuizPayload as getQuizPayloadLive,
  insertActivity,
  insertModule,
  insertQuizQuestion,
  insertRosters,
  joinCourse,
  loadLmsSnapshot,
  markCompleted,
  saveAssignment,
  saveReflection,
  submitQuiz as submitQuizLive,
  gradeAssignment as gradeAssignmentLive,
  updateActivity as updateActivityLive,
  type LmsSnapshot,
} from '@/lib/lms-api';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface SubmitQuizResponse {
  submissionId: string;
  score: number;
  maxPoints: number;
  results: any[];
}

interface LMSContextType {
  courses: Course[];
  createCourse: (data: { title: string; subject: string; grade_level: string; description?: string }) => Course;
  getCourse: (id: string) => Course | undefined;
  getCourseByCode: (code: string) => Course | undefined;

  rosters: ClassRoster[];
  getRostersForCourse: (courseId: string) => ClassRoster[];
  addRostersBulk: (courseId: string, text: string) => number;
  claimRoster: (courseId: string, rosterId: string, studentId: string, studentName: string) => boolean | Promise<boolean>;

  enrollments: CourseEnrollment[];
  getStudentEnrollments: (studentId: string) => CourseEnrollment[];
  joinCourseByCode: (code: string, studentId: string) =>
    | { success: boolean; course?: Course; error?: string }
    | Promise<{ success: boolean; course?: Course; error?: string }>;

  modules: CourseModule[];
  activities: Activity[];
  getModulesForCourse: (courseId: string) => CourseModule[];
  getActivitiesForModule: (moduleId: string) => Activity[];
  getActivity: (activityId: string) => Activity | undefined;
  addModule: (courseId: string, title: string, description?: string, prerequisites?: string[]) => CourseModule;
  addActivity: (data: {
    moduleId: string;
    title: string;
    type: ActivityType;
    description?: string;
    content_markdown?: string;
    assignment_mode?: 'individual' | 'group';
    reflection_prompt?: string;
    due_at?: string;
  }) => Activity;
  updateActivity: (id: string, updates: Partial<Activity>) => void;

  quizQuestions: QuizQuestion[];
  quizSubmissions: QuizSubmission[];
  getQuizPayload: (activityId: string, isTeacher: boolean) => QuizQuestion[] | Promise<QuizQuestion[]>;
  addQuizQuestion: (question: Omit<QuizQuestion, 'id'>) => QuizQuestion;
  submitQuiz: (
    activityId: string,
    studentId: string,
    studentName: string,
    answers: Record<string, string | string[]>,
    timeTakenSeconds: number
  ) => SubmitQuizResponse | Promise<SubmitQuizResponse>;

  studyGroups: StudyGroup[];
  assignmentSubmissions: AssignmentSubmission[];
  getGroupsForActivity: (activityId: string) => StudyGroup[];
  getStudentGroupForActivity: (activityId: string, studentId: string) => StudyGroup | undefined;
  submitAssignment: (data: {
    activityId: string;
    studentId: string;
    studentName: string;
    link: string;
    text?: string;
  }) => { success: boolean; error?: string };
  gradeAssignment: (submissionId: string, grade: number, feedback: string) => void;

  reflections: Reflection[];
  getReflectionsForActivity: (activityId: string) => Reflection[];
  submitReflection: (
    activityId: string,
    studentId: string,
    studentName: string,
    text: string,
    mood: 'paham' | 'tertantang' | 'bantuan' | 'bingung'
  ) => void;

  completions: Completion[];
  isActivityCompleted: (studentId: string, activityId: string) => boolean;
  markActivityCompleted: (studentId: string, activityId: string) => void;
  isModuleUnlocked: (studentId: string, moduleId: string) => boolean;
  getCourseProgress: (studentId: string, courseId: string) => { total: number; completed: number; percent: number };

  generateMaterialAI: (topic: string, grade: string, promptNotes?: string) => Promise<{
    title: string;
    markdown: string;
    summary: string;
  }>;
  generateQuizAI: (
    moduleTitle: string,
    count: number,
    bloom: string,
    difficulty: string
  ) => Promise<Array<Omit<QuizQuestion, 'id' | 'activity_id'>>>;
  generateAssignmentAI: (
    topic: string,
    mode: 'individual' | 'group',
    indicator?: string
  ) => Promise<{ title: string; markdown: string; rubric: any[] }>;
  generateReflectionAI: (topic: string, focus: string) => Promise<{ prompts: string[]; suggestedMoods: string[] }>;
  generateGradingAI: (studentAnswer: string, rubricCriteria?: string) => Promise<{
    suggestedGrade: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  exportGradebookCSV: (courseId: string) => string;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readDemoState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export function LMSProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const live = isSupabaseConfigured();
  const pendingActivities = useRef(new Map<string, Promise<void>>());

  // Demo data is deliberately retained as an offline preview. As soon as a
  // Supabase URL/key is configured, state starts empty and is hydrated only by
  // loadLmsSnapshot(), so live data can never be silently mixed with fixtures.
  const [courses, setCourses] = useState<Course[]>(() => (live ? [] : readDemoState('lessonlen_courses', initialCourses)));
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(() =>
    live ? [] : readDemoState('lessonlen_enrollments', initialEnrollments)
  );
  const [rosters, setRosters] = useState<ClassRoster[]>(() => (live ? [] : readDemoState('lessonlen_rosters', initialRosters)));
  const [modules, setModules] = useState<CourseModule[]>(() => (live ? [] : readDemoState('lessonlen_modules', initialModules)));
  const [activities, setActivities] = useState<Activity[]>(() =>
    live ? [] : readDemoState('lessonlen_activities', initialActivities)
  );
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() =>
    live ? [] : readDemoState('lessonlen_quiz_questions', initialQuizQuestions)
  );
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>(() =>
    live ? [] : readDemoState('lessonlen_quiz_submissions', initialQuizSubmissions)
  );
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(() =>
    live ? [] : readDemoState('lessonlen_study_groups', initialStudyGroups)
  );
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>(() =>
    live ? [] : readDemoState('lessonlen_assignment_submissions', initialAssignmentSubmissions)
  );
  const [reflections, setReflections] = useState<Reflection[]>(() =>
    live ? [] : readDemoState('lessonlen_reflections', initialReflections)
  );
  const [completions, setCompletions] = useState<Completion[]>(() =>
    live ? [] : readDemoState('lessonlen_completions', initialCompletions)
  );

  const applySnapshot = (snapshot: LmsSnapshot) => {
    setCourses(snapshot.courses);
    setEnrollments(snapshot.enrollments);
    setRosters(snapshot.rosters);
    setModules(snapshot.modules);
    setActivities(snapshot.activities);
    setQuizQuestions(snapshot.quizQuestions);
    setQuizSubmissions(snapshot.quizSubmissions);
    setStudyGroups(snapshot.studyGroups);
    setAssignmentSubmissions(snapshot.assignmentSubmissions);
    setReflections(snapshot.reflections);
    setCompletions(snapshot.completions);
  };

  const refreshLiveData = async (): Promise<LmsSnapshot | null> => {
    if (!live || !user?.id) return null;
    const snapshot = await loadLmsSnapshot(user.role);
    applySnapshot(snapshot);
    return snapshot;
  };

  useEffect(() => {
    if (!live) return;
    if (!user?.id) {
      applySnapshot({
        courses: [],
        enrollments: [],
        rosters: [],
        modules: [],
        activities: [],
        quizQuestions: [],
        quizSubmissions: [],
        studyGroups: [],
        assignmentSubmissions: [],
        reflections: [],
        completions: [],
      });
      return;
    }

    let cancelled = false;
    loadLmsSnapshot(user.role)
      .then((snapshot) => {
        if (!cancelled) applySnapshot(snapshot);
      })
      .catch((error: Error) => {
        console.error('Gagal memuat data Supabase:', error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [live, user?.id, user?.role]);

  // In demo mode localStorage remains a useful offline preview. It is never
  // written while live mode is active.
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_courses', JSON.stringify(courses));
  }, [courses, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_enrollments', JSON.stringify(enrollments));
  }, [enrollments, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_rosters', JSON.stringify(rosters));
  }, [rosters, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_modules', JSON.stringify(modules));
  }, [modules, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_activities', JSON.stringify(activities));
  }, [activities, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_quiz_questions', JSON.stringify(quizQuestions));
  }, [quizQuestions, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_quiz_submissions', JSON.stringify(quizSubmissions));
  }, [quizSubmissions, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_study_groups', JSON.stringify(studyGroups));
  }, [studyGroups, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_assignment_submissions', JSON.stringify(assignmentSubmissions));
  }, [assignmentSubmissions, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_reflections', JSON.stringify(reflections));
  }, [reflections, live]);
  useEffect(() => {
    if (!live) localStorage.setItem('lessonlen_completions', JSON.stringify(completions));
  }, [completions, live]);

  const createCourse = (data: { title: string; subject: string; grade_level: string; description?: string }) => {
    const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomCode = '';
    for (let i = 0; i < 6; i += 1) randomCode += codeChars.charAt(Math.floor(Math.random() * codeChars.length));

    const newCourse: Course = {
      id: makeId('course'),
      teacher_id: user?.id || 'teacher-01',
      teacher_name: user?.full_name,
      school_id: user?.school_id,
      title: data.title,
      subject: data.subject,
      grade_level: data.grade_level,
      class_code: randomCode,
      description: data.description,
      year_term: '2026/2027 Ganjil',
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    setCourses((previous) => [newCourse, ...previous]);

    if (live && user?.id) {
      void createCourseLive({
        id: newCourse.id,
        title: data.title,
        subject: data.subject,
        grade_level: data.grade_level,
        description: data.description,
        teacherId: user.id,
        schoolId: user.school_id,
        classCode: randomCode,
      })
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal membuat kelas:', error.message));
    }
    return newCourse;
  };

  const getCourse = (id: string) => courses.find((course) => course.id === id);
  const getCourseByCode = (code: string) =>
    courses.find((course) => course.class_code.toUpperCase() === code.trim().toUpperCase());

  const getRostersForCourse = (courseId: string) => rosters.filter((roster) => roster.course_id === courseId);

  const parseRosterInput = (text: string, courseId: string) => {
    const existingCount = rosters.filter((roster) => roster.course_id === courseId).length;
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        let nis: string | undefined;
        let fullName = line;
        if (line.includes(',')) {
          const parts = line.split(',');
          nis = parts[0].trim();
          fullName = parts.slice(1).join(',').trim();
        } else if (line.includes('-')) {
          const parts = line.split('-');
          if (/^\d+$/.test(parts[0].trim())) {
            nis = parts[0].trim();
            fullName = parts.slice(1).join('-').trim();
          }
        }
        return {
          id: makeId('roster'),
          course_id: courseId,
          nis,
          full_name: fullName,
          sort_order: existingCount + index + 1,
          is_claimed: false,
        } as ClassRoster;
      });
  };

  const addRostersBulk = (courseId: string, text: string) => {
    const newRosters = parseRosterInput(text, courseId);
    setRosters((previous) => [...previous, ...newRosters]);
    if (live && newRosters.length > 0) {
      void insertRosters(courseId, newRosters.map(({ nis, full_name, sort_order }) => ({ nis, full_name, sort_order })))
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal menyimpan roster:', error.message));
    }
    return newRosters.length;
  };

  const claimRoster = (courseId: string, rosterId: string, studentId: string, studentName: string) => {
    if (live) {
      return claimRosterLive(rosterId)
        .then(() => refreshLiveData())
        .then(() => true)
        .catch((error: Error) => {
          console.error('Gagal klaim roster:', error.message);
          return false;
        });
    }

    setRosters((previous) =>
      previous.map((roster) =>
        roster.id === rosterId
          ? { ...roster, is_claimed: true, claimed_by_student_id: studentId, claimed_at: new Date().toISOString() }
          : roster
      )
    );
    setEnrollments((previous) => {
      if (previous.some((enrollment) => enrollment.course_id === courseId && enrollment.student_id === studentId)) return previous;
      return [
        ...previous,
        {
          id: makeId('enrollment'),
          course_id: courseId,
          student_id: studentId,
          enrolled_via: 'roster',
          is_active: true,
          joined_at: new Date().toISOString(),
        },
      ];
    });
    void studentName;
    return true;
  };

  const getStudentEnrollments = (studentId: string) => enrollments.filter((enrollment) => enrollment.student_id === studentId);

  const joinCourseByCode = (code: string, studentId: string) => {
    if (live) {
      return joinCourse(code)
        .then(async (courseId) => {
          const snapshot = await refreshLiveData();
          return {
            success: true,
            course: snapshot?.courses.find((course) => course.id === courseId),
          };
        })
        .catch((error: Error) => ({ success: false, error: error.message }));
    }

    const course = getCourseByCode(code);
    if (!course) return { success: false, error: 'Kode kelas tidak ditemukan. Mohon periksa kembali.' };
    if (!enrollments.some((enrollment) => enrollment.course_id === course.id && enrollment.student_id === studentId)) {
      setEnrollments((previous) => [
        ...previous,
        {
          id: makeId('enrollment'),
          course_id: course.id,
          student_id: studentId,
          enrolled_via: 'code',
          is_active: true,
          joined_at: new Date().toISOString(),
        },
      ]);
    }
    return { success: true, course };
  };

  const getModulesForCourse = (courseId: string) =>
    modules.filter((module) => module.course_id === courseId).sort((a, b) => a.order_index - b.order_index);
  const getActivitiesForModule = (moduleId: string) =>
    activities.filter((activity) => activity.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);
  const getActivity = (activityId: string) => activities.find((activity) => activity.id === activityId);

  const addModule = (courseId: string, title: string, description?: string, prerequisites?: string[]) => {
    const newModule: CourseModule = {
      id: makeId('module'),
      course_id: courseId,
      title,
      description,
      order_index: modules.filter((module) => module.course_id === courseId).length + 1,
      is_published: true,
      prerequisites: prerequisites || [],
      created_at: new Date().toISOString(),
    };
    setModules((previous) => [...previous, newModule]);
    if (live) {
      void insertModule({
        id: newModule.id,
        courseId,
        title,
        description,
        orderIndex: newModule.order_index,
        prerequisites,
      })
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal menyimpan modul:', error.message));
    }
    return newModule;
  };

  const addActivity = (data: {
    moduleId: string;
    title: string;
    type: ActivityType;
    description?: string;
    content_markdown?: string;
    assignment_mode?: 'individual' | 'group';
    reflection_prompt?: string;
    due_at?: string;
  }) => {
    const newActivity: Activity = {
      id: makeId('activity'),
      module_id: data.moduleId,
      title: data.title,
      type: data.type,
      description: data.description,
      content_markdown: data.content_markdown,
      assignment_mode: data.assignment_mode,
      reflection_prompt: data.reflection_prompt,
      due_at: data.due_at,
      order_index: activities.filter((activity) => activity.module_id === data.moduleId).length + 1,
      is_published: true,
      created_at: new Date().toISOString(),
    };
    setActivities((previous) => [...previous, newActivity]);
    if (live) {
      const write = insertActivity({
        id: newActivity.id,
        moduleId: data.moduleId,
        title: data.title,
        type: data.type,
        description: data.description,
        content_markdown: data.content_markdown,
        assignment_mode: data.assignment_mode,
        reflection_prompt: data.reflection_prompt,
        due_at: data.due_at,
        orderIndex: newActivity.order_index,
      });
      pendingActivities.current.set(newActivity.id, write);
      void write
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal menyimpan aktivitas:', error.message))
        .finally(() => pendingActivities.current.delete(newActivity.id));
    }
    return newActivity;
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((previous) => previous.map((activity) => (activity.id === id ? { ...activity, ...updates } : activity)));
    if (live) {
      void updateActivityLive(id, updates)
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal memperbarui aktivitas:', error.message));
    }
  };

  const getQuizPayload = (activityId: string, isTeacher: boolean) => {
    if (live) return getQuizPayloadLive(activityId, isTeacher);
    const questions = quizQuestions.filter((question) => question.activity_id === activityId);
    if (isTeacher) return questions;
    return questions.map(({ correct_keys: _correctKeys, explanation: _explanation, ...question }) => question as QuizQuestion);
  };

  const addQuizQuestion = (question: Omit<QuizQuestion, 'id'>) => {
    const newQuestion: QuizQuestion = { ...question, id: makeId('question') };
    setQuizQuestions((previous) => [...previous, newQuestion]);
    if (live) {
      const dependency = pendingActivities.current.get(question.activity_id) || Promise.resolve();
      void dependency
        .then(() => insertQuizQuestion({ ...question, id: newQuestion.id }))
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal menyimpan soal kuis:', error.message));
    }
    return newQuestion;
  };

  const submitQuiz = (
    activityId: string,
    studentId: string,
    studentName: string,
    answers: Record<string, string | string[]>,
    timeTakenSeconds: number
  ) => {
    if (live) {
      const clientSubmissionId = makeId('submission');
      return submitQuizLive(activityId, answers, timeTakenSeconds, clientSubmissionId).then((result) => {
        void studentId;
        void studentName;
        void refreshLiveData();
        return {
          submissionId: result.submissionId,
          score: result.score,
          maxPoints: result.maxPoints,
          results: result.results,
        };
      });
    }

    const questions = quizQuestions.filter((question) => question.activity_id === activityId);
    let totalScore = 0;
    let maxPoints = 0;
    const results = questions.map((question) => {
      maxPoints += question.points || 10;
      const selected = answers[question.id];
      const selectedKeys = Array.isArray(selected) ? selected : [selected];
      const correct = question.question_type === 'multiple'
        ? selectedKeys.length === (question.correct_keys?.length || 0) && selectedKeys.every((key) => question.correct_keys?.includes(key as string))
        : selected === (question.correct_keys?.[0] || 'A');
      const pointsEarned = correct ? question.points || 10 : 0;
      totalScore += pointsEarned;
      return {
        question_id: question.id,
        correct,
        selected,
        points_earned: pointsEarned,
        max_points: question.points || 10,
        explanation: question.explanation,
      };
    });
    const submission: QuizSubmission = {
      id: makeId('quiz-submission'),
      activity_id: activityId,
      student_id: studentId,
      student_name: studentName,
      attempt_no: quizSubmissions.filter((item) => item.activity_id === activityId && item.student_id === studentId).length + 1,
      score: totalScore,
      max_points: maxPoints,
      answers_payload: answers,
      results_payload: results,
      time_taken_seconds: timeTakenSeconds,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };
    setQuizSubmissions((previous) => [submission, ...previous]);
    markActivityCompleted(studentId, activityId);
    return { submissionId: submission.id, score: totalScore, maxPoints, results };
  };

  const getGroupsForActivity = (activityId: string) => studyGroups.filter((group) => group.activity_id === activityId);
  const getStudentGroupForActivity = (activityId: string, studentId: string) =>
    studyGroups.find((group) => group.activity_id === activityId && group.members.some((member) => member.student_id === studentId));

  const submitAssignment = (data: {
    activityId: string;
    studentId: string;
    studentName: string;
    link: string;
    text?: string;
  }) => {
    const activity = getActivity(data.activityId);
    if (!activity) return { success: false, error: 'Aktivitas tidak ditemukan' };

    let groupId: string | undefined;
    let groupName: string | undefined;
    if (activity.assignment_mode === 'group') {
      const group = getStudentGroupForActivity(data.activityId, data.studentId);
      if (!group) return { success: false, error: 'Kamu belum terdaftar di kelompok manapun untuk tugas ini. Hubungi gurumu.' };
      if (group.leader_id !== data.studentId) {
        return { success: false, error: `Hanya ketua kelompok (${group.leader_name || 'Ketua'}) yang memiliki hak akses untuk mengumpulkan link tugas kelompok!` };
      }
      groupId = group.id;
      groupName = group.group_name;
    }

    const submission: AssignmentSubmission = {
      id: makeId('assignment-submission'),
      activity_id: data.activityId,
      student_id: activity.assignment_mode === 'individual' ? data.studentId : undefined,
      student_name: activity.assignment_mode === 'individual' ? data.studentName : undefined,
      group_id: groupId,
      group_name: groupName,
      submission_link: data.link,
      submission_text: data.text,
      submitted_at: new Date().toISOString(),
    };
    setAssignmentSubmissions((previous) => [
      submission,
      ...previous.filter((item) => {
        if (item.activity_id !== data.activityId) return true;
        if (groupId) return item.group_id !== groupId;
        return item.student_id !== data.studentId;
      }),
    ]);

    if (live) {
      void saveAssignment({ activityId: data.activityId, studentId: activity.assignment_mode === 'individual' ? data.studentId : undefined, groupId, link: data.link, text: data.text })
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal menyimpan tugas:', error.message));
    } else if (groupId) {
      const group = studyGroups.find((item) => item.id === groupId);
      group?.members.forEach((member) => markActivityCompleted(member.student_id, data.activityId));
    } else {
      markActivityCompleted(data.studentId, data.activityId);
    }
    return { success: true };
  };

  const gradeAssignment = (submissionId: string, grade: number, feedback: string) => {
    setAssignmentSubmissions((previous) => previous.map((submission) => submission.id === submissionId ? { ...submission, grade, feedback } : submission));
    if (live) {
      void gradeAssignmentLive(submissionId, grade, feedback)
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal menyimpan nilai:', error.message));
    }
  };

  const getReflectionsForActivity = (activityId: string) => reflections.filter((reflection) => reflection.activity_id === activityId);
  const submitReflection = (
    activityId: string,
    studentId: string,
    studentName: string,
    text: string,
    mood: 'paham' | 'tertantang' | 'bantuan' | 'bingung'
  ) => {
    const reflection: Reflection = {
      id: makeId('reflection'),
      activity_id: activityId,
      student_id: studentId,
      student_name: studentName,
      reflection_text: text,
      mood_tracker: mood,
      created_at: new Date().toISOString(),
    };
    setReflections((previous) => [reflection, ...previous.filter((item) => !(item.activity_id === activityId && item.student_id === studentId))]);
    if (live) {
      void saveReflection({ activityId, studentId, text, mood })
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal menyimpan refleksi:', error.message));
    } else {
      markActivityCompleted(studentId, activityId);
    }
  };

  const isActivityCompleted = (studentId: string, activityId: string) =>
    completions.some((completion) => completion.student_id === studentId && completion.activity_id === activityId);

  const markActivityCompleted = (studentId: string, activityId: string) => {
    setCompletions((previous) => {
      if (previous.some((completion) => completion.student_id === studentId && completion.activity_id === activityId)) return previous;
      return [...previous, { id: makeId('completion'), student_id: studentId, activity_id: activityId, completed_at: new Date().toISOString() }];
    });
    if (live) {
      void markCompleted(studentId, activityId)
        .then(() => refreshLiveData())
        .catch((error: Error) => console.error('Gagal menyimpan progres:', error.message));
    }
  };

  const isModuleUnlocked = (studentId: string, moduleId: string) => {
    const target = modules.find((module) => module.id === moduleId);
    if (!target?.prerequisites?.length) return true;
    return target.prerequisites.every((prerequisiteId) => {
      const prerequisiteActivities = activities.filter((activity) => activity.module_id === prerequisiteId && activity.is_published);
      return prerequisiteActivities.length === 0 || prerequisiteActivities.every((activity) => isActivityCompleted(studentId, activity.id));
    });
  };

  const getCourseProgress = (studentId: string, courseId: string) => {
    const moduleIds = modules.filter((module) => module.course_id === courseId).map((module) => module.id);
    const courseActivities = activities.filter((activity) => moduleIds.includes(activity.module_id) && activity.is_published);
    const completed = courseActivities.filter((activity) => isActivityCompleted(studentId, activity.id)).length;
    return { total: courseActivities.length, completed, percent: courseActivities.length ? Math.round((completed / courseActivities.length) * 100) : 0 };
  };

  // These generators stay local because AI generation is provided by the existing
  // Edge Functions roadmap; saving the resulting draft uses the live mutations above.
  const generateMaterialAI = async (topic: string, grade: string, promptNotes?: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      title: `Materi ${topic} - Pembelajaran Mendalam`,
      markdown: `# ${topic} (${grade})\n\n## Pengantar\n\nMateri ini membantu siswa memahami **${topic}** melalui contoh nyata dan pemecahan masalah bertahap.\n\n${promptNotes ? `> Catatan guru: ${promptNotes}\n\n` : ''}## Poin penting\n\n- Hubungkan konsep dengan situasi sehari-hari.\n- Uji pemahaman melalui contoh baru.`,
      summary: `Materi terstruktur mengenai ${topic} untuk ${grade}.`,
    };
  };

  const generateQuizAI = async (moduleTitle: string, count = 3, bloom = 'understand', difficulty = 'medium') => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const samples: Array<Omit<QuizQuestion, 'id' | 'activity_id'>> = [
      {
        question_type: 'single',
        question_text: `Apa gagasan utama yang dipelajari pada ${moduleTitle}?`,
        options: [{ key: 'A', text: 'Menerapkan konsep pada masalah nyata' }, { key: 'B', text: 'Menghafal tanpa memahami' }, { key: 'C', text: 'Menyalin catatan' }, { key: 'D', text: 'Menghindari latihan' }],
        correct_keys: ['A'], explanation: 'Pembelajaran mendalam mengutamakan pemahaman dan penerapan.', points: 20, difficulty: difficulty as QuizQuestion['difficulty'], bloom_taxonomy: bloom, is_active: true,
      },
      {
        question_type: 'single',
        question_text: `Bagaimana siswa sebaiknya menguji pemahamannya tentang ${moduleTitle}?`,
        options: [{ key: 'A', text: 'Mencoba konteks atau contoh yang baru' }, { key: 'B', text: 'Tidak mengerjakan latihan' }, { key: 'C', text: 'Menghafal jawaban' }, { key: 'D', text: 'Menghapus catatan' }],
        correct_keys: ['A'], explanation: 'Transfer ke konteks baru menunjukkan pemahaman.', points: 20, difficulty: difficulty as QuizQuestion['difficulty'], bloom_taxonomy: bloom, is_active: true,
      },
      {
        question_type: 'single',
        question_text: `Kemampuan membandingkan dua skenario dalam ${moduleTitle} termasuk proses apa?`,
        options: [{ key: 'A', text: 'Menganalisis' }, { key: 'B', text: 'Menyalin' }, { key: 'C', text: 'Mengulang' }, { key: 'D', text: 'Menebak' }],
        correct_keys: ['A'], explanation: 'Membandingkan skenario adalah bagian dari analisis.', points: 20, difficulty: 'medium', bloom_taxonomy: 'analyze', is_active: true,
      },
    ];
    return samples.slice(0, count);
  };

  const generateAssignmentAI = async (topic: string, mode: 'individual' | 'group') => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      title: `${mode === 'group' ? 'Proyek Kolaboratif' : 'Tugas Analisis'}: ${topic}`,
      markdown: `### Panduan Pengerjaan\n\nTerapkan konsep **${topic}** pada studi kasus di sekitar kamu. Jelaskan langkah pemecahan masalah dengan runtut dan lampirkan tautan hasil kerja.`,
      rubric: [{ criterion: 'Kedalaman analisis', max_points: 50, description: 'Konsep diterapkan dengan tepat.' }, { criterion: 'Kejelasan solusi', max_points: 50, description: 'Jawaban runtut dan relevan.' }],
    };
  };

  const generateReflectionAI = async (topic: string, focus: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      prompts: [`Apa hal terpenting yang kamu pahami tentang ${topic}?`, `Bagian mana dari ${topic} yang masih menantang terkait ${focus}?`, 'Bagaimana kamu akan menerapkan pemahaman ini?'],
      suggestedMoods: ['paham', 'tertantang', 'bantuan', 'bingung'],
    };
  };

  const generateGradingAI = async (studentAnswer: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const wordCount = studentAnswer.trim().split(/\s+/).filter(Boolean).length;
    return {
      suggestedGrade: wordCount > 60 ? 92 : wordCount < 20 ? 75 : 85,
      feedback: 'Siswa menunjukkan penalaran yang runut dan mampu mengaitkan teori dengan contoh kasus secara logis.',
      strengths: ['Argumentasi logis dan runut', 'Contoh kasus relevan dengan materi'],
      improvements: ['Perdalam analisis risiko atau skenario alternatif.'],
    };
  };

  const exportGradebookCSV = (courseId: string) => {
    const courseRosters = rosters.filter((roster) => roster.course_id === courseId);
    const courseModuleIds = modules.filter((module) => module.course_id === courseId).map((module) => module.id);
    const courseActivities = activities.filter((activity) => courseModuleIds.includes(activity.module_id) && activity.is_published);
    const headers = ['No', 'NIS', 'Nama Siswa', 'Status Klaim'];
    courseActivities.forEach((activity) => headers.push(`[${activity.type.toUpperCase()}] ${activity.title}`));
    headers.push('Rata-rata Nilai', 'Progress (%)');
    const rows = courseRosters.map((roster, index) => {
      const studentId = roster.claimed_by_student_id;
      const row: string[] = [String(index + 1), roster.nis || '-', `"${roster.full_name}"`, roster.is_claimed ? 'Sudah Terdaftar' : 'Belum Klaim'];
      let sum = 0;
      let count = 0;
      courseActivities.forEach((activity) => {
        if (!studentId) return row.push('-');
        if (activity.type === 'quiz') {
          const submission = quizSubmissions.find((item) => item.activity_id === activity.id && item.student_id === studentId);
          row.push(submission ? String(submission.score) : '0');
          if (submission) { sum += submission.score; count += 1; }
        } else if (activity.type === 'assignment') {
          const submission = assignmentSubmissions.find((item) => item.activity_id === activity.id && (item.student_id === studentId || (item.group_id && studyGroups.find((group) => group.id === item.group_id && group.members.some((member) => member.student_id === studentId)))));
          if (submission?.grade !== undefined) { row.push(String(submission.grade)); sum += submission.grade; count += 1; }
          else row.push(submission ? 'Terkumpul (Belum Dinilai)' : 'Belum Kumpul');
        } else if (activity.type === 'reflection') row.push(reflections.some((reflection) => reflection.activity_id === activity.id && reflection.student_id === studentId) ? 'Terisi' : 'Belum Isi');
        else row.push(isActivityCompleted(studentId, activity.id) ? 'Selesai' : 'Belum');
      });
      row.push(count ? (sum / count).toFixed(1) : '-', studentId ? `${getCourseProgress(studentId, courseId).percent}%` : '0%');
      return row.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  };

  return (
    <LMSContext.Provider value={{
      courses, createCourse, getCourse, getCourseByCode,
      rosters, getRostersForCourse, addRostersBulk, claimRoster,
      enrollments, getStudentEnrollments, joinCourseByCode,
      modules, activities, getModulesForCourse, getActivitiesForModule, getActivity, addModule, addActivity, updateActivity,
      quizQuestions, quizSubmissions, getQuizPayload, addQuizQuestion, submitQuiz,
      studyGroups, assignmentSubmissions, getGroupsForActivity, getStudentGroupForActivity, submitAssignment, gradeAssignment,
      reflections, getReflectionsForActivity, submitReflection,
      completions, isActivityCompleted, markActivityCompleted, isModuleUnlocked, getCourseProgress,
      generateMaterialAI, generateQuizAI, generateAssignmentAI, generateReflectionAI, generateGradingAI, exportGradebookCSV,
    }}>
      {children}
    </LMSContext.Provider>
  );
}

export function useLMS() {
  const context = useContext(LMSContext);
  if (!context) throw new Error('useLMS must be used within an LMSProvider');
  return context;
}
