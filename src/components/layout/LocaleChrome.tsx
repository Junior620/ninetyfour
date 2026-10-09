"use client";

import { usePathname } from "@/lib/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/layout/BackToTop";
import { SectionNav } from "@/components/club/SectionNav";

export function LocaleChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <SectionNav />
      <main id="contenu" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">{children}</main>
      <Footer />
      <BackToTop />
    </>
  );
}
