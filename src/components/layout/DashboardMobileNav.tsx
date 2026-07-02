"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Menu, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AcademyLogo } from "./AcademyLogo";
import { dashboardRoleNav } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface DashboardMobileNavProps {
  role: UserRole;
}

export function DashboardMobileNav({ role }: DashboardMobileNavProps) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const links = dashboardRoleNav[role];

  function handleLogout() {
    localStorage.removeItem("nofa_role");
    window.location.href = "/login";
  }

  return (
    <Sheet>
      <SheetTrigger
        className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-navy md:hidden"
        aria-label="Menu dashboard"
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] border-0 bg-navy p-0 text-white">
        <SheetTitle className="sr-only">Navigation dashboard</SheetTitle>
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <AcademyLogo variant="sidebar" />
        </div>
        <nav className="space-y-1 p-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href.split("#")[0];
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-gold/10 text-gold"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(link.label)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
