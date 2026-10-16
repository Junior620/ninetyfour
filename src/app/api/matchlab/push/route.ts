import { z } from "zod";
import {
  requireLab,
  checkOrigin,
  body,
  dbError,
  json,
  failure,
  rateLimit,
} from "@/lib/matchlab/server";
const configured = () =>
  !!(
    process.env.MATCHLAB_PUSH_ENABLED === "true" &&
    process.env.MATCHLAB_VAPID_PUBLIC_KEY &&
    process.env.MATCHLAB_VAPID_PRIVATE_KEY
  );
export async function GET() {
  try {
    await requireLab();
    return json({
      configured: configured(),
      publicKey: configured()
        ? process.env.MATCHLAB_VAPID_PUBLIC_KEY
        : undefined,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user } = await requireLab();
    await rateLimit(request, "push", user.id, 10);
    const input = z
      .object({
        action: z.enum(["subscribe", "unsubscribe"]),
        subscription: z
          .object({
            endpoint: z.url(),
            keys: z.object({ auth: z.string(), p256dh: z.string() }),
          })
          .optional(),
      })
      .parse(await body(request));
    if (input.action === "unsubscribe") {
      const result = await db.from("ml_push").delete().eq("user_id", user.id);
      dbError(result.error);
      return json({ unsubscribed: true });
    }
    if (!configured()) return json({ code: "PUSH_NOT_CONFIGURED" }, 503);
    if (!input.subscription) return json({ code: "INVALID_DATA" }, 400);
    const existing = await db
      .from("ml_push")
      .select("id,subscription")
      .eq("user_id", user.id);
    dbError(existing.error);
    if (
      existing.data?.some(
        (row) => row.subscription.endpoint === input.subscription!.endpoint,
      )
    )
      return json({ subscribed: true });
    const result = await db
      .from("ml_push")
      .insert({ user_id: user.id, subscription: input.subscription });
    dbError(result.error);
    return json({ subscribed: true });
  } catch (e) {
    return failure(e);
  }
}
