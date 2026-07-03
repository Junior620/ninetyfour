"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

interface ExploreCardProps {
  title: string;
  description: string;
  href: string;
  image: string;
  cta: string;
  index?: number;
}

export function ExploreCard({
  title,
  description,
  href,
  image,
  cta,
  index = 0,
}: ExploreCardProps) {
  return (
    <ScrollReveal variant="fadeUp" delay={index * 0.08} className="h-full">
      <Link
        href={href}
        className="hover-zoom group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl sm:aspect-[3/4]"
      >
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-navy/10 transition-colors duration-300 group-hover:from-navy/95" />
        <div className="relative z-10 p-5 sm:p-6">
          <h3 className="text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-white/75">
            {description}
          </p>
          <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gold">
            {cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </ScrollReveal>
  );
}
