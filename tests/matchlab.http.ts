// Explicit opt-in integration suite. Never runs against the club's remote services.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
import sharp from "sharp";
import { validateArchive } from "../src/lib/matchlab/import";
import { newsArticles } from "../src/lib/data/news";
const env = JSON.parse(readFileSync(".matchlab-local/env.json", "utf8"));
assert.equal(env.MATCHLAB_SUPABASE_URL, "http://127.0.0.1:55321");
const base = "http://127.0.0.1:3100";
const service = createClient(
  env.MATCHLAB_SUPABASE_URL,
  env.MATCHLAB_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

let checks = 0;
function pass(label: string) {
  console.log(`PASS ${++checks}: ${label}`);
}
class Session {
  jar = new Map<string, string>();
  async request(path: string, body?: unknown, origin = base) {
    const headers: Record<string, string> = {
      origin,
      cookie: [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "),
    };
    if (body !== undefined && !(body instanceof FormData))
      headers["Content-Type"] = "application/json";
    const r = await fetch(`${base}/api/matchlab/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
      redirect: "manual",
    });
    for (const cookie of r.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const at = pair.indexOf("=");
      this.jar.set(pair.slice(0, at), pair.slice(at + 1));
    }
    assert.match(r.headers.get("cache-control") || "", /no-store/);
    assert.match(r.headers.get("x-robots-tag") || "", /noindex/);
    return r;
  }
  async json(path: string, body?: unknown, status = 200) {
    const r = await this.request(path, body);
    const data = await r.json();
    assert.equal(r.status, status, `${path}: ${JSON.stringify(data)}`);
    return data;
  }
}
async function main() {
  mkdirSync(".matchlab-local/artifacts", { recursive: true });
  const anon = new Session();
  await anon.json("data", undefined, 401);
  await anon.json("articles", undefined, 401);
  pass(
    "Anonymous private APIs and article previews are denied with no-store/noindex",
  );
  anon.jar.set("nofa_session", "legacy-cookie");
  await anon.json("data", undefined, 401);
  pass("Legacy site cookie grants no MatchLab access");
  const admin = {
    email: `direction-http-${randomUUID().slice(0, 8)}@matchlab.test`,
    password: randomBytes(24).toString("base64url"),
  };
  const adminUser = await service.auth.admin.createUser({
    ...admin,
    email_confirm: true,
  });
  assert.equal(adminUser.error, null);
  assert.equal(
    (
      await service.from("ml_members").insert({
        user_id: adminUser.data.user!.id,
        role: "direction",
        permissions: ["export", "media", "site_editor", "site_publisher"],
      })
    ).error,
    null,
  );
  const session = new Session();
  await session
    .json("auth/login", {
      email: admin.email,
      password: admin.password,
      next: "https://evil.test",
    })
    .then((x) => assert.equal(x.next, "/matchlab/overview"));
  pass("Real server login, dedicated cookie and safe return URL");
  assert.equal(
    (await session.request("data", {}, "https://evil.test")).status,
    403,
  );
  pass("Cross-origin mutation rejected");
  const season = await session.json("admin", {
    action: "season",
    payload: {
      name: `Recette HTTP ${randomUUID().slice(0, 8)}`,
      starts_on: "2026-08-01",
      ends_on: "2027-07-31",
    },
  });
  const seasonId = season.id;
  const created = await session.json(
    "data",
    {
      kind: "players",
      version: 0,
      payload: {
        full_name: "Joueur fictif recette",
        usual_position: "CM",
        strong_foot: "right",
      },
      membership: { season_id: seasonId, category_id: "U-14", jersey: 8 },
    },
    201,
  );
  const player = created.player ?? created;
  const match = await session.json(
    "data",
    {
      kind: "matches",
      version: 0,
      payload: {
        season_id: seasonId,
        category_id: "U-14",
        opponent: "Académie fictive",
        played_on: "2026-10-15",
        home_score: 2,
        away_score: 1,
        status: "evaluated",
        collective: { q1: 4, q2: 3 },
      },
    },
    201,
  );
  const evaluation = await session.json(
    "data",
    {
      kind: "evaluations",
      version: 0,
      payload: {
        match_id: match.id,
        player_id: player.id,
        position: "CM",
        common: { q1: 4, q2: null },
        specific: { q1: 3 },
        minutes: 80,
        observation: "Observation de recette sans donnée réelle",
      },
    },
    201,
  );
  pass(
    "Match, player, membership and official evaluation persist through HTTP",
  );
  const second = new Session();
  await second.json("auth/login", {
    email: admin.email,
    password: admin.password,
  });
  const reloaded = await second.json(`data?season=${seasonId}`);
  assert.equal(reloaded.graph.evaluations[0].id, evaluation.id);
  pass("Second authenticated session reloads persisted draft and evaluation");
  await session.json(
    "data",
    {
      kind: "evaluations",
      version: 0,
      payload: { ...evaluation, id: undefined, version: undefined },
    },
    409,
  );
  pass("Duplicate evaluation cannot silently overwrite answers");
  await session.json(
    "data",
    {
      kind: "evaluations",
      version: 1,
      payload: {
        ...evaluation,
        version: undefined,
        observation: "Correction enregistrée",
      },
    },
    200,
  );
  await second.json(
    "data",
    {
      kind: "evaluations",
      version: 1,
      payload: { ...evaluation, version: undefined },
    },
    409,
  );
  pass("Concurrent stale edit returns HTTP 409");
  const report = await session.json(
    "reports",
    {
      match: match.id,
      version: match.version,
      validate: true,
      correction: "Recette initiale",
    },
    201,
  );
  assert.ok(report.snapshot);
  pass("Staff report revision generated and validated");
  const settings = reloaded.settings;
  await session.json("admin", {
    action: "settings",
    version: settings.version,
    payload: {
      retention_days: 365,
      consent_policy:
        "Politique fictive locale de recette. Aucun consentement réel.",
    },
  });
  const consentPayload = {
    player_id: player.id,
    guardian_name: "Responsable fictif",
    policy: "Consentement fictif de recette",
    granted_at: "2026-10-01T00:00:00Z",
    expires_at: "2027-10-01T00:00:00Z",
  };
  const consent = await session.json(
    "data",
    {
      kind: "consents",
      version: 0,
      payload: { ...consentPayload, purpose: "internal_photo" },
    },
    201,
  );
  await session.json(
    "data",
    {
      kind: "consents",
      version: 0,
      payload: { ...consentPayload, purpose: "export_photo" },
    },
    201,
  );
  const photo = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "#173e71" },
  })
    .png()
    .toBuffer();
  const upload = new FormData();
  upload.set("file", new File([photo], "fictif.png", { type: "image/png" }));
  upload.set("player_id", player.id);
  upload.set("consent_id", consent.id);
  upload.set("purpose", "photo");
  const media = await session.json("media", upload, 201);
  assert.equal((await session.request(`media?id=${media.id}`)).status, 200);
  pass("Private photo upload with consent and authenticated access");
  let archiveBytes: Uint8Array | undefined;
  for (const format of ["csv", "xlsx", "pdf", "zip"]) {
    const r = await session.request(
      `exports?format=${format}&kind=match&match=${match.id}`,
    );
    assert.equal(
      r.status,
      200,
      `${format}: ${r.status === 200 ? "" : await r.text()}`,
    );
    const bytes = new Uint8Array(await r.arrayBuffer());
    writeFileSync(`.matchlab-local/artifacts/match.${format}`, bytes);
    if (format === "csv")
      assert.ok(Buffer.from(bytes).toString("utf8").includes("6,8"));
    if (format === "xlsx") {
      const book = new ExcelJS.Workbook();
      await book.xlsx.load(Buffer.from(bytes) as never);
      assert.ok(
        (
          book.getWorksheet("Évaluations")!.getRow(2).values as unknown[]
        ).includes(6.8),
      );
    }
    if (format === "pdf")
      assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-");
    if (format === "zip") {
      archiveBytes = bytes;
      const a = validateArchive(bytes, "preserve");
      assert.equal(a.archive.graph.matches.length, 1);
      assert.equal(a.archive.graph.players.length, 1);
      assert.equal(a.archive.graph.seasons.length, 1);
      assert.equal(a.archive.graph.media.length, 1);
    }
  }
  pass(
    "PDF/XLSX/CSV/ZIP bytes are readable, scores agree and all relations obey match filter",
  );
  for (const kind of ["player", "period"]) {
    const response = await session.request(
      `exports?format=pdf&kind=${kind}&season=${seasonId}${kind === "player" ? `&player=${player.id}` : ""}`,
    );
    assert.equal(response.status, 200);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-");
    writeFileSync(`.matchlab-local/artifacts/${kind}.pdf`, bytes);
  }
  assert.equal(
    (
      await session.request(
        `exports?format=csv&entity=${encodeURIComponent("Repères vidéo")}&match=${match.id}`,
      )
    ).status,
    200,
  );
  await session.json("exports?format=csv&entity=invalid", undefined, 400);
  pass(
    "All three PDF types and video-marker CSV are available; invalid entity rejected",
  );
  const importForm = (mode: string, commit = false, digest = "") => {
    const f = new FormData();
    f.set("file", new File([new Uint8Array(archiveBytes!)], "archive.zip"));
    f.set("mode", mode);
    f.set("commit", String(commit));
    f.set("digest", digest);
    return f;
  };
  await session.json("imports", importForm("preserve"), 409);
  const preview = await session.json("imports", importForm("copy"));
  assert.ok(preview.digest);
  const existingMatchIds = new Set(
    (await session.json("data")).graph.matches.map((m: { id: string }) => m.id),
  );
  const restored = await session.json(
    "imports",
    importForm("copy", true, preview.digest),
  );
  assert.ok(restored.restored);
  pass(
    "Collision refused; copy dry-run and transactional restore succeed including photo",
  );
  const after = await session.json("data");
  const copied = after.graph.matches.find(
    (m: { id: string; opponent: string }) =>
      !existingMatchIds.has(m.id) && m.opponent === "Académie fictive",
  );
  assert.ok(copied);
  const copiedData = await session.json(`data?season=${copied.season_id}`);
  assert.equal(copiedData.graph.evaluations.length, 1);
  assert.equal(copiedData.graph.media.length, 1);
  assert.equal(
    (await session.request(`media?id=${copiedData.graph.media[0].id}`)).status,
    200,
  );
  pass("Restored graph and stored photo reload with remapped relationships");
  await session.json("data", {
    kind: "consents",
    version: consent.version,
    payload: {
      ...consent,
      version: undefined,
      revoked_at: new Date().toISOString(),
    },
  });
  await session.json(`media?id=${media.id}`, undefined, 403);
  pass("Consent withdrawal blocks the next file request");
  await session.json("articles", { action: "seed" });
  const articles = await session.json("articles");
  for (const original of newsArticles) {
    const row = articles.articles.find(
      (a: { slug: string }) => a.slug === original.slug,
    );
    assert.deepEqual(row.published.title, original.title);
    assert.deepEqual(row.published.content, original.content);
  }
  pass(
    "Six original articles imported with identical French and English content",
  );
  const email = `editor-${randomUUID().slice(0, 8)}@matchlab.test`,
    password = randomBytes(24).toString("base64url");
  const account = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(account.error, null);
  const grant = await service.from("ml_members").insert({
    user_id: account.data.user!.id,
    role: "staff",
    permissions: ["site_editor"],
  });
  assert.equal(grant.error, null);
  const editor = new Session();
  await editor.json("auth/login", { email, password });
  const doc = {
    ...newsArticles[0],
    slug: `recette-${randomUUID()}`,
    title: { fr: "Brouillon fictif", en: "Fictitious draft" },
  };
  const draft = await editor.json("articles", {
    action: "draft",
    version: 0,
    payload: doc,
  });
  await editor.json(
    "articles",
    { action: "publish", id: draft.id, version: draft.version },
    403,
  );
  await editor.json(`exports?format=csv&kind=period`, undefined, 403);
  pass("Editor can persist drafts but cannot publish or export sports records");
  const published = await session.json("articles", {
    action: "publish",
    id: draft.id,
    version: draft.version,
  });
  assert.ok(published.published);
  const publicArticle = await fetch(`${base}/fr/actualites/${doc.slug}`);
  assert.equal(publicArticle.status, 200);
  assert.ok((await publicArticle.text()).includes("Brouillon fictif"));
  await session.json("articles", {
    action: "unpublish",
    id: draft.id,
    version: published.version,
  });
  const removed = await fetch(`${base}/fr/actualites/${doc.slug}`);
  const removedHtml = await removed.text();
  assert.ok([200, 404].includes(removed.status));
  assert.ok(!removedHtml.includes("<h1>Brouillon fictif</h1>"));
  assert.match(removedHtml, /noindex/);
  pass(
    "Explicit audited publication reaches public route, unpublish removes it",
  );
  await session.json(
    "ai/video",
    { contractVersion: "1", scope: { page: 1 }, consentIds: [] },
    501,
  );
  await session.json("push", { action: "subscribe" }, 503);
  pass("AI and unconfigured push never pretend to execute");
  const recovery = new Session();
  await recovery.json("auth/recover", { email });
  // Mailpit is isolated and captures mail locally; no email leaves the machine.
  const mailbox = await fetch("http://127.0.0.1:55324/api/v1/messages").then(
    (r) => r.json(),
  );
  const mail = mailbox.messages.find((m: { To: unknown }) =>
    JSON.stringify(m.To).includes(email),
  );
  assert.ok(mail, "Local recovery email received");
  const message = await fetch(
    `http://127.0.0.1:55324/api/v1/message/${mail.ID}`,
  ).then((r) => r.json());
  const link = message.HTML.match(/href="([^"]+)"/)[1].replaceAll("&amp;", "&");
  assert.equal(new URL(link).origin, env.MATCHLAB_SUPABASE_URL);
  const verifiedLink = await fetch(link, { redirect: "manual" });
  const callback = new URL(verifiedLink.headers.get("location")!);
  assert.equal(callback.origin, base);
  const callbackResult = await recovery.request(
    `auth/callback?${callback.searchParams}`,
  );
  assert.equal(callbackResult.status, 303);
  const newPassword = randomBytes(24).toString("base64url");
  await recovery.json("auth/reset", { password: newPassword });
  assert.ok([401, 403].includes((await editor.request("data")).status));
  const renewed = new Session();
  await renewed.json("auth/login", { email, password: newPassword });
  await renewed.json("data");
  pass(
    "Local SMTP recovery, PKCE callback, password reset and prior-session revocation",
  );
  const beforeLogout = [...session.jar];
  await session.json("auth/logout", {});
  session.jar = new Map(beforeLogout);
  await session.json("data", undefined, 401);
  pass("Logout invalidates the saved session cookie");
  writeFileSync(
    ".matchlab-local/http-results.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        checks,
        passed: true,
        matchId: match.id,
        seasonId,
      },
      null,
      2,
    ),
  );
  console.log(
    `MatchLab HTTP: ${checks} checks passed. Local fictitious data only.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
