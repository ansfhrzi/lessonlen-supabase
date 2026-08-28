'use client';

import React, { useState } from 'react';
import { useLMS } from '@/context/lms-context';
import { ClassRoster } from '@/lib/types';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  KeyRound,
  FileSpreadsheet,
  AlertCircle,
  Copy,
} from 'lucide-react';

interface RosterManagerProps {
  courseId: string;
}

export function RosterManager({ courseId }: RosterManagerProps) {
  const { getRostersForCourse, addRostersBulk, claimRoster, getCourse } = useLMS();
  const course = getCourse(courseId);
  const rosters = getRostersForCourse(courseId);

  const [bulkInput, setBulkInput] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const claimedCount = rosters.filter((r) => r.is_claimed).length;
  const totalCount = rosters.length;

  const filteredRosters = rosters.filter(
    (r) =>
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.nis && r.nis.includes(searchQuery))
  );

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;
    const added = addRostersBulk(courseId, bulkInput);
    setBulkInput('');
    setShowBulkModal(false);
    setActionNotice(`Berhasil menambahkan ${added} nama ke daftar presensi.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCopyCode = () => {
    if (!course) return;
    navigator.clipboard.writeText(course.class_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Preset Name & Hybrid Auth explanation */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-slate-900">
              Presensi & Klaim Nama Siswa (Preset Name)
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Siswa masuk menggunakan <strong>Kode Kelas</strong>, lalu memilih nama resminya dari daftar presensi ini.
            Metode ini mencegah nama panggilan/typo dan memudahkan login di komputer laboratorium sekolah tanpa 2FA HP.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Kode Kelas</p>
              <p className="font-mono font-extrabold text-sm text-indigo-600">{course?.class_code || '---'}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="Salin Kode Kelas"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            + Tambah Daftar Siswa
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Stats and Search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            Total Siswa: <strong>{totalCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            Sudah Mengklaim: <strong>{claimedCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            Belum Mengklaim: <strong>{totalCount - claimedCount}</strong>
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama siswa atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Lengkap Resmi</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Waktu Klaim</th>
                <th className="py-3 px-4 text-right">Tindakan Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRosters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <p className="font-semibold">Belum ada siswa di daftar presensi.</p>
                    <p className="text-[11px] mt-1">Klik tombol "+ Tambah Daftar Siswa" untuk menempel daftar nama kelas.</p>
                  </td>
                </tr>
              ) : (
                filteredRosters.map((roster, index) => (
                  <tr key={roster.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">{roster.nis || '-'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{roster.full_name}</td>
                    <td className="py-3 px-4">
                      {roster.is_claimed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Terhubung
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Belum Klaim
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {roster.claimed_at
                        ? new Date(roster.claimed_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {roster.is_claimed ? (
                        <button
                          onClick={() => {
                            alert(
                              `Password untuk siswa ${roster.full_name} telah direset ke default sekolah: 'siswa123'`
                            );
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg border border-slate-200 transition inline-flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          Reset PIN
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Menunggu siswa</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Tempel Daftar Presensi Siswa
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Salin dari Excel atau ketik satu nama per baris. Format yang didukung:
              <br />
              <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] text-slate-700">Nama Siswa</code> atau{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] text-slate-700">202401, Nama Siswa</code>
            </p>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <textarea
                rows={8}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={`202407, Gilang Pratama\n202408, Hani Rahmawati\n202409, Kevin Sanjaya\n202410, Nadia Safira`}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                >
                  Simpan ke Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
