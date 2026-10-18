import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  requireLab,
  adminClient,
  checkOrigin,
  rateLimit,
  dbError,
  LabError,
  json,
  failure,
  body,
  PRIVATE_HEADERS,
} from "@/lib/matchlab/server";
import { loadGraph } from "@/lib/matchlab/repository";
import { dossierSchema, type Dossier } from "@/lib/matchlab/schema";
import {
  dossierContent,
  dossierSequences,
  type DossierDraft,
  type DossierSequence,
} from "@/lib/matchlab/dossier";
import { timecode } from "@/lib/matchlab/sequences";
import { dossierPdf } from "@/lib/matchlab/pdf";

/** Content computed by the server from everything the user may see of the player. */
async function compute(db: SupabaseClient, draft: DossierDraft) {
  const graph = await loadGraph(db, { player: draft.player_id, page: 1 });
  if (!graph.players.some((p) => p.id === draft.player_id))
    throw new LabError("NOT_FOUND", 404);
  const matches = new Map(graph.matches.map((m) => [m.id, m]));
  const available: DossierSequence[] = dossierSequences(
    draft.player_id,
    graph,
    draft.period_from,
    draft.period_to,
  ).map((m) => ({
    id: m.id,
    date: matches.get(m.match_id)!.played_on,
    opponent: matches.get(m.match_id)!.opponent,
    timecode: timecode(m.seconds),
    kind: m.kind,
    outcome: m.outcome,
    tags: m.tags,
  }));
  return { content: dossierContent(draft, graph), available };
}
async function consents(db: SupabaseClient, player: string) {
  const [share, photo] = await Promise.all(
    ["dossier_share", "export_photo"].map((kind) =>
      db.rpc("ml_current_consent", { p: player, kind }),
    ),
  );
  dbError(share.error);
  dbError(photo.error);
  return { share: !!share.data, photo: !!photo.data };
}
async function row(db: SupabaseClient, id: string) {
  const result = await db.from("ml_dossiers").select("*").eq("id", id).maybeSingle();
  dbError(result.error);
  if (!result.data) throw new LabError("NOT_FOUND", 404);
  return result.data as Dossier;
}
const draftOf = (d: Dossier): DossierDraft => ({
  player_id: d.player_id,
  recipient: d.recipient,
  recipient_contact: d.recipient_contact,
  period_from: d.period_from,
  period_to: d.period_to,
  sections: d.sections,
  strengths: d.strengths,
  development: d.development,
  sequence_ids: d.sequence_ids,
});

const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("preview"), draft: dossierSchema }).strict(),
  z
    .object({
      action: z.literal("save"),
      id: z.uuid().optional(),
      version: z.number().int().min(0),
      draft: dossierSchema,
    })
    .strict(),
  z
    .object({
      action: z.enum(["validate", "withdraw"]),
      id: z.uuid(),
      version: z.number().int().positive(),
    })
    .strict(),
]);

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user, member } = await requireLab();
    await rateLimit(request, "dossier", user.id, 60);
    if (member.role === "reader") throw new LabError("FORBIDDEN", 403);
    const data = input.parse(await body(request));
    if (data.action === "preview") {
      const draft = data.draft as DossierDraft;
      return json({
        ...(await compute(db, draft)),
        consents: await consents(db, draft.player_id),
      });
    }
    if (data.action === "save") {
      const draft = data.draft as DossierDraft;
      const saved = data.id
        ? await db
            .from("ml_dossiers")
            .update({ ...draft, status: "draft", version: data.version + 1 })
            .eq("id", data.id)
            .eq("version", data.version)
            .select()
            .maybeSingle()
        : await db
            .from("ml_dossiers")
            .insert({ ...draft, version: 1 })
            .select()
            .single();
      dbError(saved.error);
      if (!saved.data) throw new LabError("VERSION_CONFLICT", 409);
      return json({ dossier: saved.data }, data.id ? 200 : 201);
    }
    if (data.action === "validate" && member.role !== "direction")
      throw new LabError("FORBIDDEN", 403);
    const current = await row(db, data.id);
    if (current.version !== data.version)
      throw new LabError("VERSION_CONFLICT", 409);
    // The validated content is computed here, never taken from the browser.
    const change =
      data.action === "validate"
        ? {
            status: "validated",
            content: (await compute(db, draftOf(current))).content,
          }
        : { status: "withdrawn" };
    const updated = await db
      .from("ml_dossiers")
      .update({ ...change, version: data.version + 1 })
      .eq("id", data.id)
      .eq("version", data.version)
      .select()
      .maybeSingle();
    dbError(updated.error);
    if (!updated.data) throw new LabError("VERSION_CONFLICT", 409);
    return json({ dossier: updated.data });
  } catch (e) {
    return failure(e);
  }
}

/** PDF of a validated dossier, rendered from its frozen content and logged with its recipient. */
export async function GET(request: Request) {
  try {
    const { db, user } = await requireLab("export");
    await rateLimit(request, "export", user.id, 10);
    const id = z.uuid().parse(new URL(request.url).searchParams.get("id"));
    const dossier = await row(db, id);
    if (dossier.status !== "validated" || !dossier.content)
      throw new LabError("INVALID_DATA", 400);
    const logged = await db.rpc("ml_dossier_exported", { dossier: id });
    dbError(logged.error);
    let photo: { data: Uint8Array; format: "png" | "jpg" } | undefined;
    if ((logged.data as { photo: boolean }).photo) {
      // Export consent checked by the database just above. The photo itself follows the
      // same rules as any media read: its own consent current, retention not exceeded.
      const admin = adminClient();
      const [media, settings] = await Promise.all([
        admin
          .from("ml_media")
          .select("path,mime,created_at,ml_consents(granted_at,expires_at,revoked_at)")
          .eq("player_id", dossier.player_id)
          .eq("purpose", "photo")
          .order("created_at", { ascending: false }),
        admin.from("ml_settings").select("retention_days").maybeSingle(),
      ]);
      dbError(media.error);
      dbError(settings.error);
      const retention = settings.data?.retention_days as number | null | undefined;
      const now = Date.now();
      const usable = (media.data ?? []).find((m) => {
        const c = m.ml_consents as unknown as {
          granted_at: string;
          expires_at: string;
          revoked_at: string | null;
        } | null;
        return (
          !!c &&
          !c.revoked_at &&
          Date.parse(c.granted_at) <= now &&
          Date.parse(c.expires_at) > now &&
          (!retention ||
            Date.parse(m.created_at) + retention * 86400000 > now)
        );
      });
      if (usable) {
        const file = await admin.storage
          .from("matchlab-private")
          .download(usable.path);
        if (!file.error)
          photo = {
            data: new Uint8Array(await file.data.arrayBuffer()),
            format: usable.mime === "image/png" ? "png" : "jpg",
          };
      }
    }
    const bytes = await dossierPdf(dossier, photo);
    const slug = dossier.content.identity.name
      .normalize("NFD")
      .replace(/[^\w]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    return new Response(new Blob([new Uint8Array(bytes)]), {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="n91-dossier-${slug || "joueur"}.pdf"`,
      },
    });
  } catch (e) {
    return failure(e);
  }
}
