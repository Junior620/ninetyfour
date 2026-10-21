/**
 * Action simulation on the tactical board: paths drawn from a player are read as a
 * pass, a shot, a carry or a run, then replayed. Opponents are markers the staff
 * places; they never move during a replay.
 * Points use the slot frame: x across (0 left, 100 right), y from the opponent goal
 * (0) to ours (100).
 */
export type Point = { x: number; y: number };
export type SimAction = "pass" | "shot" | "carry" | "run";
export type SimStep = {
  action: SimAction;
  /** Slot id of the player who moves or plays the ball. */
  from: string;
  /** Receiver of a pass. */
  to: string | null;
  path: Point[];
};
export type SimState = {
  positions: Record<string, Point>;
  /** Slot id of the player with the ball; null once it is in the goal. */
  holder: string | null;
  ball: Point;
  scored: boolean;
};

export const MAX_STEPS = 40;
// The pitch is drawn 68 wide for 100 long: distances use those units.
const WIDTH = 0.68;
/** A drawn path ending this close to a team-mate is a pass to them. */
export const CATCH = 7;
/** Shorter than this, a gesture is a tap, not a path. */
export const MIN_PATH = 3;
// Units per second at normal speed.
const SPEED: Record<SimAction, number> = {
  pass: 60,
  shot: 80,
  carry: 24,
  run: 26,
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const round = (v: number) => Math.round(v * 10) / 10;
export const distance = (a: Point, b: Point) =>
  Math.hypot((a.x - b.x) * WIDTH, a.y - b.y);
const lerp = (a: Point, b: Point, f: number): Point => ({
  x: a.x + (b.x - a.x) * f,
  y: a.y + (b.y - a.y) * f,
});

export function pathLength(path: Point[]) {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += distance(path[i - 1], path[i]);
  return total;
}

/** Point at a fraction (0 to 1) of the path's length. */
export function pointAt(path: Point[], fraction: number): Point {
  if (path.length < 2 || fraction <= 0) return path[0];
  if (fraction >= 1) return path[path.length - 1];
  let left = clamp(fraction, 0, 1) * pathLength(path);
  for (let i = 1; i < path.length; i++) {
    const step = distance(path[i - 1], path[i]);
    if (left <= step) return lerp(path[i - 1], path[i], step ? left / step : 1);
    left -= step;
  }
  return path[path.length - 1];
}

/** The path without its first `start` and last `end` units (lines stop at the tokens' edge). */
export function trimPath(path: Point[], start: number, end: number): Point[] {
  const total = pathLength(path);
  if (total <= start + end + 0.5) return [];
  const from = start / total;
  const to = 1 - end / total;
  const out = [pointAt(path, from)];
  let run = 0;
  for (let i = 1; i < path.length; i++) {
    run += distance(path[i - 1], path[i]);
    if (run / total > from && run / total < to) out.push(path[i]);
  }
  out.push(pointAt(path, to));
  return out;
}

/** Hand-drawn points thinned out, then rounded off (Chaikin); both ends are kept. */
export function smoothPath(points: Point[]): Point[] {
  const thin = [points[0]];
  for (const p of points.slice(1, -1))
    if (distance(p, thin[thin.length - 1]) >= 1.2) thin.push(p);
  thin.push(points[points.length - 1]);
  let path =
    thin.length > 40
      ? [
          ...Array.from(
            { length: 39 },
            (_, i) => thin[Math.floor((i * (thin.length - 1)) / 39)],
          ),
          thin[thin.length - 1],
        ]
      : thin;
  for (let n = 0; n < 2 && path.length > 2; n++) {
    const next = [path[0]];
    for (let i = 0; i < path.length - 1; i++)
      next.push(
        lerp(path[i], path[i + 1], 0.25),
        lerp(path[i], path[i + 1], 0.75),
      );
    next.push(path[path.length - 1]);
    path = next;
  }
  return path.map((p) => ({ x: round(p.x), y: round(p.y) }));
}

const inMouth = (p: Point) => p.y <= 4 && p.x >= 38 && p.x <= 62;
const nearGoal = (p: Point) => p.y <= 10 && p.x >= 30 && p.x <= 70;
/** Where a shot ends: inside the opponent goal. */
export const goalPoint = (p: Point): Point => ({
  x: clamp(p.x, 46, 54),
  y: -4,
});
const inside = (p: Point): Point => ({
  x: clamp(p.x, 3, 97),
  y: clamp(p.y, 3, 97),
});

export function startState(
  slots: { id: string; x: number; y: number }[],
  holder: string | null,
): SimState {
  const positions = Object.fromEntries(
    slots.map((s) => [s.id, { x: s.x, y: s.y }]),
  );
  return {
    positions,
    holder,
    ball: (holder && positions[holder]) || { x: 50, y: 50 },
    scored: false,
  };
}

/** Kick-off feel: the outfield player closest to the centre spot starts with the ball. */
export function defaultHolder(slots: { id: string; x: number; y: number }[]) {
  return (
    [...slots]
      .filter((s) => s.id !== "gk")
      .sort(
        (a, b) => distance(a, { x: 50, y: 52 }) - distance(b, { x: 50, y: 52 }),
      )[0]?.id ?? null
  );
}

/**
 * Reads a gesture drawn from a player. From the ball holder: to a team-mate is a
 * pass, into the goal a shot, anywhere else a carry. From anyone else: a run.
 * Null when the gesture is too short to be a path.
 */
export function makeStep(
  state: SimState,
  from: string,
  drawn: Point[],
): SimStep | null {
  const origin = state.positions[from];
  if (!origin || !drawn.length) return null;
  // A finger may leave the pitch: the line stays on it, or in the goal behind it.
  const points = drawn.map((p) => ({
    x: clamp(p.x, 0, 100),
    y: clamp(p.y, -6, 100),
  }));
  const end = {
    ...points[points.length - 1],
    y: Math.max(0, points[points.length - 1].y),
  };
  if (
    pathLength([origin, ...points]) < MIN_PATH &&
    distance(origin, end) < MIN_PATH
  )
    return null;
  let action: SimAction = "run";
  let to: string | null = null;
  let target = inside(end);
  if (state.holder === from) {
    const mate = Object.entries(state.positions)
      .filter(([id]) => id !== from)
      .map(([id, p]) => ({ id, p, d: distance(p, end) }))
      .sort((a, b) => a.d - b.d)[0];
    if (inMouth(end)) {
      action = "shot";
      target = goalPoint(end);
    } else if (mate && mate.d <= CATCH) {
      action = "pass";
      to = mate.id;
      target = mate.p;
    } else if (nearGoal(end)) {
      action = "shot";
      target = goalPoint(end);
    } else action = "carry";
  }
  if (action === "pass" || action === "shot" || action === "carry")
    if (distance(origin, target) < MIN_PATH) return null;
  return {
    action,
    from,
    to,
    path: smoothPath([origin, ...points.slice(0, -1), target]),
  };
}

export function applyStep(state: SimState, step: SimStep): SimState {
  const end = step.path[step.path.length - 1];
  const positions = { ...state.positions };
  if (step.action === "run" || step.action === "carry")
    positions[step.from] = end;
  const holder =
    step.action === "pass"
      ? step.to
      : step.action === "shot"
        ? null
        : state.holder;
  return {
    positions,
    holder,
    ball: holder
      ? positions[holder]
      : step.action === "shot"
        ? end
        : state.ball,
    scored: state.scored || step.action === "shot",
  };
}
export const replay = (state: SimState, steps: SimStep[]) =>
  steps.reduce(applyStep, state);

/**
 * Replay rhythm: runs drawn before a ball action happen during it, so a pass can
 * meet a team-mate's run. Returns the step indexes of each phase.
 */
export function phases(steps: SimStep[]) {
  const out: number[][] = [];
  let current: number[] = [];
  steps.forEach((s, i) => {
    current.push(i);
    if (s.action !== "run") {
      out.push(current);
      current = [];
    }
  });
  if (current.length) out.push(current);
  return out;
}

/** Milliseconds a step takes; speed 2 plays twice as fast. */
export const stepDuration = (step: SimStep, speed = 1) =>
  clamp((pathLength(step.path) / SPEED[step.action]) * 1000, 450, 4000) / speed;
export const phaseDuration = (steps: SimStep[], speed = 1) =>
  Math.max(0, ...steps.map((s) => stepDuration(s, speed)));

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOut = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/**
 * The board while a phase plays, `elapsed` ms after its start. Every movement of
 * the phase ends at the same time: a short pass leaves later than a long run.
 */
export function frameAt(
  state: SimState,
  steps: SimStep[],
  elapsed: number,
  speed = 1,
): SimState {
  const total = phaseDuration(steps, speed);
  const positions = { ...state.positions };
  let holder = state.holder;
  let ball = state.ball;
  let scored = state.scored;
  for (const s of steps) {
    const d = stepDuration(s, speed);
    const t = clamp((elapsed - (total - d)) / d, 0, 1);
    if (s.action === "run" || s.action === "carry")
      positions[s.from] = pointAt(s.path, easeInOut(t));
    else if (t > 0) {
      ball = pointAt(s.path, easeOut(t));
      holder = t >= 1 && s.action === "pass" ? s.to : null;
      if (t >= 1 && s.action === "shot") scored = true;
    }
  }
  return { positions, holder, ball: holder ? positions[holder] : ball, scored };
}

/** An opponent marker: placed by hand, or from a formation facing ours. */
export type Opponent = { id: string; label: string; x: number; y: number };
export const MAX_OPPONENTS = 11;
/** Closer than this to a pass or shot line, an opponent is flagged on that line. */
export const PRESSURE = 3;

/** The opponents in a formation, defending the goal we attack (mirrored). */
export function opponentFormation(
  slots: { id: string; x: number; y: number; label: string }[],
): Opponent[] {
  return slots.map((s, i) => ({
    id: `o${i + 1}`,
    label: s.label,
    x: 100 - s.x,
    y: 100 - s.y,
  }));
}

/** A new marker, numbered after the others, in the free space of the attacking half. */
export function addOpponent(
  opponents: Opponent[],
  avoid: Point[],
): Opponent | null {
  if (opponents.length >= MAX_OPPONENTS) return null;
  const used = new Set(opponents.map((o) => o.id));
  let n = 1;
  while (used.has(`o${n}`)) n++;
  const taken = [...avoid, ...opponents];
  let best: Point = { x: 50, y: 30 };
  let room = -1;
  for (let y = 12; y <= 48; y += 6)
    for (let x = 12; x <= 88; x += 8) {
      const d = Math.min(99, ...taken.map((p) => distance(p, { x, y })));
      if (d > room) {
        room = d;
        best = { x, y };
      }
    }
  return { id: `o${n}`, label: String(n), ...best };
}

export const placeOpponent = (o: Opponent, p: Point): Opponent => ({
  ...o,
  x: round(clamp(p.x, 3, 97)),
  y: round(clamp(p.y, 3, 97)),
});

function toSegment(p: Point, a: Point, b: Point) {
  const ax = a.x * WIDTH;
  const bx = b.x * WIDTH;
  const px = p.x * WIDTH;
  const dx = bx - ax;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len ? clamp(((px - ax) * dx + (p.y - a.y) * dy) / len, 0, 1) : 0;
  return Math.hypot(px - (ax + t * dx), p.y - (a.y + t * dy));
}
/** Opponents standing on a pass or shot line (a fact about the drawing, not a forecast). */
export function onTheLine(step: SimStep, opponents: Opponent[]) {
  if (step.action !== "pass" && step.action !== "shot") return [];
  return opponents.filter((o) =>
    step.path.some(
      (p, i) => i > 0 && toSegment(o, step.path[i - 1], p) < PRESSURE,
    ),
  );
}

/** Stored form: points as [x, y] pairs, a third of the size. */
export type StoredStep = Omit<SimStep, "path"> & { path: [number, number][] };
export const packStep = (s: SimStep): StoredStep => ({
  ...s,
  path: s.path.map((p) => [round(p.x), round(p.y)]),
});
export const unpackStep = (s: StoredStep): SimStep => ({
  ...s,
  path: s.path.map(([x, y]) => ({ x, y })),
});
