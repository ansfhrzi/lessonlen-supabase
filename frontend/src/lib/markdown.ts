import type { AssignmentDraft, MaterialDraft, ReflectionDraft } from "@/lib/types/database";

/** Mengubah draf materi dari `generate-material` menjadi Markdown untuk `activities.content_markdown`. */
export function materialToMarkdown(draft: MaterialDraft): string {
  const parts: string[] = [`# ${draft.title}`];

  if (draft.learning_objectives?.length) {
    parts.push("## Tujuan Pembelajaran", ...draft.learning_objectives.map((item) => `- ${item}`));
  }

  if (draft.introduction) parts.push("## Pendahuluan", draft.introduction);

  if (draft.key_concepts?.length) {
    parts.push(
      "## Konsep Kunci",
      ...draft.key_concepts.map((item) => `### ${item.concept}\n\n${item.explanation}`),
    );
  }

  if (draft.real_world_example) parts.push("## Contoh di Dunia Nyata", draft.real_world_example);
  if (draft.conclusion) parts.push("## Kesimpulan", draft.conclusion);

  if (draft.study_questions?.length) {
    parts.push(
      "## Pertanyaan Studi",
      ...draft.study_questions.map((item, index) => `${index + 1}. ${item}`),
    );
  }

  return parts.join("\n\n");
}

/** Mengubah draf tugas dari `generate-assignment` menjadi Markdown. */
export function assignmentToMarkdown(draft: AssignmentDraft): string {
  const parts: string[] = [`# ${draft.title}`];

  if (draft.objective) parts.push("## Tujuan", draft.objective);

  if (draft.instructions?.length) {
    parts.push("## Langkah Pengerjaan", ...draft.instructions.map((item, i) => `${i + 1}. ${item}`));
  }

  if (draft.rubric?.length) {
    parts.push(
      "## Rubrik Penilaian",
      "| Kriteria | Deskripsi | Skor Maks |",
      "| --- | --- | --- |",
      ...draft.rubric.map(
        (row) => `| ${row.criteria} | ${row.description} | ${row.max_score} |`,
      ),
    );
  }

  if (draft.submission_guidelines) {
    parts.push("## Ketentuan Pengumpulan", draft.submission_guidelines);
  }

  if (draft.group_roles?.length) {
    parts.push("## Peran dalam Kelompok", ...draft.group_roles.map((item) => `- ${item}`));
  }

  if (draft.tips_for_students?.length) {
    parts.push("## Tips", ...draft.tips_for_students.map((item) => `- ${item}`));
  }

  return parts.join("\n\n");
}

/** Mengubah draf refleksi menjadi prompt tersimpan di `activities.reflection_prompt`. */
export function reflectionToPrompt(draft: ReflectionDraft): string {
  const parts: string[] = [];

  if (draft.questions?.length) {
    parts.push(...draft.questions.map((item, index) => `${index + 1}. ${item}`));
  }

  if (draft.teacher_note) parts.push(`Catatan guru: ${draft.teacher_note}`);

  if (draft.mood_options?.length) {
    parts.push(`Pilihan suasana hati: ${draft.mood_options.join(" · ")}`);
  }

  return parts.join("\n");
}

/**
 * Membaca rubrik dari Markdown tugas yang dibuat `assignmentToMarkdown`.
 * Dipakai untuk mengisi parameter `rubric` pada Edge Function `generate-grading`.
 */
export function parseRubricFromMarkdown(
  markdown: string | null | undefined,
): { criteria: string; description: string; max_score: number }[] {
  if (!markdown) return [];

  const rows: { criteria: string; description: string; max_score: number }[] = [];

  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;

    const cells = trimmed
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell, index, array) => !(index === 0 && cell === "") && !(index === array.length - 1 && cell === ""));

    if (cells.length < 3) continue;
    if (/^:?-{2,}:?$/.test(cells[0])) continue; // baris pemisah tabel
    if (cells[0].toLowerCase() === "kriteria") continue; // baris judul

    const maxScore = Number(cells[cells.length - 1]);
    if (!Number.isFinite(maxScore) || maxScore <= 0) continue;

    rows.push({
      criteria: cells[0],
      description: cells.slice(1, cells.length - 1).join(" | "),
      max_score: maxScore,
    });
  }

  return rows;
}

/** Markdown sederhana → HTML aman (tanpa dependensi eksternal). */
export function renderMarkdown(markdown: string): string {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const lines = escapeHtml(markdown).split(/\r?\n/);
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  const inline = (value: string) =>
    value
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 4);
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith("|")) continue; // tabel dirender sebagai teks biasa

    const ordered = /^\d+\.\s+(.*)$/.exec(line);
    if (ordered) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inline(ordered[1])}</li>`);
      continue;
    }

    const unordered = /^[-*]\s+(.*)$/.exec(line);
    if (unordered) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inline(unordered[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}
