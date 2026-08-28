"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteQuizQuestion } from "@/lib/actions/teacher";
import { Badge, Button, EmptyState } from "@/components/ui";
import type { QuizQuestion } from "@/lib/types/database";

export function QuizBank({
  activityId,
  activityTitle,
  courseId,
  moduleId,
  questions,
}: {
  activityId: string;
  activityTitle: string;
  courseId: string;
  moduleId: string;
  questions: QuizQuestion[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(questionId: string) {
    if (!window.confirm("Hapus soal ini dari bank soal?")) return;
    setBusyId(questionId);
    await deleteQuizQuestion(questionId, activityId, courseId, moduleId);
    setBusyId(null);
    router.refresh();
  }

  const totalPoints = questions.reduce((total, question) => total + Number(question.points ?? 0), 0);

  return (
    <div className="rounded-lg border border-ink-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink-900">🎯 Bank soal — {activityTitle}</p>
          <p className="text-xs text-ink-500">
            {questions.length} soal · total {totalPoints} poin · kunci jawaban hanya terbaca oleh guru
          </p>
        </div>
      </div>

      <div className="px-4 py-3">
        {questions.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="Bank soal masih kosong"
            description="Gunakan AI Generator tab 'Soal Kuis' untuk menyusun draf, tinjau, lalu simpan ke sini."
          />
        ) : (
          <ol className="space-y-3">
            {questions.map((question, index) => (
              <li key={question.id} className="rounded-md border border-ink-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ink-800">
                    {index + 1}. {question.question_text}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyId === question.id}
                    onClick={() => remove(question.id)}
                  >
                    Hapus
                  </Button>
                </div>

                <ul className="mt-2 space-y-1">
                  {question.options.map((option) => {
                    const correct = question.correct_keys.includes(option.key);
                    return (
                      <li key={option.key} className="flex items-center gap-2 text-sm">
                        <Badge
                          className={
                            correct
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-300"
                              : "bg-ink-50 text-ink-600 ring-ink-200"
                          }
                        >
                          {option.key}
                        </Badge>
                        <span className="flex-1 text-ink-600">{option.text}</span>
                        {correct ? <span className="text-xs text-emerald-600">kunci</span> : null}
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-2 text-xs text-ink-500">
                  {question.question_type === "multiple" ? "Pilihan ganda" : "Pilihan tunggal"} ·{" "}
                  {question.points} poin
                  {question.explanation ? ` · ${question.explanation}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
