import Image from "next/image";
import { ArrowUpRight, Trophy } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { words, latestNews, matches, matchSummary } from "@/lib/club";
import { ActionLink, EmptyState, MatchCard, NewsCard, SectionHeading } from "@/components/club/ClubUI";
import type { Locale } from "@/types";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}) { const {locale}=await params; return buildPageMetadata({locale,path:"/",title:"Ninety One Foot Academy — Douala",description:words(locale,"Talent, éducation et performance. La vie de l’académie, nos équipes et le programme 2026–2029.","Talent, education and performance. Academy news, teams and the 2026–2029 programme."),absoluteTitle:true}); }
export default async function Home({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params; setRequestLocale(locale); const loc=locale as Locale; const sport=matchSummary(matches);
 const tiles=[
 {label:words(loc,"Le club","Our club"),href:"/academie",image:"/hero-4.jpeg",size:""},
 {label:words(loc,"Nos équipes","Our teams"),href:"/equipes",image:"/hero-3.jpeg",size:"wide"},
 {label:words(loc,"Saison","Season"),href:"/saison",image:"/hero.png",size:""},
 {label:words(loc,"Médias","Media"),href:"/galerie",image:"/hero-2.jpeg",size:""},
 {label:words(loc,"Vie du club","Club life"),href:"/actualites?category=academy",image:"/promise-04.png",size:""},
 {label:words(loc,"Partenaires","Partners"),href:"/partenaires",image:"/pub1.jpg",size:"half"},
 {label:words(loc,"Formation","Academy"),href:"/programme",image:"/promise-01.png",size:"half"},
 {label:words(loc,"Événements","Events"),href:"/actualites?category=events",image:"/hero-3.jpeg",size:"full"}
 ];
 return <>
  <section className="club-hero"><Image src="/hero-3.jpeg" alt="" fill sizes="100vw" preload/><div className="club-container club-hero-copy"><div className="hero-edition"><span className="club-kicker">{words(loc,"Le projet Ninety One","The Ninety One project")}</span><span>2026 — 2029</span></div><h1>{words(loc,"La nouvelle génération commence ici.","The next generation starts here.")}</h1><p>{words(loc,"À Douala, le talent grandit sur le terrain, à l’école et dans la vie.","In Douala, talent grows on the pitch, in the classroom and in life.")}</p><ActionLink href="/actualites/lancement-programme-2026">{words(loc,"Découvrir notre projet","Discover our project")}</ActionLink></div><span className="hero-bottom-line">Ninety One Foot Academy · Douala</span></section>
  <section className="club-portal-section" aria-label={words(loc,"Explorer le club","Explore the club")}><div className="club-container club-portal">
    <aside className="portal-left"><div className="portal-sponsor"><p className="club-kicker">{words(loc,"Partenaire stratégique","Strategic partner")}</p><Link href="/partenaires#astra"><div className="portal-sponsor-image"><Image src="/partner-astra.png" alt="Astra Invest" fill sizes="250px"/></div></Link><p>{words(loc,"Aux côtés de notre académie.","Alongside our academy.")}</p></div><div className="portal-media"><div className="portal-media-image"><Image src="/hero-4.jpeg" alt="" fill sizes="(min-width:768px) 25vw, 45vw"/></div><div><h3>{words(loc,"Dans les coulisses","Inside the academy")}</h3><Link className="club-text-link" href="/galerie">{words(loc,"L’académie en images","Explore the gallery")}<ArrowUpRight size={16}/></Link></div></div></aside>
    <div className="portal-mosaic">{tiles.map(tile=><Link className={`portal-tile ${tile.size}`} key={tile.href} href={tile.href}><Image src={tile.image} alt="" fill sizes="(min-width:1200px) 30vw, (min-width:768px) 40vw, 50vw"/><span>{tile.label}<ArrowUpRight aria-hidden/></span></Link>)}</div>
    <aside className="portal-right"><div className="portal-football"><h2 className="portal-panel-heading"><Trophy size={18} aria-hidden/>{words(loc,"Les rendez-vous du club","Club fixtures")}</h2>{sport.next ? <MatchCard match={sport.next} locale={loc}/> : <EmptyState title={words(loc,"Le prochain rendez-vous","The next fixture")} href="/saison" label={words(loc,"Calendrier & résultats","Fixtures & results")}>{words(loc,"Les prochaines rencontres seront annoncées ici dès confirmation du calendrier.","Upcoming fixtures will appear here once the schedule is confirmed.")}</EmptyState>}{sport.last && <MatchCard match={sport.last} locale={loc}/>}</div><div className="portal-practical"><p className="club-kicker">{words(loc,"Grandir avec Ninety One","Grow with Ninety One")}</p><h3>{words(loc,"Talent. Éducation. Performance.","Talent. Education. Performance.")}</h3><p>{words(loc,"Un programme structuré et un accompagnement individuel pour les jeunes talents.","A structured programme and individual support for young talent.")}</p><Link className="club-text-link" href="/rejoindre">{words(loc,"Rejoindre l’académie","Join the academy")}<ArrowUpRight size={16}/></Link></div></aside>
    <section className="home-news-block"><SectionHeading title={words(loc,"Au cœur de l’académie","At the heart of the academy")} eyebrow={words(loc,"Les dernières actualités","Latest news")} href="/actualites" linkLabel={words(loc,"Toutes les actualités","All news")}/><div className="home-news-grid"><NewsCard article={latestNews[0]} locale={loc} featured/><div className="home-news-secondary">{latestNews.slice(1,3).map(a=><NewsCard article={a} key={a.slug} locale={loc} horizontal/>)}</div></div></section>
  </div></section>
  <section className="club-container club-formation-banner"><div className="banner-image"><Image src="/hero-2.jpeg" alt="" fill sizes="(min-width:768px) 50vw, 100vw"/></div><div className="banner-copy"><p className="club-kicker">2026 — 2029</p><h2>{words(loc,"Former le joueur. Accompagner la personne.","Develop the player. Support the person.")}</h2><p>{words(loc,"Quatre dimensions, un même engagement : formation sportive, éducation, technologie et développement humain.","Four dimensions, one commitment: football, education, technology and personal development.")}</p><ActionLink href="/programme">{words(loc,"Notre programme","Our programme")}</ActionLink></div></section><div className="h-12"/>
 </>;
}
