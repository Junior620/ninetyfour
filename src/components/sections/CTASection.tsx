"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CTASectionProps {
  title: string;
  buttonLabel: string;
  href?: string;
  dark?: boolean;
}

export function CTASection({
  title,
  buttonLabel,
  href = "/rejoindre",
  dark = true,
}: CTASectionProps) {
  return (
    <ScrollReveal
      as="section"
      variant="fade"
      className={cn("section-padding", dark ? "bg-navy" : "bg-white")}
    >
      <div className="container-narrow text-center">
        <h2
          className={cn(
            "text-2xl font-bold uppercase tracking-wide md:text-4xl",
            dark ? "text-white" : "text-black-premium"
          )}
        >
          {title}
        </h2>
        <Link
          href={href}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 bg-gold text-navy transition-transform hover:bg-gold/90 hover:-translate-y-0.5"
          )}
        >
          {buttonLabel}
        </Link>
      </div>
    </ScrollReveal>
  );
}
