'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useLMS } from '@/context/lms-context';
import { Activity, ActivityType } from '@/lib/types';
import { QuizRunner } from '@/components/student/quiz-runner';
import { AssignmentView } from '@/components/student/assignment-view';
import { ReflectionView } from '@/components/student/reflection-view';
import {
  BookOpen,
  HelpCircle,
  FileCheck,
  Brain,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
  ArrowLeft,
  X,
  Award,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function StudentCourseViewPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user } = useAuth();
  const {
    getCourse,
    getModulesForCourse,
    getActivitiesForModule,
    isActivityCompleted,
    markActivityCompleted,
    isModuleUnlocked,
    getCourseProgress,
    quizSubmissions,
    assignmentSubmissions,
    reflections,
  } = useLMS();

  const course = getCourse(courseId);
  const modules = getModulesForCourse(courseId);
  const studentId = user?.id || 'student-01';

  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [courseTab, setCourseTab] = useState<'learning' | 'grades'>('learning');

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <p className="text-sm font-semibold text-slate-600">Kelas tidak ditemukan.</p>
        <Link
          href="/student"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Kelas Saya
        </Link>
      </div>
    );
  }

  const progress = getCourseProgress(studentId, courseId);

  const handleOpenActivity = (act: Activity, isLocked: boolean) => {
    if (isLocked) {
      alert('Bab ini masih terkunci. Selesaikan seluruh aktivitas pada bab prasyarat terlebih dahulu!');
      return;
    }
    setActiveActivity(act);
  };

  const handleLessonFinish = (actId: string) => {
    markActivityCompleted(studentId, actId);
    setActiveActivity(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/student" className="hover:text-slate-900 transition">
          Kelas Saya
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 truncate max-w-sm">{course.title}</span>
      </div>

      {/* Course Banner & Progress */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              {course.subject} • {course.grade_level}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {course.title}
            </h1>
            <p className="text-xs text-slate-500">Guru Pengampu: {course.teacher_name}</p>
          </div>

          {/* Progress Pill */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 w-full md:w-64 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Progres Belajarmu</span>
              <span className="font-mono font-extrabold text-emerald-700">{progress.percent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              {progress.completed} dari {progress.total} aktivitas diselesaikan
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-t border-slate-100 pt-3 gap-2">
          <button
            onClick={() => setCourseTab('learning')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              courseTab === 'learning'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Alur Pembelajaran
          </button>
          <button
            onClick={() => setCourseTab('grades')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              courseTab === 'grades'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Nilai & Jurnal Saya
          </button>
        </div>
      </div>

      {/* TAB 1: ALUR PEMBELAJARAN */}
      {courseTab === 'learning' && (
        <div className="space-y-6">
          {modules.map((mod) => {
            const isUnlocked = isModuleUnlocked(studentId, mod.id);
            const acts = getActivitiesForModule(mod.id);

            return (
              <div
                key={mod.id}
                className={`rounded-3xl border transition shadow-sm overflow-hidden ${
                  isUnlocked
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-200/80 opacity-90'
                }`}
              >
                {/* Module Header */}
                <div
                  className={`p-5 border-b flex items-center justify-between gap-4 ${
                    isUnlocked ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-100/70 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                        Bab {mod.order_index}
                      </span>
                      {!isUnlocked && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-700" /> Prasyarat Belum Terpenuhi
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">{mod.title}</h3>
                    {mod.description && (
                      <p className="text-xs text-slate-500">{mod.description}</p>
                    )}
                  </div>

                  {!isUnlocked && (
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-semibold shrink-0 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      <span className="hidden sm:inline">Terkunci</span>
                    </div>
                  )}
                </div>

                {/* Activity List */}
                <div className="p-4 space-y-2.5">
                  {!isUnlocked ? (
                    <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                      <Lock className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="font-bold text-slate-700">Bab ini dikunci sementara</p>
                      <p className="text-slate-400 text-[11px]">
                        Pendekatan *Deep Learning* mengharuskan kamu menuntaskan bab sebelumnya terlebih dahulu.
                      </p>
                    </div>
                  ) : (
                    acts.map((act) => {
                      const completed = isActivityCompleted(studentId, act.id);

                      return (
                        <button
                          key={act.id}
                          onClick={() => handleOpenActivity(act, !isUnlocked)}
                          className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition flex items-center justify-between gap-4 group"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 text-xs font-bold transition ${
                                completed
                                  ? 'bg-emerald-600'
                                  : act.type === 'lesson'
                                  ? 'bg-slate-400 group-hover:bg-emerald-600'
                                  : act.type === 'quiz'
                                  ? 'bg-amber-500'
                                  : act.type === 'assignment'
                                  ? 'bg-indigo-600'
                                  : 'bg-rose-600'
                              }`}
                            >
                              {act.type === 'lesson' && <BookOpen className="w-4 h-4" />}
                              {act.type === 'quiz' && <HelpCircle className="w-4 h-4" />}
                              {act.type === 'assignment' && <FileCheck className="w-4 h-4" />}
                              {act.type === 'reflection' && <Brain className="w-4 h-4" />}
                            </span>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                  {act.type === 'lesson' && 'Materi Bacaan'}
                                  {act.type === 'quiz' && 'Kuis Evaluasi'}
                                  {act.type === 'assignment' &&
                                    (act.assignment_mode === 'group'
                                      ? 'Tugas Kelompok'
                                      : 'Tugas Mandiri')}
                                  {act.type === 'reflection' && 'Refleksi Formatif'}
                                </span>
                                {act.due_at && (
                                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    Deadline: {new Date(act.due_at).toLocaleDateString('id-ID')}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition">
                                {act.title}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {completed ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Selesai
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                Kerjakan
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: NILAI & JURNAL SAYA */}
      {courseTab === 'grades' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Transkrip Nilai & Umpan Balik Guru
            </h3>

            {/* Quiz Submissions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hasil Kuis</h4>
              {quizSubmissions.filter((s) => s.student_id === studentId).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada kuis yang dikerjakan.</p>
              ) : (
                quizSubmissions
                  .filter((s) => s.student_id === studentId)
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">Kuis Evaluasi</p>
                        <p className="text-[11px] text-slate-500">
                          Diselesaikan pada {new Date(sub.submitted_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span className="font-mono font-extrabold text-lg text-amber-700 bg-white px-3 py-1 rounded-xl border border-amber-200">
                        {sub.score} / {sub.max_points || 100}
                      </span>
                    </div>
                  ))
              )}
            </div>

            {/* Assignment Submissions */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hasil Tugas</h4>
              {assignmentSubmissions.filter((s) => s.student_id === studentId || s.group_id).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada tugas yang dikumpulkan.</p>
              ) : (
                assignmentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">
                        {sub.group_name ? `Tugas: ${sub.group_name}` : 'Tugas Mandiri'}
                      </p>
                      <span className="font-mono font-extrabold text-base text-indigo-700 bg-white px-3 py-1 rounded-xl border border-indigo-200">
                        {sub.grade !== undefined ? `${sub.grade} / 100` : 'Sedang Dinilai'}
                      </span>
                    </div>
                    {sub.feedback && (
                      <p className="text-[11px] text-slate-700 bg-white p-3 rounded-xl border border-indigo-100 italic">
                        <strong>Catatan Guru:</strong> "{sub.feedback}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Reflection Journal */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Jurnal Refleksi Diri</h4>
              {reflections.filter((r) => r.student_id === studentId).map((ref) => (
                <div key={ref.id} className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Refleksi Metakognisi</span>
                    <span className="font-semibold text-rose-700 uppercase text-[10px] bg-white px-2 py-0.5 rounded border border-rose-200">
                      Status Mood: {ref.mood_tracker}
                    </span>
                  </div>
                  <p className="text-slate-700 italic">"{ref.reflection_text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY WORKSPACE MODAL / FULLVIEW */}
      {activeActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
                    activeActivity.type === 'lesson'
                      ? 'bg-emerald-600'
                      : activeActivity.type === 'quiz'
                      ? 'bg-amber-600'
                      : activeActivity.type === 'assignment'
                      ? 'bg-indigo-600'
                      : 'bg-rose-600'
                  }`}
                >
                  {activeActivity.type === 'lesson' && <BookOpen className="w-4 h-4" />}
                  {activeActivity.type === 'quiz' && <HelpCircle className="w-4 h-4" />}
                  {activeActivity.type === 'assignment' && <FileCheck className="w-4 h-4" />}
                  {activeActivity.type === 'reflection' && <Brain className="w-4 h-4" />}
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Workspace Pembelajaran
                  </span>
                  <h3 className="font-bold text-sm text-white truncate max-w-md">
                    {activeActivity.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveActivity(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body depending on Activity Type */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeActivity.type === 'lesson' && (
                <div className="space-y-6">
                  <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed font-sans bg-slate-50 p-6 rounded-2xl border border-slate-200 whitespace-pre-line text-xs sm:text-sm">
                    {activeActivity.content_markdown || 'Tidak ada konten materi tertulis.'}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Setelah selesai membaca dan memahami materi, tandai selesai untuk mencatat progresmu.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLessonFinish(activeActivity.id)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Tandai Materi Selesai
                    </button>
                  </div>
                </div>
              )}

              {activeActivity.type === 'quiz' && (
                <QuizRunner activity={activeActivity} onFinish={() => setActiveActivity(null)} />
              )}

              {activeActivity.type === 'assignment' && (
                <AssignmentView activity={activeActivity} onCompleted={() => setActiveActivity(null)} />
              )}

              {activeActivity.type === 'reflection' && (
                <ReflectionView activity={activeActivity} onCompleted={() => setActiveActivity(null)} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
