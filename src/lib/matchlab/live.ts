import type { LiveSession, Marker } from "./schema";

/** Regulation length of a half, in seconds; stoppage time keeps counting after it. */
export const HALF = 45 * 60;
type Phases = Pick<
  LiveSession,
  "status" | "first_half_at" | "half_time_at" | "second_half_at" | "finished_at"
>;
const at = (s: string | null) => (s ? Date.parse(s) : NaN);

/**
 * Match clock from the phase timestamps taken on the device. `elapsed` is continuous
 * observed time (the second half starts where the first really ended), so events of
 * the two halves never overlap even with stoppage time.
 */
export function liveClock(session: Phases, now: number) {
  const first = at(session.first_half_at);
  const halfTime = at(session.half_time_at);
  const second = at(session.second_half_at);
  const end = at(session.finished_at);
  const firstLength = Number.isFinite(halfTime)
    ? (halfTime - first) / 1000
    : Number.isFinite(end)
      ? (end - first) / 1000
      : null;
  let elapsed = 0;
  let half: 1 | 2 = 1;
  if (session.status === "first_half") elapsed = (now - first) / 1000;
  else if (session.status === "half_time") elapsed = firstLength ?? 0;
  else if (session.status === "second_half") {
    half = 2;
    elapsed = (firstLength ?? 0) + (now - second) / 1000;
  } else if (session.status === "finished") {
    half = Number.isFinite(second) ? 2 : 1;
    elapsed =
      half === 2 ? (firstLength ?? 0) + (end - second) / 1000 : (firstLength ?? 0);
  }
  elapsed = Math.max(0, elapsed);
  const inHalf = half === 1 ? elapsed : elapsed - (firstLength ?? 0);
  const minute = Math.min(150, (half === 2 ? 45 : 0) + Math.floor(inHalf / 60) + 1);
  return {
    elapsed,
    half,
    minute,
    /** Seconds within the current half, for the mm:ss display. */
    display: (half === 2 ? HALF : 0) + inHalf,
    firstLength,
    running: session.status === "first_half" || session.status === "second_half",
  };
}

/** 23', 45+2', 90+4' — the football way of writing a minute. */
export function minuteLabel(minute: number, half: 1 | 2) {
  const limit = half === 1 ? 45 : 90;
  return minute > limit ? `${limit}+${minute - limit}'` : `${minute}'`;
}

export type LiveStatus = "follow" | "confirm" | "work" | "insufficient";
export type KindCount = {
  kind: Marker["kind"];
  total: number;
  success: number;
  fail: number;
};
export type LivePlayerLine = {
  player_id: string;
  total: number;
  success: number;
  fail: number;
  open: number;
  kinds: KindCount[];
  status: LiveStatus;
};
export type LiveSummary = {
  version: 1;
  phase: "half_time" | "finished";
  generated_at: string;
  minutes: number;
  events: number;
  identified: number;
  unidentified: number;
  collective: KindCount[];
  /** Counts in the two parts of the period (halves at the final whistle). */
  trends: { kind: Marker["kind"]; before: number; after: number }[];
  players: LivePlayerLine[];
  standout: string | null;
  workAxes: { kind: Marker["kind"]; fail: number; qualified: number }[];
  observe: { player_id: string; kind: Marker["kind"] }[];
  presentWithoutEvent: number;
};

const count = (events: Marker[]): KindCount[] =>
  [...new Set(events.map((e) => e.kind))]
    .map((kind) => {
      const of = events.filter((e) => e.kind === kind);
      return {
        kind,
        total: of.length,
        success: of.filter((e) => e.outcome === "success").length,
        fail: of.filter((e) => e.outcome === "fail").length,
      };
    })
    .sort((a, b) => b.total - a.total || a.kind.localeCompare(b.kind));

/**
 * Status of a player over one match, never a verdict:
 * - fewer than 3 actions → "insufficient";
 * - at least 3 qualified actions with 70 % or more successful → "follow";
 * - at least 3 qualified actions with half or more to correct → "work";
 * - otherwise → "confirm".
 */
export function liveStatus(success: number, fail: number, total: number): LiveStatus {
  const qualified = success + fail;
  if (total < 3) return "insufficient";
  if (qualified >= 3 && success / qualified >= 0.7) return "follow";
  if (qualified >= 3 && fail / qualified >= 0.5) return "work";
  return "confirm";
}
const order: LiveStatus[] = ["follow", "confirm", "work", "insufficient"];

/** Rule-based summary of the live events, frozen at half time and at the final whistle. */
export function liveSummary(
  events: Marker[],
  options: {
    phase: "half_time" | "finished";
    elapsed: number;
    /** Where the period splits for trends: the end of the first half, or its middle. */
    split: number;
    present: string[];
    now?: Date;
  },
): LiveSummary {
  const identified = events.filter((e) => e.player_id);
  const players: LivePlayerLine[] = [...new Set(identified.map((e) => e.player_id!))]
    .map((player_id) => {
      const of = identified.filter((e) => e.player_id === player_id);
      const success = of.filter((e) => e.outcome === "success").length;
      const fail = of.filter((e) => e.outcome === "fail").length;
      return {
        player_id,
        total: of.length,
        success,
        fail,
        open: of.length - success - fail,
        kinds: count(of),
        status: liveStatus(success, fail, of.length),
      };
    })
    .sort(
      (a, b) =>
        order.indexOf(a.status) - order.indexOf(b.status) ||
        b.success - a.success ||
        b.total - a.total,
    );
  const collective = count(events);
  const trends = collective
    .map(({ kind }) => ({
      kind,
      before: events.filter((e) => e.kind === kind && e.seconds < options.split).length,
      after: events.filter((e) => e.kind === kind && e.seconds >= options.split).length,
    }))
    .filter((t) => Math.abs(t.after - t.before) >= 2);
  const follow = players.filter((p) => p.status === "follow");
  return {
    version: 1,
    phase: options.phase,
    generated_at: (options.now ?? new Date()).toISOString(),
    minutes: Math.round(options.elapsed / 60),
    events: events.length,
    identified: identified.length,
    unidentified: events.length - identified.length,
    collective,
    trends,
    players,
    standout: follow[0]?.player_id ?? null,
    workAxes: collective
      .filter((c) => c.fail >= 2)
      .map((c) => ({ kind: c.kind, fail: c.fail, qualified: c.success + c.fail }))
      .sort((a, b) => b.fail - a.fail)
      .slice(0, 3),
    observe: players
      .filter((p) => p.status === "confirm" || p.status === "insufficient")
      .filter((p) => p.kinds.length > 0)
      .slice(0, 5)
      .map((p) => ({ player_id: p.player_id, kind: p.kinds[0].kind })),
    presentWithoutEvent: options.present.filter(
      (id) => !players.some((p) => p.player_id === id),
    ).length,
  };
}
