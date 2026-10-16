# Assistant du staff — contrat et pseudo-code uniquement

Écran : `/matchlab/ai?module=assistant`. Contrat protégé : `POST /api/matchlab/ai/assistant` → HTTP501 `AI_NOT_CONFIGURED`. Types : `ModuleRequest<"assistant">` et `AiInputs` dans ai.ts. Aucun job, moteur ou prestataire n’est connecté.

Entrées futures : Question, filtres, identifiants explicitement autorisés.

Sorties candidates : Réponse sourcée ou information insuffisante.

Limites : Recherche future privée par minute/action/poste ; refuser le hors périmètre, ne pas donner accès via une citation.

```text
vérifier l’identité, la session et les permissions actuelles
valider le contrat versionné et chaque référence dans le périmètre RLS
si moteur non configuré : retourner AI_NOT_CONFIGURED, transmitted=false
# Les étapes suivantes sont une spécification future, pas du code exécuté :
exiger autorisation et consentements adaptés à la finalité
constituer seulement les entrées autorisées du module
contrôler qualité, doublons, contradictions, méthode et taille d’échantillon
préparer un job idempotent, borné en coût et durée, annulable
produire les sorties candidates avec preuve, confiance et limites
ne jamais écrire dans scores, rapports validés ou historique officiel
présenter au staff : accepter / corriger / ignorer + motif
recontrôler droits et consentements à la revue puis à l’éventuelle conversion
conserver une trace de la revue ; appliquer la politique de purge approuvée
```

L’aperçu fictif est activé explicitement ; six états disponibles : vide, chargement simulé, erreur simulée, non configuré, démonstration, revue requise. Les actions d’édition/revue n’existent qu’en mémoire de la page. Quitter la page ne conserve rien. Aucun exemple fictif ne part dans une API métier.
