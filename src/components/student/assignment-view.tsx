'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLMS } from '@/context/lms-context';
import { Activity, AssignmentSubmission } from '@/lib/types';
import {
  FileCheck,
  Users,
  UserCheck,
  ShieldAlert,
  ExternalLink,
  Send,
  CheckCircle2,
  Award,
  Sparkles,
} from 'lucide-react';

interface AssignmentViewProps {
  activity: Activity;
  onCompleted?: () => void;
}

export function AssignmentView({ activity, onCompleted }: AssignmentViewProps) {
  const { user } = useAuth();
  const {
    assignmentSubmissions,
    getStudentGroupForActivity,
    submitAssignment,
  } = useLMS();

  const isGroup = activity.assignment_mode === 'group';
  const group = user && isGroup ? getStudentGroupForActivity(activity.id, user.id) : null;
  const isLeader = group ? group.leader_id === user?.id : false;

  // Find existing submission
  const existingSubmission: AssignmentSubmission | undefined = assignmentSubmissions.find((s) => {
    if (s.activity_id !== activity.id) return false;
    if (isGroup && group && s.group_id === group.id) return true;
    if (!isGroup && s.student_id === user?.id) return true;
    return false;
  });

  const [linkInput, setLinkInput] = useState(existingSubmission?.submission_link || '');
  const [textInput, setTextInput] = useState(existingSubmission?.submission_text || '');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!linkInput.trim()) {
      setNotice({ type: 'error', text: 'Mohon masukkan tautan (URL) tugas yang valid.' });
      return;
    }

    const res = submitAssignment({
      activityId: activity.id,
      studentId: user.id,
      studentName: user.full_name,
      link: linkInput,
      text: textInput,
    });

    if (res.success) {
      setNotice({ type: 'success', text: 'Tugas berhasil dikumpulkan ke guru pengampu!' });
      if (onCompleted) onCompleted();
    } else {
      setNotice({ type: 'error', text: res.error || 'Gagal mengumpulkan tugas.' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Activity Header & Instructions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            {isGroup ? <Users className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              {isGroup ? 'Tugas Mode Kelompok' : 'Tugas Mandiri Individu'}
            </span>
            <h3 className="font-extrabold text-base text-slate-900">{activity.title}</h3>
          </div>
        </div>

        {activity.content_markdown && (
          <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed whitespace-pre-line font-sans">
            {activity.content_markdown}
          </div>
        )}
      </div>

      {/* Group Info Card (if group assignment) */}
      {isGroup && (
        <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Kelompok Kamu: {group ? group.group_name : 'Belum Terdaftar Kelompok'}
            </h4>
            {isLeader && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Kamu adalah Ketua
              </span>
            )}
          </div>

          {group ? (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-600">Anggota Kelompok:</p>
              <div className="flex flex-wrap gap-2">
                {group.members.map((m) => (
                  <span
                    key={m.student_id}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${
                      m.student_id === group.leader_id
                        ? 'bg-indigo-100 text-indigo-900 border-indigo-200 font-bold'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {m.full_name}
                    {m.student_id === group.leader_id && ' (Ketua)'}
                  </span>
                ))}
              </div>

              {!isLeader && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 mt-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Hanya ketua kelompok (<strong>{group.leader_name}</strong>) yang memiliki akses untuk
                    mengunggah atau memperbarui link tugas kelompok.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-rose-600">
              Kamu belum dialokasikan ke dalam kelompok oleh guru untuk tugas ini.
            </p>
          )}
        </div>
      )}

      {/* Submission Status & Feedback from Teacher */}
      {existingSubmission && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Status Pengumpulan: Terkumpul
            </span>
            <span className="text-[11px] text-slate-400">
              {new Date(existingSubmission.submitted_at).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Link Terkirim:</span>
              <a
                href={existingSubmission.submission_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
              >
                Buka Tautan <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {existingSubmission.grade !== undefined && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Nilai dari Guru
                  </span>
                  <span className="text-xl font-extrabold font-mono text-emerald-700">
                    {existingSubmission.grade} / 100
                  </span>
                </div>
                {existingSubmission.feedback && (
                  <p className="text-xs text-emerald-800 italic">
                    "{existingSubmission.feedback}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission Form (Only if Individual or User is Group Leader) */}
      {(!isGroup || isLeader) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900">
            {existingSubmission ? 'Perbarui Pengumpulan Tugas' : 'Form Pengumpulan Tugas'}
          </h4>

          {notice && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tautan Dokumen / Karya (Google Drive / GitHub / Canva / Notion)
              </label>
              <input
                type="url"
                required
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pastikan hak akses file sudah diatur ke 'Anyone with the link can view'.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Tambahan / Ringkasan Solusi
              </label>
              <textarea
                rows={3}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Jelaskan secara ringkas bagaimana kalian memecahkan tugas ini..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" />
                {existingSubmission ? 'Simpan Perubahan' : 'Kirim Tugas Sekarang'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
