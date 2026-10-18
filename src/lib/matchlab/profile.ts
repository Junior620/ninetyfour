import { individualScore, mean } from "./scoring";
import {
  commonQuestions,
  specificQuestions,
  type Position,
} from "./questionnaire";
import type { Evaluation, Graph, Match, Player } from "./schema";

export type Period = { from?: string | null; to?: string | null };
export type HistoryRow = {
  match: Match;
  evaluation: Evaluation;
  score: number | null;
  jersey: number | null;
};
export type CriterionMean = {
  key: string;
  group: "common" | "specific";
  label: string;
  mean: number | null;
  answers: number;
};
export type PlayerProfile = {
  /** One row per evaluation, most recent match first. */
  history: HistoryRow[];
  sample: {
    matches: number;
    evaluations: number;
    scored: number;
    minutes: number;
    minutesUnknown: number;
    from: string | null;
    to: string | null;
  };
  /** Mean of the official individual scores (40/60 ×2), never re-weighted. */
  score: number | null;
  positions: { position: Position; matches: number; minutes: number }[];
  /** Specific criteria are those of the usual position, on evaluations at that position. */
  criteriaPosition: Position;
  criteria: CriterionMean[];
  /** Mean individual score per calendar month, oldest first. */
  progression: { period: string; score: number | null; matches: number }[];
};

const inPeriod = (date: string, period: Period) =>
  (!period.from || date >= period.from) && (!period.to || date <= period.to);

/**
 * Factual profile of a player over a period: what was observed, on how many matches and
 * minutes. Nothing is extrapolated; a criterion never answered stays without a mean.
 */
export function playerProfile(
  player: Player,
  graph: Pick<Graph, "matches" | "evaluations" | "memberships">,
  period: Period = {},
): PlayerProfile {
  const matches = new Map(graph.matches.map((m) => [m.id, m]));
  const history: HistoryRow[] = graph.evaluations
    .filter((e) => e.player_id === player.id)
    .map((evaluation) => ({ evaluation, match: matches.get(evaluation.match_id) }))
    .filter(
      (r): r is { evaluation: Evaluation; match: Match } =>
        !!r.match && inPeriod(r.match.played_on, period),
    )
    .map(({ evaluation, match }) => ({
      match,
      evaluation,
      score: individualScore(evaluation.common, evaluation.specific),
      jersey:
        graph.memberships.find(
          (m) =>
            m.player_id === player.id &&
            m.season_id === match.season_id &&
            m.category_id === match.category_id,
        )?.jersey ?? null,
    }))
    .sort(
      (a, b) =>
        b.match.played_on.localeCompare(a.match.played_on) ||
        a.evaluation.position.localeCompare(b.evaluation.position),
    );
  const matchIds = new Set(history.map((r) => r.match.id));
  const dates = history.map((r) => r.match.played_on).sort();
  const scores = history.map((r) => r.score);
  const positions = [
    ...new Set(history.map((r) => r.evaluation.position as Position)),
  ]
    .map((position) => {
      const rows = history.filter((r) => r.evaluation.position === position);
      return {
        position,
        matches: new Set(rows.map((r) => r.match.id)).size,
        minutes: rows.reduce((s, r) => s + (r.evaluation.minutes ?? 0), 0),
      };
    })
    .sort((a, b) => b.matches - a.matches || b.minutes - a.minutes);
  const criteriaPosition = player.usual_position as Position;
  const atPosition = history.filter(
    (r) => r.evaluation.position === criteriaPosition,
  );
  const criterion = (
    group: "common" | "specific",
    q: { id: string; label: string },
    rows: HistoryRow[],
  ): CriterionMean => {
    const values = rows
      .map((r) => (group === "common" ? r.evaluation.common : r.evaluation.specific)[q.id])
      .filter((v): v is number => typeof v === "number");
    return {
      key: `${group}:${q.id}`,
      group,
      label: q.label,
      mean: mean(values),
      answers: values.length,
    };
  };
  const months = [...new Set(history.map((r) => r.match.played_on.slice(0, 7)))].sort();
  return {
    history,
    sample: {
      matches: matchIds.size,
      evaluations: history.length,
      scored: scores.filter((s) => s !== null).length,
      minutes: history.reduce((s, r) => s + (r.evaluation.minutes ?? 0), 0),
      minutesUnknown: history.filter((r) => r.evaluation.minutes === null).length,
      from: dates[0] ?? null,
      to: dates.at(-1) ?? null,
    },
    score: mean(scores),
    positions,
    criteriaPosition,
    criteria: [
      ...commonQuestions.map((q) => criterion("common", q, history)),
      ...specificQuestions[criteriaPosition].map((q) =>
        criterion("specific", q, atPosition),
      ),
    ],
    progression: months.map((period) => {
      const rows = history.filter((r) => r.match.played_on.startsWith(period));
      return {
        period,
        score: mean(rows.map((r) => r.score)),
        matches: new Set(rows.map((r) => r.match.id)).size,
      };
    }),
  };
}
