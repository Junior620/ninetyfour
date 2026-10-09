import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { AcademyContent } from "@/components/club/AcademyContent";
import type { Locale } from "@/types";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const{locale}=await params;const t=await getTranslations({locale,namespace:"seo"});return buildPageMetadata({locale,path:"/academie",title:t("academy.title"),description:t("academy.description")});}
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale}=await params;setRequestLocale(locale);return <AcademyContent kind="academy" locale={locale as Locale}/>;}
