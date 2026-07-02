"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mobileNavLinks } from "@/lib/nav-config";
import { AcademyLogo } from "./AcademyLogo";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-navy xl:hidden"
        >
          <div className="flex h-full flex-col overscroll-contain">
            <div className="flex items-center justify-between gap-3 p-4">
              <AcademyLogo variant="sidebar" className="brightness-0 invert" />
              <button
                onClick={onClose}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-white"
                aria-label="Fermer le menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-2">
              {mobileNavLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex min-h-12 items-center border-b border-white/10 py-3 text-base font-medium uppercase tracking-wide transition-colors",
                      pathname === link.href
                        ? "text-gold"
                        : "text-white/80 hover:text-white"
                    )}
                  >
                    {t(link.key)}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="space-y-3 border-t border-white/10 p-4 pb-6">
              <div className="flex justify-center gap-2">
                <Link
                  href={pathname}
                  locale="fr"
                  onClick={onClose}
                  className={cn(
                    "flex min-h-11 min-w-[3.5rem] items-center justify-center rounded-md px-4 text-sm font-semibold",
                    locale === "fr" ? "bg-gold text-navy" : "text-white/70"
                  )}
                >
                  FR
                </Link>
                <Link
                  href={pathname}
                  locale="en"
                  onClick={onClose}
                  className={cn(
                    "flex min-h-11 min-w-[3.5rem] items-center justify-center rounded-md px-4 text-sm font-semibold",
                    locale === "en" ? "bg-gold text-navy" : "text-white/70"
                  )}
                >
                  EN
                </Link>
              </div>
              <Link
                href="/rejoindre"
                onClick={onClose}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full justify-center bg-gold text-navy hover:bg-gold/90"
                )}
              >
                {t("join")}
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full justify-center border-white/30 text-white hover:bg-white/10"
                )}
              >
                {t("privateSpace")}
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
