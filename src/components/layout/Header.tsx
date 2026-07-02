"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  desktopNavItems,
  isNavGroupActive,
  type NavGroup,
  type NavLink,
} from "@/lib/nav-config";
import { MobileNav } from "./MobileNav";
import { NavHoverMenu } from "./NavHoverMenu";
import { AcademyLogo } from "./AcademyLogo";

const navLinkClass =
  "inline-flex items-center gap-0.5 whitespace-nowrap rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:text-royal lg:text-xs";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) return null;

  function linkClass(href: string, active?: boolean) {
    const isActive =
      active ??
      (pathname === href || (href !== "/" && pathname.startsWith(href)));
    return cn(
      navLinkClass,
      isActive ? "text-royal" : "text-text-muted"
    );
  }

  function renderNavLink(item: NavLink) {
    return (
      <Link key={item.href} href={item.href} className={linkClass(item.href)}>
        {t(item.key)}
      </Link>
    );
  }

  function renderNavGroup(item: NavGroup) {
    const active = isNavGroupActive(pathname, item.children);

    return (
      <NavHoverMenu
        key={item.key}
        label={t(item.key)}
        active={active}
        items={item.children.map((child) => ({
          href: child.href,
          label: t(child.key),
          isActive: pathname === child.href,
        }))}
      />
    );
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-white/95 shadow-sm backdrop-blur-md"
            : "bg-cream"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:px-6">
          <Link href="/" className="flex shrink-0 items-center">
            <AcademyLogo variant="header" priority />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex"
            aria-label="Main navigation"
          >
            {desktopNavItems.map((item) =>
              item.type === "link"
                ? renderNavLink(item)
                : renderNavGroup(item)
            )}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <div className="flex rounded-md border border-border text-[11px] font-semibold">
              <Link
                href={pathname}
                locale="fr"
                className={cn(
                  "rounded-l-md px-2 py-1 transition-colors",
                  locale === "fr" ? "bg-navy text-white" : "hover:bg-muted"
                )}
              >
                FR
              </Link>
              <Link
                href={pathname}
                locale="en"
                className={cn(
                  "rounded-r-md px-2 py-1 transition-colors",
                  locale === "en" ? "bg-navy text-white" : "hover:bg-muted"
                )}
              >
                EN
              </Link>
            </div>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden border-navy px-2.5 text-navy xl:inline-flex"
              )}
            >
              {t("privateSpace")}
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-navy px-2.5 text-navy xl:hidden"
              )}
              title={t("privateSpace")}
            >
              {t("privateShort")}
            </Link>
            <Link
              href="/rejoindre"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-gold px-2.5 text-navy hover:bg-gold/90"
              )}
            >
              {t("joinShort")}
            </Link>
          </div>

          <button
            className="ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-md text-navy xl:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
