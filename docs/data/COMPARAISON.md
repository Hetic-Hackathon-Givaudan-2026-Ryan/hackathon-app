# Comparaison des versions et mesures du modèle

## 1. Périmètre et méthode

- **Ce qui est évalué** : la rédaction des fiches prospect (« À retenir » ×3, « Questions à poser » ×4) par le service `ia/` (`POST /fiche`).
- **Jeu de test** : les 15 prospects fictifs de `db/init/004-prospects-seed.sql`, avec leurs signaux et interlocuteurs.
- **Pipeline** : celui du commit courant (V2, voir ci-dessous), prompt et filtre inchangés.
- **Outil de mesure** : `bench_fiches.py` (voir `REPRODUCTION.md`).
- **Date et poste** : 13 novembre 2026, PC portable sans GPU, Docker Desktop, 6,73 Gio de mémoire pour Docker.
- **Limite de la méthode** : une seule exécution par modèle, sur un seul poste.

## 2. Ce que « V1 » et « V2 » désignent

Le dépôt ne contient aucun tag V1 ou V2. Les seuls jalons sont `m0`, `m1`, `m2` (jalons du projet, pas du modèle). Pour le service `ia/`, l'historique ne compte que deux commits :

| Version | Commit | Contenu |
| --- | --- | --- |
| V1 | `8872dbc` « Appel à l'IA » | premier appel au LLM ; contenu exact à confirmer avec `git show 8872dbc:ia/main.py` |
| V2 | `5517a8a` (tag `m2`) | service complet : route `/fiche`, faits numérotés et sourcés, sortie JSON imposée, filtre, jusqu'à 3 essais, téléchargement et chargement automatiques du modèle (+373 lignes, −6 dans `ia/`) |

**Conséquence** : la V1 ne produisait pas de fiches `/fiche`. Une comparaison chiffrée V1/V2 sur les 15 prospects n'est donc pas possible, et nous ne présentons pas de chiffre inventé. La comparaison chiffrée porte sur les **modèles**, avec le pipeline V2. C'est aussi ce que demande l'ADR 0007 (« Pour trancher »).

## 3. Résultats mesurés : `qwen2.5:3b` (pipeline V2)

| Mesure | Résultat |
| --- | --- |
| Prospects testés | 15 |
| Fiches obtenues (HTTP 200) | **14** |
| Échecs | **1** : Hestia Bakery, `504` (Ollama trop lent), après 100,2 s |
| Réponses rejetées par le filtre (logs) | 1 |
| Durée, médiane (fiches obtenues) | 62,2 s |
| Durée, moyenne | 81,7 s |
| Durée, maximum | 200,9 s (Solenne Cosmétiques) |
| Fiches au-dessus de 2 minutes | 2 : Nordika Foods (165,0 s), Solenne Cosmétiques (200,9 s) |
| Mémoire d'Ollama | 4,24 Gio sur 6,73 Gio |

Durée par prospect (s) : Atelier Sève 86,3 · Aurel Parfums 53,4 · Brava Snacks 64,0 · Camille & Fils 52,9 · Fjord Kitchen 57,4 · Hestia Bakery 100,2 (échec) · Kora Dairy 57,5 · Lys & Co 58,7 · Maison Lumen 77,5 · Melo Drinks 60,5 · Nordika Foods 165,0 · Ostra Nutrition 67,5 · Solenne Cosmétiques 200,9 · Terrae Bio 56,3 · Vélia Beverages 85,6.

## 4. Comparaison avec les autres modèles

| Modèle | Statut | Résultat |
| --- | --- | --- |
| `qwen2.5:3b` | **mesuré ici** | voir section 3 |
| `qwen2.5:1.5b` | non mesuré à la date de rédaction | à ajouter depuis `bench_results/summary.csv` (une ligne par exécution) |
| `llama3.2:1b` | écarté dans l'ADR 0007 (mesure de Ryan, non reproduite ici) | « invente davantage et écrit au nom de Givaudan » |
| Modèles 7B et plus | non testés | mémoire insuffisante sur ce poste : `qwen2.5:3b` occupe déjà 4,24 Gio sur 6,73 Gio |
| API hébergée | non testée | hors périmètre « tout en local » |

**Écart avec l'ADR 0007** : l'ADR indique 18 à 38 s par fiche pour `qwen2.5:3b` (mesure de Ryan, 12 et 13 novembre). Nous mesurons une médiane de 62,2 s. Nous n'avons pas établi la cause (poste différent, charge de la machine, ou autre). Les deux séries ne sont pas comparables telles quelles.

## 5. Qualité des fiches : relecture

> **Statut : proposition de relecture, à valider par l'équipe.** Elle est faite sur le contenu de `results_qwen2.5-3b_20261113-1607.json`, en comparant chaque fiche aux faits de `004-prospects-seed.sql`. Les colonnes « faits inventés / français / utilité » de la feuille `review_*.csv` restent à remplir par une personne de l'équipe.

### 5.1 Défauts récurrents (14 fiches lues)

| N° | Défaut | Fréquence | Détail |
| --- | --- | --- | --- |
| 1 | Question « réglementation » sans signal réglementaire | 11 fiches sur 14 | 13 fiches sur 14 contiennent une question réglementaire ; seuls Brava Snacks et Terrae Bio ont un signal de type « Réglementation » dans les données |
| 2 | Question tournée vers Givaudan au lieu du client | 5 fiches sur 14 | Atelier Sève, Aurel Parfums, Kora Dairy, Terrae Bio, Vélia Beverages |
| 3 | Source affichée qui ne correspond pas au contenu du point | au moins 4 points sur 42 | Nordika Foods (2 points sourcés « Interlocuteurs identifiés » alors qu'ils viennent d'un signal LinkedIn et de l'historique Givaudan), Brava Snacks (1), Vélia Beverages (1), sourcés « Fiche entreprise » |
| 4 | Point rédigé à la 2e personne | 2 fiches | Ostra Nutrition (« Recrutez… »), Solenne Cosmétiques (« Lancez… ») : le filtre ne les voit pas |
| 5 | Points redondants ou génériques | 4 fiches | Atelier Sève et Terrae Bio (deux points disent la même chose), Aurel Parfums et Camille & Fils (points sans contenu propre) |
| 6 | Affirmation non soutenue par les faits | 2 fiches | Kora Dairy, Lys & Co (détail au 5.2) |

### 5.2 Constats par fiche

| Prospect | Durée (s) | Constats |
| --- | --- | --- |
| Atelier Sève | 86,3 | points 1 et 3 redondants ; question tournée vers Givaudan ; question réglementaire sans signal |
| Aurel Parfums | 53,4 | points génériques (« Entreprise PME · Portée internationale ») ; question tournée vers Givaudan ; question réglementaire sans signal |
| Brava Snacks | 64,0 | « n'a jamais travaillé avec » alors que l'historique dit « aucun échange connu » ; point 1 mal sourcé ; question réglementaire justifiée |
| Camille & Fils | 52,9 | fiche générique : aucun signal dans les données, donc rien de spécifique à dire |
| Fjord Kitchen | 57,4 | faute (« entrepot ») ; question réglementaire sans signal |
| Hestia Bakery | 100,2 | **échec 504** |
| Kora Dairy | 57,5 | « cherche une collaboration » : absent des faits ; « l'entreprise est déjà bien adaptée aux besoins de Kora Dairy » : contresens (l'adéquation concerne l'offre Givaudan) ; question tournée vers Givaudan |
| Lys & Co | 58,7 | « Directrice de luxe » : « de luxe » absent des faits ; question réglementaire sans signal |
| Maison Lumen | 77,5 | cite « Claire Dumas » comme décideur : **à vérifier** dans la table `contacts` (lignes non relues) ; question réglementaire sans signal |
| Melo Drinks | 60,5 | question sur des « parfums innovants » pour un fabricant de sodas : hors sujet ; question réglementaire sans signal |
| Nordika Foods | 165,0 | 2 points mal sourcés ; dépasse 2 minutes ; question réglementaire sans signal |
| Ostra Nutrition | 67,5 | point 1 à la 2e personne ; question réglementaire sans signal |
| Solenne Cosmétiques | 200,9 | point 1 à la 2e personne ; dépasse 2 minutes ; question réglementaire sans signal |
| Terrae Bio | 56,3 | points 1 et 3 quasi identiques ; question tournée vers Givaudan ; question réglementaire justifiée |
| Vélia Beverages | 85,6 | point 1 mal sourcé ; question tournée vers Givaudan ; question réglementaire sans signal |

Seul point que le filtre de `ia/main.py` détecte : le texte à la première personne (« nous », « je »…). Un seul rejet a été compté dans les logs sur la série.

## 6. Lecture des résultats

1. **Forme** : le modèle produit des fiches complètes (3 points, 4 questions, JSON valide) pour 14 prospects sur 15, ce qui confirme l'intérêt de la sortie structurée.
2. **Fond** : les fiches sont utilisables comme brouillon, pas comme texte final. Les questions suivent un gabarit (goût, formulation, réglementation, calendrier) que le prompt système énumère lui-même ; ce gabarit se retrouve même quand aucun fait ne le justifie.
3. **Sources** : la source affichée est celle du fait dont le LLM donne le numéro. Un mauvais numéro produit une source fausse, ce que le filtre ne contrôle pas.
4. **Vitesse** : la contrainte « moins de 2 minutes par fiche » (ADR 0007) n'est pas tenue pour 2 fiches sur 15, et 1 fiche échoue.
5. **Le libellé « à vérifier »** affiché dans l'interface est justifié par ces constats.
6. **Décision sur le modèle** : le comparatif demandé par l'ADR 0007 n'est pas terminé tant que `qwen2.5:1.5b` n'est pas mesuré. Le statut de l'ADR reste « proposée ».
