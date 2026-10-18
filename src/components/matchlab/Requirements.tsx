"use client";
import { useState } from "react";
import { fr as t } from "@/lib/matchlab/messages";
import {
  commonQuestions,
  specificQuestions,
  positionNames,
  POSITIONS,
  type Position,
} from "@/lib/matchlab/questionnaire";
import { CATEGORIES, type Category } from "@/lib/matchlab/trials";
import { useLab, useMutation, api, Feedback } from "./shared";

/** Direction-only referential: expected level per questionnaire criterion. */
export function RequirementsEditor() {
  const [category, setCategory] = useState<Category>("U-16");
  const [position, setPosition] = useState<Position>("CM");
  return (
    <section className="ml-card ml-requirements">
      <h2>{t.requirements.title}</h2>
      <p className="ml-method">{t.requirements.intro}</p>
      <div className="ml-form-grid">
        <label>
          {t.requirements.category}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          {t.requirements.position}
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
      </div>
      <RequirementForm
        key={`${category}|${position}`}
        category={category}
        position={position}
      />
    </section>
  );
}

function RequirementForm({
  category,
  position,
}: {
  category: Category;
  position: Position;
}) {
  const { data } = useLab();
  const mutation = useMutation();
  const existing = data.graph.requirements.filter(
    (r) => r.category_id === category && r.position === position,
  );
  const rows = [
    ...commonQuestions.map((q) => ({
      key: `common:${q.id}`,
      q,
      group: "common",
    })),
    ...specificQuestions[position].map((q) => ({
      key: `specific:${q.id}`,
      q,
      group: "specific",
    })),
  ];
  const minMatches = existing[0]?.min_matches ?? 3;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const min = Number(form.get("min_matches"));
        await mutation.run(async () => {
          for (const { key } of rows) {
            const raw = String(form.get(key) ?? "");
            const level = raw ? Number(raw) : null;
            const current = existing.find((r) => r.criterion === key);
            if (
              current &&
              current.level === level &&
              current.min_matches === min
            )
              continue;
            if (!current && level === null) continue;
            await api("data", {
              kind: "requirements",
              version: current?.version ?? 0,
              payload: {
                ...(current ? { id: current.id } : {}),
                category_id: category,
                position,
                criterion: key,
                level,
                min_matches: min,
              },
            });
          }
        });
      }}
    >
      <label className="ml-requirements-min">
        {t.requirements.minMatches}
        <input
          name="min_matches"
          type="number"
          min={1}
          max={20}
          required
          defaultValue={minMatches}
        />
      </label>
      <div className="ml-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.trial.criterion}</th>
              <th>{t.requirements.level}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, q, group }) => (
              <tr key={key}>
                <td>
                  <strong>{q.label}</strong>
                  <small>
                    {group === "common"
                      ? t.requirements.common
                      : t.requirements.specific}{" "}
                    · {q.text}
                  </small>
                </td>
                <td>
                  <select
                    name={key}
                    aria-label={`${t.requirements.level} : ${q.label}`}
                    defaultValue={
                      existing.find((r) => r.criterion === key)?.level ?? ""
                    }
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Feedback {...mutation} />
      <button className="ml-button" disabled={mutation.busy}>
        {t.requirements.save}
      </button>
    </form>
  );
}
