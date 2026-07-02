"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { AcademyLogo } from "./AcademyLogo";
import { dashboardRoleNav } from "@/lib/dashboard-nav";

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const links = dashboardRoleNav[role];

  function handleLogout() {
    localStorage.removeItem("nofa_role");
    window.location.href = "/login";
  }

  return (
    <aside className="flex w-64 flex-col bg-navy text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <AcademyLogo variant="sidebar" />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href.split("#")[0];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(link.label)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
