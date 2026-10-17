# Décisions

- Identité Supabase réutilisée, habilitation MatchLab explicite et cookie distinct. Sécurité en base prioritaire sur métadonnées utilisateur.
- Configuration Supabase du site réutilisée par défaut. La famille dédiée MATCHLAB_SUPABASE_* reste prioritaire et indivisible pour isoler les tests locaux et les environnements distincts ; aucune clé n’est empruntée à l’autre famille en cas de configuration partielle.
- Migrations additives versionnées sans db push Prisma ; développement sur Supabase local séparé. Rien en production.
- Français livré ; textes principaux regroupés dans messages.ts, modèle de traduction préparé. Traduction anglaise MatchLab non livrée ; vitrine FR/EN conservée. Questionnaire officiel figé en français pour fidélité au PDF.
- Sidebar/topbar et cinq entrées du modèle conservées ; tiroir sous1024px pour supprimer le chevauchement tablette. Logo N91 Lab fourni pendant le développement intégré.
- Vidéo locale et annotations persistantes séparées : changer d’appareil exige de resélectionner le fichier. Pas de stockage vidéo implicite.
- Photos diffusées par API authentifiée plutôt que lien Storage réutilisable : révocation contrôlée à la requête suivante.
- Un seul CMS articles ; autres contenus publics en lecture seule. Publication explicite FR/EN et import historique.
- Lecture des articles CMS à la requête, y compris les nouveaux slugs : `connection()` avant Supabase et route de détail dynamique. Publication et retrait vérifiés après compilation Webpack.
- Notes officielles, fondamentaux et futurs résultats IA séparés. Pas de compatibilité ni GPS inventés.
- Alertes internes persistantes fonctionnelles ; livraison Push réelle hors service configuré. IA limitée aux interfaces/contrats/pseudo-code comme demandé.
- Next16.4.2 et Webpack utilisés pour corriger une vulnérabilité Windows et éviter le blocage Turbopack local antérieur. Pas de migration majeure Prisma risquée.
- Pas de suppression de profils par simple bouton : statut inactif et révocation média. Une politique de purge doit être définie avant automatisation.
- Circonstances : listes de la référence pour la saisie rapide ; domicile/extérieur et événements stockés en codes pour l’analytique future, les autres valeurs en texte afin de garder les saisies libres antérieures. Elles contextualisent sans jamais modifier une note.
- Rapport : points d’appui = critères notés 4–5, points à travailler = critères notés 1–2, directement issus des réponses ; « Non observé » et 3 n’apparaissent pas. Aucun texte généré.
- Profil cible dans la salle d’analyse : comparaison factuelle des fondamentaux aux notes cibles, sans pourcentage tant que la formule de compatibilité n’est pas validée par la direction.
- « Profils à revoir » de la vue d’ensemble : joueurs au statut « À revoir » uniquement ; la référence affichait des pourcentages de démonstration, non repris.
