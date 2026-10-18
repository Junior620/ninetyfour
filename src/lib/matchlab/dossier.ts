import { playerProfile } from "./profile";
import { sequenceIndicators, timecode } from "./sequences";
import type { Position } from "./questionnaire";
import { DOSSIER_SECTIONS, type Graph, type Marker, type Player } from "./schema";

export { DOSSIER_SECTIONS };
export type DossierSection = (typeof DOSSIER_SECTIONS)[number];
/** Internal notes, staff comments and the declared (possibly medical) status stay out unless chosen. */
export const SENSITIVE_SECTIONS: DossierSection[] = [
  "staff_comments",
  "scouting",
  "status",
];
export const DEFAULT_SECTIONS: DossierSection[] = DOSSIER_SECTIONS.filter(
  (s) => !SENSITIVE_SECTIONS.includes(s),
);

export type DossierDraft = {
  player_id: string;
  recipient: string;
  recipient_contact: string;
  period_from: string;
  period_to: string;
  sections: DossierSection[];
  strengths: string;
  development: string;
  sequence_ids: string[];
};

export type DossierSequence = {
  id: string;
  date: string;
  opponent: string;
  timecode: string;
  kind: Marker["kind"];
  outcome: Marker["outcome"];
  tags: string[];
};
/** Frozen at validation: the PDF is rendered from this content only. */
export type DossierContent = {
  version: 1;
  recipient: string;
  recipient_contact: string;
  generated_at: string;
  identity: {
    name: string;
    position: Position;
    foot: Player["strong_foot"];
    memberships: { season: string; category: string; jersey: number }[];
  };
  period: {
    from: string;
    to: string;
    matches: number;
    minutes: number;
    minutesUnknown: number;
  };
  photo?: true;
  positions?: { position: Position; matches: number; minutes: number }[];
  statistics?: {
    matches: number;
    evaluations: number;
    scored: number;
    score: number | null;
    indicators: {
      kind: Marker["kind"];
      success: number;
      fail: number;
      total: number;
    }[];
    verifiedSequences: number;
  };
  criteria?: {
    position: Position;
    rows: { key: string; label: string; mean: number | null; answers: number }[];
  };
  progression?: { period: string; score: number | null; matches: number }[];
  strengths?: string;
  development?: string;
  sequences?: DossierSequence[];
  staff_comments?: { date: string; opponent: string; text: string }[];
  scouting?: string;
  status?: Player["status"];
};

/** Verified sequences of the player inside the period, the only ones a dossier may cite. */
export function dossierSequences(
  playerId: string,
  graph: Pick<Graph, "matches" | "markers">,
  from: string,
  to: string,
): Marker[] {
  const matches = new Map(graph.matches.map((m) => [m.id, m]));
  return graph.markers
    .filter((m) => {
      const match = matches.get(m.match_id);
      return (
        m.player_id === playerId &&
        m.verified &&
        !!match &&
        match.played_on >= from &&
        match.played_on <= to
      );
    })
    .sort(
      (a, b) =>
        matches.get(a.match_id)!.played_on.localeCompare(matches.get(b.match_id)!.played_on) ||
        a.seconds - b.seconds,
    );
}

/**
 * Builds the dossier from the selected elements only. Every figure carries its period and
 * number of matches; sections that were not chosen are absent, not empty.
 */
export function dossierContent(
  draft: DossierDraft,
  graph: Pick<
    Graph,
    "players" | "matches" | "evaluations" | "memberships" | "markers" | "seasons"
  >,
  now = new Date(),
): DossierContent {
  const player = graph.players.find((p) => p.id === draft.player_id);
  if (!player) throw new Error("NOT_FOUND");
  const has = (s: DossierSection) => draft.sections.includes(s);
  const profile = playerProfile(player, graph, {
    from: draft.period_from,
    to: draft.period_to,
  });
  const matches = new Map(graph.matches.map((m) => [m.id, m]));
  const verified = dossierSequences(
    player.id,
    graph,
    draft.period_from,
    draft.period_to,
  );
  const chosen = verified.filter((m) => draft.sequence_ids.includes(m.id));
  const content: DossierContent = {
    version: 1,
    recipient: draft.recipient.trim(),
    recipient_contact: draft.recipient_contact.trim(),
    generated_at: now.toISOString(),
    identity: {
      name: player.full_name,
      position: player.usual_position as Position,
      foot: player.strong_foot,
      memberships: graph.memberships
        .filter((m) => m.player_id === player.id)
        .map((m) => ({
          season: graph.seasons.find((s) => s.id === m.season_id)?.name ?? "—",
          category: m.category_id,
          jersey: m.jersey,
        })),
    },
    period: {
      from: draft.period_from,
      to: draft.period_to,
      matches: profile.sample.matches,
      minutes: profile.sample.minutes,
      minutesUnknown: profile.sample.minutesUnknown,
    },
  };
  if (has("photo")) content.photo = true;
  if (has("positions")) content.positions = profile.positions;
  if (has("statistics"))
    content.statistics = {
      matches: profile.sample.matches,
      evaluations: profile.sample.evaluations,
      scored: profile.sample.scored,
      score: profile.score,
      indicators: sequenceIndicators(verified).map((i) => ({
        kind: i.kind,
        success: i.success,
        fail: i.fail,
        total: i.total,
      })),
      verifiedSequences: verified.length,
    };
  if (has("criteria"))
    content.criteria = {
      position: profile.criteriaPosition,
      rows: profile.criteria.map(({ key, label, mean, answers }) => ({
        key,
        label,
        mean,
        answers,
      })),
    };
  if (has("progression")) content.progression = profile.progression;
  if (has("strengths") && draft.strengths.trim())
    content.strengths = draft.strengths.trim();
  if (has("development") && draft.development.trim())
    content.development = draft.development.trim();
  if (has("sequences"))
    content.sequences = chosen.map((m) => ({
      id: m.id,
      date: matches.get(m.match_id)!.played_on,
      opponent: matches.get(m.match_id)!.opponent,
      timecode: timecode(m.seconds),
      kind: m.kind,
      outcome: m.outcome,
      tags: m.tags,
    }));
  if (has("staff_comments"))
    content.staff_comments = profile.history
      .flatMap((r) =>
        [r.evaluation.observation, r.evaluation.priorities]
          .filter((text) => text.trim())
          .map((text) => ({
            date: r.match.played_on,
            opponent: r.match.opponent,
            text: text.trim(),
          })),
      );
  if (has("scouting") && player.scouting.trim())
    content.scouting = player.scouting.trim();
  if (has("status")) content.status = player.status;
  return content;
}
