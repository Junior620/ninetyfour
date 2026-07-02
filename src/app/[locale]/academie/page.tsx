import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { PillarCard } from "@/components/cards/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import {
  dimensions,
  whyReasons,
  academySummary,
  historyContent,
  images,
} from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "academy" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "academy" });

  return (
    <>
      <HeroSection
        title={t("title")}
        subtitle={t("subtitle")}
        image={images.academy}
        compact
      />

      <section className="section-padding bg-cream">
        <div className="container-narrow">
          <SectionTitle title={t("historyTitle")} align="left" />
          <p className="text-lg leading-relaxed text-text-muted">
            {localized(historyContent, loc)}
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle title={t("approachTitle")} />
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

      <section className="section-padding bg-navy">
        <div className="container-narrow">
          <SectionTitle title={t("summaryTitle")} light />
          <div className="grid gap-4 sm:grid-cols-2">
            {academySummary.map((item) => (
              <Card key={item.label.fr} className="border-0 bg-navy-light">
                <CardContent className="flex items-center justify-between p-5">
                  <span className="text-sm text-white/70">
                    {localized(item.label, loc)}
                  </span>
                  <span className="font-bold text-gold">
                    {localized(item.value, loc)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <SectionTitle title={t("whyTitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyReasons.map((reason, i) => (
              <PillarCard
                key={reason.id}
                title={localized(reason.title, loc)}
                description={localized(reason.description, loc)}
                icon={reason.icon}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
