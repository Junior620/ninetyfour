import test from "node:test";
import assert from "node:assert/strict";
import { newestFirst, photoConsent } from "../src/lib/matchlab/photos";
import type { Consent, Media } from "../src/lib/matchlab/schema";

const player = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const now = Date.parse("2026-10-18T10:00:00Z");
const consent = (patch: Partial<Consent>): Consent => ({
  id: crypto.randomUUID(),
  version: 1,
  player_id: player,
  guardian_name: "Représentant fictif",
  purpose: "internal_photo",
  policy: "Politique fictive",
  granted_at: "2026-09-01T00:00:00Z",
  expires_at: "2027-06-30T23:59:59Z",
  revoked_at: null,
  ...patch,
});
const photo = (id: string, created_at?: string): Media => ({
  id,
  player_id: player,
  consent_id: "c",
  path: `players/${player}/${id}.jpg`,
  mime: "image/jpeg",
  purpose: "photo",
  bytes: 10,
  sha256: "0".repeat(64),
  version: 1,
  created_at,
});

test("MatchLab — the newest photo comes first, undated rows last", () => {
  const sorted = newestFirst([
    photo("old", "2026-10-01T08:00:00.000000+00:00"),
    photo("undated"),
    photo("new", "2026-10-17T09:30:00.000000+00:00"),
  ]);
  assert.deepEqual(
    sorted.map((m) => m.id),
    ["new", "old", "undated"],
  );
});

test("MatchLab — only a current internal photo consent allows a profile photo", () => {
  assert.equal(photoConsent([], player, now), undefined);
  const refused = [
    consent({ purpose: "export_photo" }),
    consent({ revoked_at: "2026-10-01T00:00:00Z" }),
    consent({ expires_at: "2026-10-18T09:59:59Z" }),
    consent({ granted_at: "2026-10-19T00:00:00Z" }),
    consent({ player_id: other }),
  ];
  assert.equal(photoConsent(refused, player, now), undefined);
  const short = consent({ expires_at: "2026-12-31T23:59:59Z" });
  const long = consent({ expires_at: "2027-08-31T23:59:59Z" });
  assert.equal(photoConsent([...refused, short, long], player, now), long);
});
