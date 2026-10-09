"use client";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { clubNav, words } from "@/lib/club";
import type { Locale } from "@/types";
export function SectionNav(){const locale=useLocale() as Locale;const path=usePathname();const group=clubNav.find(g=>g.children.some(c=>c.href.split(/[?#]/)[0]===path));if(!group||["/equipes","/actualites","/saison","/contact","/rejoindre"].includes(path)||path.startsWith("/equipes/"))return null;return <nav className="club-subnav" aria-label={words(locale,"Dans cette rubrique","In this section")}><div className="club-container">{group.children.map(c=><Link key={c.href} href={c.href} aria-current={path===c.href?"page":undefined}>{c[locale]}</Link>)}</div></nav>;}
