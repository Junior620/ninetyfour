import { z } from "zod";
import { aiModules, AI_UNAVAILABLE } from "@/lib/matchlab/ai";
import { filterSchema } from "@/lib/matchlab/schema";
import {
  requireLab,
  checkOrigin,
  body,
  rateLimit,
  json,
  failure,
  LabError,
} from "@/lib/matchlab/server";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  try {
    checkOrigin(request);
    const { user } = await requireLab();
    await rateLimit(request, "ai-contract", user.id, 20);
    const { module } = await params;
    if (!aiModules.some((m) => m.id === module))
      throw new LabError("NOT_FOUND", 404);
    z.object({
      contractVersion: z.literal("1"),
      scope: filterSchema,
      consentIds: z.array(z.uuid()).max(100).default([]),
    })
      .strict()
      .parse(await body(request));
    return json(AI_UNAVAILABLE, 501);
  } catch (e) {
    return failure(e);
  }
}
