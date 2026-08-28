'use client';

import React, { useState } from 'react';
import { useLMS } from '@/context/lms-context';
import {
  Sparkles,
  X,
  BookOpen,
  HelpCircle,
  FileCheck,
  Brain,
  CheckCircle2,
  Loader2,
  Copy,
  PlusCircle,
  Layers,
} from 'lucide-react';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  moduleId?: string;
  onApplyMaterial?: (data: { title: string; markdown: string }) => void;
  onApplyQuiz?: (questions: any[]) => void;
  onApplyAssignment?: (data: { title: string; markdown: string; mode: 'individual' | 'group' }) => void;
  onApplyReflection?: (data: { prompt: string }) => void;
}

type GeneratorTab = 'material' | 'quiz' | 'assignment' | 'reflection';

export function AIGeneratorModal({
  isOpen,
  onClose,
  courseId,
  moduleId,
  onApplyMaterial,
  onApplyQuiz,
  onApplyAssignment,
  onApplyReflection,
}: AIGeneratorModalProps) {
  const {
    getCourse,
    modules,
    generateMaterialAI,
    generateQuizAI,
    generateAssignmentAI,
    generateReflectionAI,
  } = useLMS();

  const course = getCourse(courseId);
  const courseModules = modules.filter((m) => m.course_id === courseId);

  const [activeTab, setActiveTab] = useState<GeneratorTab>('material');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Material Form State
  const [matTopic, setMatTopic] = useState('Berpikir Komputasional & Dekomposisi');
  const [matGrade, setMatGrade] = useState(course?.grade_level || 'Kelas 7');
  const [matNotes, setMatNotes] = useState('Tekankan contoh nyata yang dekat dengan kehidupan remaja');
  const [generatedMaterial, setGeneratedMaterial] = useState<{ title: string; markdown: string } | null>(null);

  // Quiz Form State
  const [quizModule, setQuizModule] = useState(courseModules[0]?.title || 'Bab 1: Empat Pilar Berpikir Komputasional');
  const [quizCount, setQuizCount] = useState(3);
  const [quizBloom, setQuizBloom] = useState('understand');
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [generatedQuiz, setGeneratedQuiz] = useState<any[] | null>(null);

  // Assignment Form State
  const [assignTopic, setAssignTopic] = useState('Perancangan Algoritma Solusi Sampah Pintar');
  const [assignMode, setAssignMode] = useState<'individual' | 'group'>('group');
  const [assignIndicator, setAssignIndicator] = useState('Siswa mampu menyusun diagram alir logis dan membagi peran kerja tim');
  const [generatedAssignment, setGeneratedAssignment] = useState<{ title: string; markdown: string; mode: 'individual' | 'group' } | null>(null);

  // Reflection Form State
  const [refTopic, setRefTopic] = useState('Penerapan 4 Pilar Berpikir Komputasional');
  const [refFocus, setRefFocus] = useState('Metakognisi & Kesulitan Konseptual');
  const [generatedReflection, setGeneratedReflection] = useState<{ prompts: string[] } | null>(null);

  if (!isOpen) return null;

  const handleGenerateMaterial = async () => {
    setIsGenerating(true);
    setSuccessMessage(null);
    try {
      const res = await generateMaterialAI(matTopic, matGrade, matNotes);
      setGeneratedMaterial({ title: res.title, markdown: res.markdown });
    } catch (e: any) {
      alert('Gagal menghasilkan materi: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setSuccessMessage(null);
    try {
      const res = await generateQuizAI(quizModule, quizCount, quizBloom, quizDifficulty);
      setGeneratedQuiz(res);
    } catch (e: any) {
      alert('Gagal menghasilkan kuis: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAssignment = async () => {
    setIsGenerating(true);
    setSuccessMessage(null);
    try {
      const res = await generateAssignmentAI(assignTopic, assignMode, assignIndicator);
      setGeneratedAssignment({ title: res.title, markdown: res.markdown, mode: assignMode });
    } catch (e: any) {
      alert('Gagal menghasilkan tugas: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReflection = async () => {
    setIsGenerating(true);
    setSuccessMessage(null);
    try {
      const res = await generateReflectionAI(refTopic, refFocus);
      setGeneratedReflection({ prompts: res.prompts });
    } catch (e: any) {
      alert('Gagal menghasilkan refleksi: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>AI Co-Pilot Content Builder (Gemini Powered)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-300/30">
                  Teacher-in-the-Loop
                </span>
              </h3>
              <p className="text-xs text-indigo-200">
                Buat draf materi, bank soal, rubrik tugas, atau jurnal refleksi otomatis lalu tinjau sebelum disimpan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab('material')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'material'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Generate Materi
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'quiz'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Generate Kuis (Context-Aware)
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'assignment'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Generate Tugas & Rubrik
          </button>
          <button
            onClick={() => setActiveTab('reflection')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'reflection'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Brain className="w-4 h-4" />
            Generate Refleksi Deep Learning
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: MATERI */}
          {activeTab === 'material' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Parameter Generator</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topik / Bab Materi</label>
                  <input
                    type="text"
                    value={matTopic}
                    onChange={(e) => setMatTopic(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Contoh: Logika Algoritma & Percabangan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenjang / Tingkat Kelas</label>
                  <input
                    type="text"
                    value={matGrade}
                    onChange={(e) => setMatGrade(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instruksi Khusus / Prompt Guru</label>
                  <textarea
                    rows={3}
                    value={matNotes}
                    onChange={(e) => setMatNotes(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Contoh: Tekankan studi kasus nyata, berikan analogi sederhana..."
                  />
                </div>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateMaterial}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  Generate Draf Materi dengan AI
                </button>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col h-[380px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Pratinjau Editor Guru</span>
                    <span className="text-[10px] text-slate-400">(Bisa diedit)</span>
                  </span>
                  {generatedMaterial && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onApplyMaterial) {
                          onApplyMaterial(generatedMaterial);
                          setSuccessMessage('Materi berhasil diterapkan ke form aktivitas!');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terapkan Materi
                    </button>
                  )}
                </div>

                {generatedMaterial ? (
                  <div className="flex-1 overflow-y-auto space-y-2">
                    <input
                      type="text"
                      value={generatedMaterial.title}
                      onChange={(e) =>
                        setGeneratedMaterial({ ...generatedMaterial, title: e.target.value })
                      }
                      className="w-full font-bold text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <textarea
                      value={generatedMaterial.markdown}
                      onChange={(e) =>
                        setGeneratedMaterial({ ...generatedMaterial, markdown: e.target.value })
                      }
                      className="w-full h-[260px] p-3 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                    <BookOpen className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Belum ada draf yang dihasilkan</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Isi parameter di sebelah kiri lalu klik tombol generate untuk melihat draf materi siap pakai.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: KUIS */}
          {activeTab === 'quiz' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Konfigurasi Kuis Otomatis</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sumber Materi Bab (Context Injection)
                  </label>
                  <select
                    value={quizModule}
                    onChange={(e) => setQuizModule(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {courseModules.map((m) => (
                      <option key={m.id} value={m.title}>
                        {m.title}
                      </option>
                    ))}
                    <option value="Seluruh Materi Kelas">Semua Bab Terpadu</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Soal</label>
                    <select
                      value={quizCount}
                      onChange={(e) => setQuizCount(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value={2}>2 Soal</option>
                      <option value={3}>3 Soal</option>
                      <option value={5}>5 Soal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Kesulitan</label>
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="easy">Mudah (Dasar)</option>
                      <option value="medium">Menengah</option>
                      <option value="hard">HOTS (Tinggi)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taksonomi Bloom
                  </label>
                  <select
                    value={quizBloom}
                    onChange={(e) => setQuizBloom(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="remember">C1 - Mengingat (Remember)</option>
                    <option value="understand">C2 - Memahami (Understand)</option>
                    <option value="apply">C3 - Menerapkan (Apply)</option>
                    <option value="analyze">C4 - Menganalisis (Analyze)</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateQuiz}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  Generate Soal Kuis Berbasis Konteks
                </button>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col h-[380px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold text-slate-700">Daftar Soal yang Dihasilkan</span>
                  {generatedQuiz && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onApplyQuiz) {
                          onApplyQuiz(generatedQuiz);
                          setSuccessMessage('Soal kuis berhasil ditambahkan ke bank soal!');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terapkan ke Kuis
                    </button>
                  )}
                </div>

                {generatedQuiz ? (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {generatedQuiz.map((q, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                        <p className="font-semibold text-slate-900">
                          {idx + 1}. {q.question_text}
                        </p>
                        <div className="grid grid-cols-1 gap-1 pl-2">
                          {q.options?.map((opt: any) => (
                            <div
                              key={opt.key}
                              className={`p-1.5 rounded text-[11px] border ${
                                q.correct_keys?.includes(opt.key)
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="font-bold mr-1.5">{opt.key}.</span> {opt.text}
                              {q.correct_keys?.includes(opt.key) && (
                                <span className="ml-1 text-[10px] text-emerald-600">(Kunci Benar)</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                            💡 <strong>Pembahasan:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                    <HelpCircle className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Belum ada bank soal</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Pilih bab sumber lalu klik tombol generate. AI menyusun soal dengan 1 kunci benar + 3 pengecoh logis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TUGAS */}
          {activeTab === 'assignment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Parameter Tugas</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode Tugas</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignMode('group')}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        assignMode === 'group'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>👥 Tugas Kelompok</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignMode('individual')}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        assignMode === 'individual'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>👤 Tugas Individu</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topik Penugasan</label>
                  <input
                    type="text"
                    value={assignTopic}
                    onChange={(e) => setAssignTopic(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Indikator Ketercapaian</label>
                  <textarea
                    rows={3}
                    value={assignIndicator}
                    onChange={(e) => setAssignIndicator(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateAssignment}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  Generate Instruksi & Rubrik Tugas
                </button>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col h-[380px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold text-slate-700">Draf Instruksi & Rubrik</span>
                  {generatedAssignment && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onApplyAssignment) {
                          onApplyAssignment(generatedAssignment);
                          setSuccessMessage('Tugas berhasil diterapkan!');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terapkan Tugas
                    </button>
                  )}
                </div>

                {generatedAssignment ? (
                  <div className="flex-1 overflow-y-auto space-y-2">
                    <input
                      type="text"
                      value={generatedAssignment.title}
                      onChange={(e) =>
                        setGeneratedAssignment({ ...generatedAssignment, title: e.target.value })
                      }
                      className="w-full font-bold text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <textarea
                      value={generatedAssignment.markdown}
                      onChange={(e) =>
                        setGeneratedAssignment({ ...generatedAssignment, markdown: e.target.value })
                      }
                      className="w-full h-[260px] p-3 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                    <FileCheck className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Belum ada draf tugas</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      AI menyusun instruksi kerja kelompok/individu lengkap dengan kriteria penilaian.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REFLEKSI */}
          {activeTab === 'reflection' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pemicu Refleksi Deep Learning</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topik Refleksi</label>
                  <input
                    type="text"
                    value={refTopic}
                    onChange={(e) => setRefTopic(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fokus Metakognisi</label>
                  <select
                    value={refFocus}
                    onChange={(e) => setRefFocus(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Metakognisi & Kesulitan Konseptual">Pemahaman & Kesulitan Teknis</option>
                    <option value="Koneksi Dunia Nyata">Keterkaitan dengan Kehidupan Sehari-hari</option>
                    <option value="Evaluasi Kolaborasi">Refleksi Kinerja Tim & Komunikasi</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateReflection}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  Generate Pertanyaan Refleksi
                </button>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col h-[380px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold text-slate-700">Pertanyaan Pemantik</span>
                  {generatedReflection && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onApplyReflection) {
                          onApplyReflection({ prompt: generatedReflection.prompts.join('\n\n') });
                          setSuccessMessage('Refleksi diterapkan ke aktivitas!');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terapkan Refleksi
                    </button>
                  )}
                </div>

                {generatedReflection ? (
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {generatedReflection.prompts.map((p, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800">
                        <span className="font-bold text-indigo-600 block mb-1">Pertanyaan {idx + 1}:</span>
                        {p}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                    <Brain className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Belum ada pertanyaan refleksi</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Pertanyaan pemantik membimbing siswa merenungkan proses berpikir mereka (metakognisi).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            🤖 Konten di-generate oleh AI. Guru tetap memiliki kendali penuh untuk meninjau dan mengedit.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-200 rounded-lg border border-slate-300 transition"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
