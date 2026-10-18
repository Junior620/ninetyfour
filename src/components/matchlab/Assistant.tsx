"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { MessageSquareText, X, Check } from "lucide-react";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
import { displayScore } from "@/lib/matchlab/scoring";
import { POSITIONS, positionNames } from "@/lib/matchlab/questionnaire";
import { runProfileQuery } from "@/lib/matchlab/search";
import { playerProfile } from "@/lib/matchlab/profile";
import { tacticalInputs, missingInformation } from "@/lib/matchlab/tactics";
import { CATEGORIES } from "@/lib/matchlab/trials";
import {
  readRequest,
  findPlayers,
  findMatches,
  type AssistantRequest,
} from "@/lib/matchlab/assistant";
import { useLab, api, formatDay } from "./shared";
import { startTour } from "./Help";

const log = (
  event: "suggestion" | "validated" | "cancelled",
  intent: AssistantRequest["kind"],
  query: string,
  target: string | null = null,
) =>
  api("assistant", { event, intent, query: query.slice(0, 500), target }).catch(() => {});

/** Assistant button rendered into the top bar, next to the help. */
export function AssistantSlot({ section }: { section: string }) {
  const slot = typeof document === "undefined" ? null : document.getElementById("ml-assistant-slot");
  return slot ? createPortal(<Assistant section={section} />, slot) : null;
}

function Assistant({ section }: { section: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [asked, setAsked] = useState<{ query: string; request: AssistantRequest; n: number } | null>(null);
  const ask = (query: string) => {
    const request = readRequest(query);
    setAsked((a) => ({ query, request, n: (a?.n ?? 0) + 1 }));
    void log("suggestion", request.kind, query);
  };
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="ml-icon" aria-label={t.assistant.button} data-tour="assistant">
        <MessageSquareText size={20} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="ml-backdrop" />
        <Dialog.Popup className="ml-help-panel ml-assistant">
          <Dialog.Close className="ml-drawer-close" aria-label={t.close}>
            <X size={20} />
          </Dialog.Close>
          <p className="ml-eyebrow">{t.assistant.button}</p>
          <Dialog.Title>{t.assistant.title}</Dialog.Title>
          <p>{t.assistant.intro}</p>
          <form
            className="ml-assistant-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) ask(text.trim());
            }}
          >
            <label>
              {t.assistant.label}
              <textarea
                rows={2}
                maxLength={500}
                value={text}
                placeholder={t.assistant.placeholder}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            </label>
            <button className="ml-button">{t.assistant.submit}</button>
          </form>
          {!asked && (
            <div className="ml-assistant-examples">
              <p className="ml-method">{t.assistant.examples}</p>
              {t.assistant.exampleList.map((x) => (
                <button
                  key={x}
                  type="button"
                  className="ml-button secondary"
                  onClick={() => {
                    setText(x);
                    ask(x);
                  }}
                >
                  {x}
                </button>
              ))}
            </div>
          )}
          {asked && (
            <Answer
              key={asked.n}
              query={asked.query}
              request={asked.request}
              section={section}
              close={() => setOpen(false)}
            />
          )}
          <p className="ml-method">{t.assistant.logNote}</p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type Outcome = { state: "done" | "cancelled"; href?: string } | null;

function Answer({
  query,
  request,
  section,
  close,
}: {
  query: string;
  request: AssistantRequest;
  section: string;
  close: () => void;
}) {
  const { data, refresh } = useLab();
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { graph, member } = data;
  const canWrite = member.role !== "reader";
  const allowed =
    request.kind === "export"
      ? member.permissions.includes("export")
      : ["create_player", "create_match", "dossier", "tactics"].includes(request.kind)
        ? canWrite
        : true;
  const go = (href: string, target: string | null = null) => {
    void log("validated", request.kind, query, target);
    close();
    router.push(href);
  };
  const cancel = () => {
    void log("cancelled", request.kind, query);
    setOutcome({ state: "cancelled" });
  };
  const validate = async (work: () => Promise<{ href: string; target: string }>) => {
    setBusy(true);
    setError("");
    try {
      const { href, target } = await work();
      void log("validated", request.kind, query, target);
      await refresh();
      setOutcome({ state: "done", href });
    } catch (e) {
      setError(errorMessage(e instanceof Error ? e.message : "INTERNAL_ERROR"));
    } finally {
      setBusy(false);
    }
  };
  const step = outcome ? 4 : 3;
  return (
    <section className="ml-assistant-answer" aria-live="polite">
      <ol className="ml-assistant-steps">
        {t.assistant.steps.map((s, i) => (
          <li key={s} aria-current={i + 1 === step ? "step" : undefined} className={i + 1 <= step ? "done" : ""}>
            {s}
          </li>
        ))}
      </ol>
      <p>
        <small>{t.assistant.request}</small>
        <strong>{t.assistant.intents[request.kind]}</strong>
      </p>
      <p className="ml-muted">
        {t.assistant.context} : {t.assistant.roles[member.role]} · {graph.players.length}{" "}
        {t.assistant.scopePlayers} · {graph.matches.length} {t.assistant.scopeMatches}.{" "}
        {request.kind !== "unknown" && request.kind !== "help" && (allowed ? t.assistant.rightsOk : t.assistant.noRight)}
      </p>
      {outcome ? (
        <div className={outcome.state === "done" ? "ml-success" : "ml-notice"} role="status">
          {outcome.state === "done" ? t.assistant.done : t.assistant.cancelled}{" "}
          {outcome.href && (
            <Link href={outcome.href} onClick={close}>
              {t.assistant.open}
            </Link>
          )}
        </div>
      ) : !allowed ? null : (
        <>
          <h3>{t.assistant.preview}</h3>
          <Preview
            request={request}
            query={query}
            section={section}
            busy={busy}
            go={go}
            validate={validate}
            cancel={cancel}
            close={close}
          />
          {error && (
            <p className="ml-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Preview({
  request,
  query,
  section,
  busy,
  go,
  validate,
  cancel,
  close,
}: {
  request: AssistantRequest;
  query: string;
  section: string;
  busy: boolean;
  go: (href: string, target?: string | null) => void;
  validate: (work: () => Promise<{ href: string; target: string }>) => Promise<void>;
  cancel: () => void;
  close: () => void;
}) {
  const { data } = useLab();
  const router = useRouter();
  const { graph } = data;
  const actions = (main: React.ReactNode) => (
    <div className="ml-actions">
      <button type="button" className="ml-button secondary" onClick={cancel}>
        {t.assistant.cancel}
      </button>
      {main}
    </div>
  );
  switch (request.kind) {
    case "help": {
      const page =
        request.topic === "scores"
          ? { title: t.assistant.scoresTitle, points: t.help.pages.analyze.points.slice(0, 2) }
          : request.topic === "filters"
            ? { title: t.assistant.filtersTitle, points: t.assistant.filtersPoints }
            : (t.help.pages[section as keyof typeof t.help.pages] ?? t.help.pages.overview);
      return (
        <>
          <p>
            <strong>{page.title}</strong>
          </p>
          <ul className="ml-plain-list">
            {page.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="ml-muted">{t.assistant.noChange}</p>
          {actions(
            <button
              type="button"
              className="ml-button"
              onClick={() => {
                close();
                startTour(section, router.push);
              }}
            >
              {t.assistant.startTour}
            </button>,
          )}
        </>
      );
    }
    case "profiles": {
      const result = runProfileQuery(graph, request.query);
      return (
        <>
          <p className="ml-method">
            {t.assistant.sources} : {request.query.understood.join(" · ")}
            {result.period.from &&
              result.period.to &&
              ` · ${formatDay(result.period.from)} – ${formatDay(result.period.to)} · ${result.period.matches} ${t.playerFile.matches}`}
          </p>
          <ol className="ml-plain-list">
            {result.results.map((r) => (
              <li key={r.player.id}>
                <Link className="ml-list-link" href={`/matchlab/player?id=${r.player.id}`} onClick={close}>
                  {r.player.full_name}
                </Link>{" "}
                · {displayScore(r.mean)} /10 · {r.matches} {t.playerFile.matches} · {r.minutes} min
              </li>
            ))}
          </ol>
          {!result.results.length && <p className="ml-muted">{t.noPlayers}</p>}
          <p className="ml-muted">{t.assistant.noChange}</p>
          {actions(
            <button
              type="button"
              className="ml-button"
              onClick={() => go(`/matchlab/players?ask=${encodeURIComponent(query)}`)}
            >
              {t.assistant.openSearch}
            </button>,
          )}
        </>
      );
    }
    case "find_match": {
      const found = findMatches(request.opponent, graph.matches).slice(0, 5);
      return found.length ? (
        <>
          <ul className="ml-plain-list">
            {found.map((m) => (
              <li key={m.id}>
                <button type="button" className="ml-button secondary" onClick={() => go(`/matchlab/analyze?id=${m.id}`, m.id)}>
                  {formatDay(m.played_on)} · {m.category_id} · {m.opponent}
                </button>
              </li>
            ))}
          </ul>
          {actions(null)}
        </>
      ) : (
        <p className="ml-muted">{t.assistant.noMatchFound}</p>
      );
    }
    case "create_player":
      return <CreatePlayer request={request} busy={busy} validate={validate} actions={actions} />;
    case "create_match":
      return <CreateMatch request={request} busy={busy} validate={validate} actions={actions} />;
    case "export": {
      const params = new URLSearchParams({ format: request.format, kind: "period" });
      if (request.category) params.set("category", request.category);
      if (request.from) params.set("from", request.from);
      if (request.to) params.set("to", request.to);
      const href = `/api/matchlab/exports?${params}`;
      return (
        <>
          <dl className="ml-facts">
            <div>
              <dt>{t.assistant.format}</dt>
              <dd>{t.assistant.formats[request.format]}</dd>
            </div>
            <div>
              <dt>{t.category}</dt>
              <dd>{request.category ?? t.all}</dd>
            </div>
            <div>
              <dt>{t.assistant.period}</dt>
              <dd>
                {request.from && request.to
                  ? `${formatDay(request.from)} – ${formatDay(request.to)}`
                  : t.assistant.allPeriod}
              </dd>
            </div>
          </dl>
          <p className="ml-muted">{t.exports.photos}</p>
          {actions(
            <a
              className="ml-button"
              href={href}
              download
              onClick={() => void log("validated", "export", query, params.toString())}
            >
              {t.assistant.download}
            </a>,
          )}
        </>
      );
    }
    case "dossier":
    case "summary": {
      const players = findPlayers(query, graph.players);
      if (!players.length) return <p className="ml-muted">{t.assistant.noPlayer}</p>;
      return (
        <>
          {players.slice(0, 5).map((p) => {
            const profile = playerProfile(p, graph);
            return (
              <article key={p.id} className="ml-assistant-card">
                <strong>{p.full_name}</strong>
                <p className="ml-muted">
                  {positionNames[p.usual_position]} · {profile.sample.matches} {t.playerFile.matches} ·{" "}
                  {profile.sample.minutes} min · {t.playerFile.score} {displayScore(profile.score)} /10
                  {profile.sample.from && ` · ${formatDay(profile.sample.from)} – ${formatDay(profile.sample.to!)}`}
                </p>
                {request.kind === "summary" && (
                  <ul className="ml-plain-list">
                    {profile.criteria
                      .filter((c) => c.mean !== null)
                      .sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0))
                      .slice(0, 3)
                      .map((c) => (
                        <li key={c.key}>
                          {c.label} · {c.mean!.toFixed(1).replace(".", ",")} /5 ({c.answers})
                        </li>
                      ))}
                  </ul>
                )}
                <button type="button" className="ml-button" onClick={() => go(`/matchlab/player?id=${p.id}`, p.id)}>
                  {t.assistant.open}
                </button>
              </article>
            );
          })}
          <p className="ml-method">
            {request.kind === "dossier" ? t.assistant.dossierNote : t.assistant.summaryNote}
          </p>
          {actions(null)}
        </>
      );
    }
    case "tactics": {
      const found = findMatches(request.opponent, graph.matches).slice(0, 3);
      if (!found.length) return <p className="ml-muted">{t.assistant.noMatchFound}</p>;
      return (
        <>
          {found.map((m) => {
            const missing = missingInformation(
              m,
              tacticalInputs(m, graph),
              graph.plans.filter((p) => p.match_id === m.id),
            );
            return (
              <article key={m.id} className="ml-assistant-card">
                <strong>
                  {formatDay(m.played_on)} · {m.category_id} · {m.opponent}
                </strong>
                <ul className="ml-plain-list">
                  {missing.map((x) => (
                    <li key={x}>{t.tactics.missingItems[x]}</li>
                  ))}
                </ul>
                <button type="button" className="ml-button" onClick={() => go(`/matchlab/tactics?id=${m.id}`, m.id)}>
                  {t.assistant.open}
                </button>
              </article>
            );
          })}
          <p className="ml-method">{t.assistant.tacticsNote}</p>
          {actions(null)}
        </>
      );
    }
    default:
      return <p className="ml-notice">{t.assistant.unknown}</p>;
  }
}

type Actions = (main: React.ReactNode) => React.ReactNode;
const latestSeason = (seasons: { id: string; starts_on: string }[]) =>
  [...seasons].sort((a, b) => b.starts_on.localeCompare(a.starts_on))[0]?.id ?? "";

function CreatePlayer({
  request,
  busy,
  validate,
  actions,
}: {
  request: Extract<AssistantRequest, { kind: "create_player" }>;
  busy: boolean;
  validate: (work: () => Promise<{ href: string; target: string }>) => Promise<void>;
  actions: Actions;
}) {
  const { data } = useLab();
  const [form, setForm] = useState({
    full_name: request.full_name ?? "",
    position: request.position ?? "",
    category: request.category ?? "",
    jersey: request.jersey ? String(request.jersey) : "",
    foot: request.foot ?? "right",
    season: data.filters.season ?? latestSeason(data.graph.seasons),
  });
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const missing = [
    form.full_name.trim().length < 2 && t.players.name,
    !form.position && t.players.usual,
    !form.category && t.category,
    !form.season && t.assistant.season,
    !(Number(form.jersey) >= 1 && Number(form.jersey) <= 99) && t.players.jersey,
  ].filter(Boolean) as string[];
  return (
    <>
      <p className="ml-method">
        {t.assistant.willCreate} {t.assistant.correct}
      </p>
      <div className="ml-form-grid">
        <label className="wide">
          {t.players.name}
          <input value={form.full_name} maxLength={120} onChange={(e) => set("full_name", e.target.value)} />
        </label>
        <label>
          {t.players.usual}
          <select value={form.position} onChange={(e) => set("position", e.target.value)}>
            <option value="">—</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {positionNames[p]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.players.foot}
          <select value={form.foot} onChange={(e) => set("foot", e.target.value)}>
            <option value="right">{t.players.right}</option>
            <option value="left">{t.players.left}</option>
            <option value="both">{t.players.both}</option>
          </select>
        </label>
        <label>
          {t.assistant.season}
          <select value={form.season} onChange={(e) => set("season", e.target.value)}>
            <option value="">—</option>
            {data.graph.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.category}
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          {t.players.jersey}
          <input type="number" min={1} max={99} value={form.jersey} onChange={(e) => set("jersey", e.target.value)} />
        </label>
      </div>
      {missing.length > 0 && (
        <p className="ml-notice">
          {t.assistant.missing} : {missing.join(", ")}
        </p>
      )}
      {actions(
        <button
          type="button"
          className="ml-button"
          disabled={busy || missing.length > 0}
          onClick={() =>
            validate(async () => {
              const result = await api("data", {
                kind: "players",
                version: 0,
                payload: {
                  full_name: form.full_name.trim(),
                  usual_position: form.position,
                  strong_foot: form.foot,
                  status: "active",
                  scouting: "",
                  target_profile: "",
                  fundamentals: {},
                },
                membership: {
                  season_id: form.season,
                  category_id: form.category,
                  jersey: Number(form.jersey),
                },
              });
              return { href: `/matchlab/player?id=${result.player.id}`, target: result.player.id };
            })
          }
        >
          <Check size={17} />
          {t.assistant.confirm}
        </button>,
      )}
    </>
  );
}

function CreateMatch({
  request,
  busy,
  validate,
  actions,
}: {
  request: Extract<AssistantRequest, { kind: "create_match" }>;
  busy: boolean;
  validate: (work: () => Promise<{ href: string; target: string }>) => Promise<void>;
  actions: Actions;
}) {
  const { data } = useLab();
  const [form, setForm] = useState({
    opponent: request.opponent ?? "",
    played_on: request.played_on ?? "",
    category: request.category ?? "",
    season: data.filters.season ?? latestSeason(data.graph.seasons),
  });
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const missing = [
    form.opponent.trim().length < 2 && t.assistant.opponent,
    !form.played_on && t.assistant.date,
    !form.category && t.category,
    !form.season && t.assistant.season,
  ].filter(Boolean) as string[];
  return (
    <>
      <p className="ml-method">
        {t.assistant.willCreate} {t.assistant.correct}
      </p>
      <div className="ml-form-grid">
        <label className="wide">
          {t.assistant.opponent}
          <input value={form.opponent} maxLength={160} onChange={(e) => set("opponent", e.target.value)} />
        </label>
        <label>
          {t.assistant.date}
          <input type="date" value={form.played_on} onChange={(e) => set("played_on", e.target.value)} />
        </label>
        <label>
          {t.assistant.season}
          <select value={form.season} onChange={(e) => set("season", e.target.value)}>
            <option value="">—</option>
            {data.graph.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.category}
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      {missing.length > 0 && (
        <p className="ml-notice">
          {t.assistant.missing} : {missing.join(", ")}
        </p>
      )}
      {actions(
        <button
          type="button"
          className="ml-button"
          disabled={busy || missing.length > 0}
          onClick={() =>
            validate(async () => {
              const match = await api("data", {
                kind: "matches",
                version: 0,
                payload: {
                  season_id: form.season,
                  category_id: form.category,
                  opponent: form.opponent.trim(),
                  played_on: form.played_on,
                  home_score: null,
                  away_score: null,
                  collective: {},
                },
              });
              return { href: `/matchlab/analyze?id=${match.id}`, target: match.id };
            })
          }
        >
          <Check size={17} />
          {t.assistant.confirm}
        </button>,
      )}
    </>
  );
}
