import test from "node:test";
import assert from "node:assert/strict";
import {
  readRequest,
  readDate,
  readMonth,
  findPlayers,
  findMatches,
} from "../src/lib/matchlab/assistant";
import type { Match, Player } from "../src/lib/matchlab/schema";

const now = new Date(2026, 9, 19, 10); // 19 October 2026, local time

test("MatchLab assistant — creations are read with their fields, never invented", () => {
  assert.deepEqual(
    readRequest("Ajoute le joueur Samuel Etoo Fils, attaquant U-16, dossard 9, gaucher", now),
    {
      kind: "create_player",
      full_name: "Samuel Etoo Fils",
      position: "WG",
      category: "U-16",
      jersey: 9,
      foot: "left",
    },
  );
  assert.deepEqual(readRequest("créer un joueur", now), {
    kind: "create_player",
    full_name: null,
    position: null,
    category: null,
    jersey: null,
    foot: null,
  });
  assert.deepEqual(readRequest("Crée un match contre Union Douala le 25 octobre en U-16", now), {
    kind: "create_match",
    opponent: "Union Douala",
    played_on: "2026-10-25",
    category: "U-16",
  });
  assert.deepEqual(readRequest("Programmer un match face à « Les Astres FC » demain", now), {
    kind: "create_match",
    opponent: "Les Astres FC",
    played_on: "2026-10-20",
    category: null,
  });
});

test("MatchLab assistant — exports, dossiers, plans, summaries and searches", () => {
  assert.deepEqual(readRequest("Exporte les évaluations U-16 de septembre en Excel", now), {
    kind: "export",
    format: "xlsx",
    category: "U-16",
    from: "2026-09-01",
    to: "2026-09-30",
  });
  assert.equal((readRequest("Télécharger l'archive complète", now) as { format: string }).format, "zip");
  assert.deepEqual(readRequest("Prépare un dossier club pour Joueur Fictif", now), { kind: "dossier" });
  assert.deepEqual(readRequest("Plan de jeu contre FC Rivière samedi", now), {
    kind: "tactics",
    opponent: "FC Rivière",
  });
  assert.deepEqual(readRequest("Résume les performances de Joueur Fictif", now), { kind: "summary" });
  assert.deepEqual(readRequest("Retrouve le match contre Académie Est", now), {
    kind: "find_match",
    opponent: "Académie Est",
  });
  const profiles = readRequest("milieux U-16 les plus réguliers sur les trois derniers matchs", now);
  assert.equal(profiles.kind, "profiles");
  if (profiles.kind === "profiles") {
    assert.deepEqual(profiles.query.positions, ["DM", "CM", "AM"]);
    assert.equal(profiles.query.lastMatches, 3);
    assert.equal(profiles.query.metric, "regularity");
  }
  assert.deepEqual(readRequest("Comment sont calculées les notes ?", now), { kind: "help", topic: "scores" });
  assert.deepEqual(readRequest("Comment créer un joueur ?", now), { kind: "help", topic: "page" });
  assert.deepEqual(readRequest("Aide pour la prise en main", now), { kind: "help", topic: "tour" });
  assert.deepEqual(readRequest("Bonjour", now), { kind: "unknown" });
});

test("MatchLab assistant — dates and periods", () => {
  assert.equal(readDate("le 31/02", now), null);
  assert.equal(readDate("le 03/11/26", now), "2026-11-03");
  assert.equal(readDate("aujourd'hui", now), "2026-10-19");
  assert.equal(readDate("le 1er novembre 2027", now), "2027-11-01");
  assert.deepEqual(readMonth("en décembre", now), { from: "2025-12-01", to: "2025-12-31" });
  assert.deepEqual(readMonth("de février 2028", now), { from: "2028-02-01", to: "2028-02-29" });
});

test("MatchLab assistant — players and matches are found in the authorised data only", () => {
  const p = (id: string, full_name: string) => ({ id, full_name }) as Player;
  const players = [p("a", "Jean-Pierre Mbappé Nkoulou"), p("b", "Paul Ndongo"), p("c", "Ali Ndongo")];
  assert.deepEqual(findPlayers("dossier pour Jean-Pierre Mbappé Nkoulou", players).map((x) => x.id), ["a"]);
  assert.deepEqual(findPlayers("bilan de Ndongo", players).map((x) => x.id), ["b", "c"]);
  assert.deepEqual(findPlayers("bilan de quelqu'un", players), []);
  const m = (id: string, opponent: string, played_on: string) => ({ id, opponent, played_on }) as Match;
  const matches = [m("1", "Académie Est", "2026-09-01"), m("2", "academie  est", "2026-10-01"), m("3", "Union", "2026-10-02")];
  assert.deepEqual(findMatches("Académie Est", matches).map((x) => x.id), ["2", "1"]);
  assert.deepEqual(findMatches(null, matches).map((x) => x.id), ["3", "2", "1"]);
});
