import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/schema";
import { HeroSection } from "@/components/sections/HeroSection";
import { CTASection } from "@/components/sections/CTASection";
import { TeamCategorySection } from "@/components/sections/TeamCategorySection";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { teamCategories } from "@/lib/data";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/equipes",
    title: t("teams.title"),
    description: t("teams.description"),
  });
}

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "teams" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tNav("home"), path: "/" },
          { name: t("title"), path: "/equipes" },
        ])}
      />
      <HeroSection title={t("heroTitle")} compact />

      <section className="section-padding bg-cream">
        <div className="container-narrow">
          <ScrollReveal variant="fadeUp">
            <p className="text-center text-base leading-relaxed text-text-muted sm:text-lg">
              {t("intro")}
            </p>
            <p className="mt-4 text-center text-sm italic leading-relaxed text-text-muted/80">
              {t("photoNote")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {teamCategories.map((category, i) => (
        <TeamCategorySection
          key={category.id}
          category={category}
          coachesLabel={t("coachesLabel")}
          locale={loc}
          index={i}
          background={i % 2 === 0 ? "white" : "cream"}
        />
      ))}

      <CTASection
        title={t("ctaTitle")}
        buttonLabel={t("ctaButton")}
        href="/encadrement"
        dark
      />
    </>
  );
}
