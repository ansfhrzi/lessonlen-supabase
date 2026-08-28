import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { LMSProvider } from '@/context/lms-context';
import { Navbar } from '@/components/layout/navbar';

export const metadata: Metadata = {
  title: 'Lessonlen LMS — Platform Pembelajaran Mendalam & Asisten AI Guru',
  description:
    'LMS berbasis Supabase yang dirancang untuk mendukung pendekatan Deep Learning, autentikasi hibrida Preset Name, dan integrasi kecerdasan buatan Gemini.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        <AuthProvider>
          <LMSProvider>
            <Navbar />
            <main className="flex-1 pb-16">{children}</main>
            <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>
                  © 2026 <strong>Lessonlen LMS</strong>. Dikembangkan untuk Mendukung Pembelajaran Mendalam (*Deep Learning*).
                </p>
                <p className="text-[11px] text-slate-400">
                  Didukung oleh <strong>Supabase (PostgreSQL + RLS)</strong> & <strong>Google Gemini API</strong>.
                </p>
              </div>
            </footer>
          </LMSProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
