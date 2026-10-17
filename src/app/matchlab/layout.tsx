import type { Metadata, Viewport } from "next";
import { inter } from "@/lib/fonts";
import "./matchlab.css";
export const dynamic = "force-dynamic";
// Light corporate theme only: the white topbar colours the mobile browser chrome.
export const viewport: Viewport = { themeColor: "#ffffff" };
export const metadata: Metadata = {
  title: { absolute: "N91 MatchLab · Espace privé" },
  robots: { index: false, follow: false, noarchive: true },
  openGraph: null,
  twitter: null,
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} data-scroll-behavior="smooth">
      <body className="ml-body">{children}</body>
    </html>
  );
}
