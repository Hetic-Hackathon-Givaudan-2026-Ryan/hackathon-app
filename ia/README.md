# Service IA (`ia/`)

Service FastAPI de l'équipe Data/IA. Il rédige, avec un LLM local servi par Ollama, les deux blocs rédigés de la fiche prospect : « À retenir » (3 points sourcés) et « Questions à poser » (4 questions). Version 1.2.0, code dans `ia/main.py`.

## Ce que fait le service, et ce qu'il ne fait pas

- **Il fait** : transformer les faits d'un prospect en 3 points « À retenir » et 4 questions, en français.
- **Il ne fait pas** : calculer un score. Le service ne reçoit et ne produit aucun score (voir le modèle `ProspectFacts` dans `main.py`). Dans le jeu de démonstration, les scores sont des valeurs écrites dans `db/init/004-prospects-seed.sql`.
- Les prospects de la démo sont fictifs (voir l'en-tête de `004-prospects-seed.sql`).

## Routes

| Route          | Rôle                                                                                              | Clé `X-API-Key` |
| -------------- | ------------------------------------------------------------------------------------------------- | --------------- |
| `GET /health`  | Le service répond ; indique l'état du modèle : `attente`, `telechargement`, `chargement`, `pret`. | non             |
| `POST /fiche`  | Rédige « À retenir » et « Questions à poser » à partir d'un `ProspectFacts`.                      | oui             |
| `POST /answer` | Réponse libre à une question, appel direct au LLM, sans les garde-fous de `/fiche`.               | oui             |

Codes d'erreur de `/fiche` : `401` clé invalide, `502` réponse du LLM non conforme après les essais, `503` modèle pas encore prêt (téléchargement ou chargement en cours), `504` Ollama injoignable ou trop lent.

## Configuration

| Variable        | Rôle                                                                  | Valeur                                                                 |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `API_KEY`       | Clé exigée dans `X-API-Key`. Sans clé, le service refuse de démarrer. | `demo-cle-locale` dans `compose.yaml` (valeur de démo, pas un secret)  |
| `OLLAMA_URL`    | Adresse d'Ollama                                                      | `http://localhost:11434` par défaut ; `http://ollama:11434` en compose |
| `MODEL`         | Modèle utilisé                                                        | `llama3.2:1b` par défaut dans le code ; `qwen2.5:3b` en compose        |
| `FICHE_TIMEOUT` | Durée maximale d'une rédaction de fiche, en secondes                  | `100`                                                                  |

En compose, le modèle se change avec la variable `OLLAMA_MODEL` (voir `docs/data/REPRODUCTION.md`).

## Fonctionnement de `POST /fiche`

1. Les champs du prospect deviennent des **faits numérotés**, chacun avec sa source (fiche entreprise, signal daté, synthèse, interlocuteur, historique Givaudan).
2. Le LLM reçoit un prompt système et un schéma JSON imposé (sortie structurée d'Ollama). Il répond avec le **numéro du fait** qu'il reformule.
3. La **source affichée est celle du fait numéroté**. Le LLM ne l'écrit pas, mais c'est lui qui choisit le numéro : un mauvais numéro donne une mauvaise source (voir `LIMITES-BIAIS.md`).
4. Un filtre (`clean()`) rejette la réponse si : elle contient « phrase claire/courte », « nous », « notre », « nos » ou « je » ; un point « À retenir » est une question ; il reste moins de 2 points ou moins de 2 questions.
5. En cas de rejet, nouvel essai, jusqu'à 3 essais en tout (températures 0,2 puis 0,5 puis 0,8), tant qu'il reste au moins 20 s sur le délai `FICHE_TIMEOUT`.
6. Paramètres Ollama : `num_predict` 600, `repeat_penalty` 1,15, `keep_alive` -1 (modèle gardé en mémoire).

## Gestion du modèle

Un fil de fond attend Ollama, télécharge le modèle s'il manque (avec reprise en cas d'erreur), le charge en mémoire, puis vérifie régulièrement qu'il est toujours là. Tant que le modèle n'est pas prêt, `/fiche` répond `503` avec un message lisible, et `/health` donne l'avancement.

## Lancer le service

- **Avec Docker (recommandé)** : voir `docs/data/REPRODUCTION.md`. En compose, le port 8000 du service n'est pas publié : l'interface passe par l'API (`api`) ; pour interroger `ia` à la main, utiliser `docker compose exec ia …`.
- **Sans Docker** : depuis `ia/`, avec un Ollama local et un fichier `.env` (voir `.env.example`) : `uvicorn main:app --env-file .env`. La documentation Swagger est alors sur `http://localhost:8000/docs`.

## Pour aller plus loin

- Comparaison V1/V2 et mesures du modèle : `docs/data/COMPARAISON.md`
- Limites et biais : `docs/data/LIMITES-BIAIS.md`
- Choix du modèle : `docs/adr/0007-modele-ia-local.md`
