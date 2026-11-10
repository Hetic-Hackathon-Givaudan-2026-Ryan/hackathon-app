# 0003. Décrire le contrat de l'API dans `openapi.yaml`, écrit à la main

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : l'équipe

## Contexte

Le front (`web/src/main.ts`) et l'API (`api/src/index.ts`) sont développés en parallèle par des personnes différentes. Aujourd'hui, le seul contrat est le code des routes : `GET /api/health`, `GET /api/questions`, `POST /api/questions`. Le service Python `ia/` publie déjà le sien grâce à FastAPI (route `/docs`), mais l'API Express n'en a aucun.

Sans contrat écrit, le front devine les champs (`id`, `question`, `answer`, `created_at`) et les cas d'erreur (`400` si la question est vide). Une route renommée casse le front sans prévenir.

## Options

1. Écrire `openapi.yaml` à la main, à la racine du dépôt : lisible en revue de pull request, sans dépendance. Il peut diverger du code si personne ne le met à jour.
2. Générer la spécification depuis le code (`swagger-jsdoc`, `tsoa`) : toujours à jour. Ajoute des dépendances et des annotations dans `api/src/index.ts`, et impose de réécrire les routes pour `tsoa`.
3. Ne rien écrire et se fier au code et au README : aucun effort. Le tableau des routes du README ne décrit ni les corps ni les erreurs.

## Décision

Nous choisissons l'option 1 : le contrat de l'API est `openapi.yaml` (OpenAPI 3.1), à la racine du dépôt. Toute pull request qui ajoute ou modifie une route de `api/src/index.ts` met à jour `openapi.yaml` dans le même commit. Le front code contre ce fichier, pas contre l'implémentation.

## Conséquences

- Positives : un seul endroit pour lire les routes, les corps et les erreurs. Les changements de contrat sont visibles dans le diff de la pull request. Le fichier s'ouvre dans n'importe quel visualiseur OpenAPI.
- Négatives, à accepter : la synchronisation est manuelle. Rien n'empêche encore une route d'exister sans être décrite. La réponse `500` d'Express n'est pas en JSON, et le contrat le dit au lieu de le corriger.
- À revoir si : le fichier diverge du code une fois en revue (ajouter une validation en CI), ou si l'API dépasse une dizaine de routes (passer à la génération).
