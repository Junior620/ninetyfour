"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, ChevronDown, LogOut, MessageCircle } from "lucide-react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { Sidebar } from "./Sidebar";
import { DashboardMobileNav } from "./DashboardMobileNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastHost } from "@/components/ui/toast";
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
function subscribeRole(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

const roleLabels: Record<UserRole, { fr: string; en: string }> = {
  player: { fr: "Joueur", en: "Player" },
  parent: { fr: "Parent", en: "Parent" },
  coach: { fr: "Coach", en: "Coach" },
  admin: { fr: "Administrateur", en: "Administrator" },
};

type NotifItem = {
  id: string;
  titleKey: string;
  bodyKey: string;
  href: string;
  unread: boolean;
  time: string;
};

const NOTIFS_BY_ROLE: Record<UserRole, NotifItem[]> = {
  admin: [
    {
      id: "a1",
      titleKey: "notif.admin1Title",
      bodyKey: "notif.admin1Body",
      href: "/dashboard/admin/candidatures",
      unread: true,
      time: "10 min",
    },
    {
      id: "a2",
      titleKey: "notif.admin2Title",
      bodyKey: "notif.admin2Body",
      href: "/dashboard/admin/utilisateurs",
      unread: true,
      time: "1 h",
    },
    {
      id: "a3",
      titleKey: "notif.admin3Title",
      bodyKey: "notif.admin3Body",
      href: "/dashboard/admin/candidatures",
      unread: true,
      time: "Hier",
    },
  ],
  coach: [
    {
      id: "c1",
      titleKey: "notif.coach1Title",
      bodyKey: "notif.coach1Body",
      href: "/dashboard/coach/evaluations",
      unread: true,
      time: "20 min",
    },
    {
      id: "c2",
      titleKey: "notif.coach2Title",
      bodyKey: "notif.coach2Body",
      href: "/dashboard/coach/joueurs",
      unread: true,
      time: "2 h",
    },
    {
      id: "c3",
      titleKey: "notif.coach3Title",
      bodyKey: "notif.coach3Body",
      href: "/dashboard/coach",
      unread: false,
      time: "Hier",
    },
  ],
  parent: [
    {
      id: "p1",
      titleKey: "notif.parent1Title",
      bodyKey: "notif.parent1Body",
      href: "/dashboard/parent/scolaire",
      unread: true,
      time: "30 min",
    },
    {
      id: "p2",
      titleKey: "notif.parent2Title",
      bodyKey: "notif.parent2Body",
      href: "/dashboard/parent/calendrier",
      unread: true,
      time: "3 h",
    },
    {
      id: "p3",
      titleKey: "notif.parent3Title",
      bodyKey: "notif.parent3Body",
      href: "/dashboard/parent/documents",
      unread: true,
      time: "Hier",
    },
  ],
  player: [
    {
      id: "j1",
      titleKey: "notif.player1Title",
      bodyKey: "notif.player1Body",
      href: "/dashboard/joueur",
      unread: true,
      time: "15 min",
    },
    {
      id: "j2",
      titleKey: "notif.player2Title",
      bodyKey: "notif.player2Body",
      href: "/dashboard/joueur",
      unread: true,
      time: "1 h",
    },
    {
      id: "j3",
      titleKey: "notif.player3Title",
      bodyKey: "notif.player3Body",
      href: "/dashboard/joueur",
      unread: false,
      time: "Hier",
    },
  ],
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
  const role = useSyncExternalStore(subscribeRole, getRoleClient, () => null);
  const [notifs, setNotifs] = useState<NotifItem[]>(() => NOTIFS_BY_ROLE[requiredRole].map((n) => ({ ...n })));

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
  }, [requiredRole, router]);

  const dateLabel = useMemo(() => formatDashboardDate(locale), [locale]);
  const unreadCount = notifs.filter((n) => n.unread).length;

  async function handleLogout() {
    await logoutClient();
    router.replace("/login");
  }

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function openNotif(item: NotifItem) {
    setNotifs((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    router.push(item.href);
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
              <Link
                href="/contact"
                className="hidden h-10 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-navy transition hover:translate-y-[-1px] lg:inline-flex"
              >
                <MessageCircle className="h-4 w-4" />
                {t("parent.contactAcademy")}
              </Link>
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

            <DropdownMenu>
              <DropdownMenuTrigger
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E2D9] bg-white text-navy transition hover:border-gold/40"
                aria-label={t("notifications")}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                    {unreadCount}
                  </span>
                ) : null}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[20rem] p-0">
                <div className="flex items-center justify-between border-b border-[#E5E2D9] px-3 py-2.5">
                  <div>
                    <p className="text-sm font-bold text-navy">
                      {t("notifications")}
                    </p>
                    {unreadCount > 0 ? (
                      <p className="text-[11px] text-text-muted">
                        {t("notificationsUnread", { count: unreadCount })}
                      </p>
                    ) : null}
                  </div>
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-gold hover:underline"
                    >
                      {t("notificationsMarkAll")}
                    </button>
                  ) : null}
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {notifs.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-text-muted">
                      {t("notificationsEmpty")}
                    </p>
                  ) : (
                    notifs.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openNotif(item)}
                        className={cn(
                          "flex w-full gap-3 px-3 py-2.5 text-left transition hover:bg-[#F7F6F2]",
                          item.unread && "bg-gold/[0.06]"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            item.unread ? "bg-gold" : "bg-transparent"
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-navy">
                              {t(item.titleKey)}
                            </span>
                            <span className="shrink-0 text-[10px] text-text-muted">
                              {item.time === "Hier" && locale === "en"
                                ? "Yesterday"
                                : item.time}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-text-muted">
                            {t(item.bodyKey)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
