"use client";
import { useRef, useState } from "react";
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
/** Default consent window: from today for one year, editable. */
const defaultDates = (now: number) => {
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);
  return { today: day(new Date(now)), nextYear: day(end) };
};
export type GuardianConsent = {
  guardian: string;
  granted: string;
  expires: string;
};

/** Same limits as the media API, checked before anything is saved. */
export function checkPhoto(file: File) {
  if (!["image/jpeg", "image/png"].includes(file.type))
    throw new Error("PHOTO_FORMAT");
  if (file.size > MAX_PHOTO) throw new Error("PAYLOAD_TOO_LARGE");
}

/** Records the guardian's consent when none is current, then uploads the photo. */
export async function attachPhoto(
  playerId: string,
  file: File,
  consent: { id: string } | GuardianConsent,
) {
  checkPhoto(file);
  let consentId: string;
  if ("id" in consent) consentId = consent.id;
  else {
    if (consent.guardian.trim().length < 2)
      throw new Error("GUARDIAN_REQUIRED");
    if (!consent.granted || !consent.expires) throw new Error("INVALID_DATA");
    const saved = await api("data", {
      kind: "consents",
      version: 0,
      payload: {
        player_id: playerId,
        guardian_name: consent.guardian.trim(),
        purpose: "internal_photo",
        // Replaced on the server by the policy in force.
        policy: t.media.defaultPolicy,
        // Whole days: from the start of the signing day to the end of the last one.
        granted_at: new Date(`${consent.granted}T00:00:00`).toISOString(),
        expires_at: new Date(`${consent.expires}T23:59:59`).toISOString(),
        revoked_at: null,
      },
    });
    consentId = saved.id;
  }
  const form = new FormData();
  form.set("player_id", playerId);
  form.set("consent_id", consentId);
  form.set("purpose", "photo");
  form.set("file", file);
  const response = await fetch("/api/matchlab/media", {
    method: "POST",
    body: form,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.code);
}

/** Guardian name and consent dates, shared by the new player form and the player file. */
function ConsentFields({ prefix = "" }: { prefix?: string }) {
  const [now] = useState(() => Date.now());
  const { today, nextYear } = defaultDates(now);
  return (
    <div className="ml-form-grid">
      <label className="wide">
        {t.media.guardian}
        <input
          name={`${prefix}guardian`}
          minLength={2}
          maxLength={120}
          autoComplete="off"
        />
      </label>
      <label>
        {t.media.granted}
        <input
          name={`${prefix}granted`}
          type="date"
          max={today}
          defaultValue={today}
        />
      </label>
      <label>
        {t.media.expires}
        <input
          name={`${prefix}expires`}
          type="date"
          min={today}
          defaultValue={nextYear}
        />
      </label>
    </div>
  );
}

/** Optional photo inside "Ajouter un joueur": uploaded right after the player is created. */
export function NewPlayerPhotoFields() {
  const { data } = useLab();
  if (!data.member.permissions.includes("media")) return null;
  return (
    <fieldset className="wide ml-new-photo">
      <legend>{t.media.photoOptional}</legend>
      <label>
        {t.media.formats}
        <input name="photo_file" type="file" accept="image/jpeg,image/png" />
      </label>
      <ConsentFields prefix="photo_" />
    </fieldset>
  );
}
export const newPlayerPhoto = (form: Record<string, FormDataEntryValue>) => {
  const file = form.photo_file;
  if (!(file instanceof File) || !file.size) return null;
  return {
    file,
    consent: {
      guardian: String(form.photo_guardian ?? ""),
      granted: String(form.photo_granted ?? ""),
      expires: String(form.photo_expires ?? ""),
    },
  };
};

/** Profile photo inside the player file: view it, import or replace it in one step. */
export function PlayerPhoto({ player }: { player: Player }) {
  const { data } = useLab();
  const mutation = useMutation();
  const consentForm = useRef<HTMLFormElement>(null);
  const [now] = useState(() => Date.now());
  if (!data.member.permissions.includes("media")) return null;
  const canWrite = data.member.role !== "reader";
  const photo = data.graph.media.find(
    (m) => m.player_id === player.id && m.purpose === "photo",
  );
  const consent = photoConsent(data.graph.consents, player.id, now);
  const upload = (
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
            if (consent) return attachPhoto(player.id, file, consent);
            const f = new FormData(consentForm.current!);
            await attachPhoto(player.id, file, {
              guardian: String(f.get("guardian") ?? ""),
              granted: String(f.get("granted") ?? ""),
              expires: String(f.get("expires") ?? ""),
            });
          });
          input.value = "";
        }}
      />
    </label>
  );
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
        {canWrite && !consent && (
          <form
            ref={consentForm}
            className="ml-photo-consent"
            onSubmit={(e) => e.preventDefault()}
          >
            <p>{t.media.consentNeeded}</p>
            <ConsentFields />
          </form>
        )}
        {(canWrite || photo) && (
          <div className="ml-actions">
            {canWrite && upload}
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
        {canWrite && <small>{t.media.formats}</small>}
        <Feedback {...mutation} />
      </div>
    </section>
  );
}
