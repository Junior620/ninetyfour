import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { publicPlayers, words } from "@/lib/club";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PageIntro, ActionLink } from "@/components/club/ClubUI";
import type { Locale } from "@/types";
type Props={params:Promise<{locale:string;slug:string}>};
export const dynamicParams = false;
export function generateStaticParams(){return publicPlayers.map(player=>({slug:player.slug}));}
export async function generateMetadata({params}:Props){const{locale,slug}=await params;const p=publicPlayers.find(p=>p.slug===slug);if(!p)return{};return buildPageMetadata({locale,path:"/joueurs/"+slug,title:p.name,description:p.bio[locale as Locale]});}
export default async function Player({params}:Props){const{locale,slug}=await params;setRequestLocale(locale);const loc=locale as Locale;const p=publicPlayers.find(p=>p.slug===slug);if(!p)notFound();return <><PageIntro title={p.name} eyebrow={p.position[loc]} image={p.image}/><div className="club-container club-section"><div className="club-reading"><p>{p.bio[loc]}</p><ActionLink href={"/equipes/"+p.teamId}>{words(loc,"Retour à l’équipe","Back to the team")}</ActionLink></div></div></>;}
