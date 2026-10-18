import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { zipSync, strToU8 } from "fflate";
import {
  matchSchema,
  playerSchema,
  type Graph,
} from "../src/lib/matchlab/schema";
import { filterGraph } from "../src/lib/matchlab/filter";
import {
  csv,
  xlsx,
  zipArchive,
  readArchive,
  checksum,
  type Archive,
} from "../src/lib/matchlab/export";
import { validateArchive } from "../src/lib/matchlab/import";
export function fixture(): Archive {
  const season = randomUUID(),
    other = randomUUID(),
    player = randomUUID(),
    player2 = randomUUID(),
    match = randomUUID();
  const now = new Date().toISOString();
  const graph: Graph = {
    seasons: [season, other].map((id, i) => ({
      id,
      name: `Saison fictive ${i}`,
      starts_on: "2026-08-01",
      ends_on: "2027-07-31",
      version: 1,
    })),
    players: [player, player2].map((id, i) => ({
      ...playerSchema.parse({
        full_name: i ? "Fictif B" : '=FORMULE, "A"',
        usual_position: "CM",
        strong_foot: "right",
      }),
      id,
      version: 1,
    })),
    memberships: [
      {
        id: randomUUID(),
        player_id: player,
        season_id: season,
        category_id: "U-14",
        jersey: 8,
        version: 1,
      },
      {
        id: randomUUID(),
        player_id: player2,
        season_id: other,
        category_id: "U-16",
        jersey: 8,
        version: 1,
      },
    ],
    matches: [
      {
        ...matchSchema.parse({
          season_id: season,
          category_id: "U-14",
          opponent: "Adversaire fictif",
          played_on: "2026-10-15",
          home_score: 2,
          away_score: 1,
        }),
        id: match,
        version: 1,
        created_at: now,
        updated_at: now,
      },
    ],
    evaluations: [
      {
        id: randomUUID(),
        match_id: match,
        player_id: player,
        position: "CM",
        questionnaire_version: "pdf-1.1",
        common: { q1: 4, q2: null },
        specific: { q1: 3 },
        observation: "Test",
        priorities: "",
        minutes: 80,
        version: 1,
      },
    ],
    markers: [],
    videos: [],
    reports: [],
    consents: [],
    media: [],
    targets: [],
    lineups: [],
    requirements: [],
    trials: [],
  };
  return {
    metadata: {
      schema: "n91-matchlab/1",
      author: randomUUID(),
      created_at: now,
      filters: { page: 1 },
      scoring: "pdf-1.1",
    },
    graph,
  };
}
test("A player observed only in video markers remains in the filtered archive", () => {
  const a = fixture(),
    g = a.graph;
  const m = g.matches[0],
    p = g.players[0];
  g.evaluations = [];
  g.markers = [
    {
      id: randomUUID(),
      match_id: m.id,
      player_id: p.id,
      seconds: 12.5,
      kind: "positive",
    end_seconds: null,
    outcome: null,
    tags: [],
    verified: false,
    source: "manual",
    video_id: null,
    minute: null,
      position: "CM",
      theme: "Technique",
      observation: "Observation seule",
      version: 1,
    },
  ];
  const f = filterGraph(
    g,
    { match: m.id, player: p.id, position: "CM", page: 1 },
    true,
  );
  assert.equal(f.players.length, 1);
  assert.equal(f.markers.length, 1);
  assert.equal(f.matches.length, 1);
  assert.equal(f.memberships.length, 1);
});
test("Filtered archive closes seasons, players, memberships and snapshots over all filters", () => {
  const a = fixture(),
    g = a.graph;
  g.reports.push({
    id: randomUUID(),
    match_id: g.matches[0].id,
    revision: 1,
    correction: "",
    created_by: a.metadata.author,
    created_at: a.metadata.created_at,
    validated_by: null,
    validated_at: null,
    snapshot: {
      match: g.matches[0],
      players: g.players,
      evaluations: g.evaluations,
      markers: [],
    },
  });
  const f = filterGraph(g, { match: g.matches[0].id, page: 1 }, true);
  assert.equal(f.players.length, 1);
  assert.equal(f.seasons.length, 1);
  assert.equal(f.memberships.length, 1);
  assert.equal(f.reports.length, 0);
  assert.equal(
    filterGraph(g, { match: g.matches[0].id, page: 1 }, false).players.length,
    2,
    "Editing still offers unevaluated players",
  );
});
test("XLSX reads back the precise 6.8 and CSV protects formulas, quotes and missing answers", async () => {
  const a = fixture(),
    book = new ExcelJS.Workbook();
  await book.xlsx.load(Buffer.from(await xlsx(a)) as never);
  const row = book.getWorksheet("Évaluations")!.getRow(2).values as unknown[];
  assert.ok(row.includes(6.8));
  assert.ok(row.includes("6,8"));
  const bytes = csv(a, "Joueurs");
  assert.equal(bytes.charCodeAt(0), 0xfeff);
  assert.ok(bytes.includes("'=FORMULE"));
  assert.ok(bytes.includes('""A""'));
  const answers = csv(a, "Réponses");
  assert.ok(answers.includes("non_observe"));
  assert.ok(answers.includes("absent"));
  assert.equal(book.worksheets.length, 7);
});
test("ZIP validates checksums and copy remaps every relation without rewriting source", () => {
  const a = fixture(),
    bytes = zipArchive(a);
  const decoded = validateArchive(bytes, "preserve");
  assert.deepEqual(decoded.archive, a);
  const copy = validateArchive(bytes, "copy").archive.graph;
  assert.notEqual(copy.players[0].id, a.graph.players[0].id);
  assert.equal(copy.evaluations[0].player_id, copy.players[0].id);
  assert.equal(copy.evaluations[0].match_id, copy.matches[0].id);
  const unpacked = readArchive(bytes);
  unpacked.files["data.json"] = strToU8("{}");
  assert.throws(() => readArchive(zipSync(unpacked.files)), /INVALID_ARCHIVE/);
  assert.throws(
    () => readArchive(zipSync({ "../secret": strToU8("x") })),
    /INVALID_ARCHIVE/,
  );
});
test("Archive includes authorized photo bytes and rejects orphan media", () => {
  const a = fixture(),
    id = randomUUID(),
    consent = randomUUID(),
    photo = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  a.graph.consents.push({
    id: consent,
    player_id: a.graph.players[0].id,
    guardian_name: "Responsable fictif",
    purpose: "internal_photo",
    policy: "Test local",
    granted_at: "2026-10-01T00:00:00Z",
    expires_at: "2027-10-01T00:00:00Z",
    revoked_at: null,
    version: 1,
  });
  a.graph.media.push({
    id,
    player_id: a.graph.players[0].id,
    consent_id: consent,
    path: "local",
    mime: "image/png",
    purpose: "photo",
    bytes: photo.length,
    sha256: checksum(photo),
    version: 1,
  });
  const copy = validateArchive(
    zipArchive(a, { [`media/${id}.png`]: photo }),
    "copy",
  );
  assert.deepEqual(copy.files[copy.archive.graph.media[0].id], photo);
  assert.notEqual(copy.archive.graph.media[0].id, id);
  assert.throws(() => validateArchive(zipArchive(a), "preserve"));
  const parsed = validateArchive(
    zipArchive(a, { [`media/${id}.png`]: photo }),
    "preserve",
  );
  assert.deepEqual(parsed.files[id], photo);
});
