import type { ActivityType } from "@/lib/types/database";

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("id-ID").format(Number(value));
}

export function formatScore(score?: number | null, max?: number | null): string {
  if (score === null || score === undefined) return "-";
  const rounded = Math.round(Number(score) * 100) / 100;
  return max ? `${rounded} / ${max}` : `${rounded}`;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(text?: string | null, max = 140): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export const activityTypeLabel: Record<ActivityType, string> = {
  lesson: "Materi",
  assignment: "Tugas",
  quiz: "Kuis",
  reflection: "Refleksi",
};

export const activityTypeIcon: Record<ActivityType, string> = {
  lesson: "📘",
  assignment: "📝",
  quiz: "🎯",
  reflection: "🪞",
};

export const activityTypeAccent: Record<ActivityType, string> = {
  lesson: "bg-brand-50 text-brand-700 ring-brand-200",
  assignment: "bg-amber-50 text-amber-700 ring-amber-200",
  quiz: "bg-violet-50 text-violet-700 ring-violet-200",
  reflection: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function generateClassCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function generateClientSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
