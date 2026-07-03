"use client";

import Image from "next/image";
import {
  Star,
  GraduationCap,
  TrendingUp,
  Crown,
  Dumbbell,
  BookOpen,
  Cpu,
  Heart,
  Award,
  Target,
  Handshake,
  Rocket,
  Leaf,
  Users,
  Eye,
  UserCheck,
  Globe,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Star,
  GraduationCap,
  TrendingUp,
  Crown,
  Dumbbell,
  BookOpen,
  Cpu,
  Heart,
  Award,
  Target,
  Handshake,
  Rocket,
  Leaf,
  Users,
  Eye,
  UserCheck,
  Globe,
};

interface StatCardProps {
  value: string;
  label: string;
  className?: string;
  index?: number;
}

export function StatCard({ value, label, className, index = 0 }: StatCardProps) {
  return (
    <ScrollReveal
      variant="fadeUp"
      delay={index * 0.08}
      className={cn("text-center", className)}
    >
      <div className="text-2xl font-bold text-gold sm:text-3xl md:text-5xl">{value}</div>
      <div className="mt-2 text-balance text-xs uppercase tracking-wider text-text-muted sm:text-sm">
        {label}
      </div>
    </ScrollReveal>
  );
}

interface PillarCardProps {
  title: string;
  description: string;
  icon?: string;
  index?: number;
  dark?: boolean;
  tag?: string;
  href?: string;
  cta?: string;
  numbered?: boolean;
  image?: string;
}

export function PillarCard({
  title,
  description,
  icon = "Star",
  index = 0,
  dark = false,
  tag,
  href,
  cta,
  numbered = false,
  image,
}: PillarCardProps) {
  const Icon = iconMap[icon] ?? Star;
  const number = String(index + 1).padStart(2, "0");
  const hasHoverImage = Boolean(image);

  const content = (
    <Card
      className={cn(
        "group relative h-full overflow-hidden border border-transparent shadow-sm transition-all duration-300",
        dark
          ? "bg-navy-light text-white hover:border-gold/40 hover:-translate-y-2 hover:shadow-xl"
          : "bg-white hover:border-gold/50 hover:-translate-y-2 hover:shadow-xl"
      )}
    >
      {image && (
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover opacity-45 scale-100 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 sm:opacity-0 sm:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized
        />
      )}
      {hasHoverImage && (
        <div className="absolute inset-0 bg-white/75 transition-colors duration-500 group-hover:bg-navy/75 sm:bg-white" />
      )}
      <CardContent className="relative z-10 flex h-full flex-col p-5 sm:p-6">
        <div
          className={cn(
            "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(201,154,46,0.12)] transition-all duration-300 group-hover:scale-105 sm:h-16 sm:w-16",
            hasHoverImage && "group-hover:bg-gold/20"
          )}
        >
          <Icon className="h-7 w-7 text-gold sm:h-8 sm:w-8" />
        </div>
        {numbered && (
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-gold">
            {number}
          </p>
        )}
        <h3
          className={cn(
            "text-lg font-bold uppercase tracking-wide transition-colors duration-300",
            dark ? "text-white" : "text-black-premium",
            hasHoverImage && "group-hover:text-white"
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mt-3 flex-1 text-sm leading-relaxed transition-colors duration-300",
            dark ? "text-white/70" : "text-text-muted",
            hasHoverImage && "group-hover:text-white/85"
          )}
        >
          {description}
        </p>
        {(tag || (href && cta)) && (
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-gold/20 pt-4">
            {tag && (
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                {tag}
              </span>
            )}
            {href && cta && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold transition-colors",
                  dark
                    ? "text-white/70 group-hover:text-gold"
                    : "text-navy/60 group-hover:text-royal",
                  hasHoverImage && "group-hover:text-white"
                )}
              >
                {cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ScrollReveal variant="fadeUp" delay={index * 0.08} className="h-full">
      {href ? (
        <Link href={href} className="block h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </ScrollReveal>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
}

export function MetricCard({ label, value, trend }: MetricCardProps) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-text-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold text-black-premium">{value}</p>
        {trend && (
          <p className="mt-1 text-xs font-medium text-gold">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}
