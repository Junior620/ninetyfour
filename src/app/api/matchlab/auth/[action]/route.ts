import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { nativeOriginAllowed } from "@/lib/matchlab/bearer";
import {
  labClient,
  labConfig,
  tokenClient,
  requestCredential,
  expectedOrigin,
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
    const { action } = await params;
    // Token login and refresh come from the native app, which sends no Origin.
    if (action === "token" || action === "refresh") {
      if (!nativeOriginAllowed(request.headers, expectedOrigin(request)))
        throw new LabError("CSRF_REJECTED", 403);
      await rateLimit(request, `auth-${action}`, "global", 30);
      return json(await nativeSession(request, action));
    }
    checkOrigin(request);
    await rateLimit(request, `auth-${action}`, "global", 30);
    const db = await labClient();
    if (action === "logout") {
      const { error } = await db.rpc("ml_logout");
      dbError(error);
      // The mobile app forgets its tokens itself; only the cookie session is signed out here.
      if ((await requestCredential()).kind !== "bearer")
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

/** Client without cookies or stored session, used to obtain tokens for the mobile app. */
function bareClient() {
  const { url, key } = labConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
/**
 * Mobile session. `token`: same checks and limits as the web login, then the MatchLab
 * session is registered (members only). `refresh`: a new access token for the same
 * Supabase session, so the registered MatchLab session (12 h, revocable) still applies.
 */
async function nativeSession(request: Request, action: "token" | "refresh") {
  const db = bareClient();
  if (action === "token") {
    const input = z
      .object({ email: z.email(), password: z.string().min(1).max(200) })
      .strict()
      .parse(await body(request));
    await rateLimit(request, "login", input.email.toLowerCase(), 6);
    const { data, error } = await db.auth.signInWithPassword(input);
    if (error || !data.session) throw new LabError("INVALID_CREDENTIALS", 401);
    const session = data.session;
    const result = await tokenClient(session.access_token).rpc(
      "ml_register_session",
    );
    if (result.error) {
      await db.auth.admin
        .signOut(session.access_token, "local")
        .catch(() => undefined);
      dbError(result.error);
    }
    return tokens(session);
  }
  const input = z
    .object({ refresh_token: z.string().min(1).max(2048) })
    .strict()
    .parse(await body(request));
  await rateLimit(request, "refresh", input.refresh_token, 10);
  const { data, error } = await db.auth.refreshSession(input);
  if (error || !data.session) throw new LabError("UNAUTHENTICATED", 401);
  return tokens(data.session);
}
const tokens = (session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}) => ({
  access_token: session.access_token,
  refresh_token: session.refresh_token,
  expires_at: session.expires_at ?? null,
});
