import test from "node:test";
import assert from "node:assert/strict";
import {
  tacticalInputs,
  missingInformation,
  suggestPriorities,
  planReview,
} from "../src/lib/matchlab/tactics";
import type {
  Evaluation,
  Lineup,
  Marker,
  Match,
  Membership,
  Plan,
  Player,
} from "../src/lib/matchlab/schema";

const player = (id: string, position: Player["usual_position"], status: Player["status"] = "active"): Player => ({
  id,
  version: 1,
  full_name: `Joueur ${id}`,
  usual_position: position,
  strong_foot: "right",
  status,
  scouting: "",
  fundamentals: {},
  target_profile: "",
});
const member = (player_id: string, jersey: number): Membership => ({
  id: `ms-${player_id}`,
  version: 1,
  player_id,
  season_id: "s",
  category_id: "U-16",
  jersey,
});
const match = (id: string, played_on: string, opponent: string, collective: Match["collective"] = {}, circumstances: Match["circumstances"] = {}): Match =>
  ({
    id,
    version: 1,
    season_id: "s",
    category_id: "U-16",
    opponent,
    played_on,
    competition: "",
    venue: "",
    home_score: null,
    away_score: null,
    status: "evaluated",
    context: "",
    circumstances,
    collective,
    created_at: `${played_on}T10:00:00Z`,
    updated_at: `${played_on}T10:00:00Z`,
  }) as Match;
const evaluation = (id: string, match_id: string, player_id: string, position: Evaluation["position"], v: number): Evaluation =>
  ({
    id,
    version: 1,
    match_id,
    player_id,
    position,
    questionnaire_version: "pdf-1.1",
    common: { q1: v },
    specific: { q1: v },
    observation: "",
    priorities: "",
    minutes: 90,
  }) as Evaluation;
const marker = (id: string, match_id: string, kind: Marker["kind"], outcome: Marker["outcome"]): Marker => ({
  id,
  version: 1,
  match_id,
  player_id: null,
  seconds: 10,
  end_seconds: null,
  kind,
  outcome,
  tags: [],
  verified: false,
  source: "manual",
  video_id: null,
  minute: null,
  position: null,
  theme: "",
  observation: "",
});
const next = match("next", "2026-11-01", "FC Rivière", {}, { ground: "home", weather: "Sec", match_type: "Championnat" });
const graph = {
  players: [player("a", "GK"), player("b", "CM"), player("c", "ST", "injured"), player("d", "FB")],
  memberships: [member("a", 1), member("b", 8), member("c", 9), member("d", 2)],
  matches: [
    next,
    match("m1", "2026-10-20", "Académie Est", { q1: 4, q2: 2, q3: 2 }),
    match("m2", "2026-10-10", "Académie Ouest", { q1: 5, q2: 3, q3: 2 }),
    match("m3", "2026-09-30", "Club Sud", { q1: 4, q2: 2 }),
    match("old", "2025-05-01", "fc  riviere", { q1: 3 }),
    match("other", "2026-10-25", "FC Rivière"),
  ].map((m) => (m.id === "old" ? { ...m, season_id: "x" } : m)),
  evaluations: [
    evaluation("e1", "m1", "b", "CM", 4),
    evaluation("e2", "m2", "b", "CM", 2),
    evaluation("e3", "m1", "d", "CB", 3),
  ],
  markers: [
    marker("k1", "m1", "pass", "fail"),
    marker("k2", "m1", "pass", "fail"),
    marker("k3", "m2", "pass", "fail"),
    marker("k4", "m2", "pass", "success"),
    marker("k5", "m2", "duel", "success"),
  ],
  lineups: [] as Lineup[],
};

test("MatchLab — tactical inputs cite their sample and never invent an opponent", () => {
  const i = tacticalInputs(next, graph);
  assert.deepEqual(i.recent.map((m) => m.id), ["other", "m1", "m2", "m3"]);
  assert.deepEqual([i.squad.total, i.squad.available.length], [4, 3]);
  assert.deepEqual(i.squad.unavailable, [{ player_id: "c", status: "injured" }]);
  const cb = i.squad.byPosition.find((p) => p.position === "CB")!;
  assert.deepEqual([cb.available, cb.versatile], [0, ["d"]]);
  assert.deepEqual(i.form.map((f) => [f.player_id, f.matches, f.mean]), [["b", 2, 6], ["d", 1, 6]]);
  const [intensity, organisation, transitions] = i.collective;
  assert.deepEqual([intensity.mean, intensity.tag], [13 / 3, "support"]);
  assert.deepEqual([organisation.mean, organisation.tag], [7 / 3, "protect"]);
  assert.deepEqual([transitions.mean, transitions.answers, transitions.tag], [2, 2, "protect"]);
  // "other" has no data and "old" is in another season but counts: same name, observed data.
  assert.equal(i.opponent.observed, true);
  assert.deepEqual(i.opponent.matches.map((m) => m.id), ["old"]);
  const unknown = tacticalInputs({ ...next, opponent: "Inconnu FC" }, graph);
  assert.equal(unknown.opponent.observed, false);
});

const plan = (rank: number, over: Partial<Plan> = {}): Plan => ({
  id: `p${rank}`,
  version: 1,
  match_id: "next",
  rank,
  title: `Plan ${rank}`,
  lineup_id: null,
  block: null,
  with_ball: "",
  without_ball: "",
  transitions: "",
  set_pieces: "",
  scenarios: [],
  reasons: "",
  opponent_notes: "",
  priorities: [],
  review: null,
  created_by: null,
  created_at: "",
  updated_at: "",
  ...over,
});

test("MatchLab — missing information is listed, not guessed", () => {
  const i = tacticalInputs({ ...next, opponent: "Inconnu FC", circumstances: {} }, graph);
  assert.deepEqual(missingInformation({ ...next, circumstances: {} }, i, []), [
    "no_plan",
    "no_alternative",
    "opponent_unknown",
    "context",
    "priorities",
  ]);
  const full = missingInformation(next, tacticalInputs(next, graph), [
    plan(1, { lineup_id: "l", reasons: "Bloc médian : organisation défensive 2,3/5", priorities: [1, 2, 3].map(() => ({ objective: "o", exercise: "", category: "U-16", indicator: "", source: "" })) }),
    plan(2),
  ]);
  assert.deepEqual(full, []);
  const noKeeper = tacticalInputs(next, { ...graph, players: graph.players.map((p) => (p.id === "a" ? { ...p, status: "injured" as const } : p)) });
  assert.ok(missingInformation(next, noKeeper, []).includes("no_goalkeeper"));
});

test("MatchLab — training priorities come from observations and cite them", () => {
  const p = suggestPriorities(tacticalInputs(next, graph), "U-16");
  assert.deepEqual(
    p.map((x) => x.source),
    [
      "Transitions : 2,0/5 sur 2 match(s)",
      "Organisation défensive : 2,3/5 sur 3 match(s)",
      "Passe : 1/4 réussies sur 4 match(s)",
    ],
  );
  assert.ok(p.every((x) => x.category === "U-16" && x.exercise === "" && x.indicator));
});

test("MatchLab — review compares the planned lineup and the observed match", () => {
  const lineup = {
    id: "l",
    version: 1,
    season_id: "s",
    category_id: "U-16",
    name: "Équipe type",
    kind: "team",
    formation: "4-3-3",
    slots: { gk: { player_id: "a", role: "", instructions: "" }, cm1: { player_id: "b", role: "", instructions: "" } },
    bench: ["d"],
    notes: "",
    match_id: null,
  } as Lineup;
  const played = { ...next, collective: { q1: 5 } };
  const g = { ...graph, lineups: [lineup], evaluations: [...graph.evaluations, evaluation("x1", "next", "b", "CM", 3), evaluation("x2", "next", "c", "ST", 3)] };
  const r = planReview(played, plan(1, { lineup_id: "l" }), tacticalInputs(played, g), g);
  assert.deepEqual([r.observed, r.starters, r.startersWhoPlayed, r.notPlanned], [true, 2, 1, ["c"]]);
  assert.deepEqual(r.collective[0], { label: "Intensité", before: 13 / 3, after: 5 });
  assert.equal(planReview(next, undefined, tacticalInputs(next, graph), graph).observed, false);
});
