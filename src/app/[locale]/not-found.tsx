"use client";
import { useLocale } from "next-intl";
import { PageIntro, ActionLink } from "@/components/club/ClubUI";
import { words } from "@/lib/club";
export default function NotFound(){const locale=useLocale();return <><PageIntro title={words(locale,"Cette page n’est pas disponible","This page is not available")} eyebrow="404"/><div className="club-container club-section"><p className="mb-6">{words(locale,"Le contenu demandé n’existe pas ou n’est pas encore publié.","The requested content does not exist or has not been published yet.")}</p><ActionLink href="/">{words(locale,"Retour à l’accueil","Back to home")}</ActionLink></div></>;}
