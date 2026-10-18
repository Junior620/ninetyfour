"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Flag,
  Users,
  Video,
  FileText,
  ChartNoAxesCombined,
  Film,
  FlaskConical,
  Download,
  Newspaper,
  Settings,
  Menu,
  X,
  LockKeyhole,
  Bell,
  LogOut,
  ChevronRight,
  LayoutTemplate,
} from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { HelpPanel, Tour } from "./Help";
import { fr as t } from "@/lib/matchlab/messages";
import type { Member } from "@/lib/matchlab/schema";

export const navigation = [
  { id: "overview", Icon: LayoutDashboard },
  { id: "matches", Icon: Flag },
  { id: "players", Icon: Users },
  { id: "squad", Icon: LayoutTemplate },
  { id: "analyze", Icon: Video },
  { id: "reports", Icon: FileText },
  { id: "analytics", Icon: ChartNoAxesCombined },
  { id: "video", Icon: Film },
  { id: "ai", Icon: FlaskConical },
  { id: "exports", Icon: Download },
  { id: "site", Icon: Newspaper },
  { id: "admin", Icon: Settings },
] as const;
export function Shell({
  children,
  member,
  email,
  seasons,
  localOnly,
}: {
  children: React.ReactNode;
  member: Member;
  email: string;
  seasons: { id: string; name: string }[];
  localOnly: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const query = useSearchParams();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const active = pathname.split("/")[2] as keyof typeof t.nav;
  const changeSeason = (value: string) => {
    const params = new URLSearchParams(query.toString());
    if (value) params.set("season", value);
    else params.delete("season");
    const search = params.toString();
    setOpen(false);
    router.replace(search ? `${pathname}?${search}` : pathname);
  };
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const close = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);
  const content = (
    <>
      <Link
        className="ml-brand"
        href="/matchlab/overview"
        aria-label="N91 MatchLab"
      >
        <Image
          src="/n91-lab-logo.png"
          alt=""
          width={175}
          height={72}
          loading="eager"
        />
        <small>{t.subtitle}</small>
      </Link>
      <nav aria-label={t.brand}>
        {navigation
          .filter(
            (n) =>
              (n.id !== "admin" || member.role === "direction") &&
              (n.id !== "site" ||
                member.permissions.some(
                  (p) => p === "site_editor" || p === "site_publisher",
                )) &&
              (n.id !== "exports" || member.permissions.includes("export")),
          )
          .map((n) => (
            <div key={n.id}>
              {n.id === "analytics" && (
                <p className="ml-nav-label">{t.extensions}</p>
              )}
              <Link
                onClick={() => setOpen(false)}
                href={`/matchlab/${n.id}`}
                aria-current={active === n.id ? "page" : undefined}
              >
                <n.Icon size={18} />
                <span>{t.nav[n.id]}</span>
              </Link>
            </div>
          ))}
      </nav>
      <label className="ml-season">
        <small>{t.season}</small>
        <select
          value={query.get("season") || ""}
          onChange={(e) => changeSeason(e.target.value)}
        >
          <option value="">{t.allSeasons}</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="ml-sidebar-bottom" title={email}>
        <span className="ml-avatar">N91</span>
        <div>
          <strong>{t.staffTitle}</strong>
          <small>{t.clubAccess}</small>
        </div>
        <button
          aria-label={t.logout}
          onClick={async () => {
            const response = await fetch("/api/matchlab/auth/logout", {
              method: "POST",
            });
            if (response.ok) {
              router.replace("/matchlab/login");
              router.refresh();
            }
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </>
  );
  return (
    <div className="ml-app">
      <a className="ml-skip" href="#ml-main">
        {t.skip}
      </a>
      <aside className="ml-sidebar">{content}</aside>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          ref={trigger}
          className="ml-menu-trigger"
          aria-label={t.openMenu}
        >
          <Menu size={22} />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="ml-backdrop" />
          <Dialog.Popup className="ml-drawer" finalFocus={trigger}>
            <Dialog.Title className="sr-only">{t.brand}</Dialog.Title>
            <Dialog.Close className="ml-drawer-close" aria-label={t.closeMenu}>
              <X size={20} />
            </Dialog.Close>
            {content}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="ml-workspace">
        <header className="ml-topbar">
          <div>
            <span>{t.academy}</span>
            <ChevronRight size={13} />
            <strong>{t.nav[active] || t.brand}</strong>
          </div>
          <div>
            <span className="ml-private">
              <LockKeyhole size={13} />
              {t.private}
            </span>
            <HelpPanel section={active} />
            <Link
              className="ml-icon"
              href="/matchlab/alerts"
              aria-label={t.alerts.title}
            >
              <Bell size={19} />
            </Link>
            <span className="ml-avatar" title={email}>
              {email.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <main id="ml-main" tabIndex={-1} className="ml-main">
          {localOnly && (
            <p className="ml-local-banner">
              Environnement local de recette · données fictives uniquement
            </p>
          )}
          {children}
        </main>
        <Tour section={active} />
        <footer className="ml-footer">
          <span>{t.footer}</span>
          <span>{t.decision}</span>
        </footer>
      </div>
    </div>
  );
}
