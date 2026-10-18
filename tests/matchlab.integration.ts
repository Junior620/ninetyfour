import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
const config = JSON.parse(readFileSync(".matchlab-local/env.json", "utf8"));
if (config.MATCHLAB_SUPABASE_URL !== "http://127.0.0.1:55321")
  throw new Error("Refusing non-local integration database");
const admin = createClient(
  config.MATCHLAB_SUPABASE_URL,
  config.MATCHLAB_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const client = () =>
  createClient(
    config.MATCHLAB_SUPABASE_URL,
    config.MATCHLAB_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
let checks = 0;
function ok(value: unknown, label: string) {
  assert.ok(value, label);
  console.log(`PASS ${++checks}: ${label}`);
}
function unwrap<T extends { data: unknown; error: { message: string } | null }>(
  result: T,
): NonNullable<T["data"]> {
  assert.equal(result.error, null, result.error?.message);
  return result.data as NonNullable<T["data"]>;
}
async function main() {
  const stamp = randomUUID().slice(0, 8);
  async function account(role?: string, permissions: string[] = []) {
    const email = `${role || "unauthorized"}-${stamp}-${randomUUID().slice(0, 4)}@matchlab.test`;
    const password = randomBytes(24).toString("hex");
    const data = unwrap(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      }),
    );
    assert.ok(data.user);
    if (role)
      unwrap(
        await admin
          .from("ml_members")
          .insert({ user_id: data.user.id, role, permissions }),
      );
    const db = client();
    unwrap(await db.auth.signInWithPassword({ email, password }));
    return { db, id: data.user.id };
  }
  const direction = await account("direction", [
    "export",
    "media",
    "site_editor",
    "site_publisher",
  ]);
  const staff = await account("staff");
  const other = await account("staff");
  const reader = await account("reader");
  const unauthorized = await account();
  ok(
    (await unauthorized.db.rpc("ml_register_session")).error,
    "Existing non-habilitated Auth identity is denied",
  );
  ok(
    unwrap(await staff.db.from("ml_matches").select("*")).length === 0,
    "Auth JWT without MatchLab session reads no data",
  );
  for (const a of [direction, staff, other, reader])
    unwrap(await a.db.rpc("ml_register_session"));
  const season = unwrap(
    await direction.db.rpc("ml_admin", {
      action: "season",
      payload: {
        name: `Test ${stamp}`,
        starts_on: "2026-07-01",
        ends_on: "2027-06-30",
      },
      expected: 0,
    }),
  );
  unwrap(
    await admin.from("ml_scopes").insert([
      { user_id: staff.id, season_id: season.id, category_id: "U-17" },
      { user_id: other.id, season_id: season.id, category_id: "U-14" },
    ]),
  );
  const p = unwrap(
    await staff.db.rpc("ml_create_player", {
      payload: {
        full_name: `Joueur fictif ${stamp}`,
        usual_position: "CM",
        strong_foot: "right",
      },
      membership: { season_id: season.id, category_id: "U-17", jersey: 10 },
    }),
  );
  const match = unwrap(
    await staff.db.rpc("ml_save", {
      kind: "matches",
      payload: {
        season_id: season.id,
        category_id: "U-17",
        opponent: `Équipe fictive ${stamp}`,
        played_on: "2026-10-15",
        collective: { q1: 4 },
      },
      expected: 0,
    }),
  );
  ok(match.version === 1, "Persistent match draft created");
  const evaluation = unwrap(
    await staff.db.rpc("ml_save", {
      kind: "evaluations",
      payload: {
        match_id: match.id,
        player_id: p.player.id,
        position: "CM",
        common: { q1: 4 },
        specific: { q1: 3 },
      },
      expected: 0,
    }),
  );
  ok(evaluation.version === 1, "Scoped player evaluation persists");
  ok(
    unwrap(await other.db.from("ml_matches").select("*").eq("id", match.id))
      .length === 0,
    "Other category cannot read guessed match ID",
  );
  ok(
    (
      await other.db.rpc("ml_save", {
        kind: "matches",
        payload: { id: match.id, opponent: "attack" },
        expected: 1,
      })
    ).error,
    "Other category cannot edit guessed match ID",
  );
  ok(
    unwrap(await reader.db.from("ml_matches").select("*")).length === 0,
    "Reader has no implicit category access",
  );
  unwrap(
    await direction.db.rpc("ml_admin", {
      action: "share",
      payload: { user_id: reader.id, kind: "match", resource_id: match.id },
      expected: 0,
    }),
  );
  ok(
    unwrap(await reader.db.from("ml_matches").select("*").eq("id", match.id))
      .length === 1,
    "Reader sees explicitly shared match",
  );
  ok(
    unwrap(
      await reader.db
        .from("ml_evaluations")
        .select("*")
        .eq("match_id", match.id),
    ).length === 0,
    "Shared match does not disclose unshared player evaluation",
  );
  unwrap(
    await direction.db.rpc("ml_admin", {
      action: "share",
      payload: { user_id: reader.id, kind: "player", resource_id: p.player.id },
      expected: 0,
    }),
  );
  ok(
    unwrap(
      await reader.db
        .from("ml_evaluations")
        .select("*")
        .eq("match_id", match.id),
    ).length === 1,
    "Reader sees evaluation only after player is explicitly shared",
  );
  ok(
    (
      await reader.db.rpc("ml_save", {
        kind: "matches",
        payload: { id: match.id, opponent: "attack" },
        expected: 1,
      })
    ).error,
    "Reader cannot mutate shared match",
  );
  const updated = unwrap(
    await staff.db.rpc("ml_save", {
      kind: "matches",
      payload: { id: match.id, context: "persisted" },
      expected: 1,
    }),
  );
  ok(updated.version === 2, "Optimistic version increments");
  ok(
    (
      await staff.db.rpc("ml_save", {
        kind: "matches",
        payload: { id: match.id, context: "stale" },
        expected: 1,
      })
    ).error?.code === "40001",
    "Concurrent edit explicitly conflicts",
  );
  unwrap(
    await staff.db.rpc("ml_save", {
      kind: "evaluations",
      payload: { id: evaluation.id, common: { q1: 4, q2: null } },
      expected: 1,
    }),
  );
  ok(
    unwrap(
      await staff.db.from("ml_alerts").select("*").eq("match_id", match.id),
    ).length === 1,
    "Repeated evaluation saves produce one persistent alert",
  );
  ok(
    (
      await staff.db.rpc("ml_save", {
        kind: "evaluations",
        payload: { id: evaluation.id, common: { q1: 0 } },
        expected: 2,
      })
    ).error,
    "Database itself rejects invalid questionnaire scores",
  );
  ok(
    (
      await staff.db
        .from("ml_members")
        .update({ role: "direction" })
        .eq("user_id", staff.id)
    ).error,
    "Direct REST cannot elevate membership",
  );
  ok(
    (
      await staff.db.rpc("ml_admin", {
        action: "revoke",
        payload: { user_id: direction.id },
      })
    ).error,
    "Staff cannot invoke administration RPC",
  );
  ok(
    (
      await staff.db.rpc("ml_article_save", {
        action: "draft",
        article: randomUUID(),
        payload: { slug: "attack" },
        expected: 0,
      })
    ).error,
    "Evaluation staff cannot edit public articles",
  );
  const report = unwrap(
    await staff.db.rpc("ml_report", {
      match: match.id,
      expected: 2,
      correction: "Première revue",
      validate: true,
    }),
  );
  ok(
    report.revision === 1 && report.validated_by === staff.id,
    "Validated immutable report revision persists",
  );
  const noNotes = unwrap(
    await staff.db.rpc("ml_save", {
      kind: "matches",
      payload: {
        season_id: season.id,
        category_id: "U-17",
        opponent: "Rencontre sans notes",
        played_on: "2026-10-16",
        status: "evaluated",
        collective: {},
      },
      expected: 0,
    }),
  );
  ok(
    unwrap(
      await staff.db.from("ml_alerts").select("*").eq("match_id", noNotes.id),
    ).length === 1,
    "Evaluated match without any calculable score still creates an informative alert",
  );
  ok(
    (
      await staff.db.rpc("ml_save", {
        kind: "matches",
        payload: { id: match.id, category_id: "U-14" },
        expected: 2,
      })
    ).error,
    "Match scope cannot be reassigned through direct RPC",
  );
  const history = unwrap(
    await direction.db
      .from("ml_audit")
      .select("details")
      .eq("resource_id", match.id)
      .eq("action", "UPDATE"),
  );
  ok(
    history.some(
      (h: {
        details: { before?: { version: number }; after?: { context: string } };
      }) =>
        h.details.before?.version === 1 &&
        h.details.after?.context === "persisted",
    ),
    "Audit stores previous and resulting versions for correction history",
  );
  ok(
    (await staff.db.storage.from("matchlab-private").list()).data?.length === 0,
    "Direct storage listing exposes no private files",
  );
  unwrap(await other.db.rpc("ml_revoke_own_sessions"));
  ok(
    (await other.db.rpc("ml_register_session")).error ||
      unwrap(await other.db.from("ml_members").select("*")).length === 0,
    "Recovery revocation cannot be undone by re-registering an old JWT",
  );
  ok(
    (
      await staff.db
        .from("ml_reports")
        .update({ correction: "overwrite" })
        .eq("id", report.id)
    ).error,
    "Report revisions cannot be overwritten via REST",
  );
  unwrap(
    await direction.db.rpc("ml_admin", {
      action: "revoke",
      payload: { user_id: staff.id },
    }),
  );
  ok(
    unwrap(await staff.db.from("ml_matches").select("*").eq("id", match.id))
      .length === 0,
    "Revoked session immediately loses direct database access",
  );
  // Player photos: direction holds the media right, consent stays mandatory, governance is optional.
  const coach = await account("direction");
  unwrap(await coach.db.rpc("ml_register_session"));
  const governance = unwrap(
    await admin.from("ml_settings").select("*").eq("id", "governance").single(),
  );
  const consentPayload = {
    player_id: p.player.id,
    guardian_name: "Représentant fictif",
    purpose: "internal_photo",
    policy: "Politique fictive de recette",
    granted_at: "2026-01-01T00:00:00Z",
    expires_at: "2099-01-01T00:00:00Z",
  };
  const mediaId = randomUUID();
  unwrap(
    await admin
      .from("ml_settings")
      .update({ retention_days: null, consent_policy: null })
      .eq("id", "governance"),
  );
  try {
    const consent = unwrap(
      await coach.db.rpc("ml_save", {
        kind: "consents",
        payload: consentPayload,
        expected: 0,
      }),
    );
    ok(
      consent.id,
      "Direction records a photo consent without explicit media right or governance",
    );
    ok(
      (
        await staff.db.rpc("ml_save", {
          kind: "consents",
          payload: consentPayload,
          expected: 0,
        })
      ).error,
      "Staff without the media permission still cannot record a consent",
    );
    ok(
      (
        await coach.db.rpc("ml_attach_media", {
          payload: {
            id: randomUUID(),
            player_id: p.player.id,
            consent_id: randomUUID(),
            path: "players/none.jpg",
            mime: "image/jpeg",
            purpose: "photo",
            bytes: 10,
            sha256: "0".repeat(64),
          },
        })
      ).error,
      "A photo without a current consent is still rejected",
    );
    unwrap(
      await admin.from("ml_media").insert({
        id: mediaId,
        player_id: p.player.id,
        consent_id: consent.id,
        path: `players/${p.player.id}/${mediaId}.jpg`,
        mime: "image/jpeg",
        purpose: "photo",
        bytes: 10,
        sha256: "0".repeat(64),
        created_at: "2026-01-01T00:00:00Z",
      }),
    );
    const visible = async () =>
      unwrap(await coach.db.from("ml_media").select("id").eq("id", mediaId))
        .length === 1;
    ok(
      await visible(),
      "Without a retention period, a consented photo stays visible",
    );
    unwrap(
      await admin
        .from("ml_settings")
        .update({ retention_days: 30 })
        .eq("id", "governance"),
    );
    ok(
      !(await visible()),
      "A defined retention period still hides older photos",
    );
  } finally {
    await admin.from("ml_media").delete().eq("id", mediaId);
    unwrap(
      await admin
        .from("ml_settings")
        .update({
          retention_days: governance.retention_days,
          consent_policy: governance.consent_policy,
        })
        .eq("id", "governance"),
    );
  }
  const anonymous = await client().from("ml_matches").select("*");
  ok(
    anonymous.error?.code === "42501" || anonymous.data?.length === 0,
    "Anonymous database read is denied or empty",
  );
  console.log(
    `MatchLab integration: ${checks} checks passed. Only fictitious local records were written.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
