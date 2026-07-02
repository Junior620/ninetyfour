import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { Check } from "lucide-react";
import { joinConditions, joinProcess } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "join" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "join" });

  return (
    <>
      <HeroSection title={t("title")} subtitle={t("subtitle")} compact />

      <section className="section-padding bg-cream">
        <div className="container-wide grid gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle title={t("conditionsTitle")} align="left" />
            <ul className="space-y-3">
              {joinConditions.map((cond) => (
                <li key={cond.fr} className="flex items-center gap-3">
                  <Check className="h-5 w-5 shrink-0 text-gold" />
                  <span className="text-text-muted">{localized(cond, loc)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <SectionTitle title={t("processTitle")} align="left" />
              <ol className="space-y-4">
                {joinProcess.map((step, i) => (
                  <li key={step.fr} className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-gold">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-text-muted">
                      {localized(step, loc)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div>
            <SectionTitle title={t("formTitle")} align="left" />
            <ApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
