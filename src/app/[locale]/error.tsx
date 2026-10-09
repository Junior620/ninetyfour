"use client";
import { useLocale } from "next-intl";
import { words } from "@/lib/club";
export default function ErrorPage({reset}:{reset:()=>void}){const locale=useLocale();return <div className="club-container club-section" role="alert"><h1 className="mb-5 text-3xl font-bold">{words(locale,"Le contenu n’a pas pu être chargé","Content could not be loaded")}</h1><p className="mb-6">{words(locale,"Réessayez dans un instant.","Please try again shortly.")}</p><button className="club-button" onClick={reset}>{words(locale,"Réessayer","Try again")}</button></div>;}
