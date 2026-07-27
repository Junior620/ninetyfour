import type { UserRole } from "@/types";
import {
  ROLE_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/session-token";

export { ROLE_COOKIE, SESSION_COOKIE };
export const AUTH_STORAGE_KEY = "nofa_role";

/** @deprecated Use ROLE_COOKIE — kept for older references */
export const AUTH_COOKIE = ROLE_COOKIE;

export const ROLE_PATHS: Record<UserRole, string> = {
  player: "/dashboard/joueur",
  parent: "/dashboard/parent",
  coach: "/dashboard/coach",
  admin: "/dashboard/admin",
};

const VALID_ROLES = new Set<string>(["player", "parent", "coach", "admin"]);

export function isUserRole(value: string | null | undefined): value is UserRole {
  return !!value && VALID_ROLES.has(value);
}

export function parseRoleCookie(value: string | undefined | null): UserRole | null {
  return isUserRole(value) ? value : null;
}

/** Client-only: mirror role for UI (server also sets ROLE_COOKIE). */
export function setRoleClient(role: UserRole) {
  if (typeof document === "undefined") return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, role);
  } catch {
    // ignore quota / private mode
  }
}

/** Client-only: clear local role cache. */
export function clearRoleClient() {
  if (typeof document === "undefined") return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Client-only: read role from cookie, fallback localStorage. */
export function getRoleClient(): UserRole | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ROLE_COOKIE}=`));
  if (match) {
    const raw = decodeURIComponent(match.split("=").slice(1).join("="));
    const fromCookie = parseRoleCookie(raw);
    if (fromCookie) return fromCookie;
  }

  try {
    return parseRoleCookie(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Client-only: invalidate server session then clear local cache. */
export async function logoutClient() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // still clear local state
  } finally {
    clearRoleClient();
  }
}
