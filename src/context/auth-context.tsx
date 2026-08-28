'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '@/lib/types';
import { teacherProfile, studentProfiles } from '@/lib/mock-data';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session in localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    } else {
      // Default to teacher in demo for smooth instant preview
      setUser(teacherProfile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teacherProfile));
    }
    setIsLoading(false);
  }, []);

  const saveUser = (u: Profile | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const loginAsTeacher = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (error) throw error;
          if (data.user) {
            // fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const loggedIn: Profile = {
              id: data.user.id,
              full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Guru Pengampu',
              role: 'teacher',
              whatsapp_number: profile?.whatsapp_number || '',
              school_name: profile?.school_institution || 'Sekolah Penggerak',
            };
            saveUser(loggedIn);
            setIsLoading(false);
            return { success: true };
          }
        }
      }

      // Mock / fallback login
      if (email.toLowerCase().includes('guru') || email.toLowerCase().includes('fauzi') || pass.length >= 4) {
        saveUser(teacherProfile);
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Kredensial tidak valid' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Terjadi kesalahan saat masuk' };
    }
  };

  const registerTeacher = async (data: {
    fullName: string;
    email: string;
    whatsapp: string;
    schoolName: string;
    licenseCode: string;
  }) => {
    setIsLoading(true);
    try {
      // Validate license code (e.g. SCHOOL-0001 or any code with length >= 4)
      if (data.licenseCode.trim().toUpperCase() !== 'SCHOOL-0001') {
        setIsLoading(false);
        return {
          success: false,
          error: 'Kode Lisensi Sekolah tidak valid. Gunakan kode resmi (Coba: SCHOOL-0001)',
        };
      }

      const newTeacher: Profile = {
        id: `teacher-${Date.now()}`,
        full_name: data.fullName,
        role: 'teacher',
        whatsapp_number: data.whatsapp,
        school_name: data.schoolName,
        school_id: 'school-01',
        is_active: true,
        created_at: new Date().toISOString(),
      };

      saveUser(newTeacher);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Gagal mendaftar guru' };
    }
  };

  const loginAsStudent = async (nisOrUsername: string, pass: string) => {
    setIsLoading(true);
    const cleanNis = nisOrUsername.trim();

    // Match with student profiles
    const found = studentProfiles.find(
      (s) => s.full_name.toLowerCase().includes(cleanNis.toLowerCase()) || cleanNis === '202401' || cleanNis === 'budi'
    );

    if (found) {
      saveUser(found);
      setIsLoading(false);
      return { success: true };
    }

    // Generic student login fallback
    const studentUser: Profile = {
      id: `student-${Date.now()}`,
      full_name: cleanNis || 'Siswa Pembelajar',
      role: 'student',
      school_name: 'SMP Labschool Cendekia',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    saveUser(studentUser);
    setIsLoading(false);
    return { success: true };
  };

  const quickLoginDemo = (role: UserRole, studentId?: string) => {
    if (role === 'teacher') {
      saveUser(teacherProfile);
    } else {
      const selected = studentProfiles.find((s) => s.id === studentId) || studentProfiles[0];
      saveUser(selected);
    }
  };

  const logout = () => {
    saveUser(null);
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase?.auth.signOut();
    }
  };

  const updateUserProfile = (profile: Partial<Profile>) => {
    if (user) {
      const updated = { ...user, ...profile };
      saveUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        isDemo: !isSupabaseConfigured(),
        loginAsTeacher,
        registerTeacher,
        loginAsStudent,
        quickLoginDemo,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
