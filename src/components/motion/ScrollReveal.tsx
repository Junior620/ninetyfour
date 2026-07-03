"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type RevealVariant =
  | "fadeUp"
  | "fadeRight"
  | "fadeLeft"
  | "fade"
  | "scaleIn";

const variants: Record<
  RevealVariant,
  { hidden: Record<string, number>; visible: Record<string, number> }
> = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
};

interface ScrollRevealProps {
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  as?: "div" | "section";
  children: React.ReactNode;
  className?: string;
}

export function ScrollReveal({
  variant = "fadeUp",
  delay = 0,
  duration = 0.5,
  as = "div",
  children,
  className,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const preset = variants[variant];

  if (prefersReducedMotion) {
    if (as === "section") {
      return <section className={className}>{children}</section>;
    }
    return <div className={className}>{children}</div>;
  }

  const motionProps = {
    initial: "hidden" as const,
    whileInView: "visible" as const,
    viewport: { once: true, amount: 0.2 },
    variants: preset,
    transition: { duration, delay, ease: [0.25, 0.1, 0.25, 1] as const },
    className: cn(className),
  };

  if (as === "section") {
    return <motion.section {...motionProps}>{children}</motion.section>;
  }

  return <motion.div {...motionProps}>{children}</motion.div>;
}
