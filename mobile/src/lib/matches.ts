import { FORMATIONS } from "@matchlab/formations";
import { individualScore, collectiveScore } from "@matchlab/scoring";
import type { Graph, Lineup, Match } from "@matchlab/schema";
import { today } from "./labels";

/** Match sheet of a game: the "matchday" scenario linked to it (starters + bench). */
export const matchdayLineup = (graph: Graph, matchId: string): Lineup | undefined =>
  graph.lineups
    .filter((l) => l.match_id === matchId && l.kind === "matchday")
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))[0];

export const starters = (lineup?: Lineup) =>
  lineup ? Object.values(lineup.slots).filter((s) => s.player_id).length : 0;
export const called = (lineup?: Lineup) => (lineup ? starters(lineup) + lineup.bench.length : 0);

/** Preparation checklist (cahier §04): what is still missing before kick-off. */
export function preparation(graph: Graph, match: Match) {
  const lineup = matchdayLineup(graph, match.id);
  const c = match.circumstances ?? {};
  const steps = [
    { key: "meeting", label: "Rencontre", done: !!match.opponent && !!match.played_on && !!c.ground },
    { key: "context", label: "Contexte", done: !!(c.weather || c.pitch || c.opposition || match.context) },
    { key: "squad", label: "Effectif convoqué", done: called(lineup) > 0 },
    {
      key: "plan",
      label: "Plan de jeu",
      done: !!lineup && starters(lineup) >= Math.min(11, FORMATIONS[lineup.formation].length),
    },
  ];
  return { steps, done: steps.filter((s) => s.done).length, total: steps.length, lineup };
}

export const upcoming = (graph: Graph) =>
  graph.matches.filter((m) => m.played_on >= today()).sort((a, b) => a.played_on.localeCompare(b.played_on));
export const past = (graph: Graph) =>
  graph.matches.filter((m) => m.played_on < today()).sort((a, b) => b.played_on.localeCompare(a.played_on));

export function scoreLine(match: Match) {
  if (match.home_score === null || match.away_score === null) return null;
  return `N91 ${match.home_score} – ${match.away_score} ${match.opponent}`;
}

/** Per-player 40/60 scores of a match, same formula as the web (scoring.ts). */
export function matchScores(graph: Graph, matchId: string) {
  return graph.evaluations
    .filter((e) => e.match_id === matchId)
    .map((e) => ({
      evaluation: e,
      player: graph.players.find((p) => p.id === e.player_id),
      score: individualScore(e.common, e.specific),
    }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
export const teamScore = (match: Match) => collectiveScore(match.collective ?? {});
