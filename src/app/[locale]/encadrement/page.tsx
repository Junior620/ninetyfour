import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/schema";
import { HeroSection } from "@/components/sections/HeroSection";
import { CTASection } from "@/components/sections/CTASection";
import { StaffGridSection } from "@/components/sections/StaffGridSection";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { staffMembers } from "@/lib/data";
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
    path: "/encadrement",
    title: t("coaching.title"),
    description: t("coaching.description"),
  });
}

export default async function CoachingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "coaching" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tNav("home"), path: "/" },
          { name: t("title"), path: "/encadrement" },
        ])}
      />
      <HeroSection title={t("heroTitle")} compact />

      <section className="section-padding bg-cream">
        <div className="container-narrow">
          <ScrollReveal variant="fadeUp">
            <p className="text-center text-base leading-relaxed text-text-muted sm:text-lg">
              {t("intro")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <StaffGridSection
        members={staffMembers}
        title={t("sectionTitle")}
        subtitle={t("sectionSubtitle")}
        locale={loc}
        background="white"
      />

      <CTASection
        title={t("ctaTitle")}
        buttonLabel={t("ctaButton")}
        href="/equipes"
        dark={false}
      />
    </>
  );
}
