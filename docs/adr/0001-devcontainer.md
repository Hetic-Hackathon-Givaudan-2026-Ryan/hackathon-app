# 0001. Développer dans un Dev Container lancé par Docker Compose

- Statut : proposée
- Date : 2026-11-05
- Décideurs : l'équipe

## Contexte

Plusieurs personnes développent l'application sur des machines différentes (Windows, macOS), avec des versions de Node.js et de PostgreSQL qui ne sont pas les mêmes d'un poste à l'autre. Le hackathon est court : chaque nouvel arrivant doit pouvoir lancer le projet en quelques minutes, sans installer Node.js ni PostgreSQL sur sa machine.

La CI tourne déjà dans l'image `node:24-trixie`. L'application a besoin d'une base PostgreSQL 17 pendant le développement.

## Options

1. Installation locale de Node.js et PostgreSQL : rien à apprendre, mais chacun a ses versions, et une erreur peut apparaître sur un poste et pas sur un autre.
2. Docker Compose seul, avec l'outillage installé sur la machine : la base est identique pour tous, mais Node.js, les extensions et les réglages de l'éditeur restent différents d'un poste à l'autre.
3. Dev Container VS Code adossé à Docker Compose : tout l'environnement (Node.js, client PostgreSQL, extensions, réglages, base) est décrit dans le dépôt. Il faut Docker Desktop et VS Code, et le conteneur consomme de la mémoire.

## Décision

Nous choisissons l'option 3, parce qu'elle donne à toute l'équipe le même environnement que la CI, base comprise, en une seule commande : **Dev Containers: Reopen in Container**.

Concrètement :

- `compose.yaml` décrit deux services. `dev` est le poste de travail auquel VS Code s'attache, et `db` est PostgreSQL 17. `dev` attend que `db` soit prêt (healthcheck) avant de démarrer.
- `.devcontainer/Dockerfile` part de `typescript-node:24-trixie`, la même version de Node.js et de Debian que la CI, et ajoute le client `psql` 17.
- `.devcontainer/devcontainer.json` installe la CLI GitHub et les extensions ESLint, Prettier et GitHub Pull Requests. Il active aussi le formatage à l'enregistrement.
- À la création du conteneur, `npm ci` installe les dépendances, puis `api/.env` est créé à partir de `api/.env.example`.
- Les ports 3000 (API), 5173 (web) et 5432 (base) sont redirigés vers la machine hôte.
- Ollama tourne sur la machine hôte. Le conteneur le joint par `host.docker.internal`.

## Conséquences

- Positives : un nouvel arrivant clone le dépôt et lance le projet sans rien installer d'autre que Docker et VS Code. Le développement, la CI et la production partagent la même version de Node.js, et tout le code est formaté et vérifié de la même façon.
- Négatives, à accepter : Docker Desktop est obligatoire et consomme de la mémoire. Le premier démarrage est long, le temps de construire l'image. Une erreur de démarrage de la base bloque tout le Dev Container.
- À revoir si : le service Python `ia/`, qui tourne aujourd'hui hors du conteneur, doit être lancé par toute l'équipe ; ou si le conteneur devient trop lourd pour les machines de l'équipe.
