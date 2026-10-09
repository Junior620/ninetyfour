# Livraison V2 — Ninety One Foot Academy

Document de recette locale, mis à jour le 8 octobre 2026. Cette livraison porte sur le site public bilingue et la fiabilité des formulaires existants.

## Décisions et références

L’identité Ninety One est conservée : blason, photographies disponibles, Sora/Inter, bleu nuit, bleu royal, or et fond ivoire. Les six articles et leurs URL restent présents dans les deux langues. Les captures et wireframes du Mans FC servent de références de structure ; leurs marques, textes, résultats et offres commerciales ne sont pas repris comme données de l’académie.

Le cahier `Prompt_Codex_V2_Club.md`, le rapport de veille, l’inventaire, les exemples CMS/API, les quatre captures et les neuf figures ont servi à la reprise. Les exemples CMS/API sont illustratifs et ne constituent pas un flux de données réel. Les états mobiles du rapport étaient des hypothèses : leur comportement est contrôlé sur le site implémenté.

| Référence | Application à Ninety One | Amélioration apportée |
|---|---|---|
| WF01, captures accueil | Identité centrée, navigation principale, grand récit éditorial, portail à trois colonnes, mosaïque de rubriques, rencontres, partenaires | Un récit principal stable, aucune rotation automatique ; ordre mobile hero → rencontres → rubriques et actualités → médias et partenaires |
| WF02 actualités/article | Liste image + métadonnées + texte, recherche, filtres, article autonome, partage et autres lectures | Recherche insensible aux accents, critères dans l’URL, dates lisibles et routes conservées |
| WF02 équipes/saison | Catégories, présentation, rôles de l’encadrement, calendrier/résultats/classement | Fiches de catégories internes, filtres reliés, états vides honnêtes ; dates provisoires exclues du prochain match confirmé |
| WF02 club, WF03 institutionnel | Rubriques de présentation et liens de sous-navigation | Composants communs, ancres explicites, lecture adaptée aux petites largeurs |
| WF03 médias | Sélection d’images, galerie, ouverture en dialogue | Navigation clavier, Échap, restitution du focus ; vidéo seulement si une source réelle existe et chargée au clic |
| WF03 partenaires/contact | Présentation des partenaires et formulaire de contact | Parcours partenaire → contact avec sujet transmis et conservé au changement de langue |
| WF04 header/footer | Blason, utilitaires, familles de navigation, pied de page de service | Menu mobile accessible et navigation clavier ; accès utiles aux formations, équipes, candidatures et contact |
| WF05 accueil recommandé | Récit, rencontres, actualités et programme | Blocs commerciaux et profils publics conditionnés à la disponibilité des données |
| DI01 à DI04 | Relations article/équipe/match/personne et séparation éditorial/sport/services | Contrats typés prêts à recevoir des données ; pas de faux backend, CMS ou résultats publiés |

## Routes et correspondance

Les chemins ci-dessous sont disponibles avec les préfixes `/fr` et `/en`. Les anciens chemins publics sont conservés : aucune redirection destructive n’est nécessaire.

| Ancien chemin | Chemin V2 | Traitement |
|---|---|---|
| `/` | `/` | Accueil éditorial complet |
| `/academie`, `/vision` | Identiques | Présentation et valeurs |
| `/programme`, `/formation-sportive` | Identiques | Programme et formation |
| `/education`, `/performance-lab`, `/encadrement` | Identiques | Accompagnement et rôles |
| `/equipes` | Identique | Annuaire des catégories |
| — | `/equipes/u14`, `/equipes/u16`, `/equipes/u18` | Fiches de catégorie |
| — | `/saison` | Calendrier, résultats et classement filtrables |
| `/actualites` | Identique | Recherche, catégorie, année et pagination |
| `/actualites/[slug]` | Identiques pour les six articles | Article complet et lectures connexes |
| `/galerie` | Identique | Bibliothèque de médias et dialogue |
| `/partenaires`, `/parrains` | Identiques | Entreprises, parrains et contact contextualisé |
| `/contact`, `/rejoindre` | Identiques | Formulaires validés et retours d’erreur/succès |
| — | `/informations-legales`, `/confidentialite` | Informations de service |
| — | `/matchs/[id]`, `/joueurs/[slug]` | Modèles conditionnels ; 404 sans enregistrement publié |
| `/login`, `/dashboard/*` | Identiques | Accès privé préservé, hors indexation publique |

Le sitemap est construit avec les articles et catégories réellement présents. Les aperçus restent en `noindex` via `SITE_INDEXING=disabled`. Les pages possèdent titre, description, canonique et alternances de langue.

## Données et composants

Les textes et actifs existants viennent de `src/lib/data/`, `src/messages/` et `public/`. `src/lib/club.ts` contient les contrats des matchs, personnes publiques, classements et offres ainsi que les sélecteurs. L’absence de données reste explicite : aucun score, joueur, compétition, horaire confirmé, billet ni produit n’est généré pour remplir les pages.

Les composants partagés sont regroupés dans `src/components/club/` : introduction de page, titres de section, liens d’action, cartes d’actualités, rencontres, états vides, partenaires, classement, contenu institutionnel, galerie et partage. `Header`, `SectionNav`, `Footer` et `LocaleChrome` assurent la structure commune.

Les partenaires visibles sont Astra Invest, Voak Sport et Johny Sport Consulting. Le lien de l’équipementier mène au site du partenaire ; il n’est pas présenté comme boutique du club. Les anciens contenus éditoriaux mentionnant Footbar/Veo restent des contenus historiques, sans inventer une offre actuelle.

La vérification visuelle a corrigé l’association de deux fichiers partenaires dont les noms étaient inversés dans le dépôt. Trois anciennes URL d’images indisponibles ont été remplacées par des actifs locaux existants. Les dix URL Unsplash restantes des modules actualités et galerie ont répondu HTTP 200 lors du contrôle en lecture seule.

## Formulaires

- Validation traduite FR/EN, labels associés aux champs et messages d’erreur accessibles.
- Photo JPEG/PNG ≤ 5 Mo ; pièces PDF/JPEG/PNG ≤ 10 Mo par fichier.
- Les pièces déclarées fournies doivent exister et être valides côté navigateur et API ; leur absence renvoie HTTP 400 avant génération du PDF ou stockage.
- La saisie, la photo et les pièces sont conservées après échec. Une nouvelle candidature demandée après succès réinitialise le dossier.
- Le contact ne confirme une réception qu’après acceptation de l’envoi à l’administration.
- Une candidature n’est acceptée qu’après stockage et enregistrement ; la notification facultative ne peut invalider ce dossier.
- Un échec de stockage déclenche le nettoyage des seuls fichiers créés par la requête concernée.
- Les vérifications automatisées simulent les services ; aucun vrai message, candidat ou fichier n’est ajouté aux données du club.

## Lancer et reproduire la recette

Voir [README.md](README.md). Commandes principales :

```powershell
npm run dev -- --webpack --hostname 127.0.0.1
npm test
npx tsc --noEmit
npm run lint
$env:SITE_INDEXING = 'disabled'
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1
node scripts/verify-public-v2.mjs
```

Le serveur de développement et celui de production utilisent le même port par défaut : arrêter le premier avant de démarrer le second. Webpack contourne l’erreur interne locale rencontrée avec le sous-processus CSS de Turbopack.

## Résultats de recette

Le rapport HTTP est disponible dans [artifacts/v2/http-report.json](artifacts/v2/http-report.json) et les captures dans [artifacts/v2](artifacts/v2/). La recette porte sur l’aperçu local compilé, sans publication.

Consulter l’[index des captures desktop/mobile](artifacts/v2/CAPTURES.md) et le [rapport de recette navigateur](artifacts/v2/browser-report.json).

| Contrôle | Résultat |
|---|---|
| Tests automatisés | 28 réussis, 0 échec ; services externes simulés |
| TypeScript | `npx tsc --noEmit` réussi ; typage du build réussi |
| ESLint | `npm run lint` réussi, sans erreur ni avertissement |
| Build de production Webpack | Réussi ; 113 pages générées, routes dynamiques compilées |
| HTTP FR/EN, métadonnées, liens, ancres, images locales | 56 pages, 86 liens internes, 92 ancres ; images locales contrôlées dans le rapport : 0 échec |
| Statuts HTTP | 8 fiches inexistantes en 404, 2 API protégées en 401 ; sitemap et robots en 200 |
| Accueil : 375, 430, 768, 1024, 1440, 1920 px | Aucun débordement horizontal sur les six largeurs ; captures disponibles |
| Dix gabarits internes × six largeurs | 60 contrôles : aucun débordement, un H1 par page |
| Menus, Échap et focus | Menu desktop et dialogue mobile contrôlés ; fermeture et restitution du focus réussies |
| Galerie | Image suivante au clavier, fermeture Échap, restitution du focus ; état vide vidéo explicite |
| Filtres et langue | Recherche sans accents, filtres saison U16/domicile conservés en anglais ; sujet partenaire traduit et conservé |
| Formulaires simulés dans le navigateur | Erreur → réessai avec saisie et fichiers conservés → succès simulé → nouvelle demande vierge, contact et candidature |

La recette de candidature a aussi détecté un déclenchement indésirable de l’envoi lors du passage à la dernière étape d’un dossier déjà rempli. Le correctif distingue les boutons « Suivant » et « Soumettre » et annule l’action native du premier. Le build et le typage après correction passent. La dernière revérification de ce cas dans le navigateur n’a pas été exécutée : l’accès au proxy de simulation a été refusé. Les résultats de conservation et de remise à zéro ci-dessus ont été observés avant ce dernier correctif.

Pour reproduire les parcours simulés, lancer `node scripts/mock-form-preview.mjs` avec l’aperçu sur le port 3000, puis ouvrir `http://127.0.0.1:3002/fr/contact` ou `/fr/rejoindre`. Ce proxy local ne relaie aucun POST : le premier essai de chaque formulaire échoue, le suivant renvoie une réception fictive. Les fichiers de `artifacts/v2/fixtures/` sont synthétiques. Ce serveur est exclusivement destiné à la recette, jamais à l’exploitation.

Les captures `contact-simulation.jpg` et `candidature-simulation.jpg` montrent des références explicitement fictives. Elles ne constituent pas des dossiers enregistrés ni des messages envoyés.

## Limites connues et exploitation

Aucun CMS externe ni flux sportif nouveau n’est raccordé. Les effectifs publics, rencontres, classements et offres commerciales attendent des données validées de l’académie. Les rôles sans titulaire restent signalés « À confirmer ». Les tableaux de bord existants conservent leur périmètre ; leurs exemples internes ne sont pas publiés comme statistiques sportives du club.

La recette ne teste pas l’envoi réel chez Resend, une écriture Supabase réelle, un paiement ou une migration. Les services opérationnels dépendent de la configuration de l’environnement existant. L’idempotence mémoire des formulaires protège les tentatives successives dans un même processus ; elle ne remplace pas une contrainte persistante dans un déploiement à plusieurs instances.

Les coordonnées précises du lieu d’accueil, l’identité juridique détaillée, l’hébergement final et les durées de conservation demandent validation par le club. Les pages de service l’indiquent sans inventer ces informations.

Aucune publication en production ni migration destructive n’a été effectuée.
