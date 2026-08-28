"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callEdgeFunction } from "@/lib/edge";
import { Alert, Button, Input, Label } from "@/components/ui";

// Bentuk response `setup-teacher`: { ok: true, school: { id, name } }
interface SetupTeacherResponse {
  ok: boolean;
  school: { id: string; name: string };
}

export function ActivateTeacherForm() {
  const router = useRouter();
  const [licenseCode, setLicenseCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    const result = await callEdgeFunction<SetupTeacherResponse>("setup-teacher", {
      license_code: licenseCode.trim(),
    });

    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

    setSuccess(
      `Berhasil. Peran Anda sekarang "teacher" di ${result.data.school.name}.`,
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="license_code">Kode lisensi</Label>
        <Input
          id="license_code"
          value={licenseCode}
          onChange={(event) => setLicenseCode(event.target.value)}
          placeholder="SCHOOL-0001"
          required
          minLength={3}
          className="font-mono uppercase"
        />
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <Button type="submit" disabled={busy || licenseCode.trim().length < 3}>
        {busy ? "Memverifikasi…" : "Verifikasi & aktifkan"}
      </Button>

      <p className="text-xs text-ink-500">
        Permintaan ini memakai JWT Anda; tidak ada kunci rahasia yang dikirim dari browser.
      </p>
    </form>
  );
}
