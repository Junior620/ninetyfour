"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

interface NavHoverMenuProps {
  label: string;
  active?: boolean;
  items: {
    href: string;
    label: string;
    isActive: boolean;
  }[];
}

export function NavHoverMenu({ label, active, items }: NavHoverMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function handleLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "group relative inline-flex items-center gap-0.5 whitespace-nowrap px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:text-navy lg:text-xs after:absolute after:bottom-0.5 after:left-2.5 after:right-2.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100",
          active || open
            ? "text-royal after:scale-x-100"
            : "text-text-muted"
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3 w-3 opacity-60 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "absolute top-full left-1/2 z-50 -translate-x-1/2 pt-2 transition-all duration-150",
          open
            ? "pointer-events-auto visible translate-y-0 opacity-100"
            : "pointer-events-none invisible -translate-y-1 opacity-0"
        )}
      >
        <div className="min-w-[200px] overflow-hidden rounded-lg border border-black/[0.06] bg-white p-1.5 shadow-xl ring-1 ring-black/[0.04]">
          {items.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-cream hover:text-royal",
                child.isActive ? "bg-cream text-royal" : "text-foreground"
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
