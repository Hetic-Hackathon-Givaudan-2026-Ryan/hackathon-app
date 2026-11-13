# Hackathon

Application de démonstration composée d’une interface web, d’une API Node.js,
d’une base PostgreSQL et d’un service IA Python indépendant.

## Lancer la démo M2

Seul Docker Desktop est nécessaire (Node, Python et Ollama tournent dans des
conteneurs). Depuis la racine du dépôt :

```sh
docker compose up
```

Puis ouvrir <http://localhost:8080> : accueil, liste des prospects, fiche d’un
prospect. Sur une fiche, **Régénérer avec l’IA** fait réécrire « À retenir » et
« Questions à poser » par le LLM local (20 à 50 s), puis l’enregistre en base.

- **Premier lancement** : Docker construit les images (api, web, ia), puis le
  service `ia` télécharge lui-même le modèle `qwen2.5:3b` (environ 2 Go) et le
  charge en mémoire, en réessayant tant qu’il le faut. Aucune commande à lancer.
  L’interface est utilisable tout de suite : les fiches pré-rédigées sont en
  base, et le bouton de régénération affiche « Modèle IA en téléchargement…
  45 % » jusqu’à ce que le modèle soit prêt.
- **Lancements suivants** : images et modèle sont réutilisés ; l’interface
  répond en une quinzaine de secondes.
- **Repartir de zéro** : `docker compose down -v` efface la base et le modèle
  téléchargé.
- **Autre port ou autre modèle** : `WEB_PORT=8081 docker compose up`,
  `OLLAMA_MODEL=qwen2.5:1.5b docker compose up`. Aucune autre variable n’est
  nécessaire : `compose.yaml` contient des valeurs de démo, pas de secret.

| Service  | Rôle                                                        |
| -------- | ----------------------------------------------------------- |
| `web`    | Front React buildé, servi par nginx, `/api` vers l’API      |
| `api`    | API Express : prospects, régénération des fiches (`/api`)   |
| `db`     | PostgreSQL 17, schéma et données de démo de `db/init/`      |
| `ia`     | Service FastAPI : télécharge le modèle, rédige les fiches   |
| `ollama` | LLM local (modèles dans le volume `ollama-models`)          |
| `dev`    | Poste de travail du Dev Container (profil `dev`, hors démo) |

Choix et limites : [ADR 0006](docs/adr/0006-compose-demo.md).

## Ce qui est simulé

La démo montre le parcours complet, mais plusieurs briques sont fictives ou
simplifiées :

- **Prospects** : les 15 entreprises, leurs interlocuteurs, adresses e-mail
  (`.example`) et sites sont inventés. Ce sont les mêmes que `web/src/data/mock.ts`.
- **Signaux** : lancements, recrutements, levées de fonds… et leurs sources
  (presse, LinkedIn) sont une synthèse rédigée pour la démo, non vérifiée : aucun
  article ni offre d’emploi réel n’est lu.
- **Score** : illustratif, calculé par règles (Potentiel /60, Opportunité /30,
  Accessibilité /10) et figé dans le seed, comme sa tendance. Aucun modèle de
  scoring n’est entraîné.
- **Fiches « À retenir » / « Questions à poser »** : celles de Nordika Foods et
  Maison Lumen viennent de la maquette ; les 13 autres ont été pré-rédigées par
  le LLM local (`qwen2.5:3b`) à partir des faits du prospect, sans relecture.
  Elles peuvent contenir des approximations : l’interface les marque « à
  vérifier ». La régénération, elle, appelle vraiment le LLM.
- **Utilisateur** : « Anne Marie Lefèvre » est fixe. Pas de connexion, pas de
  droits, pas de CRM réel.
- **Boutons sans effet réel** : « Planifier un échange » et « Signaler »
  affichent seulement un message ; la page Rendez-vous est vide (pas d’agenda
  branché) ; « Contacter » ouvre un e-mail vers une adresse fictive.
- **Date du jour** : la démo se croit le 12 novembre 2026, pour que « il y a 8
  jours » reste vrai.

## Prérequis

- Docker Desktop installé et démarré.
- Visual Studio Code avec l’extension **Dev Containers**.
- Git et un accès au dépôt.
- (Optionnel, pour le service IA) Python 3.10+, Ollama et le modèle `llama3.2:1b`,
  ou un fournisseur compatible avec l’API OpenAI configuré dans `api/.env`.

Node.js et le client PostgreSQL sont installés dans le conteneur de développement.
Il n’est donc pas nécessaire de les installer sur la machine hôte pour développer
l’application principale.

## Démarrer l’environnement

1. Cloner le dépôt et l’ouvrir dans Visual Studio Code.
2. Exécuter **Dev Containers: Reopen in Container** depuis la palette de commandes.
   Au premier lancement, VS Code construit le conteneur et installe les dépendances
   npm. Le fichier `api/.env` est créé à partir de `api/.env.example` s’il n’existe
   pas déjà.
3. Dans un terminal du conteneur, démarrer l’API :

   ```sh
   npm run dev --workspace=api
   ```

4. Dans un autre terminal du conteneur, démarrer le site web :

   ```sh
   npm run dev --workspace=web
   ```

5. Ouvrir l’adresse Vite affichée dans le terminal, généralement
   <http://localhost:5173>.

La base PostgreSQL démarre avec Docker Compose. Les scripts SQL de `db/init/`
créent le schéma et insèrent des données de démonstration au premier démarrage
de la base (volume Docker `db-data`). L’interface envoie ses requêtes à l’API via
le proxy Vite `/api`. Pour travailler sans API ni base, `npm run dev:mock
--workspace=web` affiche les données mockées de `web/src/data/mock.ts`.

| Service       | Adresse / port                 | Remarques                                                          |
| ------------- | ------------------------------ | ------------------------------------------------------------------ |
| Interface web | <http://localhost:5173>        | Serveur Vite de développement                                      |
| API           | <http://localhost:3000>        | `/api/health`, `/api/prospects`, `/api/questions` (`openapi.yaml`) |
| PostgreSQL    | `localhost:5432` depuis l’hôte | Base `app`, utilisateur `app`                                      |

### Configuration de l’API et de l’IA

La configuration locale se trouve dans `api/.env` (non versionné). Le fichier
`api/.env.example` est copié automatiquement à la création du conteneur. Vérifier
les variables `DATABASE_URL`, `AI_BASE_URL`, `AI_MODEL` et `AI_API_KEY` selon
l’environnement IA choisi. Pour Ollama installé sur la machine hôte, l’exemple
utilise `host.docker.internal`; la base est joignable depuis le conteneur sous le
nom `db`.

Le dossier `ia/` contient un service FastAPI séparé. La démo le lance en
conteneur, avec Ollama (`docker compose up -d ia` le démarre aussi depuis le
Dev Container ; mettre alors `IA_URL=http://ia:8000` dans `api/.env`). Pour le
lancer plutôt sur la machine hôte, créer son environnement et son fichier de
configuration :

```sh
python -m venv ia/.venv
source ia/.venv/bin/activate
pip install -r ia/requirements.txt
cp ia/.env.example ia/.env
```

Renseigner `API_KEY` dans `ia/.env`, démarrer Ollama et récupérer le modèle
configuré dans `MODEL`, puis lancer le serveur depuis la racine du dépôt :

```sh
uvicorn main:app --reload --env-file ia/.env --app-dir ia --port 8000
```

La documentation interactive FastAPI est alors disponible à
<http://localhost:8000/docs>. Les requêtes à `POST /answer` et `POST /fiche`
doivent fournir l’en-tête `X-API-Key`. Ce service IA est distinct de l’intégration compatible
OpenAI utilisée par l’API Node.js.

## Développement et vérifications

Depuis la racine du dépôt, dans le conteneur :

```sh
npm run lint
npm run format:check
npm run build --workspace=api
npm run build --workspace=web
```

Pour appliquer le formatage :

```sh
npm run format
```

ESLint contrôle JavaScript et TypeScript. Prettier applique le formatage commun
(configuration dans `.prettierrc.json`). Le hook pre-commit exécute les
vérifications prévues par Husky/lint-staged.

## Conventions de nommage

- **Fichiers et dossiers** : noms minuscules ; utiliser des noms explicites
  (ex. `main.ts`, `init/`).
- **TypeScript / JavaScript** : `camelCase` pour variables et fonctions,
  `PascalCase` pour types et classes, `UPPER_SNAKE_CASE` pour les variables
  d’environnement.
- **Python** : `snake_case` pour modules, fonctions et variables ; `PascalCase`
  pour les classes ; `UPPER_SNAKE_CASE` pour les constantes et variables
  d’environnement.
- **SQL** : `snake_case` pour tables et colonnes (ex. `created_at`).
- Conserver les changements de formatage automatiques et lancer les vérifications
  avant d’ouvrir une pull request.

## Structure du dépôt

```text
api/       API Express en TypeScript
web/       Interface web React + TypeScript servie par Vite
ia/        Service FastAPI Python indépendant
db/init/   Schéma et données SQL initiales de PostgreSQL
.devcontainer/  Configuration de l’environnement VS Code / Docker
compose.yaml    Démo complète (`docker compose up`) et poste de développement
```
