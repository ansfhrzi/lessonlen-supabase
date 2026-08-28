"use client";

import { useState } from "react";
import { AssignmentGenerator } from "@/components/teacher/generators/assignment-generator";
import { MaterialGenerator } from "@/components/teacher/generators/material-generator";
import { QuizGenerator } from "@/components/teacher/generators/quiz-generator";
import { ReflectionGenerator } from "@/components/teacher/generators/reflection-generator";
import { cn } from "@/lib/cn";

type Tab = "material" | "quiz" | "assignment" | "reflection";

const tabs: { id: Tab; label: string; description: string }[] = [
  { id: "material", label: "Materi", description: "Draf materi bab + tujuan pembelajaran" },
  { id: "quiz", label: "Soal Kuis", description: "Bank soal pilihan ganda dari materi modul" },
  { id: "assignment", label: "Tugas", description: "Tugas + rubrik penilaian" },
  { id: "reflection", label: "Refleksi", description: "Pertanyaan refleksi Deep Learning" },
];

export function AiStudio({
  courseId,
  moduleId,
  moduleTitle,
  gradeLevel,
  quizActivities,
}: {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  gradeLevel?: string | null;
  quizActivities: { id: string; title: string }[];
}) {
  const [tab, setTab] = useState<Tab>("material");
  const active = tabs.find((item) => item.id === tab)!;

  return (
    <section className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <header className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-brand-50 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
          <span aria-hidden>✨</span> AI Generator
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          {active.description}. Semua hasil adalah <strong>draf</strong> — Anda tetap harus
          meninjau sebelum menyimpan ke database.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-ink-100 px-3 py-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              tab === item.id
                ? "bg-violet-600 text-white"
                : "text-ink-600 hover:bg-violet-50 hover:text-violet-700",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        {tab === "material" ? (
          <MaterialGenerator
            courseId={courseId}
            moduleId={moduleId}
            defaultTopic={moduleTitle}
            gradeLevel={gradeLevel}
          />
        ) : null}

        {tab === "quiz" ? (
          <QuizGenerator
            courseId={courseId}
            moduleId={moduleId}
            moduleTitle={moduleTitle}
            quizActivities={quizActivities}
          />
        ) : null}

        {tab === "assignment" ? (
          <AssignmentGenerator
            courseId={courseId}
            moduleId={moduleId}
            defaultTopic={moduleTitle}
          />
        ) : null}

        {tab === "reflection" ? (
          <ReflectionGenerator
            courseId={courseId}
            moduleId={moduleId}
            defaultTopic={moduleTitle}
          />
        ) : null}
      </div>
    </section>
  );
}
