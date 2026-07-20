"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowRight, CalendarDays, Clock, MapPin, X } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "nf-detection-promo-dismissed";

export type DetectionCampaign = {
  id: string;
  image: string;
  zone: string;
  dates: string;
  place: string;
  time: string;
  schedule: string[];
  closesAt: string;
};

type CountdownParts = {
  days: number;
  hours: number;
  mins: number;
  live: boolean;
};

function getCountdown(closesAt: string, now: number): CountdownParts {
  const target = new Date(closesAt).getTime();
  const diff = target - now;
  if (!Number.isFinite(target) || diff <= 0) {
    return { days: 0, hours: 0, mins: 0, live: true };
  }
  const totalMins = Math.floor(diff / 60_000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;
  return { days, hours, mins, live: false };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const DUST = [
  { left: "12%", top: "22%", size: 2, delay: 0, duration: 9 },
  { left: "28%", top: "48%", size: 1.5, delay: 1.2, duration: 10 },
  { left: "55%", top: "18%", size: 2, delay: 0.6, duration: 8.5 },
  { left: "72%", top: "55%", size: 1.5, delay: 2, duration: 11 },
  { left: "40%", top: "70%", size: 2, delay: 1.5, duration: 9.5 },
  { left: "85%", top: "30%", size: 1.5, delay: 0.3, duration: 10 },
] as const;

type RecruitmentPromoBannerProps = {
  eyebrowOpen: string;
  headline: string;
  tagline: string;
  ctaLabel: string;
  ctaHint: string;
  helpLink: string;
  closeLabel: string;
  phones: string;
  campaigns: DetectionCampaign[];
  autoplayMs?: number;
  delayMs?: number;
};

export function RecruitmentPromoBanner({
  eyebrowOpen,
  headline,
  tagline,
  ctaLabel,
  ctaHint,
  helpLink,
  closeLabel,
  phones,
  campaigns,
  autoplayMs = 7000,
  delayMs = 700,
}: RecruitmentPromoBannerProps) {
  const t = useTranslations("home");
  const titleId = useId();
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const current = campaigns[index] ?? campaigns[0];

  const countdown = useMemo(
    () => (current ? getCountdown(current.closesAt, now) : null),
    [current, now]
  );

  const countdownLabel = useMemo(() => {
    if (!countdown) return "";
    if (countdown.live) return t("promo.countdownLive");
    return t("promo.countdown", {
      days: pad(countdown.days),
      hours: pad(countdown.hours),
      mins: pad(countdown.mins),
    });
  }, [countdown, t]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // ignore
    }
    const id = window.setTimeout(() => setOpen(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || campaigns.length <= 1 || paused || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % campaigns.length);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [open, campaigns.length, paused, prefersReducedMotion, autoplayMs]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [open]);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  const helpTel = phones.split("/")[0]?.replace(/\s/g, "") ?? "";

  if (!current || !countdown) return null;

  const stagger: Variants | undefined = prefersReducedMotion
    ? undefined
    : {
        hidden: {},
        show: {
          transition: { staggerChildren: 0.08, delayChildren: 0.28 },
        },
      };

  const item: Variants | undefined = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
        },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.button
            type="button"
            aria-label={closeLabel}
            className="absolute inset-0 bg-navy/80 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={dismiss}
          />

          <motion.div
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 22, scale: 0.94 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? undefined
                : { opacity: 0, y: 12, scale: 0.97 }
            }
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-gold/25 bg-navy shadow-[0_25px_80px_-12px_rgba(0,0,0,0.75),0_0_60px_-20px_rgba(201,154,46,0.35)] sm:max-h-[88vh] sm:flex-row"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
              aria-label={closeLabel}
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              className="relative h-[38vh] w-full shrink-0 sm:h-[520px] sm:w-[48%] lg:-mr-6 lg:z-10"
              initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 z-0 hidden sm:block"
              >
                <motion.div
                  className="absolute inset-8 rounded-full bg-gold/20 blur-3xl"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          x: [0, 12, 0],
                          y: [0, -8, 0],
                          opacity: [0.18, 0.28, 0.18],
                        }
                  }
                  transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              <div className="absolute inset-0 overflow-hidden rounded-t-2xl sm:rounded-none sm:rounded-l-2xl">
                {campaigns.map((campaign, i) => (
                  <motion.div
                    key={campaign.id}
                    className="absolute inset-0"
                    initial={false}
                    animate={{ opacity: i === index ? 1 : 0 }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                    style={{ zIndex: i === index ? 1 : 0 }}
                  >
                    <motion.div
                      className="relative h-full w-full origin-center will-change-transform"
                      animate={
                        prefersReducedMotion || i !== index
                          ? { scale: 1 }
                          : { scale: [1, 1.025] }
                      }
                      transition={
                        prefersReducedMotion || i !== index
                          ? { duration: 0.3 }
                          : {
                              duration: 14,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut",
                            }
                      }
                    >
                      <Image
                        src={campaign.image}
                        alt={`${campaign.zone} — ${campaign.dates}`}
                        fill
                        priority={i === 0}
                        sizes="(max-width: 640px) 100vw, 440px"
                        className="object-cover object-top"
                      />
                    </motion.div>
                  </motion.div>
                ))}

                {!prefersReducedMotion &&
                  DUST.map((p, i) => (
                    <motion.span
                      key={i}
                      aria-hidden
                      className="pointer-events-none absolute z-[2] rounded-full bg-white/25"
                      style={{
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                      }}
                      animate={{
                        y: [0, -12, 0],
                        opacity: [0, 0.3, 0],
                      }}
                      transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}

                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-navy/50 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-navy/30"
                />
              </div>

              {campaigns.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                  {campaigns.map((campaign, i) => (
                    <button
                      key={campaign.id}
                      type="button"
                      aria-label={campaign.zone}
                      aria-current={i === index}
                      onClick={() => setIndex(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === index ? "w-6 bg-gold" : "w-2.5 bg-white/45"
                      )}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[#0a1c36] via-navy to-[#050d18]">
              <motion.div
                className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-3 pt-6 sm:gap-5 sm:px-8 sm:pb-4 sm:pt-8"
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={item} className="inline-flex w-fit items-center gap-2 pr-10">
                  <span className="relative flex h-2 w-2">
                    {!prefersReducedMotion && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-55 [animation-duration:2s]" />
                    )}
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={current.id}
                      initial={prefersReducedMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold"
                    >
                      {eyebrowOpen}
                      <span className="mx-1.5 text-gold/40">•</span>
                      {current.zone}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>

                <motion.div variants={item} className="space-y-2">
                  <h2
                    id={titleId}
                    className="font-heading text-[1.65rem] font-bold leading-[1.12] tracking-tight text-white sm:text-3xl"
                  >
                    {headline}
                  </h2>
                  <p className="max-w-sm text-sm leading-relaxed text-white/70 sm:text-[15px]">
                    {tagline}
                  </p>
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.ul
                    key={current.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="space-y-2.5 text-sm text-white/90"
                  >
                    <li className="flex gap-2.5 font-semibold">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {current.dates}
                    </li>
                    <li className="flex gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {current.place}
                    </li>
                    <li className="flex gap-2.5">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {current.time}
                    </li>
                    {current.schedule.map((line) => (
                      <li key={line} className="flex gap-2.5 text-white/75">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                          aria-hidden
                        />
                        {line}
                      </li>
                    ))}
                  </motion.ul>
                </AnimatePresence>

                <motion.p
                  variants={item}
                  className="rounded-lg border border-gold/20 bg-gold/10 px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-gold sm:text-[13px]"
                >
                  {countdownLabel}
                </motion.p>
              </motion.div>

              <motion.div
                className="shrink-0 space-y-2.5 border-t border-white/10 bg-navy/80 px-5 py-4 backdrop-blur-sm sm:px-8 sm:py-5"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.55,
                  type: "spring",
                  stiffness: 320,
                  damping: 22,
                }}
              >
                <Link
                  href="/rejoindre"
                  onClick={dismiss}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group relative min-h-12 w-full justify-center overflow-hidden bg-gold px-5 text-sm font-bold uppercase tracking-wide text-navy hover:bg-gold/90"
                  )}
                >
                  {!prefersReducedMotion && (
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ["-20%", "320%"] }}
                      transition={{
                        duration: 1.1,
                        repeat: Infinity,
                        repeatDelay: 3.4,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                  <span className="relative">{ctaLabel}</span>
                  <ArrowRight className="relative ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px]" />
                </Link>
                <p className="text-center text-[11px] font-medium uppercase tracking-wide text-white/45">
                  {ctaHint}
                </p>
                <a
                  href={`tel:${helpTel}`}
                  className="block text-center text-xs text-white/55 transition-colors hover:text-gold"
                >
                  {helpLink}
                </a>
                <button
                  type="button"
                  onClick={dismiss}
                  className="block w-full pt-0.5 text-center text-[11px] font-medium uppercase tracking-wide text-white/35 transition-colors hover:text-white/60"
                >
                  {closeLabel}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
