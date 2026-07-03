"use client";

import Image from "next/image";
import {
  Users,
  Landmark,
  Timer,
  Handshake,
  UserCheck,
  BarChart3,
  Target,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Landmark,
  Timer,
  Handshake,
  UserCheck,
  BarChart3,
  Target,
  MapPin,
};

export interface StatItem {
  value: string;
  label: string;
  icon: string;
  note?: string;
  tag?: string;
  featured?: boolean;
  image?: string;
}

interface StatsSectionProps {
  sectionTitle: string;
  title: string;
  subtitle: string;
  stats: StatItem[];
  image: string;
}

export function StatsSection({
  sectionTitle,
  title,
  subtitle,
  stats,
  image,
}: StatsSectionProps) {
  const featured = stats.filter((stat) => stat.featured);
  const secondary = stats.filter((stat) => !stat.featured);

  return (
    <section className="overflow-hidden bg-cream">
      <div className="grid lg:grid-cols-2">
        <div className="flex flex-col justify-center px-4 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16">
          <ScrollReveal variant="fadeUp">
            <p className="text-[0.85rem] font-bold uppercase tracking-[0.22em] text-gold">
              {sectionTitle}
            </p>
            <h2 className="mt-3 max-w-xl text-balance text-2xl font-bold leading-tight text-navy sm:mt-4 sm:text-3xl md:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted sm:mt-4 sm:text-base">
              {subtitle}
            </p>
            <div className="mt-4 h-1 w-16 bg-gold" />
          </ScrollReveal>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
            {featured.map((stat, index) => (
              <StatCardItem key={`${stat.value}-${stat.label}`} stat={stat} index={index} />
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-3">
            {secondary.map((stat, index) => (
              <StatCardItem
                key={`${stat.value}-${stat.label}`}
                stat={stat}
                index={index + featured.length}
                compact
              />
            ))}
          </div>
        </div>

        <div className="relative order-last min-h-[260px] sm:min-h-[340px] lg:order-none lg:min-h-full">
          <div className="absolute inset-0 overflow-hidden border-gold/25 lg:border-l-2 lg:[clip-path:polygon(6%_0,100%_0,100%_100%,0_100%)]">
            <Image
              src={image}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized={image.startsWith("/")}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(7, 20, 38, 0.2) 0%, rgba(7, 20, 38, 0.08) 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCardItem({
  stat,
  index,
  compact = false,
}: {
  stat: StatItem;
  index: number;
  compact?: boolean;
}) {
  const Icon = iconMap[stat.icon] ?? Target;
  const hasImage = Boolean(stat.image);

  return (
    <ScrollReveal variant="fadeUp" delay={index * 0.05}>
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300",
          "hover:-translate-y-1 hover:border-gold/60 hover:shadow-md",
          compact
            ? "border-gold/30 px-3.5 py-3.5 sm:px-4 sm:py-4"
            : "border-gold/45 px-4 py-4 sm:px-5 sm:py-5"
        )}
      >
        {stat.image && (
          <Image
            src={stat.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 25vw"
            unoptimized
          />
        )}
        <div
          className={cn(
            "absolute inset-0",
            hasImage
              ? "bg-gradient-to-t from-navy/90 via-navy/75 to-navy/55"
              : "bg-white"
          )}
        />

        <div className="relative z-10 flex h-full flex-col">
          <div
            className={cn(
              "mb-3 flex items-center justify-center rounded-xl bg-[rgba(201,154,46,0.18)]",
              compact ? "h-9 w-9" : "h-10 w-10"
            )}
          >
            <Icon
              className={cn("text-gold", compact ? "h-4 w-4" : "h-5 w-5")}
            />
          </div>
          <p
            className={cn(
              "font-bold uppercase tracking-wide text-gold",
              compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"
            )}
          >
            {stat.value}
          </p>
          <p
            className={cn(
              "mt-1 font-medium text-white",
              compact ? "text-xs sm:text-sm" : "text-sm"
            )}
          >
            {stat.label}
          </p>
          {stat.note && (
            <p className="mt-1.5 text-xs font-semibold text-gold">{stat.note}</p>
          )}
          {stat.tag && (
            <div className="mt-3 border-t border-white/15 pt-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gold/90">
                {stat.tag}
              </span>
            </div>
          )}
        </div>
      </div>
    </ScrollReveal>
  );
}
