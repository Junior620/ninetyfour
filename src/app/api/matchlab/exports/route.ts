import { z } from "zod";
import {
  requireLab,
  adminClient,
  dbError,
  rateLimit,
  PRIVATE_HEADERS,
  failure,
  LabError,
} from "@/lib/matchlab/server";
import { loadGraph } from "@/lib/matchlab/repository";
import { filterSchema } from "@/lib/matchlab/schema";
import { csv, xlsx, zipArchive, type Archive } from "@/lib/matchlab/export";
import { reportPdf } from "@/lib/matchlab/pdf";
export async function GET(request: Request) {
  let auditDb: Awaited<ReturnType<typeof requireLab>>["db"] | undefined;
  try {
    const { db, user, member } = await requireLab("export");
    auditDb = db;
    await rateLimit(request, "export", user.id, 10);
    const query = new URL(request.url).searchParams;
    const format = z
      .enum(["csv", "xlsx", "pdf", "zip"])
      .parse(query.get("format"));
    const kind = z
      .enum(["match", "player", "period"])
      .parse(query.get("kind") || "period");
    const entity = z
      .enum([
        "Joueurs",
        "Matchs",
        "Évaluations",
        "Circonstances",
        "Réponses",
        "Repères vidéo",
        "Métadonnées",
      ])
      .parse(query.get("entity") || "Évaluations");
    ["format", "kind", "entity"].forEach((k) => query.delete(k));
    const filters = filterSchema.parse(Object.fromEntries(query));
    if (
      (kind === "match" && !filters.match) ||
      (kind === "player" && !filters.player)
    )
      throw new LabError("INVALID_DATA", 400);
    const graph = await loadGraph(db, filters, true);
    // Only photos with both a valid internal consent and an explicit export consent.
    graph.media = graph.media.filter(
      (m) =>
        member.permissions.includes("media") &&
        m.purpose === "photo" &&
        graph.consents.some(
          (c) =>
            c.player_id === m.player_id &&
            c.purpose === "export_photo" &&
            !c.revoked_at &&
            Date.parse(c.granted_at) <= Date.now() &&
            Date.parse(c.expires_at) > Date.now(),
        ),
    );
    const mediaPlayers = new Set(graph.media.map((m) => m.player_id));
    graph.consents = graph.consents.filter((c) =>
      mediaPlayers.has(c.player_id),
    );
    const archive: Archive = {
      metadata: {
        schema: "n91-matchlab/1",
        author: user.id,
        created_at: new Date().toISOString(),
        filters,
        scoring: "pdf-1.1",
      },
      graph,
    };
    let bytes: Uint8Array;
    let type: string;
    if (format === "csv") {
      bytes = new TextEncoder().encode(csv(archive, entity));
      type = "text/csv; charset=utf-8";
    } else if (format === "xlsx") {
      bytes = await xlsx(archive);
      type =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (format === "pdf") {
      const photos: Record<string, Uint8Array> = {};
      let photoBytes = 0;
      for (const m of graph.media) {
        if (photos[m.player_id]) continue;
        const file = await adminClient()
          .storage.from("matchlab-private")
          .download(m.path);
        if (file.error) throw new LabError("MEDIA_NOT_AUTHORIZED", 403);
        photos[m.player_id] = new Uint8Array(await file.data.arrayBuffer());
        photoBytes += photos[m.player_id].length;
        if (photoBytes > 40 * 1024 * 1024)
          throw new LabError("SCOPE_TOO_LARGE", 413);
      }
      bytes = await reportPdf(archive, kind, photos);
      type = "application/pdf";
    } else {
      const files: Record<string, Uint8Array> = {};
      let size = 0;
      for (const m of graph.media) {
        const result = await adminClient()
          .storage.from("matchlab-private")
          .download(m.path);
        if (result.error) throw new LabError("MEDIA_NOT_AUTHORIZED", 403);
        const buffer = new Uint8Array(await result.data.arrayBuffer());
        size += buffer.length;
        if (size > 40 * 1024 * 1024) throw new LabError("SCOPE_TOO_LARGE", 413);
        const ext = m.mime === "image/png" ? "png" : "jpg";
        files[`media/${m.id}.${ext}`] = buffer;
      }
      bytes = zipArchive(archive, files);
      type = "application/zip";
    }
    const log = await db.rpc("ml_log", {
      action: "EXPORT_OK",
      details: { format, kind, filters, bytes: bytes.length },
    });
    dbError(log.error);
    return new Response(new Blob([new Uint8Array(bytes)]), {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": type,
        "Content-Disposition": `attachment; filename="n91-matchlab-${kind}.${format}"`,
      },
    });
  } catch (e) {
    if (auditDb)
      await auditDb.rpc("ml_log", {
        action: "EXPORT_FAILED",
        details: { code: e instanceof LabError ? e.code : "EXPORT_ERROR" },
      });
    return failure(e);
  }
}
