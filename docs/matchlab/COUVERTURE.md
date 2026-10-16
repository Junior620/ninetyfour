# Couverture du cahier des charges PDF v1.1

Lecture intégrale des11pages, y compris addendum exports. Le prompt fusionné complète le PDF ; les règles métier du PDF priment.

| Page | Exigence | Réalisation / vérification |
|---|---|---|
|1|Cadre post-match et décision humaine|Espace privé, observation/évaluation/rapport ; aucune sélection automatique|
|2|Priorités P0/P1, parcours de base|Joueurs, matchs, questionnaire, rapports et alertes persistants ; tests API et base|
|3|P2 et hors périmètre|IA/GPS/automatisation hors moteur ; dix interfaces et pseudo-code isolés|
|4|Fiche match, circonstances, joueur|Formulaires persistants, dossard1–99, huit postes, pied/statut, photo autorisée|
|5|Six questions communes et formule|Libellés exacts dans questionnaire.ts et seed immuable ; 40/60×2, exemple6,8 testé|
|6|Questions gardien, central, latéral, sentinelle|Cinq questions exactes par poste ; versionpdf-1.1|
|7|Questions relayeur, offensif, ailier, avant-centre|Cinq questions exactes par poste ; non observé distinct d’absence|
|8|Meilleur joueur/poste, alertes|Ex æquo, joueurs distincts, petits échantillons ; alerte unique par match, cas sans note testé|
|9|Qualité, sécurité, performance|RLS/session/CSRF/conflits/no-store ; recette réelle documentée, pas de promesse mobile non mesurée|
|10|Critères de livraison|Scripts reproductibles, migrations, captures six largeurs, tests existants préservés|
|11|Addendum exports|PDF3types, XLSX7onglets, CSVBOM, ZIPJSON/photos/manifeste ; validation/dry-run/copie/collision/transaction|

Références : types/schema dans src/lib/matchlab, API src/app/api/matchlab, tests matchlab-scoring/exports/integration/http. Les limites d’exploitation, services non activés et fonctionnalités volontairement absentes sont distingués dans README et RECETTE.
