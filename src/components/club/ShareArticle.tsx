"use client";
import { useState } from "react";
import { words } from "@/lib/club";
export function ShareArticle({ title, locale }: { title: string; locale: string }) {
  const [status,setStatus]=useState("");
  async function share(){try{if(navigator.share){await navigator.share({title,url:location.href});}else{await navigator.clipboard.writeText(location.href);setStatus(words(locale,"Lien copié","Link copied"));}}catch(error){if(error instanceof Error && error.name!=="AbortError")setStatus(words(locale,"Copiez l’adresse depuis votre navigateur.","Copy the address from your browser."));}}
  return <div className="club-share"><button onClick={share}>{words(locale,"Partager l’article","Share story")}</button><span role="status">{status}</span></div>;
}
