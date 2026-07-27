import type { UserRole as PrismaUserRole } from "@prisma/client";
import type { UserRole } from "@/types";

const PRISMA_TO_APP: Record<PrismaUserRole, UserRole> = {
  PLAYER: "player",
  PARENT: "parent",
  COACH: "coach",
  ADMIN: "admin",
};

const APP_TO_PRISMA: Record<UserRole, PrismaUserRole> = {
  player: "PLAYER",
  parent: "PARENT",
  coach: "COACH",
  admin: "ADMIN",
};

export function toAppRole(role: PrismaUserRole): UserRole {
  return PRISMA_TO_APP[role];
}

export function toPrismaRole(role: UserRole): PrismaUserRole {
  return APP_TO_PRISMA[role];
}
