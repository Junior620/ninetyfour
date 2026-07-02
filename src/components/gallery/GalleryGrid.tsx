"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [selected, setSelected] = useState<GalleryItemData | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelected(item)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-royal"
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-navy/0 transition-colors group-hover:bg-navy/40" />
            {item.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/90 text-navy">
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
          </motion.button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl border-0 p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selected?.title}</DialogTitle>
          {selected && (
            <div>
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
                <p className="font-medium text-black-premium">{selected.title}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
