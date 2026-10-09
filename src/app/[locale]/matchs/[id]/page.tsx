import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { matches, dateLabel, words } from "@/lib/club";
import { newsArticles } from "@/lib/data/news";
import { PageIntro, MatchCard, NewsCard, ActionLink } from "@/components/club/ClubUI";
import type { Locale } from "@/types";
type Props={params:Promise<{locale:string;id:string}>};
export const dynamicParams = false;
export function generateStaticParams(){return matches.map(match=>({id:match.id}));}
export async function generateMetadata({params}:Props){const{locale,id}=await params;const m=matches.find(m=>m.id===id);if(!m)return{};return buildPageMetadata({locale,path:"/matchs/"+id,title:m.home.name+" – "+m.away.name,description:words(locale,"Informations et résultat du match.","Match information and result.")});}
export default async function Match({params}:Props){const{locale,id}=await params;setRequestLocale(locale);const loc=locale as Locale;const m=matches.find(m=>m.id===id);if(!m)notFound();return <><PageIntro title={m.home.name+" – "+m.away.name} eyebrow={m.competition}/><div className="club-container club-section"><div className="club-team-layout"><MatchCard match={m} locale={loc}/><div><h2 className="text-2xl font-bold">{words(loc,"Préparer sa venue","Plan your visit")}</h2><p className="my-4">{m.venue??words(loc,"Lieu à confirmer auprès de l’académie.","Contact the academy to confirm the venue.")}</p><ActionLink href="/contact#venir">{words(loc,"Informations pratiques","Visitor information")}</ActionLink><p className="my-4 text-sm">{words(loc,"Mise à jour","Updated")} : {dateLabel(m.updatedAt,loc)}<br/>{words(loc,"Source","Source")} : {m.source}</p></div></div><div className="club-card-grid mt-10">{newsArticles.filter(a=>m.articleSlugs?.includes(a.slug)).map(a=><NewsCard key={a.slug} article={a} locale={loc}/>)}</div><ActionLink href="/saison" secondary>{words(loc,"Retour à la saison","Back to the season")}</ActionLink></div></>;}
