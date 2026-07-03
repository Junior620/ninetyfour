import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { CTASection } from "@/components/sections/CTASection";
import { QuoteSection } from "@/components/sections/QuoteSection";
import { PillarCard } from "@/components/cards/StatCard";
import { StatsSection } from "@/components/sections/StatsSection";
import { NewsCard } from "@/components/cards/PartnerCard";
import { ExploreCard } from "@/components/cards/ExploreCard";
import { PartnersMarquee } from "@/components/sections/PartnersMarquee";
import { buttonVariants } from "@/components/ui/button";
import {
  promisePillars,
  dimensions,
  keyStats,
  images,
  partners,
  newsArticles,
} from "@/lib/data";
import { localized, formatDate, cn } from "@/lib/utils";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("siteName"),
    description: t("description"),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const t = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tNews = await getTranslations({ locale, namespace: "news" });

  const explorePages = [
    {
      key: "program",
      href: "/programme",
      title: tNav("program"),
      description: t("explore.program"),
      image: images.academy,
    },
    {
      key: "training",
      href: "/formation-sportive",
      title: tNav("training"),
      description: t("explore.training"),
      image: images.training,
    },
    {
      key: "education",
      href: "/education",
      title: tNav("education"),
      description: t("explore.education"),
      image: images.education,
    },
    {
      key: "performanceLab",
      href: "/performance-lab",
      title: tNav("performanceLab"),
      description: t("explore.performanceLab"),
      image: images.performance,
    },
  ];

  const latestNews = [...newsArticles]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <>
      <HeroSection
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        images={images.heroImages}
        badges={[
          t("badges.age"),
          t("badges.sessions"),
          t("badges.location"),
          t("badges.tracking"),
        ]}
        primaryCta={{ label: tNav("join"), href: "/rejoindre" }}
        secondaryCta={{ label: t("discoverProgram"), href: "/programme" }}
      />

      <PartnersMarquee
        partners={partners}
        title={t("partnersBand")}
        subtitle={t("partnersBandSubtitle")}
        ctaLabel={t("partnersCta")}
      />

      <section className="bg-cream px-4 py-12 sm:py-16 md:px-8 lg:px-16">
        <div className="container-wide">
          <SectionTitle
            title={t("promiseTitle")}
            subtitle={t("promiseSubtitle")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {promisePillars.map((pillar, i) => (
              <PillarCard
                key={pillar.id}
                title={localized(pillar.title, loc)}
                description={localized(pillar.description, loc)}
                icon={pillar.icon}
                index={i}
                tag={pillar.tag ? localized(pillar.tag, loc) : undefined}
                href={pillar.href}
                cta={tCommon("learnMore")}
                image={pillar.image}
                numbered
              />
            ))}
          </div>
        </div>
      </section>

      <StatsSection
        sectionTitle={t("statsTitle")}
        title={t("statsHeadline")}
        subtitle={t("statsSubtitle")}
        image={images.stats}
        stats={keyStats.map((stat) => ({
          value: localized(stat.value, loc),
          label: localized(stat.label, loc),
          icon: stat.icon,
          note: stat.note ? localized(stat.note, loc) : undefined,
          tag: stat.tag ? localized(stat.tag, loc) : undefined,
          featured: stat.featured,
          image: stat.image,
        }))}
      />

      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle title={t("dimensionsTitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dimensions.map((dim, i) => (
              <PillarCard
                key={dim.id}
                title={localized(dim.title, loc)}
                description={localized(dim.description, loc)}
                icon={dim.icon}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <SectionTitle
            title={t("exploreTitle")}
            subtitle={t("exploreSubtitle")}
          />
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {explorePages.map((page, i) => (
              <ExploreCard
                key={page.key}
                title={page.title}
                description={page.description}
                href={page.href}
                image={page.image}
                cta={tCommon("discover")}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <QuoteSection quote={t("quote")} />

      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle title={t("newsTitle")} subtitle={t("newsSubtitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestNews.map((article, i) => (
              <NewsCard
                key={article.slug}
                title={localized(article.title, loc)}
                excerpt={localized(article.excerpt, loc)}
                image={article.image}
                date={formatDate(article.date, loc)}
                category={tNews(`categories.${article.category}`)}
                slug={article.slug}
                index={i}
              />
            ))}
          </div>
          <div className="mt-8 text-center md:mt-10">
            <Link
              href="/actualites"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 w-full border-navy text-navy hover:bg-navy hover:text-white sm:w-auto"
              )}
            >
              {tCommon("viewAll")}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-navy-light py-12 sm:py-16">
        <div className="container-wide flex flex-col items-center gap-5 px-4 text-center sm:flex-row sm:justify-between sm:text-left md:px-8 lg:px-16">
          <h2 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl md:text-3xl">
            {t("galleryCtaTitle")}
          </h2>
          <Link
            href="/galerie"
            className={cn(
              buttonVariants({ size: "lg" }),
              "min-h-11 w-full shrink-0 justify-center bg-gold text-navy hover:bg-gold/90 sm:w-auto"
            )}
          >
            {t("galleryCtaButton")}
          </Link>
        </div>
      </section>

      <CTASection title={t("ctaTitle")} buttonLabel={tCommon("applyNow")} />
    </>
  );
}
