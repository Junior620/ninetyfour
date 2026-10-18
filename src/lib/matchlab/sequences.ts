import { SEQUENCE_ACTIONS, type Marker } from "./schema";

export type Indicator = {
  kind: Marker["kind"];
  total: number;
  success: number;
  fail: number;
  open: number;
  /** The sequences the indicator is computed from, oldest first. */
  sequences: Marker[];
};

/**
 * Counts per action, each backed by the sequences it comes from. Former marker kinds
 * follow the twelve actions. Nothing is estimated: unqualified sequences stay "open".
 */
export function sequenceIndicators(
  markers: Marker[],
  options: { playerId?: string | null; verifiedOnly?: boolean } = {},
): Indicator[] {
  const kept = markers
    .filter(
      (m) =>
        (options.playerId === undefined || m.player_id === options.playerId) &&
        (!options.verifiedOnly || m.verified),
    )
    .sort((a, b) => a.seconds - b.seconds);
  const order = [
    ...SEQUENCE_ACTIONS,
    "positive",
    "correction",
    "chance",
    "transition",
  ] as Marker["kind"][];
  return order
    .map((kind) => {
      const sequences = kept.filter((m) => m.kind === kind);
      return {
        kind,
        total: sequences.length,
        success: sequences.filter((m) => m.outcome === "success").length,
        fail: sequences.filter((m) => m.outcome === "fail").length,
        open: sequences.filter((m) => m.outcome === null).length,
        sequences,
      };
    })
    .filter((i) => i.total > 0);
}

/** mm:ss, or h:mm:ss beyond an hour; tabular in the UI. */
export function timecode(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Comma-separated N91 tags: trimmed, de-duplicated, at most ten of 30 characters. */
export function parseTags(input: string) {
  return [
    ...new Set(
      input
        .split(",")
        .map((t) => t.trim().slice(0, 30))
        .filter(Boolean),
    ),
  ].slice(0, 10);
}
