"use client";
import { useEffect, useState } from "react";
import type { Member } from "@/lib/matchlab/schema";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
import { useLab, useMutation, Heading, api, Feedback } from "./shared";
import { RequirementsEditor } from "./Requirements";
type AdminData = {
  members: Member[];
  scopes: { user_id: string; season_id: string; category_id: string }[];
  shares: { user_id: string; kind: string; resource_id: string }[];
  audit: {
    id: number;
    action: string;
    resource: string;
    created_at: string;
    user_id: string;
  }[];
};
async function fetchAdmin(): Promise<AdminData> {
  const response = await fetch("/api/matchlab/admin", { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.code);
  return result;
}
export function Admin() {
  const { data } = useLab();
  const mutation = useMutation();
  const [details, setDetails] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  async function load() {
    setDetails(await fetchAdmin());
  }
  useEffect(() => {
    let active = true;
    fetchAdmin()
      .then((result) => {
        if (active) setDetails(result);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e.message));
      });
    return () => {
      active = false;
    };
  }, []);
  if (data.member.role !== "direction")
    return <p role="alert">{t.errors.FORBIDDEN}</p>;
  return (
    <>
      <Heading title={t.admin.title} />
      <p className="ml-notice">{t.admin.intro}</p>
      <Feedback error={error || mutation.error} success={mutation.success} />
      <div className="ml-admin-grid">
        <section className="ml-card">
          <h2>{t.admin.seasons}</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const payload = Object.fromEntries(new FormData(e.currentTarget));
              await mutation.run(async () => {
                await api("admin", { action: "season", payload });
              });
            }}
          >
            <div className="ml-form-grid">
              <label className="wide">
                {t.admin.seasonName}
                <input name="name" required minLength={2} />
              </label>
              <label>
                {t.admin.starts}
                <input name="starts_on" type="date" required />
              </label>
              <label>
                {t.admin.ends}
                <input name="ends_on" type="date" required />
              </label>
            </div>
            <button className="ml-button" disabled={mutation.busy}>
              {t.admin.addSeason}
            </button>
          </form>
          <ul>
            {data.graph.seasons.map((s) => (
              <li key={s.id}>
                {s.name} · {s.starts_on} — {s.ends_on}
              </li>
            ))}
          </ul>
        </section>
        <section className="ml-card">
          <h2>{t.admin.governance}</h2>
          <p className="ml-method">
            {!data.settings.retention_days
              ? t.admin.unset
              : data.settings.consent_policy}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await mutation.run(async () => {
                await api("admin", {
                  action: "settings",
                  version: data.settings.version,
                  payload: {
                    retention_days: Number(form.get("retention_days")),
                    consent_policy: form.get("consent_policy"),
                  },
                });
              });
            }}
          >
            <label>
              {t.admin.retention}
              <input
                name="retention_days"
                type="number"
                min={1}
                max={36500}
                required
                defaultValue={data.settings.retention_days || ""}
              />
            </label>
            <label>
              {t.admin.policy}
              <textarea
                name="consent_policy"
                required
                minLength={10}
                defaultValue={data.settings.consent_policy || ""}
              />
            </label>
            <button className="ml-button" disabled={mutation.busy}>
              {t.save}
            </button>
          </form>
        </section>
      </div>
      <RequirementsEditor />
      <section className="ml-card">
        <h2>{t.admin.members}</h2>
        <div className="ml-evaluation-list">
          {details?.members.map((m) => (
            <button
              key={m.user_id}
              className="ml-button secondary"
              onClick={() => setMember(m)}
            >
              {m.role} · {m.user_id.slice(0, 8)} · {m.active ? "✓" : "—"}
            </button>
          ))}
          <button
            className="ml-button secondary"
            onClick={() => setMember(null)}
          >
            {t.create}
          </button>
        </div>
        <form
          key={member?.user_id || "new"}
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await mutation.run(async () => {
              const payload = {
                user_id: form.get("user_id"),
                role: form.get("role"),
                active: form.get("active") === "on",
                permissions: form.getAll("permissions"),
                scopes: form.getAll("scope").map((value) => {
                  const [season_id, category_id] = String(value).split(":");
                  return { season_id, category_id };
                }),
              };
              await api("admin", {
                action: "member",
                version: member?.version || 0,
                payload,
              });
              await load();
              setMember(null);
            });
          }}
        >
          <div className="ml-form-grid">
            <label>
              {t.admin.userId}
              <input name="user_id" required defaultValue={member?.user_id} />
            </label>
            <label>
              {t.admin.role}
              <select name="role" defaultValue={member?.role || "staff"}>
                {["direction", "staff", "reader"].map((r) => (
                  <option key={r} value={r}>
                    {t.admin[r as "direction"]}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="wide">
              <legend>Affectations par saison et catégorie</legend>
              <div className="ml-checklist">
                {data.graph.seasons.flatMap((season) =>
                  ["U-14", "U-16", "U-17", "U-18"].map((category) => (
                    <label
                      className="ml-check"
                      key={`${season.id}:${category}`}
                    >
                      <input
                        type="checkbox"
                        name="scope"
                        value={`${season.id}:${category}`}
                        defaultChecked={details?.scopes.some(
                          (s) =>
                            s.user_id === member?.user_id &&
                            s.season_id === season.id &&
                            s.category_id === category,
                        )}
                      />
                      {season.name} · {category}
                    </label>
                  )),
                )}
              </div>
            </fieldset>
          </div>
          <label className="ml-check">
            <input
              type="checkbox"
              name="active"
              defaultChecked={member?.active ?? true}
            />
            {t.admin.active}
          </label>
          <p>{t.admin.permissions}</p>
          <div className="ml-checklist">
            {["export", "media", "site_editor", "site_publisher"].map((p) => (
              <label key={p} className="ml-check">
                <input
                  name="permissions"
                  type="checkbox"
                  value={p}
                  defaultChecked={member?.permissions.includes(p)}
                />
                {p}
              </label>
            ))}
          </div>
          <div className="ml-actions">
            <button className="ml-button" disabled={mutation.busy}>
              {t.admin.grant}
            </button>
            {member && (
              <button
                className="ml-button secondary"
                type="button"
                disabled={mutation.busy}
                onClick={() =>
                  mutation.run(async () => {
                    await api("admin", {
                      action: "revoke",
                      payload: { user_id: member.user_id },
                    });
                    await load();
                  })
                }
              >
                {t.admin.revoke}
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="ml-card">
        <h2>{t.admin.share}</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.currentTarget));
            await mutation.run(async () => {
              await api("admin", { action: "share", payload });
              await load();
            });
          }}
        >
          <div className="ml-form-grid">
            <label>
              {t.admin.userId}
              <input name="user_id" required />
            </label>
            <label>
              {t.admin.kind}
              <select name="kind">
                <option value="match">{t.reports.match}</option>
                <option value="player">{t.reports.player}</option>
              </select>
            </label>
            <label className="wide">
              {t.admin.resourceId}
              <input name="resource_id" required />
            </label>
          </div>
          <button className="ml-button" disabled={mutation.busy}>
            {t.save}
          </button>
        </form>
        {details?.shares.map((s) => (
          <div className="ml-cms-row" key={`${s.user_id}-${s.resource_id}`}>
            <small>
              {s.user_id.slice(0, 8)} · {s.kind} · {s.resource_id}
            </small>
            <button
              className="ml-button secondary"
              onClick={() =>
                mutation.run(async () => {
                  await api("admin", {
                    action: "share",
                    payload: { ...s, remove: true },
                  });
                  await load();
                })
              }
            >
              {t.admin.revoke}
            </button>
          </div>
        ))}
      </section>
      <section className="ml-card">
        <h2>{t.admin.audit}</h2>
        <div className="ml-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.match.date}</th>
                <th>{t.admin.userId}</th>
                <th>{t.admin.kind}</th>
              </tr>
            </thead>
            <tbody>
              {details?.audit.map((a) => (
                <tr key={a.id}>
                  <td>{a.created_at}</td>
                  <td>{a.user_id?.slice(0, 8) || "—"}</td>
                  <td>
                    {a.action} · {a.resource}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
