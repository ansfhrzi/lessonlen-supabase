'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useLMS } from '@/context/lms-context';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  BookOpen,
  Users,
  Search,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Monitor,
} from 'lucide-react';

export default function StudentAuthPage() {
  const router = useRouter();
  const { user, loginAsStudent, quickLoginDemo, updateUserProfile } = useAuth();
  const { getCourseByCode, getRostersForCourse, claimRoster, joinCourseByCode } = useLMS();

  const [authTab, setAuthTab] = useState<'login' | 'claim'>('login');

  // Login form state
  const [nisInput, setNisInput] = useState('202401');
  const [passInput, setPassInput] = useState('siswa123');

  // Claim Preset Name form state
  const [step, setStep] = useState<1 | 2>(1);
  const [classCodeInput, setClassCodeInput] = useState('INF701');
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);
  const [studentWhatsapp, setStudentWhatsapp] = useState('');
  const [studentPin, setStudentPin] = useState('123456');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await loginAsStudent(nisInput, passInput);
    if (res.success) {
      router.push('/student');
    } else {
      setErrorMsg(res.error || 'Gagal masuk');
    }
  };

  const handleCheckCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // A student must be authenticated before the live join_course RPC can
    // expose the class and its roster under RLS.
    if (isSupabaseConfigured()) {
      if (!user || user.role !== 'student') {
        setErrorMsg('Masuk dengan akun siswa terlebih dahulu, lalu gunakan fitur klaim nama presensi.');
        return;
      }
      const result = await Promise.resolve(joinCourseByCode(classCodeInput, user.id));
      if (!result.success || !result.course) {
        setErrorMsg(result.error || 'Kode kelas tidak ditemukan.');
        return;
      }
      setSelectedCourse(result.course);
    } else {
      const course = getCourseByCode(classCodeInput);
      if (!course) {
        setErrorMsg('Kode kelas tidak ditemukan. Mohon periksa kode yang diberikan guru.');
        return;
      }
      setSelectedCourse(course);
    }
    setStep(2);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRosterId || !selectedCourse) {
      setErrorMsg('Pilih nama lengkapmu dari daftar presensi terlebih dahulu.');
      return;
    }

    const rosters = getRostersForCourse(selectedCourse.id);
    const targetRoster = rosters.find((r) => r.id === selectedRosterId);
    if (!targetRoster) return;

    const studentId = user?.role === 'student' ? user.id : `student-${Date.now()}`;
    const claimed = await Promise.resolve(
      claimRoster(selectedCourse.id, selectedRosterId, studentId, targetRoster.full_name)
    );
    if (!claimed) {
      setErrorMsg('Nama ini sudah diklaim atau sesi siswa tidak lagi aktif. Silakan coba lagi.');
      return;
    }

    updateUserProfile({
      id: studentId,
      full_name: targetRoster.full_name,
      role: 'student',
      whatsapp_number: studentWhatsapp,
      school_name: 'SMP Labschool Cendekia',
    });

    router.push('/student');
  };

  const courseRosters = selectedCourse ? getRostersForCourse(selectedCourse.id) : [];
  const unclaimedRosters = courseRosters.filter(
    (r) =>
      !r.is_claimed &&
      (r.full_name.toLowerCase().includes(rosterSearch.toLowerCase()) || (r.nis && r.nis.includes(rosterSearch)))
  );

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <BookOpen className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5" /> Ramah Komputer Lab
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Portal Belajar Siswa</h2>
          <p className="text-xs text-emerald-100">
            Masuk dengan cepat di komputer lab atau klaim namamu dari presensi guru tanpa kendala 2FA.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setAuthTab('login')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              authTab === 'login'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk (NIS / Akun Lab)
          </button>
          <button
            onClick={() => setAuthTab('claim')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              authTab === 'claim'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Klaim Nama Presensi Guru
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN MANUAL LAB */}
          {authTab === 'login' && (
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Induk Siswa (NIS) atau Nama
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={nisInput}
                    onChange={(e) => setNisInput(e.target.value)}
                    placeholder="Contoh: 202401 atau Budi"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN / Password Siswa
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                <span>Masuk ke Kelas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: PRESET NAME CLAIM FLOW */}
          {authTab === 'claim' && (
            <div>
              {step === 1 ? (
                <form onSubmit={handleCheckCode} className="space-y-4">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 leading-relaxed">
                    💡 <strong>Langkah 1:</strong> Masukkan kode kelas yang diberikan oleh gurumu untuk melihat
                    daftar nama presensi.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kode Kelas (Class Code)
                    </label>
                    <input
                      type="text"
                      required
                      value={classCodeInput}
                      onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: INF701"
                      className="w-full text-center text-lg font-mono font-extrabold tracking-widest px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <span>Cari Kelas & Daftar Nama</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleClaimSubmit} className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Kelas Ditemukan</p>
                      <p className="text-xs font-extrabold text-slate-900">{selectedCourse?.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      Ubah Kode
                    </button>
                  </div>

                  {/* Preset Name Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Pilih Namamu dari Daftar Presensi:
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Ketik namamu..."
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                      {unclaimedRosters.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          Tidak ada nama yang cocok atau semua nama sudah diklaim.
                        </p>
                      ) : (
                        unclaimedRosters.map((roster) => (
                          <button
                            key={roster.id}
                            type="button"
                            onClick={() => setSelectedRosterId(roster.id)}
                            className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                              selectedRosterId === roster.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white hover:bg-emerald-50 text-slate-800 border border-slate-200'
                            }`}
                          >
                            <span>{roster.full_name}</span>
                            <span className="text-[10px] opacity-80 font-mono">NIS: {roster.nis || '-'}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                      <input
                        type="tel"
                        value={studentWhatsapp}
                        onChange={(e) => setStudentWhatsapp(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Lab</label>
                      <input
                        type="password"
                        required
                        value={studentPin}
                        onChange={(e) => setStudentPin(e.target.value)}
                        placeholder="6 Digit PIN"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Klaim Nama & Masuk Kelas</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                quickLoginDemo('student', 'student-01');
                router.push('/student');
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Klik Masuk Demo Siswa: Budi Santoso (NIS 202401)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
