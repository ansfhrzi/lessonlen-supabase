'use client';

import React, { useState } from 'react';
import { useLMS } from '@/context/lms-context';
import {
  Brain,
  MessageSquare,
  Sparkles,
  Users,
  Smile,
  Meh,
  Frown,
  HelpCircle,
  Filter,
} from 'lucide-react';

interface ReflectionsTabProps {
  courseId: string;
}

export function ReflectionsTab({ courseId }: ReflectionsTabProps) {
  const { modules, activities, reflections } = useLMS();

  const courseModuleIds = modules.filter((m) => m.course_id === courseId).map((m) => m.id);
  const reflectionActivities = activities.filter(
    (a) => courseModuleIds.includes(a.module_id) && a.type === 'reflection'
  );

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    reflectionActivities[0]?.id || 'all'
  );

  const relevantReflections = reflections.filter((r) => {
    if (selectedActivityId === 'all') {
      return reflectionActivities.some((a) => a.id === r.activity_id);
    }
    return r.activity_id === selectedActivityId;
  });

  // Calculate mood stats
  const total = relevantReflections.length;
  const moodCounts = {
    paham: relevantReflections.filter((r) => r.mood_tracker === 'paham').length,
    tertantang: relevantReflections.filter((r) => r.mood_tracker === 'tertantang').length,
    bantuan: relevantReflections.filter((r) => r.mood_tracker === 'bantuan').length,
    bingung: relevantReflections.filter((r) => r.mood_tracker === 'bingung').length,
  };

  const getPercent = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-rose-600" />
            Jurnal Refleksi & Metakognisi Siswa (Deep Learning)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau emosi, kedalaman pemahaman, dan tantangan yang dirasakan siswa selama proses belajar.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 w-full sm:w-auto"
          >
            <option value="all">Semua Aktivitas Refleksi</option>
            {reflectionActivities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mood Tracker Aggregate Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🤩</span>
            <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {getPercent(moodCounts.paham)}%
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Paham Penuh</p>
            <p className="text-[11px] text-slate-500">{moodCounts.paham} respon siswa</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${getPercent(moodCounts.paham)}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🤔</span>
            <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {getPercent(moodCounts.tertantang)}%
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Tertantang</p>
            <p className="text-[11px] text-slate-500">{moodCounts.tertantang} respon siswa</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full" style={{ width: `${getPercent(moodCounts.tertantang)}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🆘</span>
            <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {getPercent(moodCounts.bantuan)}%
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Butuh Diskusi</p>
            <p className="text-[11px] text-slate-500">{moodCounts.bantuan} respon siswa</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full" style={{ width: `${getPercent(moodCounts.bantuan)}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl">😵</span>
            <span className="text-xs font-bold font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {getPercent(moodCounts.bingung)}%
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Masih Bingung</p>
            <p className="text-[11px] text-slate-500">{moodCounts.bingung} respon siswa</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full" style={{ width: `${getPercent(moodCounts.bingung)}%` }} />
          </div>
        </div>
      </div>

      {/* Student Reflection List */}
      <div className="space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
          Kutipan Jurnal Siswa ({relevantReflections.length} Terkumpul)
        </h4>

        {relevantReflections.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
            <Brain className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-xs text-slate-600">Belum ada respon refleksi dari siswa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantReflections.map((ref) => (
              <div
                key={ref.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{ref.student_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ref.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {ref.mood_tracker === 'paham' && '🤩 Paham Penuh'}
                      {ref.mood_tracker === 'tertantang' && '🤔 Tertantang'}
                      {ref.mood_tracker === 'bantuan' && '🆘 Butuh Diskusi'}
                      {ref.mood_tracker === 'bingung' && '😵 Bingung'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    "{ref.reflection_text}"
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Deep Learning Metacognition Log</span>
                  <span className="text-emerald-600 font-semibold">Tercatat</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
