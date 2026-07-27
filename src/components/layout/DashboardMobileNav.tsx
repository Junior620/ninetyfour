"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { Menu, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AcademyLogo } from "./AcademyLogo";
import { dashboardRoleNav, isNavActive } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { logoutClient } from "@/lib/auth/session";
import type { UserRole } from "@/types";

interface DashboardMobileNavProps {
  role: UserRole;
}

export function DashboardMobileNav({ role }: DashboardMobileNavProps) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const router = useRouter();
  const links = dashboardRoleNav[role];

  async function handleLogout() {
    await logoutClient();
    router.replace("/login");
  }

  return (
    <Sheet>
      <SheetTrigger
        className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-navy md:hidden"
        aria-label="Menu dashboard"
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[280px] flex-col border-0 bg-navy p-0 text-white">
        <SheetTitle className="sr-only">Navigation dashboard</SheetTitle>
        <div className="border-b border-white/10 px-5 py-4">
          <AcademyLogo variant="sidebar" />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80">
            {role === "admin" ? t("admin.portal") : t("portal")}
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-gold/15 text-white"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                {active ? (
                  <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r bg-gold" />
                ) : null}
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-gold")} />
                {t(link.label)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
