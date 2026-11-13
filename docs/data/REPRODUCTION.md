# Reproduire les résultats Data/IA

Ce document permet à une personne extérieure de relancer la démo et la mesure des fiches prospect, depuis un dépôt vierge.

**Ce qui est reproductible** : la procédure, les données (15 prospects dans `db/init/`), le code (`ia/main.py`, `bench_fiches.py`), les ordres de grandeur des mesures.
**Ce qui ne l'est pas** : le texte exact des fiches et les durées exactes. Le LLM tire ses réponses avec une température de 0,2, puis 0,5 et 0,8 en cas de nouvel essai (`ask_llm` dans `ia/main.py`) : deux lancements donnent deux textes différents.

## Prérequis

| Élément | Valeur |
| --- | --- |
| Docker Desktop (Compose v2) | testé avec Docker Desktop 4.99.0, sous Windows |
| Mémoire allouée à Docker | au moins 6 Gio (mesure : 6,73 Gio disponibles, 4,24 Gio utilisés par Ollama avec `qwen2.5:3b`) |
| Disque | environ 2 Go pour le modèle, plus les images Docker |
| Python 3 sur l'hôte | uniquement pour `bench_fiches.py` (bibliothèque standard, rien à installer) |
| Réseau | nécessaire au premier lancement (images et modèle) ; la démo tourne ensuite hors ligne |
| GPU | aucun : le modèle tourne sur CPU |

## Étapes

### 1. Récupérer le code

```
git clone <URL du dépôt> hackathon-app
cd hackathon-app
git checkout <branche contenant les livrables Data>
```

(L'URL s'obtient avec `git remote get-url origin` dans le dossier du projet.)

### 2. Démarrer la stack

```
docker compose up -d --build
```

Cinq services démarrent : `db` (PostgreSQL 17), `ollama`, `ia`, `api`, `web`. Au premier lancement, le service `ia` télécharge `qwen2.5:3b` (environ 1,9 Go) : compter plusieurs minutes.

### 3. Attendre que le modèle soit prêt

```
docker compose exec -T ia python -c "import httpx; print(httpx.get('http://localhost:8000/health').json())"
```

Répéter jusqu'à voir `'model_ready': True` (états possibles : `attente`, `telechargement`, `chargement`, `pret`).

### 4. Vérifier la démo et les données

- Interface : http://localhost:8080 (si le port est pris : `$env:WEB_PORT="8081"` avant le `docker compose up`).
- Données : `docker compose exec -T db psql -U app -d app -c "select count(*) from prospects;"` doit renvoyer **15**.

### 5. Lancer la mesure des fiches

Depuis la racine du dépôt :

```
python bench_fiches.py
```

Le script lit les 15 prospects dans la base, appelle `POST /fiche` du service `ia` pour chacun, mesure le temps et compte les réponses rejetées par le filtre. Durée observée sur le poste de référence : environ 21 minutes (somme des 15 durées = 1 244 s).

Sorties dans `bench_results/` :

- `results_<modèle>_<date>.json` : les 15 réponses brutes, avec statut HTTP et durée ;
- `summary.csv` : une ligne par exécution (modèle, médiane, moyenne, maximum, échecs, rejets, mémoire) ;
- `review_<modèle>_<date>.csv` : feuille de relecture humaine (colonnes à remplir à la main : faits inventés, français, utilité des questions).

### 6. Mesurer un autre modèle

```
$env:OLLAMA_MODEL="qwen2.5:1.5b"; docker compose up -d
python bench_fiches.py
```

(Sous bash : `OLLAMA_MODEL=qwen2.5:1.5b docker compose up -d`.) Le script attend lui-même que le nouveau modèle soit téléchargé et chargé. **Revenir ensuite au modèle de la démo** :

```
Remove-Item Env:OLLAMA_MODEL
docker compose up -d
```

### 7. Repartir de zéro

```
docker compose down -v
```

Attention : `-v` supprime aussi les volumes, donc la base **et le modèle téléchargé** (nouveau téléchargement de 2 Go).

## Résultats de référence

Mesure du 13 novembre 2026, `qwen2.5:3b`, une seule exécution (détail dans `COMPARAISON.md`) : 14 fiches sur 15 obtenues, médiane 62,2 s, maximum 200,9 s, 1 échec (`504`). Une nouvelle exécution doit donner le même ordre de grandeur, pas les mêmes valeurs.

## Dépannage

| Symptôme | Cause probable | Action |
| --- | --- | --- |
| `503` sur `/fiche` | modèle pas encore prêt | attendre `model_ready: True` (étape 3) |
| `504` sur `/fiche` | délai `FICHE_TIMEOUT` (100 s) dépassé | relancer ; fermer les applications gourmandes |
| Le script s'arrête sur « ERREUR » | stack arrêtée | `docker compose ps`, puis `docker compose up -d` |
| Messages d'`ia` | | `docker compose logs ia --tail 20` |

## Journal de validation

À remplir par la personne qui rejoue la procédure sur un dépôt vierge :

- [ ] Étapes 1 à 5 rejouées sur un clone vierge le ____ / ____ / ______ par ______________
- [ ] Résultat : ____ fiches sur 15, médiane ____ s
