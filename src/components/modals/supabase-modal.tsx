'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { isSupabaseConfigured, setCustomSupabaseConfig, clearCustomSupabaseConfig, getSupabaseConfig } from '@/lib/supabase/client';
import { Database, CheckCircle2, AlertCircle, X, ExternalLink, RefreshCw } from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseModal({ isOpen, onClose }: SupabaseModalProps) {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [status, setStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      setStatus('Mohon isi Supabase URL dan Anon Key');
      return;
    }
    setCustomSupabaseConfig(url, anonKey);
    setStatus('Koneksi Supabase berhasil disimpan! Memuat ulang halaman...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleReset = () => {
    clearCustomSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setStatus('Koneksi dikembalikan ke Mode Demo/Lokal.');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Konfigurasi Database Supabase</h3>
              <p className="text-xs text-slate-400">Hubungkan langsung ke proyek Supabase PostgreSQL kamu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-semibold">
                {isConfigured
                  ? 'Terhubung ke Supabase Live'
                  : 'Saat ini berjalan dalam Mode Demo Interaktif'}
              </p>
              <p className="text-slate-600">
                {isConfigured
                  ? 'Data autentikasi, materi, kuis, dan progres tersinkronisasi langsung ke database Supabase.'
                  : 'Semua fitur (AI generator, preset names, kuis massal, refleksi) dapat dicoba langsung tanpa setup database.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project URL Supabase
              </label>
              <input
                type="url"
                placeholder="https://xyzproject.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anon / Publishable API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>

            {status && (
              <p className="text-xs font-medium text-indigo-600 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                {status}
              </p>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition"
              >
                Reset ke Demo
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                >
                  Simpan & Hubungkan
                </button>
              </div>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <span>Catatan Migrasi Database</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pastikan kamu telah menjalankan migrasi SQL di{' '}
              <code className="text-slate-700 font-mono bg-slate-100 px-1 py-0.5 rounded">
                supabase/migrations/0001_init.sql
              </code>{' '}
              pada Supabase SQL Editor proyekmu agar semua tabel, helper function, dan RLS aktif.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
