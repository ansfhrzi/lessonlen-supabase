'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLMS } from '@/context/lms-context';
import { Activity, Reflection } from '@/lib/types';
import confetti from 'canvas-confetti';
import {
  Brain,
  Send,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';

interface ReflectionViewProps {
  activity: Activity;
  onCompleted?: () => void;
}

export function ReflectionView({ activity, onCompleted }: ReflectionViewProps) {
  const { user } = useAuth();
  const { reflections, submitReflection } = useLMS();

  const existingRef: Reflection | undefined = user
    ? reflections.find((r) => r.activity_id === activity.id && r.student_id === user.id)
    : undefined;

  const [text, setText] = useState(existingRef?.reflection_text || '');
  const [mood, setMood] = useState<'paham' | 'tertantang' | 'bantuan' | 'bingung'>(
    existingRef?.mood_tracker || 'paham'
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;

    submitReflection(activity.id, user.id, user.full_name, text, mood);
    setSavedNotice(true);

    try {
      confetti({ particleCount: 50, spread: 50 });
    } catch (e) {}

    if (onCompleted) {
      setTimeout(() => onCompleted(), 1200);
    }
  };

  const moods = [
    { key: 'paham', label: 'Paham Penuh', emoji: '🤩', desc: 'Konsep jelas dan bisa saya terapkan' },
    { key: 'tertantang', label: 'Tertantang', emoji: '🤔', desc: 'Menarik, butuh sedikit eksplorasi lagi' },
    { key: 'bantuan', label: 'Butuh Diskusi', emoji: '🆘', desc: 'Ada bagian yang butuh bantuan teman/guru' },
    { key: 'bingung', label: 'Masih Bingung', emoji: '😵', desc: 'Perlu penjelasan ulang dari awal' },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Refleksi Pembelajaran Mendalam (Deep Learning)
            </span>
            <h3 className="font-extrabold text-base text-slate-900">{activity.title}</h3>
          </div>
        </div>

        {/* Prompt from Teacher */}
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-1.5">
          <p className="text-[11px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            Pertanyaan Pemantik:
          </p>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            {activity.reflection_prompt ||
              activity.description ||
              'Bagaimana konsep yang baru saja kamu pelajari membantumu dalam memahami persoalan di kehidupan nyata? Ceritakan satu hal paling menarik yang kamu pelajari!'}
          </p>
        </div>

        {savedNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Jurnal refleksi berhasil disimpan! Terima kasih atas keterbukaanmu.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Tracker Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Bagaimana perasaan & tingkat pemahamanmu saat ini?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {moods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMood(m.key as any)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    mood === m.key
                      ? 'border-rose-500 bg-rose-50/80 text-rose-950 ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs font-bold">{m.label}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Journal Text Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Refleksi & Metakognisi Pribadi
            </label>
            <textarea
              rows={5}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tuliskan dengan jujur apa yang kamu pikirkan dan rasakan. Jawaban ini hanya dibaca oleh guru pengampumu untuk membantumu berkembang..."
              className="w-full text-xs sm:text-sm p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-slate-400" />
              Ruang aman belajar & berbagi nalar
            </span>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              {existingRef ? 'Perbarui Refleksi' : 'Kirim Refleksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
