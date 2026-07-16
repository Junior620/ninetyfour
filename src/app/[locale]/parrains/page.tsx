import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Gift,
  Megaphone,
  Handshake,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { CTASection } from "@/components/sections/CTASection";
import { AmbassadorsSection } from "@/components/sections/AmbassadorsSection";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ambassadors } from "@/lib/data";
import type { Locale } from "@/types";

const howToIcons: LucideIcon[] = [Gift, Megaphone, Handshake, Globe];
const howToKeys = [
  "donations",
  "visibility",
  "partners",
  "connections",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ambassadors" });
  return { title: t("title"), description: t("intro") };
}

export default async function AmbassadorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "ambassadors" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <>
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

      <AmbassadorsSection
        ambassadors={ambassadors}
        title={t("heroTitle")}
        subtitle={t("sectionSubtitle")}
        locale={loc}
        background="white"
      />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <SectionTitle title={t("howToTitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howToKeys.map((key, i) => {
              const Icon = howToIcons[i];
              return (
                <ScrollReveal
                  key={key}
                  variant="fadeUp"
                  delay={i * 0.08}
                  className="hover-lift rounded-2xl border border-border bg-white p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                    <Icon className="h-6 w-6 text-gold" />
                  </div>
                  <p className="text-sm font-medium text-navy sm:text-base">
                    {t(`howToItems.${key}`)}
                  </p>
                </ScrollReveal>
              );
            })}
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
