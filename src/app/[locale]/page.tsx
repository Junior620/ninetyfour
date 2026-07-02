import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { CTASection } from "@/components/sections/CTASection";
import { QuoteSection } from "@/components/sections/QuoteSection";
import { StatCard, PillarCard } from "@/components/cards/StatCard";
import { PartnerCard } from "@/components/cards/PartnerCard";
import {
  promisePillars,
  dimensions,
  keyStats,
  images,
  partners,
} from "@/lib/data";
import { localized } from "@/lib/utils";
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

  return (
    <>
      <HeroSection
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        image={images.hero}
        badges={[
          t("badges.age"),
          t("badges.sessions"),
          t("badges.location"),
          t("badges.tracking"),
        ]}
        primaryCta={{ label: tNav("join"), href: "/rejoindre" }}
        secondaryCta={{ label: t("discoverProgram"), href: "/programme" }}
      />

      <section className="border-y border-border bg-white py-10">
        <div className="container-wide px-4">
          <p className="mb-8 text-center text-sm text-text-muted">
            {t("partnersBand")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-12">
            {partners.map((p, i) => (
              <PartnerCard key={p.id} name={p.name} role="" description="" compact index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <SectionTitle title={t("promiseTitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {promisePillars.map((pillar, i) => (
              <PillarCard
                key={pillar.id}
                title={localized(pillar.title, loc)}
                description={localized(pillar.description, loc)}
                icon={pillar.icon}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-navy">
        <div className="container-wide">
          <SectionTitle title={t("statsTitle")} light />
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {keyStats.map((stat) => (
              <StatCard
                key={stat.label.fr}
                value={stat.value}
                label={localized(stat.label, loc)}
              />
            ))}
          </div>
        </div>
      </section>

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

      <QuoteSection quote={t("quote")} />

      <CTASection title={t("ctaTitle")} buttonLabel={tCommon("applyNow")} />
    </>
  );
}
