"use client";
import Image from "next/image";
import { useState } from "react";
import { MediaManager } from "./MediaManager";
import { Plus } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import { POSITIONS, positionNames } from "@/lib/matchlab/questionnaire";
import type { Player, Target } from "@/lib/matchlab/schema";
import {
  useLab,
  useMutation,
  api,
  Heading,
  Empty,
  Modal,
  ScopeFields,
  Feedback,
  Pagination,
} from "./shared";
const fundamentalKeys = [
  "technique",
  "tactical",
  "physical",
  "mental",
] as const;
export function Players() {
  const { data } = useLab();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Player | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const mutation = useMutation();
  const [warning, setWarning] = useState("");
  const [targetOpen, setTargetOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | undefined>();
  const players = data.graph.players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()),
  );
  const canWrite = data.member.role !== "reader";
  return (
    <>
      <Heading title={t.nav.players} eyebrow={t.players.eyebrow}>
        {canWrite && (
          <Modal
            title={editing ? t.edit : t.players.add}
            trigger={
              <>
                <Plus size={17} />
                {t.players.add}
              </>
            }
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditing(undefined);
              mutation.clear();
            }}
          >
            <>
              <form
                key={editing?.id || "new"}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );
                  const payload = {
                    ...(editing ? { id: editing.id } : {}),
                    full_name: form.full_name,
                    usual_position: form.usual_position,
                    strong_foot: form.strong_foot,
                    status: form.status,
                    scouting: form.scouting,
                    target_profile: form.target_profile,
                    fundamentals: Object.fromEntries(
                      fundamentalKeys
                        .filter((k) => form[k] !== "")
                        .map((k) => [k, Number(form[k])]),
                    ),
                  };
                  await mutation.run(async () => {
                    const result = await api("data", {
                      kind: "players",
                      payload,
                      version: editing?.version || 0,
                      membership: editing
                        ? undefined
                        : {
                            season_id: form.season_id,
                            category_id: form.category_id,
                            jersey: Number(form.jersey),
                          },
                    });
                    if (result.jersey_warning)
                      setWarning(t.players.jerseyWarning);
                    setOpen(false);
                    setEditing(undefined);
                  });
                }}
              >
                <div className="ml-form-grid">
                  <label className="wide">
                    {t.players.name}
                    <input
                      name="full_name"
                      required
                      minLength={2}
                      maxLength={120}
                      defaultValue={editing?.full_name}
                    />
                  </label>
                  {!editing && (
                    <>
                      <ScopeFields />
                      <label>
                        {t.players.jersey}
                        <input
                          name="jersey"
                          type="number"
                          min={1}
                          max={99}
                          required
                        />
                      </label>
                    </>
                  )}
                  <label>
                    {t.players.usual}
                    <select
                      name="usual_position"
                      defaultValue={editing?.usual_position || "CM"}
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {positionNames[p]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t.players.foot}
                    <select
                      name="strong_foot"
                      defaultValue={editing?.strong_foot || "right"}
                    >
                      <option value="right">{t.players.right}</option>
                      <option value="left">{t.players.left}</option>
                      <option value="both">{t.players.both}</option>
                    </select>
                  </label>
                  <label>
                    {t.status}
                    <select
                      name="status"
                      defaultValue={editing?.status || "active"}
                    >
                      {["active", "injured", "inactive", "trial"].map((s) => (
                        <option value={s} key={s}>
                          {t.players[s as "active"]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t.players.columns[6]}
                    <input
                      name="target_profile"
                      maxLength={200}
                      defaultValue={editing?.target_profile}
                    />
                  </label>
                  <label className="wide">
                    {t.players.notes}
                    <textarea
                      name="scouting"
                      rows={3}
                      maxLength={5000}
                      defaultValue={editing?.scouting}
                    />
                  </label>
                  <fieldset className="wide">
                    <legend>{t.players.fundamentals}</legend>
                    <div className="ml-fundamentals">
                      {fundamentalKeys.map((k, i) => (
                        <label key={k}>
                          {t.players.columns[i + 2]}
                          <select
                            name={k}
                            defaultValue={editing?.fundamentals[k] ?? ""}
                          >
                            <option value="">{t.analysis.unanswered}</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <Feedback {...mutation} />
                <div className="ml-actions">
                  <button
                    type="button"
                    className="ml-button secondary"
                    onClick={() => {
                      setOpen(false);
                      setEditing(undefined);
                    }}
                  >
                    {t.cancel}
                  </button>
                  <button className="ml-button" disabled={mutation.busy}>
                    {mutation.busy ? t.saving : t.save}
                  </button>
                </div>
              </form>
              {editing && (
                <section>
                  <h3>Affectations et dossards</h3>
                  {data.graph.memberships
                    .filter((m) => m.player_id === editing.id)
                    .map((m) => (
                      <form
                        key={`${m.id}-${m.version}`}
                        className="ml-actions"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const jersey = Number(
                            new FormData(e.currentTarget).get("jersey"),
                          );
                          await mutation.run(async () => {
                            await api("data", {
                              kind: "memberships",
                              version: m.version,
                              payload: {
                                id: m.id,
                                player_id: m.player_id,
                                season_id: m.season_id,
                                category_id: m.category_id,
                                jersey,
                              },
                            });
                            if (
                              data.graph.memberships.some(
                                (other) =>
                                  other.id !== m.id &&
                                  other.season_id === m.season_id &&
                                  other.category_id === m.category_id &&
                                  other.jersey === jersey,
                              )
                            )
                              setWarning(t.players.jerseyWarning);
                          });
                        }}
                      >
                        <label>
                          {
                            data.graph.seasons.find((s) => s.id === m.season_id)
                              ?.name
                          }{" "}
                          · {m.category_id}
                          <input
                            name="jersey"
                            type="number"
                            min={1}
                            max={99}
                            required
                            defaultValue={m.jersey}
                          />
                        </label>
                        <button
                          className="ml-button secondary"
                          disabled={mutation.busy}
                        >
                          {t.save}
                        </button>
                      </form>
                    ))}
                </section>
              )}
            </>
          </Modal>
        )}
      </Heading>
      <aside className="ml-notice">
        <strong>{t.players.reading}</strong>
        <p>{t.players.explanation}</p>
      </aside>
      {warning && (
        <p className="ml-notice" role="status">
          {warning}
        </p>
      )}
      <label className="ml-search">
        {t.search}
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <div className="ml-card">
        {players.length ? (
          <>
            <div className="ml-table-wrap">
              <table>
                <thead>
                  <tr>
                    {t.players.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.slice((page - 1) * 20, page * 20).map((p) => {
                    const memberships = data.graph.memberships.filter(
                      (m) => m.player_id === p.id,
                    );
                    const photo = data.graph.media.find(
                      (m) => m.player_id === p.id && m.purpose === "photo",
                    );
                    return (
                      <tr key={p.id}>
                        <td>
                          <button
                            className="ml-player-name"
                            disabled={!canWrite}
                            onClick={() => {
                              setEditing(p);
                              setOpen(true);
                            }}
                          >
                            <span className="ml-player-avatar">
                              {photo ? (
                                <Image
                                  src={`/api/matchlab/media?id=${photo.id}`}
                                  width={40}
                                  height={40}
                                  unoptimized
                                  alt=""
                                />
                              ) : (
                                p.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                              )}
                            </span>
                            <strong>{p.full_name}</strong>
                          </button>
                          <small>
                            {memberships.map((m) => `#${m.jersey}`).join(" · ")}
                          </small>
                        </td>
                        <td>
                          {memberships.map((m) => m.category_id).join(" · ")}
                          <small>{positionNames[p.usual_position]}</small>
                        </td>
                        {fundamentalKeys.map((k) => (
                          <td key={k}>{p.fundamentals[k] ?? "—"}</td>
                        ))}
                        <td>{p.target_profile || "—"}</td>
                        <td>
                          <span className="ml-muted">
                            {t.players.inactiveCompatibility}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={players.length} onChange={setPage} />
          </>
        ) : (
          <Empty text={t.noPlayers} />
        )}
      </div>
      <section className="ml-card ml-targets">
        <div className="ml-section-title">
          <h2>{t.players.targets}</h2>
          {canWrite && (
            <Modal
              title={editingTarget ? t.edit : t.players.addTarget}
              trigger={<Plus size={18} />}
              open={targetOpen}
              onOpenChange={(v) => {
                setTargetOpen(v);
                if (!v) setEditingTarget(undefined);
                mutation.clear();
              }}
            >
              <form
                key={editingTarget?.id || "new-target"}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const values = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );
                  await mutation.run(async () => {
                    await api("data", {
                      kind: "targets",
                      version: editingTarget?.version || 0,
                      payload: {
                        ...(editingTarget ? { id: editingTarget.id } : {}),
                        season_id: editingTarget?.season_id || values.season_id,
                        category_id:
                          editingTarget?.category_id || values.category_id,
                        position: values.position,
                        title: values.title,
                        notes: values.notes,
                        fundamentals: Object.fromEntries(
                          fundamentalKeys
                            .filter((k) => values[k] !== "")
                            .map((k) => [k, Number(values[k])]),
                        ),
                      },
                    });
                    setTargetOpen(false);
                    setEditingTarget(undefined);
                  });
                }}
              >
                <div className="ml-form-grid">
                  {!editingTarget && <ScopeFields />}
                  <label>
                    {t.players.targetTitle}
                    <input
                      name="title"
                      required
                      minLength={2}
                      defaultValue={editingTarget?.title}
                    />
                  </label>
                  <label>
                    {t.position}
                    <select
                      name="position"
                      defaultValue={editingTarget?.position}
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {positionNames[p]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {fundamentalKeys.map((k, i) => (
                    <label key={k}>
                      {t.players.columns[i + 2]}
                      <select
                        name={k}
                        defaultValue={editingTarget?.fundamentals[k] ?? ""}
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <label className="wide">
                    {t.players.notes}
                    <textarea
                      name="notes"
                      defaultValue={editingTarget?.notes}
                    />
                  </label>
                </div>
                <Feedback {...mutation} />
                <button className="ml-button" disabled={mutation.busy}>
                  {t.save}
                </button>
              </form>
            </Modal>
          )}
        </div>
        {data.graph.targets.length ? (
          <div className="ml-feature-grid">
            {data.graph.targets.map((target) => (
              <article key={target.id}>
                <small>
                  {target.category_id} · {positionNames[target.position]}
                </small>
                <h3>{target.title}</h3>
                {canWrite && (
                  <button
                    className="ml-button secondary"
                    onClick={() => {
                      setEditingTarget(target);
                      setTargetOpen(true);
                    }}
                  >
                    {t.edit}
                  </button>
                )}
                <p>{target.notes}</p>
                <p>
                  {fundamentalKeys
                    .map(
                      (k, i) =>
                        `${t.players.columns[i + 2]} : ${target.fundamentals[k] ?? "—"}`,
                    )
                    .join(" · ")}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </section>
      <MediaManager />
    </>
  );
}
