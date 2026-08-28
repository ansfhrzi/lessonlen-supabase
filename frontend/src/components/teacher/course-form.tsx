"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/lib/actions/teacher";
import { Alert, Button, Input, Label, Textarea } from "@/components/ui";

export function CourseForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    grade_level: "",
    year_term: "",
    description: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result = await createCourse(form);
    if (!result.ok || !result.id) {
      setError(result.error ?? "Gagal membuat kelas.");
      setBusy(false);
      return;
    }

    router.push(`/teacher/courses/${result.id}`);
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Judul kelas</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="IPA Kelas 7 — Ekosistem"
            required
            minLength={3}
          />
        </div>
        <div>
          <Label htmlFor="subject">Mata pelajaran</Label>
          <Input
            id="subject"
            value={form.subject}
            onChange={(event) => update("subject", event.target.value)}
            placeholder="IPA"
          />
        </div>
        <div>
          <Label htmlFor="grade_level">Tingkat</Label>
          <Input
            id="grade_level"
            value={form.grade_level}
            onChange={(event) => update("grade_level", event.target.value)}
            placeholder="Kelas 7"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="year_term">Tahun ajaran / semester</Label>
          <Input
            id="year_term"
            value={form.year_term}
            onChange={(event) => update("year_term", event.target.value)}
            placeholder="2026/2027 — Ganjil"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Ringkasan singkat tujuan kelas ini"
          />
        </div>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={busy}>
          Batal
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Menyimpan…" : "Buat kelas"}
        </Button>
      </div>

      <p className="text-xs text-ink-500">
        Kode kelas unik dibuat otomatis dan bisa dibagikan ke siswa untuk bergabung.
      </p>
    </form>
  );
}
