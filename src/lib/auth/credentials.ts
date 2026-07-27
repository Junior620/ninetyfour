import type { UserRole } from "@/types";

export const DEFAULT_DEMO_PASSWORD = "nofa2026";

/**
 * Comptes démo (mock). En production, surcharger via :
 * PRIVATE_SPACE_PASSWORD (mot de passe unique pour tous les rôles)
 */
export const DEMO_ACCOUNTS: Record<UserRole, { email: string }> = {
  player: { email: "joueur@ninetyone.demo" },
  parent: { email: "parent@ninetyone.demo" },
  coach: { email: "coach@ninetyone.demo" },
  admin: { email: "admin@ninetyone.demo" },
};

export function getDemoPassword(): string {
  return process.env.PRIVATE_SPACE_PASSWORD?.trim() || DEFAULT_DEMO_PASSWORD;
}

export function verifyCredentials(
  role: UserRole,
  email: string,
  password: string
): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const expectedEmail = DEMO_ACCOUNTS[role].email.toLowerCase();
  const expectedPassword = getDemoPassword();

  return normalizedEmail === expectedEmail && password === expectedPassword;
}
