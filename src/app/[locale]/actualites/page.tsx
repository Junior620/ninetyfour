import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { newsArticles } from "@/lib/data/news";
import { categoryLabels, filterNews, words } from "@/lib/club";
import { PageIntro, NewsCard, EmptyState } from "@/components/club/ClubUI";
import type { Locale } from "@/types";
type Props={params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({params}:Props){const{locale}=await params;return buildPageMetadata({locale,path:"/actualites",title:words(locale,"Actualités","News"),description:words(locale,"Toute la vie de Ninety One : formation, rencontres, partenaires et événements.","Ninety One news: academy life, football, partners and events.")});}
export default async function News({params,searchParams}:Props){
 const{locale}=await params;setRequestLocale(locale);const loc=locale as Locale;const query=await searchParams;const val=(key:string)=>typeof query[key]==="string"?query[key] as string:"";const q=val("q");const category=val("category");const year=val("year");
 const articles=filterNews(newsArticles,loc,q,category,year);const pageSize=6;const totalPages=Math.ceil(articles.length/pageSize);const page=Math.min(Math.max(1,Number.parseInt(val("page"))||1),Math.max(1,totalPages));const shown=articles.slice((page-1)*pageSize,page*pageSize);
 const pageHref=(n:number)=>"/actualites?"+new URLSearchParams({q,category,year,page:String(n)}).toString();
 return <><PageIntro title={words(loc,"Actualités","News")} eyebrow="NINETY ONE FOOT ACADEMY" description={words(loc,"Les histoires, les rencontres et la vie de notre académie.","Stories, fixtures and life at our academy.")}/><div className="club-container club-section">
  <form className="club-filters" method="get"><label className="search">{words(loc,"Rechercher une actualité","Search news")}<input type="search" name="q" defaultValue={q} placeholder={words(loc,"Un sujet, un mot-clé…","A topic, a keyword…")}/></label><label>{words(loc,"Rubrique","Category")}<select name="category" defaultValue={category}><option value="">{words(loc,"Toutes les rubriques","All categories")}</option>{["academy","matches","training","partners","events"].map(c=><option key={c} value={c}>{categoryLabels[c][loc]}</option>)}</select></label><label>{words(loc,"Archives","Archive")}<select name="year" defaultValue={year}><option value="">{words(loc,"Toutes les années","All years")}</option>{[...new Set(newsArticles.map(a=>a.date.slice(0,4)))].sort().reverse().map(y=><option key={y}>{y}</option>)}</select></label><button className="club-button">{words(loc,"Rechercher","Search")}</button><Link className="club-text-link" href="/actualites">{words(loc,"Effacer","Clear")}</Link></form>
  <p className="club-results-count" role="status">{articles.length} {words(loc,"actualité(s)","stories")}</p><div className="club-news-list">{shown.map((a,index)=><NewsCard key={a.slug} article={a} locale={loc} horizontal featured={index===0 && page===1 && !q && !category && !year}/>)}</div>
  {!shown.length&&<EmptyState title={words(loc,"Aucune actualité trouvée","No stories found")} href="/actualites" label={words(loc,"Voir toutes les actualités","View all news")}>{words(loc,"Essayez un autre mot-clé ou élargissez les filtres.","Try another keyword or broaden your filters.")}</EmptyState>}
  {totalPages>1&&<nav className="club-pagination" aria-label="Pagination">{Array.from({length:totalPages},(_,i)=>i+1).map(n=><Link key={n} href={pageHref(n)} aria-current={n===page?"page":undefined}>{n}</Link>)}</nav>}
 </div></>;
}
