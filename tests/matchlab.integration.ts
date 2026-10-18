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
  // Squad scenarios, category requirements and trial decisions (cahier v2.2 step 2).
  const lineup = unwrap(
    await staff.db.rpc("ml_save", {
      kind: "lineups",
      payload: {
        season_id: season.id,
        category_id: "U-17",
        name: "Équipe type fictive",
        kind: "team",
        formation: "4-3-3",
        slots: {
          st: { player_id: p.player.id, role: "Pointe", instructions: "" },
        },
        bench: [],
      },
      expected: 0,
    }),
  );
  ok(lineup.id, "Scoped staff saves a lineup scenario");
  ok(
    unwrap(await other.db.from("ml_lineups").select("id").eq("id", lineup.id))
      .length === 0,
    "Other category cannot read the scenario",
  );
  ok(
    (
      await other.db.rpc("ml_save", {
        kind: "lineups",
        payload: {
          season_id: season.id,
          category_id: "U-14",
          name: "Intrusion fictive",
          formation: "4-3-3",
          slots: { st: { player_id: p.player.id } },
          bench: [],
        },
        expected: 0,
      })
    ).error,
    "A scenario cannot place a player outside the author's access",
  );
  ok(
    (
      await staff.db.rpc("ml_save", {
        kind: "requirements",
        payload: {
          category_id: "U-18",
          position: "CM",
          criterion: "common:q1",
          level: 4,
        },
        expected: 0,
      })
    ).error,
    "Staff cannot edit the category requirements",
  );
  // Fixed key reserved for this check, cleared first in case a previous run stopped early.
  const requirementKey = {
    category_id: "U-18",
    position: "GK",
    criterion: "common:q6",
  };
  await admin.from("ml_requirements").delete().match(requirementKey);
  const requirementRow = unwrap(
    await direction.db.rpc("ml_save", {
      kind: "requirements",
      payload: {
        ...requirementKey,
        level: 4,
        min_matches: 3,
      },
      expected: 0,
    }),
  );
  ok(requirementRow.id, "Direction defines a category requirement");
  const trial = unwrap(
    await staff.db.rpc("ml_save", {
      kind: "trials",
      payload: {
        player_id: p.player.id,
        from_category: "U-17",
        to_category: "U-18",
        position: "CM",
        proposal: "confirm",
        decision: "plan",
        reason: "Observé à l'entraînement",
        decided_by: direction.id,
        snapshot: {},
      },
      expected: 0,
    }),
  );
  ok(
    trial.decided_by === staff.id,
    "A trial decision is signed by its real author",
  );
  ok(
    (
      await staff.db.rpc("ml_save", {
        kind: "trials",
        payload: { ...trial, decision: "dismissed" },
        expected: trial.version,
      })
    ).error,
    "A trial decision cannot be rewritten",
  );
  ok(
    (
      await reader.db.rpc("ml_save", {
        kind: "trials",
        payload: {
          player_id: p.player.id,
          from_category: "U-17",
          to_category: "U-18",
          position: "CM",
          proposal: "none",
          decision: "dismissed",
          reason: "",
          snapshot: {},
        },
        expected: 0,
      })
    ).error,
    "Reader cannot record a trial decision",
  );
  await admin.from("ml_requirements").delete().eq("id", requirementRow.id);
  // Imported videos and verifiable sequences (cahier v2.2 step 3).
  const settingsBefore = unwrap(
    await admin.from("ml_settings").select("*").eq("id", "governance").single(),
  );
  const videoRow = (id: string) => ({
    id,
    match_id: match.id,
    path: `matches/${match.id}/${id}.mp4`,
    name: "Match fictif.mp4",
    mime: "video/mp4",
    bytes: 1000,
  });
  await admin
    .from("ml_settings")
    .update({ retention_days: null, consent_policy: null })
    .eq("id", "governance");
  const ungoverned = await staff.db
    .from("ml_videos")
    .insert(videoRow(randomUUID()));
  await admin
    .from("ml_settings")
    .update({
      retention_days: settingsBefore.retention_days ?? 365,
      consent_policy:
        settingsBefore.consent_policy ?? "Politique fictive de recette.",
    })
    .eq("id", "governance");
  ok(
    ungoverned.error?.message === "GOVERNANCE_REQUIRED",
    "A youth match video cannot be imported before retention is defined",
  );
  const videoId = randomUUID();
  unwrap(await staff.db.from("ml_videos").insert(videoRow(videoId)));
  ok(
    unwrap(await other.db.from("ml_videos").select("id").eq("id", videoId))
      .length === 0,
    "Another category cannot see the match video",
  );
  ok(
    (await reader.db.from("ml_videos").insert(videoRow(randomUUID()))).error,
    "Reader cannot import a video",
  );
  const sequence = unwrap(
    await staff.db.rpc("ml_save", {
      kind: "markers",
      payload: {
        match_id: match.id,
        player_id: p.player.id,
        seconds: 12.5,
        end_seconds: 18,
        kind: "duel",
        outcome: "success",
        tags: ["pressing haut"],
        verified: true,
        source: "manual",
        video_id: videoId,
        validated_by: direction.id,
      },
      expected: 0,
    }),
  );
  ok(
    sequence.validated_by === staff.id && sequence.video_id === videoId,
    "A verified attribution is signed by its reviewer and linked to the video",
  );
  ok(
    (
      await staff.db.rpc("ml_save", {
        kind: "markers",
        payload: { ...sequence, seconds: 30, end_seconds: 20 },
        expected: sequence.version,
      })
    ).error,
    "A sequence cannot end before it starts",
  );
  ok(
    (await other.db.rpc("ml_remove_video", { video: videoId })).error,
    "Another category cannot remove the video",
  );
  unwrap(await staff.db.rpc("ml_remove_video", { video: videoId }));
  const unlinked = unwrap(
    await staff.db.from("ml_markers").select("video_id").eq("id", sequence.id),
  );
  ok(
    unlinked[0]?.video_id === null,
    "Removing a video keeps its sequences and unlinks them",
  );
  // Club dossier: prepared by the staff, validated by the direction (cahier v2.2 step 3).
  const dossierDraft = {
    player_id: p.player.id,
    recipient: "Club fictif de recette",
    period_from: "2026-07-01",
    period_to: "2026-12-31",
    sections: ["statistics", "sequences"],
    sequence_ids: [sequence.id],
    version: 1,
  };
  ok(
    (
      await staff.db
        .from("ml_dossiers")
        .insert({ ...dossierDraft, status: "validated", content: {} })
    ).error,
    "A club dossier cannot be created already validated",
  );
  const dossier = unwrap(
    await staff.db
      .from("ml_dossiers")
      .insert({ ...dossierDraft, prepared_by: direction.id })
      .select()
      .single(),
  );
  ok(
    dossier.prepared_by === staff.id && dossier.status === "draft",
    "The database records who prepared the club dossier",
  );
  ok(
    unwrap(await reader.db.from("ml_dossiers").select("id")).length === 0 &&
      unwrap(await other.db.from("ml_dossiers").select("id").eq("id", dossier.id))
        .length === 0,
    "Readers and other categories cannot see a club dossier",
  );
  const validate = (db: typeof staff.db, d: { id: string; version: number }) =>
    db
      .from("ml_dossiers")
      .update({ status: "validated", content: { version: 1 }, version: d.version + 1 })
      .eq("id", d.id)
      .select()
      .single();
  ok(
    (await validate(staff.db, dossier)).error,
    "Staff cannot validate a club dossier",
  );
  ok(
    (await validate(direction.db, dossier)).error?.message ===
      "SHARE_CONSENT_REQUIRED",
    "Validation requires the guardian's diffusion consent",
  );
  unwrap(
    await direction.db.rpc("ml_save", {
      kind: "consents",
      payload: {
        player_id: p.player.id,
        guardian_name: "Représentant fictif",
        purpose: "dossier_share",
        policy: "Politique fictive de diffusion.",
        granted_at: new Date(Date.now() - 86400000).toISOString(),
        expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
      expected: 0,
    }),
  );
  const photoDossier = unwrap(
    await staff.db
      .from("ml_dossiers")
      .insert({ ...dossierDraft, sections: ["photo"] })
      .select()
      .single(),
  );
  ok(
    (await validate(direction.db, photoDossier)).error?.message ===
      "SHARE_CONSENT_REQUIRED",
    "Including the photo also requires the export photo consent",
  );
  const validated = unwrap(await validate(direction.db, dossier));
  ok(
    validated.validated_by === direction.id &&
      validated.prepared_by === staff.id &&
      !!validated.validated_at,
    "Validated by the direction, prepared by the staff: both recorded",
  );
  ok(
    (
      await staff.db
        .from("ml_dossiers")
        .update({ recipient: "Autre club", version: validated.version + 1 })
        .eq("id", dossier.id)
    ).error?.message === "IMMUTABLE_DECISION",
    "A validated club dossier cannot be edited",
  );
  ok(
    (await staff.db.rpc("ml_dossier_exported", { dossier: dossier.id })).error,
    "Exporting a club dossier requires the export permission",
  );
  unwrap(await direction.db.rpc("ml_dossier_exported", { dossier: dossier.id }));
  const exportLog = unwrap(
    await admin
      .from("ml_audit")
      .select("details")
      .eq("action", "DOSSIER_EXPORTED")
      .eq("resource_id", dossier.id),
  );
  ok(
    exportLog.length === 1 &&
      exportLog[0].details.recipient === "Club fictif de recette",
    "Each club dossier export is logged with its recipient",
  );
  const withdrawn = unwrap(
    await staff.db
      .from("ml_dossiers")
      .update({ status: "withdrawn", version: validated.version + 1 })
      .eq("id", dossier.id)
      .select()
      .single(),
  );
  ok(
    !!withdrawn.withdrawn_at &&
      withdrawn.content !== null &&
      (await direction.db.rpc("ml_dossier_exported", { dossier: dossier.id }))
        .error,
    "A withdrawn club dossier keeps its record but can no longer be exported",
  );
  // Live match: phases forward only, frozen summaries, undo while running (step 4).
  const kickoff = new Date(Date.now() - 50 * 60000).toISOString();
  const liveSave = (payload: Record<string, unknown>, expected: number, db = staff.db) =>
    db.rpc("ml_save", { kind: "live_sessions", payload, expected });
  const liveBase = {
    match_id: match.id,
    status: "ready",
    present: [p.player.id],
    notes: [],
  };
  const liveRow = unwrap(await liveSave(liveBase, 0));
  ok(
    liveRow.created_by === staff.id && liveRow.status === "ready",
    "A live session records who opened it",
  );
  ok(
    unwrap(await reader.db.from("ml_live_sessions").select("id")).length === 0 &&
      unwrap(await other.db.from("ml_live_sessions").select("id").eq("id", liveRow.id))
        .length === 0,
    "Readers and other categories cannot see live observations",
  );
  ok(
    (
      await liveSave(
        { ...liveRow, status: "first_half", first_half_at: new Date(Date.now() + 3600000).toISOString() },
        liveRow.version,
      )
    ).error,
    "A live phase cannot start in the future",
  );
  const firstHalf = unwrap(
    await liveSave({ ...liveRow, status: "first_half", first_half_at: kickoff }, liveRow.version),
  );
  ok(
    (await liveSave({ ...firstHalf, status: "ready" }, firstHalf.version)).error,
    "Live phases only move forward",
  );
  const liveEvent = unwrap(
    await staff.db.rpc("ml_save", {
      kind: "markers",
      payload: {
        match_id: match.id,
        player_id: p.player.id,
        seconds: 600,
        kind: "recovery",
        outcome: "success",
        source: "live",
        minute: 11,
      },
      expected: 0,
    }),
  );
  ok(
    (await other.db.rpc("ml_remove_live_event", { event: liveEvent.id })).error &&
      (await staff.db.rpc("ml_remove_live_event", { event: sequence.id })).error,
    "Only live events of an accessible match can be undone",
  );
  unwrap(await staff.db.rpc("ml_remove_live_event", { event: liveEvent.id }));
  ok(
    unwrap(await admin.from("ml_audit").select("id").eq("action", "LIVE_EVENT_REMOVED").eq("resource_id", liveEvent.id))
      .length === 1,
    "Undoing a live event is audited",
  );
  const halfTime = unwrap(
    await liveSave(
      {
        ...firstHalf,
        status: "half_time",
        half_time_at: new Date(Date.now() - 2 * 60000).toISOString(),
        half_summary: { version: 1, phase: "half_time", events: 0 },
      },
      firstHalf.version,
    ),
  );
  ok(
    (
      await liveSave(
        { ...halfTime, half_summary: { version: 1, phase: "half_time", events: 9 } },
        halfTime.version,
      )
    ).error?.message === "IMMUTABLE_DECISION",
    "A half-time summary is frozen",
  );
  const finished = unwrap(
    await liveSave(
      {
        ...halfTime,
        status: "finished",
        finished_at: new Date().toISOString(),
        final_summary: { version: 1, phase: "finished", events: 0 },
      },
      halfTime.version,
    ),
  );
  const lateEvent = unwrap(
    await staff.db.rpc("ml_save", {
      kind: "markers",
      payload: { match_id: match.id, seconds: 2800, kind: "press", source: "live", minute: 47 },
      expected: 0,
    }),
  );
  ok(
    (await liveSave({ ...finished, notes: [] }, finished.version)).error?.message ===
      "IMMUTABLE_DECISION" &&
      (await staff.db.rpc("ml_remove_live_event", { event: lateEvent.id })).error?.message ===
        "IMMUTABLE_DECISION",
    "A finished live session and its events can no longer be changed or undone",
  );
  // Tactics cell: plans on a match, lineup of the same season and category (step 5).
  const planSave = (payload: Record<string, unknown>, expected = 0, db = staff.db) =>
    db.rpc("ml_save", { kind: "plans", payload, expected });
  const mainPlan = unwrap(
    await planSave({ match_id: match.id, rank: 1, title: "Plan principal fictif", reasons: "Bloc médian" }),
  );
  ok(
    mainPlan.created_by === staff.id &&
      unwrap(await reader.db.from("ml_plans").select("id")).length === 0 &&
      unwrap(await other.db.from("ml_plans").select("id").eq("id", mainPlan.id)).length === 0,
    "A game plan records its author and stays internal to the category staff",
  );
  ok(
    (await planSave({ match_id: match.id, rank: 1, title: "Doublon" })).error,
    "A match has a single plan per rank",
  );
  const foreignLineup = unwrap(
    await direction.db.rpc("ml_save", {
      kind: "lineups",
      payload: {
        season_id: season.id,
        category_id: "U-14",
        name: "Composition U-14 fictive",
        formation: "4-3-3",
      },
      expected: 0,
    }),
  );
  ok(
    (await planSave({ ...mainPlan, lineup_id: foreignLineup.id }, mainPlan.version, direction.db))
      .error,
    "A plan cannot use a lineup of another category",
  );
  const altPlan = unwrap(await planSave({ match_id: match.id, rank: 2, title: "Plan alternatif fictif" }));
  ok(
    (await other.db.rpc("ml_remove_plan", { plan: altPlan.id })).error,
    "Another category cannot remove a plan",
  );
  unwrap(await staff.db.rpc("ml_remove_plan", { plan: altPlan.id }));
  ok(
    unwrap(await admin.from("ml_audit").select("id").eq("action", "PLAN_REMOVED").eq("resource_id", altPlan.id))
      .length === 1,
    "Removing a plan is audited",
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
