"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, ChevronDown, LogOut, MessageCircle } from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { Sidebar } from "./Sidebar";
import { DashboardMobileNav } from "./DashboardMobileNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastHost, toast } from "@/components/ui/toast";
import {
  getRoleClient,
  logoutClient,
  ROLE_PATHS,
} from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const roleNames: Record<UserRole, string> = {
  player: "Kofi Mensah",
  parent: "M. Mensah",
  coach: "Coach Martin",
  admin: "Admin NOFA",
};

const roleLabels: Record<UserRole, { fr: string; en: string }> = {
  player: { fr: "Joueur", en: "Player" },
  parent: { fr: "Parent", en: "Parent" },
  coach: { fr: "Coach", en: "Coach" },
  admin: { fr: "Administrateur", en: "Administrator" },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  title?: string;
}

function formatDashboardDate(locale: string) {
  const raw = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (locale === "en") {
    return raw;
  }

  // FR: "lundi 27 juillet 2026" — capitalize weekday only
  return raw.replace(/^(\p{L})/u, (c) => c.toUpperCase());
}

export function DashboardLayout({
  children,
  requiredRole,
  title,
}: DashboardLayoutProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const stored = getRoleClient();
    if (!stored) {
      router.replace("/login");
      return;
    }
    if (stored !== requiredRole) {
      router.replace(ROLE_PATHS[stored]);
      return;
    }
    setRole(stored);
  }, [requiredRole, router]);

  const dateLabel = useMemo(() => formatDashboardDate(locale), [locale]);

  async function handleLogout() {
    await logoutClient();
    router.replace("/login");
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F2]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-gold" />
      </div>
    );
  }

  const initials = roleNames[role]
    .split(" ")
    .map((n) => n[0])
    .join("");

  const pageTitle = title ?? t("welcome");
  const roleLabel = locale === "en" ? roleLabels[role].en : roleLabels[role].fr;

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Sidebar role={role} />
      <div className="flex min-h-screen min-w-0 flex-col md:pl-60">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[#E5E2D9] bg-white/95 px-4 backdrop-blur md:px-6">
          <DashboardMobileNav role={role} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-navy md:text-base">
              {pageTitle}
            </p>
            <p className="hidden truncate text-xs text-text-muted sm:block">
              {dateLabel}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {role === "parent" ? (
              <button
                type="button"
                onClick={() => toast(t("parent.contactToast"))}
                className="hidden h-10 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-navy transition hover:translate-y-[-1px] lg:inline-flex"
              >
                <MessageCircle className="h-4 w-4" />
                {t("parent.contactAcademy")}
              </button>
            ) : (
              <label className="relative hidden lg:block">
                <span className="sr-only">{t("searchPlaceholder")}</span>
                <input
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  className="h-10 w-56 rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
              </label>
            )}

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E2D9] bg-white text-navy transition hover:border-gold/40"
              aria-label={t("notifications")}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                3
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-[#E5E2D9] bg-white py-1.5 pr-2 pl-1.5 transition hover:border-gold/40"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-navy text-xs text-gold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-bold text-navy">
                    {roleNames[role]}
                  </span>
                  <span className="block text-[10px] text-text-muted">
                    {roleLabel}
                  </span>
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
      <ToastHost />
    </div>
  );
}
