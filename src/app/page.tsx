'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Zap,
  Users,
  Brain,
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  const { quickLoginDemo } = useAuth();
  const router = useRouter();

  const handleDemo = (role: 'teacher' | 'student', studentId?: string) => {
    quickLoginDemo(role, studentId);
    if (role === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/student');
    }
  };

  return (
    <div className="space-y-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),theme(colors.slate.50))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Didukung AI Gemini & Arsitektur Supabase PostgreSQL</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Platform Pembelajaran Mendalam &{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Asisten Cerdas Guru
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Lessonlen dirancang khusus untuk mewujudkan *Deep Learning* di sekolah. Dilengkapi autentikasi hibrida 
            <strong> Preset Name</strong> untuk lab sekolah, bank kuis bebas bocor dengan kalkulasi 
            <strong> single RPC</strong>, dan generator konten AI dengan prinsip <strong>Teacher-in-the-Loop</strong>.
          </p>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/auth/teacher"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 transition group"
            >
              <span>Portal Guru Pengampu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>

            <Link
              href="/auth/student"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition"
            >
              <span>Portal Siswa (Klaim Nama / NIS)</span>
            </Link>
          </div>

          {/* Instant Demo Sandbox Box */}
          <div className="pt-6">
            <div className="max-w-xl mx-auto bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Coba Langsung Mode Demo (1-Klik Tanpa Login):
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => handleDemo('teacher')}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition flex items-center gap-1.5"
                >
                  <span>👨‍🏫 Demo Guru: Pak Fauzi</span>
                </button>
                <button
                  onClick={() => handleDemo('student', 'student-01')}
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition flex items-center gap-1.5"
                >
                  <span>🎓 Demo Siswa: Budi Santoso</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE DIFFERENTIATORS / FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Arsitektur yang Dibuat Khusus untuk Kebutuhan Nyata Sekolah
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Bukan sekadar LMS biasa — Lessonlen mengatasi hambatan teknis lab sekolah, skalabilitas kuis, dan beban kerja guru.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Autentikasi Preset Name</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Guru mengunggah daftar presensi kelas. Siswa cukup memasukkan kode kelas dan mengklaim nama resminya. 
              Bebas typo, anti-nama gaul, dan login lancar di komputer lab tanpa kendala 2FA ponsel.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">AI Co-Pilot (Teacher-in-the-Loop)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Buat materi terstruktur, kuis berbasis konteks bab (*Context Injection*), rubrik tugas, dan pemicu refleksi 
              dalam hitungan detik. Guru meninjau dan mengedit draf sebelum disimpan ke database.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Kuis Skalabilitas Tinggi (300+ User)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kunci jawaban disembunyikan di database (bebas inspect element). Jawaban disimpan aman di local storage 
              dan dikirimkan dalam *single payload RPC* untuk penilaian instan tanpa lag server.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Refleksi Deep Learning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Memancing metakognisi siswa melalui pertanyaan pemantik terbuka dan *Mood Tracker*. 
              Guru mendapatkan peta pemahaman kelas secara formatif sebelum lanjut ke bab berikutnya.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Tugas Kelompok Berperan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mendukung tugas individu dan kelompok. Aturan keamanan memastikan hanya ketua kelompok yang memiliki 
              hak akses mengunggah/mengubah tautan tugas, sedangkan anggota lain berstatus transparan.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Row Level Security (RLS)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Data terisolasi ketat di level kernel PostgreSQL Supabase. Siswa hanya dapat mengakses aktivitas kelas yang diikuti, 
              dan role guru terproteksi dengan validasi kode lisensi sekolah.
            </p>
          </div>
        </div>
      </section>

      {/* ROADMAP / ARCHITECTURE STATUS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">Arsitektur & Status</span>
              <h3 className="text-xl font-bold text-white mt-1">Status Proyek Lessonlen LMS</h3>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
              Tahap 1–5 Beroperasi
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="font-bold text-slate-200">1. Analisis & Blueprint</span>
              <p className="text-slate-400 text-[11px]">Selesai — Review & Rekomendasi</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="font-bold text-slate-200">2. Database & RLS (Tahap 3)</span>
              <p className="text-slate-400 text-[11px]">0001_init.sql — 15 tabel + RPC</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="font-bold text-slate-200">3. Backend Edge Functions (Tahap 4)</span>
              <p className="text-slate-400 text-[11px]">6 Deno functions + Gemini API</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="font-bold text-indigo-300">4. Teacher Workspace (Tahap 5)</span>
              <p className="text-slate-400 text-[11px]">Content Builder, Roster, Gradebook</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="font-bold text-emerald-300">5. Student Workspace (Tahap 5)</span>
              <p className="text-slate-400 text-[11px]">Preset claim, Anti-cheat quiz, Refleksi</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <span className="font-bold text-slate-200">6. Integrasi SDK Supabase</span>
              <p className="text-slate-400 text-[11px]">Live sync + Fallback Demo Mode</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
