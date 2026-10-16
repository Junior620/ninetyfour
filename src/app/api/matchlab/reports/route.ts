import { z } from "zod";
import {
  requireLab,
  failure,
  json,
  body,
  checkOrigin,
  rateLimit,
  dbError,
} from "@/lib/matchlab/server";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user } = await requireLab();
    await rateLimit(request, "report", user.id);
    const data = z
      .object({
        match: z.uuid(),
        version: z.number().int().positive(),
        correction: z.string().max(5000).default(""),
        validate: z.boolean().default(false),
      })
      .parse(await body(request));
    const result = await db.rpc("ml_report", {
      match: data.match,
      expected: data.version,
      correction: data.correction,
      validate: data.validate,
    });
    dbError(result.error);
    return json(result.data, 201);
  } catch (e) {
    return failure(e);
  }
}
