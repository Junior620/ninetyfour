"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  image?: string;
  images?: string[];
  badges?: string[];
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  compact?: boolean;
  overlay?: boolean;
  autoplayMs?: number;
}

export function HeroSection({
  title,
  subtitle,
  image,
  images,
  badges,
  primaryCta,
  secondaryCta,
  compact = false,
  overlay = true,
  autoplayMs = 5000,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const slides = images?.length ? images : image ? [image] : [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ["0%", "0%"] : ["0%", "12%"]
  );

  useEffect(() => {
    if (slides.length <= 1 || paused || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [slides.length, paused, prefersReducedMotion, autoplayMs]);

  function goTo(next: number) {
    if (slides.length <= 1) return;
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }

  function onTouchStart(event: React.TouchEvent<HTMLElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setPaused(true);
  }

  function onTouchEnd(event: React.TouchEvent<HTMLElement>) {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    setPaused(false);

    if (startX == null || endX == null || slides.length <= 1) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 50) return;

    if (deltaX < 0) goTo(index + 1);
    else goTo(index - 1);
  }

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative flex items-center overflow-hidden bg-navy",
        compact
          ? "min-h-[38vh] sm:min-h-[40vh]"
          : "min-h-[68vh] sm:min-h-[72vh] lg:min-h-[82vh]"
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.length > 0 && (
        <motion.div className="absolute inset-0" style={{ y: imageY }}>
          <AnimatePresence mode="sync">
            <motion.div
              key={slides[index]}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={slides[index]}
                alt=""
                fill
                className="object-cover object-[center_30%] scale-110 sm:object-center"
                priority={index === 0}
                quality={100}
                unoptimized={slides[index].startsWith("/")}
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {overlay && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(7, 20, 38, 0.85) 0%, rgba(7, 20, 38, 0.55) 45%, rgba(7, 20, 38, 0.15) 100%)",
          }}
        />
      )}

      {/* Mobile: reinforce bottom readability without hiding players */}
      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent sm:hidden" />
      )}

      <div
        className={cn(
          "relative z-10 container-wide section-padding w-full",
          slides.length > 1 && "pb-16 sm:pb-20"
        )}
      >
        <div className="max-w-[900px]">
          {badges && badges.length > 0 && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="mb-6 flex flex-wrap gap-2.5 sm:mb-8 sm:gap-3"
            >
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full border border-gold/40 bg-navy/40 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-gold backdrop-blur-sm sm:px-4 sm:text-xs"
                >
                  {badge}
                </span>
              ))}
            </motion.div>
          )}
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="max-w-[900px] text-balance text-[1.75rem] font-bold uppercase leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[3.75rem]"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="mt-5 max-w-xl text-sm leading-relaxed text-white/85 sm:mt-7 sm:text-base md:text-lg"
            >
              {subtitle}
            </motion.p>
          )}
          {(primaryCta || secondaryCta) && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.32 }}
              className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4"
            >
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "min-h-11 w-full justify-center bg-gold text-navy hover:bg-gold/90 sm:w-auto"
                  )}
                >
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "min-h-11 w-full justify-center border border-white bg-transparent text-white hover:bg-white hover:text-navy sm:w-auto"
                  )}
                >
                  {secondaryCta.label}
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 sm:bottom-6 sm:gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide}
              type="button"
              onClick={() => goTo(i)}
              className="flex min-h-11 min-w-11 items-center justify-center"
              aria-label={`Image ${i + 1}`}
              aria-current={i === index}
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-gold" : "w-1.5 bg-white/50"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
