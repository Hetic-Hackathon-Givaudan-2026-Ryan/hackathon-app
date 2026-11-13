# 0006. Lancer la démo complète avec `docker compose up`

- Statut : proposée
- Date : 2026-11-12
- Décideurs : l'équipe

## Contexte

Le jalon M2 demande une tranche verticale : `docker compose up`, seul, sans autre commande, doit lancer l'application de l'écran aux données. Aujourd'hui, `compose.yaml` ne démarre que le poste de travail `dev` (`sleep infinity`) et PostgreSQL : il faut ensuite lancer l'API et le front à la main dans le Dev Container (ADR 0001), et le front lit des données mockées (`web/src/data/mock.ts`).

La démo doit aussi montrer la vraie IA, en local (pas de clé ni de compte chez un fournisseur), sans que la démo dépende de la vitesse du LLM : un modèle de 3 milliards de paramètres sur CPU met 20 à 50 s par fiche.

Contraintes : la démo tourne sur un poste Windows ou macOS avec Docker Desktop seulement ; le Dev Container doit continuer à marcher ; aucun secret dans le dépôt.

## Options

1. Garder le Compose de développement et documenter les commandes à lancer : rien à construire. Ne répond pas au jalon (plusieurs commandes, Node sur la machine ou dans le conteneur).
2. Un second fichier, `compose.demo.yaml` : le Compose de développement ne bouge pas. Deux fichiers à tenir à jour, et `docker compose up` seul ne lance toujours pas la démo.
3. Un seul `compose.yaml` avec les services de la démo, le poste `dev` passant dans un profil : `docker compose up` lance la démo, le Dev Container démarre `dev` et `db` comme avant. Trois images à construire (api, web, ia) et un modèle à télécharger au premier lancement.

## Décision

Nous choisissons l'option 3, parce que c'est la seule où `docker compose up` seul lance la tranche complète, avec un fichier unique.

Concrètement :

- Services : `db` (PostgreSQL 17, ADR 0002), `ollama` (image `ollama/ollama`, modèles dans le volume `ollama-models`), `ia` (`ia/Dockerfile`, FastAPI : télécharge le modèle s'il manque, avec reprise en cas d'erreur, le charge en mémoire et vérifie qu'il reste présent), `api` (`api/Dockerfile`, multi-étapes : build TypeScript puis `node dist`), `web` (`web/Dockerfile` : build Vite puis nginx, qui transmet `/api` à l'API). Seul `web` publie un port : <http://localhost:8080>.
- Le service `dev` passe dans `profiles: [dev]`. `.devcontainer/devcontainer.json` le démarre avec `runServices: ["dev"]` (et `db`, par `depends_on`).
- Les données PostgreSQL passent de `db/data/` à un volume Docker, `db-data`. C'est un changement par rapport à l'ADR 0002, qui reste acceptée pour le reste : `docker compose down -v` remet la démo à zéro, et une base créée avant le schéma des prospects n'empêche pas la démo de démarrer.
- Les prospects, signaux, interlocuteurs et scores sont en base (`db/init/003-prospects.sql`, `004-prospects-seed.sql`), avec une fiche pré-rédigée par prospect. `POST /api/prospects/{id}/fiche` fait rédiger une nouvelle fiche par le LLM local et l'enregistre ; si l'IA échoue ou dépasse 110 s, la fiche en base est renvoyée (`openapi.yaml`).
- Modèle par défaut : `qwen2.5:3b` (environ 2 Go). `llama3.2:1b` invente et écrit au nom de Givaudan ; un modèle plus petit que 3B n'a pas été retenu. `OLLAMA_MODEL` permet d'en changer.
- Toutes les variables ont une valeur de démo dans `compose.yaml` (clé du service IA comprise, `demo-cle-locale`) : aucun `.env` n'est nécessaire, et aucune n'est un secret.
- Le front lit l'API par défaut (mode `api`) ; `npm run dev:mock` garde les données mockées.

## Conséquences

- Positives : une commande pour la démo, sur n'importe quel poste avec Docker. Les données passent vraiment par PostgreSQL et l'API, et la régénération montre le LLM local. La démo reste utilisable pendant le téléchargement du modèle, dont l'interface affiche la progression (`GET /api/ia`), et si l'IA tombe.
- Négatives, à accepter : premier lancement long (images à construire et environ 2 Go de modèle). Le LLM garde environ 3 Go de mémoire tant que la démo tourne. Les données de `db/data/` d'un Dev Container existant ne sont plus utilisées : la base repart du seed. Le Dev Container et la démo partagent le nom de projet `hackathon` : les lancer en même temps démarre une seule base, ce qui est voulu.
- À revoir si : la démo doit tourner sur une machine sans Docker, ou avec un fournisseur d'IA hébergé (il suffit alors de changer `OLLAMA_URL` / `MODEL` du service `ia`), ou si le premier lancement doit être plus court (modèle plus petit, images publiées sur un registre).
