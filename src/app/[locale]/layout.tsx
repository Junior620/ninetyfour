import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import { LocaleChrome } from "@/components/layout/LocaleChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { Analytics } from "@/components/seo/Analytics";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/schema";
import { sora, inter } from "@/lib/fonts";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "fr" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const loc = locale as "fr" | "en";

  return (
    <html
      lang={locale}
      className={`${sora.variable} ${inter.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans antialiased">
        <JsonLd data={organizationJsonLd(loc)} />
        <JsonLd data={websiteJsonLd(loc)} />
        <NextIntlClientProvider messages={messages}>
          <LocaleChrome>{children}</LocaleChrome>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
