import { z } from "zod";
import { POSITIONS } from "./questionnaire";
import { GROUNDS, EVENTS } from "./circumstances";

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
export const markerSchema = z
  .object({
    ...base,
    match_id: id,
    player_id: id.nullable().default(null),
    seconds: z.number().min(0).max(86400),
    kind: z.enum(["positive", "correction", "chance", "transition"]),
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
  .strict();
export const consentSchema = z
  .object({
    ...base,
    player_id: id,
    guardian_name: text(120).min(2),
    purpose: z.enum(["internal_photo", "export_photo"]),
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
export const schemas = {
  matches: matchSchema,
  players: playerSchema,
  memberships: membershipSchema,
  evaluations: evaluationSchema,
  markers: markerSchema,
  consents: consentSchema,
  targets: targetSchema,
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
};
export type Consent = z.infer<typeof consentSchema> & {
  id: string;
  version: number;
};
export type Target = z.infer<typeof targetSchema> & {
  id: string;
  version: number;
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
};
export type Graph = {
  seasons: Season[];
  players: Player[];
  memberships: Membership[];
  matches: Match[];
  evaluations: Evaluation[];
  markers: Marker[];
  consents: Consent[];
  media: Media[];
  reports: Report[];
  targets: Target[];
};
