import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/session";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("teacher");

  return (
    <AppShell
      role="teacher"
      fullName={profile.full_name}
      schoolName={profile.schools?.name ?? null}
    >
      {children}
    </AppShell>
  );
}
