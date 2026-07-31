import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/schema";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { ProgramTimeline } from "@/components/program/ProgramTimeline";
import { PlayerProgressCard } from "@/components/dashboard/PlayerProgressCard";
import { Check } from "lucide-react";
import { programSteps, playerBenefits, mockPlayer } from "@/lib/data";
import { localized } from "@/lib/utils";
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
    path: "/programme",
    title: t("program.title"),
    description: t("program.description"),
  });
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "program" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const steps = programSteps.map((step) => ({
    title: localized(step.title, loc),
    description: localized(step.description, loc),
    details: localized(step.details, loc),
    image: step.image,
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tNav("home"), path: "/" },
          { name: t("title"), path: "/programme" },
        ])}
      />
      <HeroSection title={t("title")} subtitle={t("subtitle")} compact />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <SectionTitle title={t("timelineTitle")} />
          <ProgramTimeline steps={steps} />
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle title={t("benefitsTitle")} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playerBenefits.map((benefit) => (
              <div
                key={benefit.fr}
                className="flex items-center gap-3 rounded-lg bg-cream p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10">
                  <Check className="h-4 w-4 text-gold" />
                </div>
                <span className="text-sm font-medium text-black-premium">
                  {localized(benefit, loc)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-narrow">
          <PlayerProgressCard player={mockPlayer} locale={loc} />
        </div>
      </section>
    </>
  );
}
