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

## Setup Supabase — Recrutement (PDF + e-mails)

La page `/rejoindre` génère un PDF à partir de la fiche “Fiche d’enregistrement”, puis l’upload vers Supabase (Storage) et stocke les métadonnées en base (table `recruitment_applications`). Un e-mail est envoyé au candidat et un e-mail de notification à l’admin via Resend.

### Buckets Storage requis

Dans Supabase Storage, crée :
- `recruitment-photos` (photos)
- `recruitment-docs` (documents fournis)
- `recruitment-pdfs` (PDF générés)

Conseil : garde ces buckets en mode privé et utilise les liens signés (créés côté serveur).

### Table Postgres requise

Créer une table (SQL à exécuter dans Supabase SQL Editor) :

```sql
create table if not exists public.recruitment_applications (
  id uuid default gen_random_uuid() primary key,
  form_data jsonb not null,
  photo_path text,
  pdf_path text,
  docs_paths jsonb default '{}'::jsonb,
  status text not null default 'PENDING',
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);
```

La route admin liste ces enregistrements et génère un lien signé vers `pdf_path`.

### Variables d’environnement e-mail (Resend)

Dans `.env` (côté serveur / Vercel), définir :
- `RESEND_API_KEY`
- `ADMIN_EMAIL` (email destinataire admin)
- `SENDER_EMAIL` (email expéditeur)

Sans ces variables, le PDF sera généré mais les e-mails ne seront pas envoyés.

## Déploiement Vercel

### Prérequis

- Compte [Vercel](https://vercel.com) (gratuit)
- Repo GitHub : `https://github.com/Junior620/ninetyfour.git`
- Node.js **20+** (défini dans `.nvmrc`)

### Étapes

1. **Pousser le code sur GitHub**
   ```bash
   git add .
   git commit -m "feat: préparation déploiement Vercel"
   git push origin master
   ```

2. **Importer le projet sur Vercel**
   - [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
   - Sélectionner `Junior620/ninetyfour`
   - Framework détecté automatiquement : **Next.js**
   - Build Command : `npm run build` (par défaut)
   - Install Command : `npm install` (par défaut)

3. **Variables d'environnement** (onglet *Environment Variables*)

   | Variable | Obligatoire | Description |
   |----------|-------------|-------------|
   | `NEXT_PUBLIC_SITE_URL` | Recommandé | URL finale, ex. `https://ninetyfour.vercel.app` |
   | `DATABASE_URL` | Phase 2 | PostgreSQL Supabase |
   | `NEXT_PUBLIC_SUPABASE_URL` | Phase 2 | URL projet Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 2 | Clé publique Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | Clé serveur (ne pas exposer côté client) |

   > **MVP** : seul `NEXT_PUBLIC_SITE_URL` est utile. Les formulaires fonctionnent sans base de données.

4. **Déployer** → Vercel build et publie automatiquement.

5. **Domaine personnalisé** (optionnel)
   - *Project Settings → Domains* → ajouter votre nom de domaine
   - Mettre à jour `NEXT_PUBLIC_SITE_URL` avec l'URL définitive

### Déploiement via CLI (alternative)

```bash
npm i -g vercel
vercel login
vercel          # premier déploiement (preview)
vercel --prod   # production
```

### Configuration incluse

- `vercel.json` — région **Paris (cdg1)**, en-têtes de sécurité
- `src/app/sitemap.ts` — sitemap multilingue FR/EN
- `src/app/robots.ts` — indexation (dashboard et API exclus)
- `metadataBase` dynamique via `VERCEL_URL` ou `NEXT_PUBLIC_SITE_URL`

### Après le déploiement

- Accueil FR : `https://votre-url.vercel.app/fr`
- Accueil EN : `https://votre-url.vercel.app/en`
- La racine `/` redirige automatiquement vers `/fr`

## Partenaires

- **Voak Sport** — équipementier officiel
- **Footbar** — données de performance
- **Veo** — analyse vidéo

---

© 2026 Ninety One Foot Academy — Douala, Cameroun
