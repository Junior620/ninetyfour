import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { QuoteSection } from "@/components/sections/QuoteSection";
import { Check } from "lucide-react";
import { educationSections, images } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "education" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function EducationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "education" });

  const sections = [
    { title: t("academicTitle"), items: educationSections.academic },
    { title: t("personalTitle"), items: educationSections.personal },
    { title: t("futureTitle"), items: educationSections.future },
  ];

  return (
    <>
      <HeroSection
        title={t("title")}
        subtitle={t("subtitle")}
        image={images.education}
        compact
      />

      {sections.map((section, si) => (
        <section
          key={section.title}
          className={`section-padding ${si % 2 === 0 ? "bg-cream" : "bg-white"}`}
        >
          <div className="container-narrow">
            <SectionTitle title={section.title} align="left" />
            <div className="grid gap-3 sm:grid-cols-2">
              {section.items.map((item) => (
                <div key={item.fr} className="flex items-center gap-3">
                  <Check className="h-5 w-5 shrink-0 text-gold" />
                  <span className="text-text-muted">{localized(item, loc)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <QuoteSection quote={t("quote")} />
    </>
  );
}
