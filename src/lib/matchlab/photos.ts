import type { Consent, Media } from "./schema";

/** Newest first, so every lookup (avatar, PDF, archive) shows the latest photo. */
export const newestFirst = (media: Media[]) =>
  [...media].sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? ""),
  );

/** Consent allowing a profile photo now: same rule as ml_attach_media in the database. */
export function photoConsent(
  consents: Consent[],
  playerId: string,
  now: number,
) {
  return consents
    .filter(
      (c) =>
        c.player_id === playerId &&
        c.purpose === "internal_photo" &&
        !c.revoked_at &&
        Date.parse(c.granted_at) <= now &&
        Date.parse(c.expires_at) > now,
    )
    .sort((a, b) => Date.parse(b.expires_at) - Date.parse(a.expires_at))[0];
}
