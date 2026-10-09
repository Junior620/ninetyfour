"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { clubNav, commerce, words } from "@/lib/club";
import type { Locale } from "@/types";

function LanguageLinks({ path, locale, query = "" }: { path: string; locale: Locale; query?: string }) {
  const href = query ? `${path}?${query}` : path;
  return <div className="club-languages"><Link href={href} locale="fr" lang="fr" aria-label="Français" aria-current={locale === "fr" ? "page" : undefined}>FR</Link><Link href={href} locale="en" lang="en" aria-label="English" aria-current={locale === "en" ? "page" : undefined}>EN</Link></div>;
}

function CurrentLanguageLinks({ path, locale }: { path: string; locale: Locale }) {
  const searchParams = useSearchParams();
  return <LanguageLinks path={path} locale={locale} query={searchParams.toString()} />;
}

export function Header() {
  const locale = useLocale() as Locale;
  const path = usePathname();
  const [open,setOpen] = useState(false);
  const [compact,setCompact] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const scroll = () => setCompact(window.scrollY > 100);
    const close = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(".club-nav-details")) headerRef.current?.querySelectorAll("details[open]").forEach(el => el.removeAttribute("open"));
    };
    scroll(); window.addEventListener("scroll",scroll,{passive:true}); document.addEventListener("pointerdown",close);
    return () => { window.removeEventListener("scroll",scroll); document.removeEventListener("pointerdown",close); };
  },[]);
  const active = (href: string) => path === href || (href !== "/" && path.startsWith(href + "/"));
  const utility = <><Link href="/contact">Contact</Link><Link href="/login">{words(locale,"Espace privé","Member area")}</Link>{commerce.shopUrl && <a href={commerce.shopUrl}>{words(locale,"Boutique","Shop")}<ArrowUpRight size={14}/></a>}<Suspense fallback={<LanguageLinks path={path} locale={locale}/>}><CurrentLanguageLinks path={path} locale={locale}/></Suspense></>;
  return <>
    <a href="#contenu" className="club-skip">{words(locale,"Aller au contenu","Skip to content")}</a>
    <header ref={headerRef} className={`club-header${compact ? " compact" : ""}`} onKeyDown={e => {
      if (e.key === "Escape") { const details = (e.target as HTMLElement).closest("details"); if(details) { details.open=false; details.querySelector("summary")?.focus(); } }
    }}>
      <div className="club-container club-masthead">
        <span className="club-masthead-caption">{words(locale,"DOUALA, CAMEROUN","DOUALA, CAMEROON")}<br/><strong>{words(locale,"Talent. Éducation. Performance.","Talent. Education. Performance.")}</strong></span>
        <Link href="/" className="club-brand" aria-label="Ninety One Foot Academy"><Image src="/logo-crest.png" width={80} height={80} sizes="80px" alt="" preload /><span>NINETY ONE<small>FOOT ACADEMY</small></span></Link>
        <div className="club-utilities">{utility}</div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className="club-mobile-trigger" aria-label={words(locale,"Ouvrir le menu","Open menu")}><Menu aria-hidden/></Dialog.Trigger>
          <Dialog.Portal><Dialog.Backdrop className="club-dialog-backdrop"/><Dialog.Popup className="club-mobile-menu" aria-describedby={undefined}>
            <div className="mobile-menu-heading"><Dialog.Title>Ninety One</Dialog.Title><Dialog.Close className="club-icon-button" aria-label={words(locale,"Fermer le menu","Close menu")}><X/></Dialog.Close></div>
            <nav aria-label={words(locale,"Navigation mobile","Mobile navigation")} onClick={e=>{if((e.target as Element).closest("a"))setOpen(false);}}>
              <Link href="/" className="mobile-home">{words(locale,"Accueil","Home")}</Link>
              {clubNav.map(item => item.children.length ? <details key={item.href}><summary>{item[locale]}<ChevronDown size={16}/></summary><div>{item.children.map(child=><Link key={child.href} href={child.href} aria-current={active(child.href)?"page":undefined}>{child[locale]}</Link>)}</div></details> : <Link className="mobile-home" key={item.href} href={item.href}>{item[locale]}</Link>)}
              <Link href="/rejoindre" className="club-button">{words(locale,"Rejoindre l’académie","Join the academy")}</Link><div className="mobile-utilities">{utility}</div>
            </nav>
          </Dialog.Popup></Dialog.Portal>
        </Dialog.Root>
      </div>
      <div className="club-nav-bar"><nav className="club-container club-desktop-nav" aria-label={words(locale,"Navigation principale","Main navigation")}>
        {clubNav.map(item => item.children.length ? <details className="club-nav-details" key={item.href} onToggle={e=>{if(e.currentTarget.open) headerRef.current?.querySelectorAll("details[open]").forEach(el=>{if(el!==e.currentTarget)el.removeAttribute("open");});}}>
          <summary className={active(item.href)?"active":""}>{item[locale]}<ChevronDown size={13}/></summary><div className="club-dropdown">{item.children.map(child=><Link key={child.href} href={child.href} onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");}}>{child[locale]}</Link>)}</div>
        </details> : <Link className={active(item.href)?"active":""} aria-current={active(item.href)?"page":undefined} key={item.href} href={item.href}>{item[locale]}</Link>)}
        {commerce.ticketUrl ? <a className="nav-cta" href={commerce.ticketUrl}>{words(locale,"Billetterie","Tickets")}<ArrowUpRight size={16}/></a> : <Link className="nav-cta" href="/rejoindre">{words(locale,"Rejoindre","Join us")}<ArrowUpRight size={16}/></Link>}
      </nav></div>
    </header>
  </>;
}
