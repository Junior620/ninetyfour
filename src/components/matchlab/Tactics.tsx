"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Save, Trash2, Wand2 } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import { displayScore } from "@/lib/matchlab/scoring";
import { positionNames } from "@/lib/matchlab/questionnaire";
import { describeCircumstances } from "@/lib/matchlab/circumstances";
import { FORMATIONS } from "@/lib/matchlab/formations";
import {
  tacticalInputs,
  missingInformation,
  suggestPriorities,
  planReview,
  type TacticalInputs,
} from "@/lib/matchlab/tactics";
import {
  PLAN_BLOCKS,
  type Lineup,
  type Match,
  type Plan,
} from "@/lib/matchlab/schema";
import { useLab, useMutation, api, Heading, Empty, Feedback, formatDay } from "./shared";

type PlanDraft = Omit<Plan, "id" | "version" | "created_by" | "created_at" | "updated_at"> & {
  id?: string;
};
const PHASES = ["with_ball", "without_ball", "transitions", "set_pieces"] as const;
const decimal = (v: number | null) =>
  v === null
    ? "—"
    : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const payloadOf = (p: Plan | PlanDraft): PlanDraft => ({
  ...(p.id ? { id: p.id } : {}),
  match_id: p.match_id,
  rank: p.rank,
  title: p.title,
  lineup_id: p.lineup_id,
  block: p.block,
  with_ball: p.with_ball,
  without_ball: p.without_ball,
  transitions: p.transitions,
  set_pieces: p.set_pieces,
  scenarios: p.scenarios,
  reasons: p.reasons,
  opponent_notes: p.opponent_notes,
  priorities: p.priorities,
  review: p.review,
});
const blank = (match: Match, rank: number): PlanDraft => ({
  match_id: match.id,
  rank,
  title: t.tactics.ranks[rank - 1],
  lineup_id: null,
  block: null,
  with_ball: "",
  without_ball: "",
  transitions: "",
  set_pieces: "",
  scenarios: [],
  reasons: "",
  opponent_notes: "",
  priorities: [],
  review: null,
});

/** Tactics cell: inputs with their sample, two or three plans, training priorities, review. */
export function Tactics({ id }: { id?: string }) {
  const { data } = useLab();
  const router = useRouter();
  if (data.member.role === "reader")
    return (
      <>
        <Heading title={t.nav.tactics} />
        <p className="ml-notice">{t.errors.FORBIDDEN}</p>
      </>
    );
  const today = new Date().toISOString().slice(0, 10);
  const matches = [...data.graph.matches].sort((a, b) =>
    b.played_on.localeCompare(a.played_on),
  );
  // By default the next match to come, otherwise the latest one.
  const upcoming = [...matches].reverse().find((m) => m.played_on >= today);
  const match = matches.find((m) => m.id === id) ?? upcoming ?? matches[0];
  return (
    <>
      <Heading title={t.nav.tactics} eyebrow={t.tactics.eyebrow} />
      <p className="ml-method">{t.tactics.noAi}</p>
      {match ? (
        <>
          <label className="ml-live-match">
            {t.tactics.match}
            <select
              value={match.id}
              onChange={(e) => router.replace(`/matchlab/tactics?id=${e.target.value}`)}
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {formatDay(m.played_on)} · {m.category_id} · {m.opponent}
                </option>
              ))}
            </select>
          </label>
          <Cell key={match.id} match={match} />
        </>
      ) : (
        <Empty text={t.tactics.noMatch} />
      )}
    </>
  );
}

function Cell({ match }: { match: Match }) {
  const { data } = useLab();
  const { graph } = data;
  const inputs = tacticalInputs(match, graph);
  const plans = graph.plans
    .filter((p) => p.match_id === match.id)
    .sort((a, b) => a.rank - b.rank);
  const missing = missingInformation(match, inputs, plans);
  const lineups = graph.lineups.filter(
    (l) => l.season_id === match.season_id && l.category_id === match.category_id,
  );
  const main = plans.find((p) => p.rank === 1);
  const freeRank = [1, 2, 3].find((r) => !plans.some((p) => p.rank === r));
  const [adding, setAdding] = useState<number | null>(null);
  return (
    <div className="ml-tactics">
      <Inputs match={match} inputs={inputs} />
      {missing.length > 0 && (
        <section className="ml-notice" aria-label={t.tactics.missing}>
          <strong>{t.tactics.missing}</strong>
          <ul>
            {missing.map((m) => (
              <li key={m}>{t.tactics.missingItems[m]}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="ml-card">
        <div className="ml-section-title">
          <h2>{t.tactics.plans}</h2>
          {freeRank && adding === null && (
            <button
              type="button"
              className="ml-button"
              onClick={() => setAdding(freeRank)}
            >
              <Plus size={17} />
              {freeRank === 1 ? t.tactics.newMain : t.tactics.addPlan}
            </button>
          )}
        </div>
        {plans.map((plan) => (
          <details key={plan.id} className="ml-plan" open={plan.rank === 1}>
            <summary>
              {t.tactics.ranks[plan.rank - 1]} · {plan.title}
            </summary>
            <PlanForm
              key={plan.id}
              initial={plan}
              version={plan.version}
              match={match}
              lineups={lineups}
              opponentObserved={inputs.opponent.observed}
            />
          </details>
        ))}
        {adding !== null && (
          <div className="ml-plan">
            <PlanForm
              initial={blank(match, adding)}
              version={0}
              match={match}
              lineups={lineups}
              opponentObserved={inputs.opponent.observed}
              onDone={() => setAdding(null)}
            />
          </div>
        )}
        {!plans.length && adding === null && <p className="ml-muted">{t.tactics.missingItems.no_plan}</p>}
      </section>
      <Priorities
        key={main?.id ?? "none"}
        match={match}
        main={main}
        inputs={inputs}
      />
      <Review
        key={main ? `review-${main.id}` : "review"}
        match={match}
        main={main}
        inputs={inputs}
      />
    </div>
  );
}

function Inputs({ match, inputs }: { match: Match; inputs: TacticalInputs }) {
  const { data } = useLab();
  const name = (id: string) => data.graph.players.find((p) => p.id === id)?.full_name ?? "—";
  const jersey = (id: string) =>
    data.graph.memberships.find(
      (m) => m.player_id === id && m.season_id === match.season_id && m.category_id === match.category_id,
    )?.jersey;
  const context = describeCircumstances(match.circumstances);
  const sample = inputs.recent.length
    ? `${inputs.recent.length} ${t.tactics.recentSample} · ${formatDay(inputs.recent.at(-1)!.played_on)} – ${formatDay(inputs.recent[0].played_on)}`
    : `0 ${t.tactics.recentSample}`;
  return (
    <section className="ml-card" aria-labelledby="tactics-inputs">
      <h2 id="tactics-inputs">{t.tactics.inputs}</h2>
      <p className="ml-method">
        {t.tactics.sources} : {sample}
      </p>
      <div className="ml-tactics-grid">
        <article>
          <h3>{t.tactics.squad}</h3>
          <p>
            <strong>{inputs.squad.available.length}</strong> {t.tactics.available} ·{" "}
            {inputs.squad.unavailable.length} {t.tactics.unavailable}
          </p>
          {inputs.squad.unavailable.length > 0 && (
            <small>
              {inputs.squad.unavailable
                .map((u) => `${name(u.player_id)} (${t.players[u.status as "injured"]})`)
                .join(" · ")}
            </small>
          )}
          <h4>{t.tactics.byPosition}</h4>
          <ul className="ml-plain-list ml-tactics-positions">
            {inputs.squad.byPosition.map((p) => (
              <li key={p.position}>
                <span>{positionNames[p.position]}</span>
                <span className="ml-num">{p.available}</span>
                {p.versatile.length > 0 && (
                  <small>
                    + {p.versatile.map(name).join(", ")} ({t.tactics.versatile})
                  </small>
                )}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h3>{t.tactics.form}</h3>
          {inputs.form.length ? (
            <ul className="ml-plain-list">
              {inputs.form.slice(0, 8).map((f) => (
                <li key={f.player_id}>
                  <Link className="ml-list-link" href={`/matchlab/player?id=${f.player_id}`}>
                    {jersey(f.player_id) ? `#${jersey(f.player_id)} ` : ""}
                    {name(f.player_id)}
                  </Link>{" "}
                  · {displayScore(f.mean)} /10 ({f.matches})
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-muted">{t.tactics.noForm}</p>
          )}
          <small className="ml-muted">{t.tactics.formHint}</small>
        </article>
        <article>
          <h3>{t.tactics.collective}</h3>
          <ul className="ml-plain-list">
            {inputs.collective.map((a) => (
              <li key={a.id}>
                {a.label} · {decimal(a.mean)} /5 ({a.answers} {t.tactics.answers})
                {a.tag && (
                  <span className={`ml-badge ml-tactics-${a.tag}`}>
                    {a.tag === "support" ? t.tactics.support : t.tactics.protect}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <small className="ml-muted">{t.tactics.collectiveHint}</small>
          <h4>{t.tactics.sequences}</h4>
          {inputs.sequences.byKind.length ? (
            <ul className="ml-plain-list">
              {inputs.sequences.byKind.slice(0, 6).map((k) => (
                <li key={k.kind}>
                  {t.analysis.markerTypes[k.kind]} · {k.total} {t.sequences.sample}
                  {k.success + k.fail > 0 &&
                    ` · ${k.success}/${k.success + k.fail} ${t.sequences.successRate}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-muted">{t.tactics.noSequences}</p>
          )}
        </article>
        <article>
          <h3>{t.tactics.opponent}</h3>
          <p>
            <strong>{match.opponent}</strong>
          </p>
          {inputs.opponent.observed ? (
            <>
              <p>{t.tactics.opponentObserved} :</p>
              <ul className="ml-plain-list">
                {inputs.opponent.matches.map((m) => (
                  <li key={m.id}>
                    <Link className="ml-list-link" href={`/matchlab/analyze?id=${m.id}`}>
                      {formatDay(m.played_on)} · {m.category_id} · N91 {m.home_score ?? "—"}-
                      {m.away_score ?? "—"}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="ml-notice">{t.tactics.opponentUnknown}</p>
          )}
          <h4>{t.tactics.context}</h4>
          {context.length ? (
            <ul className="ml-plain-list">
              {context.map((c) => (
                <li key={c.key}>
                  {c.label} : {c.value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-muted">{t.tactics.noContext}</p>
          )}
        </article>
      </div>
    </section>
  );
}

function PlanForm({
  initial,
  version,
  match,
  lineups,
  opponentObserved,
  onDone,
}: {
  initial: Plan | PlanDraft;
  version: number;
  match: Match;
  lineups: Lineup[];
  opponentObserved: boolean;
  onDone?: () => void;
}) {
  const mutation = useMutation();
  const [plan, setPlan] = useState<PlanDraft>(() => payloadOf(initial));
  const set = <K extends keyof PlanDraft>(key: K, value: PlanDraft[K]) =>
    setPlan((p) => ({ ...p, [key]: value }));
  const lineup = lineups.find((l) => l.id === plan.lineup_id);
  return (
    <form
      className="ml-plan-form"
      onSubmit={async (e) => {
        e.preventDefault();
        // Priorities and review are saved by their own forms: keep the latest ones.
        const edited = {
          title: plan.title,
          lineup_id: plan.lineup_id,
          block: plan.block,
          with_ball: plan.with_ball,
          without_ball: plan.without_ball,
          transitions: plan.transitions,
          set_pieces: plan.set_pieces,
          scenarios: plan.scenarios,
          reasons: plan.reasons,
          opponent_notes: plan.opponent_notes,
        };
        const ok = await mutation.run(async () => {
          await api("data", {
            kind: "plans",
            payload: { ...payloadOf(initial), ...edited },
            version,
          });
        });
        if (ok) onDone?.();
      }}
    >
      <div className="ml-form-grid">
        <label>
          {t.tactics.title}
          <input
            required
            minLength={2}
            maxLength={120}
            value={plan.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </label>
        <label>
          {t.tactics.lineup}
          <select
            value={plan.lineup_id ?? ""}
            onChange={(e) => set("lineup_id", e.target.value || null)}
          >
            <option value="">{t.tactics.noLineup}</option>
            {lineups.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} · {l.formation}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.tactics.block}
          <select
            value={plan.block ?? ""}
            onChange={(e) => set("block", (e.target.value || null) as PlanDraft["block"])}
          >
            <option value="">—</option>
            {PLAN_BLOCKS.map((b) => (
              <option key={b} value={b}>
                {t.tactics.blocks[b]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!lineups.length && <p className="ml-method">{t.tactics.lineupHint}</p>}
      <div className="ml-tactics-phases">
        {PHASES.map((phase) => (
          <label key={phase}>
            {t.tactics.phases[phase]}
            <textarea
              rows={3}
              maxLength={2000}
              placeholder={t.tactics.phaseHints[phase]}
              value={plan[phase]}
              onChange={(e) => set(phase, e.target.value)}
            />
          </label>
        ))}
      </div>
      <fieldset className="ml-plan-scenarios">
        <legend>{t.tactics.scenarios}</legend>
        {plan.scenarios.map((s, i) => (
          <div key={i} className="ml-plan-scenario">
            <label>
              {t.tactics.scenarioTrigger}
              <input
                required
                minLength={2}
                maxLength={300}
                placeholder={t.tactics.scenarioTriggerHint}
                value={s.trigger}
                onChange={(e) =>
                  set(
                    "scenarios",
                    plan.scenarios.map((x, j) => (j === i ? { ...x, trigger: e.target.value } : x)),
                  )
                }
              />
            </label>
            <label>
              {t.tactics.scenarioChange}
              <input
                required
                minLength={2}
                maxLength={500}
                value={s.change}
                onChange={(e) =>
                  set(
                    "scenarios",
                    plan.scenarios.map((x, j) => (j === i ? { ...x, change: e.target.value } : x)),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="ml-button secondary"
              onClick={() => set("scenarios", plan.scenarios.filter((_, j) => j !== i))}
            >
              {t.tactics.remove}
            </button>
          </div>
        ))}
        {plan.scenarios.length < 6 && (
          <button
            type="button"
            className="ml-button secondary"
            onClick={() => set("scenarios", [...plan.scenarios, { trigger: "", change: "" }])}
          >
            <Plus size={17} />
            {t.tactics.addScenario}
          </button>
        )}
      </fieldset>
      <div className="ml-form-grid">
        <label className="wide">
          {t.tactics.reasons}
          <textarea
            rows={3}
            maxLength={2000}
            placeholder={t.tactics.reasonsHint}
            value={plan.reasons}
            onChange={(e) => set("reasons", e.target.value)}
          />
        </label>
        <label className="wide">
          {t.tactics.opponentNotes}
          <textarea
            rows={2}
            maxLength={2000}
            placeholder={opponentObserved ? "" : t.tactics.opponentNotesHint}
            value={plan.opponent_notes}
            onChange={(e) => set("opponent_notes", e.target.value)}
          />
        </label>
      </div>
      {lineup && <Board lineup={lineup} match={match} />}
      <Feedback {...mutation} />
      <div className="ml-actions">
        {onDone && (
          <button type="button" className="ml-button secondary" onClick={onDone}>
            {t.cancel}
          </button>
        )}
        {"id" in initial && initial.id && initial.rank > 1 && (
          <button
            type="button"
            className="ml-button secondary"
            disabled={mutation.busy}
            onClick={() => {
              if (!window.confirm(t.tactics.removeConfirm)) return;
              mutation.run(async () => {
                await api("plans", { action: "remove", id: initial.id });
              });
            }}
          >
            <Trash2 size={17} />
            {t.tactics.removePlan}
          </button>
        )}
        <button className="ml-button" disabled={mutation.busy}>
          <Save size={17} />
          {mutation.busy ? t.saving : t.tactics.savePlan}
        </button>
      </div>
    </form>
  );
}

/** Starters with role and instructions, bench, and links to each profile. */
function Board({ lineup, match }: { lineup: Lineup; match: Match }) {
  const { data } = useLab();
  const who = (id: string | null) => (id ? data.graph.players.find((p) => p.id === id) : undefined);
  const jersey = (id: string) =>
    data.graph.memberships.find(
      (m) => m.player_id === id && m.season_id === match.season_id && m.category_id === match.category_id,
    )?.jersey;
  return (
    <section className="ml-plan-board" aria-label={t.tactics.board}>
      <h3>
        {t.tactics.board} · {lineup.name} · {lineup.formation}
      </h3>
      <div className="ml-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.tactics.slot}</th>
              <th>{t.tactics.starters}</th>
              <th>{t.tactics.role}</th>
              <th>{t.tactics.instructions}</th>
            </tr>
          </thead>
          <tbody>
            {FORMATIONS[lineup.formation].map((slot) => {
              const placed = lineup.slots[slot.id];
              const player = who(placed?.player_id ?? null);
              return (
                <tr key={slot.id}>
                  <td>{positionNames[slot.position]}</td>
                  <td>
                    {player ? (
                      <Link className="ml-table-link" href={`/matchlab/player?id=${player.id}`}>
                        {jersey(player.id) ? `#${jersey(player.id)} ` : ""}
                        {player.full_name}
                      </Link>
                    ) : (
                      <span className="ml-muted">{t.tactics.empty}</span>
                    )}
                  </td>
                  <td className="ml-wrap">{placed?.role || "—"}</td>
                  <td className="ml-wrap">{placed?.instructions || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p>
        <strong>{t.tactics.bench} :</strong>{" "}
        {lineup.bench.length
          ? lineup.bench.map((id, i) => {
              const p = who(id);
              return (
                <span key={id}>
                  {i > 0 && " · "}
                  {p ? (
                    <Link className="ml-list-link" href={`/matchlab/player?id=${id}`}>
                      {p.full_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </span>
              );
            })
          : "—"}
      </p>
      <Link className="ml-list-link" href="/matchlab/squad">
        {t.tactics.openSquad}
      </Link>
    </section>
  );
}

function Priorities({
  match,
  main,
  inputs,
}: {
  match: Match;
  main?: Plan;
  inputs: TacticalInputs;
}) {
  const mutation = useMutation();
  const [items, setItems] = useState<Plan["priorities"]>(main?.priorities ?? []);
  const [note, setNote] = useState("");
  const set = (i: number, key: keyof Plan["priorities"][number], value: string) =>
    setItems((list) => list.map((x, j) => (j === i ? { ...x, [key]: value } : x)));
  return (
    <section className="ml-card" aria-labelledby="tactics-priorities">
      <div className="ml-section-title">
        <h2 id="tactics-priorities">{t.tactics.priorities}</h2>
        {main && (
          <button
            type="button"
            className="ml-button secondary"
            onClick={() => {
              const suggested = suggestPriorities(inputs, match.category_id).filter(
                (s) => !items.some((x) => x.source === s.source),
              );
              if (!suggested.length) setNote(t.tactics.noSuggestion);
              setItems((list) => [...list, ...suggested].slice(0, 5));
            }}
          >
            <Wand2 size={17} />
            {t.tactics.suggestFromData}
          </button>
        )}
      </div>
      <p className="ml-method">{t.tactics.prioritiesHint}</p>
      {!main ? (
        <p className="ml-muted">{t.tactics.needMain}</p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await mutation.run(async () => {
              await api("data", {
                kind: "plans",
                payload: { ...payloadOf(main), priorities: items },
                version: main.version,
              });
            });
          }}
        >
          {note && <p className="ml-notice">{note}</p>}
          <ol className="ml-priorities">
            {items.map((p, i) => (
              <li key={i}>
                <div className="ml-form-grid">
                  <label className="wide">
                    {t.tactics.objective}
                    <input required minLength={2} maxLength={200} value={p.objective} onChange={(e) => set(i, "objective", e.target.value)} />
                  </label>
                  <label>
                    {t.tactics.exercise}
                    <input maxLength={500} value={p.exercise} onChange={(e) => set(i, "exercise", e.target.value)} />
                  </label>
                  <label>
                    {t.category}
                    <select value={p.category} onChange={(e) => set(i, "category", e.target.value)}>
                      {["U-14", "U-16", "U-17", "U-18"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t.tactics.indicator}
                    <input maxLength={300} value={p.indicator} onChange={(e) => set(i, "indicator", e.target.value)} />
                  </label>
                  <label>
                    {t.tactics.source}
                    <input maxLength={300} value={p.source} onChange={(e) => set(i, "source", e.target.value)} />
                  </label>
                </div>
                <button
                  type="button"
                  className="ml-button secondary"
                  onClick={() => setItems((list) => list.filter((_, j) => j !== i))}
                >
                  {t.tactics.remove}
                </button>
              </li>
            ))}
          </ol>
          <Feedback {...mutation} />
          <div className="ml-actions">
            {items.length < 5 && (
              <button
                type="button"
                className="ml-button secondary"
                onClick={() =>
                  setItems((list) => [
                    ...list,
                    { objective: "", exercise: "", category: match.category_id, indicator: "", source: "" },
                  ])
                }
              >
                <Plus size={17} />
                {t.tactics.addPriority}
              </button>
            )}
            <button className="ml-button" disabled={mutation.busy}>
              <Save size={17} />
              {t.tactics.savePriorities}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Review({
  match,
  main,
  inputs,
}: {
  match: Match;
  main?: Plan;
  inputs: TacticalInputs;
}) {
  const { data } = useLab();
  const mutation = useMutation();
  const review = planReview(match, main, inputs, data.graph);
  const [form, setForm] = useState<NonNullable<Plan["review"]>>(
    main?.review ?? { applied: null, notes: "", adjust: "" },
  );
  const name = (id: string) => data.graph.players.find((p) => p.id === id)?.full_name ?? "—";
  return (
    <section className="ml-card" aria-labelledby="tactics-review">
      <h2 id="tactics-review">{t.tactics.review}</h2>
      {!review.observed ? (
        <p className="ml-muted">{t.tactics.reviewEmpty}</p>
      ) : (
        <>
          {main?.lineup_id && (
            <p>
              {review.startersWhoPlayed} {t.tactics.startersPlayed} {review.starters}
              {review.notPlanned.length > 0 &&
                ` · ${review.notPlanned.length} ${t.tactics.notPlanned} (${review.notPlanned.map(name).join(", ")})`}
            </p>
          )}
          <div className="ml-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.reports.collective}</th>
                  <th>{t.tactics.before}</th>
                  <th>{t.tactics.after}</th>
                </tr>
              </thead>
              <tbody>
                {review.collective.map((c) => (
                  <tr key={c.label}>
                    <td>{c.label}</td>
                    <td className="ml-num">{decimal(c.before)} /5</td>
                    <td className="ml-num">{c.after === null ? "—" : `${c.after} /5`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="ml-method">{t.tactics.reviewHint}</p>
      {main ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await mutation.run(async () => {
              await api("data", {
                kind: "plans",
                payload: { ...payloadOf(main), review: form },
                version: main.version,
              });
            });
          }}
        >
          <fieldset className="ml-outcomes">
            <legend>{t.tactics.applied}</legend>
            {(["yes", "partly", "no"] as const).map((v) => (
              <label key={v} className="ml-check">
                <input
                  type="radio"
                  name="applied"
                  checked={form.applied === v}
                  onChange={() => setForm({ ...form, applied: v })}
                />
                {t.tactics.appliedValues[v]}
              </label>
            ))}
          </fieldset>
          <div className="ml-form-grid">
            <label className="wide">
              {t.tactics.reviewNotes}
              <textarea rows={2} maxLength={2000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            <label className="wide">
              {t.tactics.adjust}
              <textarea rows={2} maxLength={2000} value={form.adjust} onChange={(e) => setForm({ ...form, adjust: e.target.value })} />
            </label>
          </div>
          <Feedback {...mutation} />
          <button className="ml-button" disabled={mutation.busy}>
            <Save size={17} />
            {t.tactics.saveReview}
          </button>
        </form>
      ) : (
        <p className="ml-muted">{t.tactics.needMain}</p>
      )}
    </section>
  );
}
