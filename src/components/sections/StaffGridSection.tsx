"use client";

import { StaffCard } from "@/components/cards/StaffCard";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { cn } from "@/lib/utils";
import type { StaffMember } from "@/types";

interface StaffGridSectionProps {
  members: StaffMember[];
  title: string;
  subtitle?: string;
  locale: "fr" | "en";
  className?: string;
  background?: "white" | "cream";
}

function localized(
  value: { fr: string; en: string },
  locale: "fr" | "en"
): string {
  return value[locale];
}

export function StaffGridSection({
  members,
  title,
  subtitle,
  locale,
  className,
  background = "white",
}: StaffGridSectionProps) {
  return (
    <section
      className={cn(
        "section-padding",
        background === "cream" ? "bg-cream" : "bg-white",
        className
      )}
    >
      <div className="container-wide">
        <SectionTitle title={title} subtitle={subtitle} />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8 lg:grid-cols-4">
          {members.map((member, i) => (
            <StaffCard
              key={member.id}
              name={member.name}
              role={localized(member.role, locale)}
              bio={localized(member.bio, locale)}
              photo={member.photo}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
