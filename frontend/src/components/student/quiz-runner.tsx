"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitQuiz } from "@/lib/actions/student";
import { createClient } from "@/lib/supabase/client";
import { generateClientSubmissionId } from "@/lib/format";
import { Alert, Badge, Button, Spinner, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { QuizPayload, QuizResultRow, SubmitQuizResult } from "@/lib/types/database";

export function QuizRunner({
  activityId,
  courseId,
  title,
}: {
  activityId: string;
  courseId: string;
  title: string;
}) {
  const router = useRouter();
  const [payload, setPayload] = useState<QuizPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  // ID idempotensi per percobaan: percobaan baru memakai ID baru agar RPC
  // `submit_quiz` membuat baris attempt baru, bukan menimpa yang lama.
  const [clientSubmissionId, setClientSubmissionId] = useState(() =>
    generateClientSubmissionId(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitQuizResult | null>(null);

  const startedAt = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const loadPayload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("get_quiz_payload", {
      p_activity_id: activityId,
    });

    setLoading(false);

    if (rpcError) {
      setLoadError(rpcError.message);
      return;
    }

    setPayload(data as QuizPayload);
  }, [activityId]);

  useEffect(() => {
    void loadPayload();
  }, [loadPayload]);

  useEffect(() => {
    if (!started || result) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [started, result]);

  function start() {
    startedAt.current = Date.now();
    setAnswers({});
    setResult(null);
    setElapsed(0);
    setClientSubmissionId(generateClientSubmissionId());
    setStarted(true);
  }

  function setSingle(questionId: string, key: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: key }));
  }

  function toggleMultiple(questionId: string, key: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key].sort();
      return { ...prev, [questionId]: next };
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);

    const outcome = await submitQuiz({
      activity_id: activityId,
      courseId,
      answers,
      client_submission_id: clientSubmissionId,
      time_taken_seconds: Math.floor((Date.now() - startedAt.current) / 1000),
    });

    setSubmitting(false);

    if (!outcome.ok) {
      setError(outcome.error ?? "Gagal mengirim kuis.");
      return;
    }

    setResult(outcome.data as SubmitQuizResult);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <Spinner /> Memuat soal…
      </div>
    );
  }

  if (loadError) {
    return <Alert tone="error">{loadError}</Alert>;
  }

  if (!payload || payload.questions.length === 0) {
    return (
      <Alert tone="warning" title="Kuis belum berisi soal">
        <p>Guru Anda belum menambahkan soal ke aktivitas ini.</p>
      </Alert>
    );
  }

  if (result) {
    const percent = result.max_points > 0 ? Math.round((Number(result.score) / result.max_points) * 100) : 0;

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm text-emerald-800">Kuis terkirim (percobaan #{result.attempt_no})</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-900">
            {result.score} <span className="text-base font-normal">/ {result.max_points} poin</span>
          </p>
          <p className="mt-1 text-sm text-emerald-700">{percent}% benar</p>
        </div>

        <ol className="space-y-3">
          {(result.results ?? []).map((row: QuizResultRow, index) => {
            const question = payload.questions.find((item) => item.id === row.question_id);
            return (
              <li
                key={row.question_id}
                className={cn(
                  "rounded-lg border px-4 py-3",
                  row.correct ? "border-emerald-200 bg-white" : "border-rose-200 bg-rose-50/50",
                )}
              >
                <p className="text-sm font-medium text-ink-800">
                  {index + 1}. {question?.question_text ?? "Soal"}
                </p>
                <p className="mt-1 text-xs text-ink-600">
                  Jawaban Anda:{" "}
                  {Array.isArray(row.selected)
                    ? (row.selected as string[]).join(", ") || "-"
                    : String(row.selected ?? "-")}{" "}
                  · {row.points_earned}/{row.max_points} poin
                </p>
              </li>
            );
          })}
        </ol>

        <Button type="button" variant="secondary" onClick={start}>
          Coba lagi (percobaan baru)
        </Button>
      </div>
    );
  }

  const answered = payload.questions.filter((question) => {
    const value = answers[question.id];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-ink-200 bg-white px-5 py-4">
          <h2 className="font-semibold text-ink-900">{title}</h2>
          <p className="mt-1 text-sm text-ink-500">
            {payload.questions.length} soal · total{" "}
            {payload.questions.reduce((total, question) => total + question.points, 0)} poin
          </p>
          <p className="mt-3 text-sm text-ink-600">
            Penilaian dikerjakan di server, jadi kunci jawaban tidak pernah dikirim ke perangkat
            Anda. Setiap pengiriman dicatat sebagai percobaan baru.
          </p>
        </div>

        <Button type="button" onClick={start}>
          Mulai kerjakan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
        <p className="text-sm text-ink-700">
          {answered} / {payload.questions.length} terjawab
        </p>
        <Badge className="bg-brand-50 text-brand-700 ring-brand-200">
          ⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </Badge>
      </div>

      <ol className="space-y-4">
        {payload.questions.map((question, index) => (
          <li key={question.id} className="rounded-lg border border-ink-200 bg-white px-4 py-3">
            <p className="text-sm font-medium text-ink-800">
              {index + 1}. {question.question_text}
            </p>
            <p className="mt-0.5 text-xs text-ink-400">{question.points} poin</p>

            {question.question_type === "short_answer" ? (
              <Textarea
                className="mt-3 min-h-20"
                value={String(answers[question.id] ?? "")}
                onChange={(event) => setSingle(question.id, event.target.value)}
                placeholder="Tulis jawaban Anda"
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {question.options.map((option) => {
                  const selected = question.question_type === "multiple"
                    ? (Array.isArray(answers[question.id]) &&
                        (answers[question.id] as string[]).includes(option.key))
                    : answers[question.id] === option.key;

                  return (
                    <li key={option.key}>
                      <button
                        type="button"
                        onClick={() =>
                          question.question_type === "multiple"
                            ? toggleMultiple(question.id, option.key)
                            : setSingle(question.id, option.key)
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                          selected
                            ? "border-brand-500 bg-brand-50 text-brand-900"
                            : "border-ink-200 bg-white text-ink-700 hover:border-brand-300",
                        )}
                      >
                        <Badge
                          className={
                            selected
                              ? "bg-brand-600 text-white ring-brand-600"
                              : "bg-ink-50 text-ink-600 ring-ink-200"
                          }
                        >
                          {option.key}
                        </Badge>
                        <span className="flex-1">{option.text}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={submit} disabled={submitting}>
          {submitting ? <Spinner /> : null}
          {submitting ? "Mengirim…" : "Kirim kuis"}
        </Button>
        <span className="text-xs text-ink-500">
          {answered < payload.questions.length
            ? `${payload.questions.length - answered} soal belum dijawab.`
            : "Semua soal terjawab."}
        </span>
      </div>
    </div>
  );
}
