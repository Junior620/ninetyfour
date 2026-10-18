"use client";
import { useState } from "react";
import { fr as t } from "@/lib/matchlab/messages";
import {
  positionNames,
  POSITIONS,
  type Position,
} from "@/lib/matchlab/questionnaire";
import {
  trialComparison,
  nextCategory,
  CATEGORIES,
  type Category,
} from "@/lib/matchlab/trials";
import { TRIAL_DECISIONS, type Player } from "@/lib/matchlab/schema";
import { useLab, useMutation, api, Feedback, formatDay } from "./shared";

const one = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

/** "Simuler un essai en catégorie supérieure": facts, a rule-based proposal, a staff decision. */
export function TrialPanel({ player }: { player: Player }) {
  const { data } = useLab();
  const { graph } = data;
  const canWrite = data.member.role !== "reader";
  const current =
    ([...graph.memberships]
      .filter((m) => m.player_id === player.id)
      .map((m) => m.category_id)
      .sort(
        (a, b) => CATEGORIES.indexOf(b) - CATEGORIES.indexOf(a),
      )[0] as Category) ?? "U-14";
  const [to, setTo] = useState<Category | null>(nextCategory(current));
  const [position, setPosition] = useState<Position>(player.usual_position);
  const [last, setLast] = useState(5);
  const comparison = to
    ? trialComparison(player, graph, to, position, last)
    : null;
  const [decision, setDecision] = useState<string>("");
  const [reason, setReason] = useState("");
  const mutation = useMutation();
  const history = graph.trials
    .filter((x) => x.player_id === player.id)
    .sort((a, b) => b.decided_at.localeCompare(a.decided_at));
  if (!to) return <p className="ml-notice">{t.trial.noNext}</p>;
  const chosen =
    decision ||
    (comparison?.proposal !== "none" ? comparison?.proposal : "") ||
    "";
  return (
    <div className="ml-trial">
      <div className="ml-form-grid ml-trial-scope">
        <label>
          {t.trial.target}
          <select
            value={to}
            onChange={(e) => setTo(e.target.value as Category)}
          >
            {CATEGORIES.filter(
              (c) => CATEGORIES.indexOf(c) > CATEGORIES.indexOf(current),
            ).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          {t.trial.position}
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {positionNames[p]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.trial.recent}
          <select
            value={last}
            onChange={(e) => setLast(Number(e.target.value))}
          >
            {[3, 5, 10].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      {comparison && (
        <>
          <div className="ml-table-wrap">
            <table className="ml-trial-table">
              <thead>
                <tr>
                  <th>{t.trial.criterion}</th>
                  <th>{t.trial.player}</th>
                  <th>{t.trial.required}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.criteria.map((c) => (
                  <tr key={c.key}>
                    <td>
                      {c.label}
                      <small>
                        {c.group === "common"
                          ? t.requirements.common
                          : t.requirements.specific}
                      </small>
                    </td>
                    <td>
                      {one(c.mean)}
                      <small>
                        {c.answers} {t.trial.matches}
                      </small>
                    </td>
                    <td>{c.level ?? "—"}</td>
                    <td>
                      <span className={`ml-trial-status ${c.status}`}>
                        {t.trial.status[c.status]}
                        {c.status === "gap" && c.delta !== null
                          ? ` ${one(c.delta)}`
                          : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ml-facts ml-trial-facts">
            <div>
              <dt>{t.trial.sample}</dt>
              <dd>
                {comparison.sample.matches} {t.trial.matches} ·{" "}
                {comparison.sample.minutes} {t.trial.minutes}
                {comparison.sample.minutesUnknown
                  ? ` (${comparison.sample.minutesUnknown} ${t.trial.minutesUnknown})`
                  : ""}{" "}
                · {comparison.sample.atPosition} {t.trial.atPosition}
                {comparison.sample.from
                  ? ` · ${formatDay(comparison.sample.from)} → ${formatDay(comparison.sample.to!)}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt>{t.trial.confidence}</dt>
              <dd>{t.trial.confidences[comparison.confidence]}</dd>
            </div>
            <div>
              <dt>{t.trial.proposal}</dt>
              <dd>{t.trial.proposals[comparison.proposal]}</dd>
            </div>
          </dl>
          <p className="ml-method">{t.trial.rule}</p>
          <p className="ml-report-review">{t.trial.guard}</p>
          {canWrite && (
            <form
              className="ml-trial-decision"
              onSubmit={async (e) => {
                e.preventDefault();
                await mutation.run(async () => {
                  await api("data", {
                    kind: "trials",
                    version: 0,
                    payload: {
                      player_id: player.id,
                      from_category: current,
                      to_category: to,
                      position,
                      proposal: comparison.proposal,
                      decision: chosen,
                      reason,
                      snapshot: {
                        lastMatches: last,
                        sample: comparison.sample,
                        confidence: comparison.confidence,
                        criteria: comparison.criteria,
                      },
                    },
                  });
                  setReason("");
                  setDecision("");
                });
              }}
            >
              <fieldset>
                <legend>{t.trial.decision}</legend>
                <div className="ml-trial-choices">
                  {TRIAL_DECISIONS.map((d) => (
                    <label key={d} className="ml-check">
                      <input
                        type="radio"
                        name="decision"
                        value={d}
                        checked={chosen === d}
                        onChange={() => setDecision(d)}
                      />
                      {t.trial.decisions[d]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                {t.trial.reason}
                <textarea
                  value={reason}
                  maxLength={2000}
                  required={chosen !== comparison.proposal}
                  minLength={chosen !== comparison.proposal ? 3 : 0}
                  onChange={(e) => setReason(e.target.value)}
                />
                <small>{t.trial.reasonHint}</small>
              </label>
              <Feedback {...mutation} />
              <button className="ml-button" disabled={mutation.busy || !chosen}>
                {t.trial.record}
              </button>
            </form>
          )}
          <h4>{t.trial.history}</h4>
          {history.length ? (
            <ul className="ml-trial-history">
              {history.map((h) => (
                <li key={h.id}>
                  <strong>
                    {h.from_category} → {h.to_category} ·{" "}
                    {positionNames[h.position]} :{" "}
                    {t.trial.decisions[h.decision]}
                  </strong>
                  <small>
                    {formatDay(h.decided_at.slice(0, 10))} · {t.trial.proposal}{" "}
                    : {t.trial.proposals[h.proposal]}
                    {h.reason ? ` · ${h.reason}` : ""}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-muted">{t.trial.noHistory}</p>
          )}
        </>
      )}
    </div>
  );
}
