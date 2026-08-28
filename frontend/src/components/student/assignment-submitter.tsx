"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitAssignment } from "@/lib/actions/student";
import { Alert, Badge, Button, Input, Label, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export function AssignmentSubmitter({
  activityId,
  courseId,
  initialLink,
  initialText,
  grade,
  feedback,
  submittedAt,
}: {
  activityId: string;
  courseId: string;
  initialLink: string | null;
  initialText: string | null;
  grade: number | null;
  feedback: string | null;
  submittedAt: string | null;
}) {
  const router = useRouter();
  const [link, setLink] = useState(initialLink ?? "");
  const [text, setText] = useState(initialText ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await submitAssignment({
      activity_id: activityId,
      courseId,
      submission_link: link,
      submission_text: text,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal mengirim tugas.");
      return;
    }

    setNotice("Tugas terkirim ke guru.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {submittedAt ? (
        <Alert tone="success" title="Sudah dikumpulkan">
          <p>
            Terakhir dikirim {formatDateTime(submittedAt)}
            {grade !== null ? ` · nilai ${grade}` : " · menunggu penilaian guru"}
          </p>
          {feedback ? <p className="mt-1">Umpan balik guru: {feedback}</p> : null}
        </Alert>
      ) : null}

      {grade !== null && submittedAt ? (
        <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Nilai: {grade}</Badge>
      ) : null}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-ink-200 bg-white p-5">
        <div>
          <Label htmlFor="assignment-link">Tautan hasil kerja (opsional)</Label>
          <Input
            id="assignment-link"
            type="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://drive.google.com/..."
          />
          <p className="mt-1 text-xs text-ink-500">
            Unggah berkas ke Drive/OneDrive lalu tempel tautannya di sini.
          </p>
        </div>

        <div>
          <Label htmlFor="assignment-text">Jawaban tertulis (opsional)</Label>
          <Textarea
            id="assignment-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Tulis jawaban atau ringkasan hasil kerja Anda"
            className="min-h-40"
          />
        </div>

        {error ? <Alert tone="error">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}

        <Button type="submit" disabled={busy || (!link.trim() && !text.trim())}>
          {busy ? "Mengirim…" : submittedAt ? "Perbarui pengumpulan" : "Kumpulkan tugas"}
        </Button>
      </form>
    </div>
  );
}
