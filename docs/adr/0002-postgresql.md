# 0002. Stocker les questions et les réponses dans PostgreSQL 17

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : l'équipe

## Contexte

L'application garde chaque question posée et la réponse rendue par l'IA : une seule table, `questions` (`db/init/001-schema.sql`). L'API Express (`api/src/index.ts`) écrit dans cette table, et le service Python de l'équipe Data/IA (`ia/`) devra pouvoir la lire pour évaluer les réponses.

Contraintes : deux semaines de hackathon, des postes Windows et macOS, une démo sur une autre machine. Toute l'équipe doit partir des mêmes données de test (`db/init/002-seed.sql`).

## Options

1. PostgreSQL en conteneur : image officielle, lancée par `compose.yaml` à côté du Dev Container (ADR 0001). Plusieurs clients en même temps, client `psql` déjà dans l'image de développement. Un service de plus à démarrer.
2. SQLite : un simple fichier, aucun service. Un seul écrivain à la fois, et le fichier est difficile à partager entre le conteneur `dev` et un script Python lancé sur l'hôte.
3. Base gérée dans le cloud (Supabase, Neon) : rien à installer. Dépend du réseau et d'un compte, et chaque poste écrirait dans la même base pendant le développement.

## Décision

Nous choisissons PostgreSQL 17, service `db` de `compose.yaml`, parce que l'API et le service IA doivent lire la même base en même temps, et que le conteneur donne les mêmes données à chaque poste et en démo.

Concrètement :

- Le schéma et les données de test sont dans `db/init/`, joués par l'image au premier démarrage seulement.
- Les données vivent dans `db/data/`, ignoré par git.
- L'API se connecte avec `DATABASE_URL` (`api/.env`), via le pool `pg`.

## Conséquences

- Positives : même moteur et mêmes données de départ sur toutes les machines et en démo. Les réponses de l'IA restent consultables avec `psql` pour les comparer.
- Négatives, à accepter : modifier `db/init/` ne change pas une base existante. Il faut vider `db/data/` pour rejouer les scripts, en perdant les données locales. Il n'y a pas encore d'outil de migration.
- À revoir si : le schéma change plusieurs fois (adopter un outil de migration), ou si l'hébergement de la démo impose une base gérée.
