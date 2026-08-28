"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callEdgeFunction } from "@/lib/edge";
import { createActivity } from "@/lib/actions/teacher";
import { assignmentToMarkdown } from "@/lib/markdown";
import { Alert, Button, Input, Label, Select, Spinner, Textarea } from "@/components/ui";
import type { AssignmentDraft, AssignmentMode } from "@/lib/types/database";

export function AssignmentGenerator({
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
  const [mode, setMode] = useState<AssignmentMode>("individual");
  const [indicator, setIndicator] = useState("");
  const [extra, setExtra] = useState("");

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [draft, setDraft] = useState<AssignmentDraft | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await callEdgeFunction<AssignmentDraft>("generate-assignment", {
      course_id: courseId,
      topic,
      assignment_mode: mode,
      learning_indicator: indicator.trim() || undefined,
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
      title: draft.title,
      type: "assignment",
      description: draft.objective,
      content_markdown: assignmentToMarkdown(draft),
      assignment_mode: mode,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan tugas.");
      return;
    }

    setNotice(`Tugas "${draft.title}" tersimpan.`);
    setDraft(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="assignment-topic">Topik tugas</Label>
          <Input
            id="assignment-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            required
            minLength={2}
          />
        </div>
        <div>
          <Label htmlFor="assignment-mode">Mode pengerjaan</Label>
          <Select
            id="assignment-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as AssignmentMode)}
          >
            <option value="individual">Individu</option>
            <option value="group">Kelompok</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="assignment-indicator">Indikator pencapaian (opsional)</Label>
          <Input
            id="assignment-indicator"
            value={indicator}
            onChange={(event) => setIndicator(event.target.value)}
            placeholder="Siswa mampu menganalisis hubungan antar komponen ekosistem"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="assignment-extra">Instruksi tambahan</Label>
          <Input
            id="assignment-extra"
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
            placeholder="Contoh: wajib menyertakan foto hasil pengamatan"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ai" onClick={generate} disabled={busy || topic.trim().length < 2}>
          {busy ? <Spinner /> : null}
          {busy ? "Menyusun tugas…" : "✨ Buat draf tugas"}
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
            <Label htmlFor="assignment-title">Judul tugas</Label>
            <Input
              id="assignment-title"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="assignment-objective">Tujuan</Label>
            <Textarea
              id="assignment-objective"
              value={draft.objective ?? ""}
              onChange={(event) => setDraft({ ...draft, objective: event.target.value })}
            />
          </div>

          {draft.instructions?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Langkah pengerjaan
              </p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink-700">
                {draft.instructions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </div>
          ) : null}

          {draft.rubric?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Rubrik</p>
              <div className="mt-2 overflow-x-auto rounded-md bg-white ring-1 ring-inset ring-ink-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-3 py-2">Kriteria</th>
                      <th className="px-3 py-2">Deskripsi</th>
                      <th className="px-3 py-2 text-right">Skor maks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {draft.rubric.map((row, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 font-medium text-ink-800">{row.criteria}</td>
                        <td className="px-3 py-2 text-ink-600">{row.description}</td>
                        <td className="px-3 py-2 text-right text-ink-700">{row.max_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {draft.submission_guidelines ? (
            <p className="text-sm text-ink-600">
              <span className="font-medium text-ink-800">Pengumpulan:</span>{" "}
              {draft.submission_guidelines}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan sebagai aktivitas Tugas"}
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
