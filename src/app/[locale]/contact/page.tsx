import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/schema";
import { HeroSection } from "@/components/sections/HeroSection";
import { SectionTitle } from "@/components/sections/SectionTitle";
import { ContactForm } from "@/components/forms/ContactForm";
import { buttonVariants } from "@/components/ui/button";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { contactInfo } from "@/lib/data";
import { localized, cn } from "@/lib/utils";
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
    path: "/contact",
    title: t("contact.title"),
    description: t("contact.description"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "contact" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tNav("home"), path: "/" },
          { name: t("title"), path: "/contact" },
        ])}
      />
      <HeroSection title={t("title")} subtitle={t("subtitle")} compact />

      <section className="section-padding bg-cream">
        <div className="container-wide grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold" />
              <div>
                <h3 className="font-bold text-black-premium">{t("address")}</h3>
                <p className="text-text-muted">
                  {localized(contactInfo.address, loc)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-gold" />
              <div>
                <h3 className="font-bold text-black-premium">
                  {t("emailLabel")}
                </h3>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-royal hover:underline"
                >
                  {contactInfo.email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-gold" />
              <div>
                <h3 className="font-bold text-black-premium">
                  {loc === "fr" ? "Téléphone" : "Phone"}
                </h3>
                {contactInfo.phone ? (
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                    className="text-royal hover:underline"
                  >
                    {contactInfo.phone}
                  </a>
                ) : (
                  <p className="text-text-muted">{t("phonePending")}</p>
                )}
              </div>
            </div>

            {contactInfo.whatsapp ? (
              <a
                href={contactInfo.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants(),
                  "w-full justify-center bg-[#25D366] text-white hover:bg-[#25D366]/90 sm:w-auto"
                )}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {tCommon("whatsapp")}
              </a>
            ) : null}

            <div className="overflow-hidden rounded-lg">
              <iframe
                title={
                  loc === "fr"
                    ? "Carte de Douala, Cameroun"
                    : "Map of Douala, Cameroon"
                }
                src="https://www.openstreetmap.org/export/embed.html?bbox=9.65%2C4.02%2C9.78%2C4.08&layer=mapnik&marker=4.0511%2C9.7679"
                className="h-[300px] w-full border-0"
                loading="lazy"
              />
            </div>
          </div>

          <div>
            <SectionTitle title={t("formTitle")} align="left" />
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
