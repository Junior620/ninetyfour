"use client";

import { Quote } from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { cn } from "@/lib/utils";

interface QuoteSectionProps {
  quote: string;
  dark?: boolean;
}

export function QuoteSection({ quote, dark = true }: QuoteSectionProps) {
  return (
    <ScrollReveal
      as="section"
      variant="fadeUp"
      className={cn("section-padding", dark ? "bg-navy-light" : "bg-white")}
    >
      <div className="container-narrow text-center">
        <Quote className="mx-auto mb-6 h-10 w-10 text-gold" />
        <blockquote
          className={cn(
            "text-xl font-medium italic md:text-2xl lg:text-3xl",
            dark ? "text-white" : "text-black-premium"
          )}
        >
          &ldquo;{quote}&rdquo;
        </blockquote>
      </div>
    </ScrollReveal>
  );
}
