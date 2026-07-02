import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { PillarCard } from "@/components/cards/StatCard";
import { PlayerProgressCard } from "@/components/dashboard/PlayerProgressCard";
import { sportDimensions, weeklyProgram, mockPlayer, images } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "training" });
  return { title: t("title"), description: t("heroTitle") };
}

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "training" });

  return (
    <>
      <HeroSection
        title={t("heroTitle")}
        image={images.training}
        compact
      />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <SectionTitle title={t("dimensionsTitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sportDimensions.map((dim, i) => (
              <PillarCard
                key={dim.title.fr}
                title={localized(dim.title, loc)}
                description={localized(dim.description, loc)}
                icon={["Star", "Eye", "Dumbbell", "Heart"][i]}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-navy">
        <div className="container-narrow">
          <SectionTitle title={t("weeklyTitle")} light />
          <div className="grid gap-4 sm:grid-cols-2">
            {weeklyProgram.map((item, i) => (
              <div
                key={item.fr}
                className="flex items-center gap-4 rounded-lg bg-navy-light p-5"
              >
                <span className="text-2xl font-bold text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-white">{localized(item, loc)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-narrow">
          <SectionTitle title={t("playerCardTitle")} />
          <PlayerProgressCard player={mockPlayer} locale={loc} />
        </div>
      </section>
    </>
  );
}
