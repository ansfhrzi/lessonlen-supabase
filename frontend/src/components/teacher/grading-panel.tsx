"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callEdgeFunction } from "@/lib/edge";
import { gradeAssignment } from "@/lib/actions/teacher";
import { Alert, Badge, Button, Input, Label, Spinner, Textarea } from "@/components/ui";
import type { GradingDraft } from "@/lib/types/database";

export function GradingPanel({
  submissionId,
  activityId,
  courseId,
  studentName,
  submissionText,
  submissionLink,
  currentGrade,
  currentFeedback,
  currentAiFeedback,
  rubric,
  maxGrade,
}: {
  submissionId: string;
  activityId: string;
  courseId: string;
  studentName: string;
  submissionText: string | null;
  submissionLink: string | null;
  currentGrade: number | null;
  currentFeedback: string | null;
  currentAiFeedback: string | null;
  rubric: { criteria: string; description: string; max_score: number }[];
  maxGrade: number;
}) {
  const router = useRouter();
  const [grade, setGrade] = useState(currentGrade?.toString() ?? "");
  const [feedback, setFeedback] = useState(currentFeedback ?? "");
  const [aiFeedback, setAiFeedback] = useState(currentAiFeedback ?? "");
  const [aiDetail, setAiDetail] = useState<GradingDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canUseAi = Boolean(submissionText && submissionText.trim().length >= 20 && rubric.length > 0);

  async function askAi() {
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await callEdgeFunction<GradingDraft>("generate-grading", {
      student_text: submissionText,
      rubric,
      max_grade: maxGrade,
      course_id: courseId,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setAiDetail(result.data);
    setGrade(String(result.data.draft_grade));
    setAiFeedback(result.data.feedback);
  }

  async function save() {
    const numericGrade = Number(grade);
    if (!Number.isFinite(numericGrade) || numericGrade < 0) {
      setError("Nilai harus berupa angka 0 atau lebih.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const result = await gradeAssignment({
      submission_id: submissionId,
      activityId,
      courseId,
      grade: numericGrade,
      feedback,
      ai_feedback: aiFeedback,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan nilai.");
      return;
    }

    setNotice("Nilai tersimpan.");
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-lg border border-ink-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink-900">{studentName}</p>
          {submissionLink ? (
            <a
              href={submissionLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-600 hover:underline"
            >
              Buka tautan pengumpulan ↗
            </a>
          ) : null}
        </div>
        {currentGrade !== null ? (
          <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">
            Nilai saat ini: {currentGrade}
          </Badge>
        ) : (
          <Badge className="bg-amber-50 text-amber-700 ring-amber-200">Belum dinilai</Badge>
        )}
      </div>

      {submissionText ? (
        <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md bg-ink-50 px-3 py-2 text-sm text-ink-700">
          {submissionText}
        </div>
      ) : (
        <p className="text-sm text-ink-500">
          Siswa hanya mengirim tautan, tanpa teks jawaban — penilaian AI tidak tersedia untuk
          pengumpulan ini.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="w-32">
          <Label htmlFor={`grade-${submissionId}`}>Nilai</Label>
          <Input
            id={`grade-${submissionId}`}
            type="number"
            min={0}
            max={maxGrade}
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor={`feedback-${submissionId}`}>Umpan balik untuk siswa</Label>
          <Textarea
            id={`feedback-${submissionId}`}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            className="min-h-16"
          />
        </div>
      </div>

      {aiFeedback ? (
        <div>
          <Label htmlFor={`ai-${submissionId}`}>Draf umpan balik AI (bisa diedit)</Label>
          <Textarea
            id={`ai-${submissionId}`}
            value={aiFeedback}
            onChange={(event) => setAiFeedback(event.target.value)}
            className="min-h-20"
          />
        </div>
      ) : null}

      {aiDetail ? (
        <div className="rounded-md bg-violet-50 px-3 py-2 text-xs text-violet-800 ring-1 ring-inset ring-violet-200">
          <p className="font-semibold">Rincian per kriteria (draf AI — {aiDetail.draft_grade} poin)</p>
          <ul className="mt-1 space-y-1">
            {aiDetail.per_criteria_score.map((row, index) => (
              <li key={index}>
                {row.criteria}: {row.score}/{row.max_score} — {row.comment}
              </li>
            ))}
          </ul>
          {aiDetail.suggestions.length ? (
            <p className="mt-2">
              Saran: {aiDetail.suggestions.join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={saving || !grade}>
          {saving ? "Menyimpan…" : "Simpan nilai resmi"}
        </Button>
        <Button type="button" variant="ai" onClick={askAi} disabled={busy || !canUseAi}>
          {busy ? <Spinner /> : null}
          {busy ? "Menilai…" : "✨ Minta draf penilaian AI"}
        </Button>
        {!canUseAi && submissionText ? (
          <span className="self-center text-xs text-ink-500">
            Rubrik belum terbaca dari isi tugas — tambahkan tabel rubrik pada aktivitas.
          </span>
        ) : null}
      </div>

      <p className="text-xs text-ink-500">
        Nilai AI hanya draf. Nilai resmi ditentukan oleh Anda sebagai guru.
      </p>
    </div>
  );
}
