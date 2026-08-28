'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useLMS } from '@/context/lms-context';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Users,
  Copy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Award,
  ChevronRight,
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { courses, createCourse, rosters, modules } = useLMS();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Informatika');
  const [newGrade, setNewGrade] = useState('Kelas 7');
  const [newDesc, setNewDesc] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const teacherCourses = courses; // In demo, all mock courses are accessible

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createCourse({
      title: newTitle,
      subject: newSubject,
      grade_level: newGrade,
      description: newDesc,
    });

    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold border border-white/10">
            <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
            <span>Workspace Guru Pembelajaran Mendalam</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Mengajar, {user?.full_name || 'Bapak/Ibu Guru'}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Kelola bab kurikulum, susun materi interaktif, aktifkan asisten kuis Gemini AI, dan evaluasi respon metakognisi siswa di satu tempat.
          </p>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pt-4 flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-900 font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            + Buat Kelas Baru
          </button>
        </div>

        {/* Decorative background accent */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Kelas Aktif</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{teacherCourses.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Siswa Terdaftar</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{rosters.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Modul Pembelajaran</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{modules.length}</p>
          </div>
        </div>
      </div>

      {/* Course List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">Daftar Kelas Binaan</h2>
          <span className="text-xs text-slate-500">{teacherCourses.length} Kelas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teacherCourses.map((c) => {
            const courseRosters = rosters.filter((r) => r.course_id === c.id);
            const courseModules = modules.filter((m) => m.course_id === c.id);

            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {c.subject} • {c.grade_level}
                    </span>

                    {/* Class Code Pill */}
                    <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500">Kode:</span>
                      <span className="font-mono font-extrabold text-xs text-indigo-700">{c.class_code}</span>
                      <button
                        onClick={() => handleCopyCode(c.class_code)}
                        className="text-slate-400 hover:text-indigo-600 transition ml-0.5"
                        title="Salin Kode Kelas"
                      >
                        {copiedCode === c.class_code ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {c.description || 'Tidak ada deskripsi tambahan.'}
                    </p>
                  </div>

                  {/* Summary badges */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {courseModules.length} Bab
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {courseRosters.length} Siswa
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Tahun: {c.year_term}</span>
                  <Link
                    href={`/teacher/courses/${c.id}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:translate-x-0.5 transition"
                  >
                    <span>Buka Builder & Nilai</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Buat Kelas Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Buat Kelas Baru
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Mata Pelajaran & Kelas
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Informatika VII - Berpikir Komputasional"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenjang</label>
                  <input
                    type="text"
                    required
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Tuliskan ringkasan capaian pembelajaran kelas ini..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900">
                ℹ️ Sistem akan secara otomatis meng-generate <strong>Kode Kelas unik 6 digit</strong> yang bisa
                kamu bagikan kepada siswa.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                >
                  Simpan & Buat Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
