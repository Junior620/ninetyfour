"use client";

import { motion } from "framer-motion";
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
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={cn(
        "section-padding",
        dark ? "bg-navy" : "bg-white"
      )}
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
            "mt-8 bg-gold text-navy hover:bg-gold/90"
          )}
        >
          {buttonLabel}
        </Link>
      </div>
    </motion.section>
  );
}
