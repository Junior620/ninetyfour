"use client";

import { useState } from "react";
import styles from "./LoginFootballAnimation.module.css";

/** Decorative SVG: one shared CSS timeline, no assets, timers or animation runtime. */
export function LoginFootballAnimation() {
  const [paused, setPaused] = useState(false);

  return (
    <div className={styles.scene} data-paused={paused}>
      <svg
        className={styles.illustration}
        viewBox="0 0 560 232"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* Pitch and observation guides stay still; the text above remains primary. */}
        <g stroke="currentColor" strokeWidth="1" className={styles.pitch}>
          <path d="M24 204H384L540 170M342 204V164L464 138" />
          <path d="M24 30V22H32M528 22H536V30M24 214V222H32" />
          <path d="M164 204v5M264 204v5M364 204v5" />
          <path d="M164 178Q302 111 458 144" strokeDasharray="2 8" />
        </g>

        {/* A restrained, faceless silhouette; the striking leg pivots at the hip. */}
        <g className={styles.player} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="110" cy="49" r="10" fill="currentColor" />
          <path d="m104 65-16 35 18 25 20-7-9-43Z" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.5" />
          <path d="m101 74-22 19-19-5m55-12 14 20 19 5" stroke="currentColor" strokeWidth="7" />
          <path d="m104 119-16 33 7 37" stroke="currentColor" strokeWidth="12" />
          <path d="m92 187 7 8h18v-5l-14-5Z" fill="currentColor" />
          <g className={styles.leg}>
            <path d="m111 118 15 27 10 27" stroke="currentColor" strokeWidth="13" />
            <path d="m131 170 9-2 9 6 12 3-1 6h-23Z" fill="currentColor" />
            <path d="m139 183h20" stroke="var(--shot-accent)" strokeWidth="2" />
          </g>
          <path d="m99 116 18 4" stroke="var(--shot-accent)" strokeWidth="2" />
        </g>

        {/* The back and side mesh deform together; the front frame remains rigid. */}
        <g className={styles.net} stroke="currentColor" strokeWidth=".8">
          <path d="m386 92 36-26 106-12v108l-36 26-106 12Z" fill="currentColor" fillOpacity=".025" />
          {Array.from({ length: 9 }, (_, i) => {
            const x = 422 + (106 * i) / 8;
            const y = 66 - (12 * i) / 8;
            return <path key={`v${i}`} d={`M${x} ${y}v108`} />;
          })}
          {Array.from({ length: 9 }, (_, i) => {
            const y = 66 + (108 * i) / 8;
            return <path key={`h${i}`} d={`M422 ${y}l106-12M386 ${y + 26}l36-26`} />;
          })}
          <path d="m398 83 0 108m12-117v108M386 92l106-12 36-26M386 200l36-26 106-12" />
        </g>

        <path
          className={styles.trace}
          d="M164 178Q302 111 458 144"
          pathLength="1"
          stroke="var(--shot-accent)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <ellipse className={styles.shadow} cx="164" cy="198" rx="13" ry="3" fill="#071d35" />
        <g className={styles.ballTravel}>
          <g transform="translate(164 178)">
            <g className={styles.ballSpin}>
              <circle r="10" fill="#edf3fa" />
              <path d="m0-4 4 3-1 5h-6l-1-5ZM-8-6l5-3M8-6l-5-3M-9 4l4 4m14-4-4 4M0 5v5" fill="#1b416a" stroke="#1b416a" strokeWidth="1" strokeLinejoin="round" />
            </g>
          </g>
        </g>
        <circle className={styles.impact} cx="458" cy="144" r="14" stroke="var(--shot-accent)" strokeWidth="1" />

        {/* Drawn last so that the ball visibly enters behind the front posts. */}
        <g stroke="#dce8f5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M386 200V92l106-12v108" strokeWidth="3" />
          <path d="m386 92 36-26 106-12v108l-36 26" strokeWidth="1.3" opacity=".55" />
          <path d="m386 200 106-12" strokeWidth="1" opacity=".25" />
        </g>
      </svg>
      <button
        type="button"
        className={styles.pause}
        aria-label={paused ? "Reprendre l’illustration" : "Mettre l’illustration en pause"}
        onClick={() => setPaused((value) => !value)}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
          {paused ? <path d="m2 1 7 4-7 4Z" fill="currentColor" /> : <path d="M3 1v8M7 1v8" stroke="currentColor" strokeWidth="2" />}
        </svg>
        {paused ? "Reprendre" : "Pause"}
      </button>
    </div>
  );
}
