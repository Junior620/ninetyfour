import type { Board } from "@matchlab/formations";
import type { Graph, Lineup } from "@matchlab/schema";
import { canUseMedia, type LabData } from "./lab";
import { photoOf } from "./labels";
import type { BoardPlayer } from "@/ui/Pitch";

/** Name, jersey and portrait of every player the account can see, for the pitch tokens. */
export function boardPlayers(data: LabData, seasonId?: string) {
  const media = canUseMedia(data);
  return new Map<string, BoardPlayer>(
    data.graph.players.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.full_name,
        jersey: data.graph.memberships.find((m) => m.player_id === p.id && (!seasonId || m.season_id === seasonId))?.jersey,
        photo: photoOf(data.graph, p.id, media),
      },
    ]),
  );
}
export const toBoard = (l: Pick<Lineup, "formation" | "slots" | "bench">): Board => ({
  formation: l.formation,
  slots: l.slots,
  bench: l.bench,
});
export const sameBoard = (a: Board, b: Board) => JSON.stringify(a) === JSON.stringify(b);
export const scenarios = (graph: Graph, seasonId: string, category: string) =>
  graph.lineups
    .filter((l) => l.season_id === seasonId && l.category_id === category && l.kind !== "matchday")
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
