import { z } from "zod";
import {
  requireLab,
  failure,
  json,
  body,
  checkOrigin,
  dbError,
} from "@/lib/matchlab/server";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user } = await requireLab();
    const { id } = z.object({ id: z.uuid() }).parse(await body(request));
    const result = await db
      .from("ml_alert_reads")
      .upsert(
        { alert_id: id, user_id: user.id },
        { onConflict: "alert_id,user_id", ignoreDuplicates: true },
      );
    dbError(result.error);
    return json({ read: true });
  } catch (e) {
    return failure(e);
  }
}
