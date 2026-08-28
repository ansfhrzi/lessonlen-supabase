"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addRosterNames, deleteRoster } from "@/lib/actions/teacher";
import { Alert, Badge, Button, Label, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export interface RosterRow {
  id: string;
  nis: string | null;
  full_name: string;
  sort_order: number;
  claimed_by: string | null;
  claimed_at: string | null;
}

export function RosterManager({ courseId, rows }: { courseId: string; rows: RosterRow[] }) {
  const router = useRouter();
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);

  async function addNames(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await addRosterNames({ course_id: courseId, names });
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Gagal menambahkan nama.");
      return;
    }

    setNotice(result.message ?? "Nama ditambahkan.");
    setNames("");
    router.refresh();
  }

  async function remove(row: RosterRow) {
    if (row.claimed_by) {
      window.alert("Nama ini sudah diklaim siswa. Hapus klaimnya terlebih dahulu.");
      return;
    }
    if (!window.confirm(`Hapus "${row.full_name}" dari daftar presensi?`)) return;

    setBusyRow(row.id);
    const result = await deleteRoster(row.id, courseId);
    setBusyRow(null);

    if (!result.ok) {
      setError(result.error ?? "Gagal menghapus nama.");
      return;
    }
    router.refresh();
  }

  const claimed = rows.filter((row) => row.claimed_by).length;

  return (
    <div className="space-y-6">
      <form onSubmit={addNames} className="space-y-3">
        <div>
          <Label htmlFor="roster-names">Tempel daftar nama (satu nama per baris)</Label>
          <Textarea
            id="roster-names"
            value={names}
            onChange={(event) => setNames(event.target.value)}
            placeholder={"Andi Pratama\nBunga Lestari\nCitra Ayu"}
            className="min-h-32 font-mono text-xs"
          />
          <p className="mt-1 text-xs text-ink-500">
            Nama yang sudah ada di kelas ini otomatis dilewati. Kolom NIS bisa diisi manual nanti
            lewat Supabase bila diperlukan.
          </p>
        </div>

        {error ? <Alert tone="error">{error}</Alert> : null}
        {notice ? <Alert tone="success">{notice}</Alert> : null}

        <Button type="submit" disabled={busy || !names.trim()}>
          {busy ? "Menyimpan…" : "Tambahkan nama"}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-ink-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-2 w-12">#</th>
              <th className="px-4 py-2">Nama pada daftar</th>
              <th className="px-4 py-2">Diklaim oleh</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-500">
                  Daftar presensi masih kosong.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="px-4 py-2 text-ink-400">{index + 1}</td>
                  <td className="px-4 py-2 font-medium text-ink-800">{row.full_name}</td>
                  <td className="px-4 py-2">
                    {row.claimed_by ? (
                      <span className="space-y-0.5">
                        <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">
                          {row.claimed_by}
                        </Badge>
                        <span className="block text-xs text-ink-400">
                          {row.claimed_at ? formatDateTime(row.claimed_at) : ""}
                        </span>
                      </span>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 ring-amber-200">Belum diklaim</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyRow === row.id}
                      onClick={() => remove(row)}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-500">
        {claimed} dari {rows.length} nama sudah diklaim siswa.
      </p>
    </div>
  );
}
