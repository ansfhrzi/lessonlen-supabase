import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/session";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("student");

  return (
    <AppShell role="student" fullName={profile.full_name} schoolName={profile.schools?.name ?? null}>
      {children}
    </AppShell>
  );
}
