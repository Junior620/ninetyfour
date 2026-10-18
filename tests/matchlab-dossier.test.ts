import test from "node:test";
import assert from "node:assert/strict";
import { playerProfile } from "../src/lib/matchlab/profile";
import {
  dossierContent,
  DEFAULT_SECTIONS,
  SENSITIVE_SECTIONS,
  type DossierDraft,
} from "../src/lib/matchlab/dossier";
import type {
  Evaluation,
  Marker,
  Match,
  Membership,
  Player,
  Season,
} from "../src/lib/matchlab/schema";

const player: Player = {
  id: "p1",
  version: 1,
  full_name: "Joueur Fictif",
  usual_position: "CM",
  strong_foot: "left",
  status: "injured",
  scouting: "Note interne à ne pas transmettre",
  fundamentals: {},
  target_profile: "",
};
const season: Season = {
  id: "s1",
  name: "2026-2027",
  starts_on: "2026-08-01",
  ends_on: "2027-06-30",
  version: 1,
};
const membership: Membership = {
  id: "ms1",
  version: 1,
  player_id: "p1",
  season_id: "s1",
  category_id: "U-16",
  jersey: 8,
};
const match = (id: string, played_on: string): Match =>
  ({
    id,
    version: 1,
    season_id: "s1",
    category_id: "U-16",
    opponent: `Adversaire ${id}`,
    played_on,
    competition: "",
    venue: "",
    home_score: null,
    away_score: null,
    status: "evaluated",
    context: "",
    circumstances: {},
    collective: {},
    created_at: `${played_on}T10:00:00Z`,
    updated_at: `${played_on}T10:00:00Z`,
  }) as Match;
const evaluation = (
  id: string,
  match_id: string,
  position: Evaluation["position"],
  value: number,
  minutes: number | null,
  observation = "",
): Evaluation =>
  ({
    id,
    version: 1,
    match_id,
    player_id: "p1",
    position,
    questionnaire_version: "pdf-1.1",
    common: { q1: value, q2: value },
    specific: { q1: value },
    observation,
    priorities: "",
    minutes,
  }) as Evaluation;
const marker = (
  id: string,
  match_id: string,
  verified: boolean,
  outcome: Marker["outcome"],
): Marker => ({
  id,
  version: 1,
  match_id,
  player_id: "p1",
  seconds: 63,
  end_seconds: null,
  kind: "duel",
  outcome,
  tags: ["pressing"],
  verified,
  source: "manual",
  video_id: null,
  minute: null,
  position: null,
  theme: "",
  observation: "",
});
const graph = {
  players: [player],
  seasons: [season],
  memberships: [membership],
  matches: [
    match("m1", "2026-09-06"),
    match("m2", "2026-09-20"),
    match("m3", "2026-10-11"),
    match("old", "2025-05-01"),
  ],
  evaluations: [
    evaluation("e1", "m1", "CM", 4, 70, "Bonne orientation du jeu"),
    evaluation("e2", "m2", "CM", 3, null),
    evaluation("e3", "m3", "DM", 5, 90),
    evaluation("e0", "old", "CM", 1, 90),
  ],
  markers: [
    marker("k1", "m1", true, "success"),
    marker("k2", "m2", true, "fail"),
    marker("k3", "m2", false, "success"),
    marker("k0", "old", true, "success"),
  ],
};

test("MatchLab — player profile keeps the period, the sample and the official scores", () => {
  const p = playerProfile(player, graph, { from: "2026-08-01", to: "2026-12-31" });
  assert.equal(p.sample.matches, 3);
  assert.equal(p.sample.minutes, 160);
  assert.equal(p.sample.minutesUnknown, 1);
  assert.equal(p.sample.from, "2026-09-06");
  assert.equal(p.sample.to, "2026-10-11");
  assert.deepEqual(
    p.history.map((r) => r.match.id),
    ["m3", "m2", "m1"],
  );
  assert.equal(p.history[0].jersey, 8);
  // (value×0.4 + value×0.6)×2 per evaluation: 8, 6, 10.
  assert.equal(p.score, 8);
  assert.deepEqual(
    p.positions.map((x) => [x.position, x.matches, x.minutes]),
    [
      ["CM", 2, 70],
      ["DM", 1, 90],
    ],
  );
  // Common criteria on every evaluation; position criteria only at the usual position.
  const q1 = p.criteria.find((c) => c.key === "common:q1")!;
  assert.deepEqual([q1.mean, q1.answers], [4, 3]);
  const s1 = p.criteria.find((c) => c.key === "specific:q1")!;
  assert.deepEqual([s1.mean, s1.answers], [3.5, 2]);
  assert.equal(p.criteria.find((c) => c.key === "common:q6")!.mean, null);
  assert.deepEqual(
    p.progression.map((x) => [x.period, x.score, x.matches]),
    [
      ["2026-09", 7, 2],
      ["2026-10", 10, 1],
    ],
  );
  assert.equal(playerProfile(player, graph).sample.matches, 4);
});

const draft = (over: Partial<DossierDraft> = {}): DossierDraft => ({
  player_id: "p1",
  recipient: "  Club destinataire FC ",
  recipient_contact: "",
  period_from: "2026-08-01",
  period_to: "2026-12-31",
  sections: [...DEFAULT_SECTIONS],
  strengths: "Lecture du jeu",
  development: "",
  sequence_ids: ["k1", "k3", "k0"],
  ...over,
});

test("MatchLab — dossier excludes internal elements by default and cites only verified sequences", () => {
  assert.deepEqual(SENSITIVE_SECTIONS, ["staff_comments", "scouting", "status"]);
  assert.ok(SENSITIVE_SECTIONS.every((s) => !DEFAULT_SECTIONS.includes(s)));
  const c = dossierContent(draft(), graph, new Date("2026-10-18T12:00:00Z"));
  assert.equal(c.recipient, "Club destinataire FC");
  assert.equal(c.generated_at, "2026-10-18T12:00:00.000Z");
  assert.deepEqual(c.identity.memberships, [
    { season: "2026-2027", category: "U-16", jersey: 8 },
  ]);
  assert.deepEqual(
    [c.period.matches, c.period.minutes, c.period.minutesUnknown],
    [3, 160, 1],
  );
  assert.equal(c.photo, true);
  assert.equal(c.strengths, "Lecture du jeu");
  assert.equal(c.development, undefined, "empty text is left out");
  // k3 is unverified, k0 is outside the period: neither can be cited.
  assert.deepEqual(c.sequences?.map((s) => [s.id, s.timecode]), [["k1", "01:03"]]);
  assert.deepEqual(c.statistics?.indicators, [
    { kind: "duel", success: 1, fail: 1, total: 2 },
  ]);
  assert.equal(c.statistics?.verifiedSequences, 2);
  for (const key of ["staff_comments", "scouting", "status"] as const)
    assert.equal(c[key], undefined, `${key} absent by default`);
  assert.ok(!JSON.stringify(c).includes("Note interne"));
  assert.ok(!JSON.stringify(c).includes("Bonne orientation"));
});

test("MatchLab — dossier sections are only those chosen", () => {
  const bare = dossierContent(draft({ sections: [] }), graph);
  assert.deepEqual(
    Object.keys(bare).sort(),
    ["generated_at", "identity", "period", "recipient", "recipient_contact", "version"],
  );
  const all = dossierContent(
    draft({ sections: ["staff_comments", "scouting", "status"] }),
    graph,
  );
  assert.deepEqual(all.staff_comments, [
    { date: "2026-09-06", opponent: "Adversaire m1", text: "Bonne orientation du jeu" },
  ]);
  assert.equal(all.scouting, "Note interne à ne pas transmettre");
  assert.equal(all.status, "injured");
  assert.throws(() => dossierContent(draft({ player_id: "absent" }), graph), /NOT_FOUND/);
});
