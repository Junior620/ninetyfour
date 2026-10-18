"use client";
import { useState } from "react";
import { Camera, Maximize2 } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import { photoConsent } from "@/lib/matchlab/photos";
import type { Player } from "@/lib/matchlab/schema";
import {
  useLab,
  useMutation,
  api,
  Feedback,
  PlayerAvatar,
  formatDay,
} from "./shared";

const MAX_PHOTO = 5 * 1024 * 1024;
const day = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Profile photo inside the player file: view it, record the photo consent, import or replace it. */
export function PlayerPhoto({ player }: { player?: Player }) {
  const { data } = useLab();
  const mutation = useMutation();
  const [now] = useState(() => Date.now());
  if (!data.member.permissions.includes("media")) return null;
  if (!player) return <p className="ml-method">{t.media.afterSave}</p>;
  const canWrite = data.member.role !== "reader";
  const governed =
    !!data.settings.retention_days && !!data.settings.consent_policy;
  const photo = data.graph.media.find(
    (m) => m.player_id === player.id && m.purpose === "photo",
  );
  const consent = photoConsent(data.graph.consents, player.id, now);
  const today = day(new Date(now));
  return (
    <section className="ml-photo-profile" aria-label={t.media.profile}>
      <PlayerAvatar playerId={player.id} name={player.full_name} size={112} />
      <div className="ml-photo-body">
        <h3>{t.media.profile}</h3>
        {!photo && <p className="ml-muted">{t.media.noPhoto}</p>}
        {consent && (
          <p className="ml-muted">
            {t.media.consentUntil} {consent.guardian_name} ·{" "}
            {t.media.expires.toLowerCase()}{" "}
            {formatDay(consent.expires_at.slice(0, 10))}
          </p>
        )}
        {((canWrite && consent) || photo) && (
          <div className="ml-actions">
            {canWrite && consent && (
              <label className="ml-button secondary ml-file-button">
                <Camera size={17} aria-hidden />
                {photo ? t.media.replacePhoto : t.media.importPhoto}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={mutation.busy}
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    await mutation.run(async () => {
                      if (!["image/jpeg", "image/png"].includes(file.type))
                        throw new Error("PHOTO_FORMAT");
                      if (file.size > MAX_PHOTO)
                        throw new Error("PAYLOAD_TOO_LARGE");
                      const form = new FormData();
                      form.set("player_id", player.id);
                      form.set("consent_id", consent.id);
                      form.set("purpose", "photo");
                      form.set("file", file);
                      const response = await fetch("/api/matchlab/media", {
                        method: "POST",
                        body: form,
                      });
                      const result = await response.json();
                      if (!response.ok) throw new Error(result.code);
                    });
                    input.value = "";
                  }}
                />
              </label>
            )}
            {photo && (
              <a
                className="ml-button secondary"
                href={`/api/matchlab/media?id=${photo.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Maximize2 size={16} aria-hidden />
                {t.media.viewPhoto}
              </a>
            )}
          </div>
        )}
        {canWrite && consent && <small>{t.media.formats}</small>}
        {canWrite && !consent && !governed && (
          <p className="ml-notice">{t.errors.GOVERNANCE_REQUIRED}</p>
        )}
        {canWrite && !consent && governed && (
          <form
            className="ml-photo-consent"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await mutation.run(async () => {
                await api("data", {
                  kind: "consents",
                  version: 0,
                  payload: {
                    player_id: player.id,
                    guardian_name: f.get("guardian_name"),
                    purpose: "internal_photo",
                    policy: data.settings.consent_policy || "",
                    // Whole days: valid from the start of the signing day to the end of the last one.
                    granted_at: new Date(
                      `${f.get("granted_at")}T00:00:00`,
                    ).toISOString(),
                    expires_at: new Date(
                      `${f.get("expires_at")}T23:59:59`,
                    ).toISOString(),
                    revoked_at: null,
                  },
                });
              });
            }}
          >
            <p>{t.media.consentNeeded}</p>
            <fieldset disabled={mutation.busy} className="ml-form-grid">
              <label className="wide">
                {t.media.guardian}
                <input
                  name="guardian_name"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
              <label>
                {t.media.granted}
                <input
                  name="granted_at"
                  type="date"
                  required
                  max={today}
                  defaultValue={today}
                />
              </label>
              <label>
                {t.media.expires}
                <input name="expires_at" type="date" required min={today} />
              </label>
            </fieldset>
            <button className="ml-button secondary" disabled={mutation.busy}>
              {t.media.recordShort}
            </button>
          </form>
        )}
        <Feedback {...mutation} />
      </div>
    </section>
  );
}
