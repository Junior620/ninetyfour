import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { CTASection } from "@/components/sections/CTASection";
import { PartnerCard } from "@/components/cards/PartnerCard";
import { PillarCard } from "@/components/cards/StatCard";
import { partners, partnerBenefits } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partners" });
  return { title: t("title"), description: t("heroTitle") };
}

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "partners" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <>
      <HeroSection title={t("heroTitle")} compact />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-3">
            {partners.map((partner, i) => (
              <PartnerCard
                key={partner.id}
                name={partner.name}
                role={localized(partner.role, loc)}
                description={localized(partner.description, loc)}
                website={partner.website}
                logo={partner.logo}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle title={t("whyTitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {partnerBenefits.map((benefit, i) => (
              <PillarCard
                key={benefit.title.fr}
                title={localized(benefit.title, loc)}
                description={localized(benefit.description, loc)}
                icon={["Award", "Cpu", "Target", "Globe"][i]}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title={t("ctaTitle")}
        buttonLabel={tCommon("contactUs")}
        href="/contact"
        dark={false}
      />
    </>
  );
}
