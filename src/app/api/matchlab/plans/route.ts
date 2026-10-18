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

/** Removal of a game plan (checked and audited by the database). */
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user, member } = await requireLab();
    await rateLimit(request, "plans", user.id, 30);
    if (member.role === "reader") throw new LabError("FORBIDDEN", 403);
    const { id } = input.parse(await body(request));
    const removed = await db.rpc("ml_remove_plan", { plan: id });
    dbError(removed.error);
    return json({ removed: id });
  } catch (e) {
    return failure(e);
  }
}
