"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callEdgeFunction } from "@/lib/edge";
import { createActivity } from "@/lib/actions/teacher";
import { reflectionToPrompt } from "@/lib/markdown";
import { Alert, Badge, Button, Input, Label, Select, Spinner } from "@/components/ui";
import type { ReflectionDraft, ReflectionFocus } from "@/lib/types/database";

export function ReflectionGenerator({
  courseId,
  moduleId,
  defaultTopic,
}: {
  courseId: string;
  moduleId: string;
  defaultTopic: string;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(defaultTopic);
  const [focus, setFocus] = useState<ReflectionFocus>("concept");
  const [questionCount, setQuestionCount] = useState(3);
  const [extra, setExtra] = useState("");

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [draft, setDraft] = useState<ReflectionDraft | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await callEdgeFunction<ReflectionDraft>("generate-reflection", {
      course_id: courseId,
      topic,
      focus,
      question_count: questionCount,
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

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);

    const result = await createActivity({
      module_id: moduleId,
      courseId,
      title: `Refleksi — ${topic}`,
      type: "reflection",
      description: draft.teacher_note,
      reflection_prompt: reflectionToPrompt(draft),
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan refleksi.");
      return;
    }

    setNotice("Aktivitas refleksi tersimpan.");
    setDraft(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="reflection-topic">Topik refleksi</Label>
          <Input
            id="reflection-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            required
            minLength={2}
          />
        </div>
        <div>
          <Label htmlFor="reflection-focus">Fokus</Label>
          <Select
            id="reflection-focus"
            value={focus}
            onChange={(event) => setFocus(event.target.value as ReflectionFocus)}
          >
            <option value="concept">Pemahaman konsep</option>
            <option value="technical">Keterampilan teknis</option>
            <option value="real_world">Kaitan dunia nyata</option>
            <option value="metacognition">Metakognisi</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="reflection-count">Jumlah pertanyaan</Label>
          <Input
            id="reflection-count"
            type="number"
            min={1}
            max={5}
            value={questionCount}
            onChange={(event) =>
              setQuestionCount(Math.max(1, Math.min(5, Number(event.target.value) || 1)))
            }
          />
        </div>
        <div>
          <Label htmlFor="reflection-extra">Instruksi tambahan</Label>
          <Input
            id="reflection-extra"
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
            placeholder="Contoh: dorong siswa memberi contoh dari rumah"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ai" onClick={generate} disabled={busy || topic.trim().length < 2}>
          {busy ? <Spinner /> : null}
          {busy ? "Menyusun pertanyaan…" : "✨ Buat draf refleksi"}
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
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Pertanyaan refleksi
            </p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-ink-700">
              {draft.questions.map((question, index) => (
                <li key={index}>
                  <Input
                    value={question}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        questions: draft.questions.map((item, i) =>
                          i === index ? event.target.value : item,
                        ),
                      })
                    }
                  />
                </li>
              ))}
            </ol>
          </div>

          {draft.mood_options?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Pilihan suasana hati
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {draft.mood_options.map((mood) => (
                  <Badge key={mood} className="bg-white text-ink-700 ring-ink-200">
                    {mood}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {draft.teacher_note ? (
            <p className="rounded-md bg-white px-3 py-2 text-sm text-ink-600 ring-1 ring-inset ring-ink-200">
              {draft.teacher_note}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan sebagai aktivitas Refleksi"}
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
