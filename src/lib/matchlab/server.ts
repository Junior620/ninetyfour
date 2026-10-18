import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { Member } from "./schema";
import { resolveLabConfig } from "./config.mjs";

export class LabError extends Error {
  constructor(
    public code: string,
    public status: number,
    message = code,
  ) {
    super(message);
  }
}
export function labConfig() {
  const { url, key } = resolveLabConfig(process.env);
  if (!url || !key) throw new LabError("INFRASTRUCTURE_NOT_CONFIGURED", 503);
  return { url, key };
}
export function adminClient() {
  const { url } = labConfig();
  const { serviceKey: key } = resolveLabConfig(process.env);
  if (!key) throw new LabError("INFRASTRUCTURE_NOT_CONFIGURED", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function labClient() {
  const jar = await cookies();
  const { url, key } = labConfig();
  return createServerClient(url, key, {
    cookieOptions: {
      name: "n91-matchlab-auth",
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          for (const { name, value, options } of values)
            jar.set(name, value, options);
        } catch {
          /* Server components are read-only; proxy refreshes cookies. */
        }
      },
    },
  });
}
export function dbError(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "40001") throw new LabError("VERSION_CONFLICT", 409);
  if (error.code === "23505") throw new LabError("ALREADY_EXISTS", 409);
  if (error.code === "42501") throw new LabError("FORBIDDEN", 403);
  // Business refusals raised by name in the database keep their own message.
  if (error.message === "GOVERNANCE_REQUIRED")
    throw new LabError("GOVERNANCE_REQUIRED", 409);
  if (["CONSENT_REQUIRED", "MEDIA_NOT_AUTHORIZED"].includes(error.message))
    throw new LabError("MEDIA_NOT_AUTHORIZED", 403);
  if (error.message === "SHARE_CONSENT_REQUIRED")
    throw new LabError("SHARE_CONSENT_REQUIRED", 403);
  if (error.message === "IMMUTABLE_DECISION")
    throw new LabError("IMMUTABLE_DECISION", 409);
  if (error.code?.startsWith("23") || error.code === "22P02")
    throw new LabError("INVALID_DATA", 400);
  console.error("[MatchLab database]", error.code ?? "unavailable");
  throw new LabError("DATABASE_UNAVAILABLE", 503);
}
export async function requireLab(permission?: string) {
  const db = await labClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new LabError("UNAUTHENTICATED", 401);
  const result = await db
    .from("ml_members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  dbError(result.error);
  if (!result.data?.active) throw new LabError("FORBIDDEN", 403);
  const member = result.data as Member;
  // Direction always holds the media right (same rule as ml_permission in the database).
  if (member.role === "direction" && !member.permissions.includes("media"))
    member.permissions = [...member.permissions, "media"];
  if (
    permission === "direction"
      ? member.role !== "direction"
      : permission && !member.permissions.includes(permission)
  )
    throw new LabError("FORBIDDEN", 403);
  return { db, user, member };
}
export async function requireWrite(
  db: SupabaseClient,
  kind: "match" | "player",
  id: string,
) {
  const result = await db.rpc(
    kind === "match" ? "ml_match_access" : "ml_player_access",
    { [kind === "match" ? "m" : "p"]: id, writing: true },
  );
  dbError(result.error);
  if (!result.data) throw new LabError("FORBIDDEN", 403);
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected =
    process.env.MATCHLAB_APP_ORIGIN || new URL(request.url).origin;
  if (
    !origin ||
    origin !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new LabError("CSRF_REJECTED", 403);
}
export function safeReturn(value: unknown): string {
  return typeof value === "string" &&
    /^\/matchlab\/(?!login|recover|reset)[a-z0-9/-]+(?:\?[^\\#]*)?$/.test(
      value,
    ) &&
    !value.includes("//")
    ? value
    : "/matchlab/overview";
}
export async function rateLimit(
  request: Request,
  action: string,
  identity = "",
  max = 60,
) {
  // Do not trust forwarding headers on arbitrary self-hosted deployments. A global
  // bucket plus an identity bucket also covers environments without a trusted proxy.
  const key = createHash("sha256")
    .update(`${action}:${identity}`)
    .digest("hex");
  const { data, error } = await adminClient().rpc("ml_rate", {
    k: key,
    maximum: max,
    seconds: 60,
  });
  dbError(error);
  if (!data) throw new LabError("RATE_LIMITED", 429);
}
export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
};
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: PRIVATE_HEADERS });
}
export function failure(error: unknown) {
  if (error instanceof z.ZodError)
    return json(
      {
        code: "INVALID_DATA",
        fields: error.issues.map((i) => ({
          path: i.path.join("."),
          message: "Vérifiez ce champ.",
        })),
      },
      400,
    );
  if (error instanceof LabError)
    return json({ code: error.code }, error.status);
  console.error(
    "[MatchLab] unexpected request failure",
    error instanceof Error ? error.name : "unknown",
  );
  return json({ code: "INTERNAL_ERROR" }, 500);
}
export async function body(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new LabError("INVALID_DATA", 400);
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 1024 * 1024)
    throw new LabError("PAYLOAD_TOO_LARGE", 413);
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new LabError("INVALID_DATA", 400);
  }
}
