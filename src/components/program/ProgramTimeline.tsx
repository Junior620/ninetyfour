"use client";

import { motion } from "framer-motion";
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
      <div className="absolute left-4 top-0 hidden h-full w-0.5 bg-gold/30 md:left-1/2 md:block md:-translate-x-px" />
      <div className="space-y-12">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative md:flex md:items-center",
              index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            )}
          >
            <div className="hidden md:block md:w-1/2" />
            <div className="absolute left-4 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-gold bg-navy md:left-1/2 md:block" />
            <div
              className={cn(
                "md:w-1/2",
                index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
              )}
            >
              <div className="ml-10 rounded-lg bg-white p-6 shadow-sm md:ml-0">
                <span className="text-sm font-bold text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 text-lg font-bold uppercase text-black-premium">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm font-medium text-royal">
                  {step.description}
                </p>
                <p className="mt-3 text-sm text-text-muted">{step.details}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
