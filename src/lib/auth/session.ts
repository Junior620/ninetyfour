import type { UserRole } from "@/types";

export const AUTH_COOKIE = "nofa_role";
export const AUTH_STORAGE_KEY = "nofa_role";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

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

/** Client-only: persist role in cookie + localStorage. */
export function setRoleClient(role: UserRole) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(role)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, role);
  } catch {
    // ignore quota / private mode
  }
}

/** Client-only: clear session. */
export function clearRoleClient() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
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
    .find((row) => row.startsWith(`${AUTH_COOKIE}=`));
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
