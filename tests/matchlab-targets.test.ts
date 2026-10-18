import test from "node:test";
import assert from "node:assert/strict";
import { targetGaps } from "../src/lib/matchlab/targets";
import type {
  Membership,
  Player,
  Season,
  Target,
} from "../src/lib/matchlab/schema";

const season = (id: string, starts_on: string): Season => ({
  id,
  name: id,
  starts_on,
  ends_on: starts_on.replace(/^(\d+)/, (y) => String(Number(y) + 1)),
  version: 1,
});
const player = (fundamentals: Player["fundamentals"]): Player => ({
  id: "p1",
  version: 1,
  full_name: "Joueur fictif",
  usual_position: "CM",
  strong_foot: "right",
  status: "active",
  scouting: "",
  fundamentals,
  target_profile: "",
});
const membership = (
  season_id: string,
  category_id: Membership["category_id"],
): Membership => ({
  id: `m-${season_id}`,
  version: 1,
  player_id: "p1",
  season_id,
  category_id,
  jersey: 8,
});
const target = (
  season_id: string,
  category_id: Target["category_id"],
  fundamentals: Target["fundamentals"],
  position: Target["position"] = "CM",
): Target => ({
  id: `t-${season_id}-${position}`,
  version: 1,
  season_id,
  category_id,
  position,
  title: "Relayeur",
  fundamentals,
  notes: "",
});
const seasons = [season("s25", "2025-07-01"), season("s26", "2026-07-01")];

test("MatchLab — target gaps compare the latest season's target, factually", () => {
  const graph = {
    seasons,
    memberships: [membership("s25", "U-14"), membership("s26", "U-16")],
    targets: [
      target("s25", "U-14", { technique: 2 }),
      target("s26", "U-16", { technique: 4, tactical: 3, mental: 4 }),
    ],
  };
  const result = targetGaps(
    player({ technique: 3, tactical: 3, mental: 2 }),
    graph,
  );
  assert.equal(result.status, "gaps");
  assert.ok(result.status === "gaps");
  assert.deepEqual(result.gaps, ["technique", "mental"]);
  assert.equal(result.target.season_id, "s26");
});

test("MatchLab — target gaps: none, unrated, partial and met profiles", () => {
  const graph = {
    seasons,
    memberships: [membership("s26", "U-16")],
    targets: [target("s26", "U-16", { technique: 3, physical: 3 })],
  };
  assert.equal(
    targetGaps(player({}), { ...graph, targets: [] }).status,
    "none",
  );
  assert.equal(
    targetGaps(player({}), {
      ...graph,
      targets: [target("s26", "U-16", { technique: 3 }, "ST")],
    }).status,
    "none",
  );
  assert.equal(targetGaps(player({ mental: 5 }), graph).status, "unrated");
  const partial = targetGaps(player({ technique: 4 }), graph);
  assert.ok(partial.status === "ok");
  assert.deepEqual(partial.unrated, ["physical"]);
  assert.equal(
    targetGaps(player({ technique: 3, physical: 5 }), graph).status,
    "ok",
  );
  assert.equal(
    targetGaps(player({}), {
      ...graph,
      targets: [target("s26", "U-16", {})],
    }).status,
    "none",
  );
});
