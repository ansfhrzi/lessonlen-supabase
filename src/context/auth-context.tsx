'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, UserRole } from '@/lib/types';
import { studentProfiles, teacherProfile } from '@/lib/demo-data';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  loginAsTeacher: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerTeacher: (data: {
    fullName: string;
    email: string;
    password: string;
    whatsapp: string;
    schoolName: string;
    licenseCode: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginAsStudent: (nisOrUsername: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  quickLoginDemo: (role: UserRole, studentId?: string) => void;
  logout: () => void;
  updateUserProfile: (profile: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'lessonlen_auth_user';

function profileFromRow(row: Record<string, any>, fallbackId: string): Profile {
  return {
    id: row.id || fallbackId,
    full_name: row.full_name || 'Pengguna Lessonlen',
    role: row.role === 'teacher' ? 'teacher' : 'student',
    whatsapp_number: row.whatsapp_number || undefined,
    school_id: row.school_id || undefined,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
  };
}

function studentEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('@')) return normalized;
  // The migration models authentication through auth.users. For the lab-friendly
  // NIS form, use a deterministic internal email while keeping the real profile
  // name in public.profiles. No secret is stored in the browser.
  const slug = normalized.replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
  return `${slug || 'student'}@students.lessonlen.local`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const live = isSupabaseConfigured();
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveUser = (nextUser: Profile | null) => {
    setUser(nextUser);
    if (nextUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const loadProfile = async (authUser: { id: string; user_metadata?: Record<string, any>; email?: string | null }) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase belum dikonfigurasi.');

    const { data, error } = await client.from('profiles').select('*').eq('id', authUser.id).single();
    if (error) throw error;
    const profile = profileFromRow(data || {}, authUser.id);
    if (!profile.full_name || profile.full_name === 'Pengguna Lessonlen') {
      profile.full_name = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || profile.full_name;
    }

    if (profile.school_id) {
      const school = await client.from('schools').select('name').eq('id', profile.school_id).maybeSingle();
      if (!school.error && school.data) profile.school_name = school.data.name;
    }
    return profile;
  };

  useEffect(() => {
    if (!live) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setUser(JSON.parse(saved) as Profile);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        saveUser(teacherProfile);
      }
      setIsLoading(false);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setIsLoading(false);
      return;
    }
    let mounted = true;

    const syncSession = async (session: { user: { id: string; user_metadata?: Record<string, any>; email?: string | null } } | null) => {
      if (!session?.user) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }
      try {
        const profile = await loadProfile(session.user);
        if (mounted) saveUser(profile);
      } catch (error) {
        console.error('Gagal memuat profil Supabase:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    client.auth.getSession().then(({ data }) => syncSession(data.session as any));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      void syncSession(session as any);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [live]);

  const loginAsTeacher = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (!live) {
        if (email.toLowerCase().includes('guru') || email.toLowerCase().includes('fauzi') || pass.length >= 4) {
          saveUser(teacherProfile);
          return { success: true };
        }
        return { success: false, error: 'Kredensial tidak valid' };
      }

      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase belum dikonfigurasi.');
      const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      if (!data.user) throw new Error('Sesi login tidak ditemukan.');
      const profile = await loadProfile(data.user);
      if (profile.role !== 'teacher') {
        await client.auth.signOut();
        return { success: false, error: 'Akun ini bukan akun guru.' };
      }
      saveUser(profile);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Terjadi kesalahan saat masuk' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerTeacher = async (data: {
    fullName: string;
    email: string;
    password: string;
    whatsapp: string;
    schoolName: string;
    licenseCode: string;
  }) => {
    setIsLoading(true);
    try {
      if (!live) {
        if (data.licenseCode.trim().toUpperCase() !== 'SCHOOL-0001') {
          return { success: false, error: 'Kode Lisensi Sekolah tidak valid. Gunakan SCHOOL-0001.' };
        }
        saveUser({
          ...teacherProfile,
          full_name: data.fullName,
          whatsapp_number: data.whatsapp,
          school_name: data.schoolName,
        });
        return { success: true };
      }

      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase belum dikonfigurasi.');
      const signUp = await client.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.fullName, whatsapp_number: data.whatsapp } },
      });
      if (signUp.error) throw signUp.error;
      if (!signUp.data.user || !signUp.data.session) {
        return { success: false, error: 'Akun dibuat. Matikan email confirmation di Supabase atau konfirmasi email sebelum masuk.' };
      }

      const setup = await client.functions.invoke('setup-teacher', {
        body: { license_code: data.licenseCode },
      });
      if (setup.error) throw setup.error;
      const profile = await loadProfile(signUp.data.user);
      saveUser({ ...profile, school_name: data.schoolName });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mendaftar guru' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsStudent = async (nisOrUsername: string, pass: string) => {
    setIsLoading(true);
    try {
      if (!live) {
        const clean = nisOrUsername.trim();
        const found = studentProfiles.find(
          (student) => student.full_name.toLowerCase().includes(clean.toLowerCase()) || clean === '202401' || clean.toLowerCase() === 'budi'
        );
        saveUser(found || {
          id: `student-${Date.now()}`,
          full_name: clean || 'Siswa Pembelajar',
          role: 'student',
          school_name: 'SMP Labschool Cendekia',
          is_active: true,
          created_at: new Date().toISOString(),
        });
        return { success: true };
      }

      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase belum dikonfigurasi.');
      const email = studentEmail(nisOrUsername);
      let result = await client.auth.signInWithPassword({ email, password: pass });
      if (result.error) {
        const signUp = await client.auth.signUp({
          email,
          password: pass,
          options: { data: { full_name: nisOrUsername.trim() || 'Siswa Pembelajar' } },
        });
        if (signUp.error) throw result.error;
        if (!signUp.data.user || !signUp.data.session) {
          return { success: false, error: 'Akun siswa dibuat. Konfirmasi email terlebih dahulu atau nonaktifkan email confirmation di Supabase.' };
        }
        result = { data: { user: signUp.data.user, session: signUp.data.session }, error: null };
      }
      if (!result.data.user) throw new Error('Sesi siswa tidak ditemukan.');
      const profile = await loadProfile(result.data.user);
      if (profile.role !== 'student') return { success: false, error: 'Gunakan portal guru untuk akun teacher.' };
      saveUser(profile);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Terjadi kesalahan saat masuk' };
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginDemo = (role: UserRole, studentId?: string) => {
    if (live) return;
    if (role === 'teacher') saveUser(teacherProfile);
    else saveUser(studentProfiles.find((student) => student.id === studentId) || studentProfiles[0]);
  };

  const logout = () => {
    saveUser(null);
    if (live) void getSupabaseClient()?.auth.signOut();
  };

  const updateUserProfile = (updates: Partial<Profile>) => {
    if (!user) return;
    const next = { ...user, ...updates };
    saveUser(next);
    if (live) {
      const client = getSupabaseClient();
      if (client) {
        void client.from('profiles').update({
          full_name: next.full_name,
          whatsapp_number: next.whatsapp_number || null,
        }).eq('id', user.id).then(({ error }) => {
          if (error) console.error('Gagal memperbarui profil:', error.message);
        });
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      isAuthenticated: !!user,
      isLoading,
      isDemo: !live,
      loginAsTeacher,
      registerTeacher,
      loginAsStudent,
      quickLoginDemo,
      logout,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
