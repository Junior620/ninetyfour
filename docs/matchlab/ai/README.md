# N91 Lab IA

Dix écrans accessibles par le catalogue et leur paramètre module. Les types demandés sont dans src/lib/matchlab/ai.ts. Les contrats backend appliquent authentification/CSRF/quotas/validation mais répondent toujours501 : aucun moteur, OCR, reconnaissance, transcription ou appel LLM.

Chaque document01–10 décrit les entrées, sorties, limites, revue et pseudo-code. Les URL génériques du prompt sont adaptées au namespace privé `/api/matchlab/ai/[module]`, sans exposer une seconde API. La consultation de futurs jobs reste un contrat documentaire, aucun job réel n’est créé. Les contrôles qualité sont décrits dans assistant/tendances, la recherche clips dans assistant/vidéo et les désaccords dans synthèse/tendances.

Le fonctionnement futur exigerait : stockage privé séparé, table de jobs avec version/idempotence et droits, file asynchrone avec timeout/retry plafonné, budget et quota par club, annulation, disponibilité du prestataire et contrat de traitement, revue staff et purge explicitement approuvée. Aucune de ces dépendances n’est installée comme moteur dans cette livraison.

La salle vidéo manuelle et les profils cibles réels restent accessibles depuis les écrans concernés ; aucune vidéo réelle ni identité n’est utilisée par la démonstration. Voir SECURITE_ET_LIMITES.md.
