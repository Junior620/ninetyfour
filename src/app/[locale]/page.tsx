import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { words } from "@/lib/club";
import { partners } from "@/lib/data/partners";
import { contactInfo } from "@/lib/data/academy";
import type { Locale } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({
    locale, path: "/", title: "Ninety One Foot Academy — Douala", absoluteTitle: true,
    description: words(locale,
      "Bienvenue dans l’univers Ninety One. Entrez sur le site officiel, découvrez nos médias ou rejoignez l’académie à Douala.",
      "Welcome to Ninety One. Enter the official website, explore our media or join the academy in Douala."),
  });
}

export default async function Welcome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  return (
    <div className="welcome-page">
      <a href="#contenu" className="club-skip">{words(loc, "Aller au contenu", "Skip to content")}</a>
      <div className="welcome-shell">
        <header className="welcome-header">
          <p className="welcome-location"><span aria-hidden />{words(loc, "Douala, Cameroun", "Douala, Cameroon")}<small>Talent. {words(loc, "Éducation", "Education")}. Performance.</small></p>
          <div className="welcome-brands">
            <Link href="/accueil" aria-label={words(loc, "Ninety One Foot Academy — site officiel", "Ninety One Foot Academy — official website")}>
              <Image src="/logo-crest.png" alt="Ninety One Foot Academy" width={88} height={88} preload />
            </Link>
            <span className="welcome-brand-divider" aria-hidden />
            <Link href="/galerie" className="welcome-tv-mark" aria-label={words(loc, "N91 TV — découvrir nos médias", "N91 TV — explore our media")}>
              <Image src="/n91-tv-logo.png" alt="Ninety One TV" width={220} height={256} preload />
            </Link>
          </div>
          <nav className="welcome-languages" aria-label={words(loc, "Choisir la langue", "Choose language")}>
            <Link href="/" locale="fr" lang="fr" aria-label="Français" aria-current={loc === "fr" ? "page" : undefined}>FR</Link><span aria-hidden>/</span>
            <Link href="/" locale="en" lang="en" aria-label="English" aria-current={loc === "en" ? "page" : undefined}>EN</Link>
          </nav>
        </header>

        <main id="contenu" tabIndex={-1} className="welcome-main">
          <div className="welcome-intro">
            <p className="welcome-eyebrow">{words(loc, "Bienvenue dans notre univers", "Welcome to our world")}</p>
            <h1>{words(loc, "Le talent nous", "Talent brings us")} <em>{words(loc, "rassemble.", "together.")}</em></h1>
            <p>{words(loc, "Un club. Des ambitions. Une génération à faire grandir.", "One club. Shared ambition. A generation to nurture.")}</p>
          </div>
          <nav className="welcome-destinations" aria-label={words(loc, "Explorer Ninety One", "Explore Ninety One")}>
            <Link href="/accueil" className="welcome-card welcome-official">
              <Image src="/hero-3.jpeg" alt="" fill sizes="(min-width: 1024px) 48vw, 100vw" preload />
              <span className="welcome-card-top"><span>{words(loc, "Toute la vie du club", "The life of our club")}</span><span className="welcome-card-number">01</span></span>
              <div className="welcome-card-copy"><p>NINETY ONE FOOT ACADEMY</p><h2>{words(loc, "Site officiel", "Official website")}</h2>
                <span className="welcome-card-description">{words(loc, "Nos équipes, nos actualités, notre ambition.", "Our teams, our news, our ambition.")}</span>
                <span className="welcome-enter">{words(loc, "Entrer dans le site", "Enter the website")}<ArrowUpRight size={20} aria-hidden /></span>
              </div>
            </Link>
            <Link href="/galerie" className="welcome-card welcome-media">
              <Image src="/hero-4.jpeg" alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 600px) 50vw, 100vw" />
              <span className="welcome-card-top"><span>{words(loc, "Au plus près du club", "Closer to the club")}</span><span className="welcome-card-number">02</span></span>
              <div className="welcome-card-copy"><p>{words(loc, "L’académie en images", "The academy in pictures")}</p><h2>N91 <span className="welcome-tv-label">TV</span></h2>
                <span className="welcome-card-description">{words(loc, "Visages, instants et coulisses.", "Faces, moments and behind the scenes.")}</span>
                <span className="welcome-card-link">{words(loc, "Explorer nos médias", "Explore our media")}<ArrowUpRight size={20} aria-hidden /></span>
              </div>
            </Link>
            <Link href="/rejoindre" className="welcome-card welcome-join">
              <Image src="/promise-01.png" alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 600px) 50vw, 100vw" />
              <span className="welcome-card-top"><span>{words(loc, "L’avenir se prépare ici", "The future starts here")}</span><span className="welcome-card-number">03</span></span>
              <div className="welcome-card-copy"><p>{words(loc, "Le prochain chapitre", "The next chapter")}</p><h2>{words(loc, "À toi de jouer.", "Your next move.")}</h2>
                <span className="welcome-card-description">{words(loc, "Fais grandir ton talent avec nous.", "Develop your talent with us.")}</span>
                <span className="welcome-card-link">{words(loc, "Rejoindre l’académie", "Join the academy")}<ArrowUpRight size={20} aria-hidden /></span>
              </div>
            </Link>
          </nav>
          <div className="welcome-follow">
            <a href="#partenaires" className="welcome-partner-anchor">{words(loc, "Une ambition partagée", "A shared ambition")}<ArrowDown size={16} aria-hidden /></a>
            <div><span>{words(loc, "Le club, au quotidien", "Everyday club life")}</span><a href={contactInfo.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg></a><a href={contactInfo.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><span className="welcome-facebook" aria-hidden>f</span></a></div>
          </div>
          <section className="welcome-partners" id="partenaires" aria-labelledby="welcome-partners-title">
            <div className="welcome-partners-heading"><div><p className="welcome-eyebrow">{words(loc, "À nos côtés", "By our side")}</p><h2 id="welcome-partners-title">{words(loc, "Nos partenaires", "Our partners")}</h2></div><Link href="/partenaires">{words(loc, "Découvrir nos partenaires", "Meet our partners")}<ArrowUpRight size={18} aria-hidden /></Link></div>
            <div className="welcome-partner-grid">{partners.map(partner => <Link key={partner.id} href={`/partenaires#${partner.id}`}>
              <div className="welcome-partner-logo">{partner.logo && <Image src={partner.logo} alt={partner.name} fill sizes="(min-width: 768px) 220px, 180px" />}</div><span>{partner.role[loc]}</span>
            </Link>)}</div>
          </section>
        </main>
        <footer className="welcome-footer"><p>© {new Date().getFullYear()} Ninety One Foot Academy</p><nav aria-label={words(loc, "Liens utiles", "Useful links")}><Link href="/contact">Contact</Link><Link href="/informations-legales">{words(loc, "Informations légales", "Legal information")}</Link><Link href="/confidentialite">{words(loc, "Confidentialité", "Privacy")}</Link><Link href="/login">{words(loc, "Espace privé", "Member area")}</Link></nav></footer>
      </div>
    </div>
  );
}
