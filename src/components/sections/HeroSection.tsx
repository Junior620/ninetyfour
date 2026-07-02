"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  image?: string;
  badges?: string[];
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  compact?: boolean;
  overlay?: boolean;
}

export function HeroSection({
  title,
  subtitle,
  image,
  badges,
  primaryCta,
  secondaryCta,
  compact = false,
  overlay = true,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative flex items-center overflow-hidden bg-navy",
        compact
          ? "min-h-[35vh] sm:min-h-[40vh]"
          : "min-h-[60vh] sm:min-h-[70vh] lg:min-h-[85vh]"
      )}
    >
      {image && (
        <Image
          src={image}
          alt=""
          fill
          className="object-cover object-center"
          priority
          quality={100}
          unoptimized={image.startsWith("/")}
          sizes="100vw"
        />
      )}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-navy/20 sm:from-navy/65 sm:via-navy/30 sm:to-navy/10" />
      )}
      <div className="relative z-10 container-wide section-padding w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          {badges && badges.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 sm:mb-6">
              {badges.map((badge) => (
                <Badge
                  key={badge}
                  variant="outline"
                  className="border-gold/50 bg-gold/10 text-xs text-gold sm:text-sm"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          )}
          <h1 className="text-balance text-2xl font-bold uppercase leading-tight tracking-wide text-white sm:text-3xl md:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-2xl text-base text-white/80 sm:mt-6 sm:text-lg md:text-xl">
              {subtitle}
            </p>
          )}
          {(primaryCta || secondaryCta) && (
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full justify-center bg-gold text-navy hover:bg-gold/90 sm:w-auto"
                  )}
                >
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "w-full justify-center border-white/30 text-white hover:bg-white/10 sm:w-auto"
                  )}
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
