const POSITION_LABELS: Record<string, { fr: string; en: string }> = {
  GARDIEN: { fr: "Gardien", en: "Goalkeeper" },
  DEFENSEUR_CENTRAL: { fr: "Défenseur central", en: "Centre back" },
  LATERAL_DROIT: { fr: "Latéral droit", en: "Right back" },
  LATERAL_GAUCHE: { fr: "Latéral gauche", en: "Left back" },
  MILIEU_CENTRAL: { fr: "Milieu défensif", en: "Defensive midfielder" },
  MILIEU_RELAYEUR: { fr: "Milieu relayeur", en: "Box-to-box midfielder" },
  MILIEU_OFFENSIF: { fr: "Milieu offensif", en: "Attacking midfielder" },
  AILE_DROIT: { fr: "Ailier droit", en: "Right winger" },
  AILE_GAUCHE: { fr: "Ailier gauche", en: "Left winger" },
  ATTAQUANT: { fr: "Attaquant", en: "Forward" },
};

export function formatPositionLabel(raw: string | null | undefined, locale: string): string {
  if (!raw?.trim()) return "—";
  const key = raw.trim().toUpperCase().replace(/\s+/g, "_");
  const entry = POSITION_LABELS[key];
  if (entry) return locale === "en" ? entry.en : entry.fr;
  // Already human-readable
  return raw.replace(/_/g, " ");
}

export type AppStatus = "pending" | "accepted" | "rejected" | "interview" | "reviewed";

export function normalizeAppStatus(raw: string | null | undefined): AppStatus {
  const s = String(raw ?? "pending").toLowerCase();
  if (s === "accepted" || s === "acceptée" || s === "accepte") return "accepted";
  if (s === "rejected" || s === "refusée" || s === "refusee" || s === "refused") return "rejected";
  if (s === "interview" || s === "entretien") return "interview";
  if (s === "reviewed") return "reviewed";
  return "pending";
}
