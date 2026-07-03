"use client";

import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Partner } from "@/types";

interface PartnersMarqueeProps {
  partners: Partner[];
  title: string;
  subtitle: string;
  ctaLabel: string;
}

export function PartnersMarquee({
  partners,
  title,
  subtitle,
  ctaLabel,
}: PartnersMarqueeProps) {
  const items = [...partners, ...partners, ...partners, ...partners];

  return (
    <section className="border-b border-border bg-cream py-10 sm:py-14">
      <div className="container-wide px-4 md:px-8 lg:px-16">
        <div className="mb-6 text-center sm:mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold sm:text-[0.85rem] sm:tracking-[0.22em]">
            {title}
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted sm:text-base">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="partners-marquee relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-cream to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-cream to-transparent sm:w-20" />

        <div className="partners-marquee-track flex w-max items-center gap-10 py-2 sm:gap-16 md:gap-20">
          {items.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="flex shrink-0 items-center justify-center"
            >
              {partner.logo ? (
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={320}
                  height={120}
                  className="h-14 w-auto max-h-14 object-contain opacity-90 drop-shadow-[0_8px_16px_rgba(7,20,38,0.18)] transition-all duration-300 hover:opacity-100 hover:drop-shadow-[0_10px_20px_rgba(7,20,38,0.28)] sm:h-20 sm:max-h-20 md:h-24 md:max-h-24"
                  unoptimized
                />
              ) : (
                <span className="text-sm font-bold uppercase tracking-[0.18em] text-navy/50">
                  {partner.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 px-4 text-center sm:mt-10">
        <Link
          href="/partenaires"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 w-full border-navy/20 text-navy hover:border-navy hover:bg-navy hover:text-white sm:w-auto"
          )}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
