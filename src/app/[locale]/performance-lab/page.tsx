import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/schema";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { PillarCard, MetricCard } from "@/components/cards/StatCard";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import {
  performanceTools,
  performanceMetrics,
  performanceChartData,
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
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/performance-lab",
    title: t("performanceLab.title"),
    description: t("performanceLab.description"),
  });
}

export default async function PerformanceLabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "performanceLab" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tNav("home"), path: "/" },
          { name: t("title"), path: "/performance-lab" },
        ])}
      />
      <HeroSection
        title={t("heroTitle")}
        image={images.performance}
        compact
      />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <SectionTitle title={t("toolsTitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {performanceTools.map((tool, i) => (
              <PillarCard
                key={tool.title.fr}
                title={localized(tool.title, loc)}
                description={localized(tool.description, loc)}
                icon={["Cpu", "TrendingUp", "Dumbbell", "BarChart3", "Heart"][i]}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle title={t("metricsTitle")} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {performanceMetrics.map((metric) => (
              <MetricCard
                key={metric.key}
                label={localized(metric.label, loc)}
                value={metric.value}
                trend={metric.trend}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-narrow">
          <PerformanceChart
            data={performanceChartData}
            title={t("chartTitle")}
          />
        </div>
      </section>

      <section className="section-padding bg-navy">
        <div className="container-narrow text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
            {t("methodTitle")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-white/70">
            {loc === "fr"
              ? "La donnée transforme l'entraînement en progression mesurable. Chaque séance, chaque match et chaque test alimentent un tableau de bord personnalisé qui guide le joueur et le staff vers l'excellence."
              : "Data transforms training into measurable progress. Every session, every match and every test feeds a personalized dashboard that guides the player and staff towards excellence."}
          </p>
        </div>
      </section>
    </>
  );
}
