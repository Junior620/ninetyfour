"use client";

import { StaffCard } from "@/components/cards/StaffCard";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { cn } from "@/lib/utils";
import type { TeamCategory } from "@/types";

interface TeamCategorySectionProps {
  category: TeamCategory;
  coachesLabel: string;
  locale: "fr" | "en";
  index?: number;
  background?: "white" | "cream";
}

function localized(
  value: { fr: string; en: string },
  locale: "fr" | "en"
): string {
  return value[locale];
}

export function TeamCategorySection({
  category,
  coachesLabel,
  locale,
  index = 0,
  background = "white",
}: TeamCategorySectionProps) {
  return (
    <section
      id={category.id}
      className={cn(
        "section-padding",
        background === "cream" ? "bg-cream" : "bg-white"
      )}
    >
      <div className="container-wide">
        <ScrollReveal variant="fadeUp" delay={index * 0.05}>
          <div className="mb-8 text-center md:mb-10">
            <span className="inline-block rounded-full bg-navy px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
              {localized(category.label, locale)}
            </span>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
              {localized(category.description, locale)}
            </p>
          </div>
        </ScrollReveal>

        <h3 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-navy">
          {coachesLabel}
        </h3>
        <div
          className={cn(
            "mx-auto grid gap-6 sm:gap-8",
            category.coaches.length === 1
              ? "max-w-xs grid-cols-1"
              : "grid-cols-2 sm:max-w-2xl sm:grid-cols-2"
          )}
        >
          {category.coaches.map((coach, i) => (
            <StaffCard
              key={coach.id}
              name={coach.name}
              role={localized(coach.role, locale)}
              bio={localized(coach.bio, locale)}
              photo={coach.photo}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
