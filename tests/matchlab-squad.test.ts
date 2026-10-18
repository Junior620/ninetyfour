import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyBoard,
  move,
  locate,
  changeFormation,
  compareBoards,
  FORMATIONS,
} from "../src/lib/matchlab/formations";
import { trialComparison, nextCategory } from "../src/lib/matchlab/trials";
import { parseProfileQuery, runProfileQuery } from "../src/lib/matchlab/search";
import type {
  Evaluation,
  Match,
  Membership,
  Player,
  Requirement,
} from "../src/lib/matchlab/schema";

test("MatchLab — board moves: place, swap, bench, back to the list", () => {
  let b = emptyBoard("4-3-3");
  b = move(b, "a", "st");
  b = move(b, "b", "lw");
  assert.equal(locate(b, "a"), "st");
  b = move(b, "b", "st"); // swap
  assert.equal(locate(b, "b"), "st");
  assert.equal(locate(b, "a"), "lw");
  b = move(b, "c", "st"); // from the list onto an occupied slot: occupant to the bench
  assert.equal(locate(b, "c"), "st");
  assert.equal(locate(b, "b"), "bench");
  b = move(b, "b", "lw"); // from the bench onto an occupied slot: occupant to the bench
  assert.equal(locate(b, "b"), "lw");
  assert.equal(locate(b, "a"), "bench");
  b = move(b, "a", null);
  assert.equal(locate(b, "a"), null);
  assert.equal(b.bench.length, 0);
});

test("MatchLab — formation change keeps every player", () => {
  let b = emptyBoard("4-3-3");
  for (const [i, slot] of FORMATIONS["4-3-3"].entries())
    b = move(b, `p${i}`, slot.id);
  const c = changeFormation(b, "3-5-2");
  const placed = Object.values(c.slots).filter((s) => s.player_id).length;
  assert.equal(placed + c.bench.length, 11);
  assert.equal(c.slots.gk.player_id, "p0");
  assert.equal(placed, 11);
  const diff = compareBoards(b, c);
  assert.deepEqual(diff.onlyA, []);
  assert.ok(!diff.sameFormation);
});

const match = (
  id: string,
  played_on: string,
  category_id: Match["category_id"] = "U-14",
): Match =>
  ({
    id,
    played_on,
    category_id,
    season_id: "s",
    opponent: "Fictif",
    collective: {},
  }) as unknown as Match;
const evaluation = (
  match_id: string,
  player_id: string,
  position: Evaluation["position"],
  common: Evaluation["common"],
  specific: Evaluation["specific"] = {},
  minutes = 70,
): Evaluation =>
  ({
    id: `${match_id}-${player_id}-${position}`,
    match_id,
    player_id,
    position,
    common,
    specific,
    minutes,
  }) as unknown as Evaluation;
const player = {
  id: "p1",
  usual_position: "CM",
  fundamentals: {},
} as unknown as Player;
const requirement = (criterion: string, level: number | null): Requirement => ({
  id: criterion,
  version: 1,
  category_id: "U-16",
  position: "CM",
  criterion,
  level,
  min_matches: 3,
});

test("MatchLab — trial comparison: undefined requirements give no proposal", () => {
  const r = trialComparison(
    player,
    {
      matches: [match("m1", "2026-09-01")],
      evaluations: [evaluation("m1", "p1", "CM", { q1: 4 })],
      requirements: [],
    },
    "U-16",
    "CM",
  );
  assert.equal(r.defined, false);
  assert.equal(r.proposal, "none");
  assert.equal(r.criteria.length, 11);
  assert.equal(nextCategory("U-14"), "U-16");
  assert.equal(nextCategory("U-18"), null);
});

test("MatchLab — trial comparison: mastered, gaps, confidence and proposal", () => {
  const matches = ["m1", "m2", "m3", "m4", "m5", "m6"].map((id, i) =>
    match(id, `2026-09-0${i + 1}`),
  );
  const evaluations = matches.map((m, i) =>
    evaluation(m.id, "p1", i === 0 ? "DM" : "CM", { q1: 4, q2: 3 }, { q1: 5 }),
  );
  const requirements = [
    requirement("common:q1", 4),
    requirement("common:q2", 4),
    requirement("specific:q1", 4),
  ];
  const r = trialComparison(
    player,
    { matches, evaluations, requirements },
    "U-16",
    "CM",
    5,
  );
  assert.equal(r.sample.matches, 5);
  assert.equal(r.sample.from, "2026-09-02"); // the oldest match is outside the last five
  assert.equal(r.confidence, "high");
  const status = Object.fromEntries(r.criteria.map((c) => [c.key, c.status]));
  assert.equal(status["common:q1"], "mastered");
  assert.equal(status["common:q2"], "gap");
  assert.equal(status["specific:q1"], "mastered");
  assert.equal(status["common:q3"], "undefined");
  assert.equal(r.proposal, "confirm");
  const few = trialComparison(
    player,
    {
      matches: matches.slice(0, 2),
      evaluations: evaluations.slice(0, 2),
      requirements,
    },
    "U-16",
    "CM",
  );
  assert.equal(few.confidence, "low");
  assert.equal(few.proposal, "confirm");
  const met = trialComparison(
    player,
    {
      matches,
      evaluations,
      requirements: requirements.filter((x) => x.criterion !== "common:q2"),
    },
    "U-16",
    "CM",
  );
  assert.equal(met.proposal, "plan");
  // Changing the observed position: specific criteria come only from that position.
  const dm = trialComparison(
    player,
    {
      matches,
      evaluations,
      requirements: [{ ...requirement("specific:q1", 3), position: "DM" }],
    },
    "U-16",
    "DM",
  );
  assert.equal(dm.sample.atPosition, 0); // the DM match is not among the five latest
  assert.equal(
    dm.criteria.find((c) => c.key === "specific:q1")?.status,
    "unobserved",
  );
});

test("MatchLab — profile search parses the cahier's example", () => {
  const q = parseProfileQuery(
    "Les milieux U-16 les plus réguliers sur les trois derniers matchs",
  );
  assert.deepEqual(q.categories, ["U-16"]);
  assert.deepEqual(q.positions, ["DM", "CM", "AM"]);
  assert.equal(q.lastMatches, 3);
  assert.equal(q.metric, "regularity");
  assert.equal(q.limit, 5);
  const g = parseProfileQuery(
    "top 3 des gardiens u14 avec le plus de temps de jeu",
  );
  assert.deepEqual(
    [g.categories, g.positions, g.metric, g.limit],
    [["U-14"], ["GK"], "minutes", 3],
  );
  const d = parseProfileQuery(
    "défenseurs centraux qui progressent sur le dernier match",
  );
  assert.deepEqual(
    [d.positions, d.lastMatches, d.metric],
    [["CB"], 1, "progression"],
  );
});

test("MatchLab — profile search ranks with visible samples and missing players", () => {
  const matches = [
    match("m1", "2026-09-01", "U-16"),
    match("m2", "2026-09-08", "U-16"),
    match("m3", "2026-09-15", "U-16"),
    match("m0", "2026-08-01", "U-14"),
  ];
  const ok = { q1: 4, q2: 4 };
  const evaluations = [
    evaluation("m1", "a", "CM", { q1: 3 }, { q1: 3 }),
    evaluation("m2", "a", "CM", { q1: 5 }, { q1: 5 }),
    evaluation("m3", "a", "CM", { q1: 4 }, { q1: 4 }),
    evaluation("m2", "b", "DM", ok, ok),
    evaluation("m3", "b", "DM", ok, ok),
    evaluation("m3", "c", "ST", ok, ok),
  ];
  const players = ["a", "b", "c", "d"].map(
    (id) =>
      ({
        id,
        full_name: id,
        usual_position: id === "c" ? "ST" : "CM",
      }) as unknown as Player,
  );
  const memberships = players.map(
    (p) =>
      ({
        player_id: p.id,
        season_id: "s",
        category_id: "U-16",
      }) as unknown as Membership,
  );
  const q = parseProfileQuery(
    "milieux U-16 les plus réguliers sur les trois derniers matchs",
  );
  const r = runProfileQuery({ players, memberships, matches, evaluations }, q);
  assert.equal(r.period.matches, 3);
  assert.equal(r.period.from, "2026-09-01");
  assert.deepEqual(
    r.results.map((x) => x.player.id),
    ["b", "a"],
  ); // b: identical notes
  assert.deepEqual(
    r.missing.map((p) => p.id),
    ["d"],
  ); // a midfielder without evaluation
  const best = runProfileQuery(
    { players, memberships, matches, evaluations },
    { ...q, metric: "progression" },
  );
  assert.equal(best.results[0].player.id, "a");
});
