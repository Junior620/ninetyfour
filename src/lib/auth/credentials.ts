import type { UserRole } from "@/types";

export const DEFAULT_DEMO_PASSWORD = "nofa2026";

/**
 * Comptes démo pré-seedés en base (prisma/seed.ts).
 * Le mot de passe réel est hashé en DB (PRIVATE_SPACE_PASSWORD ou nofa2026).
 */
export const DEMO_ACCOUNTS: Record<UserRole, { email: string; name: string }> =
  {
    player: { email: "joueur@ninetyone.demo", name: "Kofi Mensah" },
    parent: { email: "parent@ninetyone.demo", name: "M. Mensah" },
    coach: { email: "coach@ninetyone.demo", name: "Coach Martin" },
    admin: { email: "admin@ninetyone.demo", name: "Admin NOFA" },
  };
