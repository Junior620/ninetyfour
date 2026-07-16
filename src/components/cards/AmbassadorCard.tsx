"use client";

import Image from "next/image";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { cn } from "@/lib/utils";

interface AmbassadorCardProps {
  name: string;
  role: string;
  description: string;
  photo: string;
  index?: number;
  className?: string;
}

export function AmbassadorCard({
  name,
  role,
  description,
  photo,
  index = 0,
  className,
}: AmbassadorCardProps) {
  return (
    <ScrollReveal
      variant="fadeUp"
      delay={index * 0.08}
      className={cn("group text-center", className)}
    >
      <article className="hover-lift flex flex-col items-center rounded-2xl p-4 sm:p-6">
        <div className="relative mb-4 h-28 w-28 shrink-0 overflow-hidden rounded-full shadow-lg ring-2 ring-gold/30 transition-shadow duration-300 group-hover:shadow-xl group-hover:ring-gold/50 sm:mb-5 sm:h-36 sm:w-36">
          <Image
            src={photo}
            alt={name}
            fill
            sizes="(max-width: 640px) 112px, 144px"
            className="object-cover"
          />
        </div>
        <h3 className="text-base font-bold text-navy sm:text-lg">{name}</h3>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gold sm:text-xs">
          {role}
        </p>
        <p className="mt-3 line-clamp-3 max-w-[16rem] text-sm leading-relaxed text-text-muted">
          {description}
        </p>
      </article>
    </ScrollReveal>
  );
}
