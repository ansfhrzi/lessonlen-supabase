"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function ClassCodeCard({ classCode }: { classCode: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(classCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50 px-5 py-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-700">Kode kelas</p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.3em] text-brand-900">
          {classCode}
        </p>
        <p className="mt-1 text-xs text-brand-700">
          Bagikan ke siswa — mereka bergabung dari menu &quot;Kelas Saya&quot; di ruang siswa.
        </p>
      </div>
      <Button type="button" variant="secondary" onClick={copy}>
        {copied ? "Tersalin ✓" : "Salin kode"}
      </Button>
    </div>
  );
}
