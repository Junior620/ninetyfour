# N91 MatchLab — livraison locale

MatchLab est un espace privé distinct de la vitrine bilingue. La base de recette, les comptes et les photos utilisés sont fictifs. Aucun déploiement ni migration distante n’a été effectué.

## Démarrage depuis E:\ninetyfour

```powershell
npm ci
npm run matchlab:setup
npm run matchlab:migrate
npm run matchlab:dev -- 3100
```

Ouvrir http://127.0.0.1:3100/matchlab. Le compte local aléatoire est conservé dans `.matchlab-local/admin.json`, ignoré par Git. Ne pas publier ce fichier. Le compte n’est créé qu’au premier setup. Docker Desktop doit fonctionner. La vitrine locale reste disponible à `/fr` et `/en`.

Sur une installation neuve, ouvrir **Gestion du site → Importer les six articles existants** pour initialiser les six articles FR/EN du CMS local. Cette action est explicite et ne remplace aucun article déjà présent. Le CMS de l’instance de recette livrée est déjà initialisé.

```powershell
npm test
npm run matchlab:test
# Avec le serveur local sur 3100 :
npm run matchlab:test:http
npm run matchlab:test:routes
npm run typecheck
npm run lint
# Arrêter le serveur Next avant de construire dans le même dossier :
npm run matchlab:build
npm run matchlab:start -- 3100
```

Les tests HTTP et base refusent toute autre instance que `127.0.0.1:55321`. Ils ajoutent des données fictives identifiables ; ils n’effacent pas les données précédentes. Les tests de messagerie de la vitrine sont simulés.

## Lecture de la livraison

- **Fonctionnel testé localement** : sessions privées et révocation, rôles/périmètres, joueurs, matchs, évaluations, calculs, annotations, rapports révisés, alertes internes, médias sous consentement, exports/restauration, CMS bilingue et publication explicite.
- **Dépendant d’un service d’exploitation** : Supabase hébergé, SMTP réel, sauvegardes d’exploitation, URL HTTPS et configuration Vercel. Seule l’instance locale est raccordée et testée.
- **Interface / démonstration** : dix modules IA, contrats typés, six états de démo et revue fictive. Le serveur retourne `501 AI_NOT_CONFIGURED`. Aucun modèle, OCR, micro ou transfert tiers.
- **Non implémenté volontairement** : moteur IA, décision automatique de recrutement, formule de compatibilité, traitement GPS, envoi Push réel, suppression automatique sur durée arbitraire. Les abonnements Push sont préparés mais restent désactivés.

Voir [recette](RECETTE.md), [couverture du PDF](COUVERTURE.md), [architecture](ARCHITECTURE.md), [sécurité](SECURITE.md), [données](DONNEES.md), [CMS](CMS.md), [déploiement](DEPLOIEMENT.md), [restauration](RESTAURATION.md), [décisions](DECISIONS.md), [audit et comparaison](AUDIT.md), [IA](ai/README.md).
