"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createModule } from "@/lib/actions/teacher";
import { Alert, Button, Input, Label, Textarea } from "@/components/ui";

export function NewModuleForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result = await createModule({ course_id: courseId, title, description });
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal menambahkan modul.");
      return;
    }

    setTitle("");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="module-title">Judul modul</Label>
        <Input
          id="module-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Bab 1 — Ekosistem"
          required
          minLength={3}
        />
      </div>
      <div>
        <Label htmlFor="module-description">Deskripsi (opsional)</Label>
        <Textarea
          id="module-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tujuan pembelajaran modul ini"
          className="min-h-20"
        />
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={busy || title.trim().length < 3}>
          {busy ? "Menyimpan…" : "Tambah modul"}
        </Button>
      </div>
    </form>
  );
}
