import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteName = "Ninety One Foot Academy";
const description =
  "Académie de football à Douala dédiée au développement sportif, académique et humain des jeunes talents africains.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: ["/og-image.png"],
  },
};

/** Root layout passes through; `<html lang>` is set in `[locale]/layout`. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
