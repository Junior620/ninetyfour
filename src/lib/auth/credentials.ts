import type { UserRole } from "@/types";

export type AccountStatus = "pending" | "active" | "rejected" | "disabled";

export const PUBLIC_ROLES: UserRole[] = ["player", "parent", "coach"];

export const ADMIN_BOOTSTRAP_EMAIL = "christianouragan@gmail.com";

export function isPublicRole(
  role: string
): role is "player" | "parent" | "coach" {
  return PUBLIC_ROLES.includes(role as "player" | "parent" | "coach");
}

// Access is read from app_metadata only: any user can rewrite their own
// user_metadata with the public anon key, so it must never grant a role or status.
export function readAccountStatus(user: {
  app_metadata?: Record<string, unknown>;
}): AccountStatus {
  const status = user.app_metadata?.status;
  if (status === "pending" || status === "active" || status === "rejected" || status === "disabled") {
    return status;
  }
  // Legacy users without status: treat as active
  return "active";
}

export function readRoleFromUser(user: {
  app_metadata?: Record<string, unknown>;
}): UserRole | null {
  const role = user.app_metadata?.role;
  return role === "player" ||
    role === "parent" ||
    role === "coach" ||
    role === "admin"
    ? role
    : null;
}

export function readNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const name = user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "User";
}
