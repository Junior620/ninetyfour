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

## Limites connues

Le chargement client d’un périmètre se fait après le shell ; le nombre de lignes est plafonné à 10 000 par table. Aucun budget mobile 3G/LCP n’est annoncé sans mesure dédiée. Le service SMTP de recette capture les messages dans Mailpit ; aucun email réel. Push préparé mais envoi absent. IA interface uniquement. Vitrine publique conservée ; CMS réel seulement lorsque explicitement activé et initialisé. Les 14 alertes de dépendances résiduelles sont décrites dans `SECURITE.md`. Aucun déploiement ni migration distante.
