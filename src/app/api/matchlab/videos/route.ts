import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  requireLab,
  requireWrite,
  adminClient,
  labConfig,
  checkOrigin,
  rateLimit,
  dbError,
  LabError,
  json,
  failure,
  body,
} from "@/lib/matchlab/server";

const BUCKET = "matchlab-videos";
const MAX_BYTES = 5 * 1024 * 1024 * 1024;
const extensions = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
} as const;

/** Where and how the browser sends the file: a resumable upload signed for one path. */
async function uploadTicket(path: string) {
  const { url, key } = labConfig();
  const signed = await adminClient()
    .storage.from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true });
  if (signed.error) throw new LabError("DATABASE_UNAVAILABLE", 503);
  return {
    endpoint: `${url}/storage/v1/upload/resumable/sign`,
    apikey: key,
    bucket: BUCKET,
    path,
    token: signed.data.token,
  };
}

/** Short signed reading URL for a video the user may see (RLS decides). */
export async function GET(request: Request) {
  try {
    const { db } = await requireLab();
    const id = z.uuid().parse(new URL(request.url).searchParams.get("id"));
    const video = await db.from("ml_videos").select("*").eq("id", id).maybeSingle();
    dbError(video.error);
    if (!video.data || video.data.status !== "ready")
      throw new LabError("MEDIA_NOT_AUTHORIZED", 403);
    const signed = await adminClient()
      .storage.from(BUCKET)
      .createSignedUrl(video.data.path, 4 * 3600);
    if (signed.error) throw new LabError("MEDIA_NOT_AUTHORIZED", 404);
    const audit = await db.rpc("ml_log", {
      action: "MEDIA_READ",
      details: { video: id },
    });
    dbError(audit.error);
    return json({ url: signed.data.signedUrl });
  } catch (e) {
    return failure(e);
  }
}

const input = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("create"),
      match_id: z.uuid(),
      name: z.string().trim().min(1).max(200),
      mime: z.enum(["video/mp4", "video/quicktime", "video/webm"]),
      bytes: z.number().int().positive().max(MAX_BYTES),
      duration_seconds: z.number().min(0).max(86400).nullable(),
      team_filmed: z.string().trim().max(120).default(""),
      conditions: z.string().trim().max(500).default(""),
    })
    .strict(),
  z.object({ action: z.literal("ticket"), id: z.uuid() }).strict(),
  z.object({ action: z.literal("complete"), id: z.uuid() }).strict(),
  z.object({ action: z.literal("remove"), id: z.uuid() }).strict(),
]);

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user, member } = await requireLab();
    await rateLimit(request, "video", user.id, 30);
    if (member.role === "reader") throw new LabError("FORBIDDEN", 403);
    const data = input.parse(await body(request));
    if (data.action === "create") {
      await requireWrite(db, "match", data.match_id);
      const id = randomUUID();
      const path = `matches/${data.match_id}/${id}.${extensions[data.mime]}`;
      // RLS and the database guard (write access, retention defined) decide.
      const row = await db
        .from("ml_videos")
        .insert({
          id,
          match_id: data.match_id,
          path,
          name: data.name,
          mime: data.mime,
          bytes: data.bytes,
          duration_seconds: data.duration_seconds,
          team_filmed: data.team_filmed,
          conditions: data.conditions,
        })
        .select()
        .single();
      dbError(row.error);
      return json({ video: row.data, upload: await uploadTicket(path) }, 201);
    }
    const video = await db
      .from("ml_videos")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    dbError(video.error);
    if (!video.data) throw new LabError("FORBIDDEN", 403);
    await requireWrite(db, "match", video.data.match_id);
    if (data.action === "ticket") {
      if (video.data.status !== "uploading")
        throw new LabError("INVALID_DATA", 400);
      return json({ upload: await uploadTicket(video.data.path) });
    }
    const storage = adminClient().storage.from(BUCKET);
    if (data.action === "complete") {
      const folder = video.data.path.slice(0, video.data.path.lastIndexOf("/"));
      const file = video.data.path.slice(folder.length + 1);
      const listed = await storage.list(folder, { search: file });
      const stored = listed.data?.find((f) => f.name === file);
      if (!stored || Number(stored.metadata?.size) !== Number(video.data.bytes))
        throw new LabError("INVALID_DATA", 400);
      const done = await db
        .from("ml_videos")
        .update({ status: "ready", version: video.data.version + 1 })
        .eq("id", data.id)
        .select()
        .single();
      dbError(done.error);
      return json({ video: done.data });
    }
    // Removal: the database unlinks sequences, deletes the row and logs it; then the file goes.
    const removed = await db.rpc("ml_remove_video", { video: data.id });
    dbError(removed.error);
    await storage.remove([video.data.path]);
    return json({ removed: data.id });
  } catch (e) {
    return failure(e);
  }
}
