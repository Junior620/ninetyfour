"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GripVertical, Save } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import { positionNames, POSITIONS } from "@/lib/matchlab/questionnaire";
import {
  FORMATIONS,
  positionShort,
  emptyBoard,
  move,
  locate,
  changeFormation,
  compareBoards,
  type Board,
  type FormationId,
} from "@/lib/matchlab/formations";
import { CATEGORIES, type Category } from "@/lib/matchlab/trials";
import {
  FORMATION_IDS,
  LINEUP_KINDS,
  type Lineup,
  type Player,
} from "@/lib/matchlab/schema";
import {
  useLab,
  useMutation,
  api,
  Heading,
  Feedback,
  PlayerAvatar,
  jerseyFor,
} from "./shared";

type Draft = {
  id?: string;
  version: number;
  name: string;
  kind: Lineup["kind"];
  notes: string;
  board: Board;
};
const fresh = (): Draft => ({
  version: 0,
  name: t.squad.defaultName,
  kind: "team",
  notes: "",
  board: emptyBoard("4-3-3"),
});
const fromLineup = (l: Lineup): Draft => ({
  id: l.id,
  version: l.version,
  name: l.name,
  kind: l.kind,
  notes: l.notes,
  board: { formation: l.formation, slots: l.slots, bench: l.bench },
});
// Full name, cut by CSS: no guess about which word is the family name.
const shortName = (name: string) => name.trim();

/** Squad board: compose a team on the pitch, save scenarios and compare them. */
export function Squad() {
  const { data } = useLab();
  const { graph } = data;
  const canWrite = data.member.role !== "reader";
  const seasons = [...graph.seasons].sort((a, b) =>
    b.starts_on.localeCompare(a.starts_on),
  );
  const [season, setSeason] = useState(
    data.filters.season || seasons[0]?.id || "",
  );
  const categoriesWithPlayers = CATEGORIES.filter((c) =>
    graph.memberships.some(
      (m) => m.season_id === season && m.category_id === c,
    ),
  );
  const [category, setCategory] = useState<Category>(
    (data.filters.category as Category) || categoriesWithPlayers[0] || "U-14",
  );
  const lineups = graph.lineups.filter(
    (l) => l.season_id === season && l.category_id === category,
  );
  const [draft, setDraft] = useState<Draft>(() =>
    lineups[0] ? fromLineup(lineups[0]) : fresh(),
  );
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [lower, setLower] = useState(false);
  const [status, setStatus] = useState("");
  const [position, setPosition] = useState("");
  const [dossier, setDossier] = useState<keyof typeof t.squad.dossiers>("all");
  const mutation = useMutation();
  const below = CATEGORIES[CATEGORIES.indexOf(category) - 1];
  const evaluationsOf = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of graph.evaluations)
      counts.set(e.player_id, (counts.get(e.player_id) ?? 0) + 1);
    return counts;
  }, [graph.evaluations]);
  const squad = graph.players.filter((p) =>
    graph.memberships.some(
      (m) =>
        m.player_id === p.id &&
        m.season_id === season &&
        (m.category_id === category || (lower && m.category_id === below)),
    ),
  );
  const shown = squad.filter((p) => {
    const n = evaluationsOf.get(p.id) ?? 0;
    return (
      (!status || p.status === status) &&
      (!position || p.usual_position === position) &&
      (dossier === "all" ||
        (dossier === "none" && n === 0) ||
        (dossier === "some" && n > 0 && n < 3) ||
        (dossier === "many" && n >= 3))
    );
  });
  const byId = new Map(graph.players.map((p) => [p.id, p]));
  const jersey = (id: string) =>
    graph.memberships.find((m) => m.player_id === id && m.season_id === season)
      ?.jersey ?? jerseyFor(graph, id, season, category);
  const slots = FORMATIONS[draft.board.formation];
  const slotLabel = (id: string) => {
    const slot = slots.find((s) => s.id === id);
    return slot ? positionNames[slot.position] : id;
  };

  const update = (board: Board, message?: string) => {
    setDraft((d) => ({ ...d, board }));
    setDirty(true);
    if (message) setAnnounce(message);
  };
  const place = (playerId: string, to: string | "bench" | null) => {
    const name = byId.get(playerId)?.full_name ?? "";
    update(
      move(draft.board, playerId, to),
      to === "bench"
        ? `${name} ${t.squad.onBench}`
        : to
          ? `${name} ${t.squad.moved} ${slotLabel(to)}`
          : `${name} ${t.squad.removed}`,
    );
    setSelected(null);
  };
  const switchTo = (next: Draft) => {
    if (dirty && !window.confirm(t.unsaved)) return false;
    setDraft(next);
    setDirty(false);
    setSelected(null);
    return true;
  };
  const changeScope = (nextSeason: string, nextCategory: Category) => {
    const first = graph.lineups.find(
      (l) => l.season_id === nextSeason && l.category_id === nextCategory,
    );
    if (!switchTo(first ? fromLineup(first) : fresh())) return;
    setSeason(nextSeason);
    setCategory(nextCategory);
  };

  // Pointer drag (mouse, pen, touch): a short move turns a press into a drag.
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const justDragged = useRef(false);
  // Near the top or bottom edge, the page scrolls while the drag continues.
  const edge = useRef({ direction: 0, x: 0, y: 0, frame: 0 });
  const autoScroll = () => {
    const e = edge.current;
    if (!drag.current?.moved || !e.direction) {
      e.frame = 0;
      return;
    }
    window.scrollBy(0, e.direction * 14);
    setGhost((g) => g && { ...g, over: dropAt(e.x, e.y) });
    e.frame = requestAnimationFrame(autoScroll);
  };
  const stopScroll = () => {
    cancelAnimationFrame(edge.current.frame);
    edge.current = { direction: 0, x: 0, y: 0, frame: 0 };
  };
  const [ghost, setGhost] = useState<{
    id: string;
    x: number;
    y: number;
    over: string | null;
  } | null>(null);
  const dropAt = (x: number, y: number) =>
    document
      .elementFromPoint(x, y)
      ?.closest("[data-drop]")
      ?.getAttribute("data-drop") ?? null;
  const dragHandlers = (id: string) =>
    canWrite
      ? {
          onPointerDown: (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { id, x: e.clientX, y: e.clientY, moved: false };
          },
          onPointerMove: (e: React.PointerEvent) => {
            const d = drag.current;
            if (!d) return;
            if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6)
              return;
            d.moved = true;
            const direction =
              e.clientY < 90 ? -1 : e.clientY > window.innerHeight - 70 ? 1 : 0;
            edge.current = {
              ...edge.current,
              direction,
              x: e.clientX,
              y: e.clientY,
            };
            if (direction && !edge.current.frame)
              edge.current.frame = requestAnimationFrame(autoScroll);
            setGhost({
              id,
              x: e.clientX,
              y: e.clientY,
              over: dropAt(e.clientX, e.clientY),
            });
          },
          onPointerUp: (e: React.PointerEvent) => {
            const d = drag.current;
            drag.current = null;
            stopScroll();
            setGhost(null);
            if (!d?.moved) return;
            e.preventDefault();
            justDragged.current = true;
            window.setTimeout(() => (justDragged.current = false), 0);
            const target = dropAt(e.clientX, e.clientY);
            if (target === "bench") place(id, "bench");
            else if (target === "list") place(id, null);
            else if (target?.startsWith("slot:")) place(id, target.slice(5));
          },
          // A photo inside a token would otherwise start the browser's own image drag
          // and cancel the pointer sequence.
          onDragStart: (e: React.DragEvent) => e.preventDefault(),
          onPointerCancel: () => {
            drag.current = null;
            stopScroll();
            setGhost(null);
          },
          // A completed drag must not also count as a click.
          onClickCapture: (e: React.MouseEvent) => {
            if (justDragged.current) {
              e.stopPropagation();
              e.preventDefault();
            }
          },
        }
      : {};
  const token = (id: string, size = 52) => {
    const p = byId.get(id);
    return (
      <span className="ml-token">
        <PlayerAvatar playerId={id} name={p?.full_name} size={size} />
        <span className="ml-token-number">{jersey(id) ?? "—"}</span>
      </span>
    );
  };
  const selectedPlayer = selected ? byId.get(selected) : undefined;
  const selectedSlot = selected ? locate(draft.board, selected) : null;
  const placement =
    selectedSlot && selectedSlot !== "bench"
      ? draft.board.slots[selectedSlot]
      : null;

  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const a = lineups.find((l) => l.id === compareA);
  const b = lineups.find((l) => l.id === compareB);
  const diff = a && b ? compareBoards(a, b) : null;
  const names = (ids: string[]) =>
    ids.map((id) => byId.get(id)?.full_name ?? "—").join(", ");

  return (
    <>
      <Heading title={t.squad.title} eyebrow={t.squad.eyebrow}>
        <div className="ml-actions">
          <p
            className={`ml-save-state${dirty ? " dirty" : draft.id ? "" : " new"}`}
            role="status"
          >
            {dirty
              ? t.squad.unsaved
              : draft.id
                ? t.squad.saved
                : t.squad.newScenario}
          </p>
          {canWrite && (
            <button
              className="ml-button"
              disabled={mutation.busy || !season}
              onClick={() =>
                mutation.run(async () => {
                  const saved = await api("data", {
                    kind: "lineups",
                    version: draft.version,
                    payload: {
                      ...(draft.id ? { id: draft.id } : {}),
                      season_id: season,
                      category_id: category,
                      name: draft.name,
                      kind: draft.kind,
                      formation: draft.board.formation,
                      slots: draft.board.slots,
                      bench: draft.board.bench,
                      notes: draft.notes,
                      match_id: null,
                    },
                  });
                  setDraft((d) => ({
                    ...d,
                    id: saved.id,
                    version: saved.version,
                  }));
                  setDirty(false);
                })
              }
            >
              <Save size={17} />
              {t.squad.save}
            </button>
          )}
        </div>
      </Heading>
      <Feedback {...mutation} />
      <section
        className="ml-card ml-squad-toolbar"
        aria-label={t.squad.scenario}
      >
        <label>
          {t.squad.season}
          <select
            value={season}
            onChange={(e) => changeScope(e.target.value, category)}
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.squad.category}
          <select
            value={category}
            onChange={(e) => changeScope(season, e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          {t.squad.scenario}
          <select
            value={draft.id ?? ""}
            onChange={(e) => {
              const l = lineups.find((x) => x.id === e.target.value);
              switchTo(l ? fromLineup(l) : fresh());
            }}
          >
            <option value="">{t.squad.newScenario}</option>
            {lineups.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} · {t.squad.kinds[l.kind]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.squad.name}
          <input
            value={draft.name}
            maxLength={120}
            disabled={!canWrite}
            onChange={(e) => {
              setDraft((d) => ({ ...d, name: e.target.value }));
              setDirty(true);
            }}
          />
        </label>
        <label>
          {t.squad.kind}
          <select
            value={draft.kind}
            disabled={!canWrite}
            onChange={(e) => {
              setDraft((d) => ({
                ...d,
                kind: e.target.value as Lineup["kind"],
              }));
              setDirty(true);
            }}
          >
            {LINEUP_KINDS.map((k) => (
              <option key={k} value={k}>
                {t.squad.kinds[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.squad.formation}
          <select
            value={draft.board.formation}
            disabled={!canWrite}
            onChange={(e) =>
              update(
                changeFormation(draft.board, e.target.value as FormationId),
              )
            }
          >
            {FORMATION_IDS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      </section>
      <div className="ml-squad">
        <section className="ml-card ml-squad-list" aria-label={t.squad.squad}>
          <h2>{t.squad.squad}</h2>
          <p className="ml-muted">{t.squad.squadHint}</p>
          <div className="ml-squad-filters">
            <label>
              {t.squad.availability}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">{t.all}</option>
                {(["active", "injured", "trial", "inactive"] as const).map(
                  (s) => (
                    <option key={s} value={s}>
                      {t.players[s]}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              {t.squad.position}
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              >
                <option value="">{t.all}</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {positionNames[p]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.squad.dossier}
              <select
                value={dossier}
                onChange={(e) => setDossier(e.target.value as typeof dossier)}
              >
                {Object.entries(t.squad.dossiers).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            {below && (
              <label className="ml-check">
                <input
                  type="checkbox"
                  checked={lower}
                  onChange={(e) => setLower(e.target.checked)}
                />
                {t.squad.lowerCategory} · {below}
              </label>
            )}
          </div>
          <ul className="ml-squad-players" data-drop="list">
            {shown.map((p) => (
              <SquadCard
                key={p.id}
                player={p}
                jersey={jersey(p.id)}
                evaluations={evaluationsOf.get(p.id) ?? 0}
                where={locate(draft.board, p.id)}
                selected={selected === p.id}
                canWrite={canWrite}
                onSelect={() => setSelected(selected === p.id ? null : p.id)}
                drag={dragHandlers(p.id)}
              />
            ))}
            {!shown.length && <li className="ml-muted">{t.squad.noPlayers}</li>}
          </ul>
        </section>
        <section className="ml-card ml-pitch-card" aria-label={t.squad.pitch}>
          <div className="ml-pitch">
            <svg viewBox="0 0 68 100" aria-hidden="true" focusable="false">
              <rect x="1" y="1" width="66" height="98" rx="1" />
              <line x1="1" y1="50" x2="67" y2="50" />
              <circle cx="34" cy="50" r="9" />
              <rect x="14" y="1" width="40" height="16" />
              <rect x="25" y="1" width="18" height="6" />
              <rect x="14" y="83" width="40" height="16" />
              <rect x="25" y="93" width="18" height="6" />
            </svg>
            {slots.map((slot) => {
              const occupant = draft.board.slots[slot.id]?.player_id ?? null;
              const p = occupant ? byId.get(occupant) : undefined;
              return (
                <div
                  key={slot.id}
                  className={`ml-slot${ghost?.over === `slot:${slot.id}` ? " over" : ""}${occupant && occupant === selected ? " selected" : ""}`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  data-drop={`slot:${slot.id}`}
                >
                  <button
                    type="button"
                    className="ml-slot-button"
                    aria-label={
                      p
                        ? `${positionNames[slot.position]} : ${p.full_name}`
                        : `${positionNames[slot.position]} : ${t.squad.emptySlot}`
                    }
                    aria-pressed={!!occupant && occupant === selected}
                    disabled={!canWrite && !occupant}
                    onClick={() => {
                      if (selected && canWrite) place(selected, slot.id);
                      else if (occupant)
                        setSelected(occupant === selected ? null : occupant);
                    }}
                    {...(occupant ? dragHandlers(occupant) : {})}
                  >
                    {occupant ? (
                      token(occupant)
                    ) : (
                      <span className="ml-slot-empty">
                        {positionShort[slot.position]}
                      </span>
                    )}
                  </button>
                  <span className="ml-slot-name">
                    {p ? shortName(p.full_name) : positionShort[slot.position]}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            className={`ml-bench${ghost?.over === "bench" ? " over" : ""}`}
            data-drop="bench"
          >
            <h3>{t.squad.bench}</h3>
            {draft.board.bench.length ? (
              <ul>
                {draft.board.bench.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      className="ml-bench-token"
                      aria-pressed={selected === id}
                      aria-label={byId.get(id)?.full_name}
                      onClick={() => setSelected(selected === id ? null : id)}
                      {...dragHandlers(id)}
                    >
                      {token(id, 44)}
                      <span>{shortName(byId.get(id)?.full_name ?? "—")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ml-muted">{t.squad.benchEmpty}</p>
            )}
            {selected &&
              canWrite &&
              locate(draft.board, selected) !== "bench" && (
                <button
                  type="button"
                  className="ml-button secondary"
                  onClick={() => place(selected, "bench")}
                >
                  {t.squad.toBench}
                </button>
              )}
          </div>
          {selectedPlayer && (
            <div className="ml-selection" aria-label={t.squad.selected}>
              <div className="ml-selection-head">
                <PlayerAvatar
                  playerId={selectedPlayer.id}
                  name={selectedPlayer.full_name}
                  size={44}
                />
                <div>
                  <strong>{selectedPlayer.full_name}</strong>
                  <small>
                    #{jersey(selectedPlayer.id) ?? "—"} ·{" "}
                    {positionNames[selectedPlayer.usual_position]}
                    {selectedSlot && selectedSlot !== "bench"
                      ? ` · ${t.squad.placed} : ${slotLabel(selectedSlot)}`
                      : ""}
                  </small>
                </div>
              </div>
              {placement && canWrite && (
                <div className="ml-form-grid">
                  <label>
                    {t.squad.role}
                    <input
                      value={placement.role}
                      maxLength={80}
                      onChange={(e) =>
                        update({
                          ...draft.board,
                          slots: {
                            ...draft.board.slots,
                            [selectedSlot!]: {
                              ...placement,
                              role: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>
                  <label className="wide">
                    {t.squad.instructions}
                    <textarea
                      value={placement.instructions}
                      maxLength={500}
                      onChange={(e) =>
                        update({
                          ...draft.board,
                          slots: {
                            ...draft.board.slots,
                            [selectedSlot!]: {
                              ...placement,
                              instructions: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>
                </div>
              )}
              <div className="ml-actions">
                <Link
                  className="ml-button secondary"
                  href={`/matchlab/player?id=${selectedPlayer.id}`}
                >
                  {t.squad.openFile}
                </Link>
                {canWrite && selectedSlot && (
                  <button
                    type="button"
                    className="ml-button secondary"
                    onClick={() => place(selectedPlayer.id, null)}
                  >
                    {t.squad.remove}
                  </button>
                )}
                <button
                  type="button"
                  className="ml-button secondary"
                  onClick={() => setSelected(null)}
                >
                  {t.squad.cancel}
                </button>
              </div>
            </div>
          )}
          <label className="ml-squad-notes">
            {t.squad.notes}
            <textarea
              value={draft.notes}
              maxLength={2000}
              disabled={!canWrite}
              onChange={(e) => {
                setDraft((d) => ({ ...d, notes: e.target.value }));
                setDirty(true);
              }}
            />
          </label>
        </section>
      </div>
      <p className="ml-sr-live" aria-live="polite">
        {announce}
      </p>
      {ghost && (
        <div
          className="ml-drag-ghost"
          style={{ left: ghost.x, top: ghost.y }}
          aria-hidden="true"
        >
          {token(ghost.id, 52)}
        </div>
      )}
      <section className="ml-card ml-compare">
        <h2>{t.squad.compare}</h2>
        {lineups.length < 2 ? (
          <p className="ml-muted">
            {lineups.length ? t.squad.compareHint : t.squad.noScenario}
          </p>
        ) : (
          <>
            <div className="ml-form-grid">
              {[
                [compareA, setCompareA],
                [compareB, setCompareB],
              ].map(([value, set], i) => (
                <label key={i}>
                  {t.squad.scenario} {i === 0 ? "A" : "B"}
                  <select
                    value={value as string}
                    onChange={(e) =>
                      (set as (v: string) => void)(e.target.value)
                    }
                  >
                    <option value="">—</option>
                    {lineups.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} · {t.squad.kinds[l.kind]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {a && b && diff && (
              <div className="ml-compare-grid">
                {[a, b].map((l) => (
                  <MiniPitch key={l.id} lineup={l} byId={byId} />
                ))}
                <div className="ml-compare-diff">
                  <p>
                    {diff.sameFormation
                      ? t.squad.sameFormation
                      : t.squad.differentFormation}{" "}
                    : {a.formation} / {b.formation}
                  </p>
                  {!diff.onlyA.length &&
                  !diff.onlyB.length &&
                  !diff.moved.length ? (
                    <p>{t.squad.noDifference}</p>
                  ) : (
                    <ul>
                      {diff.onlyA.length > 0 && (
                        <li>
                          <strong>
                            {t.squad.onlyIn} {a.name} :
                          </strong>{" "}
                          {names(diff.onlyA)}
                        </li>
                      )}
                      {diff.onlyB.length > 0 && (
                        <li>
                          <strong>
                            {t.squad.onlyIn} {b.name} :
                          </strong>{" "}
                          {names(diff.onlyB)}
                        </li>
                      )}
                      {diff.moved.length > 0 && (
                        <li>
                          <strong>{t.squad.movedPlayers} :</strong>{" "}
                          {diff.moved
                            .map(
                              (m) =>
                                `${byId.get(m.player)?.full_name ?? "—"} (${label(m.from)} → ${label(m.to)})`,
                            )
                            .join(", ")}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
const label = (where: string) =>
  where === "bench"
    ? t.squad.bench
    : (positionShort[where as keyof typeof positionShort] ?? where);

function SquadCard({
  player,
  jersey,
  evaluations,
  where,
  selected,
  canWrite,
  onSelect,
  drag,
}: {
  player: Player;
  jersey: number | undefined;
  evaluations: number;
  where: string | null;
  selected: boolean;
  canWrite: boolean;
  onSelect: () => void;
  drag: object;
}) {
  return (
    <li
      className={`ml-squad-card${selected ? " selected" : ""}${where ? " placed" : ""}`}
    >
      <Link
        href={`/matchlab/player?id=${player.id}`}
        className="ml-squad-photo"
        aria-label={`${t.squad.openFile} : ${player.full_name}`}
      >
        <PlayerAvatar playerId={player.id} name={player.full_name} size={44} />
      </Link>
      <button
        type="button"
        className="ml-squad-pick"
        aria-pressed={selected}
        disabled={!canWrite}
        onClick={onSelect}
      >
        <strong>
          #{jersey ?? "—"} {player.full_name}
        </strong>
        <small>
          {positionNames[player.usual_position]} · {t.players[player.status]} ·{" "}
          {evaluations} {t.squad.evaluations}
          {where
            ? ` · ${where === "bench" ? t.squad.bench : t.squad.placed}`
            : ""}
        </small>
      </button>
      {canWrite && (
        <span className="ml-squad-grip" {...drag} aria-hidden="true">
          <GripVertical size={20} />
        </span>
      )}
    </li>
  );
}

function MiniPitch({
  lineup,
  byId,
}: {
  lineup: Lineup;
  byId: Map<string, Player>;
}) {
  return (
    <figure className="ml-mini-pitch">
      <figcaption>
        {lineup.name} · {lineup.formation}
      </figcaption>
      <div className="ml-pitch small">
        {FORMATIONS[lineup.formation].map((slot) => {
          const p = lineup.slots[slot.id]?.player_id;
          return (
            <span
              key={slot.id}
              className="ml-mini-slot"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              {p
                ? shortName(byId.get(p)?.full_name ?? "—")
                : positionShort[slot.position]}
            </span>
          );
        })}
      </div>
    </figure>
  );
}
