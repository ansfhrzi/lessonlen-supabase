'use client';

import React, { useState } from 'react';
import { useLMS } from '@/context/lms-context';
import { AssignmentSubmission } from '@/lib/types';
import {
  Award,
  Download,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Search,
  MessageSquare,
  FileText,
  HelpCircle,
  Brain,
  Loader2,
  Smile,
  Meh,
  Frown,
  AlertCircle,
} from 'lucide-react';

interface GradebookViewProps {
  courseId: string;
}

export function GradebookView({ courseId }: GradebookViewProps) {
  const {
    getCourse,
    modules,
    activities,
    rosters,
    quizSubmissions,
    assignmentSubmissions,
    studyGroups,
    reflections,
    gradeAssignment,
    generateGradingAI,
    exportGradebookCSV,
    getCourseProgress,
    isActivityCompleted,
  } = useLMS();

  const course = getCourse(courseId);
  const courseRosters = rosters.filter((r) => r.course_id === courseId);
  const courseModules = modules.filter((m) => m.course_id === courseId);
  const courseModuleIds = courseModules.map((m) => m.id);
  const courseActivities = activities.filter((a) => courseModuleIds.includes(a.module_id) && a.is_published);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(85);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isAIGrading, setIsAIGrading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);

  const handleOpenGradingModal = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission);
    setGradeInput(submission.grade || 85);
    setFeedbackInput(submission.feedback || '');
    setAiAnalysis(null);
  };

  const handleRunAIGrade = async () => {
    if (!selectedSubmission) return;
    setIsAIGrading(true);
    try {
      const textToAnalyze = selectedSubmission.submission_text || selectedSubmission.submission_link;
      const res = await generateGradingAI(textToAnalyze);
      setAiAnalysis(res);
      setGradeInput(res.suggestedGrade);
      setFeedbackInput(res.feedback);
    } catch (e: any) {
      alert('Gagal menjalankan AI Grading: ' + e.message);
    } finally {
      setIsAIGrading(false);
    }
  };

  const handleSaveGrade = () => {
    if (!selectedSubmission) return;
    gradeAssignment(selectedSubmission.id, gradeInput, feedbackInput);
    setSelectedSubmission(null);
  };

  const handleExportCSV = () => {
    const csvContent = exportGradebookCSV(courseId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Nilai_${course?.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRosters = courseRosters.filter((r) =>
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.nis && r.nis.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Buku Rekap Nilai & AI Grading Assistant
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Matriks nilai kuis otomatis, pengumpulan tugas individu/kelompok, dan pemantauan refleksi formatif.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition shrink-0"
          >
            <Download className="w-4 h-4" />
            Unduh CSV
          </button>
        </div>
      </div>

      {/* Grade Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center sticky left-0 bg-slate-50 z-10">No</th>
                <th className="py-3 px-4 sticky left-12 bg-slate-50 z-10">Nama Siswa</th>
                {courseActivities.map((act) => (
                  <th key={act.id} className="py-3 px-4 min-w-[140px]">
                    <div className="flex items-center gap-1 text-[11px] normal-case text-slate-700 font-bold">
                      {act.type === 'quiz' && <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      {act.type === 'assignment' && <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                      {act.type === 'reflection' && <Brain className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                      {act.type === 'lesson' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      <span className="truncate max-w-[120px]" title={act.title}>
                        {act.title}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 text-center">Progress</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRosters.map((roster, index) => {
                const studentId = roster.claimed_by_student_id;
                const progress = studentId ? getCourseProgress(studentId, courseId) : null;

                return (
                  <tr key={roster.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-400 sticky left-0 bg-white z-10">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 sticky left-12 bg-white z-10 whitespace-nowrap">
                      <div>{roster.full_name}</div>
                      <div className="text-[10px] font-normal text-slate-400 font-mono">NIS: {roster.nis || '-'}</div>
                    </td>

                    {courseActivities.map((act) => {
                      if (!studentId) {
                        return (
                          <td key={act.id} className="py-3 px-4 text-slate-300 italic text-[11px]">
                            Belum klaim
                          </td>
                        );
                      }

                      if (act.type === 'quiz') {
                        const sub = quizSubmissions.find(
                          (s) => s.activity_id === act.id && s.student_id === studentId
                        );
                        return (
                          <td key={act.id} className="py-3 px-4">
                            {sub ? (
                              <span className="px-2 py-0.5 rounded font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
                                {sub.score} / {sub.max_points || 100}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Belum kuis</span>
                            )}
                          </td>
                        );
                      }

                      if (act.type === 'assignment') {
                        const sub = assignmentSubmissions.find((s) => {
                          if (s.activity_id !== act.id) return false;
                          if (s.student_id === studentId) return true;
                          const group = studyGroups.find(
                            (g) => g.id === s.group_id && g.members.some((m) => m.student_id === studentId)
                          );
                          return !!group;
                        });

                        return (
                          <td key={act.id} className="py-3 px-4">
                            {sub ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold font-mono ${
                                    sub.grade !== undefined
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {sub.grade !== undefined ? sub.grade : 'Terkumpul'}
                                </span>
                                <button
                                  onClick={() => handleOpenGradingModal(sub)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition"
                                  title="Nilai / Review Tugas"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Belum kumpul</span>
                            )}
                          </td>
                        );
                      }

                      if (act.type === 'reflection') {
                        const ref = reflections.find(
                          (rf) => rf.activity_id === act.id && rf.student_id === studentId
                        );
                        return (
                          <td key={act.id} className="py-3 px-4">
                            {ref ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                {ref.mood_tracker === 'paham' && '🤩 Paham'}
                                {ref.mood_tracker === 'tertantang' && '🤔 Tertantang'}
                                {ref.mood_tracker === 'bantuan' && '🆘 Bantuan'}
                                {ref.mood_tracker === 'bingung' && '😵 Bingung'}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Belum isi</span>
                            )}
                          </td>
                        );
                      }

                      // Lesson completion
                      const completed = isActivityCompleted(studentId, act.id);
                      return (
                        <td key={act.id} className="py-3 px-4">
                          {completed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-center font-semibold font-mono text-slate-800">
                      {progress ? (
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          <span>{progress.percent}%</span>
                        </div>
                      ) : (
                        '0%'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Penilaian Tugas: {selectedSubmission.group_name || selectedSubmission.student_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSubmission.group_name ? 'Tugas Mode Kelompok' : 'Tugas Mandiri Individu'}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Submission Content */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Tautan Dokumen / Karya:</span>
                <a
                  href={selectedSubmission.submission_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  Buka Link Eksternal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              {selectedSubmission.submission_text && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-bold text-slate-600 mb-1">Catatan / Jawaban Teks Siswa:</p>
                  <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    {selectedSubmission.submission_text}
                  </p>
                </div>
              )}
            </div>

            {/* AI Grading Assistant Trigger */}
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-xs text-indigo-900">AI Grading Assistant (Gemini)</span>
                </div>
                <button
                  type="button"
                  disabled={isAIGrading}
                  onClick={handleRunAIGrade}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isAIGrading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Analisis Jawaban dengan AI
                </button>
              </div>

              {aiAnalysis && (
                <div className="bg-white p-3.5 rounded-lg border border-indigo-200 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Rekomendasi Nilai AI:</span>
                    <span className="font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {aiAnalysis.suggestedGrade} / 100
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed italic">
                    "{aiAnalysis.feedback}"
                  </p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <strong className="text-slate-700">Kekuatan:</strong> {aiAnalysis.strengths?.join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Teacher Final Grade Form */}
            <div className="grid grid-cols-1 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai Akhir Guru (Skala 0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value))}
                  className="w-32 text-sm font-bold font-mono px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Umpan Balik Guru (*Feedback*)
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Tuliskan catatan apresiasi atau saran perbaikan untuk siswa..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveGrade}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
              >
                Simpan Nilai & Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
