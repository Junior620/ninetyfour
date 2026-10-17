"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LoginShotMotion.module.css";

/**
 * Abstract shot for the sign-in panel: a strike suggested by motion lines, a tracked
 * trajectory into the top corner and a net that gives on impact. No character, no asset.
 * One geometry drives both the drawing and the Web Animations timeline; nothing moves
 * when the visitor prefers reduced motion.
 */
type Point = { x: number; y: number };
type Frames = Keyframe[];

const DURATION = 7200;
const STRIKE = 0.2;
const IMPACT = 0.46;
// A driven shot rising under the crossbar into the top corner.
const P0: Point = { x: 112, y: 206 }; // ball on the spot
const C1: Point = { x: 240, y: 144 };
const C2: Point = { x: 430, y: 100 };
const P1: Point = { x: 548, y: 110 }; // top corner, back of the net
const SHOT = `M${P0.x} ${P0.y}C${C1.x} ${C1.y} ${C2.x} ${C2.y} ${P1.x} ${P1.y}`;
const COMET = 0.13; // bright head length, as a fraction of the shot
const DOTS = [0.25, 0.5, 0.75];
const FLIGHT_STEPS = 18;

const cubic = (a: number, b: number, c: number, d: number, t: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
const bezier = (t: number): Point => ({
  x: cubic(P0.x, C1.x, C2.x, P1.x, t),
  y: cubic(P0.y, C1.y, C2.y, P1.y, t),
});
// Arc-length table: the ball, its shadow and the drawn trace share one progression.
const SAMPLES = Array.from({ length: 241 }, (_, i) => bezier(i / 240));
const LENGTHS: number[] = [];
SAMPLES.forEach((p, i) =>
  LENGTHS.push(
    i ? LENGTHS[i - 1] + Math.hypot(p.x - SAMPLES[i - 1].x, p.y - SAMPLES[i - 1].y) : 0,
  ),
);
const TOTAL = LENGTHS[LENGTHS.length - 1];
function along(s: number): Point {
  const target = s * TOTAL;
  const i = Math.max(1, LENGTHS.findIndex((l) => l >= target));
  const r = (target - LENGTHS[i - 1]) / (LENGTHS[i] - LENGTHS[i - 1] || 1);
  return {
    x: SAMPLES[i - 1].x + (SAMPLES[i].x - SAMPLES[i - 1].x) * r,
    y: SAMPLES[i - 1].y + (SAMPLES[i].y - SAMPLES[i - 1].y) * r,
  };
}
const drag = (u: number) => 1 - (1 - u) ** 2.2; // sharp strike, gentle arrival
const flightAt = (u: number) => STRIKE + (IMPACT - STRIKE) * u;
const passes = (s: number) => flightAt(1 - (1 - s) ** (1 / 2.2));
const ground = (s: number) => 216 + (189 - 216) * s; // shadow line, spot to goal
const move = (p: Point) => `translate(${p.x - P0.x}px, ${p.y - P0.y}px)`;
const flight = <T extends object>(frame: (s: number) => T) =>
  Array.from({ length: FLIGHT_STEPS }, (_, i) => {
    const u = (i + 1) / FLIGHT_STEPS;
    return { offset: flightAt(u), ...frame(drag(u)) };
  });
const IN_NET: Point = { x: P1.x + 4, y: P1.y - 2 };
const DROPPED: Point = { x: P1.x + 3, y: 177 }; // settles inside the net, clear of the post
const shadowOf = (s: number, ball: Point) => {
  const height = Math.min(1, (ground(s) - ball.y) / 150);
  return {
    transform: `translate(${ball.x - P0.x}px, ${ground(s) - 216}px) scale(${(1 - 0.32 * s) * (1 - 0.45 * height)})`,
    opacity: 0.42 * (1 - 0.7 * height),
  };
};

const TIMELINE: [string, Frames | ((i: number) => Frames)][] = [
  [
    "ball",
    [
      { offset: 0, transform: move(P0), opacity: 1 },
      { offset: STRIKE, transform: move(P0), opacity: 1 },
      ...flight((s) => ({ transform: move(along(s)), opacity: 1 })),
      { offset: IMPACT + 0.0001, transform: move(P1), opacity: 1, easing: "ease-out" },
      { offset: IMPACT + 0.04, transform: move(IN_NET), opacity: 1, easing: "cubic-bezier(.55,0,1,.45)" },
      { offset: 0.6, transform: move(DROPPED), opacity: 1 },
      { offset: 0.66, transform: move(DROPPED), opacity: 0 },
      { offset: 0.9, transform: move(P0), opacity: 0 },
      { offset: 1, transform: move(P0), opacity: 1 },
    ],
  ],
  [
    "spin",
    [
      { offset: 0, transform: "scale(1) rotate(0deg)" },
      { offset: STRIKE, transform: "scale(1) rotate(0deg)", easing: "cubic-bezier(.2,.65,.35,1)" },
      { offset: IMPACT, transform: "scale(.72) rotate(640deg)", easing: "ease-out" },
      { offset: 0.6, transform: "scale(.7) rotate(720deg)" },
      { offset: 0.9, transform: "scale(1) rotate(0deg)" },
      { offset: 1, transform: "scale(1) rotate(0deg)" },
    ],
  ],
  [
    "halo",
    [
      { offset: 0, opacity: 0.25, transform: "scale(1)" },
      { offset: 0.1, opacity: 0.55, transform: "scale(1.08)" },
      { offset: STRIKE - 0.02, opacity: 0.3, transform: "scale(1)" },
      { offset: STRIKE + 0.01, opacity: 0.75, transform: "scale(1.3)", easing: "ease-out" },
      { offset: IMPACT, opacity: 0.12, transform: "scale(.8)" },
      { offset: 0.6, opacity: 0, transform: "scale(.8)" },
      { offset: 0.9, opacity: 0, transform: "scale(1)" },
      { offset: 1, opacity: 0.25, transform: "scale(1)" },
    ],
  ],
  [
    "shadow",
    [
      { offset: 0, ...shadowOf(0, P0) },
      { offset: STRIKE, ...shadowOf(0, P0) },
      ...flight((s) => shadowOf(s, along(s))),
      { offset: IMPACT + 0.04, ...shadowOf(1, IN_NET), easing: "cubic-bezier(.55,0,1,.45)" },
      { offset: 0.6, ...shadowOf(1, { x: DROPPED.x, y: 189 }) },
      { offset: 0.66, transform: shadowOf(1, DROPPED).transform, opacity: 0 },
      { offset: 0.9, transform: shadowOf(0, P0).transform, opacity: 0 },
      { offset: 1, ...shadowOf(0, P0) },
    ],
  ],
  [
    "reveal",
    [
      { offset: 0, strokeDashoffset: 1, opacity: 0 },
      { offset: STRIKE, strokeDashoffset: 1, opacity: 0.34 },
      ...flight((s) => ({ strokeDashoffset: 1 - s, opacity: 0.34 })),
      { offset: 0.74, strokeDashoffset: 0, opacity: 0.34 },
      { offset: 0.88, strokeDashoffset: 0, opacity: 0 },
      { offset: 1, strokeDashoffset: 1, opacity: 0 },
    ],
  ],
  [
    "comet",
    [
      { offset: 0, strokeDashoffset: COMET, opacity: 0 },
      { offset: STRIKE, strokeDashoffset: COMET, opacity: 1 },
      ...flight((s) => ({ strokeDashoffset: COMET - s, opacity: 1 })),
      { offset: IMPACT + 0.07, strokeDashoffset: COMET - 1, opacity: 0 },
      { offset: 1, strokeDashoffset: COMET, opacity: 0 },
    ],
  ],
  [
    "strike",
    (i) => {
      const from = STRIKE - 0.075 + i * 0.012;
      return [
        { offset: 0, strokeDashoffset: 1, opacity: 0 },
        { offset: from, strokeDashoffset: 1, opacity: 0, easing: "cubic-bezier(.5,0,.9,.6)" },
        { offset: STRIKE, strokeDashoffset: 0, opacity: 0.8, easing: "ease-out" },
        { offset: STRIKE + 0.07, strokeDashoffset: -1, opacity: 0 },
        { offset: 1, strokeDashoffset: -1, opacity: 0 },
      ];
    },
  ],
  [
    "dot",
    (i) => {
      const at = passes(DOTS[i]);
      return [
        { offset: 0, opacity: 0, transform: "scale(.2)" },
        { offset: at, opacity: 0, transform: "scale(.2)", easing: "ease-out" },
        { offset: at + 0.025, opacity: 0.85, transform: "scale(1)" },
        { offset: 0.74, opacity: 0.85, transform: "scale(1)" },
        { offset: 0.88, opacity: 0, transform: "scale(1)" },
        { offset: 1, opacity: 0, transform: "scale(.2)" },
      ];
    },
  ],
  [
    "mesh",
    [
      { offset: 0, transform: "translate(0px, 0px) scale(1)" },
      { offset: IMPACT, transform: "translate(0px, 0px) scale(1)", easing: "ease-out" },
      { offset: IMPACT + 0.025, transform: "translate(3.5px, -2px) scale(1.02)", easing: "ease-in-out" },
      { offset: IMPACT + 0.06, transform: "translate(-1px, .6px) scale(.995)", easing: "ease-in-out" },
      { offset: IMPACT + 0.095, transform: "translate(.5px, -.3px) scale(1.004)", easing: "ease-in-out" },
      { offset: IMPACT + 0.13, transform: "translate(0px, 0px) scale(1)" },
      { offset: 1, transform: "translate(0px, 0px) scale(1)" },
    ],
  ],
  [
    "bulge",
    [
      { offset: 0, opacity: 0, transform: "scale(.4)" },
      { offset: IMPACT, opacity: 0, transform: "scale(.4)", easing: "ease-out" },
      { offset: IMPACT + 0.03, opacity: 0.55, transform: "scale(1)", easing: "ease-in" },
      { offset: IMPACT + 0.15, opacity: 0, transform: "scale(1.35)" },
      { offset: 1, opacity: 0, transform: "scale(1.35)" },
    ],
  ],
  [
    "ring",
    [
      { offset: 0, opacity: 0, transform: "scale(.4)" },
      { offset: IMPACT, opacity: 0, transform: "scale(.4)" },
      { offset: IMPACT + 0.005, opacity: 0.8, transform: "scale(.6)", easing: "cubic-bezier(.2,.7,.3,1)" },
      { offset: IMPACT + 0.12, opacity: 0, transform: "scale(2.8)" },
      { offset: 1, opacity: 0, transform: "scale(2.8)" },
    ],
  ],
];

// Clean goal in light perspective: the net is shallow under the bar and deeper on the ground.
const FRONT = { left: 440, right: 562, top: 96, bottom: 196 };
const TOP_DEPTH = { x: 14, y: -9 };
const GROUND_DEPTH = { x: 30, y: -17 };
const xy = (x: number, y: number) => `${x} ${y}`;
const backTop = (x: number) => xy(x + TOP_DEPTH.x, FRONT.top + TOP_DEPTH.y);
const backGround = (x: number) => xy(x + GROUND_DEPTH.x, FRONT.bottom + GROUND_DEPTH.y);
const BACK_PLANE = `M${backTop(FRONT.left)}L${backTop(FRONT.right)}L${backGround(FRONT.right)}L${backGround(FRONT.left)}Z`;
const RIGHT_SIDE = `M${xy(FRONT.right, FRONT.top)}L${backTop(FRONT.right)}L${backGround(FRONT.right)}L${xy(FRONT.right, FRONT.bottom)}Z`;
const TOP_SIDE = `M${xy(FRONT.left, FRONT.top)}L${backTop(FRONT.left)}L${backTop(FRONT.right)}L${xy(FRONT.right, FRONT.top)}Z`;
const STAYS = [
  `M${xy(FRONT.left, FRONT.top)}L${backTop(FRONT.left)}`,
  `M${xy(FRONT.right, FRONT.top)}L${backTop(FRONT.right)}`,
  `M${xy(FRONT.right, FRONT.bottom)}L${backGround(FRONT.right)}`,
  `M${xy(FRONT.left, FRONT.bottom)}L${backGround(FRONT.left)}`,
].join("");
// Ball panels: a centre pentagon and, in line with its corners, five rim pentagons cut by the outline.
const pentagon = (cx: number, cy: number, r: number, turn: number) =>
  `M${Array.from({ length: 5 }, (_, i) => {
    const a = ((turn + i * 72 - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join("L")}Z`;
const PANELS = [
  pentagon(0, 0, 3.2, 0),
  ...Array.from({ length: 5 }, (_, i) => {
    const a = ((i * 72 - 90) * Math.PI) / 180;
    return pentagon(9.3 * Math.cos(a), 9.3 * Math.sin(a), 3.7, 36);
  }),
].join("");

export function LoginShotMotion() {
  const root = useRef<HTMLDivElement>(null);
  const running = useRef<Animation[]>([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);

  useEffect(() => {
    const scene = root.current;
    if (!scene || typeof scene.animate !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      running.current.forEach((a) => a.cancel());
      running.current = [];
    };
    const sync = () => {
      stop();
      if (media.matches) return;
      running.current = TIMELINE.flatMap(([key, frames]) =>
        [...scene.querySelectorAll<SVGElement>(`[data-motion="${key}"]`)].map(
          (el, i) =>
            el.animate(typeof frames === "function" ? frames(i) : frames, {
              duration: DURATION,
              iterations: Infinity,
            }),
        ),
      );
      // One shared start keeps every layer on the same beat.
      const start = document.timeline.currentTime;
      running.current.forEach((a) => {
        a.startTime = start;
        if (pausedRef.current) a.pause();
      });
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      stop();
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    running.current.forEach((a) => (paused ? a.pause() : a.play()));
  }, [paused]);

  return (
    <div ref={root} className={styles.scene}>
      <svg
        className={styles.art}
        viewBox="0 40 600 200"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="mlm-pitch" x1="330" x2="560" y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity=".26" />
          </linearGradient>
          <pattern id="mlm-mesh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0V6M0 0H6" stroke="#fff" strokeWidth=".45" />
          </pattern>
          <radialGradient id="mlm-ball" cx=".38" cy=".34" r=".75">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".7" stopColor="#e6eef8" />
            <stop offset="1" stopColor="#bfd1e6" />
          </radialGradient>
          <radialGradient id="mlm-glow">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mlm-streak" x1="50" y1="150" x2="104" y2="214" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#dbe7f5" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <clipPath id="mlm-ball-clip">
            <circle r="9" />
          </clipPath>
          <radialGradient id="mlm-depth">
            <stop offset="0" stopColor="#6f9fd4" stopOpacity=".16" />
            <stop offset=".6" stopColor="#6f9fd4" stopOpacity=".06" />
            <stop offset="1" stopColor="#6f9fd4" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="505" cy="146" rx="150" ry="96" fill="url(#mlm-depth)" />

        {/* Pitch, suggested and fading towards the text. */}
        <g stroke="url(#mlm-pitch)" strokeWidth="1">
          <path d="M330 196H600" />
          <path d="M398 196 376 226H560" />
        </g>

        {/* Net: fine diamond mesh, only the back plane gives on impact. */}
        <path d={TOP_SIDE} fill="url(#mlm-mesh)" opacity=".12" />
        <path d={RIGHT_SIDE} fill="url(#mlm-mesh)" opacity=".16" />
        <g className={styles.mesh} data-motion="mesh">
          <path d={BACK_PLANE} fill="url(#mlm-mesh)" opacity=".3" />
        </g>
        <circle className={styles.burst} data-motion="bulge" cx={P1.x} cy={P1.y} r="30" fill="url(#mlm-glow)" />
        <g stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".9">
          <path d={BACK_PLANE} opacity=".3" />
          <path d={STAYS} opacity=".38" />
        </g>

        {/* Trajectory: a quiet predicted guide, the drawn trace and its bright head. */}
        <path className={styles.guide} d={SHOT} pathLength="1" />
        <path className={styles.reveal} data-motion="reveal" d={SHOT} pathLength="1" />
        <path className={styles.cometGlow} data-motion="comet" d={SHOT} pathLength="1" />
        <path className={styles.comet} data-motion="comet" d={SHOT} pathLength="1" />
        {DOTS.map((s) => {
          const p = along(s);
          return <circle key={s} className={styles.dot} data-motion="dot" cx={p.x} cy={p.y} r="1.9" />;
        })}

        {/* The strike, suggested by three sweeping lines behind the ball. */}
        <g className={styles.strike} stroke="url(#mlm-streak)" strokeLinecap="round">
          <path data-motion="strike" pathLength="1" d="M50 150Q60 212 102 218" strokeWidth="1.8" />
          <path data-motion="strike" pathLength="1" d="M66 162Q73 207 101 212" strokeWidth="1.2" />
          <path data-motion="strike" pathLength="1" d="M81 175Q87 202 100 206" strokeWidth=".8" />
        </g>

        <ellipse className={styles.shadow} data-motion="shadow" cx={P0.x} cy="216" rx="12" ry="2.6" />
        <g data-motion="ball">
          <g transform={`translate(${P0.x} ${P0.y})`}>
            <circle className={styles.halo} data-motion="halo" r="17" fill="url(#mlm-glow)" />
            <g className={styles.spin} data-motion="spin">
              <circle r="9" fill="url(#mlm-ball)" />
              <path
                d={PANELS}
                clipPath="url(#mlm-ball-clip)"
                fill="#1d4675"
                fillOpacity=".72"
                stroke="#1d4675"
                strokeOpacity=".45"
                strokeWidth=".5"
                strokeLinejoin="round"
              />
              <circle r="8.7" stroke="#fff" strokeOpacity=".55" strokeWidth=".6" />
            </g>
          </g>
        </g>
        <circle className={styles.ring} data-motion="ring" cx={P1.x} cy={P1.y} r="9" />

        {/* Front frame last, so the ball visibly enters behind the posts. */}
        <path
          d={`M${FRONT.left} ${FRONT.bottom}V${FRONT.top}H${FRONT.right}V${FRONT.bottom}`}
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".92"
        />
      </svg>
      <button
        type="button"
        className={styles.pause}
        aria-label="Mettre l’animation en pause"
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
          {paused ? (
            <path d="m2.5 1.5 6 3.5-6 3.5Z" fill="currentColor" />
          ) : (
            <path d="M3 1.5v7M7 1.5v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
      </button>
    </div>
  );
}
