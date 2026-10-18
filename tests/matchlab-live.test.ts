import test from "node:test";
import assert from "node:assert/strict";
import {
  liveClock,
  liveStatus,
  liveSummary,
  minuteLabel,
} from "../src/lib/matchlab/live";
import type { Marker } from "../src/lib/matchlab/schema";

const t0 = Date.parse("2026-10-18T15:00:00Z");
const iso = (seconds: number) => new Date(t0 + seconds * 1000).toISOString();
const phases = {
  first_half_at: iso(0),
  half_time_at: null as string | null,
  second_half_at: null as string | null,
  finished_at: null as string | null,
};

test("MatchLab — live clock is continuous across halves and writes stoppage time", () => {
  const first = liveClock({ ...phases, status: "first_half" }, t0 + 754_000);
  assert.deepEqual([Math.round(first.elapsed), first.half, first.minute], [754, 1, 13]);
  assert.equal(minuteLabel(first.minute, 1), "13'");
  // 47:10 in the first half: minute 48, written 45+3'.
  const stoppage = liveClock({ ...phases, status: "first_half" }, t0 + 2830_000);
  assert.equal(minuteLabel(stoppage.minute, 1), "45+3'");
  const half = { ...phases, half_time_at: iso(2830) };
  assert.equal(liveClock({ ...half, status: "half_time" }, t0 + 4000_000).elapsed, 2830);
  // The second half starts after a 15-minute break; elapsed continues from 2830 s.
  const second = { ...half, second_half_at: iso(3730) };
  const s = liveClock({ ...second, status: "second_half" }, t0 + 3730_000 + 65_000);
  assert.deepEqual([Math.round(s.elapsed), s.half, s.minute, Math.round(s.display)], [2895, 2, 47, 2765]);
  const end = liveClock(
    { ...second, finished_at: iso(3730 + 2950), status: "finished" },
    t0 + 99_999_000,
  );
  assert.deepEqual([end.half, end.minute, end.running], [2, 95, false]);
  assert.equal(minuteLabel(end.minute, 2), "90+5'");
  const ready = liveClock({ ...phases, first_half_at: null, status: "ready" }, t0);
  assert.deepEqual([ready.elapsed, ready.minute, ready.running], [0, 1, false]);
});

test("MatchLab — live status follows written thresholds, never a verdict on one match", () => {
  assert.equal(liveStatus(2, 0, 2), "insufficient");
  assert.equal(liveStatus(3, 1, 4), "follow");
  assert.equal(liveStatus(1, 2, 4), "work");
  assert.equal(liveStatus(2, 2, 5), "work");
  assert.equal(liveStatus(2, 1, 5), "confirm");
  assert.equal(liveStatus(0, 0, 6), "confirm");
});

const ev = (
  id: string,
  seconds: number,
  kind: Marker["kind"],
  outcome: Marker["outcome"],
  player_id: string | null,
): Marker => ({
  id,
  version: 1,
  match_id: "m",
  player_id,
  seconds,
  end_seconds: null,
  kind,
  outcome,
  tags: [],
  verified: false,
  source: "live",
  video_id: null,
  minute: Math.floor(seconds / 60) + 1,
  position: null,
  theme: "",
  observation: "",
});

test("MatchLab — live summary keeps unidentified actions apart and explains its statuses", () => {
  const events = [
    ev("1", 100, "duel", "success", "a"),
    ev("2", 400, "recovery", "success", "a"),
    ev("3", 900, "duel", "success", "a"),
    ev("4", 1500, "pass", "fail", "b"),
    ev("5", 1600, "pass", "fail", "b"),
    ev("6", 1700, "pass", "success", "b"),
    ev("7", 1800, "press", null, null),
    ev("8", 1900, "press", null, null),
    ev("9", 2000, "press", null, "c"),
    ev("10", 2100, "loss", "fail", null),
  ];
  const s = liveSummary(events, {
    phase: "half_time",
    elapsed: 2700,
    split: 1350,
    present: ["a", "b", "c", "d"],
    now: new Date("2026-10-18T15:46:00Z"),
  });
  assert.deepEqual([s.events, s.identified, s.unidentified, s.minutes], [10, 7, 3, 45]);
  assert.deepEqual(
    s.players.map((p) => [p.player_id, p.status, p.success, p.fail]),
    [
      ["a", "follow", 3, 0],
      ["b", "work", 1, 2],
      ["c", "insufficient", 0, 0],
    ],
  );
  assert.equal(s.standout, "a");
  assert.deepEqual(s.workAxes, [{ kind: "pass", fail: 2, qualified: 3 }]);
  assert.deepEqual(s.trends, [
    { kind: "pass", before: 0, after: 3 },
    { kind: "press", before: 0, after: 3 },
    { kind: "duel", before: 2, after: 0 },
  ]);
  assert.deepEqual(s.observe, [{ player_id: "c", kind: "press" }]);
  assert.equal(s.presentWithoutEvent, 1);
  assert.deepEqual(
    s.collective.slice(0, 2).map((c) => c.kind),
    ["pass", "press"],
  );
  assert.ok(!JSON.stringify(s).match(/bon|mauvais/));
});
