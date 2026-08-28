"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { claimRoster } from "@/lib/actions/student";
import { Alert, Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface RosterOption {
  id: string;
  full_name: string;
  nis: string | null;
  claimed: boolean;
}

export function RosterClaim({
  courseId,
  options,
}: {
  courseId: string;
  options: RosterOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => option.full_name.toLowerCase().includes(keyword));
  }, [options, query]);

  async function claim() {
    if (!selected) return;
    setBusy(true);
    setError(null);

    const result = await claimRoster(selected, courseId);
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal mengklaim nama.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Pilih nama Anda pada daftar yang diunggah guru. Setiap nama hanya bisa diklaim satu kali, dan
        Anda hanya bisa mengklaim satu nama di kelas ini.
      </p>

      <div>
        <Label htmlFor="roster-search">Cari nama</Label>
        <Input
          id="roster-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ketik nama Anda"
        />
      </div>

      <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <li className="rounded-lg border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-500">
            Nama tidak ditemukan. Hubungi guru Anda bila nama belum tercantum.
          </li>
        ) : (
          filtered.map((option) => {
            const active = selected === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  disabled={option.claimed}
                  onClick={() => setSelected(option.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition",
                    option.claimed
                      ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-400"
                      : active
                        ? "border-brand-500 bg-brand-50 text-brand-800"
                        : "border-ink-200 bg-white text-ink-800 hover:border-brand-300",
                  )}
                >
                  <span className="font-medium">{option.full_name}</span>
                  <span className="text-xs">
                    {option.claimed ? "sudah diklaim" : option.nis ? `NIS ${option.nis}` : active ? "dipilih" : ""}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <Button type="button" onClick={claim} disabled={!selected || busy}>
        {busy ? "Menyimpan…" : "Klaim nama ini"}
      </Button>
    </div>
  );
}
