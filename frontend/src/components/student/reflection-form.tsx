"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveReflection } from "@/lib/actions/student";
import { Alert, Button, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";

export function ReflectionForm({
  activityId,
  courseId,
  prompt,
  moodOptions,
  initialText,
  initialMood,
}: {
  activityId: string;
  courseId: string;
  prompt: string | null;
  moodOptions: string[];
  initialText: string | null;
  initialMood: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText ?? "");
  const [mood, setMood] = useState(initialMood ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const questions = (prompt ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line && !line.startsWith("Catatan guru:") && !line.startsWith("Pilihan suasana hati:"));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await saveReflection({
      activity_id: activityId,
      courseId,
      reflection_text: text,
      mood_tracker: mood || null,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan refleksi.");
      return;
    }

    setNotice("Refleksi tersimpan. Terima kasih sudah jujur pada diri sendiri.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {questions.length ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Pertanyaan refleksi
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ink-700">
            {questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {moodOptions.length ? (
        <div>
          <Label>Suasana hati Anda saat ini</Label>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMood(mood === option ? "" : option)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  mood === option
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-ink-200 bg-white text-ink-700 hover:border-violet-300",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-ink-200 bg-white p-5">
        <div>
          <Label htmlFor="reflection-text">Jawaban refleksi</Label>
          <Textarea
            id="reflection-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ceritakan apa yang Anda pahami, apa yang masih membingungkan, dan bagaimana Anda akan memakainya."
            className="min-h-48"
            minLength={20}
          />
          <p className="mt-1 text-xs text-ink-500">
            {text.trim().length} karakter · minimal 20 karakter
          </p>
        </div>

        {error ? <Alert tone="error">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}

        <Button type="submit" disabled={busy || text.trim().length < 20}>
          {busy ? "Menyimpan…" : initialText ? "Perbarui refleksi" : "Simpan refleksi"}
        </Button>
      </form>
    </div>
  );
}
