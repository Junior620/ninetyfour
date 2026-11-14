import { fr } from "@matchlab/messages";
import { POSITIONS, positionNames, type Position } from "@matchlab/questionnaire";
import { CATEGORIES } from "@matchlab/trials";
import type { Graph, Player } from "@matchlab/schema";
import { newestFirst } from "@matchlab/photos";

/** Labels come from the web catalogue (src/lib/matchlab/messages.ts): same words everywhere. */
export const t = fr;
export const positionOptions = POSITIONS.map((p) => ({ value: p, label: positionNames[p] }));
export const positionShortOptions = POSITIONS.map((p) => ({ value: p, label: p }));
export const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: c }));
export const footOptions = [
  { value: "right", label: fr.players.right },
  { value: "left", label: fr.players.left },
  { value: "both", label: fr.players.both },
] as const;
export const statusLabels: Record<Player["status"], string> = {
  active: fr.players.active,
  injured: fr.players.injured,
  inactive: fr.players.inactive,
  trial: fr.players.trial,
};
export const matchStatusLabels = { draft: "Brouillon", evaluated: "Évalué", reviewed: "Revu" } as const;
export const positionName = (p: Position) => positionNames[p];
export const footLabel = (f: Player["strong_foot"]) => footOptions.find((o) => o.value === f)?.label ?? f;

export function formatDate(day: string) {
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}
export function formatDateLong(day: string) {
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
export const today = () => new Date().toISOString().slice(0, 10);

/** Latest photo of a player, if this account may see media. */
export function photoOf(graph: Graph, playerId: string, allowed: boolean) {
  if (!allowed) return null;
  return newestFirst(graph.media.filter((m) => m.player_id === playerId && m.purpose === "photo"))[0]?.id ?? null;
}
