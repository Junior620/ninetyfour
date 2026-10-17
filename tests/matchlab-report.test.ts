import test from "node:test";
import assert from "node:assert/strict";
import { matchSchema } from "../src/lib/matchlab/schema";
import { describeCircumstances } from "../src/lib/matchlab/circumstances";
import { answerHighlights } from "../src/lib/matchlab/questionnaire";

const base = {
  season_id: "11111111-1111-4111-8111-111111111111",
  category_id: "U-17",
  opponent: "Équipe fictive",
  played_on: "2026-10-14",
  home_score: 0,
  away_score: 2,
};

test("Circumstances accept every PDF field and previous free-text records", () => {
  const full = matchSchema.parse({
    ...base,
    circumstances: {
      match_type: "Championnat",
      ground: "away",
      surface: "Gazon synthétique",
      pitch: "Difficile",
      weather: "Forte pluie",
      opposition: "Supérieur",
      system: "4-3-3",
      scenario: "Nous avons été menés",
      events: ["injury", "red_card", "tactical_change", "delay"],
      incidents: "Expulsion à la 60e.",
    },
  });
  assert.equal(full.circumstances.ground, "away");
  // Records saved before the reference lists keep their free values.
  const previous = matchSchema.parse({
    ...base,
    circumstances: { pitch: "Boueux", weather: "Orage", duration: 80 },
  });
  assert.equal(previous.circumstances.pitch, "Boueux");
});

test("Circumstances reject unknown venues, events and duplicates", () => {
  for (const circumstances of [
    { ground: "stadium" },
    { events: ["weather"] },
    { events: ["injury", "injury"] },
    { mood: "bon" },
  ])
    assert.throws(() => matchSchema.parse({ ...base, circumstances }));
});

test("Circumstances are described in catalogue order with readable labels", () => {
  const rows = describeCircumstances({
    events: ["red_card", "interruption"],
    ground: "neutral",
    match_type: "Tournoi",
    absences: "",
  });
  assert.deepEqual(rows, [
    { key: "match_type", label: "Type de rencontre", value: "Tournoi" },
    { key: "ground", label: "Domicile / extérieur", value: "Terrain neutre" },
    {
      key: "events",
      label: "Événements qui ont pesé sur le match",
      value: "Expulsion, Interruption",
    },
  ]);
  assert.deepEqual(describeCircumstances({}), []);
});

test("Report highlights come only from scored answers, never from Non observé", () => {
  const { support, work } = answerHighlights(
    "GK",
    { q1: 5, q2: 4, q3: 3, q4: 2, q5: null },
    { q1: 1, q2: null, q3: 4 },
  );
  assert.deepEqual(support, ["Mission", "Prise d'information", "Décision de sortie"]);
  assert.deepEqual(work, ["Décision", "Placement"]);
  assert.deepEqual(answerHighlights("ST", {}, {}), { support: [], work: [] });
});
