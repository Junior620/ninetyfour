import { z } from "zod";
import {
  requireLab,
  checkOrigin,
  rateLimit,
  dbError,
  json,
  failure,
  body,
} from "@/lib/matchlab/server";

const events = {
  suggestion: "ASSISTANT_SUGGESTION",
  validated: "ASSISTANT_VALIDATED",
  cancelled: "ASSISTANT_CANCELLED",
} as const;
const input = z
  .object({
    event: z.enum(["suggestion", "validated", "cancelled"]),
    intent: z.string().regex(/^[a-z_]{2,32}$/),
    query: z.string().trim().max(500).default(""),
    target: z.string().max(200).nullable().default(null),
  })
  .strict();

/** Journal of the rule-based assistant: what was suggested, validated or cancelled. */
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user } = await requireLab();
    await rateLimit(request, "assistant", user.id, 120);
    const { event, ...details } = input.parse(await body(request));
    const logged = await db.rpc("ml_assistant_log", {
      event: events[event],
      details,
    });
    dbError(logged.error);
    return json({ logged: true });
  } catch (e) {
    return failure(e);
  }
}
