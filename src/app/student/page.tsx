'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useLMS } from '@/context/lms-context';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Layers,
  Award,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const {
    courses,
    enrollments,
    getStudentEnrollments,
    joinCourseByCode,
    getCourseProgress,
    activities,
    isActivityCompleted,
  } = useLMS();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [joinNotice, setJoinNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const studentId = user?.id || 'student-01';
  const studentEnrollments = getStudentEnrollments(studentId);
  const enrolledCourseIds = studentEnrollments.map((e) => e.course_id);
  const enrolledCourses = courses.filter((c) => enrolledCourseIds.includes(c.id));

  // Only the offline demo uses a first-course fallback. In live mode an empty
  // enrollment list must stay empty and never render an undefined course card.
  const displayCourses = enrolledCourses.length > 0
    ? enrolledCourses
    : isSupabaseConfigured()
    ? []
    : courses[0]
    ? [courses[0]]
    : [];

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinNotice(null);
    const res = await Promise.resolve(joinCourseByCode(classCodeInput, studentId));
    if (res.success) {
      setJoinNotice({ type: 'success', text: `Berhasil bergabung ke kelas ${res.course?.title || 'baru'}!` });
      setClassCodeInput('');
      setTimeout(() => setShowJoinModal(false), 1500);
    } else {
      setJoinNotice({ type: 'error', text: res.error || 'Gagal bergabung' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold border border-white/10">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
            <span>Workspace Siswa Pembelajaran Mendalam</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Halo, {user?.full_name || 'Siswa Hebat'}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Selamat datang di ruang belajarmu. Di sini kamu bisa membaca materi konsep, berkolaborasi dalam tim, mengikuti kuis terjadwal, dan mencatat jurnal refleksi.
          </p>
        </div>

        <div className="relative z-10 pt-4">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-900 font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            + Gabung Kelas Baru
          </button>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Grid: Enrolled Courses & Quick Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Course Cards (2 Columns on large) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Kelas yang Diikuti</h2>
            <span className="text-xs text-slate-500">{displayCourses.length} Kelas Aktif</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {displayCourses.map((c) => {
              const progress = getCourseProgress(studentId, c.id);

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.subject}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Kode: {c.class_code}</span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Progres Belajar</span>
                        <span className="font-extrabold font-mono text-emerald-700">
                          {progress.percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {progress.completed} dari {progress.total} aktivitas diselesaikan
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Guru: {c.teacher_name}</span>
                    <Link
                      href={`/student/courses/${c.id}`}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition"
                    >
                      <span>Masuk Kelas</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Upcoming Tasks & Deadlines */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">Agenda & Tugas Terdekat</h2>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200/60 text-amber-900">
                    Kuis Evaluasi
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Batas: 15 Sep
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">Kuis Bab 1: Uji Pemahaman 4 Pilar CT</h4>
                <p className="text-[11px] text-slate-600">
                  5 soal evaluasi logika berpikir komputasional dengan timer pengerjaan.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-200/60 text-indigo-900">
                    Tugas Kelompok
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Batas: 20 Sep
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">
                  Desain Solusi Tempat Sampah Pintar
                </h4>
                <p className="text-[11px] text-slate-600">
                  Kerjakan bersama timmu. Pengumpulan link dilakukan oleh ketua kelompok.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Selesaikan materi secara runtut untuk membuka bab lanjutan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Join Course Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Gabung Kelas Baru
              </h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {joinNotice && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  joinNotice.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {joinNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{joinNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Masukkan Kode Kelas dari Gurumu
                </label>
                <input
                  type="text"
                  required
                  value={classCodeInput}
                  onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: INF701"
                  className="w-full text-center text-lg font-mono font-extrabold tracking-widest px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                >
                  Gabung Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
