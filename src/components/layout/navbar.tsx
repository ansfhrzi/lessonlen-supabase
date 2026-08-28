'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { SupabaseModal } from '@/components/modals/supabase-modal';
import {
  GraduationCap,
  Sparkles,
  Database,
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export function Navbar() {
  const { user, role, logout, quickLoginDemo } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isConnected = isSupabaseConfigured();

  const handleRoleSwitch = (newRole: 'teacher' | 'student', studentId?: string) => {
    quickLoginDemo(newRole, studentId);
    setShowUserMenu(false);
    if (newRole === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/student');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg text-slate-900 tracking-tight">Lessonlen</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      LMS AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Deep Learning Platform</p>
                </div>
              </Link>

              {/* Navigation Links */}
              {user && (
                <nav className="hidden md:flex items-center gap-1">
                  {role === 'teacher' ? (
                    <>
                      <Link
                        href="/teacher"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                          pathname === '/teacher'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Ruang Guru (Workspace)
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/student"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                          pathname === '/student'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Kelas Saya (Student)
                      </Link>
                    </>
                  )}
                </nav>
              )}
            </div>

            {/* Right Side: Demo Quick Switcher, DB Status, Profile */}
            <div className="flex items-center gap-3">
              {/* Supabase Status Indicator */}
              <button
                onClick={() => setShowConfigModal(true)}
                className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
                title="Klik untuk konfigurasi database Supabase"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isConnected ? 'Supabase Live' : 'Mode Demo Aktif'}</span>
              </button>

              {/* Fast Role Switcher Pills for Testing */}
              <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 px-2 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> Beralih:
                </span>
                <button
                  onClick={() => handleRoleSwitch('teacher')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    role === 'teacher'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  Guru
                </button>
                <button
                  onClick={() => handleRoleSwitch('student', 'student-01')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    role === 'student'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  Siswa (Budi)
                </button>
              </div>

              {/* User Profile / Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                        role === 'teacher' ? 'bg-indigo-600' : 'bg-emerald-600'
                      }`}
                    >
                      {user.full_name.charAt(0)}
                    </div>
                    <div className="text-left hidden sm:block pr-1">
                      <p className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[120px]">
                        {user.full_name}
                      </p>
                      <span className="text-[10px] font-medium text-slate-500 capitalize">
                        {role === 'teacher' ? 'Guru Pengampu' : 'Siswa'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.school_name || 'SMP Labschool Cendekia'}</p>
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                          <ShieldCheck className="w-3 h-3" />
                          Role: {role === 'teacher' ? 'Guru (Teacher)' : 'Siswa (Student)'}
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowConfigModal(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition text-left"
                        >
                          <Database className="w-4 h-4 text-slate-400" />
                          Konfigurasi Supabase
                        </button>

                        <div className="py-1 border-t border-slate-100 text-[10px] font-semibold text-slate-400 px-3 uppercase tracking-wider">
                          Uji Akun Demo
                        </div>

                        <button
                          onClick={() => handleRoleSwitch('teacher')}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                        >
                          <span>Masuk sbg Pak Fauzi (Guru)</span>
                          {role === 'teacher' && <span className="text-[10px] font-bold text-indigo-600">Aktif</span>}
                        </button>

                        <button
                          onClick={() => handleRoleSwitch('student', 'student-01')}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                        >
                          <span>Masuk sbg Budi Santoso (Siswa)</span>
                          {role === 'student' && user.id === 'student-01' && (
                            <span className="text-[10px] font-bold text-emerald-600">Aktif</span>
                          )}
                        </button>

                        <button
                          onClick={() => handleRoleSwitch('student', 'student-02')}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                        >
                          <span>Masuk sbg Siti Nurhaliza</span>
                        </button>
                      </div>

                      <div className="p-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                            router.push('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Keluar Akun
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/student"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                  >
                    Masuk Siswa
                  </Link>
                  <Link
                    href="/auth/teacher"
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
                  >
                    Portal Guru
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <SupabaseModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </>
  );
}
