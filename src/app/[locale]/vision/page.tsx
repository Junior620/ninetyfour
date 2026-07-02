import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { QuoteSection } from "@/components/sections/QuoteSection";
import { PillarCard } from "@/components/cards/StatCard";
import { visionContent, values, images } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vision" });
  return { title: t("title") };
}

export default async function VisionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "vision" });

  const blocks = [
    { title: t("visionTitle"), content: visionContent.vision },
    { title: t("missionTitle"), content: visionContent.mission },
    { title: t("engagementTitle"), content: visionContent.engagement },
  ];

  return (
    <>
      <HeroSection title={t("title")} image={images.team} compact />

      <section className="section-padding bg-cream">
        <div className="container-narrow space-y-12">
          {blocks.map((block) => (
            <div key={block.title}>
              <h2 className="text-xl font-bold uppercase tracking-wide text-black-premium md:text-2xl">
                {block.title}
              </h2>
              <div className="mt-2 h-1 w-12 bg-gold" />
              <p className="mt-4 text-lg leading-relaxed text-text-muted">
                {localized(block.content, loc)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle title={t("valuesTitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {values.map((value, i) => (
              <PillarCard
                key={value.id}
                title={localized(value.title, loc)}
                description={localized(value.description, loc)}
                icon={value.icon}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <QuoteSection quote={t("quote")} />
    </>
  );
}
