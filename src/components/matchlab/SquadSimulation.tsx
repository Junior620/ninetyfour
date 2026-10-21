"use client";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FilePlus,
  Play,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Undo2,
  UserPlus,
  UserX,
} from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import { positionNames } from "@/lib/matchlab/questionnaire";
import {
  FORMATIONS,
  positionShort,
  type FormationId,
  type Slot,
} from "@/lib/matchlab/formations";
import { FORMATION_IDS, type Simulation } from "@/lib/matchlab/schema";
import {
  startState,
  defaultHolder,
  makeStep,
  replay,
  phases,
  frameAt,
  phaseDuration,
  trimPath,
  opponentFormation,
  addOpponent,
  placeOpponent,
  onTheLine,
  packStep,
  unpackStep,
  MAX_STEPS,
  type Opponent,
  type Point,
  type SimAction,
  type SimState,
  type SimStep,
} from "@/lib/matchlab/simulation";
import { Feedback } from "./shared";

const SPEEDS = [
  ["slow", 0.5],
  ["normal", 1],
  ["fast", 2],
] as const;
const MARKERS: (SimAction | "contested")[] = [
  "pass",
  "shot",
  "carry",
  "run",
  "contested",
];
/** Simulations kept per scenario (same limit as the database). */
const MAX_SAVED = 12;
// Slot frame (percent) to the 68 × 100 pitch drawing.
const svgPoints = (path: Point[]) =>
  path.map((p) => `${(p.x * 0.68).toFixed(2)},${p.y.toFixed(2)}`).join(" ");
// What a save keeps, to tell whether the board differs from the saved version.
const snapshot = (
  holder: string | null,
  steps: SimStep[],
  opponents: Opponent[],
  name: string,
) => JSON.stringify([holder, steps.map(packStep), opponents, name.trim()]);

/** Pitch markings, shared by both board modes. */
export function PitchLines() {
  return (
    <svg viewBox="0 0 68 100" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="66" height="98" rx="1" />
      <line x1="1" y1="50" x2="67" y2="50" />
      <circle cx="34" cy="50" r="9" />
      <rect x="14" y="1" width="40" height="16" />
      <rect x="25" y="1" width="18" height="6" />
      <rect x="14" y="83" width="40" height="16" />
      <rect x="25" y="93" width="18" height="6" />
    </svg>
  );
}

/**
 * "Simulate an action" mode of the tactical board: draw from the ball holder to pass,
 * shoot or carry, from another player to make a run, then replay the whole move.
 * Opponent markers can be placed and dragged. Works on the scenario's posts (empty
 * ones included); a simulation is saved with the scenario on request.
 */
export function SquadSimulation({
  hidden,
  slots,
  formation,
  occupants,
  token,
  playerName,
  modeSwitch,
  saved,
  canWrite,
  busy,
  feedback,
  onSave,
  onPending,
}: {
  hidden: boolean;
  slots: Slot[];
  formation: FormationId;
  occupants: Record<string, string | null>;
  token: (playerId: string) => ReactNode;
  playerName: (playerId: string) => string;
  modeSwitch: ReactNode;
  saved: Simulation[];
  canWrite: boolean;
  busy: boolean;
  feedback: { error: string; success: string };
  /** Saves the scenario with this list of simulations; false on failure. */
  onSave: (list: Simulation[]) => Promise<boolean>;
  /** Told whether the board holds work that is not saved (checked before leaving it). */
  onPending: (pending: boolean) => void;
}) {
  const s = t.squad.sim;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const firstName = `${s.defaultName} ${saved.length + 1}`;
  const [holder, setHolder] = useState(() => defaultHolder(slots));
  const [steps, setSteps] = useState<SimStep[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [name, setName] = useState(firstName);
  const [kept, setKept] = useState(() =>
    snapshot(defaultHolder(slots), [], [], firstName),
  );
  const [frame, setFrame] = useState<SimState | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [rival, setRival] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<{
    from: string;
    points: Point[];
  } | null>(null);
  const [goal, setGoal] = useState(false);
  const [announce, setAnnounce] = useState("");
  const pitch = useRef<HTMLDivElement>(null);
  const start = useMemo(() => startState(slots, holder), [slots, holder]);
  const settled = useMemo(() => replay(start, steps), [start, steps]);
  const view = frame ?? settled;
  const groups = phases(steps);
  const contested = steps.map((step) => onTheLine(step, opponents));
  const pressed = new Set(contested.flat().map((o) => o.id));
  const clean = snapshot(holder, steps, opponents, name) === kept;
  const pending = !clean && (steps.length > 0 || opponents.length > 0);
  useEffect(() => onPending(pending), [pending, onPending]);

  const nameOf = (slotId: string) => {
    const player = occupants[slotId];
    const slot = slots.find((x) => x.id === slotId);
    return player
      ? playerName(player)
      : slot
        ? positionShort[slot.position]
        : slotId;
  };
  const describe = (step: SimStep) =>
    `${s.actions[step.action]} : ${nameOf(step.from)}${step.to ? ` → ${nameOf(step.to)}` : ""}`;
  const describeAt = (index: number) =>
    describe(steps[index]) +
    (contested[index].length
      ? ` · ${contested[index].length} ${s.onTheLine} (${contested[index].map((o) => o.label).join(", ")})`
      : "");

  // Animation: one requestAnimationFrame loop, phase after phase.
  const timers = useRef({ frame: 0, pause: 0, goal: 0 });
  useEffect(() => {
    const current = timers.current;
    return () => {
      cancelAnimationFrame(current.frame);
      clearTimeout(current.pause);
      clearTimeout(current.goal);
    };
  }, []);
  const stop = () => {
    cancelAnimationFrame(timers.current.frame);
    clearTimeout(timers.current.pause);
    setFrame(null);
    setPlaying(false);
  };
  const animate = (from: SimState, run: SimStep[][]) => {
    stop();
    if (!run.length) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = 0;
    let base = from;
    let began = 0;
    setPlaying(true);
    setGoal(false);
    const tick = (now: number) => {
      const group = run[index];
      if (!began) began = now;
      const total = phaseDuration(group, speed);
      const elapsed = still ? total : now - began;
      setFrame(frameAt(base, group, elapsed, speed));
      if (elapsed < total) {
        timers.current.frame = requestAnimationFrame(tick);
        return;
      }
      base = replay(base, group);
      if (group.some((x) => x.action === "shot")) {
        setGoal(true);
        setAnnounce(s.goal);
        clearTimeout(timers.current.goal);
        timers.current.goal = window.setTimeout(() => setGoal(false), 1800);
      }
      index++;
      if (index >= run.length) {
        setFrame(null);
        setPlaying(false);
        return;
      }
      began = 0;
      timers.current.pause = window.setTimeout(
        () => {
          timers.current.frame = requestAnimationFrame(tick);
        },
        still ? 700 : 250,
      );
    };
    timers.current.frame = requestAnimationFrame(tick);
  };

  const commit = (step: SimStep | null) => {
    setSelected(null);
    if (!step) return;
    if (steps.length >= MAX_STEPS) {
      setAnnounce(s.full);
      return;
    }
    setSteps([...steps, step]);
    setAnnounce(describe(step));
    animate(settled, [[step]]);
  };
  const replayAll = () => {
    setSelected(null);
    animate(
      start,
      groups.map((g) => g.map((i) => steps[i])),
    );
  };

  const toPoint = (e: { clientX: number; clientY: number }): Point => {
    const r = pitch.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  };
  // A press that moves becomes a drawn path; otherwise it is a tap (click).
  const draw = useRef<{
    from: string;
    x: number;
    y: number;
    points: Point[];
    moved: boolean;
  } | null>(null);
  const justDrew = useRef(false);
  const swallowClick = () => {
    justDrew.current = true;
    window.setTimeout(() => (justDrew.current = false), 0);
  };
  const actorHandlers = (id: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (playing) stop();
      e.currentTarget.setPointerCapture(e.pointerId);
      draw.current = {
        from: id,
        x: e.clientX,
        y: e.clientY,
        points: [toPoint(e)],
        moved: false,
      };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = draw.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.moved = true;
      const p = toPoint(e);
      const last = d.points[d.points.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 0.6) return;
      d.points.push(p);
      setDrawing({ from: d.from, points: [...d.points] });
    },
    onPointerUp: (e: React.PointerEvent) => {
      const d = draw.current;
      draw.current = null;
      setDrawing(null);
      if (!d?.moved) return;
      swallowClick();
      setRival(null);
      commit(makeStep(settled, d.from, [...d.points, toPoint(e)]));
    },
    onPointerCancel: () => {
      draw.current = null;
      setDrawing(null);
    },
    // A photo inside a token would start the browser's own image drag.
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    onClick: () => {
      if (justDrew.current) return;
      if (playing) stop();
      setRival(null);
      if (selected && selected !== id && selected === settled.holder) {
        commit(makeStep(settled, selected, [settled.positions[id]]));
        return;
      }
      const next = selected === id ? null : id;
      setSelected(next);
      if (next)
        setAnnounce(
          `${nameOf(next)} ${next === settled.holder ? s.pick : s.pickRun}`,
        );
    },
  });
  const preview = drawing
    ? makeStep(settled, drawing.from, drawing.points)
    : null;
  const shoot = () => {
    if (playing) stop();
    if (settled.holder)
      commit(makeStep(settled, settled.holder, [{ x: 50, y: 1 }]));
  };

  // Opponents: dragged, or picked then placed with a tap; arrows and Delete on a keyboard.
  const moveOpponent = (id: string, to: (o: Opponent) => Point) =>
    setOpponents((list) =>
      list.map((o) => (o.id === id ? placeOpponent(o, to(o)) : o)),
    );
  const removeOpponent = (o: Opponent) => {
    setOpponents((list) => list.filter((x) => x.id !== o.id));
    setRival(null);
    setAnnounce(`${s.opponent} ${o.label} ${s.opponentRemoved}`);
  };
  const grab = useRef<{
    id: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const opponentHandlers = (o: Opponent) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (playing) stop();
      e.currentTarget.setPointerCapture(e.pointerId);
      grab.current = { id: o.id, x: e.clientX, y: e.clientY, moved: false };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const g = grab.current;
      if (!g) return;
      if (!g.moved && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 8) return;
      g.moved = true;
      const p = toPoint(e);
      moveOpponent(g.id, () => p);
    },
    onPointerUp: () => {
      const g = grab.current;
      grab.current = null;
      if (!g?.moved) return;
      swallowClick();
      setAnnounce(`${s.opponent} ${o.label} ${s.opponentMoved}`);
    },
    onPointerCancel: () => {
      grab.current = null;
    },
    onClick: () => {
      if (justDrew.current) return;
      setSelected(null);
      setRival(rival === o.id ? null : o.id);
      if (rival !== o.id)
        setAnnounce(`${s.opponent} ${o.label} ${s.pickOpponent}`);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      const by = e.shiftKey ? 6 : 2;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-by, 0],
        ArrowRight: [by, 0],
        ArrowUp: [0, -by],
        ArrowDown: [0, by],
      };
      if (moves[e.key]) {
        e.preventDefault();
        const [dx, dy] = moves[e.key];
        moveOpponent(o.id, (p) => ({ x: p.x + dx, y: p.y + dy }));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeOpponent(o);
      }
    },
  });
  const addOne = () => {
    const next = addOpponent(opponents, Object.values(settled.positions));
    if (!next) {
      setAnnounce(s.opponentsFull);
      return;
    }
    setOpponents([...opponents, next]);
    setAnnounce(`${s.opponent} ${next.label}`);
  };

  // Saved simulations of the scenario.
  const confirmLeave = () => !pending || window.confirm(s.replaceConfirm);
  const open = (sim: Simulation) => {
    if (sim.id !== current && !confirmLeave()) return;
    stop();
    const loaded = sim.steps.map(unpackStep);
    const from = sim.holder ?? defaultHolder(slots);
    setHolder(from);
    setSteps(loaded);
    setOpponents(sim.opponents);
    setName(sim.name);
    setCurrent(sim.id);
    setKept(snapshot(from, loaded, sim.opponents, sim.name));
    setSelected(null);
    setRival(null);
    setGoal(false);
    setAnnounce(`${sim.name} ${s.opened}`);
  };
  const startNew = () => {
    if (!confirmLeave()) return;
    stop();
    const from = defaultHolder(slots);
    const next = `${s.defaultName} ${saved.length + 1}`;
    setHolder(from);
    setSteps([]);
    setCurrent(null);
    setName(next);
    setKept(snapshot(from, [], opponents, next));
    setSelected(null);
    setGoal(false);
  };
  const save = async () => {
    const entry: Simulation = {
      id: current ?? crypto.randomUUID(),
      name: name.trim() || `${s.defaultName} ${saved.length + 1}`,
      formation,
      holder,
      steps: steps.map(packStep),
      opponents,
    };
    const exists = saved.some((x) => x.id === entry.id);
    if (!exists && saved.length >= MAX_SAVED) {
      setAnnounce(s.listFull);
      return;
    }
    const kept = snapshot(holder, steps, opponents, entry.name);
    const list = exists
      ? saved.map((x) => (x.id === entry.id ? entry : x))
      : [...saved, entry];
    if (await onSave(list)) {
      setCurrent(entry.id);
      setName(entry.name);
      setKept(kept);
    }
  };
  const remove = async (sim: Simulation) => {
    if (!window.confirm(s.removeConfirm)) return;
    if (
      (await onSave(saved.filter((x) => x.id !== sim.id))) &&
      sim.id === current
    )
      setCurrent(null);
  };
  const full =
    !saved.some((x) => x.id === current) && saved.length >= MAX_SAVED;
  const state = current
    ? clean
      ? ["", s.stateSaved]
      : [" dirty", s.stateDirty]
    : steps.length || opponents.length
      ? [" dirty", s.stateNew]
      : null;

  return (
    <>
      <section
        className="ml-card ml-sim-panel"
        aria-label={s.title}
        hidden={hidden}
      >
        <h2>{s.title}</h2>
        <p className="ml-muted">{s.hint}</p>
        <p className="ml-muted">{s.tapHint}</p>
        <div className="ml-sim-settings">
          <label>
            {s.start}
            <select
              value={holder ?? ""}
              disabled={steps.length > 0}
              aria-describedby={steps.length ? `${uid}-locked` : undefined}
              onChange={(e) => {
                setHolder(e.target.value);
                setSelected(null);
              }}
            >
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {positionShort[slot.position]}
                  {occupants[slot.id] ? ` · ${nameOf(slot.id)}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            {s.speed}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              {SPEEDS.map(([key, value]) => (
                <option key={key} value={value}>
                  {s.speeds[key]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {steps.length > 0 && (
          <p className="ml-muted" id={`${uid}-locked`}>
            {s.startLocked}
          </p>
        )}

        <h3>{s.opponents}</h3>
        <p className="ml-muted">{s.opponentsHint}</p>
        <div className="ml-sim-settings">
          <label>
            {s.opponentShape}
            <select
              value=""
              onChange={(e) => {
                const shape = e.target.value as FormationId;
                if (!shape) return;
                setOpponents(
                  opponentFormation(
                    FORMATIONS[shape].map((p) => ({
                      ...p,
                      label: positionShort[p.position],
                    })),
                  ),
                );
                setRival(null);
                setAnnounce(`${s.opponents} : ${shape}`);
              }}
            >
              <option value="">{s.pickShape}</option>
              {FORMATION_IDS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="ml-actions">
          <button
            type="button"
            className="ml-button secondary"
            onClick={addOne}
          >
            <UserPlus size={17} />
            {s.addOpponent}
          </button>
          {rival && (
            <button
              type="button"
              className="ml-button secondary"
              onClick={() => {
                const o = opponents.find((x) => x.id === rival);
                if (o) removeOpponent(o);
              }}
            >
              <UserX size={17} />
              {s.removeOpponent} {opponents.find((x) => x.id === rival)?.label}
            </button>
          )}
          <button
            type="button"
            className="ml-button secondary"
            disabled={!opponents.length}
            onClick={() => {
              setOpponents([]);
              setRival(null);
            }}
          >
            {s.clearOpponents}
          </button>
        </div>

        <h3>{s.steps}</h3>
        {groups.length ? (
          <ol className="ml-sim-steps">
            {groups.map((group, i) => (
              <li key={i}>
                <strong>
                  {s.phase} {i + 1}
                </strong>
                <span>{group.map(describeAt).join(` · ${s.together} · `)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="ml-muted">{s.noSteps}</p>
        )}
        <p className="ml-muted">{s.notSaved}</p>

        <h3>{s.saving}</h3>
        {canWrite ? (
          <>
            <label>
              {s.name}
              <input
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <p className="ml-muted">{s.saveHint}</p>
            <div className="ml-actions">
              <button
                type="button"
                className="ml-button"
                disabled={busy || full || (!steps.length && !opponents.length)}
                onClick={save}
              >
                <Save size={17} />
                {s.save}
              </button>
              <button
                type="button"
                className="ml-button secondary"
                disabled={!current && !steps.length}
                onClick={startNew}
              >
                <FilePlus size={17} />
                {s.newOne}
              </button>
            </div>
            {state && (
              <p className={`ml-save-state${state[0]}`} role="status">
                {state[1]}
              </p>
            )}
            {full && <p className="ml-muted">{s.listFull}</p>}
            <Feedback {...feedback} />
          </>
        ) : (
          <p className="ml-muted">{s.readOnly}</p>
        )}
        <h3>{s.savedList}</h3>
        {saved.length ? (
          <ul className="ml-sim-saved">
            {saved.map((sim) => {
              const elsewhere = sim.formation !== formation;
              return (
                <li
                  key={sim.id}
                  className={sim.id === current ? "current" : undefined}
                >
                  <div>
                    <strong>{sim.name}</strong>
                    <small>
                      {sim.formation} · {sim.steps.length} {s.steps_count} ·{" "}
                      {sim.opponents.length} {s.opponents_count}
                    </small>
                    {elsewhere && (
                      <small>
                        {s.otherFormation} {sim.formation} :{" "}
                        {s.otherFormationHint}
                      </small>
                    )}
                  </div>
                  <div className="ml-actions">
                    <button
                      type="button"
                      className="ml-button secondary"
                      disabled={elsewhere}
                      aria-label={`${s.open} : ${sim.name}`}
                      onClick={() => open(sim)}
                    >
                      {s.open}
                    </button>
                    {canWrite && (
                      <button
                        type="button"
                        className="ml-button secondary"
                        disabled={busy}
                        aria-label={`${s.remove} : ${sim.name}`}
                        onClick={() => remove(sim)}
                      >
                        <Trash2 size={17} />
                        {s.remove}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ml-muted">{s.noSaved}</p>
        )}
      </section>
      <section
        className="ml-card ml-pitch-card"
        aria-label={t.squad.pitch}
        hidden={hidden}
      >
        {modeSwitch}
        {/* The opponent goal stands behind the goal line, clear of the players. */}
        <div className="ml-sim-stage">
          <button
            type="button"
            className="ml-sim-goal"
            aria-label={s.shoot}
            disabled={!settled.holder}
            onClick={shoot}
          />
          <div
            ref={pitch}
            className={`ml-pitch ml-sim-pitch${drawing ? " drawing" : ""}`}
            onClick={(e) => {
              if ((e.target as Element).closest("button")) return;
              if (rival) {
                const p = toPoint(e);
                const o = opponents.find((x) => x.id === rival);
                moveOpponent(rival, () => p);
                setRival(null);
                if (o)
                  setAnnounce(`${s.opponent} ${o.label} ${s.opponentMoved}`);
                return;
              }
              if (!selected) return;
              if (playing) stop();
              commit(makeStep(settled, selected, [toPoint(e)]));
            }}
          >
            <PitchLines />
            <svg
              className="ml-sim-paths"
              viewBox="0 0 68 100"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                {MARKERS.map((a) => (
                  <marker
                    key={a}
                    id={`${uid}-${a}`}
                    className={`ml-sim-arrow ${a}`}
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="4"
                    markerHeight="4"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" />
                  </marker>
                ))}
              </defs>
              {steps.map((step, i) => {
                const path = trimPath(
                  step.path,
                  3.5,
                  step.action === "shot" ? 0 : 4.5,
                );
                const look = contested[i].length ? "contested" : step.action;
                return path.length ? (
                  <polyline
                    key={i}
                    className={`ml-sim-path ${step.action}${contested[i].length ? " contested" : ""}`}
                    points={svgPoints(path)}
                    markerEnd={`url(#${uid}-${look})`}
                  />
                ) : null;
              })}
              {drawing && (
                <polyline
                  className={`ml-sim-path drawing ${preview?.action ?? ""}`}
                  points={svgPoints([
                    settled.positions[drawing.from],
                    ...drawing.points,
                  ])}
                />
              )}
            </svg>
            {opponents.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`ml-sim-opponent${rival === o.id ? " selected" : ""}${pressed.has(o.id) ? " on-line" : ""}`}
                style={{ left: `${o.x}%`, top: `${o.y}%` }}
                aria-label={`${s.opponent} ${o.label}`}
                aria-pressed={rival === o.id}
                {...opponentHandlers(o)}
              >
                <span aria-hidden="true">{o.label}</span>
              </button>
            ))}
            {slots.map((slot) => {
              const player = occupants[slot.id];
              const at = view.positions[slot.id];
              const hasBall = view.holder === slot.id;
              return (
                <div
                  key={slot.id}
                  className={`ml-slot ml-sim-actor${hasBall ? " has-ball" : ""}${selected === slot.id ? " selected" : ""}${preview?.to === slot.id ? " target" : ""}`}
                  style={{ left: `${at.x}%`, top: `${at.y}%` }}
                >
                  <button
                    type="button"
                    className="ml-slot-button"
                    aria-label={`${positionNames[slot.position]} : ${player ? nameOf(slot.id) : t.squad.emptySlot}${settled.holder === slot.id ? `, ${s.hasBall}` : ""}`}
                    aria-pressed={selected === slot.id}
                    {...actorHandlers(slot.id)}
                  >
                    {player ? (
                      token(player)
                    ) : (
                      <span className="ml-slot-empty">
                        {positionShort[slot.position]}
                      </span>
                    )}
                  </button>
                  <span className="ml-slot-name">
                    {player ? nameOf(slot.id) : positionShort[slot.position]}
                  </span>
                </div>
              );
            })}
            <span
              className={`ml-sim-ball${view.holder ? " held" : ""}`}
              style={{ left: `${view.ball.x}%`, top: `${view.ball.y}%` }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" />
                <path d="M10 5.6l4.2 3-1.6 4.9H7.4L5.8 8.6z" />
              </svg>
            </span>
            {goal && (
              <p className="ml-sim-goal-flash" aria-hidden="true">
                {s.goal}
              </p>
            )}
          </div>
        </div>
        <div className="ml-actions ml-sim-controls">
          {playing ? (
            <button type="button" className="ml-button" onClick={stop}>
              <Square size={17} />
              {s.stop}
            </button>
          ) : (
            <button
              type="button"
              className="ml-button"
              disabled={!steps.length}
              onClick={replayAll}
            >
              <Play size={17} />
              {s.play}
            </button>
          )}
          <button
            type="button"
            className="ml-button secondary"
            disabled={!steps.length}
            onClick={() => {
              stop();
              setSelected(null);
              setSteps(steps.slice(0, -1));
            }}
          >
            <Undo2 size={17} />
            {s.undo}
          </button>
          <button
            type="button"
            className="ml-button secondary"
            disabled={!steps.length}
            onClick={() => {
              stop();
              setSelected(null);
              setGoal(false);
              setSteps([]);
            }}
          >
            <RotateCcw size={17} />
            {s.clear}
          </button>
        </div>
        <p className="ml-sr-live" aria-live="polite">
          {announce}
        </p>
      </section>
    </>
  );
}
