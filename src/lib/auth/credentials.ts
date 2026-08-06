import type { UserRole } from "@/types";

export type AccountStatus = "pending" | "active" | "rejected" | "disabled";

export const PUBLIC_ROLES: UserRole[] = ["player", "parent", "coach"];

export const ADMIN_BOOTSTRAP_EMAIL = "christianouragan@gmail.com";

export function isPublicRole(
  role: string
): role is "player" | "parent" | "coach" {
  return PUBLIC_ROLES.includes(role as "player" | "parent" | "coach");
}

export function readAccountStatus(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): AccountStatus {
  const fromApp = user.app_metadata?.status;
  const fromUser = user.user_metadata?.status;
  if (fromApp === "pending" || fromApp === "active" || fromApp === "rejected" || fromApp === "disabled") {
    return fromApp;
  }
  if (fromUser === "pending" || fromUser === "active" || fromUser === "rejected" || fromUser === "disabled") {
    return fromUser;
  }
  // Legacy users without status: treat as active
  return "active";
}

export function readRoleFromUser(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): UserRole | null {
  const fromApp = user.app_metadata?.role;
  const fromUser = user.user_metadata?.role;
  const candidates = [fromApp, fromUser];
  for (const value of candidates) {
    if (
      value === "player" ||
      value === "parent" ||
      value === "coach" ||
      value === "admin"
    ) {
      return value;
    }
  }
  return null;
}

export function readNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const name = user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "User";
}
