import { z } from "zod";
import {
  playerSchema,
  membershipSchema,
  matchSchema,
  evaluationSchema,
  markerSchema,
  consentSchema,
  targetSchema,
  lineupSchema,
  requirementSchema,
  TRIAL_PROPOSALS,
  TRIAL_DECISIONS,
  filterSchema,
  type Graph,
} from "./schema";
import { POSITIONS } from "./questionnaire";
import { readArchive, copyGraph, checksum, type Archive } from "./export";
const version = { id: z.uuid(), version: z.number().int().positive() };
const match = matchSchema.extend({
  ...version,
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});
const player = playerSchema.extend({
  ...version,
  created_at: z.iso.datetime({ offset: true }).optional(),
  updated_at: z.iso.datetime({ offset: true }).optional(),
});
const evaluation = evaluationSchema.extend(version);
const marker = markerSchema.safeExtend({
  ...version,
  validated_by: z.uuid().nullable().optional(),
});
const video = z
  .object({
    ...version,
    match_id: z.uuid(),
    path: z.string().max(300),
    name: z.string().min(1).max(200),
    mime: z.enum(["video/mp4", "video/quicktime", "video/webm"]),
    bytes: z.number().int().positive(),
    duration_seconds: z.number().min(0).max(86400).nullable(),
    team_filmed: z.string().max(120),
    conditions: z.string().max(500),
    status: z.enum(["uploading", "ready"]),
    created_by: z.uuid().nullable(),
    created_at: z.iso.datetime({ offset: true }),
  })
  .strict();
const media = z
  .object({
    ...version,
    player_id: z.uuid(),
    consent_id: z.uuid(),
    path: z.string().max(500),
    mime: z.enum(["image/jpeg", "image/png", "application/pdf"]),
    purpose: z.enum(["photo", "proof"]),
    bytes: z.number().int().positive().max(10485760),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    created_at: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();
const graphSchema = z
  .object({
    seasons: z
      .array(
        z
          .object({
            ...version,
            name: z.string().min(2).max(100),
            starts_on: z.iso.date(),
            ends_on: z.iso.date(),
          })
          .strict(),
      )
      .max(100),
    players: z.array(player).max(5000),
    memberships: z
      .array(membershipSchema.extend({ ...version, player_id: z.uuid() }))
      .max(10000),
    matches: z.array(match).max(5000),
    evaluations: z.array(evaluation).max(10000),
    markers: z.array(marker).max(10000),
    videos: z.array(video).max(2000).default([]),
    consents: z.array(consentSchema.safeExtend(version)).max(10000),
    media: z.array(media).max(500),
    targets: z.array(targetSchema.extend(version)).max(1000),
    reports: z
      .array(
        z
          .object({
            id: z.uuid(),
            match_id: z.uuid(),
            revision: z.number().int().positive(),
            snapshot: z
              .object({
                match,
                players: z.array(player),
                evaluations: z.array(evaluation),
                markers: z.array(marker),
              })
              .strict(),
            correction: z.string().max(5000),
            created_by: z.uuid(),
            created_at: z.iso.datetime({ offset: true }),
            validated_by: z.uuid().nullable(),
            validated_at: z.iso.datetime({ offset: true }).nullable(),
            source_author: z.uuid().nullable().optional(),
          })
          .strict(),
      )
      .max(5000),
    lineups: z
      .array(
        lineupSchema.extend({
          ...version,
          created_at: z.iso.datetime({ offset: true }).optional(),
          updated_at: z.iso.datetime({ offset: true }).optional(),
        }),
      )
      .max(2000)
      .default([]),
    requirements: z
      .array(requirementSchema.extend(version))
      .max(1000)
      .default([]),
    trials: z
      .array(
        z
          .object({
            ...version,
            player_id: z.uuid(),
            from_category: z.enum(["U-14", "U-16", "U-17", "U-18"]),
            to_category: z.enum(["U-14", "U-16", "U-17", "U-18"]),
            position: z.enum(POSITIONS),
            proposal: z.enum(TRIAL_PROPOSALS),
            decision: z.enum(TRIAL_DECISIONS),
            reason: z.string().max(2000),
            snapshot: z.record(z.string(), z.unknown()),
            decided_by: z.uuid().nullable(),
            decided_at: z.iso.datetime({ offset: true }),
          })
          .strict(),
      )
      .max(5000)
      .default([]),
  })
  .strict();
export function validateArchive(bytes: Uint8Array, mode: "preserve" | "copy") {
  const unpacked = readArchive(bytes);
  const metadata = z
    .object({
      schema: z.literal("n91-matchlab/1"),
      author: z.string().max(200),
      created_at: z.iso.datetime(),
      filters: filterSchema,
      scoring: z.literal("pdf-1.1"),
    })
    .strict()
    .parse(unpacked.archive.metadata);
  const graph = graphSchema.parse(unpacked.archive.graph) as Graph;
  const ids = new Set<string>();
  for (const rows of Object.values(graph))
    for (const row of rows) {
      if (ids.has(row.id)) throw new Error("INVALID_ARCHIVE");
      ids.add(row.id);
    }
  const players = new Set(graph.players.map((p) => p.id));
  const matches = new Map(graph.matches.map((m) => [m.id, m]));
  const seasons = new Set(graph.seasons.map((s) => s.id));
  for (const m of graph.memberships)
    if (!players.has(m.player_id) || !seasons.has(m.season_id))
      throw new Error("INVALID_ARCHIVE");
  for (const m of graph.matches)
    if (!seasons.has(m.season_id)) throw new Error("INVALID_ARCHIVE");
  for (const e of [...graph.evaluations, ...graph.markers]) {
    const m = matches.get(e.match_id);
    if (
      !m ||
      (e.player_id &&
        !graph.memberships.some(
          (p) =>
            p.player_id === e.player_id &&
            p.category_id === m.category_id &&
            p.season_id === m.season_id,
        ))
    )
      throw new Error("INVALID_ARCHIVE");
  }
  const videos = new Set(graph.videos.map((v) => v.id));
  for (const v of graph.videos)
    if (!matches.has(v.match_id)) throw new Error("INVALID_ARCHIVE");
  for (const m of graph.markers)
    if (m.video_id && !videos.has(m.video_id)) throw new Error("INVALID_ARCHIVE");
  for (const c of graph.consents)
    if (!players.has(c.player_id)) throw new Error("INVALID_ARCHIVE");
  for (const r of graph.reports)
    if (
      !matches.has(r.match_id) ||
      r.snapshot.match.id !== r.match_id ||
      r.snapshot.players.some((p) => !players.has(p.id)) ||
      r.snapshot.markers.some(
        (m) =>
          m.match_id !== r.match_id ||
          (m.player_id !== null && !players.has(m.player_id)),
      ) ||
      r.snapshot.evaluations.some(
        (e) => !players.has(e.player_id) || e.match_id !== r.match_id,
      )
    )
      throw new Error("INVALID_ARCHIVE");
  const mediaFiles: Record<string, Uint8Array> = {};
  for (const m of graph.media) {
    const ext =
      m.mime === "image/png" ? "png" : m.mime === "image/jpeg" ? "jpg" : "pdf";
    const file = unpacked.files[`media/${m.id}.${ext}`];
    if (
      !file ||
      file.length !== m.bytes ||
      checksum(file) !== m.sha256 ||
      !graph.consents.some(
        (c) => c.id === m.consent_id && c.player_id === m.player_id,
      )
    )
      throw new Error("INVALID_ARCHIVE");
    mediaFiles[m.id] = file;
  }
  for (const target of graph.targets)
    if (!seasons.has(target.season_id)) throw new Error("INVALID_ARCHIVE");
  for (const l of graph.lineups)
    if (
      !seasons.has(l.season_id) ||
      (l.match_id && !matches.has(l.match_id)) ||
      [...Object.values(l.slots).map((s) => s.player_id), ...l.bench].some(
        (p) => p && !players.has(p),
      )
    )
      throw new Error("INVALID_ARCHIVE");
  for (const trial of graph.trials)
    if (!players.has(trial.player_id)) throw new Error("INVALID_ARCHIVE");
  const finalGraph = mode === "copy" ? copyGraph(graph) : graph;
  const files: Record<string, Uint8Array> = {};
  finalGraph.media.forEach(
    (m, i) => (files[m.id] = mediaFiles[graph.media[i].id]),
  );
  return {
    archive: { metadata, graph: finalGraph } as Archive,
    files,
    digest: checksum(bytes),
    counts: Object.fromEntries(
      Object.entries(finalGraph).map(([k, rows]) => [k, rows.length]),
    ),
  };
}
