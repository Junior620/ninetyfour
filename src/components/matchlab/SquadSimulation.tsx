"use client";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Play, RotateCcw, Square, Undo2 } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import { positionNames } from "@/lib/matchlab/questionnaire";
import { positionShort, type Slot } from "@/lib/matchlab/formations";
import {
  startState,
  defaultHolder,
  makeStep,
  replay,
  phases,
  frameAt,
  phaseDuration,
  trimPath,
  MAX_STEPS,
  type Point,
  type SimAction,
  type SimState,
  type SimStep,
} from "@/lib/matchlab/simulation";

const SPEEDS = [
  ["slow", 0.5],
  ["normal", 1],
  ["fast", 2],
] as const;
const ACTIONS: SimAction[] = ["pass", "shot", "carry", "run"];
// Slot frame (percent) to the 68 × 100 pitch drawing.
const svgPoints = (path: Point[]) =>
  path.map((p) => `${(p.x * 0.68).toFixed(2)},${p.y.toFixed(2)}`).join(" ");

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
 * Works on the scenario's posts (empty ones included) and is never saved.
 */
export function SquadSimulation({
  hidden,
  slots,
  occupants,
  token,
  playerName,
  modeSwitch,
}: {
  hidden: boolean;
  slots: Slot[];
  occupants: Record<string, string | null>;
  token: (playerId: string) => ReactNode;
  playerName: (playerId: string) => string;
  modeSwitch: ReactNode;
}) {
  const s = t.squad.sim;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [holder, setHolder] = useState(() => defaultHolder(slots));
  const [steps, setSteps] = useState<SimStep[]>([]);
  const [frame, setFrame] = useState<SimState | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
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
      justDrew.current = true;
      window.setTimeout(() => (justDrew.current = false), 0);
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
        <h3>{s.steps}</h3>
        {groups.length ? (
          <ol className="ml-sim-steps">
            {groups.map((group, i) => (
              <li key={i}>
                <strong>
                  {s.phase} {i + 1}
                </strong>
                <span>
                  {group
                    .map((index) => describe(steps[index]))
                    .join(` · ${s.together} · `)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="ml-muted">{s.noSteps}</p>
        )}
        <p className="ml-muted">{s.notSaved}</p>
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
              if (!selected || (e.target as Element).closest("button")) return;
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
                {ACTIONS.map((a) => (
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
                return path.length ? (
                  <polyline
                    key={i}
                    className={`ml-sim-path ${step.action}`}
                    points={svgPoints(path)}
                    markerEnd={`url(#${uid}-${step.action})`}
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
