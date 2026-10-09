import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { newsArticles, getArticleBySlug } from "@/lib/data/news";
import { categoryLabels, dateLabel, latestNews, words } from "@/lib/club";
import { NewsCard, SectionHeading, ActionLink } from "@/components/club/ClubUI";
import { ShareArticle } from "@/components/club/ShareArticle";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/schema";
import type { Locale } from "@/types";
type Props={params:Promise<{locale:string;slug:string}>};
// Content is published from local data at build time; unknown slugs are real 404s.
export const dynamicParams = false;
export function generateStaticParams(){return newsArticles.map(a=>({slug:a.slug}));}
export async function generateMetadata({params}:Props){const{locale,slug}=await params;const a=getArticleBySlug(slug);if(!a)return{};const loc=locale as Locale;return buildPageMetadata({locale,path:"/actualites/"+slug,title:a.title[loc],description:a.excerpt[loc],ogImage:a.image,ogType:"article",publishedTime:a.date});}
export default async function Article({params}:Props){
 const{locale,slug}=await params;setRequestLocale(locale);const loc=locale as Locale;const a=getArticleBySlug(slug);if(!a)notFound();
 const related=[...latestNews.filter(n=>n.slug!==slug&&n.category===a.category),...latestNews.filter(n=>n.slug!==slug&&n.category!==a.category)].slice(0,2);
 return <><JsonLd data={articleJsonLd({locale,title:a.title[loc],description:a.excerpt[loc],slug,datePublished:a.date,image:a.image})}/><JsonLd data={breadcrumbJsonLd(locale,[{name:words(loc,"Accueil","Home"),path:"/"},{name:words(loc,"Actualités","News"),path:"/actualites"},{name:a.title[loc],path:"/actualites/"+slug}])}/>
 <div className="club-article-cover"><Image src={a.image} alt="" fill sizes="100vw" preload/></div><article className="club-container"><header className="club-article-header"><Link href="/actualites" className="club-text-link">← {words(loc,"Toutes les actualités","All news")}</Link><div className="news-meta"><span>{categoryLabels[a.category][loc]}</span><time dateTime={a.date}>{dateLabel(a.date,loc)}</time></div><h1>{a.title[loc]}</h1><p>{a.excerpt[loc]}</p></header><div className="club-reading">{a.content[loc].split("\n\n").map((p,i)=><p key={i}>{p}</p>)}{a.category==="events"&&<p className="text-sm">{words(loc,"Article d’archive. Pour connaître les prochaines détections, contactez l’académie.","Archive story. Contact the academy for upcoming scouting dates.")}</p>}<ShareArticle title={a.title[loc]} locale={loc}/><ActionLink href={a.category==="partners"?"/contact?subject=partnership#formulaire":a.category==="matches"?"/saison":"/programme"}>{a.category==="partners"?words(loc,"Devenir partenaire","Become a partner"):a.category==="matches"?words(loc,"Calendrier & résultats","Fixtures & results"):words(loc,"Découvrir la formation","Explore the programme")}</ActionLink></div></article><section className="club-section"><div className="club-container"><SectionHeading title={words(loc,"À lire aussi","Related stories")}/><div className="grid gap-6 md:grid-cols-2">{related.map(n=><NewsCard key={n.slug} article={n} locale={loc}/>)}</div></div></section></>;
}
