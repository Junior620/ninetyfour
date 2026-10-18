import { z } from "zod";
import {
  requireLab,
  checkOrigin,
  rateLimit,
  dbError,
  LabError,
  json,
  failure,
  body,
} from "@/lib/matchlab/server";

const input = z.object({ action: z.literal("remove"), id: z.uuid() }).strict();

/** Undo of a live event while its session runs (checked and audited by the database). */
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user, member } = await requireLab();
    await rateLimit(request, "live", user.id, 120);
    if (member.role === "reader") throw new LabError("FORBIDDEN", 403);
    const { id } = input.parse(await body(request));
    const removed = await db.rpc("ml_remove_live_event", { event: id });
    dbError(removed.error);
    return json({ removed: id });
  } catch (e) {
    return failure(e);
  }
}
