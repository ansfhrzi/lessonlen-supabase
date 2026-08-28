"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callEdgeFunction } from "@/lib/edge";
import { createActivity, saveQuizQuestions } from "@/lib/actions/teacher";
import { Alert, Badge, Button, Input, Label, Select, Spinner } from "@/components/ui";
import type { BloomTaxonomy, Difficulty, QuizDraft, QuizDraftQuestion } from "@/lib/types/database";

export function QuizGenerator({
  courseId,
  moduleId,
  moduleTitle,
  quizActivities,
}: {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  quizActivities: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [count, setCount] = useState(5);
  const [bloom, setBloom] = useState<BloomTaxonomy>("understand");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionType, setQuestionType] = useState<"single" | "multiple">("single");
  const [extra, setExtra] = useState("");
  const [target, setTarget] = useState<string>(quizActivities[0]?.id ?? "");

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [questions, setQuestions] = useState<QuizDraftQuestion[]>([]);

  async function generate() {
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await callEdgeFunction<QuizDraft>("generate-quiz", {
      course_id: courseId,
      module_id: moduleId,
      count,
      bloom_taxonomy: bloom,
      question_type: questionType,
      difficulty,
      extra_instructions: extra.trim() || undefined,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setQuestions(result.data.questions);
    if (result.usage) setUsage(result.usage);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, patch: Partial<QuizDraftQuestion>) {
    setQuestions((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function save() {
    if (!questions.length) return;
    setSaving(true);
    setError(null);

    let activityId = target;

    // Bila belum ada aktivitas kuis, buat dulu agar soal punya tempat.
    if (!activityId) {
      const created = await createActivity({
        module_id: moduleId,
        courseId,
        title: `Kuis — ${moduleTitle}`,
        type: "quiz",
        description: "Bank soal dibuat dengan bantuan AI dan ditinjau guru.",
      });
      if (!created.ok || !created.id) {
        setError(created.error ?? "Gagal membuat aktivitas kuis.");
        setSaving(false);
        return;
      }
      activityId = created.id;
    }

    const result = await saveQuizQuestions({
      activity_id: activityId,
      courseId,
      moduleId,
      questions,
      replace: false,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan soal.");
      return;
    }

    setNotice(result.message ?? "Soal tersimpan.");
    setQuestions([]);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="quiz-count">Jumlah soal</Label>
          <Input
            id="quiz-count"
            type="number"
            min={3}
            max={30}
            value={count}
            onChange={(event) => setCount(Math.max(3, Math.min(30, Number(event.target.value) || 3)))}
          />
        </div>
        <div>
          <Label htmlFor="quiz-bloom">Level kognitif (Bloom)</Label>
          <Select
            id="quiz-bloom"
            value={bloom}
            onChange={(event) => setBloom(event.target.value as BloomTaxonomy)}
          >
            <option value="remember">Remember — mengingat</option>
            <option value="understand">Understand — memahami</option>
            <option value="apply">Apply — menerapkan</option>
            <option value="analyze">Analyze — menganalisis</option>
            <option value="evaluate">Evaluate — mengevaluasi</option>
            <option value="create">Create — mencipta</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="quiz-difficulty">Tingkat kesulitan</Label>
          <Select
            id="quiz-difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          >
            <option value="easy">Mudah</option>
            <option value="medium">Sedang</option>
            <option value="hard">Sulit</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="quiz-type">Tipe soal</Label>
          <Select
            id="quiz-type"
            value={questionType}
            onChange={(event) => setQuestionType(event.target.value as "single" | "multiple")}
          >
            <option value="single">Pilihan tunggal</option>
            <option value="multiple">Pilihan ganda (lebih dari satu)</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="quiz-extra">Instruksi tambahan</Label>
          <Input
            id="quiz-extra"
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
            placeholder="Contoh: fokuskan pada interpretasi grafik"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Label htmlFor="quiz-target">Simpan ke aktivitas kuis</Label>
          <Select id="quiz-target" value={target} onChange={(event) => setTarget(event.target.value)}>
            <option value="">Buat aktivitas kuis baru</option>
            {quizActivities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.title}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-ink-500">
            Soal diambil dari konteks materi modul ini (Edge Function membaca isi modul terlebih
            dahulu), sehingga soal nyambung dengan yang sudah diajarkan.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ai" onClick={generate} disabled={busy}>
          {busy ? <Spinner /> : null}
          {busy ? "Menyusun soal…" : "✨ Buat draf soal"}
        </Button>
        {usage ? (
          <span className="text-xs text-ink-500">
            Kuota AI hari ini: {usage.used} / {usage.limit}
          </span>
        ) : null}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {questions.length ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink-800">
              {questions.length} draf soal — tinjau sebelum disimpan
            </p>
            <div className="flex gap-2">
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan ke bank soal"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setQuestions([])} disabled={saving}>
                Buang semua
              </Button>
            </div>
          </div>

          <ol className="space-y-3">
            {questions.map((question, index) => (
              <li key={index} className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <Input
                    value={question.question_text}
                    onChange={(event) => updateQuestion(index, { question_text: event.target.value })}
                    className="font-medium"
                  />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeQuestion(index)}>
                    Buang
                  </Button>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {question.options.map((option) => {
                    const isCorrect = question.correct_keys.includes(option.key);
                    return (
                      <li key={option.key} className="flex items-center gap-2 text-sm">
                        <Badge
                          className={
                            isCorrect
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-300"
                              : "bg-ink-50 text-ink-600 ring-ink-200"
                          }
                        >
                          {option.key}
                        </Badge>
                        <span className="flex-1 text-ink-700">{option.text}</span>
                        {isCorrect ? <span className="text-xs text-emerald-600">kunci</span> : null}
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-3 text-xs text-ink-500">
                  Pembahasan: {question.explanation} · {question.points} poin
                  {question.bloom_taxonomy ? ` · ${question.bloom_taxonomy}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
