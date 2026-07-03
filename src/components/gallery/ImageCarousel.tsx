"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselItem {
  id: string;
  title: string;
  image: string;
}

interface ImageCarouselProps {
  items: CarouselItem[];
  autoplay?: boolean;
  intervalMs?: number;
  className?: string;
  onItemClick?: (item: CarouselItem, index: number) => void;
}

export function ImageCarousel({
  items,
  autoplay = true,
  intervalMs = 5000,
  className,
  onItemClick,
}: ImageCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(0);

  const count = items.length;

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (count === 0) return;
      setDirection(dir);
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);

  useEffect(() => {
    if (!autoplay || paused || prefersReducedMotion || count <= 1) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [autoplay, paused, prefersReducedMotion, count, intervalMs]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
  }

  if (count === 0) return null;

  const current = items[index];
  const slideVariants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl bg-navy", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.button
            key={current.id}
            type="button"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            drag={prefersReducedMotion ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={onDragEnd}
            onClick={() => onItemClick?.(current, index)}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            aria-label={current.title}
          >
            <Image
              src={current.image}
              alt={current.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <p className="text-left text-sm font-medium text-white sm:text-base">
                {current.title}
              </p>
            </div>
          </motion.button>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/70 text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Image précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/70 text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Image suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i, i > index ? 1 : -1)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-gold" : "w-2 bg-white/50 hover:bg-white/80"
                )}
                aria-label={`Aller à l'image ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
