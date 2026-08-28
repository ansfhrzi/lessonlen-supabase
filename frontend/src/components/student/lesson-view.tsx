"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markActivityComplete } from "@/lib/actions/student";
import { Alert, Button } from "@/components/ui";
import { renderMarkdown } from "@/lib/markdown";

export function LessonView({
  activityId,
  courseId,
  title,
  description,
  contentMarkdown,
  completed,
}: {
  activityId: string;
  courseId: string;
  title: string;
  description: string | null;
  contentMarkdown: string | null;
  completed: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(completed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);

    const result = await markActivityComplete(activityId, courseId, !done);
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal memperbarui status.");
      return;
    }

    setDone(!done);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {description ? <p className="text-sm text-ink-600">{description}</p> : null}

      {contentMarkdown ? (
        <article
          className="prose-lesson rounded-xl border border-ink-200 bg-white px-6 py-5"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(contentMarkdown) }}
        />
      ) : (
        <Alert tone="info">
          Materi ini belum memiliki isi tertulis. Guru mungkin menyediakannya lewat file atau
          penjelasan langsung di kelas.
        </Alert>
      )}

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={toggle} disabled={busy} variant={done ? "secondary" : "primary"}>
          {busy ? "Menyimpan…" : done ? "Tandai belum selesai" : "Tandai sudah dibaca"}
        </Button>
        {done ? <span className="text-sm text-emerald-600">Modul ini tercatat selesai ✓</span> : null}
      </div>

      <p className="text-xs text-ink-500">Materi: {title}</p>
    </div>
  );
}
