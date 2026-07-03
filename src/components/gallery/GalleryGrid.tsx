"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

interface GalleryItemData {
  id: string;
  title: string;
  image: string;
  category: string;
  type: "image" | "video";
  videoUrl?: string;
}

interface GalleryGridProps {
  items: GalleryItemData[];
  categoryLabels?: Record<string, string>;
}

export function GalleryGrid({ items, categoryLabels }: GalleryGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = selectedIndex !== null ? items[selectedIndex] : null;

  const close = useCallback(() => setSelectedIndex(null), []);

  const goPrev = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || items.length === 0) return current;
      return (current - 1 + items.length) % items.length;
    });
  }, [items.length]);

  const goNext = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || items.length === 0) return current;
      return (current + 1) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    if (selectedIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, goPrev, goNext]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <ScrollReveal key={item.id} variant="scaleIn" delay={index * 0.05}>
            <button
              type="button"
              onClick={() => setSelectedIndex(index)}
              className="hover-zoom group relative aspect-[4/3] w-full overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-royal"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/40" />
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/90 text-navy transition-transform duration-300 group-hover:scale-110">
                    <Play className="h-6 w-6 fill-current" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy/80 to-transparent p-4">
                <p className="text-left text-sm font-medium text-white">
                  {item.title}
                </p>
                {categoryLabels && (
                  <Badge
                    variant="secondary"
                    className="mt-1 bg-gold/20 text-gold text-xs"
                  >
                    {categoryLabels[item.category] ?? item.category}
                  </Badge>
                )}
              </div>
            </button>
          </ScrollReveal>
        ))}
      </div>

      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className="max-w-4xl overflow-hidden border-0 p-0">
          <DialogTitle className="sr-only">{selected?.title}</DialogTitle>
          {selected && (
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.id}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {selected.type === "video" && selected.videoUrl ? (
                    <div className="aspect-video">
                      <iframe
                        src={selected.videoUrl}
                        title={selected.title}
                        className="h-full w-full"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={selected.image}
                        alt={selected.title}
                        fill
                        className="object-cover"
                        sizes="90vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-medium text-black-premium">
                      {selected.title}
                    </p>
                    {items.length > 1 && (
                      <p className="mt-1 text-xs text-text-muted">
                        {(selectedIndex ?? 0) + 1} / {items.length}
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/80 text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-2 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy/80 text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
