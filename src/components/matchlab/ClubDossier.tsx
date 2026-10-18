"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileDown, FilePlus2, ShieldCheck, Undo2, Pencil } from "lucide-react";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
import { displayScore } from "@/lib/matchlab/scoring";
import { positionNames } from "@/lib/matchlab/questionnaire";
import {
  DOSSIER_SECTIONS,
  DEFAULT_SECTIONS,
  SENSITIVE_SECTIONS,
  type DossierContent,
  type DossierDraft,
  type DossierSection,
  type DossierSequence,
} from "@/lib/matchlab/dossier";
import type { Dossier, Player } from "@/lib/matchlab/schema";
import { contactInfo } from "@/lib/data/academy";
import {
  useLab,
  useMutation,
  api,
  Modal,
  Feedback,
  PlayerAvatar,
  formatDay,
} from "./shared";

type Preview = {
  content: DossierContent;
  available: DossierSequence[];
  consents: { share: boolean; photo: boolean };
};
const today = () => new Date().toISOString().slice(0, 10);
const yearAgo = () =>
  new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
const decimal = (v: number | null) =>
  v === null
    ? "—"
    : v.toLocaleString("fr-FR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
const monthLabel = (p: string) =>
  new Date(`${p}-15T12:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
const dayOf = (iso: string | null) => (iso ? formatDay(iso.slice(0, 10)) : "");

/** Club dossiers of one player: prepared by the staff, validated by the direction. */
export function ClubDossiers({ player }: { player: Player }) {
  const { data } = useLab();
  const mutation = useMutation();
  const [editing, setEditing] = useState<Dossier | null>(null);
  const [open, setOpen] = useState(false);
  const direction = data.member.role === "direction";
  const canExport = data.member.permissions.includes("export");
  const dossiers = data.graph.dossiers
    .filter((d) => d.player_id === player.id)
    .sort((a, b) => b.prepared_at.localeCompare(a.prepared_at));
  const by = (id: string | null) =>
    id === data.member.user_id ? t.dossier.byYou : t.dossier.byOther;
  return (
    <section className="ml-card ml-club-dossiers" aria-labelledby="dossiers-title">
      <div className="ml-section-title">
        <h2 id="dossiers-title">{t.dossier.title}</h2>
        <Modal
          title={editing ? t.dossier.editDraft : t.dossier.prepare}
          trigger={
            <>
              <FilePlus2 size={17} />
              {t.dossier.prepare}
            </>
          }
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          {open && (
            <DossierComposer
              key={editing?.id ?? "new"}
              player={player}
              dossier={editing}
              onDone={() => {
                setOpen(false);
                setEditing(null);
              }}
            />
          )}
        </Modal>
      </div>
      <p className="ml-method">{t.dossier.intro}</p>
      <Feedback {...mutation} />
      {dossiers.length ? (
        <ul className="ml-club-dossier-list">
          {dossiers.map((d) => (
            <li key={d.id} className="ml-club-dossier" data-id={d.id}>
              <div className="ml-club-dossier-head">
                <strong>{d.recipient}</strong>
                <span className={`ml-badge ml-club-dossier-${d.status}`}>
                  {t.dossier.states[d.status]}
                </span>
              </div>
              <p className="ml-muted">
                {formatDay(d.period_from)} – {formatDay(d.period_to)} ·{" "}
                {t.dossier.preparedOn} {dayOf(d.prepared_at)} {by(d.prepared_by)}
                {d.validated_at &&
                  ` · ${t.dossier.validatedOn} ${dayOf(d.validated_at)} ${by(d.validated_by)}`}
                {d.withdrawn_at &&
                  ` · ${t.dossier.withdrawnOn} ${dayOf(d.withdrawn_at)}`}
              </p>
              <div className="ml-actions">
                {d.status === "draft" && (
                  <button
                    type="button"
                    className="ml-button secondary"
                    onClick={() => {
                      mutation.clear();
                      setEditing(d);
                      setOpen(true);
                    }}
                  >
                    <Pencil size={17} />
                    {t.dossier.editDraft}
                  </button>
                )}
                {d.status === "draft" && direction && (
                  <button
                    type="button"
                    className="ml-button"
                    disabled={mutation.busy}
                    onClick={() => {
                      if (!window.confirm(t.dossier.validateConfirm)) return;
                      mutation.run(async () => {
                        await api("dossiers", {
                          action: "validate",
                          id: d.id,
                          version: d.version,
                        });
                      });
                    }}
                  >
                    <ShieldCheck size={17} />
                    {t.dossier.validate}
                  </button>
                )}
                {d.status === "validated" && canExport && (
                  <a
                    className="ml-button"
                    href={`/api/matchlab/dossiers?id=${d.id}`}
                    download
                  >
                    <FileDown size={17} />
                    {t.dossier.download}
                  </a>
                )}
                {d.status !== "withdrawn" && (
                  <button
                    type="button"
                    className="ml-button secondary"
                    disabled={mutation.busy}
                    onClick={() => {
                      if (!window.confirm(t.dossier.withdrawConfirm)) return;
                      mutation.run(async () => {
                        await api("dossiers", {
                          action: "withdraw",
                          id: d.id,
                          version: d.version,
                        });
                      });
                    }}
                  >
                    <Undo2 size={17} />
                    {t.dossier.withdraw}
                  </button>
                )}
              </div>
              {d.status === "draft" && direction && (
                <p className="ml-method">{t.dossier.validateHint}</p>
              )}
              {d.content && (
                <details className="ml-club-dossier-frozen">
                  <summary>
                    {t.dossier.frozen} {dayOf(d.validated_at)}
                  </summary>
                  <DossierView content={d.content} playerId={player.id} />
                </details>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ml-muted">{t.dossier.none}</p>
      )}
    </section>
  );
}

function DossierComposer({
  player,
  dossier,
  onDone,
}: {
  player: Player;
  dossier: Dossier | null;
  onDone: () => void;
}) {
  const mutation = useMutation();
  const [draft, setDraft] = useState<DossierDraft>(() =>
    dossier
      ? {
          player_id: player.id,
          recipient: dossier.recipient,
          recipient_contact: dossier.recipient_contact,
          period_from: dossier.period_from,
          period_to: dossier.period_to,
          sections: dossier.sections,
          strengths: dossier.strengths,
          development: dossier.development,
          sequence_ids: dossier.sequence_ids,
        }
      : {
          player_id: player.id,
          recipient: "",
          recipient_contact: "",
          period_from: yearAgo(),
          period_to: today(),
          sections: [...DEFAULT_SECTIONS],
          strengths: "",
          development: "",
          sequence_ids: [],
        },
  );
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState("");
  // New dossiers start with every verified sequence of the period selected.
  const autoSelect = useRef(!dossier);
  const set = <K extends keyof DossierDraft>(key: K, value: DossierDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const toggle = (s: DossierSection) =>
    set(
      "sections",
      draft.sections.includes(s)
        ? draft.sections.filter((x) => x !== s)
        : DOSSIER_SECTIONS.filter((x) => x === s || draft.sections.includes(x)),
    );
  // The preview is computed by the server from the same data as the validation; free
  // text is shown as typed, so typing does not call the server.
  const query = useMemo(
    () =>
      JSON.stringify({
        player_id: draft.player_id,
        period_from: draft.period_from,
        period_to: draft.period_to,
        sections: draft.sections,
        sequence_ids: draft.sequence_ids,
      }),
    [draft.player_id, draft.period_from, draft.period_to, draft.sections, draft.sequence_ids],
  );
  useEffect(() => {
    const request = JSON.parse(query);
    if (!request.period_from || !request.period_to || request.period_to < request.period_from) return;
    let alive = true;
    const timer = setTimeout(() => {
      api("dossiers", {
        action: "preview",
        draft: {
          ...request,
          recipient: "Aperçu",
          recipient_contact: "",
          strengths: "",
          development: "",
        },
      })
        .then((result: Preview) => {
          if (!alive) return;
          setPreview(result);
          setPreviewError("");
          if (autoSelect.current) {
            autoSelect.current = false;
            setDraft((d) => ({
              ...d,
              sequence_ids: result.available.map((x) => x.id).slice(0, 30),
            }));
          }
        })
        .catch((e) =>
          alive && setPreviewError(errorMessage(e instanceof Error ? e.message : "INTERNAL_ERROR")),
        );
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);
  const shown: DossierContent | null = preview && {
    ...preview.content,
    recipient: draft.recipient.trim(),
    recipient_contact: draft.recipient_contact.trim(),
    ...(draft.sections.includes("strengths") && draft.strengths.trim()
      ? { strengths: draft.strengths.trim() }
      : { strengths: undefined }),
    ...(draft.sections.includes("development") && draft.development.trim()
      ? { development: draft.development.trim() }
      : { development: undefined }),
  };
  const standard = DOSSIER_SECTIONS.filter((s) => !SENSITIVE_SECTIONS.includes(s));
  return (
    <form
      className="ml-club-dossier-composer"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await mutation.run(async () => {
          await api("dossiers", {
            action: "save",
            ...(dossier ? { id: dossier.id } : {}),
            version: dossier?.version ?? 0,
            draft,
          });
        });
        if (ok) onDone();
      }}
    >
      <div className="ml-form-grid">
        <label>
          {t.dossier.recipient}
          <input
            required
            minLength={2}
            maxLength={160}
            value={draft.recipient}
            onChange={(e) => set("recipient", e.target.value)}
          />
        </label>
        <label>
          {t.dossier.recipientContact}
          <input
            maxLength={200}
            value={draft.recipient_contact}
            onChange={(e) => set("recipient_contact", e.target.value)}
          />
        </label>
        <label>
          {t.dossier.periodFrom}
          <input
            type="date"
            required
            value={draft.period_from}
            max={draft.period_to}
            onChange={(e) => set("period_from", e.target.value)}
          />
        </label>
        <label>
          {t.dossier.periodTo}
          <input
            type="date"
            required
            value={draft.period_to}
            min={draft.period_from}
            onChange={(e) => set("period_to", e.target.value)}
          />
        </label>
      </div>
      <fieldset className="ml-club-dossier-sections">
        <legend>{t.dossier.elements}</legend>
        <p className="ml-method">{t.dossier.always}</p>
        <div className="ml-check-grid">
          {standard.map((s) => (
            <label key={s} className="ml-check">
              <input
                type="checkbox"
                checked={draft.sections.includes(s)}
                onChange={() => toggle(s)}
              />
              {t.dossier.sections[s]}
            </label>
          ))}
        </div>
        <p className="ml-eyebrow">{t.dossier.sensitive}</p>
        <div className="ml-check-grid">
          {SENSITIVE_SECTIONS.map((s) => (
            <label key={s} className="ml-check">
              <input
                type="checkbox"
                checked={draft.sections.includes(s)}
                onChange={() => toggle(s)}
              />
              {t.dossier.sections[s]}
            </label>
          ))}
        </div>
        {SENSITIVE_SECTIONS.some((s) => draft.sections.includes(s)) && (
          <p className="ml-notice" role="status">
            {t.dossier.sensitiveWarning}
          </p>
        )}
      </fieldset>
      {draft.sections.includes("strengths") && (
        <label>
          {t.dossier.sections.strengths}
          <textarea
            rows={3}
            maxLength={2000}
            value={draft.strengths}
            placeholder={t.dossier.strengthsHint}
            onChange={(e) => set("strengths", e.target.value)}
          />
        </label>
      )}
      {draft.sections.includes("development") && (
        <label>
          {t.dossier.sections.development}
          <textarea
            rows={3}
            maxLength={2000}
            value={draft.development}
            placeholder={t.dossier.strengthsHint}
            onChange={(e) => set("development", e.target.value)}
          />
        </label>
      )}
      {draft.sections.includes("sequences") && (
        <fieldset className="ml-club-dossier-sequences">
          <legend>{t.dossier.chooseSequences}</legend>
          {preview?.available.length ? (
            <div className="ml-check-grid">
              {preview.available.map((s) => (
                <label key={s.id} className="ml-check">
                  <input
                    type="checkbox"
                    checked={draft.sequence_ids.includes(s.id)}
                    disabled={
                      !draft.sequence_ids.includes(s.id) &&
                      draft.sequence_ids.length >= 30
                    }
                    onChange={() =>
                      set(
                        "sequence_ids",
                        draft.sequence_ids.includes(s.id)
                          ? draft.sequence_ids.filter((x) => x !== s.id)
                          : [...draft.sequence_ids, s.id],
                      )
                    }
                  />
                  {formatDay(s.date)} · {s.opponent} · {s.timecode} ·{" "}
                  {t.analysis.markerTypes[s.kind]}
                  {s.outcome ? ` · ${t.sequences.outcomes[s.outcome]}` : ""}
                </label>
              ))}
            </div>
          ) : (
            <p className="ml-muted">{t.dossier.noVerified}</p>
          )}
        </fieldset>
      )}
      {preview && (
        <div className="ml-club-dossier-consents" role="status">
          <strong>{t.dossier.consents}</strong>
          <span>
            {t.dossier.consentShare} :{" "}
            {preview.consents.share ? t.dossier.consentOk : t.dossier.consentMissing}
          </span>
          {draft.sections.includes("photo") && (
            <span>
              {t.dossier.consentPhoto} :{" "}
              {preview.consents.photo ? t.dossier.consentOk : t.dossier.consentMissing}
            </span>
          )}
          {(!preview.consents.share ||
            (draft.sections.includes("photo") && !preview.consents.photo)) && (
            <small>{t.dossier.consentWhere}</small>
          )}
        </div>
      )}
      <section className="ml-club-dossier-preview" aria-labelledby="dossier-preview">
        <h3 id="dossier-preview">{t.dossier.preview}</h3>
        <p className="ml-method">{t.dossier.previewHint}</p>
        {previewError && (
          <p className="ml-error" role="alert">
            {previewError}
          </p>
        )}
        {shown ? (
          <DossierView
            content={shown}
            playerId={player.id}
            photoAllowed={preview?.consents.photo}
          />
        ) : (
          <p className="ml-loading">{t.loading}</p>
        )}
      </section>
      <Feedback {...mutation} />
      <div className="ml-actions">
        <button type="button" className="ml-button secondary" onClick={onDone}>
          {t.cancel}
        </button>
        <button className="ml-button" disabled={mutation.busy}>
          {mutation.busy ? t.saving : t.dossier.saveDraft}
        </button>
      </div>
    </form>
  );
}

/** HTML rendering of a dossier's content: the same elements as its PDF, nothing more. */
export function DossierView({
  content: c,
  playerId,
  photoAllowed = true,
}: {
  content: DossierContent;
  playerId: string;
  photoAllowed?: boolean;
}) {
  const d = t.dossier;
  const span = `${formatDay(c.period.from)} – ${formatDay(c.period.to)} · ${c.period.matches} ${t.playerFile.matches}`;
  return (
    <article className="ml-club-dossier-view">
      <header>
        {c.photo && photoAllowed && (
          <PlayerAvatar playerId={playerId} name={c.identity.name} size={72} />
        )}
        <div>
          <small>{d.pdfTitle}</small>
          <h4>{c.identity.name}</h4>
          <p>
            {positionNames[c.identity.position]} · {t.players.foot} :{" "}
            {t.players[c.identity.foot]}
          </p>
          <p className="ml-muted">
            {c.identity.memberships
              .map((m) => `${m.season} · ${m.category} · #${m.jersey}`)
              .join(" ; ")}
          </p>
        </div>
      </header>
      {c.photo && !photoAllowed && <p className="ml-notice">{d.noPhoto}</p>}
      <p className="ml-club-dossier-basis">
        {c.recipient && (
          <>
            {d.recipientFor} : <strong>{c.recipient}</strong>
            {c.recipient_contact && ` (${c.recipient_contact})`}
            <br />
          </>
        )}
        {t.playerFile.period} : {span} · {c.period.minutes} {t.playerFile.minutes}
        <br />
        <small>{d.basis}</small>
      </p>
      {c.positions && (
        <>
          <h5>{d.sections.positions}</h5>
          {c.positions.length ? (
            <ul className="ml-plain-list">
              {c.positions.map((p) => (
                <li key={p.position}>
                  {positionNames[p.position]} · {p.matches} {t.playerFile.matches} ·{" "}
                  {p.minutes} min
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-muted">{d.noData}</p>
          )}
        </>
      )}
      {c.statistics && (
        <>
          <h5>{d.sections.statistics}</h5>
          <p>
            {t.playerFile.score} : {displayScore(c.statistics.score)} /10 ·{" "}
            {c.statistics.scored} {t.playerFile.evaluations} · {span}
          </p>
          <ul className="ml-plain-list">
            {c.statistics.indicators.map((i) => (
              <li key={i.kind}>
                {t.analysis.markerTypes[i.kind]} :{" "}
                {i.success + i.fail
                  ? `${i.success}/${i.success + i.fail} ${t.sequences.successRate}`
                  : "—"}{" "}
                ({i.total} {t.sequences.sample})
              </li>
            ))}
          </ul>
          <small className="ml-muted">{t.sequences.physical}</small>
        </>
      )}
      {c.criteria && (
        <>
          <h5>
            {d.sections.criteria} · {positionNames[c.criteria.position]}
          </h5>
          <ul className="ml-plain-list ml-club-dossier-criteria">
            {c.criteria.rows.map((r) => (
              <li key={r.key}>
                <span>{r.label}</span>
                <span className="ml-num">
                  {decimal(r.mean)} /5 · {r.answers} {t.playerFile.answers}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {c.progression && (
        <>
          <h5>{d.sections.progression}</h5>
          <ul className="ml-plain-list">
            {c.progression.map((p) => (
              <li key={p.period}>
                {monthLabel(p.period)} · {displayScore(p.score)} /10 · {p.matches}{" "}
                {t.playerFile.matches}
              </li>
            ))}
          </ul>
        </>
      )}
      {c.strengths && (
        <>
          <h5>{d.sections.strengths}</h5>
          <p className="ml-pre">{c.strengths}</p>
        </>
      )}
      {c.development && (
        <>
          <h5>{d.sections.development}</h5>
          <p className="ml-pre">{c.development}</p>
        </>
      )}
      {c.sequences && c.sequences.length > 0 && (
        <>
          <h5>{d.sections.sequences}</h5>
          <ul className="ml-plain-list">
            {c.sequences.map((s) => (
              <li key={s.id}>
                {formatDay(s.date)} · {s.opponent} · {s.timecode} ·{" "}
                {t.analysis.markerTypes[s.kind]}
                {s.outcome ? ` · ${t.sequences.outcomes[s.outcome]}` : ""}
                {s.tags.length ? ` · ${s.tags.join(", ")}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
      {c.staff_comments && c.staff_comments.length > 0 && (
        <>
          <h5>{d.sections.staff_comments}</h5>
          <ul className="ml-plain-list">
            {c.staff_comments.map((s, i) => (
              <li key={i}>
                <small>
                  {formatDay(s.date)} · {s.opponent}
                </small>
                {s.text}
              </li>
            ))}
          </ul>
        </>
      )}
      {c.scouting && (
        <>
          <h5>{d.sections.scouting}</h5>
          <p className="ml-pre">{c.scouting}</p>
        </>
      )}
      {c.status && (
        <>
          <h5>{d.sections.status}</h5>
          <p>{t.players[c.status]}</p>
        </>
      )}
      <footer>
        <strong>{d.contacts}</strong> · {t.academy} · {contactInfo.address.fr} ·{" "}
        {contactInfo.email}
      </footer>
    </article>
  );
}
