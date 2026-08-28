'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Course,
  CourseEnrollment,
  ClassRoster,
  CourseModule,
  Activity,
  ActivityType,
  QuizQuestion,
  QuizSubmission,
  StudyGroup,
  AssignmentSubmission,
  Reflection,
  Completion,
} from '@/lib/types';
import {
  initialCourses,
  initialEnrollments,
  initialRosters,
  initialModules,
  initialActivities,
  initialQuizQuestions,
  initialQuizSubmissions,
  initialStudyGroups,
  initialAssignmentSubmissions,
  initialReflections,
  initialCompletions,
} from '@/lib/mock-data';

interface LMSContextType {
  // Courses
  courses: Course[];
  createCourse: (data: { title: string; subject: string; grade_level: string; description?: string }) => Course;
  getCourse: (id: string) => Course | undefined;
  getCourseByCode: (code: string) => Course | undefined;

  // Rosters (Preset Names)
  rosters: ClassRoster[];
  getRostersForCourse: (courseId: string) => ClassRoster[];
  addRostersBulk: (courseId: string, text: string) => number;
  claimRoster: (courseId: string, rosterId: string, studentId: string, studentName: string) => boolean;

  // Enrollments
  enrollments: CourseEnrollment[];
  getStudentEnrollments: (studentId: string) => CourseEnrollment[];
  joinCourseByCode: (code: string, studentId: string) => { success: boolean; course?: Course; error?: string };

  // Modules & Activities
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

  // Quizzes
  quizQuestions: QuizQuestion[];
  quizSubmissions: QuizSubmission[];
  getQuizPayload: (activityId: string, isTeacher: boolean) => QuizQuestion[];
  addQuizQuestion: (question: Omit<QuizQuestion, 'id'>) => QuizQuestion;
  submitQuiz: (
    activityId: string,
    studentId: string,
    studentName: string,
    answers: Record<string, string | string[]>,
    timeTakenSeconds: number
  ) => { submissionId: string; score: number; maxPoints: number; results: any[] };

  // Groups & Assignments
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

  // Reflections
  reflections: Reflection[];
  getReflectionsForActivity: (activityId: string) => Reflection[];
  submitReflection: (
    activityId: string,
    studentId: string,
    studentName: string,
    text: string,
    mood: 'paham' | 'tertantang' | 'bantuan' | 'bingung'
  ) => void;

  // Completions & Progress
  completions: Completion[];
  isActivityCompleted: (studentId: string, activityId: string) => boolean;
  markActivityCompleted: (studentId: string, activityId: string) => void;
  isModuleUnlocked: (studentId: string, moduleId: string) => boolean;
  getCourseProgress: (studentId: string, courseId: string) => { total: number; completed: number; percent: number };

  // AI Co-Pilot Generators
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

  // Gradebook export
  exportGradebookCSV: (courseId: string) => string;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

export function LMSProvider({ children }: { children: React.ReactNode }) {
  // Initialize state with localStorage or mock data
  const [courses, setCourses] = useState<Course[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_courses');
      if (saved) return JSON.parse(saved);
    }
    return initialCourses;
  });

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_enrollments');
      if (saved) return JSON.parse(saved);
    }
    return initialEnrollments;
  });

  const [rosters, setRosters] = useState<ClassRoster[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_rosters');
      if (saved) return JSON.parse(saved);
    }
    return initialRosters;
  });

  const [modules, setModules] = useState<CourseModule[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_modules');
      if (saved) return JSON.parse(saved);
    }
    return initialModules;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_activities');
      if (saved) return JSON.parse(saved);
    }
    return initialActivities;
  });

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_quiz_questions');
      if (saved) return JSON.parse(saved);
    }
    return initialQuizQuestions;
  });

  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_quiz_submissions');
      if (saved) return JSON.parse(saved);
    }
    return initialQuizSubmissions;
  });

  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_study_groups');
      if (saved) return JSON.parse(saved);
    }
    return initialStudyGroups;
  });

  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_assignment_submissions');
      if (saved) return JSON.parse(saved);
    }
    return initialAssignmentSubmissions;
  });

  const [reflections, setReflections] = useState<Reflection[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_reflections');
      if (saved) return JSON.parse(saved);
    }
    return initialReflections;
  });

  const [completions, setCompletions] = useState<Completion[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lessonlen_completions');
      if (saved) return JSON.parse(saved);
    }
    return initialCompletions;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('lessonlen_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('lessonlen_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    localStorage.setItem('lessonlen_rosters', JSON.stringify(rosters));
  }, [rosters]);

  useEffect(() => {
    localStorage.setItem('lessonlen_modules', JSON.stringify(modules));
  }, [modules]);

  useEffect(() => {
    localStorage.setItem('lessonlen_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('lessonlen_quiz_questions', JSON.stringify(quizQuestions));
  }, [quizQuestions]);

  useEffect(() => {
    localStorage.setItem('lessonlen_quiz_submissions', JSON.stringify(quizSubmissions));
  }, [quizSubmissions]);

  useEffect(() => {
    localStorage.setItem('lessonlen_assignment_submissions', JSON.stringify(assignmentSubmissions));
  }, [assignmentSubmissions]);

  useEffect(() => {
    localStorage.setItem('lessonlen_reflections', JSON.stringify(reflections));
  }, [reflections]);

  useEffect(() => {
    localStorage.setItem('lessonlen_completions', JSON.stringify(completions));
  }, [completions]);

  // COURSES
  const createCourse = (data: { title: string; subject: string; grade_level: string; description?: string }) => {
    const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomCode = '';
    for (let i = 0; i < 6; i++) {
      randomCode += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
    }

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      teacher_id: 'teacher-01',
      teacher_name: 'Ahmad Fauzi, S.Pd., M.Kom.',
      title: data.title,
      subject: data.subject,
      grade_level: data.grade_level,
      class_code: randomCode,
      description: data.description,
      year_term: '2026/2027 Ganjil',
      created_at: new Date().toISOString(),
    };

    setCourses((prev) => [newCourse, ...prev]);
    return newCourse;
  };

  const getCourse = (id: string) => courses.find((c) => c.id === id);
  const getCourseByCode = (code: string) => courses.find((c) => c.class_code.toUpperCase() === code.trim().toUpperCase());

  // ROSTERS (Preset Names)
  const getRostersForCourse = (courseId: string) => rosters.filter((r) => r.course_id === courseId);

  const addRostersBulk = (courseId: string, text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const newRosters: ClassRoster[] = lines.map((line, idx) => {
      let nis: string | undefined;
      let fullName = line;

      // Check format like "202401, Nama Siswa" or "202401 - Nama Siswa"
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
        id: `ros-${Date.now()}-${idx}`,
        course_id: courseId,
        nis,
        full_name: fullName,
        sort_order: rosters.filter((r) => r.course_id === courseId).length + idx + 1,
        is_claimed: false,
      };
    });

    setRosters((prev) => [...prev, ...newRosters]);
    return newRosters.length;
  };

  const claimRoster = (courseId: string, rosterId: string, studentId: string, studentName: string) => {
    setRosters((prev) =>
      prev.map((r) => {
        if (r.id === rosterId) {
          return {
            ...r,
            is_claimed: true,
            claimed_by_student_id: studentId,
            claimed_at: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    // Auto-enroll if not already enrolled
    setEnrollments((prev) => {
      if (prev.some((e) => e.course_id === courseId && e.student_id === studentId)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `enr-${Date.now()}`,
          course_id: courseId,
          student_id: studentId,
          enrolled_via: 'roster',
          is_active: true,
          joined_at: new Date().toISOString(),
        },
      ];
    });

    return true;
  };

  // ENROLLMENTS
  const getStudentEnrollments = (studentId: string) => enrollments.filter((e) => e.student_id === studentId);

  const joinCourseByCode = (code: string, studentId: string) => {
    const course = getCourseByCode(code);
    if (!course) {
      return { success: false, error: 'Kode kelas tidak ditemukan. Mohon periksa kembali.' };
    }

    // Check if already enrolled
    const exists = enrollments.some((e) => e.course_id === course.id && e.student_id === studentId);
    if (!exists) {
      setEnrollments((prev) => [
        ...prev,
        {
          id: `enr-${Date.now()}`,
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

  // MODULES & ACTIVITIES
  const getModulesForCourse = (courseId: string) =>
    modules.filter((m) => m.course_id === courseId).sort((a, b) => a.order_index - b.order_index);

  const getActivitiesForModule = (moduleId: string) =>
    activities.filter((a) => a.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);

  const getActivity = (activityId: string) => activities.find((a) => a.id === activityId);

  const addModule = (courseId: string, title: string, description?: string, prerequisites?: string[]) => {
    const count = modules.filter((m) => m.course_id === courseId).length;
    const newModule: CourseModule = {
      id: `mod-${Date.now()}`,
      course_id: courseId,
      title,
      description,
      order_index: count + 1,
      is_published: true,
      prerequisites: prerequisites || [],
      created_at: new Date().toISOString(),
    };
    setModules((prev) => [...prev, newModule]);
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
    const count = activities.filter((a) => a.module_id === data.moduleId).length;
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      module_id: data.moduleId,
      title: data.title,
      type: data.type,
      description: data.description,
      content_markdown: data.content_markdown,
      assignment_mode: data.assignment_mode,
      reflection_prompt: data.reflection_prompt,
      due_at: data.due_at,
      order_index: count + 1,
      is_published: true,
      created_at: new Date().toISOString(),
    };
    setActivities((prev) => [...prev, newAct]);
    return newAct;
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  // QUIZZES
  const getQuizPayload = (activityId: string, isTeacher: boolean) => {
    const questions = quizQuestions.filter((q) => q.activity_id === activityId);
    if (isTeacher) {
      return questions;
    }
    // As per blueprint & 0001_init.sql RPC get_quiz_payload: HIDE correct_keys and explanation from students!
    return questions.map(({ correct_keys, explanation, ...rest }) => rest as QuizQuestion);
  };

  const addQuizQuestion = (question: Omit<QuizQuestion, 'id'>) => {
    const newQ: QuizQuestion = {
      ...question,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setQuizQuestions((prev) => [...prev, newQ]);
    return newQ;
  };

  const submitQuiz = (
    activityId: string,
    studentId: string,
    studentName: string,
    answers: Record<string, string | string[]>,
    timeTakenSeconds: number
  ) => {
    const questions = quizQuestions.filter((q) => q.activity_id === activityId);
    let totalScore = 0;
    let maxPoints = 0;

    const results = questions.map((q) => {
      maxPoints += q.points || 10;
      const studentAns = answers[q.id];
      let isCorrect = false;

      if (q.question_type === 'multiple') {
        const studentArr = Array.isArray(studentAns) ? studentAns : [studentAns];
        isCorrect =
          studentArr.length === (q.correct_keys?.length || 0) &&
          studentArr.every((k) => q.correct_keys?.includes(k));
      } else {
        isCorrect = studentAns === (q.correct_keys?.[0] || 'A');
      }

      const pointsEarned = isCorrect ? q.points || 10 : 0;
      totalScore += pointsEarned;

      return {
        question_id: q.id,
        correct: isCorrect,
        selected: studentAns,
        points_earned: pointsEarned,
        max_points: q.points || 10,
        explanation: q.explanation,
      };
    });

    const previousAttempts = quizSubmissions.filter((s) => s.activity_id === activityId && s.student_id === studentId);
    const attemptNo = previousAttempts.length + 1;

    const newSub: QuizSubmission = {
      id: `sub-quiz-${Date.now()}`,
      activity_id: activityId,
      student_id: studentId,
      student_name: studentName,
      attempt_no: attemptNo,
      score: totalScore,
      max_points: maxPoints,
      answers_payload: answers,
      results_payload: results,
      time_taken_seconds: timeTakenSeconds,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    setQuizSubmissions((prev) => [newSub, ...prev]);

    // Mark completed
    markActivityCompleted(studentId, activityId);

    return {
      submissionId: newSub.id,
      score: totalScore,
      maxPoints,
      results,
    };
  };

  // GROUPS & ASSIGNMENTS
  const getGroupsForActivity = (activityId: string) => studyGroups.filter((g) => g.activity_id === activityId);

  const getStudentGroupForActivity = (activityId: string, studentId: string) => {
    return studyGroups.find(
      (g) => g.activity_id === activityId && g.members.some((m) => m.student_id === studentId)
    );
  };

  const submitAssignment = (data: {
    activityId: string;
    studentId: string;
    studentName: string;
    link: string;
    text?: string;
  }) => {
    const act = getActivity(data.activityId);
    if (!act) return { success: false, error: 'Aktivitas tidak ditemukan' };

    let groupId: string | undefined;
    let groupName: string | undefined;

    if (act.assignment_mode === 'group') {
      const group = getStudentGroupForActivity(data.activityId, data.studentId);
      if (!group) {
        return {
          success: false,
          error: 'Kamu belum terdaftar di kelompok manapun untuk tugas ini. Hubungi gurumu.',
        };
      }

      // Security check: Only leader can submit (as specified in blueprint!)
      if (group.leader_id !== data.studentId) {
        return {
          success: false,
          error: `Hanya ketua kelompok (${group.leader_name || 'Ketua'}) yang memiliki hak akses untuk mengumpulkan link tugas kelompok!`,
        };
      }

      groupId = group.id;
      groupName = group.group_name;
    }

    const newSub: AssignmentSubmission = {
      id: `sub-ass-${Date.now()}`,
      activity_id: data.activityId,
      student_id: act.assignment_mode === 'individual' ? data.studentId : undefined,
      student_name: act.assignment_mode === 'individual' ? data.studentName : undefined,
      group_id: groupId,
      group_name: groupName,
      submission_link: data.link,
      submission_text: data.text,
      submitted_at: new Date().toISOString(),
    };

    setAssignmentSubmissions((prev) => {
      // Upsert: replace if already submitted for this student or group
      const filtered = prev.filter((s) => {
        if (s.activity_id !== data.activityId) return true;
        if (groupId && s.group_id === groupId) return false;
        if (!groupId && s.student_id === data.studentId) return false;
        return true;
      });
      return [newSub, ...filtered];
    });

    // Mark completion
    if (groupId) {
      const group = studyGroups.find((g) => g.id === groupId);
      group?.members.forEach((m) => markActivityCompleted(m.student_id, data.activityId));
    } else {
      markActivityCompleted(data.studentId, data.activityId);
    }

    return { success: true };
  };

  const gradeAssignment = (submissionId: string, grade: number, feedback: string) => {
    setAssignmentSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, grade, feedback } : s))
    );
  };

  // REFLECTIONS
  const getReflectionsForActivity = (activityId: string) =>
    reflections.filter((r) => r.activity_id === activityId);

  const submitReflection = (
    activityId: string,
    studentId: string,
    studentName: string,
    text: string,
    mood: 'paham' | 'tertantang' | 'bantuan' | 'bingung'
  ) => {
    const newRef: Reflection = {
      id: `ref-${Date.now()}`,
      activity_id: activityId,
      student_id: studentId,
      student_name: studentName,
      reflection_text: text,
      mood_tracker: mood,
      created_at: new Date().toISOString(),
    };

    setReflections((prev) => {
      const filtered = prev.filter((r) => !(r.activity_id === activityId && r.student_id === studentId));
      return [newRef, ...filtered];
    });

    markActivityCompleted(studentId, activityId);
  };

  // COMPLETIONS & PROGRESS
  const isActivityCompleted = (studentId: string, activityId: string) =>
    completions.some((c) => c.student_id === studentId && c.activity_id === activityId);

  const markActivityCompleted = (studentId: string, activityId: string) => {
    setCompletions((prev) => {
      if (prev.some((c) => c.student_id === studentId && c.activity_id === activityId)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `cmp-${Date.now()}`,
          student_id: studentId,
          activity_id: activityId,
          completed_at: new Date().toISOString(),
        },
      ];
    });
  };

  const isModuleUnlocked = (studentId: string, moduleId: string) => {
    const targetModule = modules.find((m) => m.id === moduleId);
    if (!targetModule || !targetModule.prerequisites || targetModule.prerequisites.length === 0) {
      return true;
    }

    // Check all activities in prerequisite modules are completed
    return targetModule.prerequisites.every((prereqModId) => {
      const prereqActivities = activities.filter((a) => a.module_id === prereqModId && a.is_published);
      if (prereqActivities.length === 0) return true;
      return prereqActivities.every((act) => isActivityCompleted(studentId, act.id));
    });
  };

  const getCourseProgress = (studentId: string, courseId: string) => {
    const courseModuleIds = modules.filter((m) => m.course_id === courseId).map((m) => m.id);
    const courseActivities = activities.filter((a) => courseModuleIds.includes(a.module_id) && a.is_published);
    const total = courseActivities.length;
    if (total === 0) return { total: 0, completed: 0, percent: 0 };

    const completed = courseActivities.filter((a) => isActivityCompleted(studentId, a.id)).length;
    const percent = Math.round((completed / total) * 100);

    return { total, completed, percent };
  };

  // AI CO-PILOT GENERATORS (Simulated or Edge Function backed)
  const generateMaterialAI = async (topic: string, grade: string, promptNotes?: string) => {
    // Artificial latency for realism
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const markdown = `# Pembelajaran Mendalam: ${topic} (${grade})

## 1. Pengantar & Tujuan Pembelajaran
Selamat datang di modul pembelajaran mendalam tentang **${topic}**. Pada topik ini, kamu akan diajak tidak hanya menghafal konsep, tetapi juga memahami bagaimana konsep ini bekerja di dunia nyata dan mengasah nalar logismu.

${promptNotes ? `> **Catatan Guru:** *${promptNotes}*\n` : ''}
---

## 2. Konsep Inti (*Core Concept*)
Konsep **${topic}** memiliki beberapa pilar utama yang saling terhubung:
1. **Definisi Formal:** Menjelaskan makna mendasar dan terminologi yang digunakan dalam bidang ini.
2. **Karakteristik Utama:** Mengidentifikasi ciri-ciri pembeda yang mempermudah klasifikasi.
3. **Penerapan Sistematis:** Cara menerapkan langkah-langkah terstruktur dalam skenario penyelesaian masalah.

---

## 3. Studi Kasus Nyata (*Real-World Case*)
Bayangkan kamu sedang menghadapi situasi di mana kamu harus mengambil keputusan cepat dengan data yang terbatas. 
- **Tantangan:** Bagaimana ${topic} dapat memandu proses penarikan kesimpulan tanpa bias?
- **Analisis:** Mengurai variabel penting dan mengabaikan distraksi data yang tidak relevan.

---

## 4. Rangkuman & Poin Penting
- Pemahaman mendalam tercipta saat kita dapat menghubungkan teori dengan observasi langsung.
- Gunakan pendekatan bertahap dalam mengkaji setiap sub-topik.`;

    return {
      title: `Materi ${topic} - Pembelajaran Mendalam`,
      markdown,
      summary: `Materi terstruktur mengenai ${topic} untuk jenjang ${grade}, dilengkapi pengantar, studi kasus, dan poin refleksi.`,
    };
  };

  const generateQuizAI = async (
    moduleTitle: string,
    count: number = 3,
    bloom: string = 'understand',
    difficulty: string = 'medium'
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const sampleQuestions: Array<Omit<QuizQuestion, 'id' | 'activity_id'>> = [
      {
        question_type: 'single',
        question_text: `Berdasarkan materi pada ${moduleTitle}, apa esensi utama yang membedakan pemikiran mendalam (deep learning) dengan hafalan biasa?`,
        options: [
          { key: 'A', text: 'Kemampuan menghubungkan konsep dengan pemecahan masalah di dunia nyata' },
          { key: 'B', text: 'Kecepatan menghafal definisi kata per kata dari buku teks' },
          { key: 'C', text: 'Banyaknya catatan tulisan tangan yang disalin ke buku' },
          { key: 'D', text: 'Waktu belajar yang dihabiskan tanpa henti' },
        ],
        correct_keys: ['A'],
        explanation: 'Deep learning berfokus pada transfer pemahaman dan penerapan konsep pada konteks baru.',
        points: 20,
        difficulty: difficulty as any,
        bloom_taxonomy: bloom,
        is_active: true,
      },
      {
        question_type: 'single',
        question_text: `Ketika kita mengisolasi variabel krusial dan mengesampingkan detail minor pada kasus ${moduleTitle}, metode ini paling selaras dengan prinsip:`,
        options: [
          { key: 'A', text: 'Abstraksi' },
          { key: 'B', text: 'Redundansi Data' },
          { key: 'C', text: 'Dekomposisi Berlebih' },
          { key: 'D', text: 'Trial and Error' },
        ],
        correct_keys: ['A'],
        explanation: 'Abstraksi menyaring aspek krusial dan mengabaikan hal-hal yang tidak relevan.',
        points: 20,
        difficulty: difficulty as any,
        bloom_taxonomy: bloom,
        is_active: true,
      },
      {
        question_type: 'single',
        question_text: `Seorang siswa mampu membuat kesimpulan baru berdasarkan perbandingan dua skenario berbeda dalam topik ini. Berada pada level Bloom Taxonomy manakah kemampuan tersebut?`,
        options: [
          { key: 'A', text: 'Menganalisis (Analyze)' },
          { key: 'B', text: 'Mengingat (Remember)' },
          { key: 'C', text: 'Menghafal (Recall)' },
          { key: 'D', text: 'Menjiplak (Duplicate)' },
        ],
        correct_keys: ['A'],
        explanation: 'Membandingkan dan menarik kesimpulan berdasarkan pola adalah indikator kemampuan analisis (C4).',
        points: 20,
        difficulty: 'medium',
        bloom_taxonomy: 'analyze',
        is_active: true,
      },
    ];

    return sampleQuestions.slice(0, count);
  };

  const generateAssignmentAI = async (topic: string, mode: 'individual' | 'group', indicator?: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1300));

    if (mode === 'group') {
      return {
        title: `Proyek Kolaboratif: Solusi Berbasis ${topic}`,
        markdown: `### Skenario Proyek Tim:
Dalam proyek ini, kelompokmu bertindak sebagai konsultan muda yang diminta memecahkan permasalahan nyata di lingkungan sekolah/masyarakat menggunakan prinsip **${topic}**.

#### Pembagian Peran dalam Tim:
- **Ketua Kelompok (Lead Investigator):** Mengkoordinasikan diskusi dan **satu-satunya yang mengunggah link pengumpulan**.
- **Analisis Masalah:** Mengumpulkan fakta dan mengidentifikasi akar permasalahan.
- **Perancang Solusi:** Menyusun diagram alur/konsep solusi terstruktur.
- **Penyusun Dokumen:** Menuliskan laporan ringkas dan menyiapkan media presentasi.

#### Kriteria Pengumpulan:
Unggah link dokumen (Google Docs / Canva / GitHub) yang telah disetel ke mode publik.`,
        rubric: [
          { criterion: 'Kedalaman Analisis Konsep', max_points: 40, description: 'Kesesuaian penerapan prinsip dengan masalah' },
          { criterion: 'Kreativitas Solusi', max_points: 30, description: 'Keunikan ide pemecahan' },
          { criterion: 'Kolaborasi & Kerapian', max_points: 30, description: 'Keterlibatan anggota dan format presentasi' },
        ],
      };
    }

    return {
      title: `Tugas Analisis Mandiri: Penerapan ${topic}`,
      markdown: `### Panduan Pengerjaan Tugas:
1. Pilihlah satu studi kasus yang kamu temui sehari-hari berkaitan dengan **${topic}**.
2. Tuliskan 3 langkah konkret pemecahan masalah dengan runtut dan logis.
3. Tempelkan link file dokumen atau ketik jawaban langsung pada kolom yang disediakan.`,
      rubric: [
        { criterion: 'Kejelasan Argumen', max_points: 50, description: 'Logika berpikir runut dan mudah dipahami' },
        { criterion: 'Kesesuaian Contoh', max_points: 50, description: 'Contoh relevan dengan materi' },
      ],
    };
  };

  const generateReflectionAI = async (topic: string, focus: string) => {
    await new Promise((resolve) => setTimeout(resolve, 900));

    return {
      prompts: [
        `Setelah mempelajari ${topic}, apa konsep paling mengejutkan atau membuka wawasan barumu?`,
        `Jika kamu harus menjelaskan ${topic} kepada temanmu dengan kata-katamu sendiri dalam 2 kalimat, apa yang akan kamu katakan?`,
        `Bagian mana dari topik ini yang masih terasa menantang atau membingungkan bagimu?`,
      ],
      suggestedMoods: ['paham', 'tertantang', 'bantuan', 'bingung'],
    };
  };

  const generateGradingAI = async (studentAnswer: string, rubricCriteria?: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const wordCount = studentAnswer.trim().split(/\s+/).length;
    let suggested = 85;
    if (wordCount > 60) suggested = 92;
    if (wordCount < 20) suggested = 75;

    return {
      suggestedGrade: suggested,
      feedback: `Siswa menunjukkan penalaran yang runut dan mampu mengaitkan teori dengan contoh kasus secara logis. Struktur kalimat jelas dan tujuan solusi tercapai dengan baik.`,
      strengths: [
        'Argumentasi logis dan runut',
        'Contoh kasus relevan dengan materi yang diajarkan',
        'Penggunaan terminologi yang tepat',
      ],
      improvements: [
        'Dapat diperdalam lagi pada analisis risiko atau skenario alternatif jika terjadi kendala.',
      ],
    };
  };

  // EXPORT GRADEBOOK
  const exportGradebookCSV = (courseId: string) => {
    const courseRosters = rosters.filter((r) => r.course_id === courseId);
    const courseModuleIds = modules.filter((m) => m.course_id === courseId).map((m) => m.id);
    const courseActivities = activities.filter((a) => courseModuleIds.includes(a.module_id) && a.is_published);

    const headers = ['No', 'NIS', 'Nama Siswa', 'Status Klaim'];
    courseActivities.forEach((a) => {
      headers.push(`[${a.type.toUpperCase()}] ${a.title}`);
    });
    headers.push('Rata-rata Nilai', 'Progress (%)');

    const rows = courseRosters.map((r, index) => {
      const studentId = r.claimed_by_student_id;
      const rowData = [
        String(index + 1),
        r.nis || '-',
        `"${r.full_name}"`,
        r.is_claimed ? 'Sudah Terdaftar' : 'Belum Klaim',
      ];

      let scoresSum = 0;
      let scoresCount = 0;

      courseActivities.forEach((a) => {
        if (!studentId) {
          rowData.push('-');
          return;
        }

        if (a.type === 'quiz') {
          const sub = quizSubmissions.find((s) => s.activity_id === a.id && s.student_id === studentId);
          if (sub) {
            rowData.push(String(sub.score));
            scoresSum += sub.score;
            scoresCount++;
          } else {
            rowData.push('0');
          }
        } else if (a.type === 'assignment') {
          const sub = assignmentSubmissions.find((s) => {
            if (s.activity_id !== a.id) return false;
            if (s.student_id === studentId) return true;
            // check group
            const group = studyGroups.find(
              (g) => g.id === s.group_id && g.members.some((m) => m.student_id === studentId)
            );
            return !!group;
          });
          if (sub && sub.grade !== undefined) {
            rowData.push(String(sub.grade));
            scoresSum += sub.grade;
            scoresCount++;
          } else if (sub) {
            rowData.push('Terkumpul (Belum Dinilai)');
          } else {
            rowData.push('Belum Kumpul');
          }
        } else if (a.type === 'reflection') {
          const ref = reflections.find((rf) => rf.activity_id === a.id && rf.student_id === studentId);
          rowData.push(ref ? `Terisi (${ref.mood_tracker})` : 'Belum Isi');
        } else {
          const completed = isActivityCompleted(studentId, a.id);
          rowData.push(completed ? 'Selesai' : 'Belum');
        }
      });

      const avg = scoresCount > 0 ? (scoresSum / scoresCount).toFixed(1) : '-';
      const progress = studentId ? getCourseProgress(studentId, courseId).percent + '%' : '0%';

      rowData.push(avg, progress);
      return rowData.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  return (
    <LMSContext.Provider
      value={{
        courses,
        createCourse,
        getCourse,
        getCourseByCode,
        rosters,
        getRostersForCourse,
        addRostersBulk,
        claimRoster,
        enrollments,
        getStudentEnrollments,
        joinCourseByCode,
        modules,
        activities,
        getModulesForCourse,
        getActivitiesForModule,
        getActivity,
        addModule,
        addActivity,
        updateActivity,
        quizQuestions,
        quizSubmissions,
        getQuizPayload,
        addQuizQuestion,
        submitQuiz,
        studyGroups,
        assignmentSubmissions,
        getGroupsForActivity,
        getStudentGroupForActivity,
        submitAssignment,
        gradeAssignment,
        reflections,
        getReflectionsForActivity,
        submitReflection,
        completions,
        isActivityCompleted,
        markActivityCompleted,
        isModuleUnlocked,
        getCourseProgress,
        generateMaterialAI,
        generateQuizAI,
        generateAssignmentAI,
        generateReflectionAI,
        generateGradingAI,
        exportGradebookCSV,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
}

export function useLMS() {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS must be used within an LMSProvider');
  }
  return context;
}
