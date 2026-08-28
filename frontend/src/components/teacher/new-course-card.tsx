"use client";

import { useState } from "react";
import { CourseForm } from "@/components/teacher/course-form";
import { Button, Card } from "@/components/ui";

export function NewCourseCard() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 bg-white/60 px-4 py-6 text-sm font-medium text-ink-600 transition hover:border-brand-400 hover:text-brand-700"
      >
        + Buat kelas baru
      </button>
    );
  }

  return (
    <Card title="Kelas baru" description="Kode kelas unik akan dibuat otomatis.">
      <CourseForm onDone={() => setOpen(false)} />
    </Card>
  );
}
