import ExcelJS from "exceljs";
import { zipSync, strToU8, strFromU8, Unzip, UnzipInflate } from "fflate";
import { createHash, randomUUID } from "node:crypto";
import type { Graph, Filters } from "./schema";
import { individualScore, collectiveScore, displayScore } from "./scoring";
import { positionNames } from "./questionnaire";
export type ExportMetadata = {
  schema: "n91-matchlab/1";
  author: string;
  created_at: string;
  filters: Filters;
  scoring: "pdf-1.1";
};
export type Archive = { metadata: ExportMetadata; graph: Graph };
export const checksum = (data: Uint8Array) =>
  createHash("sha256").update(data).digest("hex");
export function safeCell(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return /^[\s\u0000-\u001f]*[=+\-@]/.test(text) ? `'${text}` : text;
}
export function sheets(
  archive: Archive,
): Record<string, Record<string, unknown>[]> {
  const { graph: g, metadata } = archive;
  return {
    Joueurs: g.memberships.map((m) => {
      const p = g.players.find((p) => p.id === m.player_id);
      return {
        ...p,
        ...m,
        id_joueur: p?.id,
        id_appartenance: m.id,
        poste: p ? positionNames[p.usual_position] : "",
      };
    }),
    Matchs: g.matches.map((m) => ({
      ...m,
      note_collective: collectiveScore(m.collective),
      note_affichee: displayScore(collectiveScore(m.collective)),
    })),
    Évaluations: g.evaluations.map((e) => ({
      ...e,
      note_individuelle: individualScore(e.common, e.specific),
      note_affichee: displayScore(individualScore(e.common, e.specific)),
    })),
    Circonstances: g.matches.map((m) => ({
      match_id: m.id,
      ...m.circumstances,
    })),
    Réponses: g.evaluations.flatMap((e) => [
      ...Array.from({ length: 6 }, (_, i) => ({
        evaluation_id: e.id,
        match_id: e.match_id,
        player_id: e.player_id,
        version: e.questionnaire_version,
        groupe: "commun",
        question: `q${i + 1}`,
        valeur: e.common[`q${i + 1}`] ?? null,
        etat:
          `q${i + 1}` in e.common
            ? e.common[`q${i + 1}`] === null
              ? "non_observe"
              : "note"
            : "absent",
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        evaluation_id: e.id,
        match_id: e.match_id,
        player_id: e.player_id,
        version: e.questionnaire_version,
        groupe: "poste",
        question: `q${i + 1}`,
        valeur: e.specific[`q${i + 1}`] ?? null,
        etat:
          `q${i + 1}` in e.specific
            ? e.specific[`q${i + 1}`] === null
              ? "non_observe"
              : "note"
            : "absent",
      })),
    ]),
    "Repères vidéo": g.markers.map((m) => ({ ...m })),
    Métadonnées: [metadata],
  };
}
export function csv(archive: Archive, entity = "Évaluations") {
  const rows = sheets(archive)[entity];
  if (!rows) throw new Error("INVALID_DATA");
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const quote = (v: unknown) => `"${safeCell(v).replaceAll('"', '""')}"`;
  return (
    "\uFEFF" +
    [
      [
        "N91 MatchLab",
        archive.metadata.schema,
        archive.metadata.author,
        archive.metadata.created_at,
        JSON.stringify(archive.metadata.filters),
      ]
        .map(quote)
        .join(","),
      columns.map(quote).join(","),
      ...rows.map((row) => columns.map((c) => quote(row[c])).join(",")),
    ].join("\r\n")
  );
}
export async function xlsx(archive: Archive) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = archive.metadata.author;
  workbook.created = new Date(archive.metadata.created_at);
  for (const [name, rows] of Object.entries(sheets(archive))) {
    const sheet = workbook.addWorksheet(name);
    const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    sheet.columns = columns.map((key) => ({
      header: key,
      key,
      width: key.includes("id") ? 38 : 25,
    }));
    for (const row of rows)
      sheet.addRow(
        Object.fromEntries(
          columns.map((key) => [
            key,
            typeof row[key] === "number" ? row[key] : safeCell(row[key]),
          ]),
        ),
      );
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF163D68" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    if (columns.length)
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: Math.max(rows.length + 1, 1), column: columns.length },
      };
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
export function zipArchive(
  archive: Archive,
  media: Record<string, Uint8Array> = {},
) {
  const files: Record<string, Uint8Array> = {
    "data.json": strToU8(JSON.stringify(archive)),
    ...media,
  };
  const manifest = {
    schema: archive.metadata.schema,
    files: Object.entries(files).map(([path, data]) => ({
      path,
      bytes: data.length,
      sha256: checksum(data),
    })),
  };
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  return zipSync(files, { level: 6 });
}
export function readArchive(buffer: Uint8Array): {
  archive: Archive;
  files: Record<string, Uint8Array>;
} {
  if (buffer.length > 20 * 1024 * 1024) throw new Error("INVALID_ARCHIVE");
  const files: Record<string, Uint8Array> = {};
  let total = 0;
  let entries = 0;
  let failed = false;
  const unzip = new Unzip((file) => {
    entries++;
    if (
      entries > 500 ||
      !/^(data\.json|manifest\.json|media\/[0-9a-f-]{36}\.(png|jpg|pdf))$/.test(
        file.name,
      ) ||
      file.name in files
    ) {
      failed = true;
      return;
    }
    files[file.name] = new Uint8Array();
    const chunks: Uint8Array[] = [];
    let length = 0;
    if ((file.originalSize || 0) > 50 * 1024 * 1024) {
      failed = true;
      return;
    }
    file.ondata = (error, data, final) => {
      if (error) {
        failed = true;
        return;
      }
      length += data.length;
      total += data.length;
      if (total > 50 * 1024 * 1024) {
        failed = true;
        file.terminate();
        return;
      }
      chunks.push(data);
      if (final) {
        const output = new Uint8Array(length);
        let at = 0;
        for (const chunk of chunks) {
          output.set(chunk, at);
          at += chunk.length;
        }
        files[file.name] = output;
      }
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  try {
    for (let i = 0; i < buffer.length; i += 16384) {
      unzip.push(buffer.subarray(i, i + 16384), i + 16384 >= buffer.length);
      if (failed) throw new Error();
    }
  } catch {
    throw new Error("INVALID_ARCHIVE");
  }
  if (failed || !files["manifest.json"]?.length || !files["data.json"]?.length)
    throw new Error("INVALID_ARCHIVE");
  try {
    const manifest = JSON.parse(strFromU8(files["manifest.json"]));
    if (
      manifest.schema !== "n91-matchlab/1" ||
      !Array.isArray(manifest.files) ||
      manifest.files.length !== Object.keys(files).length - 1
    )
      throw new Error();
    const seen = new Set<string>();
    for (const entry of manifest.files) {
      if (
        seen.has(entry.path) ||
        entry.path === "manifest.json" ||
        !files[entry.path] ||
        files[entry.path].length !== entry.bytes ||
        checksum(files[entry.path]) !== entry.sha256
      )
        throw new Error();
      seen.add(entry.path);
    }
    const archive = JSON.parse(strFromU8(files["data.json"])) as Archive;
    if (archive.metadata.schema !== manifest.schema) throw new Error();
    return { archive, files };
  } catch {
    throw new Error("INVALID_ARCHIVE");
  }
}
export function copyGraph(graph: Graph): Graph {
  const ids = new Map<string, string>();
  for (const rows of Object.values(graph))
    for (const row of rows) ids.set(row.id, randomUUID());
  const remap = (value: unknown): unknown => {
    if (typeof value === "string") return ids.get(value) || value;
    if (Array.isArray(value)) return value.map(remap);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, v]) => [key, remap(v)]),
      );
    return value;
  };
  const copy = remap(graph) as Graph;
  copy.seasons = copy.seasons.map((s) => ({
    ...s,
    name: `${s.name} · copie ${s.id.slice(0, 8)}`,
  }));
  return copy;
}
