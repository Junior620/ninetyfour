# Couverture du cahier des charges PDF v1.1

Lecture intégrale des11pages, y compris addendum exports. Le prompt fusionné complète le PDF ; les règles métier du PDF priment.

| Page | Exigence | Réalisation / vérification |
|---|---|---|
|1|Cadre post-match et décision humaine|Espace privé, observation/évaluation/rapport ; aucune sélection automatique|
|2|Priorités P0/P1, parcours de base|Joueurs, matchs, questionnaire, rapports et alertes persistants ; tests API et base|
|3|P2 et hors périmètre|IA/GPS/automatisation hors moteur ; dix interfaces et pseudo-code isolés|
|4|Fiche match, circonstances, joueur|Formulaires persistants, dossard1–99, huit postes, pied/statut, photo autorisée. Circonstances complètes : type de rencontre, domicile/extérieur/neutre, surface, état du terrain, météo, niveau adverse, système N91, scénario du score, événements (absences, blessure, expulsion, changement tactique, interruption, retard) + détails libres (`circumstances.ts`, `schema.ts`)|
|4|Synthèse du rapport §5.4|Écran et PDF : note collective + détail des cinq axes, joueur avec photo autorisée ou avatar, dossard, poste du match, temps de jeu, note /10, points d’appui (réponses 4–5) et à travailler (1–2), fait marquant, priorité, contexte, repères vidéo, mention de revue staff (`Reports.tsx`, `pdf.tsx`)|
|5|Six questions communes et formule|Libellés exacts dans questionnaire.ts et seed immuable ; 40/60×2, exemple6,8 testé|
|6|Questions gardien, central, latéral, sentinelle|Cinq questions exactes par poste ; versionpdf-1.1|
|7|Questions relayeur, offensif, ailier, avant-centre|Cinq questions exactes par poste ; non observé distinct d’absence|
|8|Meilleur joueur/poste, alertes|Ex æquo, joueurs distincts ; « Joueur(s) le(s) mieux évalué(s) sur ce match » et mention « Performance à confirmer sur d’autres rencontres » sous 5 joueurs ; aucun joueur mis en avant sans note calculable ; alerte unique par match, cas sans note testé|
|9|Qualité, sécurité, performance|RLS/session/CSRF/conflits/no-store ; recette réelle documentée, pas de promesse mobile non mesurée|
|10|Critères de livraison|Scripts reproductibles, migrations, captures six largeurs, tests existants préservés|
|11|Addendum exports|PDF3types, XLSX7onglets, CSVBOM, ZIPJSON/photos/manifeste ; validation/dry-run/copie/collision/transaction|

## Écarts comblés — 17 octobre 2026

Audit comparatif contre le PDF v1.1, le prompt V3 et le dashboard de référence, puis corrections :

| Écart relevé | Correction | Preuve |
|---|---|---|
| Circonstances sans domicile/extérieur, surface, scénario ni événements structurés | Listes de la référence ; lieu et événements en codes stables ; anciennes saisies libres conservées et resélectionnables | `tests/matchlab-report.test.ts`, contrôle navigateur bout en bout |
| Rapport sans photo, dossard, temps de jeu, détail des axes ni repères vidéo | Rapport écran et PDF complétés ; Excel « Circonstances » lisible | Contrôle navigateur, PDF 200, HTTP 21/21 |
| Mentions PDF §8 et prompt §5.6 absentes | Textes exacts ajoutés | Contrôle navigateur |
| « Dernière sauvegarde » absente ; `updated_at` jamais mis à jour en base | Indicateur d’état dans la salle d’analyse + migration additive `202610170012` (trigger) | Date du jour relue après enregistrement |
| Salle d’analyse sans « Profil cible » ni « Astuce vidéo » | Comparaison fondamentaux / notes cibles, sans pourcentage, lien « Gérer les profils » | Captures `apres-analyse-*` |
| Vue d’ensemble éloignée de la référence | Bandeau avec logo, carte « Dossier match » (blason, score, revue post-match), axes de la revue + panneau « Profils à revoir » (données réelles uniquement), tuile vidéothèque illustrée | Captures `apres-overview-*` |
| Sélecteur de saison hors sidebar, `theme-color` absent | Sélecteur « Saison en cours » en bas de sidebar ; `viewport.themeColor` | Captures |

Captures avant : `overview-1440.jpg`, `analyze-1440.jpg`, `reports-1440.jpg`. Après : `apres-overview-1440.jpg`, `apres-analyse-1440.jpg`, `apres-rapport-1440.jpg` et leurs variantes 375 px.

Références : types/schema dans src/lib/matchlab, API src/app/api/matchlab, tests matchlab-scoring/exports/report/integration/http. Les limites d’exploitation, services non activés et fonctionnalités volontairement absentes sont distingués dans README et RECETTE.

## Cahier des besoins v2.2 — 18–19 octobre 2026

| Section | Exigence | Réalisation |
|---|---|---|
| 01–02 | Prise en main, photo et dossard partout | Aide contextuelle, guide pas à pas désactivable, derniers rapports, photo/dossard dans l’évaluation, la fiche, le rapport et l’alerte |
| 03 | Terrain tactique, essai en catégorie supérieure, recherche de profils | `/matchlab/squad`, référentiel `ml_requirements`, décisions `ml_trials`, analyseur à règles avec sources |
| 04 | Vidéo, séquences, indicateurs | Envoi reprenable vers Supabase Storage, douze actions, vérification tracée, horodatages, indicateurs avec échantillon ; mesure physique « non mesurée » |
| 05 | Assistant | Assistant à règles en quatre étapes, validation obligatoire, journal ; aucun moteur IA |
| 06 | Live scouting | Match en direct sans enregistrement, file hors ligne, synthèses figées, joueurs non identifiés gardés comme tels ; commentaire IA désactivé |
| 07 | Cellule tactique | Entrées sourcées, plans principal/alternatifs, tableau de terrain, priorités, avant/après ; adversaire jamais observé = aucune faiblesse déduite |
| 08 | Fiche joueur et dossier club | Fiche par période ; dossier validé par la direction, autorisation de diffusion, PDF du contenu figé, journal des exports |
| 08 | Alerte post-match | Joueur le mieux évalué sur ce match, photo, dossard, poste, note, éléments qui justifient la distinction, postes en tête |
| 09 | Confiance et données | RLS par rôle et catégorie, lecteurs sans observations internes, consentements, durée de conservation, audit |
| 10 | Recette indispensable | Les 15 critères et leurs preuves dans `RECETTE.md` |

Remplacements décidés avec le club : compatibilité remplacée par l’écart factuel au profil cible ; IA remplacée par des règles transparentes, emplacements prêts mais désactivés.
