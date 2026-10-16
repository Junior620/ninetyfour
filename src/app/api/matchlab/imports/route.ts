import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  requireLab,
  adminClient,
  checkOrigin,
  rateLimit,
  dbError,
  LabError,
  json,
  failure,
} from "@/lib/matchlab/server";
import { validateArchive } from "@/lib/matchlab/import";
export async function POST(request: Request) {
  const uploaded: string[] = [];
  let auditDb: Awaited<ReturnType<typeof requireLab>>["db"] | undefined;
  try {
    checkOrigin(request);
    const { db, user, member } = await requireLab("direction");
    auditDb = db;
    if (!member.permissions.includes("export"))
      throw new LabError("FORBIDDEN", 403);
    await rateLimit(request, "import", user.id, 5);
    if (Number(request.headers.get("content-length")) > 21 * 1024 * 1024)
      throw new LabError("PAYLOAD_TOO_LARGE", 413);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 20 * 1024 * 1024)
      throw new LabError("INVALID_ARCHIVE", 400);
    const mode = z.enum(["preserve", "copy"]).parse(form.get("mode"));
    const commit = form.get("commit") === "true";
    let verified;
    try {
      verified = validateArchive(
        new Uint8Array(await file.arrayBuffer()),
        mode,
      );
    } catch {
      throw new LabError("INVALID_ARCHIVE", 400);
    }
    const { graph } = verified.archive;
    const collisions: string[] = [];
    for (const [table, rows] of Object.entries(graph)) {
      if (!rows.length) continue;
      for (let i = 0; i < rows.length; i += 100) {
        const result = await db
          .from(`ml_${table}`)
          .select("id")
          .in(
            "id",
            rows.slice(i, i + 100).map((r) => r.id),
          );
        dbError(result.error);
        collisions.push(...(result.data ?? []).map((r) => `${table}:${r.id}`));
      }
    }
    if (collisions.length) {
      dbError(
        (
          await db.rpc("ml_log", {
            action: "IMPORT_FAILED",
            details: {
              code: "IMPORT_COLLISION",
              mode,
              count: collisions.length,
            },
          })
        ).error,
      );
      return json(
        {
          code: "IMPORT_COLLISION",
          collisions,
          counts: verified.counts,
          digest: verified.digest,
        },
        409,
      );
    }
    if (graph.media.length && !member.permissions.includes("media"))
      throw new LabError("FORBIDDEN", 403);
    if (!commit) {
      const log = await db.rpc("ml_log", {
        action: "IMPORT_PREVIEW",
        details: { digest: verified.digest, counts: verified.counts, mode },
      });
      dbError(log.error);
      return json({
        valid: true,
        digest: verified.digest,
        counts: verified.counts,
        mode,
      });
    }
    if (form.get("digest") !== verified.digest)
      throw new LabError("INVALID_ARCHIVE", 400);
    const batch = randomUUID();
    for (const m of graph.media) {
      const ext =
        m.mime === "image/png"
          ? "png"
          : m.mime === "image/jpeg"
            ? "jpg"
            : "pdf";
      m.path = `restored/${batch}/${m.id}.${ext}`;
      const result = await adminClient()
        .storage.from("matchlab-private")
        .upload(m.path, verified.files[m.id], {
          contentType: m.mime,
          upsert: false,
        });
      if (result.error) throw new LabError("DATABASE_UNAVAILABLE", 503);
      uploaded.push(m.path);
    }
    const result = await db.rpc("ml_restore", { data: graph });
    dbError(result.error);
    return json({ restored: true, ...result.data });
  } catch (e) {
    if (auditDb)
      await auditDb.rpc("ml_log", {
        action: "IMPORT_FAILED",
        details: { code: e instanceof LabError ? e.code : "IMPORT_ERROR" },
      });
    if (uploaded.length) {
      const cleanup = await adminClient()
        .storage.from("matchlab-private")
        .remove(uploaded);
      if (cleanup.error)
        console.error(
          "[MatchLab] restore compensation requires cleanup",
          uploaded,
        );
    }
    return failure(e);
  }
}
