import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { teamCategories } from "@/lib/data/staff";
import { words } from "@/lib/club";
import { PageIntro, ActionLink } from "@/components/club/ClubUI";
import type { Locale } from "@/types";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const{locale}=await params;return buildPageMetadata({locale,path:"/equipes",title:words(locale,"Nos équipes","Our teams"),description:words(locale,"Découvrez les catégories U14, U16 et U18 de Ninety One Foot Academy.","Explore the U14, U16 and U18 categories at Ninety One Foot Academy.")});}
export default async function Teams({params}:{params:Promise<{locale:string}>}){const{locale}=await params;setRequestLocale(locale);const loc=locale as Locale;return <><PageIntro title={words(loc,"Nos équipes","Our teams")} eyebrow={words(loc,"Le football, à chaque étape","Football at every stage")} description={words(loc,"Un parcours de formation pour construire les bases, progresser et préparer le haut niveau.","A development pathway to build foundations, progress and prepare for elite football.")} image="/hero-3.jpeg"/><div className="club-container club-section"><div className="club-card-grid">{teamCategories.map(t=><article className="club-team-card" id={t.id} key={t.id}><div className="news-image"><Image src={t.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw"/></div><div className="news-copy"><p className="club-kicker">NINETY ONE</p><h2>{t.shortLabel[loc]}</h2><p>{t.description[loc]}</p><ActionLink href={"/equipes/"+t.id}>{words(loc,"Découvrir l’équipe","Explore the team")}</ActionLink></div></article>)}</div></div></>;}
