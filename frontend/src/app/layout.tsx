import type { Metadata } from "next";
import { EnvSetupNotice } from "@/components/env-setup-notice";
import { isSupabaseConfigured } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lessonlen — LMS Pembelajaran Mendalam",
  description:
    "Learning Management System berbasis Supabase dengan asisten AI untuk guru dan alur Deep Learning untuk siswa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <html lang="id">
        <body>
          <EnvSetupNotice />
        </body>
      </html>
    );
  }

  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
