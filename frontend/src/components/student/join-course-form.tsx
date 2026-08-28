"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinCourse } from "@/lib/actions/student";
import { Alert, Button, Input, Label } from "@/components/ui";

export function JoinCourseForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result = await joinCourse(code);
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal bergabung ke kelas.");
      return;
    }

    const courseId = result.data as string;
    router.refresh();
    router.push(`/student/courses/${courseId}`);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="class-code">Kode kelas</Label>
        <Input
          id="class-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="ABC123"
          required
          minLength={4}
          className="font-mono uppercase tracking-[0.2em]"
        />
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <Button type="submit" disabled={busy || code.trim().length < 4}>
        {busy ? "Memeriksa…" : "Gabung kelas"}
      </Button>
    </form>
  );
}
