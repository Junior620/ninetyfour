import { z } from "zod";
import {
  labClient,
  body,
  checkOrigin,
  rateLimit,
  failure,
  json,
  safeReturn,
  dbError,
  LabError,
  PRIVATE_HEADERS,
} from "@/lib/matchlab/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    checkOrigin(request);
    const { action } = await params;
    await rateLimit(request, `auth-${action}`, "global", 30);
    const db = await labClient();
    if (action === "logout") {
      const { error } = await db.rpc("ml_logout");
      dbError(error);
      await db.auth.signOut({ scope: "local" });
      return json({ next: "/matchlab/login" });
    }
    if (action === "login") {
      const input = z
        .object({
          email: z.email(),
          password: z.string().min(1).max(200),
          next: z.string().optional(),
        })
        .parse(await body(request));
      await rateLimit(request, "login", input.email.toLowerCase(), 6);
      const { error } = await db.auth.signInWithPassword(input);
      if (error) throw new LabError("INVALID_CREDENTIALS", 401);
      const result = await db.rpc("ml_register_session");
      if (result.error) {
        await db.auth.signOut({ scope: "local" });
        dbError(result.error);
      }
      return json({ next: safeReturn(input.next) });
    }
    if (action === "recover") {
      const input = z.object({ email: z.email() }).parse(await body(request));
      await rateLimit(request, "recover", input.email.toLowerCase(), 3);
      const origin =
        process.env.MATCHLAB_APP_ORIGIN || new URL(request.url).origin;
      const { error } = await db.auth.resetPasswordForEmail(input.email, {
        redirectTo: `${origin}/api/matchlab/auth/callback`,
      });
      if (error && error.status && error.status >= 500)
        throw new LabError("RECOVERY_UNAVAILABLE", 503);
      return json({ code: "RECOVERY_REQUESTED" });
    }
    if (action === "reset") {
      const input = z
        .object({ password: z.string().min(12).max(128) })
        .parse(await body(request));
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) throw new LabError("UNAUTHENTICATED", 401);
      const { error } = await db.auth.updateUser(input);
      if (error) throw new LabError("INVALID_DATA", 400);
      dbError((await db.rpc("ml_revoke_own_sessions")).error);
      await db.auth.signOut({ scope: "local" });
      return json({ next: "/matchlab/login" });
    }
    return json({ code: "NOT_FOUND" }, 404);
  } catch (e) {
    return failure(e);
  }
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const { action } = await params;
    if (action !== "callback") return json({ code: "NOT_FOUND" }, 404);
    const code = new URL(request.url).searchParams.get("code");
    if (!code) throw new LabError("INVALID_DATA", 400);
    const db = await labClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) throw new LabError("UNAUTHENTICATED", 401);
    return new Response(null, {
      status: 303,
      headers: { ...PRIVATE_HEADERS, Location: "/matchlab/reset" },
    });
  } catch (e) {
    return failure(e);
  }
}
