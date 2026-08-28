"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteActivity, updateActivity } from "@/lib/actions/teacher";
import { Badge, Button } from "@/components/ui";
import { activityTypeAccent, activityTypeIcon, activityTypeLabel, formatDateTime } from "@/lib/format";
import type { Activity } from "@/lib/types/database";

export function ActivityRow({
  activity,
  courseId,
  moduleId,
  questionCount,
  submissionCount,
}: {
  activity: Activity;
  courseId: string;
  moduleId: string;
  questionCount?: number;
  submissionCount?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function togglePublish() {
    setBusy(true);
    await updateActivity(activity.id, courseId, moduleId, {
      is_published: !activity.is_published,
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Hapus aktivitas "${activity.title}" beserta datanya?`)) return;
    setBusy(true);
    await deleteActivity(activity.id, courseId, moduleId);
    setBusy(false);
    router.refresh();
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="text-lg" aria-hidden>
          {activityTypeIcon[activity.type]}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{activity.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <Badge className={activityTypeAccent[activity.type]}>
              {activityTypeLabel[activity.type]}
            </Badge>
            {questionCount !== undefined ? <span>{questionCount} soal</span> : null}
            {submissionCount !== undefined ? <span>{submissionCount} pengumpulan</span> : null}
            {activity.due_at ? <span>Tenggat {formatDateTime(activity.due_at)}</span> : null}
            {!activity.is_published ? <span className="text-amber-600">Belum terbit</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activity.type === "assignment" ? (
          <Link
            href={`/teacher/courses/${courseId}/activities/${activity.id}/submissions`}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Nilai tugas
          </Link>
        ) : null}
        <Link
          href={`/teacher/courses/${courseId}/modules/${moduleId}`}
          className="text-xs font-medium text-ink-500 hover:text-brand-600"
        >
          Edit
        </Link>
        <Button type="button" size="sm" variant="ghost" onClick={togglePublish} disabled={busy}>
          {activity.is_published ? "Sembunyikan" : "Terbitkan"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={busy}>
          Hapus
        </Button>
      </div>
    </li>
  );
}
