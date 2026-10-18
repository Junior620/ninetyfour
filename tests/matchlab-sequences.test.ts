import test from "node:test";
import assert from "node:assert/strict";
import {
  sequenceIndicators,
  timecode,
  parseTags,
} from "../src/lib/matchlab/sequences";
import type { Marker } from "../src/lib/matchlab/schema";

const seq = (
  id: string,
  kind: Marker["kind"],
  seconds: number,
  outcome: Marker["outcome"],
  player_id: string | null = "p1",
  verified = true,
): Marker => ({
  id,
  version: 1,
  match_id: "m1",
  player_id,
  seconds,
  end_seconds: null,
  kind,
  outcome,
  tags: [],
  verified,
  source: "manual",
  video_id: null,
  minute: null,
  position: null,
  theme: "",
  observation: "",
});

test("MatchLab — indicators count outcomes and keep their sequences", () => {
  const markers = [
    seq("d2", "duel", 340, "fail"),
    seq("d1", "duel", 12, "success"),
    seq("d3", "duel", 900, "success"),
    seq("d4", "duel", 1200, null),
    seq("p1", "pass", 50, "success", "p2"),
    seq("x", "positive", 70, null),
    seq("u", "duel", 80, "success", "p1", false),
  ];
  const all = sequenceIndicators(markers, { playerId: "p1" });
  assert.deepEqual(
    all.map((i) => [i.kind, i.total, i.success, i.fail, i.open]),
    [
      ["duel", 5, 3, 1, 1],
      ["positive", 1, 0, 0, 1],
    ],
  );
  assert.deepEqual(
    all[0].sequences.map((s) => s.id),
    ["d1", "u", "d2", "d3", "d4"],
  );
  const verified = sequenceIndicators(markers, {
    playerId: "p1",
    verifiedOnly: true,
  });
  assert.equal(verified[0].total, 4);
  assert.equal(sequenceIndicators(markers).length, 3);
  assert.deepEqual(sequenceIndicators(markers, { playerId: null }), []);
});

test("MatchLab — timecodes and N91 tags", () => {
  assert.equal(timecode(0), "00:00");
  assert.equal(timecode(75.9), "01:15");
  assert.equal(timecode(3725), "1:02:05");
  assert.deepEqual(parseTags(" pressing haut, , couloir gauche,pressing haut"), [
    "pressing haut",
    "couloir gauche",
  ]);
  assert.equal(parseTags("a,b,c,d,e,f,g,h,i,j,k,l").length, 10);
});
