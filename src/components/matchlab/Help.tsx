"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { CircleHelp, Compass, X } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";

/** Guided tour state, per browser: progress, completion and whether to offer it. */
type TourState = {
  active: boolean;
  step: number;
  done: boolean;
  auto: boolean;
};
const KEY = "ml-tour";
const initial: TourState = { active: false, step: 0, done: false, auto: true };
const listeners = new Set<() => void>();
let cache: { raw: string | null; state: TourState } = {
  raw: null,
  state: initial,
};
function read(): TourState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw !== cache.raw) {
    let parsed: Partial<TourState> = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {}
    cache = { raw, state: { ...initial, ...parsed } };
  }
  return cache.state;
}
function write(patch: Partial<TourState>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {}
  listeners.forEach((l) => l());
}
function useTour() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      window.addEventListener("storage", l);
      return () => {
        listeners.delete(l);
        window.removeEventListener("storage", l);
      };
    },
    read,
    () => initial,
  );
}
const steps = t.tour.steps;
/** Starts the guided tour from its first step (help panel and assistant). */
export function startTour(section: string, push: (href: string) => void) {
  write({ active: true, step: 0, done: false });
  if (steps[0].section !== section) push(`/matchlab/${steps[0].section}`);
}
type Section = keyof typeof t.help.pages;

/** "?" button and side panel: page help, guided tour start and preference. */
export function HelpPanel({ section }: { section: string }) {
  const [open, setOpen] = useState(false);
  const tour = useTour();
  const router = useRouter();
  const page = t.help.pages[section as Section] ?? t.help.pages.overview;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="ml-icon ml-help-trigger"
        aria-label={t.help.button}
        data-tour="help"
      >
        <CircleHelp size={20} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="ml-backdrop" />
        <Dialog.Popup className="ml-help-panel">
          <Dialog.Close className="ml-drawer-close" aria-label={t.help.close}>
            <X size={20} />
          </Dialog.Close>
          <p className="ml-eyebrow">{t.help.title}</p>
          <Dialog.Title>{page.title}</Dialog.Title>
          <p>{page.intro}</p>
          <ul>
            {page.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <button
            className="ml-button"
            onClick={() => {
              setOpen(false);
              startTour(section, router.push);
            }}
          >
            <Compass size={17} aria-hidden />
            {t.help.startTour}
          </button>
          <label className="ml-check">
            <input
              type="checkbox"
              checked={tour.auto}
              onChange={(e) => write({ auto: e.target.checked })}
            />
            {t.help.autoTour}
          </label>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Invitation on the overview until the tour is done or declined. */
export function TourInvite() {
  const tour = useTour();
  if (!tour.auto || tour.done || tour.active) return null;
  return (
    <aside className="ml-tour-invite" aria-label={t.tour.label}>
      <p>
        <Compass size={18} aria-hidden />
        {t.tour.invite}
      </p>
      <div className="ml-actions">
        <button
          className="ml-button secondary"
          onClick={() => write({ auto: false })}
        >
          {t.tour.later}
        </button>
        <button
          className="ml-button"
          onClick={() => write({ active: true, step: 0 })}
        >
          {t.tour.start}
        </button>
      </div>
    </aside>
  );
}

/** Step card anchored to the highlighted element; navigates between pages. */
export function Tour({ section }: { section: string }) {
  const tour = useTour();
  const router = useRouter();
  const card = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const index = Math.min(tour.step, steps.length - 1);
  const step = steps[index];
  const here = tour.active && step.section === section;
  useEffect(() => {
    if (!here) return;
    let target: HTMLElement | null = null;
    let tries = 0;
    const place = () => setRect(target ? target.getBoundingClientRect() : null);
    const find = window.setInterval(() => {
      target = step.target
        ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
        : null;
      if (target || ++tries > 25 || !step.target) {
        window.clearInterval(find);
        if (target) {
          target.classList.add("ml-tour-target");
          target.scrollIntoView({ block: "center" });
        }
        place();
        card.current?.querySelector("h2")?.focus();
      }
    }, 200);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.clearInterval(find);
      target?.classList.remove("ml-tour-target");
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      setRect(null);
    };
  }, [here, step.target, index]);
  useEffect(() => {
    if (!tour.active) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") write({ active: false });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [tour.active]);
  if (!tour.active) return null;
  const go = (next: number) => {
    if (next >= steps.length)
      return write({ active: false, done: true, step: 0 });
    write({ step: next });
    if (steps[next].section !== section)
      router.push(`/matchlab/${steps[next].section}`);
  };
  // Below the element when it fits, otherwise above; centred without a target.
  const style: React.CSSProperties = rect
    ? rect.bottom + 240 < window.innerHeight
      ? {
          top: rect.bottom + 16,
          left: Math.max(16, Math.min(rect.left, window.innerWidth - 376)),
        }
      : {
          top: Math.max(16, rect.top - 236),
          left: Math.max(16, Math.min(rect.left, window.innerWidth - 376)),
        }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  return (
    <div
      ref={card}
      className="ml-tour-card"
      role="dialog"
      aria-label={t.tour.label}
      style={style}
    >
      <small>
        {t.tour.step} {index + 1} {t.tour.of} {steps.length}
      </small>
      <h2 tabIndex={-1}>{step.title}</h2>
      <p>{step.text}</p>
      <div className="ml-actions">
        {index > 0 && (
          <button className="ml-button secondary" onClick={() => go(index - 1)}>
            {t.tour.previous}
          </button>
        )}
        <button
          className="ml-button"
          onClick={() => go(here ? index + 1 : index)}
        >
          {!here
            ? t.tour.resume
            : index + 1 === steps.length
              ? t.tour.finish
              : t.tour.next}
        </button>
      </div>
      <button className="ml-tour-stop" onClick={() => write({ active: false })}>
        {t.tour.stop}
      </button>
    </div>
  );
}
