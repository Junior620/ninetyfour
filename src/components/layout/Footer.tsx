"use client";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { contactInfo } from "@/lib/data/academy";
import { clubNav, words } from "@/lib/club";
import { PartnerGrid } from "@/components/club/ClubUI";
import type { Locale } from "@/types";
export function Footer() {
  const locale=useLocale() as Locale;
  return <><PartnerGrid locale={locale}/><footer className="club-footer"><div className="club-container">
    <div className="footer-top"><div><Image src="/logo-crest.png" alt="Ninety One Foot Academy" width={72} height={72}/><h2>NINETY ONE<br/>FOOT ACADEMY.</h2><p>{words(locale,"Ancrée à Douala. Tournée vers demain.","Rooted in Douala. Looking ahead.")}</p></div><div className="footer-nav">{clubNav.map(group=><div key={group.href}><h3><Link href={group.href}>{group[locale]}</Link></h3>{group.children.slice(0,4).map(c=><Link key={c.href} href={c.href}>{c[locale]}</Link>)}</div>)}</div></div>
    <div className="footer-service"><div><span className="club-kicker">{words(locale,"Restons en contact","Keep in touch")}</span><a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a><span>{contactInfo.address[locale]}</span></div><div><Link href="/contact#venir">{words(locale,"Venir nous rencontrer","Visit us")}</Link><Link href="/rejoindre">{words(locale,"Candidater","Apply")}</Link><Link href="/login">{words(locale,"Espace privé","Member area")}</Link></div><div><a href={contactInfo.social.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href={contactInfo.social.facebook} target="_blank" rel="noopener noreferrer">Facebook ↗</a></div></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Ninety One Foot Academy</span><Link href="/informations-legales">{words(locale,"Informations légales","Legal information")}</Link><Link href="/confidentialite">{words(locale,"Confidentialité","Privacy")}</Link></div>
  </div></footer></>;
}
