# Articles administrables

`src/lib/content/articles.ts` est l’adaptateur commun à l’accueil, la liste, les pages de détail, les articles liés, le sitemap et IndexNow. Si MATCHLAB_CMS_ENABLED n’est pas true, les six articles historiques restent la source publique. Si activé, seuls les articles publiés par RPC sont visibles ; une panne ne ressuscite pas des articles retirés.

L’import explicite des six articles dans Gestion du site conserve ID/slug, dates, catégories, images, textes et métadonnées FR/EN. Contrôle d’égalité couvert par la recette HTTP. Ne pas activer le CMS hébergé avant cet import et la vérification de la publication initiale.

site_editor : sauvegarder un brouillon, voir l’aperçu privé et restaurer une ancienne version en nouveau brouillon. site_publisher : publication/retrait explicites, contenu FR et EN exigé. Les conflits de version renvoient409. La publication invalide les routes FR/EN et le sitemap. Aucune publication automatique d’un brouillon ni de données sportives privées.

L’ancien `/[locale]/dashboard/admin/articles` redirige vers ce même outil, sans seconde source concurrente. Les autres contenus publics restent en lecture seule. Les vidéos ne sont pas administrées par ce CMS.

Un notFound diffusé en streaming Next peut conserver HTTP200 avec noindex ; le contenu publié retiré n’est plus présent. La recette contrôle le corps et noindex, pas uniquement le statut HTTP.

Avec le CMS activé, `connection()` interrompt la prégénération avant l’appel Supabase et la page article impose `force-dynamic`. Cela permet de publier de nouveaux slugs après le build et évite une transition statique/dynamique en production. La recette HTTP vérifie une publication et son retrait sur le serveur compilé.
