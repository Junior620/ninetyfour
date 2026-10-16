import test from "node:test";
import assert from "node:assert/strict";
import {
  collectiveScore,
  individualScore,
  displayScore,
  rankings,
} from "../src/lib/matchlab/scoring";
import {
  commonQuestions,
  specificQuestions,
  POSITIONS,
} from "../src/lib/matchlab/questionnaire";
import { commonSchema, positionSchema } from "../src/lib/matchlab/schema";

test("MatchLab — official 40/60 weighting, precision and presentation", () => {
  assert.equal(individualScore({ q1: 4 }, { q1: 3 }), 6.8);
  assert.equal(displayScore(6.8), "6,8");
  assert.equal(
    individualScore({ q1: 1, q2: 2, q3: 2 }, { q1: 3 }),
    ((5 / 3) * 0.4 + 3 * 0.6) * 2,
  );
  assert.equal(collectiveScore({ q1: 4, q2: null }), 8);
});
test("MatchLab — unanswered and explicitly unobserved stay distinct, groups cannot be fabricated", () => {
  assert.equal(individualScore({}, { q1: 5 }), null);
  assert.equal(individualScore({ q1: 5 }, { q1: null }), null);
  assert.equal(collectiveScore({}), null);
  assert.notDeepEqual(commonSchema.parse({}), commonSchema.parse({ q1: null }));
  for (const value of [0, 6, 2.5, "3"])
    assert.equal(commonSchema.safeParse({ q1: value }).success, false);
  assert.equal(positionSchema.safeParse({ q6: 5 }).success, false);
});
test("MatchLab — eight immutable questionnaires, ties and distinct players across positions", () => {
  assert.equal(commonQuestions.length, 6);
  for (const position of POSITIONS)
    assert.equal(specificQuestions[position].length, 5);
  const result = rankings([
    { player_id: "a", position: "GK", common: { q1: 4 }, specific: { q1: 3 } },
    { player_id: "b", position: "GK", common: { q1: 4 }, specific: { q1: 3 } },
    { player_id: "a", position: "CB", common: { q1: 4 }, specific: { q1: 3 } },
    { player_id: "c", position: "CB", common: {}, specific: { q1: 3 } },
  ]);
  assert.equal(result.best.length, 3);
  assert.equal(result.playerCount, 2);
  assert.equal(result.positions[0].n, 2);
  assert.equal(result.positions[1].n, 1);
  assert.equal(rankings([]).best.length, 0);
});
