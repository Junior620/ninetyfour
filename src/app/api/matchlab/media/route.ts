import { z } from "zod";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { checksum } from "@/lib/matchlab/export";
import {
  requireLab,
  requireWrite,
  adminClient,
  checkOrigin,
  rateLimit,
  dbError,
  LabError,
  json,
  failure,
  PRIVATE_HEADERS,
} from "@/lib/matchlab/server";
export async function GET(request: Request) {
  try {
    const { db } = await requireLab("media");
    const id = z.uuid().parse(new URL(request.url).searchParams.get("id"));
    const result = await db
      .from("ml_media")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    dbError(result.error);
    if (!result.data) throw new LabError("MEDIA_NOT_AUTHORIZED", 403);
    const media = result.data;
    const file = await adminClient()
      .storage.from("matchlab-private")
      .download(media.path);
    if (file.error) throw new LabError("MEDIA_NOT_AUTHORIZED", 403);
    const audit = await db.rpc("ml_log", {
      action: "MEDIA_READ",
      details: { id },
    });
    dbError(audit.error);
    return new Response(file.data, {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": media.mime,
        "Content-Disposition": `${media.purpose === "proof" ? "attachment" : "inline"}; filename="${id}.${media.mime === "image/png" ? "png" : media.mime === "image/jpeg" ? "jpg" : "pdf"}"`,
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  let path: string | undefined;
  let inserted = false;
  try {
    checkOrigin(request);
    const { db, user } = await requireLab("media");
    await rateLimit(request, "media-upload", user.id, 10);
    if (Number(request.headers.get("content-length")) > 11 * 1024 * 1024)
      throw new LabError("PAYLOAD_TOO_LARGE", 413);
    const form = await request.formData();
    const player = z.uuid().parse(form.get("player_id"));
    const consentId = z.uuid().parse(form.get("consent_id"));
    const purpose = z.enum(["photo", "proof"]).parse(form.get("purpose"));
    await requireWrite(db, "player", player);
    const consent = await db
      .from("ml_consents")
      .select("*")
      .eq("id", consentId)
      .eq("player_id", player)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    dbError(consent.error);
    if (!consent.data) throw new LabError("MEDIA_NOT_AUTHORIZED", 403);
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > (purpose === "photo" ? 5 : 10) * 1024 * 1024
    )
      throw new LabError("PAYLOAD_TOO_LARGE", 413);
    let bytes = new Uint8Array(await file.arrayBuffer());
    const png =
      bytes.length >= 8 &&
      bytes
        .slice(0, 8)
        .every((v, i) => v === [137, 80, 78, 71, 13, 10, 26, 10][i]);
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const pdf = String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
    const mime = png
      ? "image/png"
      : jpg
        ? "image/jpeg"
        : pdf && purpose === "proof"
          ? "application/pdf"
          : null;
    if (!mime || mime !== file.type) throw new LabError("INVALID_DATA", 400);
    if (purpose === "photo") {
      try {
        const decoded = sharp(bytes, { limitInputPixels: 25000000 })
          .rotate()
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true });
        bytes = new Uint8Array(
          await (
            png
              ? decoded.png({ compressionLevel: 8 })
              : decoded.jpeg({ quality: 85 })
          ).toBuffer(),
        );
      } catch {
        throw new LabError("INVALID_DATA", 400);
      }
    }
    const id = randomUUID();
    path = `players/${player}/${id}.${png ? "png" : jpg ? "jpg" : "pdf"}`;
    const storage = adminClient();
    const upload = await storage.storage
      .from("matchlab-private")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (upload.error) throw new LabError("DATABASE_UNAVAILABLE", 503);
    const row = await db.rpc("ml_attach_media", {
      payload: {
        id,
        player_id: player,
        consent_id: consentId,
        path,
        mime,
        purpose,
        bytes: bytes.length,
        sha256: checksum(bytes),
      },
    });
    dbError(row.error);
    inserted = true;
    return json({ id }, 201);
  } catch (e) {
    if (path && !inserted)
      await adminClient().storage.from("matchlab-private").remove([path]);
    return failure(e);
  }
}
