"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { usePathname } from "@/lib/i18n/navigation";
import { partners } from "@/lib/data";
import { AcademyLogo } from "./AcademyLogo";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) return null;

  return (
    <footer className="bg-navy text-white">
      <div className="container-wide section-padding">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4">
              <AcademyLogo variant="footer" />
            </div>
            <p className="text-sm leading-relaxed text-white/60">{t("slogan")}</p>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gold">
              {t("academy")}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/academie" className="hover:text-white">{tNav("academy")}</Link></li>
              <li><Link href="/vision" className="hover:text-white">{tNav("vision")}</Link></li>
              <li><Link href="/partenaires" className="hover:text-white">{tNav("partners")}</Link></li>
              <li><Link href="/actualites" className="hover:text-white">{tNav("news")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gold">
              {t("program")}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/programme" className="hover:text-white">{tNav("program")}</Link></li>
              <li><Link href="/formation-sportive" className="hover:text-white">{tNav("training")}</Link></li>
              <li><Link href="/education" className="hover:text-white">{tNav("education")}</Link></li>
              <li><Link href="/performance-lab" className="hover:text-white">{tNav("performanceLab")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gold">
              {t("contact")}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/contact" className="hover:text-white">{tNav("contact")}</Link></li>
              <li><Link href="/rejoindre" className="hover:text-white">{tNav("join")}</Link></li>
              <li><Link href="/login" className="hover:text-white">{tNav("privateSpace")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-white/10 pt-8">
          {partners.map((p) => (
            <span key={p.id} className="text-sm font-bold uppercase tracking-widest text-white/30">
              {p.name}
            </span>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Ninety One Foot Academy. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
