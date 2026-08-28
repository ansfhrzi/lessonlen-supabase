"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callEdgeFunction } from "@/lib/edge";
import { createActivity } from "@/lib/actions/teacher";
import { materialToMarkdown } from "@/lib/markdown";
import { Alert, Button, Input, Label, Spinner, Textarea } from "@/components/ui";
import type { MaterialDraft } from "@/lib/types/database";

export function MaterialGenerator({
  courseId,
  moduleId,
  defaultTopic,
  gradeLevel,
}: {
  courseId: string;
  moduleId: string;
  defaultTopic: string;
  gradeLevel?: string | null;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(defaultTopic);
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [draft, setDraft] = useState<MaterialDraft | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await callEdgeFunction<MaterialDraft>("generate-material", {
      topic,
      course_id: courseId,
      grade_level: gradeLevel ?? undefined,
      extra_instructions: extra.trim() || undefined,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDraft(result.data);
    if (result.usage) setUsage(result.usage);
  }

  async function saveAsActivity() {
    if (!draft) return;
    setSaving(true);
    setError(null);

    const result = await createActivity({
      module_id: moduleId,
      courseId,
      title: draft.title,
      type: "lesson",
      description: draft.learning_objectives?.slice(0, 3).join(" · ") ?? undefined,
      content_markdown: materialToMarkdown(draft),
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan aktivitas.");
      return;
    }

    setNotice(`Materi "${draft.title}" tersimpan sebagai aktivitas.`);
    setDraft(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="material-topic">Topik / judul bab</Label>
          <Input
            id="material-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            required
            minLength={2}
          />
        </div>
        <div>
          <Label htmlFor="material-extra">Instruksi tambahan (opsional)</Label>
          <Input
            id="material-extra"
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
            placeholder="Contoh: sertakan studi kasus lokal"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ai" onClick={generate} disabled={busy || topic.trim().length < 2}>
          {busy ? <Spinner /> : null}
          {busy ? "Membuat draf…" : "✨ Buat draf materi"}
        </Button>
        {usage ? (
          <span className="text-xs text-ink-500">
            Kuota AI hari ini: {usage.used} / {usage.limit}
          </span>
        ) : null}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {draft ? (
        <div className="space-y-4 rounded-lg border border-violet-200 bg-violet-50/40 p-4">
          <div>
            <Label htmlFor="material-title">Judul hasil</Label>
            <Input
              id="material-title"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </div>

          {draft.learning_objectives?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Tujuan pembelajaran
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-700">
                {draft.learning_objectives.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {draft.key_concepts?.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Konsep kunci</p>
              {draft.key_concepts.map((concept, index) => (
                <div key={index} className="rounded-md bg-white p-3 ring-1 ring-inset ring-ink-200">
                  <p className="text-sm font-medium text-ink-900">{concept.concept}</p>
                  <p className="mt-1 text-sm text-ink-600">{concept.explanation}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div>
            <Label htmlFor="material-intro">Pendahuluan</Label>
            <Textarea
              id="material-intro"
              value={draft.introduction ?? ""}
              onChange={(event) => setDraft({ ...draft, introduction: event.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="material-example">Contoh dunia nyata</Label>
            <Textarea
              id="material-example"
              value={draft.real_world_example ?? ""}
              onChange={(event) => setDraft({ ...draft, real_world_example: event.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="material-conclusion">Kesimpulan</Label>
            <Textarea
              id="material-conclusion"
              value={draft.conclusion ?? ""}
              onChange={(event) => setDraft({ ...draft, conclusion: event.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={saveAsActivity} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan sebagai aktivitas Materi"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
              Buang draf
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
