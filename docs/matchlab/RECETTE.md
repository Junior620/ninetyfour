# Recette — 16 octobre 2026

Code vérifié : `833b2d5` (données/API/tests) puis `f000c36` (interface et raccordement vitrine), branche `codex/matchlab`. Les captures et ce rapport sont versionnés dans le commit de documentation suivant.

Environnement : Windows, Node 24.14.1, Next 16.4.2 Webpack, PostgreSQL 17 / Supabase local, navigateur Chromium intégré à Codex. Données fictives uniquement. Aucun test de charge en réseau mobile réel, Safari ou Firefox effectué ; aucune conformité WCAG exhaustive ni audit de pénétration revendiqué.

## Résultats automatisés

- Tests unitaires et non-régression vitrine : **36/36**. Scores 40/60, exemple 6,8, groupes absents/non observés, huit postes, ex æquo, joueurs distincts, relations exportées, CSV formules, lecture XLSX et ZIP/photos. Contact/recrutement simulés sans envoi ni écriture club.
- Intégration directe PostgreSQL/RLS : **27/27**. Identité sans habilitation, JWT sans session, autre catégorie, lecteur avec partages explicites, modifications interdites, version concurrente, alerte idempotente et sans note, contraintes en base, audit avant/après, stockage direct, révocation/récupération, rapports immuables.
- Recette HTTP sur serveur compilé : **21/21**. Sessions distinctes, persistance, doublon d’évaluation et version obsolète refusés, rapport validé, photo sous consentement, quatre formats relus, trois PDF, filtre sur toutes les relations, restauration avec photo et remappage, retrait du consentement, six articles FR/EN identiques, publication/retrait d’un nouveau slug, droits indépendants, contrats IA/Push désactivés. La récupération de mot de passe passe par Mailpit et le callback PKCE ; les sessions précédentes perdent leur accès.
- Routes : **33 contrôles réussis**, dont 20 pages publiques FR/EN, 12 pages privées et le graphe API. Le sitemap ne contient aucune URL MatchLab. Résultats et titres dans `routes-results.json` ; commande `npm run matchlab:test:routes`.
- TypeScript : **réussi**. ESLint : **réussi, sans erreur ni avertissement**.
- Build de production : **réussi avec Webpack**, 112 pages prégénérées et routes privées dynamiques. `npm run matchlab:build` utilise les variables locales isolées.
- PDF match/joueur/période : fichiers réellement relus, pages A4, note 6,8 conservée et rendu inspecté. Le jeu de recette tient sur une page par type ; les documents longs peuvent s’étendre sur plusieurs pages. Résultats dans `pdf-results.json`.

## Recette navigateur

Cinq écrans principaux × 375, 430, 768, 1024, 1440, 1920 px : **30 vues contrôlées**, aucun débordement horizontal du document, aucune image cassée. Les tableaux étroits ont leur défilement interne. Mesures dans `responsive-results.json`, captures dans `screenshots/`. Les captures de référence desktop/mobile sont conservées pour comparaison visuelle. `final-desktop.jpg` et `final-mobile.jpg` montrent la version compilée ; les premières captures de recette proviennent du serveur de développement.

Vérifications effectuées : menu mobile/Échap/retour de focus ; fenêtre Ajouter un joueur/Échap/retour de focus ; création réelle d’un joueur fictif, recherche puis rechargement ; création d’un brouillon match ; évaluation 6,8/10 enregistrée ; validation d’une révision de rapport ; vidéo locale de 3 s (image unie fictive, URL blob), annotation persistante après rechargement, nécessité de resélectionner le fichier visible ; activation explicite de démo IA et état revue humaine. Les dix liens de modules IA ouvrent leur contenu et gardent le moteur ou le microphone désactivé (`ai-screen-results.json`).

Les deux types de validations sont complémentaires : les contrôles navigateur vérifient les interactions visibles, les tests API et SQL vérifient la persistance et les refus d’accès même sans interface.

Le portail public a aussi été contrôlé visuellement en français et en anglais : les trois cartes, les logos, les partenaires et le dégradé restent présents ; le lien staff ajouté sous le triptyque est traduit. Capture `screenshots/portal-fr.jpg`.

## Mesures et reproductibilité

Cinq requêtes consécutives au graphe autorisé, serveur compilé local : **588, 642, 567, 554 et 559 ms**, médiane **567 ms**. Le nombre de lignes par table et les durées des routes figurent dans `routes-results.json`. Ces temps de réponse sur poste local ne mesurent ni LCP ni réseau mobile. Aucun test de montée en charge n’a été effectué.

Les tests ajoutent leurs propres comptes, saisons et données fictives dans la base isolée. Ils n’utilisent aucune donnée du club et ne réinitialisent pas la base. Une restauration copiée est identifiée par ses nouveaux identifiants ; relancer la recette ne doit pas la confondre avec les données d’une exécution antérieure.

## Écarts comblés — 17 octobre 2026

Serveur compilé Webpack reconstruit (`npm run matchlab:build`), Supabase local avec la migration 202610170012 appliquée par `npm run matchlab:migrate`. Données fictives uniquement.

- Tests unitaires et non-régression : **50/50**, dont quatre nouveaux sur les circonstances (champs PDF acceptés, saisies libres antérieures conservées, codes inconnus et doublons refusés, libellés lisibles) et les points d’appui / à travailler.
- Intégration PostgreSQL/RLS : **27/27**. HTTP sur serveur compilé : **21/21**. Routes publiques et privées : **33/33**. TypeScript et ESLint réussis.
- Contrôle navigateur bout en bout (Edge headless piloté localement) : **13/13**. Saisie des nouvelles circonstances dans le vrai formulaire, état « Modifications non enregistrées », enregistrement confirmé, rechargement identique, date de dernière sauvegarde du jour, codes stockés par l’API, rapport avec cinq axes, avatar/photo, dossard, temps de jeu, circonstances lisibles et mention de revue, PDF de match 200, aucun débordement horizontal à 375 px.

## Limites connues

Le chargement client d’un périmètre se fait après le shell ; le nombre de lignes est plafonné à 10 000 par table. Aucun budget mobile 3G/LCP n’est annoncé sans mesure dédiée. Le service SMTP de recette capture les messages dans Mailpit ; aucun email réel. Push préparé mais envoi absent. IA interface uniquement. Vitrine publique conservée ; CMS réel seulement lorsque explicitement activé et initialisé. Les 14 alertes de dépendances résiduelles sont décrites dans `SECURITE.md`. Aucun déploiement ni migration distante.

## Cahier des besoins v2.2 — 19 octobre 2026

Code vérifié sur la branche `claude/modest-wiles-05282e`, poussé sur `master` lot par lot (c387ed1, 0986f23, e97b8ed, ecc81ed, 7f86ddc, 09107f6, 80740a2, 375f8fc, puis ce commit). Environnement : Windows, Node 24.14.1, Next 16 Webpack (version compilée), Supabase local avec les migrations 202610180013 à 202610180019, Edge headless piloté par CDP. Données fictives uniquement ; la caméra du mode direct est simulée par Edge (`--use-fake-device-for-media-stream`), la tablette par l’émulation tactile.

Résultats automatisés :

- Tests unitaires : **77/77** (dont écarts au profil cible, terrain tactique, essai, recherche de profils, séquences, fiche et dossier, direct, cellule tactique, assistant, export d’un scénario vide).
- Intégration PostgreSQL/RLS : **74/74** (vidéo, séquences, dossiers, direct, plans, journal de l’assistant, restauration copiée des nouvelles tables).
- HTTP sur serveur compilé : **21/21**. TypeScript et ESLint : réussis. Build de production : réussi.
- Parcours navigateur par lot, rejoués sur la version finale, avec audit d’accessibilité (texte ≥ 12 px, contraste ≥ 4,5:1, cibles ≥ 44 px et écarts ≥ 8 px, pas de débordement) à 1 440 et 375 px : vidéo et séquences, fiche et dossier, direct, cellule tactique, assistant, alerte. Aucun défaut relevé, hors le tiret décoratif déjà documenté de la vue d’ensemble.

| # | Critère de recette indispensable | Résultat et preuve |
|---|---|---|
| 1 | Photo et dossard dans la liste, la fiche, le rapport et l’alerte | Liste « Joueurs & profils », fiche joueur, rapport (écran et PDF), alerte : avatar ou photo autorisée et dossard ; alerte contrôlée à 1 440 et 375 px. |
| 2 | Questionnaire selon le poste réellement observé ; « non observé » ne fausse pas la note | Inchangé depuis la v1.1 : questions du poste joué, `null` exclu du calcul (`matchlab-scoring.test.ts`). |
| 3 | Notes collective et individuelle recalculables depuis les réponses | Calcul pur dans `scoring.ts` à partir des réponses enregistrées ; rapports figés en révisions. |
| 4 | Synthèse : résultats en tête, nombre de joueurs évalués, ex æquo | Classement avec ex æquo et joueurs distincts (`rankings`), mention sous 5 joueurs. |
| 5 | Tableau tactique : déplacer, remplacer, comparer ; tablette | Glisser-déposer souris et toucher (768 px), alternative clavier, échange, banc, comparaison de scénarios (lot 2). |
| 6 | Montée de catégorie : critères, écarts, confiance ; le staff garde le dernier mot | Comparaison au référentiel, statut par critère, confiance selon l’échantillon ; décision du staff obligatoire, motif si elle diffère, décisions non modifiables. |
| 7 | Une séquence ouvre l’horodatage correct ; une suggestion IA est corrigeable et tracée | Horodatages de la salle d’analyse, de la fiche et de la vidéothèque (`?t=`) ouvrent la vidéo au bon instant. Aucune suggestion IA n’est générée (moteur non configuré) ; toute séquence, quelle que soit sa source, se corrige, et la validation enregistre son auteur. |
| 8 | L’assistant explique la page, guide vers une action, laisse reprendre la main | Aide de la page en cours, lancement du guide, « Annuler » à chaque étape ; guide interruptible et désactivable (lot 1). |
| 9 | Action préparée par l’assistant prévisualisée ; exécution seulement après validation | Création annulée : aucune ligne écrite ; création validée : ligne créée et journal `ASSISTANT_VALIDATED` avec la cible. Partage : le dossier club n’est exportable qu’après validation par la direction. |
| 10 | Recherche ou analyse : période, critères, échantillon, données manquantes | Recherche de profils, fiche joueur, entrées de la cellule tactique, synthèses du direct et indicateurs affichent leur période et leur échantillon ; informations manquantes listées. |
| 11 | Mode match depuis la caméra, aucun fichier vidéo ; seules notes et analyses persistent | Parcours du direct : 0 `MediaRecorder`, 0 objet blob, aucune requête de stockage, corps de requête ≤ 2 Ko, aucune vidéo en base ni dans le bucket. |
| 12 | Synthèse à la mi-temps et après le match ; joueur non reconnu explicitement non identifié | Synthèses figées à la mi-temps et au coup de sifflet final ; actions « Joueur non identifié » comptées à part, jamais attribuées. |
| 13 | Comparaisons selon la catégorie d’âge vérifiée, le poste et un échantillon suffisant ; pas de promotion préjugée | Essai : catégorie d’affectation et poste du scénario, confiance selon le nombre de matchs ; recherche : deux matchs minimum ; direct : moins de trois actions = données insuffisantes. MatchLab ne gère pas de date de naissance : la catégorie vérifiée est l’affectation saisie par le staff. |
| 14 | Dossier club limité aux éléments approuvés ; export filtré conforme au périmètre | Contenu calculé et figé par le serveur à la validation, éléments internes exclus par défaut, PDF relu sans note interne ; filtre d’export fermé sur les relations (HTTP) et scénario vide d’une autre saison exclu (test unitaire). |
| 15 | Sauvegarde complète importable sans perdre les liens joueurs, matchs, médias | Restauration copiée avec photo (HTTP) ; restauration copiée des plans, dossiers, sessions en direct, compositions et séquences avec liens remappés (intégration). |

Limites connues de la v2.2 : aucune fonction d’IA (assistant, recherche, propositions et synthèses par règles) ; commentaire en direct et suggestions IA restent des emplacements désactivés. Pas de compression ni de conversion vidéo. Distance, vitesse et charge physique non mesurées. Les tests multi-éducateurs, réseau mobile réel et tablette physique restent à faire sur le terrain. Les migrations 202610180013 à 202610180019 ne sont pas appliquées en production.
