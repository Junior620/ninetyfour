"use client";

import { Link } from "@/lib/i18n/navigation";
import { AmbassadorCard } from "@/components/cards/AmbassadorCard";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Ambassador } from "@/types";

interface AmbassadorsSectionProps {
  ambassadors: Ambassador[];
  title: string;
  subtitle?: string;
  locale: "fr" | "en";
  limit?: number;
  showCta?: boolean;
  ctaLabel?: string;
  className?: string;
  background?: "white" | "cream";
}

function localized(
  value: { fr: string; en: string },
  locale: "fr" | "en"
): string {
  return value[locale];
}

export function AmbassadorsSection({
  ambassadors,
  title,
  subtitle,
  locale,
  limit,
  showCta = false,
  ctaLabel,
  className,
  background = "white",
}: AmbassadorsSectionProps) {
  const items = limit ? ambassadors.slice(0, limit) : ambassadors;

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
          {items.map((ambassador, i) => (
            <AmbassadorCard
              key={ambassador.id}
              name={ambassador.name}
              role={localized(ambassador.role, locale)}
              description={localized(ambassador.description, locale)}
              photo={ambassador.photo}
              index={i}
            />
          ))}
        </div>
        {showCta && ctaLabel && (
          <div className="mt-8 text-center md:mt-10">
            <Link
              href="/parrains"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 w-full border-navy text-navy hover:bg-navy hover:text-white sm:w-auto"
              )}
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
