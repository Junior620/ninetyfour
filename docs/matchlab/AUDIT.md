# Audit et référence

Audit initial : Next 16.2.10, React 19, TypeScript, next-intl, Supabase, modèles Prisma existants ; 28 tests réussis et lint propre. Les cookies applicatifs historiques ne garantissaient pas la révocation MatchLab. Les six articles publics étaient des fichiers ; l’ancien éditeur ne persistait pas. Pas d’historique SQL versionné. La connexion PostgreSQL distante n’a pas abouti ; Docker a permis une instance isolée.

Sources lues : prompt fusionné complet (687 lignes), PDF v1.1 complet (11 pages, addendum inclus), dépôt. Dashboard inspecté : https://n91-matchlab.basic-nova-5989.chatgpt.site/ — cinq vues, desktop/tablette/mobile. Les captures comparatives figurent dans `screenshots/`.

| Écran / composant | Référence et état | Navigation / source réelle | Extension / différence |
|---|---|---|---|
| Shell | Sidebar 252 px, topbar 68 px, Inter, cartes blanches, bleu et gris | Cinq premières entrées conservées | Tiroir sous 1024 px ; corrige le chevauchement tablette du modèle |
| Vue d’ensemble | Hero éditorial, cartes métiers, KPI, historique | Données autorisées en base ; calculs purs | Aucune statistique fictive en fonctionnement normal ; bannière local explicite |
| Matchs analysés | Tableau, filtre, statut, entrée d’analyse | Match persistant, recherche et catégorie/saison | Score collectif distinct, brouillon et conflits de version |
| Joueurs & profils | Tableau, quatre fondamentaux, profils cibles | Joueurs, appartenances, cible, consentements | Compatibilité sans pourcentage inventé ; photo privée ou avatar |
| Analyser un match | Salle vidéo, repères et panneau d’observation | Fichier local, annotations PostgreSQL, questions exactes | Pas d’envoi vidéo ; re-sélection nécessaire sur autre appareil |
| Rapports | Mise en page lisible et impression | Révisions immuables, validation staff | PDF A4 et historique de corrections |
| États | Focus, disabled, chargement, vide, erreur | Base UI pour tiroirs/modales | Échap et retour de focus vérifiés ; reduced-motion respecté |
| Extensions | Groupe séparé après les cinq entrées | Analytique, exports, CMS, administration | Catalogue IA isolé, sans contamination des données |

Les transitions restent discrètes ; aucune durée du prototype n’est présentée comme une mesure instrumentée. Les captures sont des données de recette, jamais des profils réels.
