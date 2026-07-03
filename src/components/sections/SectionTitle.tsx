"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}

export function SectionTitle({
  title,
  subtitle,
  align = "center",
  light = false,
  className,
}: SectionTitleProps) {
  return (
    <ScrollReveal
      variant="fadeUp"
      className={cn(
        "mb-6 md:mb-12",
        align === "center" && "text-center",
        className
      )}
    >
      <h2
        className={cn(
          "text-xl font-bold uppercase tracking-wide sm:text-2xl md:text-4xl",
          light ? "text-white" : "text-black-premium"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-3 max-w-2xl text-base sm:mt-4 sm:text-lg",
            align === "center" && "mx-auto",
            light ? "text-white/70" : "text-text-muted"
          )}
        >
          {subtitle}
        </p>
      )}
      <div
        className={cn(
          "mt-4 h-1 w-16 bg-gold",
          align === "center" && "mx-auto"
        )}
      />
    </ScrollReveal>
  );
}
