"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { cn } from "@/lib/utils";

interface ProgramStep {
  title: string;
  description: string;
  details: string;
}

interface ProgramTimelineProps {
  steps: ProgramStep[];
}

export function ProgramTimeline({ steps }: ProgramTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gold/30 md:hidden" />
      <div className="absolute left-4 top-0 hidden h-full w-0.5 bg-gold/30 md:left-1/2 md:block md:-translate-x-px" />

      <div className="space-y-8 md:space-y-12">
        {steps.map((step, index) => (
          <ScrollReveal
            key={step.title}
            variant={index % 2 === 0 ? "fadeRight" : "fadeLeft"}
            delay={index * 0.08}
            className={cn(
              "relative pl-8 md:pl-0 md:flex md:items-center",
              index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            )}
          >
            <div className="hidden md:block md:w-1/2" />

            <div className="absolute left-0 top-6 h-3.5 w-3.5 rounded-full border-[3px] border-gold bg-navy md:hidden" />
            <div className="absolute left-4 top-1/2 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-gold bg-navy md:left-1/2 md:block" />

            <div
              className={cn(
                "md:w-1/2",
                index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
              )}
            >
              <div className="hover-lift rounded-lg bg-white p-5 shadow-sm sm:p-6">
                <span className="text-sm font-bold text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 text-base font-bold uppercase text-black-premium sm:text-lg">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm font-medium text-royal">
                  {step.description}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {step.details}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
