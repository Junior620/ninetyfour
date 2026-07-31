# SEO Report — Ninety One Foot Academy

Date : 2026-07-31  
Site : https://www.ninetyonefootacademy.com  

Les volumes de recherche ne sont **pas** issus de Search Console / outils payants : les mots-clés ci-dessous sont des **intentions cibles** (hypothèses), pas des volumes vérifiés.

---

## 1. Problèmes détectés (avant)

| Problème | Impact |
|----------|--------|
| Titre d’accueil dupliqué « NOFA \| NOFA » | CTR / marque diluée |
| Pas de canonical / hreflang | Risque de contenu dupliqué FR/EN |
| `<html>` sans `lang` | Accessibilité + i18n SEO |
| `/login` dans le sitemap | Page privée découvrable |
| `Disallow: /dashboard/` inefficace (URLs `/fr/dashboard/`) | Crawl zones privées |
| Aucun JSON-LD | Pas de rich results Organization |
| Meta absentes actualités / galerie / login | Titres génériques / indexation login |
| Téléphone `+237 6XX…` et WhatsApp factice | Confiance / local SEO |
| Badge FR « Performance tracking » | Mélange linguistique |
| Marquee partenaires ×4 avec alts répétés | Bruit sémantique / a11y |
| Réseaux sociaux = homepages génériques | Schema / E-E-A-T |

---

## 2. Corrections implémentées

- Helper `buildPageMetadata` : title, description, canonical, hreflang (`fr` / `en` / `x-default`), OG, Twitter
- Titres / descriptions uniques par page et langue (`seo.*` dans messages)
- Accueil : `title.absolute` sans duplication
- `lang={locale}` sur `<html>`
- Redirect 301 apex → www (`vercel.json`)
- Sitemap : sans login ; alternates ; lastmod articles
- Robots : `/fr/dashboard/`, `/en/dashboard/`, `/api/` ; host + sitemap
- `noindex` login + dashboards
- JSON-LD : `SportsOrganization`, `WebSite`, `BreadcrumbList`, `Article`
- NAP : placeholders téléphone / WhatsApp / socials retirés de l’indexation Schema
- Marquee : un set sémantique + clones `aria-hidden`
- Footer : lien Galerie ; filtres « Tous » i18n ; aria Header i18n
- IndexNow API + script clé ; GA4 optionnel
- Docs `SEO-SETUP.md` / ce rapport

---

## 3. Fichiers principaux modifiés / créés

**Créés :**  
`src/lib/seo/metadata.ts`, `src/lib/seo/schema.ts`, `src/lib/fonts.ts`, `src/components/seo/JsonLd.tsx`, `src/components/seo/Analytics.tsx`, `src/app/api/indexnow/route.ts`, `src/app/[locale]/login/layout.tsx`, `src/app/[locale]/dashboard/layout.tsx`, `src/app/[locale]/actualites/NewsPageClient.tsx`, `src/app/[locale]/galerie/GalleryPageClient.tsx`, `scripts/ensure-indexnow-key.mjs`, `SEO-SETUP.md`, `SEO-REPORT.md`

**Modifiés :**  
layouts, `sitemap.ts`, `robots.ts`, `vercel.json`, `.env.example`, `package.json`, pages publiques + messages FR/EN, `PartnersMarquee`, `Footer`, `Header`, `academy.ts` (contactInfo), article slug, contact

---

## 4. Avant / après (échantillon)

| Élément | Avant | Après |
|---------|-------|-------|
| Title `/fr` | Ninety One Foot Academy \| Ninety One Foot Academy | Académie de football à Douala \| Ninety One Foot Academy |
| Title `/en` | (même duplication) | Youth Football Academy in Douala \| Ninety One Foot Academy |
| Canonical | absent | self-URL absolue www |
| hreflang | absent | fr + en + x-default |
| Sitemap login | inclus | exclu |
| robots dashboard | `/dashboard/` | `/fr/dashboard/` + `/en/dashboard/` |
| login robots | indexable | `noindex, nofollow` |
| JSON-LD | aucun | Organization + WebSite (+ breadcrumbs / Article) |
| Contact phone | `+237 6XX XXX XXX` | Message « numéro à confirmer » |

---

## 5. Matrice URL (intentions cibles)

Légende index : `index` = indexable ; `noindex` = exclu.

| URL | Intention | KW principal (hyp.) | Title (FR) | H1 (approx.) | Canonical | Index |
|-----|-----------|---------------------|------------|--------------|-----------|-------|
| `/fr` | Découverte locale | académie football Douala | Académie de football à Douala \| … | Former les leaders… | self | index |
| `/en` | Discovery EN | football academy Douala | Youth Football Academy in Douala \| … | Shaping tomorrow’s… | self | index |
| `/fr/academie` | Marque / projet | académie football Cameroun | Académie de football à Douala — Notre projet | Qui sommes-nous ? | self | index |
| `/fr/vision` | Confiance | vision académie football | Vision et valeurs — … | Vision & Valeurs | self | index |
| `/fr/programme` | Parcours | programme formation football Douala | Programme de formation… | Programme | self | index |
| `/fr/formation-sportive` | Formation | formation football jeunes Cameroun | Formation sportive… | Formation sportive | self | index |
| `/fr/education` | Parents / scolaire | suivi scolaire joueurs football | Suivi scolaire joueurs… | Éducation | self | index |
| `/fr/performance-lab` | Perf / tech | centre performance football Cameroun | Centre de performance… | Performance Lab | self | index |
| `/fr/partenaires` | Sponsors | sponsoriser académie football Afrique | Partenaires et sponsors… | hero partenaires | self | index |
| `/fr/parrains` | Mécénat | parrains académie football | Parrains et ambassadeurs… | hero parrains | self | index |
| `/fr/actualites` | Actualité | actualités académie Douala | Actualités — … | Actualités | self | index |
| `/fr/actualites/[slug]` | Éditorial | selon article | titre article | titre article | self | index |
| `/fr/galerie` | Preuve visuelle | galerie académie Douala | Galerie — … | Galerie | self | index |
| `/fr/rejoindre` | Conversion | candidature académie football Cameroun | Candidature académie… | Rejoindre | self | index |
| `/fr/contact` | Contact local | contact académie football Douala | Contact — … | Contact | self | index |
| `/fr/login` | Privé | — | Espace privé | Espace privé | self | **noindex** |
| `/fr/dashboard/*` | Privé | — | — | — | — | **noindex** + auth |

Versions `/en/...` : mêmes chemins, titles EN dans `seo.*`, hreflang réciproque.

---

## 6. Calendrier éditorial 6 mois (priorité qualité)

Ne pas publier des dizaines de pages faibles. Prioriser 1–2 articles profonds / mois (FR + EN).

| Mois | Titre proposé | KW principal | Intention | Public | Priorité |
|------|---------------|--------------|-----------|--------|----------|
| M1 | Comment se préparer à une détection football à Douala | détection football Douala | Info + conversion | Joueurs / parents | Haute |
| M1 | Rejoindre une académie de football au Cameroun : checklist parents | académie football Cameroun | Consideration | Parents | Haute |
| M2 | Suivi scolaire et football : l’équilibre des 15–17 ans | suivi scolaire joueurs football | Info | Parents | Haute |
| M2 | Youth football trials in Douala: what to expect | football trials Douala | Info EN | Players / diaspora | Haute |
| M3 | Nutrition et récupération pour jeunes footballeurs | nutrition jeunes footballeurs | Info | Joueurs / parents | Moyenne |
| M3 | Analyse vidéo et progression : rôle du Performance Lab | performance academy Africa | Info | Recruteurs / joueurs | Moyenne |
| M4 | Vie à l’académie : une semaine type à Douala | académie football Douala | Confiance | Parents | Moyenne |
| M4 | Partnering with an African youth football academy | sponsor football academy Africa | Business | Sponsors | Moyenne |
| M5 | Préparation mentale avant les essais | préparation essais football | Info | Joueurs | Moyenne |
| M5 | Football development pathway in Cameroon | football development Cameroon | Info EN | Clubs | Moyenne |
| M6 | Portrait parcours (joueur réel, autorisé) | formation talents africains | Inspiration | Large | Haute si vrai |
| M6 | Bilan saison / détections (faits vérifiés) | détection football Cameroun | Actualité | Large | Haute |

**Structure type :** H1 intention → intro réponse directe → H2 préparation / critères / conseils → H2 lien académie → CTA `/rejoindre` + `/contact`.  
Liens internes : programme, formation, éducation, contact.

---

## 7. Tests effectués

- `npm run build` : **OK** (TypeScript + SSG pages publiques, `/sitemap.xml`, `/robots.txt`, `/api/indexnow`)
- Routes articles : `generateStaticParams` FR/EN
- Login / dashboard : metadata `noindex`

À faire après déploiement (accès propriétaire) :

- Rich Results Test (Organization + Article)
- Inspection URL GSC
- Lighthouse mobile home / rejoindre / contact (objectifs SEO ≥ 95, perf à mesurer)

---

## 8. Risques et limites

- Contenu parrains / actus / Unsplash / vidéos démo : risque E-E-A-T tant que non validé
- Pas de téléphone / adresse complète en Schema : local SEO incomplet
- Pas d’accès GSC/DNS/Bing dans cette session : configuration documentée seulement
- Aucune garantie de position Google
- Prisma TCP / pooler hors sujet SEO ; auth reste Supabase Auth

---

## 9. Plan de suivi 7 / 30 / 90 jours

Voir aussi `SEO-SETUP.md` § GSC.

| Horizon | Actions |
|---------|---------|
| J+7 | Vérifier sitemap, robots live, title home, noindex login, deploy www redirect |
| J+30 | Requêtes GSC, pages exclues, corriger soft 404, publier 1–2 articles M1 |
| J+90 | CWV, CTR hors marque, conversions `/rejoindre`, compléter NAP + légales |
