import { z } from "zod";
import {
  requireLab,
  checkOrigin,
  body,
  rateLimit,
  dbError,
  json,
  failure,
} from "@/lib/matchlab/server";
const payloads = {
  season: z.object({
    name: z.string().min(2).max(80),
    starts_on: z.iso.date(),
    ends_on: z.iso.date(),
  }),
  member: z.object({
    user_id: z.uuid(),
    role: z.enum(["direction", "staff", "reader"]),
    active: z.boolean(),
    permissions: z.array(
      z.enum(["export", "media", "site_editor", "site_publisher"]),
    ),
    scopes: z
      .array(
        z.object({
          season_id: z.uuid(),
          category_id: z.enum(["U-14", "U-16", "U-17", "U-18"]),
        }),
      )
      .max(100),
  }),
  revoke: z.object({ user_id: z.uuid() }),
  share: z.object({
    user_id: z.uuid(),
    kind: z.enum(["match", "player"]),
    resource_id: z.uuid(),
    remove: z.boolean().optional(),
  }),
  settings: z.object({
    retention_days: z.number().int().min(1).max(36500),
    consent_policy: z.string().min(10).max(5000),
  }),
};
export async function GET() {
  try {
    const { db } = await requireLab("direction");
    const results = await Promise.all([
      db.from("ml_members").select("*"),
      db.from("ml_scopes").select("*"),
      db.from("ml_shares").select("*"),
      db
        .from("ml_audit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    results.forEach((r) => dbError(r.error));
    return json({
      members: results[0].data,
      scopes: results[1].data,
      shares: results[2].data,
      audit: results[3].data,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user } = await requireLab("direction");
    await rateLimit(request, "admin", user.id, 30);
    const input = z
      .object({
        action: z.enum(["season", "member", "revoke", "share", "settings"]),
        payload: z.unknown(),
        version: z.number().int().min(0).default(0),
      })
      .parse(await body(request));
    const payload = payloads[input.action].parse(input.payload);
    const result = await db.rpc("ml_admin", {
      action: input.action,
      payload,
      expected: input.version,
    });
    dbError(result.error);
    return json(result.data);
  } catch (e) {
    return failure(e);
  }
}
