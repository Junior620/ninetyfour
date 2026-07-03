"use client";

import Image from "next/image";
import {
  Search,
  ClipboardCheck,
  Users,
  TrendingUp,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { cn } from "@/lib/utils";

interface ProgramStep {
  title: string;
  description: string;
  details: string;
  image?: string;
}

interface ProgramTimelineProps {
  steps: ProgramStep[];
}

const stepIcons: LucideIcon[] = [
  Search,
  ClipboardCheck,
  Users,
  TrendingUp,
  Globe,
];

export function ProgramTimeline({ steps }: ProgramTimelineProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-5">
      {steps.map((step, index) => {
        const Icon = stepIcons[index] ?? Search;
        const number = String(index + 1).padStart(2, "0");

        return (
          <ScrollReveal
            key={step.title}
            variant="fadeUp"
            delay={index * 0.08}
            className="h-full"
          >
            <article
              className={cn(
                "group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-xl border border-transparent bg-white p-5 shadow-sm transition-all duration-300 sm:min-h-[320px] sm:p-6",
                "hover:-translate-y-2 hover:border-gold/50 hover:shadow-xl"
              )}
            >
              {step.image && (
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover opacity-45 scale-100 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 sm:opacity-0 sm:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 20vw"
                  unoptimized
                />
              )}

              <div className="absolute inset-0 bg-white/75 transition-colors duration-500 group-hover:bg-navy/75 sm:bg-white" />

              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(201,154,46,0.12)] transition-all duration-300 group-hover:bg-gold/20 sm:h-16 sm:w-16">
                  <Icon className="h-7 w-7 text-gold sm:h-8 sm:w-8" />
                </div>

                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-gold">
                  {number}
                </p>

                <h3 className="text-lg font-bold uppercase tracking-wide text-black-premium transition-colors duration-300 group-hover:text-white">
                  {step.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-text-muted transition-colors duration-300 group-hover:text-white/85">
                  {step.details}
                </p>

                <div className="mt-5 border-t border-gold/20 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold transition-colors duration-300 group-hover:text-gold">
                    {step.description}
                  </span>
                </div>
              </div>
            </article>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
