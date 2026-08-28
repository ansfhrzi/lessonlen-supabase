'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLMS } from '@/context/lms-context';
import { ActivityType } from '@/lib/types';
import { RosterManager } from '@/components/teacher/roster-manager';
import { GradebookView } from '@/components/teacher/gradebook-view';
import { ReflectionsTab } from '@/components/teacher/reflections-tab';
import { AIGeneratorModal } from '@/components/teacher/ai-generator-modal';
import {
  BookOpen,
  Users,
  Award,
  Brain,
  Sparkles,
  Plus,
  Copy,
  CheckCircle2,
  ChevronRight,
  Layers,
  HelpCircle,
  FileCheck,
  Lock,
  ArrowLeft,
  X,
  FileText,
} from 'lucide-react';

type Tab = 'content' | 'roster' | 'gradebook' | 'reflections';

export default function TeacherCoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const {
    getCourse,
    getModulesForCourse,
    getActivitiesForModule,
    addModule,
    addActivity,
    addQuizQuestion,
  } = useLMS();

  const course = getCourse(courseId);
  const modules = getModulesForCourse(courseId);

  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Add Module Modal
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [newModTitle, setNewModTitle] = useState('');
  const [newModDesc, setNewModDesc] = useState('');
  const [selectedPrereq, setSelectedPrereq] = useState<string>('');

  // Add Activity Modal
  const [showAddActModal, setShowAddActModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string>('');
  const [newActTitle, setNewActTitle] = useState('');
  const [newActType, setNewActType] = useState<ActivityType>('lesson');
  const [newActDesc, setNewActDesc] = useState('');
  const [newActContent, setNewActContent] = useState('');
  const [newActAssignMode, setNewActAssignMode] = useState<'individual' | 'group'>('individual');
  const [newActReflectionPrompt, setNewActReflectionPrompt] = useState('');

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <p className="text-sm font-semibold text-slate-600">Kelas tidak ditemukan.</p>
        <Link
          href="/teacher"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Workspace Guru
        </Link>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(course.class_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModTitle.trim()) return;

    addModule(
      courseId,
      newModTitle,
      newModDesc,
      selectedPrereq ? [selectedPrereq] : []
    );

    setNewModTitle('');
    setNewModDesc('');
    setSelectedPrereq('');
    setShowAddModuleModal(false);
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActTitle.trim() || !targetModuleId) return;

    addActivity({
      moduleId: targetModuleId,
      title: newActTitle,
      type: newActType,
      description: newActDesc,
      content_markdown: newActContent,
      assignment_mode: newActType === 'assignment' ? newActAssignMode : undefined,
      reflection_prompt: newActType === 'reflection' ? newActReflectionPrompt : undefined,
    });

    setNewActTitle('');
    setNewActDesc('');
    setNewActContent('');
    setNewActReflectionPrompt('');
    setShowAddActModal(false);
  };

  // Callback when AI applies material
  const handleApplyMaterialAI = (data: { title: string; markdown: string }) => {
    const firstMod = modules[0];
    if (firstMod) {
      addActivity({
        moduleId: firstMod.id,
        title: data.title,
        type: 'lesson',
        description: 'Materi terstruktur di-generate oleh AI Gemini dengan prinsip Deep Learning',
        content_markdown: data.markdown,
      });
    }
  };

  // Callback when AI applies quiz
  const handleApplyQuizAI = (questions: any[]) => {
    const firstMod = modules[0];
    if (firstMod) {
      const act = addActivity({
        moduleId: firstMod.id,
        title: `Kuis Evaluasi AI: ${questions.length} Soal Pemahaman`,
        type: 'quiz',
        description: 'Bank soal otomatis dari materi bab',
      });

      questions.forEach((q) => {
        addQuizQuestion({
          activity_id: act.id,
          question_type: q.question_type || 'single',
          question_text: q.question_text,
          options: q.options,
          correct_keys: q.correct_keys,
          explanation: q.explanation,
          points: q.points || 20,
          difficulty: q.difficulty || 'medium',
          bloom_taxonomy: q.bloom_taxonomy || 'understand',
          is_active: true,
        });
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/teacher" className="hover:text-slate-900 transition">
          Workspace Guru
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 truncate max-w-sm">{course.title}</span>
      </div>

      {/* Course Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              {course.subject} • {course.grade_level}
            </span>
            <span className="text-xs text-slate-400 font-medium">Tahun {course.year_term}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {course.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Class Code & AI Co-Pilot Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
          <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Kode Gabung Siswa</p>
              <p className="text-base font-extrabold font-mono text-indigo-600">{course.class_code}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition"
              title="Salin Kode Kelas"
            >
              {copiedCode ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={() => setShowAIModal(true)}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            AI Co-Pilot Content Builder
          </button>
        </div>
      </div>

      {/* Course Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'content'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Modul & Aktivitas
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'roster'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Presensi & Siswa (Preset Name)
        </button>

        <button
          onClick={() => setActiveTab('gradebook')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'gradebook'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Buku Rekap Nilai & AI Grading
        </button>

        <button
          onClick={() => setActiveTab('reflections')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'reflections'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-4 h-4" />
          Jurnal Refleksi Deep Learning
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Struktur Pembelajaran ({modules.length} Bab)
            </h2>
            <button
              onClick={() => setShowAddModuleModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              + Tambah Bab / Modul
            </button>
          </div>

          <div className="space-y-4">
            {modules.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-sm text-slate-700">Belum ada Bab / Modul</h4>
                <p className="text-xs text-slate-400">
                  Buat bab pembelajaran pertama menggunakan tombol di atas atau gunakan AI Co-Pilot.
                </p>
              </div>
            ) : (
              modules.map((mod, idx) => {
                const activities = getActivitiesForModule(mod.id);
                return (
                  <div
                    key={mod.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Module Header */}
                    <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            Urutan #{mod.order_index}
                          </span>
                          {mod.prerequisites && mod.prerequisites.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Berkelanjutan (*Prerequisite*)
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900 mt-1">{mod.title}</h3>
                        {mod.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setTargetModuleId(mod.id);
                          setShowAddActModal(true);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-sm flex items-center gap-1 transition shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                        + Tambah Aktivitas
                      </button>
                    </div>

                    {/* Activity List inside this Module */}
                    <div className="p-4 space-y-2">
                      {activities.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2 pl-2">
                          Belum ada aktivitas di bab ini.
                        </p>
                      ) : (
                        activities.map((act) => (
                          <div
                            key={act.id}
                            className="p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:bg-white transition flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 text-xs font-bold ${
                                  act.type === 'lesson'
                                    ? 'bg-emerald-600'
                                    : act.type === 'quiz'
                                    ? 'bg-amber-600'
                                    : act.type === 'assignment'
                                    ? 'bg-indigo-600'
                                    : 'bg-rose-600'
                                }`}
                              >
                                {act.type === 'lesson' && <BookOpen className="w-4 h-4" />}
                                {act.type === 'quiz' && <HelpCircle className="w-4 h-4" />}
                                {act.type === 'assignment' && <FileCheck className="w-4 h-4" />}
                                {act.type === 'reflection' && <Brain className="w-4 h-4" />}
                              </span>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold text-slate-400">
                                    {act.type === 'lesson' && 'Materi'}
                                    {act.type === 'quiz' && 'Kuis Evaluasi'}
                                    {act.type === 'assignment' &&
                                      (act.assignment_mode === 'group'
                                        ? 'Tugas Kelompok'
                                        : 'Tugas Individu')}
                                    {act.type === 'reflection' && 'Jurnal Refleksi'}
                                  </span>
                                  {act.due_at && (
                                    <span className="text-[10px] text-slate-400">
                                      Deadline: {new Date(act.due_at).toLocaleDateString('id-ID')}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-xs text-slate-900">{act.title}</h4>
                              </div>
                            </div>

                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Diterbitkan
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'roster' && <RosterManager courseId={courseId} />}

      {activeTab === 'gradebook' && <GradebookView courseId={courseId} />}

      {activeTab === 'reflections' && <ReflectionsTab courseId={courseId} />}

      {/* Modal: Tambah Bab / Modul */}
      {showAddModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Bab / Modul Baru</h3>
              <button
                onClick={() => setShowAddModuleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Bab</label>
                <input
                  type="text"
                  required
                  value={newModTitle}
                  onChange={(e) => setNewModTitle(e.target.value)}
                  placeholder="Contoh: Bab 3: Logika dan Etika AI"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={newModDesc}
                  onChange={(e) => setNewModDesc(e.target.value)}
                  placeholder="Fokus bahasan bab ini..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>

              {/* Prerequisite Option */}
              {modules.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prasyarat Pembelajaran (*Prerequisite*)
                  </label>
                  <select
                    value={selectedPrereq}
                    onChange={(e) => setSelectedPrereq(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">Tidak ada (Akses langsung dibuka)</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        Harus menyelesaikan: {m.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Bab ini akan terkunci bagi siswa sampai seluruh aktivitas pada bab prasyarat selesai.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Simpan Bab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Aktivitas */}
      {showAddActModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Aktivitas Pembelajaran</h3>
              <button
                onClick={() => setShowAddActModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Aktivitas</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'lesson', label: '📖 Materi (Lesson)' },
                    { type: 'quiz', label: '❓ Kuis Evaluasi' },
                    { type: 'assignment', label: '📋 Tugas Mandiri/Tim' },
                    { type: 'reflection', label: '💭 Refleksi Deep Learning' },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setNewActType(t.type as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        newActType === t.type
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Aktivitas</label>
                <input
                  type="text"
                  required
                  value={newActTitle}
                  onChange={(e) => setNewActTitle(e.target.value)}
                  placeholder="Contoh: Eksplorasi Algoritma Percabangan"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {newActType === 'assignment' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode Tugas</label>
                  <select
                    value={newActAssignMode}
                    onChange={(e) => setNewActAssignMode(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="individual">Tugas Individu (Setiap siswa mengumpulkan link)</option>
                    <option value="group">Tugas Kelompok (Hanya ketua yang mengumpulkan link)</option>
                  </select>
                </div>
              )}

              {newActType === 'reflection' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pertanyaan Pemantik Refleksi (*Prompting*)
                  </label>
                  <textarea
                    rows={3}
                    value={newActReflectionPrompt}
                    onChange={(e) => setNewActReflectionPrompt(e.target.value)}
                    placeholder="Tuliskan pertanyaan pemantik terbuka untuk memancing metakognisi..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Isi Konten / Petunjuk Kerja (Markdown)
                  </label>
                  <textarea
                    rows={4}
                    value={newActContent}
                    onChange={(e) => setNewActContent(e.target.value)}
                    placeholder="Tuliskan materi teks atau petunjuk pengerjaan di sini..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddActModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Terbitkan Aktivitas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Co-Pilot Modal */}
      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        courseId={courseId}
        onApplyMaterial={handleApplyMaterialAI}
        onApplyQuiz={handleApplyQuizAI}
      />
    </div>
  );
}
