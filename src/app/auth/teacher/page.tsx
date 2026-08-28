'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  Mail,
  Building,
  KeyRound,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function TeacherAuthPage() {
  const router = useRouter();
  const { loginAsTeacher, registerTeacher, quickLoginDemo } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('fauzi@cendekia.sch.id');
  const [password, setPassword] = useState('password123');

  // Register fields
  const [fullName, setFullName] = useState('Ahmad Fauzi, S.Pd., M.Kom.');
  const [whatsapp, setWhatsapp] = useState('081234567890');
  const [schoolName, setSchoolName] = useState('SMP Labschool Cendekia');
  const [licenseCode, setLicenseCode] = useState('SCHOOL-0001');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await loginAsTeacher(email, password);
    setIsLoading(false);
    if (res.success) {
      router.push('/teacher');
    } else {
      setErrorMsg(res.error || 'Gagal masuk');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await registerTeacher({
      fullName,
      email,
      whatsapp,
      schoolName,
      licenseCode,
    });
    setIsLoading(false);
    if (res.success) {
      router.push('/teacher');
    } else {
      setErrorMsg(res.error || 'Gagal mendaftar guru');
    }
  };

  const fillDemo = () => {
    quickLoginDemo('teacher');
    router.push('/teacher');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <GraduationCap className="w-6 h-6 text-amber-300" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Portal Guru Pengampu</h2>
          <p className="text-xs text-indigo-200">
            Kelola kelas, materi pembelajaran mendalam, bank kuis otomatis, dan buku nilai.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              mode === 'login'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk Guru
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              mode === 'register'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Pendaftaran Guru Baru
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun Guru
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="nama.guru@sekolah.sch.id"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Masuk ke Workspace Guru
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmad Fauzi, S.Pd., M.Kom."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instansi / Sekolah</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* License Code protection per blueprint */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <label className="block text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Kode Lisensi Sekolah (Proteksi Role Guru)
                </label>
                <input
                  type="text"
                  required
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value)}
                  placeholder="SCHOOL-0001"
                  className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-amber-300 bg-white"
                />
                <p className="text-[10px] text-amber-700">
                  Kode lisensi mencegah siswa mendaftar sebagai guru (Coba: <code>SCHOOL-0001</code>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-1"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Daftar & Verifikasi Akun Guru
              </button>
            </form>
          )}

          {/* Quick Fill Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={fillDemo}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Klik Masuk sebagai Guru (Pak Fauzi)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
