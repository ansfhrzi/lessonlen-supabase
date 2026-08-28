"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateModule } from "@/lib/actions/teacher";
import { Button, Input, Label, Textarea } from "@/components/ui";

export function ModuleSettings({
  moduleId,
  initialTitle,
  initialDescription,
  isPublished,
}: {
  moduleId: string;
  initialTitle: string;
  initialDescription: string | null;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [published, setPublished] = useState(isPublished);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await updateModule(moduleId, {
      title,
      description: description.trim() || null,
      is_published: published,
    });
    setBusy(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="module-title-edit">Judul modul</Label>
        <Input
          id="module-title-edit"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          minLength={3}
        />
      </div>
      <div>
        <Label htmlFor="module-description-edit">Deskripsi</Label>
        <Textarea
          id="module-description-edit"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-20"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={published}
          onChange={(event) => setPublished(event.target.checked)}
          className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
        />
        Terbitkan modul ini untuk siswa
      </label>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={busy || title.trim().length < 3}>
          {busy ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
        {saved ? <span className="text-xs text-emerald-600">Tersimpan ✓</span> : null}
      </div>
    </div>
  );
}
