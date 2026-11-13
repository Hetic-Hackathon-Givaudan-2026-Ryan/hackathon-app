# 0007. Rédiger les fiches prospect avec `qwen2.5:3b` en local, via Ollama

- Statut : proposée (à discuter : un seul modèle testé sérieusement)
- Date : 2026-11-13
- Décideurs : l'équipe

## Contexte

La fiche prospect contient deux blocs rédigés par un LLM : « À retenir » (3 points sourcés) et « Questions à poser » (4 questions). Le service `ia/` (`POST /fiche`) envoie au LLM des faits numérotés (entreprise, signaux, interlocuteurs, historique) et lui impose une sortie JSON structurée. Le LLM cite le numéro du fait qu'il reformule : la source affichée vient du fait, jamais du LLM. Une réponse non conforme (texte à la première personne, fait non cité) est rejetée, puis redemandée jusqu'à deux fois.

La démo M2 tourne en local avec `docker compose up` (ADR 0006), sur un PC portable sans GPU dédié : le modèle tourne sur CPU, dans le conteneur `ollama`.

Contraintes : la démo doit marcher hors ligne, sans clé ni compte chez un fournisseur ; le premier lancement doit rester raisonnable ; une fiche doit s'écrire en moins de 2 minutes ; le texte doit être en français correct. Les prospects de la démo sont fictifs : la confidentialité n'est pas un enjeu aujourd'hui, elle le deviendra avec de vraies données CRM.

## Ce qui a été testé

Mesures prises le 12 et le 13 novembre 2026 sur le poste de Ryan (Docker Desktop, CPU), avec le prompt et le filtre actuels de `ia/main.py` :

| Modèle                                                      | Taille   | Testé                                                                      | Résultat                                                                                                                                                                                                              |
| ----------------------------------------------------------- | -------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qwen2.5:3b`                                                | ~1,9 Go  | Oui : 13 fiches pré-rédigées (deux passes), une quinzaine de régénérations | Français correct, JSON toujours valide. 18 à 38 s par fiche une fois le modèle chargé, environ 50 s à froid. Environ 1 réponse sur 6 rejetée par le filtre puis réussie au nouvel essai. Invente parfois des détails. |
| `llama3.2:1b`                                               | ~1,3 Go  | Oui, plus tôt et sur l'autre prototype (dépôt Equipe-01)                   | Écarté : invente davantage et écrit au nom de Givaudan (« nous »).                                                                                                                                                    |
| `qwen2.5:1.5b`                                              | ~1 Go    | Non                                                                        | Plus rapide à télécharger et à exécuter ; qualité inconnue. Le prototype Equipe-01 conseille au moins 3B paramètres.                                                                                                  |
| `llama3.2:3b`                                               | ~2 Go    | Non                                                                        | Même taille que `qwen2.5:3b` ; français a priori moins bon, à vérifier.                                                                                                                                               |
| Modèles 7B et plus (`mistral`, `qwen2.5:7b`, `llama3.1:8b`) | 4 à 5 Go | Non                                                                        | Probablement meilleurs, mais lents sur CPU (plusieurs minutes par fiche) et plus longs à télécharger.                                                                                                                 |
| API hébergée compatible OpenAI (Mistral, OpenAI…)           | –        | Non                                                                        | Meilleure qualité attendue. L'API Express sait déjà en appeler une (`ask()`, variables `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`). Il faut une clé et du réseau, et les données sortent de la machine.                  |

Défauts observés avec `qwen2.5:3b`, que le filtre ne voit pas : détails inventés (« bière artisanale » pour un fabricant de sodas, « parfums » pour une boulangerie), phrases plates (« Entreprise PME à Liège »), parfois une question tournée vers Givaudan plutôt que vers le client. Les fiches sont marquées « à vérifier » dans l'interface.

## Options

1. `qwen2.5:3b` en local : le seul modèle testé qui donne des fiches utilisables, en un temps acceptable sur CPU.
2. Un modèle plus petit (`qwen2.5:1.5b`, `llama3.2:1b`) ou un autre 3B (`llama3.2:3b`) : démarrage et rédaction plus rapides pour les petits, au risque de fiches plus fausses.
3. Un modèle 7B ou plus en local : meilleure qualité probable, temps de réponse incompatibles avec une démo sur CPU.
4. Une API hébergée compatible OpenAI : meilleure qualité, déjà prévue côté API Express. Mais pas de démo hors ligne, une clé à gérer, et les données prospect envoyées à un tiers une fois qu'elles seront réelles.

## Décision (provisoire)

Nous gardons l'option 1 pour la démo M2 : `qwen2.5:3b`, servi par Ollama dans `compose.yaml` (ADR 0006), parce que c'est le seul modèle testé qui tient à la fois la qualité minimale, le temps de réponse sur CPU et la contrainte « tout en local ».

Cette décision reste à discuter : aucun autre modèle n'a été comparé avec le même prompt et les mêmes prospects. Le modèle se change sans toucher au code, avec `OLLAMA_MODEL` (`OLLAMA_MODEL=qwen2.5:1.5b docker compose up`).

## Pour trancher

Comparer au moins `qwen2.5:1.5b`, `qwen2.5:3b` et un modèle 7B (et, si l'équipe l'accepte, une API hébergée) sur les mêmes 15 prospects de `db/init/004-prospects-seed.sql`, avec :

- le temps par fiche (à froid et une fois chargé) et la mémoire utilisée ;
- le taux de réponses rejetées par le filtre ;
- une relecture humaine de chaque fiche : faits inventés, français, utilité des questions pour un commercial.

Le statut passe à « acceptée » une fois ce comparatif fait par l'équipe Data/IA (Equipe-01), et le modèle choisi.

## Conséquences

- Positives : démo hors ligne, sans clé ni coût, données gardées sur la machine. Changer de modèle ne demande qu'une variable, `OLLAMA_MODEL`, sans toucher au code.
- Garde-fous déjà en place contre un modèle faible : sortie JSON imposée, filtre des réponses (fait non cité, « nous »), jusqu'à deux nouveaux essais, et repli sur la fiche en base si l'IA échoue ou dépasse le délai. Les fiches sont affichées « à vérifier ».
- Négatives, à accepter pour l'instant : environ 2 Go à télécharger au premier lancement, environ 3 Go de mémoire pendant la démo, 20 à 40 s par fiche, et des fiches qu'il faut relire.
- À revoir si : la démo dispose d'un GPU (un 7B devient possible), si la relecture montre trop d'inventions, ou si l'équipe accepte un fournisseur hébergé.
