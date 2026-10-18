"use client";
import { useState } from "react";
import { fr as t } from "@/lib/matchlab/messages";
import { useLab, useMutation, api, Feedback } from "./shared";
export function MediaManager() {
  const { data } = useLab();
  const [player, setPlayer] = useState("");
  const [observedAt] = useState(() => Date.now());
  const mutation = useMutation();
  if (!data.member.permissions.includes("media")) return null;
  const consents = data.graph.consents.filter((c) => c.player_id === player);
  const media = data.graph.media.filter((m) => m.player_id === player);
  return (
    <section className="ml-card">
      <h2>{t.players.photo}</h2>
      <p className="ml-method">{t.players.photoHint}</p>
      <label>
        {t.players.columns[0]}
        <select value={player} onChange={(e) => setPlayer(e.target.value)}>
          <option value="">—</option>
          {data.graph.players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </label>
      <Feedback {...mutation} />
      {player && (
        <>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await mutation.run(async () => {
                await api("data", {
                  kind: "consents",
                  version: 0,
                  payload: {
                    player_id: player,
                    guardian_name: f.get("guardian_name"),
                    purpose: f.get("purpose"),
                    // Replaced on the server by the policy in force.
                    policy: t.media.defaultPolicy,
                    granted_at: new Date(
                      String(f.get("granted_at")),
                    ).toISOString(),
                    expires_at: new Date(
                      String(f.get("expires_at")),
                    ).toISOString(),
                    revoked_at: null,
                  },
                });
              });
            }}
          >
            <fieldset disabled={data.member.role === "reader"}>
              <div className="ml-form-grid">
                <label>
                  {t.media.guardian}
                  <input name="guardian_name" required minLength={2} />
                </label>
                <label>
                  {t.media.purpose}
                  <select name="purpose">
                    {(["internal_photo", "export_photo", "dossier_share"] as const).map(
                      (p) => (
                        <option key={p} value={p}>
                          {t.media.purposes[p]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  {t.media.granted}
                  <input name="granted_at" type="datetime-local" required />
                </label>
                <label>
                  {t.media.expires}
                  <input name="expires_at" type="datetime-local" required />
                </label>
              </div>
              <button className="ml-button" disabled={mutation.busy}>
                {t.media.record}
              </button>
            </fieldset>
          </form>
          {consents.map((c) => (
            <div className="ml-cms-row" key={c.id}>
              <span>
                {t.media.purposes[c.purpose]}{" "}
                · {c.guardian_name} · {c.expires_at.slice(0, 10)}
              </span>
              <button
                className="ml-button secondary"
                disabled={
                  !!c.revoked_at ||
                  mutation.busy ||
                  data.member.role === "reader"
                }
                onClick={() =>
                  mutation.run(async () => {
                    const { version, ...payload } = c;
                    await api("data", {
                      kind: "consents",
                      version,
                      payload: {
                        ...payload,
                        revoked_at: new Date().toISOString(),
                      },
                    });
                  })
                }
              >
                {c.revoked_at ? t.media.revoked : t.media.withdraw}
              </button>
            </div>
          ))}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              form.set("player_id", player);
              await mutation.run(async () => {
                const response = await fetch("/api/matchlab/media", {
                  method: "POST",
                  body: form,
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.code);
              });
            }}
          >
            <div className="ml-form-grid">
              <label>
                {t.media.consent}
                <select name="consent_id" required>
                  <option value="">—</option>
                  {consents
                    .filter(
                      (c) =>
                        !c.revoked_at && Date.parse(c.expires_at) > observedAt,
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.guardian_name} · {t.media.purposes[c.purpose]}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                {t.media.fileType}
                <select name="purpose">
                  <option value="photo">{t.media.photo}</option>
                  <option value="proof">{t.media.proof}</option>
                </select>
              </label>
              <label className="wide">
                {t.media.fileHint}
                <input
                  name="file"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  required
                />
              </label>
            </div>
            <button
              className="ml-button"
              disabled={mutation.busy || data.member.role === "reader"}
            >
              {t.media.upload}
            </button>
          </form>
          <div className="ml-feature-grid">
            {media.map((m) => (
              <a
                className="ml-card"
                key={m.id}
                href={`/api/matchlab/media?id=${m.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {m.purpose === "photo" ? t.media.photo : t.media.proof} ·{" "}
                {Math.round(m.bytes / 1024)} Ko
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
