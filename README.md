# Ninety One Foot Academy — V2

Site bilingue français / anglais de l’académie de Douala. La V2 conserve l’identité, les textes et les actifs du projet, et reprend les dispositions fonctionnelles documentées du Mans FC.

Voir [V2_LIVRAISON.md](V2_LIVRAISON.md) pour les routes, les choix de conception, les captures et les résultats de recette.

## Démarrer en local

Prérequis : Node.js 20 ou supérieur et dépendances du projet installées.

```powershell
npm install
npm run dev -- --webpack --hostname 127.0.0.1
```

Ouvrir [l’accueil français](http://127.0.0.1:3000/fr) ou [l’accueil anglais](http://127.0.0.1:3000/en).

Le mode Webpack est le repli vérifié sur ce poste : Turbopack y a rencontré une erreur interne de sous-processus CSS. Le script habituel `npm run dev` reste disponible.

## Vérifications et aperçu de production

```powershell
npm test
npx tsc --noEmit
npm run lint
$env:SITE_INDEXING = 'disabled'
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1
```

Arrêter le serveur de développement avant de lancer un autre serveur sur le port 3000. `SITE_INDEXING=disabled` conserve les aperçus hors indexation.

Avec l’aperçu démarré, la recette HTTP utilise exclusivement des requêtes GET locales :

```powershell
node scripts/verify-public-v2.mjs
```

Le résultat est enregistré dans [artifacts/v2/http-report.json](artifacts/v2/http-report.json). Pour un autre port local, définir `V2_BASE_URL`, par exemple `http://127.0.0.1:3001`.

Les tests interactifs de formulaires peuvent utiliser `node scripts/mock-form-preview.mjs`, puis le port local 3002. Ce proxy bloque toute mutation vers l’application et renvoie une erreur au premier essai, puis une réception fictive. Il sert exclusivement à la recette et ne doit jamais être déployé.

## Architecture

- Next.js 16.2, App Router, React 19, TypeScript, Tailwind CSS 4.
- `next-intl` : toutes les pages publiques portent le préfixe `/fr` ou `/en`.
- `src/components/club/` : modèles éditoriaux et sportifs partagés.
- `src/components/layout/` : navigation, sous-navigation et pied de page.
- `src/lib/data/` : contenus éditoriaux existants ; `src/lib/club.ts` : contrats et sélecteurs publics sportifs.
- `src/lib/validations/` et `src/lib/recruitment/attachments.ts` : validation commune des formulaires et pièces.
- `src/app/api/` : contact, candidatures, authentification et administration.
- `tests/` : tests automatisés avec services simulés ; aucune écriture dans les données du club.

Les actualités et les rubriques publiques sont alimentées par les modules de données du dépôt. Il n’y a pas de CMS externe raccordé par cette V2. Les joueurs fictifs des anciens tableaux de bord ne sont pas utilisés comme effectif public.

## Contenus et routes

| Rubrique | Route sans préfixe de langue |
|---|---|
| Accueil | `/` |
| Académie et projet | `/academie`, `/vision`, `/programme` |
| Formation et accompagnement | `/formation-sportive`, `/education`, `/performance-lab`, `/encadrement` |
| Équipes et catégories | `/equipes`, `/equipes/u14`, `/equipes/u16`, `/equipes/u18` |
| Saison | `/saison` |
| Actualités | `/actualites`, `/actualites/[slug]` |
| Médias | `/galerie` |
| Entreprises | `/partenaires`, `/parrains` |
| Services | `/rejoindre`, `/contact`, `/informations-legales`, `/confidentialite` |
| Espace privé | `/login`, `/dashboard/*` |

Les fiches `/matchs/[id]` et `/joueurs/[slug]` ne sont publiées que si une donnée réelle existe. Actuellement, matchs, classement et effectifs publics restent vides. Les états vides orientent vers les rubriques utiles. Aucune offre de billetterie ou boutique n’est inventée.

Les fiches sont générées depuis les données locales avec `dynamicParams=false` : reconstruire le site après ajout d’un article, d’une équipe, d’un match ou d’un joueur public. Les chemins absents renvoient HTTP 404 dans le build de production.

Partenaires présentés : **Astra Invest**, **Voak Sport**, **Johny Sport Consulting**. Les mentions historiques de Footbar et Veo sont conservées dans les contenus existants correspondants.

## Services de formulaires

Copier `.env.example` vers `.env.local` pour préparer un environnement personnel, puis renseigner seulement les services nécessaires. Ne pas publier les clés serveur.

| Service | Variables requises |
|---|---|
| URL canonique | `NEXT_PUBLIC_SITE_URL` |
| Contact / notifications | `RESEND_API_KEY`, `ADMIN_EMAIL`, `SENDER_EMAIL` |
| Stockage des candidatures | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Authentification existante | Configuration Supabase, `AUTH_SECRET` |
| Aperçu sans indexation | `SITE_INDEXING=disabled` |

La candidature requiert la table `recruitment_applications` et les buckets privés `recruitment-photos`, `recruitment-docs`, `recruitment-pdfs` de l’infrastructure existante. Les scripts `db:push` et `db:seed` sont des opérations d’administration distinctes ; ils ne sont pas nécessaires à la recette de la V2 et n’ont pas été exécutés pour celle-ci.

Le contact confirme la réception uniquement après acceptation de la notification par le service d’envoi. Une candidature confirme la réception après stockage des fichiers et enregistrement en base ; un échec d’e-mail ne supprime pas ce dossier. Un service requis indisponible renvoie une erreur explicite.

Photo : JPEG/PNG, 5 Mo maximum. Pièces : PDF/JPEG/PNG, 10 Mo maximum par fichier. Les pièces déclarées fournies sont obligatoires et vérifiées avant PDF et stockage. Les saisies sont conservées après erreur ; le bouton de nouvelle candidature remet le formulaire à zéro après succès.

Aucune publication en production, migration ni initialisation de base n’est incluse dans cette livraison.

## Préparer Vercel

Importer le dépôt avec le preset Next.js et le dossier racine `.`. `vercel.json` fixe le build `npm run build -- --webpack`, la région Paris, la redirection vers le domaine www et les en-têtes de sécurité. L'installation exécute `prisma generate`, sans migration ni seed.

Renseigner les variables de `.env.example` dans les paramètres Vercel, avec des services de test distincts pour Preview. Les noms e-mail privilégiés sont `EMAIL_FROM`, `EMAIL_REPLY_TO` et `ADMIN_NOTIFICATION_EMAIL` ; `SENDER_EMAIL` et `ADMIN_EMAIL` restent des fallbacks. Ne pas définir `SITE_INDEXING=disabled` en production si le site doit être indexé. Les previews Vercel sont automatiquement exclues de l'indexation.

**Point bloquant pour les grandes candidatures :** le formulaire transmet actuellement ses fichiers à une fonction Next.js. Vercel limite le corps total d'une requête à 4,5 Mo, alors que le formulaire accepte une photo de 5 Mo et des documents de 10 Mo chacun. Avant ouverture du recrutement en production Vercel, implémenter des téléversements directs signés vers le stockage privé, puis valider les fichiers côté serveur avant enregistrement. Augmenter `maxDuration` ne résout pas cette limite. Source : [limites Vercel Functions](https://vercel.com/docs/functions/limitations#request-body-size).

Le build local ne confirme pas les secrets, les permissions de stockage ni les réglages du projet Vercel distant. La limitation des requêtes et l'idempotence en mémoire ne sont pas partagées entre instances ; prévoir un stockage commun pour ces protections en production à plusieurs instances.
