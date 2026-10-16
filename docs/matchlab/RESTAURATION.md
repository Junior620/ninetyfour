# Exports et restauration

Exports : PDF A4 match/joueur/période ; XLSX (Joueurs, Matchs, Évaluations, Circonstances, Réponses, Repères vidéo, Métadonnées) ; CSV UTF-8 BOM avec table sélectionnable et protection formules ; ZIP n91-matchlab/1 avec JSON, manifeste SHA256 et photos autorisées. Les scores sont recalculés par le module pur. Les filtres s’appliquent aux relations, pas seulement aux matchs. Les snapshots contenant un joueur/poste hors filtre sont exclus, sans les réécrire.

Photo exportée : permission média + autorisation interne valide + consentement export valide. Un joueur observé uniquement par un repère est conservé. Les justificatifs ne sont pas intégrés aux archives photo. Métadonnées : auteur, date, méthode, schéma et filtres.

## Parcours

1. Choisir le périmètre puis télécharger ZIP. Conserver le fichier dans un emplacement privé.
2. Dans Exports, choisir le fichier et le mode. Prévisualiser : validation intégrité, schéma, relations et collisions ; aucun enregistrement.
3. Mode conservation : identifiants préservés lorsqu’ils sont libres ; toute collision refuse la restauration. Mode copie : nouveaux UUID pour chaque entité et toutes les relations, y compris snapshots/photos ; aucune substitution de texte libre.
4. Après aperçu, confirmer la restauration. Le digest doit correspondre au même fichier. Préparer les fichiers dans un préfixe de lot inédit, puis activer les lignes en transaction PostgreSQL.
5. En échec : rollback SQL et retrait des fichiers préparés. Une panne de nettoyage écrit un message opérateur ; contrôler le préfixe de lot et ne supprimer aucun autre objet.
6. Relire les entités et photos restaurées ; nouvelle validation staff requise pour les rapports importés. L’auteur d’origine est conservé comme provenance, sans se substituer au compte de restauration.

Limites : ZIP entrant20 Mio, décompressé50 Mio/500 entrées ; photos exportées40 Mio. Réduire le périmètre au-delà. La sauvegarde applicative ne remplace pas une sauvegarde complète PostgreSQL/Auth/Storage : comptes, secrets, droits, audit et abonnements ne sont jamais clonés par import.
