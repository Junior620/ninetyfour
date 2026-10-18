import {
  commonQuestions,
  specificQuestions,
  type Position,
} from "./questionnaire";
import type { Graph, Player, Requirement } from "./schema";

export type Category = Requirement["category_id"];
export const CATEGORIES: Category[] = ["U-14", "U-16", "U-17", "U-18"];
export const nextCategory = (c: Category): Category | null =>
  CATEGORIES[CATEGORIES.indexOf(c) + 1] ?? null;
export type CriterionStatus = "mastered" | "gap" | "unobserved" | "undefined";
export type Confidence = "insufficient" | "low" | "medium" | "high";
export type Proposal = "plan" | "confirm" | "progress" | "none";
export type CriterionRow = {
  key: string;
  group: "common" | "specific";
  label: string;
  mean: number | null;
  answers: number;
  level: number | null;
  status: CriterionStatus;
  delta: number | null;
};
export type TrialComparison = {
  criteria: CriterionRow[];
  sample: {
    matches: number;
    minutes: number;
    minutesUnknown: number;
    evaluations: number;
    atPosition: number;
    from: string | null;
    to: string | null;
  };
  defined: boolean;
  minMatches: number;
  confidence: Confidence;
  proposal: Proposal;
};

/**
 * Factual comparison of a player's recent evaluations with the requirements the
 * direction set for a category and position. The proposal is a rule, never a decision:
 * - no requirement defined → no proposal;
 * - fewer matches than required (or none) → "confirm";
 * - every required criterion met and observed → "plan";
 * - up to two gaps or unobserved required criteria → "confirm";
 * - otherwise → "progress".
 */
export function trialComparison(
  player: Player,
  graph: Pick<Graph, "evaluations" | "matches" | "requirements">,
  toCategory: Category,
  position: Position,
  lastMatches = 5,
): TrialComparison {
  const played = new Map(graph.matches.map((m) => [m.id, m.played_on]));
  const evaluations = graph.evaluations
    .filter((e) => e.player_id === player.id && played.has(e.match_id))
    .sort((a, b) =>
      played.get(b.match_id)!.localeCompare(played.get(a.match_id)!),
    );
  const recentMatches = [...new Set(evaluations.map((e) => e.match_id))].slice(
    0,
    lastMatches,
  );
  const recent = evaluations.filter((e) => recentMatches.includes(e.match_id));
  const atPosition = recent.filter((e) => e.position === position);
  const requirements = graph.requirements.filter(
    (r) => r.category_id === toCategory && r.position === position,
  );
  const levelOf = (key: string) =>
    requirements.find((r) => r.criterion === key)?.level ?? null;
  const row = (
    group: "common" | "specific",
    q: { id: string; label: string },
    source: typeof recent,
  ): CriterionRow => {
    const key = `${group}:${q.id}`;
    const values = source
      .map((e) => (group === "common" ? e.common : e.specific)[q.id])
      .filter((v): v is number => typeof v === "number");
    const mean = values.length
      ? values.reduce((s, v) => s + v, 0) / values.length
      : null;
    const level = levelOf(key);
    const status: CriterionStatus =
      level === null
        ? "undefined"
        : mean === null
          ? "unobserved"
          : mean >= level
            ? "mastered"
            : "gap";
    return {
      key,
      group,
      label: q.label,
      mean,
      answers: values.length,
      level,
      status,
      delta: level !== null && mean !== null ? mean - level : null,
    };
  };
  const criteria = [
    ...commonQuestions.map((q) => row("common", q, recent)),
    ...specificQuestions[position].map((q) => row("specific", q, atPosition)),
  ];
  const defined = criteria.some((c) => c.level !== null);
  const minMatches = Math.max(
    3,
    ...requirements.filter((r) => r.level !== null).map((r) => r.min_matches),
  );
  const dates = recentMatches.map((id) => played.get(id)!).sort();
  const matches = recentMatches.length;
  const confidence: Confidence =
    matches === 0
      ? "insufficient"
      : matches < minMatches
        ? "low"
        : matches < 5
          ? "medium"
          : "high";
  const gaps = criteria.filter((c) => c.status === "gap").length;
  const unobserved = criteria.filter((c) => c.status === "unobserved").length;
  const proposal: Proposal = !defined
    ? "none"
    : confidence === "insufficient" || confidence === "low"
      ? "confirm"
      : gaps + unobserved === 0
        ? "plan"
        : gaps + unobserved <= 2
          ? "confirm"
          : "progress";
  return {
    criteria,
    sample: {
      matches,
      minutes: recent.reduce((s, e) => s + (e.minutes ?? 0), 0),
      minutesUnknown: recent.filter((e) => e.minutes == null).length,
      evaluations: recent.length,
      atPosition: atPosition.length,
      from: dates[0] ?? null,
      to: dates[dates.length - 1] ?? null,
    },
    defined,
    minMatches,
    confidence,
    proposal,
  };
}
