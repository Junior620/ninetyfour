import test from "node:test";
import assert from "node:assert/strict";
import { FORMATIONS } from "../src/lib/matchlab/formations";
import {
  startState,
  defaultHolder,
  makeStep,
  replay,
  phases,
  frameAt,
  phaseDuration,
  stepDuration,
  pathLength,
  pointAt,
  smoothPath,
  distance,
  trimPath,
} from "../src/lib/matchlab/simulation";

const slots = FORMATIONS["4-3-3"];
const start = () => startState(slots, "dm");

test("MatchLab simulation — the ball starts with the outfield player closest to the centre", () => {
  assert.equal(defaultHolder(slots), "dm");
  assert.equal(defaultHolder(FORMATIONS["4-4-2"]), "lcm");
  const s = start();
  assert.deepEqual(s.ball, { x: 50, y: 57 });
  assert.equal(s.holder, "dm");
});

test("MatchLab simulation — a curve from the holder to a team-mate is a pass along the drawn path", () => {
  const s = start();
  // Curve from the defensive midfielder out wide, ending a little short of the left winger.
  const step = makeStep(s, "dm", [
    { x: 48, y: 52 },
    { x: 35, y: 40 },
    { x: 22, y: 30 },
    { x: 18, y: 25 },
  ])!;
  assert.equal(step.action, "pass");
  assert.equal(step.to, "lw");
  assert.deepEqual(step.path[0], { x: 50, y: 57 });
  assert.deepEqual(
    step.path.at(-1),
    { x: 15, y: 21 },
    "snapped onto the receiver",
  );
  // The ball follows the curve: halfway, it is well off the straight line.
  const middle = pointAt(step.path, 0.5);
  const straight = { x: 32.5, y: 39 };
  assert.ok(distance(middle, straight) < 6);
  const after = replay(s, [step]);
  assert.equal(after.holder, "lw");
  assert.deepEqual(after.ball, after.positions.lw);
});

test("MatchLab simulation — into the goal is a shot, into space a carry, from another player a run", () => {
  const s = start();
  const shot = makeStep(s, "dm", [
    { x: 50, y: 30 },
    { x: 52, y: 2 },
  ])!;
  assert.equal(shot.action, "shot");
  assert.deepEqual(shot.path.at(-1), { x: 52, y: -4 });
  const scored = replay(s, [shot]);
  assert.equal(scored.holder, null);
  assert.equal(scored.scored, true);

  const carry = makeStep(s, "dm", [
    { x: 50, y: 50 },
    { x: 60, y: 40 },
  ])!;
  assert.equal(carry.action, "carry");
  const carried = replay(s, [carry]);
  assert.deepEqual(carried.positions.dm, { x: 60, y: 40 });
  assert.deepEqual(carried.ball, carried.positions.dm);
  assert.equal(carried.holder, "dm");

  const run = makeStep(s, "st", [
    { x: 50, y: 10 },
    { x: 70, y: 8 },
  ])!;
  assert.equal(run.action, "run");
  assert.equal(run.to, null);
  assert.equal(replay(s, [run]).holder, "dm", "a run never takes the ball");

  assert.equal(
    makeStep(s, "dm", [{ x: 50.5, y: 56 }]),
    null,
    "a tap is not a path",
  );
  // Near the goal but close to a team-mate: the pass wins, unless drawn into the mouth.
  const nearSt = makeStep(s, "dm", [{ x: 52, y: 12 }])!;
  assert.equal(nearSt.action, "pass");
  assert.equal(nearSt.to, "st");
});

test("MatchLab simulation — runs drawn before a pass happen during it and arrive with the ball", () => {
  let s = start();
  // The winger drops deep, then attacks the space behind the defence.
  const run = makeStep(s, "rw", [
    { x: 85, y: 40 },
    { x: 75, y: 20 },
    { x: 70, y: 6 },
  ])!;
  s = replay(s, [run]);
  const pass = makeStep(s, "dm", [
    { x: 70, y: 30 },
    { x: 70, y: 7 },
  ])!;
  assert.equal(pass.to, "rw");
  const shot = makeStep(replay(s, [pass]), "rw", [{ x: 50, y: 1 }])!;
  assert.equal(shot.action, "shot");
  const steps = [run, pass, shot];
  assert.deepEqual(phases(steps), [[0, 1], [2]]);
  assert.deepEqual(phases([run]), [[0]]);

  const origin = start();
  const group = [run, pass];
  const total = phaseDuration(group);
  assert.equal(total, Math.max(stepDuration(run), stepDuration(pass)));
  // The run is longer: the ball waits at the passer's feet, then both arrive together.
  assert.ok(stepDuration(run) > stepDuration(pass));
  const early = frameAt(origin, group, 50);
  assert.equal(early.holder, "dm");
  assert.notDeepEqual(early.positions.rw, origin.positions.rw);
  const mid = frameAt(origin, group, total - stepDuration(pass) / 2);
  assert.equal(mid.holder, null, "ball in flight");
  const end = frameAt(origin, group, total);
  assert.equal(end.holder, "rw");
  assert.deepEqual(end.positions.rw, { x: 70, y: 6 });
  assert.deepEqual(end.ball, end.positions.rw);
  // Twice as fast, half the time.
  assert.equal(phaseDuration(group, 2), total / 2);
});

test("MatchLab simulation — drawn paths are smoothed, keep both ends and stay light", () => {
  const raw = Array.from({ length: 400 }, (_, i) => ({
    x: 50 + 30 * Math.sin(i / 60),
    y: 90 - i / 5,
  }));
  const path = smoothPath(raw);
  assert.deepEqual(path[0], { x: 50, y: 90 });
  assert.deepEqual(path.at(-1), {
    x: Math.round(raw[399].x * 10) / 10,
    y: 10.2,
  });
  assert.ok(path.length <= 160);
  assert.ok(
    Math.abs(pathLength(path) - pathLength(raw)) / pathLength(raw) < 0.05,
  );
});

test("MatchLab simulation — drawn lines stop at the tokens' edge", () => {
  const path = [
    { x: 50, y: 90 },
    { x: 50, y: 50 },
    { x: 50, y: 10 },
  ];
  const trimmed = trimPath(path, 3, 4);
  assert.deepEqual(trimmed[0], { x: 50, y: 87 });
  assert.deepEqual(trimmed.at(-1), { x: 50, y: 14 });
  assert.equal(trimmed.length, 3);
  assert.deepEqual(
    trimPath(
      [
        { x: 50, y: 50 },
        { x: 50, y: 45 },
      ],
      3,
      4,
    ),
    [],
  );
});
