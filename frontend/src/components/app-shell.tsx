"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AppRole } from "@/lib/types/database";

const navByRole: Record<AppRole, { href: string; label: string }[]> = {
  teacher: [
    { href: "/teacher", label: "Kelas Saya" },
    { href: "/teacher/activate", label: "Aktivasi Guru" },
  ],
  student: [
    { href: "/student", label: "Kelas Saya" },
    { href: "/student/journal", label: "Jurnal Refleksi" },
  ],
};

export function AppShell({
  role,
  fullName,
  schoolName,
  children,
}: {
  role: AppRole;
  fullName: string;
  schoolName?: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const links = navByRole[role];

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href={role === "teacher" ? "/teacher" : "/student"} className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              LL
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold text-ink-900">Lessonlen</span>
              <span className="block text-xs text-ink-500">
                {role === "teacher" ? "Ruang Guru" : "Ruang Siswa"}
              </span>
            </span>
          </Link>

          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                    active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-ink-900">{fullName}</p>
              <p className="text-xs text-ink-500">{schoolName ?? "Tanpa sekolah"}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-xs font-semibold text-white">
              {initials(fullName)}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-ink-400">
        Lessonlen LMS — Tahap 5 (Frontend). Data &amp; keamanan dikelola Supabase (PostgreSQL + RLS).
      </footer>
    </div>
  );
}
