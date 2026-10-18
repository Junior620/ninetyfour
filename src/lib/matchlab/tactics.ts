import { individualScore, mean } from "./scoring";
import { collectiveQuestions, type Position } from "./questionnaire";
import { fr as t } from "./messages";
import type { Graph, Marker, Match, Plan } from "./schema";

type TacticsGraph = Pick<
  Graph,
  "players" | "memberships" | "matches" | "evaluations" | "markers" | "lineups"
>;
export const RECENT = 5;
const AVAILABLE = new Set(["active", "trial"]);
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
const decimal = (v: number) => v.toFixed(1).replace(".", ",");

export type CollectiveAxis = {
  id: string;
  label: string;
  mean: number | null;
  answers: number;
  /** 4 and above: point of support; 2.5 and below: area to protect. */
  tag: "support" | "protect" | null;
};
export type TacticalInputs = {
  /** Previous matches of the same season and category, most recent first. */
  recent: Match[];
  squad: {
    total: number;
    available: string[];
    unavailable: { player_id: string; status: string }[];
    byPosition: { position: Position; available: number; versatile: string[] }[];
  };
  form: { player_id: string; mean: number | null; matches: number }[];
  collective: CollectiveAxis[];
  sequences: {
    total: number;
    byKind: { kind: Marker["kind"]; success: number; fail: number; total: number }[];
  };
  opponent: { observed: boolean; matches: Match[] };
};

/**
 * What the staff knows before a match, each figure with its sample. Recent matches are the
 * five previous ones of the same season and category; an opponent counts as observed only
 * if an earlier match against it holds collective answers, evaluations or sequences.
 */
export function tacticalInputs(match: Match, graph: TacticsGraph): TacticalInputs {
  const recent = graph.matches
    .filter(
      (m) =>
        m.id !== match.id &&
        m.season_id === match.season_id &&
        m.category_id === match.category_id &&
        m.played_on < match.played_on,
    )
    .sort((a, b) => b.played_on.localeCompare(a.played_on))
    .slice(0, RECENT);
  const recentIds = new Set(recent.map((m) => m.id));
  const members = graph.memberships.filter(
    (m) => m.season_id === match.season_id && m.category_id === match.category_id,
  );
  const players = members
    .map((m) => graph.players.find((p) => p.id === m.player_id))
    .filter((p) => !!p);
  const available = players.filter((p) => AVAILABLE.has(p.status));
  const evaluations = graph.evaluations.filter((e) => recentIds.has(e.match_id));
  const played = (playerId: string) =>
    new Set(evaluations.filter((e) => e.player_id === playerId).map((e) => e.position));
  const byPosition = (
    ["GK", "CB", "FB", "DM", "CM", "AM", "WG", "ST"] as Position[]
  ).map((position) => ({
    position,
    available: available.filter((p) => p.usual_position === position).length,
    versatile: available
      .filter((p) => p.usual_position !== position && played(p.id).has(position))
      .map((p) => p.id),
  }));
  const form = available
    .map((p) => {
      const scores = evaluations
        .filter((e) => e.player_id === p.id)
        .map((e) => individualScore(e.common, e.specific));
      return {
        player_id: p.id,
        mean: mean(scores),
        matches: new Set(
          evaluations.filter((e) => e.player_id === p.id).map((e) => e.match_id),
        ).size,
      };
    })
    .filter((f) => f.matches > 0)
    .sort((a, b) => (b.mean ?? -1) - (a.mean ?? -1));
  const collective = collectiveQuestions.map((q) => {
    const values = recent
      .map((m) => m.collective[q.id])
      .filter((v): v is number => typeof v === "number");
    const m = mean(values);
    return {
      id: q.id,
      label: q.label,
      mean: m,
      answers: values.length,
      tag:
        m === null || values.length < 2
          ? null
          : m >= 4
            ? ("support" as const)
            : m <= 2.5
              ? ("protect" as const)
              : null,
    };
  });
  const markers = graph.markers.filter((m) => recentIds.has(m.match_id));
  const kinds = [...new Set(markers.map((m) => m.kind))];
  const earlier = graph.matches.filter(
    (m) =>
      m.id !== match.id &&
      m.played_on < match.played_on &&
      norm(m.opponent) === norm(match.opponent) &&
      (Object.keys(m.collective).length > 0 ||
        graph.evaluations.some((e) => e.match_id === m.id) ||
        graph.markers.some((k) => k.match_id === m.id)),
  );
  return {
    recent,
    squad: {
      total: players.length,
      available: available.map((p) => p.id),
      unavailable: players
        .filter((p) => !AVAILABLE.has(p.status))
        .map((p) => ({ player_id: p.id, status: p.status })),
      byPosition,
    },
    form,
    collective,
    sequences: {
      total: markers.length,
      byKind: kinds
        .map((kind) => {
          const of = markers.filter((m) => m.kind === kind);
          return {
            kind,
            success: of.filter((m) => m.outcome === "success").length,
            fail: of.filter((m) => m.outcome === "fail").length,
            total: of.length,
          };
        })
        .sort((a, b) => b.total - a.total),
    },
    opponent: { observed: earlier.length > 0, matches: earlier },
  };
}

export type Missing =
  | "no_plan"
  | "no_alternative"
  | "no_lineup"
  | "no_reasons"
  | "opponent_unknown"
  | "few_matches"
  | "no_goalkeeper"
  | "context"
  | "priorities";
/** Missing information, shown next to the plans instead of being guessed. */
export function missingInformation(
  match: Match,
  inputs: TacticalInputs,
  plans: Plan[],
): Missing[] {
  const main = plans.find((p) => p.rank === 1);
  const evaluated = inputs.recent.filter((m) => Object.keys(m.collective).length > 0);
  const c = match.circumstances ?? {};
  const missing: Missing[] = [];
  if (!main) missing.push("no_plan");
  if (plans.length < 2) missing.push("no_alternative");
  if (main && !main.lineup_id) missing.push("no_lineup");
  if (main && !main.reasons.trim()) missing.push("no_reasons");
  if (!inputs.opponent.observed) missing.push("opponent_unknown");
  if (evaluated.length < 3) missing.push("few_matches");
  if (!inputs.squad.byPosition.find((p) => p.position === "GK")?.available)
    missing.push("no_goalkeeper");
  if (!c.ground || !c.weather || !c.match_type) missing.push("context");
  if ((main?.priorities.length ?? 0) < 3) missing.push("priorities");
  return missing;
}

/**
 * Training priorities drawn from observations only: collective axes at 2.5/5 or below,
 * then actions corrected at least half the time on four or more qualified sequences.
 * Each one cites its source; the exercise is left to the staff.
 */
export function suggestPriorities(
  inputs: TacticalInputs,
  category: Match["category_id"],
): Plan["priorities"] {
  const n = inputs.recent.length;
  const fromAxes = inputs.collective
    .filter((a) => a.tag === "protect")
    .sort((a, b) => (a.mean ?? 5) - (b.mean ?? 5))
    .map((a) => ({
      objective: `${t.tactics.suggest.improve} ${a.label.toLowerCase()}`,
      exercise: "",
      category,
      indicator: `${a.label} ≥ 3/5 ${t.tactics.suggest.collectiveIndicator}`,
      source: `${a.label} : ${decimal(a.mean!)}/5 ${t.tactics.suggest.over} ${a.answers} ${t.tactics.matches}`,
    }));
  const fromActions = inputs.sequences.byKind
    .filter((k) => k.success + k.fail >= 4 && k.fail / (k.success + k.fail) >= 0.5)
    .map((k) => {
      const label = t.analysis.markerTypes[k.kind];
      return {
        objective: `${t.tactics.suggest.secure} ${label.toLowerCase()}`,
        exercise: "",
        category,
        indicator: `${label} : ≥ 60 % ${t.tactics.suggest.successIndicator}`,
        source: `${label} : ${k.success}/${k.success + k.fail} ${t.sequences.successRate} ${t.tactics.suggest.over} ${n} ${t.tactics.matches}`,
      };
    });
  return [...fromAxes, ...fromActions].slice(0, 5);
}

/** After the match: what was planned against what was observed. */
export function planReview(
  match: Match,
  plan: Plan | undefined,
  inputs: TacticalInputs,
  graph: TacticsGraph,
) {
  const lineup = plan?.lineup_id
    ? graph.lineups.find((l) => l.id === plan.lineup_id)
    : undefined;
  const starters = lineup
    ? Object.values(lineup.slots)
        .map((s) => s.player_id)
        .filter((p): p is string => !!p)
    : [];
  const playedIds = new Set(
    graph.evaluations.filter((e) => e.match_id === match.id).map((e) => e.player_id),
  );
  const markers = graph.markers.filter((m) => m.match_id === match.id);
  return {
    observed: playedIds.size > 0 || Object.keys(match.collective).length > 0,
    starters: starters.length,
    startersWhoPlayed: starters.filter((p) => playedIds.has(p)).length,
    notPlanned: [...playedIds].filter(
      (p) => !starters.includes(p) && !(lineup?.bench ?? []).includes(p),
    ),
    collective: inputs.collective.map((a) => ({
      label: a.label,
      before: a.mean,
      after:
        typeof match.collective[a.id] === "number"
          ? (match.collective[a.id] as number)
          : null,
    })),
    sequences: markers.length,
  };
}
