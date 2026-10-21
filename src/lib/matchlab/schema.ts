import { z } from "zod";
import { POSITIONS } from "./questionnaire";
import { GROUNDS, EVENTS } from "./circumstances";
import { FORMATIONS } from "./formations";

const id = z.uuid();
const text = (max = 5000) => z.string().trim().max(max);
const answer = z.number().int().min(1).max(5).nullable();
const answers = (n: number) =>
  z
    .record(z.string(), answer)
    .refine(
      (a) =>
        Object.keys(a).every(
          (k) => /^q[1-6]$/.test(k) && Number(k.slice(1)) <= n,
        ),
      "Question inconnue",
    );
export const commonSchema = answers(6);
export const positionSchema = answers(5);
export const fundamentalsSchema = z
  .object({
    technique: answer.optional(),
    tactical: answer.optional(),
    physical: answer.optional(),
    mental: answer.optional(),
  })
  .strict();
const scope = {
  season_id: id,
  category_id: z.enum(["U-14", "U-16", "U-17", "U-18"]),
};
const base = { id: id.optional() };
export const playerSchema = z
  .object({
    ...base,
    full_name: text(120).min(2),
    usual_position: z.enum(POSITIONS),
    strong_foot: z.enum(["right", "left", "both"]),
    status: z
      .enum(["active", "injured", "inactive", "trial"])
      .default("active"),
    scouting: text().default(""),
    fundamentals: fundamentalsSchema.default({}),
    target_profile: text(200).default(""),
  })
  .strict();
export const membershipSchema = z
  .object({
    ...base,
    ...scope,
    player_id: id.optional(),
    jersey: z.number().int().min(1).max(99),
  })
  .strict();
export const matchSchema = z
  .object({
    ...base,
    ...scope,
    opponent: text(160).min(2),
    played_on: z.iso.date(),
    competition: text(160).default(""),
    venue: text(160).default(""),
    home_score: z.number().int().min(0).max(99).nullable(),
    away_score: z.number().int().min(0).max(99).nullable(),
    status: z.enum(["draft", "evaluated", "reviewed"]).default("draft"),
    context: text().default(""),
    circumstances: z
      .object({
        match_type: text(100).optional(),
        ground: z.enum(GROUNDS).optional(),
        surface: text(100).optional(),
        opposition: text(100).optional(),
        pitch: text(100).optional(),
        weather: text(100).optional(),
        system: text(100).optional(),
        scenario: text(160).optional(),
        events: z
          .array(z.enum(EVENTS))
          .max(EVENTS.length)
          .refine((e) => new Set(e).size === e.length, "Événement en double")
          .optional(),
        travel: text(300).optional(),
        absences: text(1000).optional(),
        incidents: text(2000).optional(),
        duration: z.number().int().min(1).max(150).optional(),
      })
      .strict()
      .default({}),
    collective: positionSchema.default({}),
    video_name: text(255).nullable().optional(),
  })
  .strict();
export const evaluationSchema = z
  .object({
    ...base,
    match_id: id,
    player_id: id,
    position: z.enum(POSITIONS),
    questionnaire_version: z.literal("pdf-1.1").default("pdf-1.1"),
    common: commonSchema,
    specific: positionSchema,
    observation: text().default(""),
    priorities: text(2000).default(""),
    minutes: z.number().int().min(0).max(150).nullable(),
  })
  .strict();
/** The cahier's twelve actions, after the four original marker kinds. */
export const SEQUENCE_ACTIONS = [
  "pass",
  "control",
  "duel",
  "recovery",
  "loss",
  "shot",
  "run",
  "press",
  "cover",
  "reposition",
  "save",
  "buildup",
] as const;
export const MARKER_KINDS = [
  "positive",
  "correction",
  "chance",
  "transition",
  ...SEQUENCE_ACTIONS,
] as const;
export const markerSchema = z
  .object({
    ...base,
    match_id: id,
    player_id: id.nullable().default(null),
    seconds: z.number().min(0).max(86400),
    end_seconds: z.number().min(0).max(86400).nullable().default(null),
    kind: z.enum(MARKER_KINDS),
    outcome: z.enum(["success", "fail"]).nullable().default(null),
    tags: z.array(text(30).min(1)).max(10).default([]),
    verified: z.boolean().default(false),
    source: z.enum(["manual", "live", "ai"]).default("manual"),
    video_id: id.nullable().default(null),
    minute: z.number().int().min(0).max(150).nullable().default(null),
    position: z.enum(POSITIONS).nullable().default(null),
    theme: z
      .enum([
        "",
        "Technique",
        "Placement",
        "Vitesse",
        "Décision",
        "Duels",
        "Finition",
        "Comportement",
      ])
      .default(""),
    observation: text().default(""),
  })
  .strict()
  .refine(
    (m) => m.end_seconds === null || m.end_seconds >= m.seconds,
    "Fin avant le début",
  );
export const consentSchema = z
  .object({
    ...base,
    player_id: id,
    guardian_name: text(120).min(2),
    purpose: z.enum(["internal_photo", "export_photo", "dossier_share"]),
    policy: text(2000).min(5),
    granted_at: z.iso.datetime({ offset: true }),
    expires_at: z.iso.datetime({ offset: true }),
    revoked_at: z.iso.datetime({ offset: true }).nullable().default(null),
  })
  .strict()
  .refine(
    (v) => v.expires_at > v.granted_at,
    "La date d’expiration doit être postérieure au consentement.",
  );
export const targetSchema = z
  .object({
    ...base,
    ...scope,
    position: z.enum(POSITIONS),
    title: text(160).min(2),
    fundamentals: fundamentalsSchema,
    notes: text().default(""),
  })
  .strict();
export const LINEUP_KINDS = [
  "team",
  "rotation",
  "alternative",
  "matchday",
] as const;
export const FORMATION_IDS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2"] as const;
const slotSchema = z
  .object({
    player_id: id.nullable().default(null),
    role: text(80).default(""),
    instructions: text(500).default(""),
  })
  .strict();
// Action simulations saved with a scenario: drawn steps and opponent markers.
export const SIM_ACTIONS = ["pass", "shot", "carry", "run"] as const;
const slotId = z.string().regex(/^[a-z0-9-]{1,16}$/);
const coordinate = z.number().min(-10).max(110);
const simulationSchema = z
  .object({
    id: id,
    name: text(80).min(1),
    formation: z.enum(FORMATION_IDS),
    holder: slotId.nullable(),
    steps: z
      .array(
        z
          .object({
            action: z.enum(SIM_ACTIONS),
            from: slotId,
            to: slotId.nullable(),
            path: z
              .array(z.tuple([coordinate, coordinate]))
              .min(2)
              .max(200),
          })
          .strict(),
      )
      .max(40),
    opponents: z
      .array(
        z
          .object({
            id: z.string().regex(/^o[0-9]{1,2}$/),
            label: text(4).min(1),
            x: coordinate,
            y: coordinate,
          })
          .strict(),
      )
      .max(11),
  })
  .strict()
  .superRefine((sim, ctx) => {
    // Steps name the posts of the formation the simulation was drawn on.
    const posts = new Set(FORMATIONS[sim.formation].map((p) => p.id));
    const valid =
      (sim.holder === null || posts.has(sim.holder)) &&
      sim.steps.every(
        (s) =>
          posts.has(s.from) &&
          (s.action === "pass"
            ? !!s.to && posts.has(s.to) && s.to !== s.from
            : s.to === null),
      ) &&
      new Set(sim.opponents.map((o) => o.id)).size === sim.opponents.length;
    if (!valid)
      ctx.addIssue({ code: "custom", message: "Simulation invalide" });
  });
export type Simulation = z.infer<typeof simulationSchema>;
export const lineupSchema = z
  .object({
    ...base,
    ...scope,
    name: text(120).min(2),
    kind: z.enum(LINEUP_KINDS).default("team"),
    formation: z.enum(FORMATION_IDS),
    slots: z
      .record(z.string().regex(/^[a-z0-9-]{1,16}$/), slotSchema)
      .default({}),
    bench: z.array(id).max(30).default([]),
    notes: text(2000).default(""),
    match_id: id.nullable().default(null),
    // Optional so a scenario saved before the column exists keeps working.
    simulations: z
      .array(simulationSchema)
      .max(12)
      .refine(
        (list) => new Set(list.map((x) => x.id)).size === list.length,
        "Simulation en double",
      )
      .refine(
        (list) => JSON.stringify(list).length <= 300000,
        "Simulations trop volumineuses",
      )
      .optional(),
  })
  .strict();
export const requirementSchema = z
  .object({
    ...base,
    category_id: scope.category_id,
    position: z.enum(POSITIONS),
    criterion: z.string().regex(/^(common:q[1-6]|specific:q[1-5])$/),
    level: z.number().int().min(1).max(5).nullable(),
    min_matches: z.number().int().min(1).max(20).default(3),
  })
  .strict();
export const TRIAL_PROPOSALS = ["plan", "confirm", "progress", "none"] as const;
export const TRIAL_DECISIONS = [
  "plan",
  "confirm",
  "progress",
  "dismissed",
] as const;
export const trialSchema = z
  .object({
    ...base,
    player_id: id,
    from_category: scope.category_id,
    to_category: scope.category_id,
    position: z.enum(POSITIONS),
    proposal: z.enum(TRIAL_PROPOSALS),
    decision: z.enum(TRIAL_DECISIONS),
    reason: text(2000).default(""),
    snapshot: z.record(z.string(), z.unknown()).default({}),
  })
  .strict()
  .refine(
    (t) =>
      t.decision === t.proposal ||
      t.decision === "dismissed" ||
      t.reason.length >= 3,
    "Motif requis",
  );
/** Elements a club dossier can carry; identity and period are always included. */
export const DOSSIER_SECTIONS = [
  "photo",
  "positions",
  "statistics",
  "criteria",
  "progression",
  "strengths",
  "development",
  "sequences",
  "staff_comments",
  "scouting",
  "status",
] as const;
const day = z.iso.date();
export const dossierSchema = z
  .object({
    player_id: id,
    recipient: text(160).min(2),
    recipient_contact: text(200).default(""),
    period_from: day,
    period_to: day,
    sections: z
      .array(z.enum(DOSSIER_SECTIONS))
      .max(DOSSIER_SECTIONS.length)
      .refine((s) => new Set(s).size === s.length, "Élément en double"),
    strengths: text(2000).default(""),
    development: text(2000).default(""),
    sequence_ids: z.array(id).max(30).default([]),
  })
  .strict()
  .refine((d) => d.period_to >= d.period_from, "Période invalide");
export const LIVE_PHASES = [
  "ready",
  "first_half",
  "half_time",
  "second_half",
  "finished",
] as const;
const stamp = z.iso.datetime({ offset: true }).nullable().default(null);
export const liveNoteSchema = z
  .object({
    minute: z.number().int().min(0).max(150),
    text: text(500).min(1),
    at: z.iso.datetime({ offset: true }),
  })
  .strict();
/** Always saved whole: a missing field would reset a frozen summary. */
export const liveSessionSchema = z
  .object({
    ...base,
    match_id: id,
    status: z.enum(LIVE_PHASES),
    present: z.array(id).max(60).default([]),
    first_half_at: stamp,
    half_time_at: stamp,
    second_half_at: stamp,
    finished_at: stamp,
    notes: z.array(liveNoteSchema).max(300).default([]),
    half_summary: z.record(z.string(), z.unknown()).nullable().default(null),
    final_summary: z.record(z.string(), z.unknown()).nullable().default(null),
  })
  .strict();
export const PLAN_BLOCKS = ["high", "mid", "low"] as const;
export const priorityItemSchema = z
  .object({
    objective: text(200).min(2),
    exercise: text(500).default(""),
    category: scope.category_id,
    indicator: text(300).default(""),
    source: text(300).default(""),
  })
  .strict();
export const planSchema = z
  .object({
    ...base,
    match_id: id,
    rank: z.number().int().min(1).max(3),
    title: text(120).min(2),
    lineup_id: id.nullable().default(null),
    block: z.enum(PLAN_BLOCKS).nullable().default(null),
    with_ball: text(2000).default(""),
    without_ball: text(2000).default(""),
    transitions: text(2000).default(""),
    set_pieces: text(2000).default(""),
    scenarios: z
      .array(
        z
          .object({ trigger: text(300).min(2), change: text(500).min(2) })
          .strict(),
      )
      .max(6)
      .default([]),
    reasons: text(2000).default(""),
    opponent_notes: text(2000).default(""),
    priorities: z.array(priorityItemSchema).max(5).default([]),
    review: z
      .object({
        applied: z.enum(["yes", "partly", "no"]).nullable(),
        notes: text(2000).default(""),
        adjust: text(2000).default(""),
      })
      .strict()
      .nullable()
      .default(null),
  })
  .strict();
export const schemas = {
  matches: matchSchema,
  players: playerSchema,
  memberships: membershipSchema,
  evaluations: evaluationSchema,
  markers: markerSchema,
  consents: consentSchema,
  targets: targetSchema,
  lineups: lineupSchema,
  requirements: requirementSchema,
  trials: trialSchema,
  live_sessions: liveSessionSchema,
  plans: planSchema,
};
export type Resource = keyof typeof schemas;
export const filterSchema = z
  .object({
    season: id.optional(),
    category: z.enum(["U-14", "U-16", "U-17", "U-18"]).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    match: id.optional(),
    player: id.optional(),
    position: z.enum(POSITIONS).optional(),
    q: text(160).optional(),
    status: z.enum(["draft", "evaluated", "reviewed"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
  })
  .strict();
export type Filters = z.infer<typeof filterSchema>;
export type Player = z.infer<typeof playerSchema> & {
  id: string;
  version: number;
  updated_at?: string;
};
export type Membership = z.infer<typeof membershipSchema> & {
  id: string;
  player_id: string;
  version: number;
};
export type Match = z.infer<typeof matchSchema> & {
  id: string;
  version: number;
  created_at: string;
  updated_at: string;
};
export type Evaluation = z.infer<typeof evaluationSchema> & {
  id: string;
  version: number;
};
export type Marker = z.infer<typeof markerSchema> & {
  id: string;
  version: number;
  validated_by?: string | null;
};
export type Video = {
  id: string;
  match_id: string;
  path: string;
  name: string;
  mime: "video/mp4" | "video/quicktime" | "video/webm";
  bytes: number;
  duration_seconds: number | null;
  team_filmed: string;
  conditions: string;
  status: "uploading" | "ready";
  created_by: string | null;
  created_at: string;
  version: number;
};
export type Consent = z.infer<typeof consentSchema> & {
  id: string;
  version: number;
};
export type Target = z.infer<typeof targetSchema> & {
  id: string;
  version: number;
};
export type Lineup = z.infer<typeof lineupSchema> & {
  id: string;
  version: number;
  created_at?: string;
  updated_at?: string;
};
export type Requirement = z.infer<typeof requirementSchema> & {
  id: string;
  version: number;
};
export type Trial = z.infer<typeof trialSchema> & {
  id: string;
  version: number;
  decided_by: string | null;
  decided_at: string;
};
export type Dossier = z.infer<typeof dossierSchema> & {
  id: string;
  version: number;
  status: "draft" | "validated" | "withdrawn";
  content: import("./dossier").DossierContent | null;
  prepared_by: string | null;
  prepared_at: string;
  validated_by: string | null;
  validated_at: string | null;
  withdrawn_at: string | null;
};
export type LiveSession = Omit<
  z.infer<typeof liveSessionSchema>,
  "half_summary" | "final_summary"
> & {
  id: string;
  version: number;
  half_summary: import("./live").LiveSummary | null;
  final_summary: import("./live").LiveSummary | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type Plan = z.infer<typeof planSchema> & {
  id: string;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type Season = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  version: number;
};
export type Member = {
  user_id: string;
  role: "direction" | "staff" | "reader";
  active: boolean;
  permissions: string[];
  version: number;
};
export type Report = {
  id: string;
  match_id: string;
  revision: number;
  correction: string;
  created_at: string;
  created_by: string;
  validated_at: string | null;
  validated_by: string | null;
  snapshot: {
    match: Match;
    players: Player[];
    evaluations: Evaluation[];
    markers: Marker[];
  };
};
export type Media = {
  id: string;
  player_id: string;
  consent_id: string;
  path: string;
  mime: string;
  purpose: "photo" | "proof";
  bytes: number;
  sha256: string;
  version: number;
  created_at?: string;
};
export type Graph = {
  seasons: Season[];
  players: Player[];
  memberships: Membership[];
  matches: Match[];
  evaluations: Evaluation[];
  markers: Marker[];
  videos: Video[];
  consents: Consent[];
  media: Media[];
  reports: Report[];
  targets: Target[];
  lineups: Lineup[];
  requirements: Requirement[];
  trials: Trial[];
  dossiers: Dossier[];
  live_sessions: LiveSession[];
  plans: Plan[];
};
