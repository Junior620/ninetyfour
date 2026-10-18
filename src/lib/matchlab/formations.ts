import type { Position } from "./questionnaire";
import type { Lineup } from "./schema";

export type FormationId = Lineup["formation"];
/** Pitch slot: x across (0 left, 100 right), y from the opponent goal (0) to ours (100). */
export type Slot = { id: string; position: Position; x: number; y: number };
export const positionShort: Record<Position, string> = {
  GK: "GB",
  CB: "DC",
  FB: "LAT",
  DM: "MD",
  CM: "MC",
  AM: "MO",
  WG: "AIL",
  ST: "AC",
};
const back4: Slot[] = [
  { id: "gk", position: "GK", x: 50, y: 91 },
  { id: "lb", position: "FB", x: 13, y: 70 },
  { id: "lcb", position: "CB", x: 37, y: 75 },
  { id: "rcb", position: "CB", x: 63, y: 75 },
  { id: "rb", position: "FB", x: 87, y: 70 },
];
export const FORMATIONS: Record<FormationId, Slot[]> = {
  "4-3-3": [
    ...back4,
    { id: "dm", position: "DM", x: 50, y: 57 },
    { id: "lcm", position: "CM", x: 30, y: 45 },
    { id: "rcm", position: "CM", x: 70, y: 45 },
    { id: "lw", position: "WG", x: 15, y: 21 },
    { id: "st", position: "ST", x: 50, y: 14 },
    { id: "rw", position: "WG", x: 85, y: 21 },
  ],
  "4-4-2": [
    ...back4,
    { id: "lm", position: "WG", x: 13, y: 45 },
    { id: "lcm", position: "CM", x: 38, y: 50 },
    { id: "rcm", position: "CM", x: 62, y: 50 },
    { id: "rm", position: "WG", x: 87, y: 45 },
    { id: "lst", position: "ST", x: 38, y: 17 },
    { id: "rst", position: "ST", x: 62, y: 17 },
  ],
  "4-2-3-1": [
    ...back4,
    { id: "ldm", position: "DM", x: 37, y: 57 },
    { id: "rdm", position: "DM", x: 63, y: 57 },
    { id: "lw", position: "WG", x: 15, y: 33 },
    { id: "am", position: "AM", x: 50, y: 35 },
    { id: "rw", position: "WG", x: 85, y: 33 },
    { id: "st", position: "ST", x: 50, y: 14 },
  ],
  "3-5-2": [
    { id: "gk", position: "GK", x: 50, y: 91 },
    { id: "lcb", position: "CB", x: 28, y: 75 },
    { id: "ccb", position: "CB", x: 50, y: 77 },
    { id: "rcb", position: "CB", x: 72, y: 75 },
    { id: "lwb", position: "FB", x: 10, y: 49 },
    { id: "lcm", position: "CM", x: 32, y: 50 },
    { id: "dm", position: "DM", x: 50, y: 59 },
    { id: "rcm", position: "CM", x: 68, y: 50 },
    { id: "rwb", position: "FB", x: 90, y: 49 },
    { id: "lst", position: "ST", x: 38, y: 17 },
    { id: "rst", position: "ST", x: 62, y: 17 },
  ],
};
export type Placement = Lineup["slots"][string];
export type Board = Pick<Lineup, "formation" | "slots" | "bench">;
const empty = (): Placement => ({
  player_id: null,
  role: "",
  instructions: "",
});

/** Where a player currently is on the board: a slot id, "bench" or null (squad list). */
export function locate(board: Board, playerId: string) {
  const slot = Object.entries(board.slots).find(
    ([, s]) => s.player_id === playerId,
  )?.[0];
  if (slot) return slot;
  return board.bench.includes(playerId) ? "bench" : null;
}

/**
 * Moves a player to a slot, the bench or back to the squad list (null).
 * A player already in the target slot swaps with the moved one.
 */
export function move(
  board: Board,
  playerId: string,
  to: string | "bench" | null,
): Board {
  const from = locate(board, playerId);
  const slots = Object.fromEntries(
    Object.entries(board.slots).map(([k, v]) => [k, { ...v }]),
  );
  let bench = board.bench.filter((p) => p !== playerId);
  if (from && from !== "bench")
    slots[from] = { ...slots[from], player_id: null };
  if (to === "bench") bench = [...bench, playerId];
  else if (to) {
    const occupant = slots[to]?.player_id ?? null;
    slots[to] = { ...(slots[to] ?? empty()), player_id: playerId };
    if (occupant && occupant !== playerId) {
      if (from === "bench") bench = [...bench, occupant];
      else if (from) slots[from] = { ...slots[from], player_id: occupant };
      else bench = [...bench, occupant];
    }
  }
  return { ...board, slots, bench };
}

/**
 * Changes the formation and keeps everyone: same slot id first, then a free slot of the
 * same position, then any free slot; whoever is left goes to the bench.
 */
export function changeFormation(board: Board, formation: FormationId): Board {
  const target = FORMATIONS[formation];
  const slots: Lineup["slots"] = Object.fromEntries(
    target.map((s) => [s.id, empty()]),
  );
  const previous = FORMATIONS[board.formation];
  const placed = Object.entries(board.slots).filter(([, s]) => s.player_id);
  const rest: [string, Placement][] = [];
  for (const [id, placement] of placed)
    if (slots[id] && !slots[id].player_id) slots[id] = { ...placement };
    else rest.push([id, placement]);
  const free = () => target.filter((s) => !slots[s.id].player_id);
  const bench = [...board.bench];
  for (const [id, placement] of rest) {
    const position = previous.find((s) => s.id === id)?.position;
    const spot =
      free().find((s) => s.position === position) ?? free()[0] ?? null;
    if (spot) slots[spot.id] = { ...placement };
    else bench.push(placement.player_id!);
  }
  return { formation, slots, bench };
}

/** Differences between two scenarios, for the side-by-side comparison. */
export function compareBoards(a: Board, b: Board) {
  const where = (board: Board) => {
    const map = new Map<string, string>();
    for (const [slot, s] of Object.entries(board.slots))
      if (s.player_id) {
        const position = FORMATIONS[board.formation].find(
          (f) => f.id === slot,
        )?.position;
        map.set(s.player_id, position ?? slot);
      }
    for (const p of board.bench) map.set(p, "bench");
    return map;
  };
  const left = where(a);
  const right = where(b);
  const onlyA = [...left.keys()].filter((p) => !right.has(p));
  const onlyB = [...right.keys()].filter((p) => !left.has(p));
  const moved = [...left.keys()]
    .filter((p) => right.has(p) && right.get(p) !== left.get(p))
    .map((p) => ({ player: p, from: left.get(p)!, to: right.get(p)! }));
  return { onlyA, onlyB, moved, sameFormation: a.formation === b.formation };
}

export const emptyBoard = (formation: FormationId = "4-3-3"): Board => ({
  formation,
  slots: Object.fromEntries(FORMATIONS[formation].map((s) => [s.id, empty()])),
  bench: [],
});
