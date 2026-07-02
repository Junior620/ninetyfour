# Ninety One Foot Academy

Plateforme web premium pour **Ninety One Foot Academy** — académie de football basée à Douala, Cameroun, dédiée au développement sportif, académique et humain des jeunes talents africains (15–17 ans).

**Talent. Éducation. Performance.**

## Stack technique

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **Framer Motion** — animations sobres
- **next-intl** — internationalisation FR/EN
- **React Hook Form** + **Zod** — formulaires validés
- **Recharts** — graphiques de performance
- **Prisma** — schéma PostgreSQL préparé
- **Supabase** — auth, DB et storage (phase 2)

## Installation

```bash
npm install
npm run dev
```

L'application démarre sur [http://localhost:3000/fr](http://localhost:3000/fr).

## Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Vérification ESLint |

## Structure du projet

```
src/
├── app/[locale]/          # Pages (routes i18n)
├── components/
│   ├── layout/            # Header, Footer, Sidebar, Dashboard
│   ├── sections/          # Hero, CTA, Quote, SectionTitle
│   ├── cards/             # StatCard, PillarCard, PartnerCard...
│   ├── forms/             # Candidature, Contact, Évaluation
│   ├── charts/            # PerformanceChart (Recharts)
│   └── gallery/           # GalleryGrid
├── lib/
│   ├── data/              # Données mockées (éditables)
│   ├── i18n/              # Configuration next-intl
│   └── validations/       # Schémas Zod
├── messages/              # Traductions UI (fr.json, en.json)
└── types/                 # Types TypeScript
prisma/
└── schema.prisma          # Modèles DB (futur backend)
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Accueil |
| `/academie` | Présentation de l'académie |
| `/vision` | Vision & valeurs |
| `/programme` | Parcours de développement |
| `/formation-sportive` | Formation football |
| `/education` | Éducation & développement personnel |
| `/performance-lab` | Outils technologiques |
| `/partenaires` | Voak Sport, Footbar, Veo |
| `/actualites` | Articles avec filtres |
| `/galerie` | Photos et vidéos |
| `/rejoindre` | Formulaire de candidature |
| `/contact` | Contact + carte Douala |
| `/login` | Espace privé (simulation) |
| `/dashboard/*` | Tableaux de bord par rôle |

## Internationalisation

Les routes sont préfixées par la locale : `/fr/...` et `/en/...`.

- **UI** : modifier `src/messages/fr.json` et `src/messages/en.json`
- **Contenu éditorial** : modifier les fichiers dans `src/lib/data/`

## Données mockées

Tout le contenu éditorial est centralisé dans `src/lib/data/` :

- `academy.ts` — informations académie, valeurs, stats
- `partners.ts` — partenaires
- `program.ts` — programme, formation, éducation
- `news.ts` — articles d'actualités
- `gallery.ts` — médias
- `players.ts` — joueurs fictifs, dashboards

## Espace privé (MVP)

La page `/login` permet de simuler 4 profils :

- **Joueur** — progression, objectifs, vidéos
- **Parent** — suivi scolaire, présences, messages
- **Coach** — liste joueurs, évaluations
- **Admin** — gestion globale

Le rôle est stocké en `localStorage`. L'authentification Supabase sera branchée en phase 2.

## Connexion Supabase (futur)

1. Copier `.env.example` vers `.env`
2. Renseigner `DATABASE_URL` et les clés Supabase
3. Exécuter `npx prisma migrate dev`
4. Brancher les API routes sur Prisma

## Déploiement Vercel

1. Pousser le repo sur GitHub
2. Importer sur [vercel.com](https://vercel.com)
3. Configurer les variables d'environnement
4. Déployer

## Partenaires

- **Voak Sport** — équipementier officiel
- **Footbar** — données de performance
- **Veo** — analyse vidéo

---

© 2026 Ninety One Foot Academy — Douala, Cameroun
