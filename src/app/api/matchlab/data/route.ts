import { z } from "zod";
import {
  requireLab,
  failure,
  json,
  checkOrigin,
  body,
  dbError,
  rateLimit,
  LabError,
} from "@/lib/matchlab/server";
import { loadGraph } from "@/lib/matchlab/repository";
import {
  filterSchema,
  schemas,
  playerSchema,
  membershipSchema,
} from "@/lib/matchlab/schema";

export async function GET(request: Request) {
  try {
    const { db, user, member } = await requireLab();
    const filters = filterSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const graph = await loadGraph(db, filters);
    const [alerts, scopes, settings] = await Promise.all([
      db
        .from("ml_alerts")
        .select("*,ml_alert_reads(*)")
        .order("updated_at", { ascending: false })
        .limit(50),
      db.from("ml_scopes").select("*").eq("user_id", user.id),
      db.from("ml_settings").select("*").single(),
    ]);
    for (const result of [alerts, scopes, settings]) dbError(result.error);
    return json({
      graph,
      member,
      email: user.email,
      alerts: alerts.data,
      scopes: scopes.data,
      settings: settings.data,
      filters,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user, member } = await requireLab();
    await rateLimit(request, "mutation", user.id, 120);
    if (member.role === "reader") throw new LabError("FORBIDDEN", 403);
    const input = z
      .object({
        kind: z.string(),
        payload: z.unknown(),
        version: z.number().int().min(0),
        membership: z.unknown().optional(),
      })
      .strict()
      .parse(await body(request));
    if (input.kind === "players" && input.version === 0) {
      const payload = playerSchema.parse(input.payload);
      const membership = membershipSchema.parse(input.membership);
      const result = await db.rpc("ml_create_player", { payload, membership });
      dbError(result.error);
      return json(result.data, 201);
    }
    if (!(input.kind in schemas)) throw new LabError("INVALID_DATA", 400);
    const payload = schemas[input.kind as keyof typeof schemas].parse(
      input.payload,
    );
    if (input.kind === "consents") {
      if (!member.permissions.includes("media"))
        throw new LabError("FORBIDDEN", 403);
      const { data, error } = await db.from("ml_settings").select("*").single();
      dbError(error);
      if (!data?.retention_days || !data?.consent_policy)
        throw new LabError("GOVERNANCE_REQUIRED", 409);
    }
    const result = await db.rpc("ml_save", {
      kind: input.kind,
      payload,
      expected: input.version,
    });
    dbError(result.error);
    return json(result.data, input.version === 0 ? 201 : 200);
  } catch (e) {
    return failure(e);
  }
}
