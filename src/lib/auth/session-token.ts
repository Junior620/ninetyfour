import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/types";

export const SESSION_COOKIE = "nofa_session";
export const ROLE_COOKIE = "nofa_role";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const VALID_ROLES = new Set(["player", "parent", "coach", "admin"]);

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  status?: "active" | "pending" | "rejected" | "disabled";
};

function isSessionRole(value: unknown): value is UserRole {
  return typeof value === "string" && VALID_ROLES.has(value);
}

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.PRIVATE_SPACE_PASSWORD?.trim() ||
    "dev-only-auth-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    status: payload.status ?? "active",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const name = typeof payload.name === "string" ? payload.name : null;
    const role = isSessionRole(payload.role) ? payload.role : null;
    const rawStatus = payload.status;
    const status =
      rawStatus === "pending" ||
      rawStatus === "rejected" ||
      rawStatus === "disabled" ||
      rawStatus === "active"
        ? rawStatus
        : "active";

    if (!sub || !email || !name || !role) return null;
    if (status !== "active") return null;

    return { sub, email, name, role, status };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function roleCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
