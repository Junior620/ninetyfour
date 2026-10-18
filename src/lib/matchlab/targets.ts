import type { Graph, Player, Target } from "./schema";

export const FUNDAMENTALS = [
  "technique",
  "tactical",
  "physical",
  "mental",
] as const;
export type Fundamental = (typeof FUNDAMENTALS)[number];
export type TargetGap =
  | { status: "none" }
  | { status: "unrated"; target: Target; unrated: Fundamental[] }
  | {
      status: "ok" | "gaps";
      target: Target;
      gaps: Fundamental[];
      unrated: Fundamental[];
    };

/**
 * Factual comparison with the target profile of the player's latest season,
 * category and usual position: no percentage, no recommendation.
 */
export function targetGaps(
  player: Player,
  graph: Pick<Graph, "memberships" | "seasons" | "targets">,
): TargetGap {
  const start = (id: string) =>
    graph.seasons.find((s) => s.id === id)?.starts_on ?? "";
  const target = graph.memberships
    .filter((m) => m.player_id === player.id)
    .sort((a, b) => start(b.season_id).localeCompare(start(a.season_id)))
    .map((m) =>
      graph.targets.find(
        (t) =>
          t.season_id === m.season_id &&
          t.category_id === m.category_id &&
          t.position === player.usual_position,
      ),
    )
    .find(Boolean);
  if (!target) return { status: "none" };
  const expected = FUNDAMENTALS.filter((k) => target.fundamentals[k] != null);
  if (!expected.length) return { status: "none" };
  const unrated = expected.filter((k) => player.fundamentals[k] == null);
  const gaps = expected.filter(
    (k) =>
      player.fundamentals[k] != null &&
      player.fundamentals[k]! < target.fundamentals[k]!,
  );
  if (unrated.length === expected.length)
    return { status: "unrated", target, unrated };
  return { status: gaps.length ? "gaps" : "ok", target, gaps, unrated };
}
