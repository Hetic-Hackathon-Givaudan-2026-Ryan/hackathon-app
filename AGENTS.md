# AGENTS.md

Dashboard de prospection pour les commerciaux : un front React + TypeScript servi par Vite (`web/`), une API Express (`api/`), PostgreSQL 17 (`db/`) et un service IA Python séparé (`ia/`), dans un Dev Container VS Code. Présentation et installation : `README.md`.

## Lancer

La démo complète : `docker compose up` à la racine, sur la machine hôte, puis <http://localhost:8080> (ADR 0006, section « Lancer la démo M2 » du README).

Pour développer, toutes les commandes se lancent dans le Dev Container (`/workspace`), pas sur la machine hôte.

- `npm run dev` : API sur le port 3000 et front sur le port 5173, en parallèle. Le front lit l'API ; `npm run dev:mock -w web` lit `web/src/data/mock.ts`.
- `curl -s localhost:3000/api/health` doit répondre `"status":"ok"` avec la version de PostgreSQL.
- Avant de dire « fini » : `npm run lint`, `npm run format:check`, `npm run build`. Ce sont les étapes du job `qualite` de `.github/workflows/ci.yml`.

## Règles

- Les routes sont toutes dans `api/src/index.ts`. Leur contrat est `openapi.yaml` : une route ajoutée ou modifiée le met à jour dans le même commit (ADR 0003).
- Le front appelle `/api/...` en chemin relatif : le proxy vers le port 3000 est dans `web/vite.config.ts`.
- L'appel à l'IA passe par `ask()` dans `api/src/index.ts`, au format `/chat/completions`. Changer de fournisseur, c'est modifier `AI_BASE_URL`, `AI_MODEL` et `AI_API_KEY` dans `api/.env`, pas le code.
- `db/init/` n'est joué qu'au premier démarrage de la base. Un changement de schéma demande `docker compose down -v` (volume `db-data`) : préviens avant, les données locales sont perdues.
- Les prospects affichés sont fictifs (`db/init/004-prospects-seed.sql`, mêmes données que `mock.ts`). Garde les deux alignés, et la section « Ce qui est simulé » du README à jour.
- Le service `ia/` a son propre contrat : `ia/main.py`, route `/docs` sur le port 8000, en-tête `X-API-Key` obligatoire. L'API l'appelle pour rédiger les fiches (`IA_URL`, `IA_API_KEY`).
- `compose.yaml` doit rester lançable seul : toute variable a une valeur de démo par défaut, jamais un vrai secret. Le service `dev` est dans le profil `dev`.
- Une branche par ticket depuis `develop` (`feature/...`, minuscules, sans accents). La pull request vise `develop`, suit `.github/pull_request_template.md` et contient `Closes #N`.

## Décisions

- Lis `docs/adr/` avant d'ajouter une dépendance ou de changer de composant.
- Ne contredis pas un ADR au statut « acceptée » : Dev Container (0001), PostgreSQL et pas SQLite (0002), `openapi.yaml` écrit à la main (0003), front en React + TypeScript (0004).
- S'il faut en changer, propose un nouvel ADR au statut « proposée », puis arrête-toi.
- Le choix entre `ia/` et l'appel direct depuis l'API est ouvert (ticket #11) : n'en supprime aucun des deux.

## À ne pas faire

- Passer `--no-verify` à `git commit` ou ajouter `eslint-disable` pour faire passer le hook `.husky/pre-commit` ou la CI.
- Lancer `npm install` ou `git commit` hors du conteneur : `node_modules` est installé pour Linux, et le hook échoue sous Windows.
- Écrire une clé ou une URL de fournisseur dans le code : elles vont dans `api/.env` ou `ia/.env`, jamais commités.
- Modifier `db/data/` à la main, ou le commiter.
