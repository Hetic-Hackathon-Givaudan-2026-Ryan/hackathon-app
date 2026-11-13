# Limites et biais

Ce document recense les limites connues de la partie Data/IA à la date du 13 novembre 2026. Chaque point s'appuie sur le code, les données ou les mesures du dépôt ; ce qui n'a pas été vérifié est indiqué comme tel.

## A. Données

1. **Données entièrement fictives.** L'en-tête de `db/init/004-prospects-seed.sql` le dit : entreprises, personnes, sources et signaux sont inventés. Les 13 fiches pré-enregistrées ont été rédigées par le LLM et ne sont pas relues.
2. **Sources qui ressemblent à de vraies sources.** Les signaux citent des médias existants (« L'Echo », « Il Sole 24 Ore », « Les Échos ») pour des événements inventés. En démonstration, il faut le dire explicitement pour ne pas laisser croire à des articles réels.
3. **Aucune collecte réelle dans `ia/`.** Le service reçoit des faits déjà constitués (`ProspectFacts`) ; il ne collecte rien. Toute affirmation de collecte automatique de données publiques doit être justifiée par un autre composant, que cette relecture n'a pas examiné.
4. **Couverture géographique étroite.** Les 15 prospects sont tous européens (Danemark, France, Italie, Espagne, Belgique, Pays-Bas, Allemagne, Pologne, Suisse, Norvège, Portugal), tous en français. Rien n'est démontré pour d'autres marchés ou d'autres langues.
5. **Échantillon réduit.** 15 prospects, 1 exécution par modèle : les mesures sont indicatives, sans valeur statistique.

## B. Score

6. **Les scores de la démo sont des valeurs écrites dans le jeu de données** (colonnes `score_total` et `score_axes`). Le service `ia/` ne calcule aucun score. Le caractère « déterministe » du calcul n'a pas été vérifié dans le code examiné.
7. **Pondérations fixées à la main**, non calibrées sur des ventes réelles : trois axes (Potentiel sur 60, Opportunité sur 30, Accessibilité sur 10).
8. **Biais de structure en faveur des grandes entreprises et des clients existants.** Le critère « Taille & solidité » vaut jusqu'à 15 points : dans les données, les ETI obtiennent 11 à 14 et les PME 6 à 10. L'axe « Accessibilité » avantage les prospects déjà en lien avec Givaudan.
9. **Pas de mesure de la qualité du classement** (ordre des prospects) face à un classement de référence : aucun classement de référence n'existe dans le dépôt.

## C. Modèle de langage

10. **Petit modèle sur CPU** (`qwen2.5:3b`). Défauts relevés dans `COMPARAISON.md` : détails non soutenus (Kora Dairy, Lys & Co), contresens, points redondants, fautes d'orthographe (« entrepot »).
11. **Gabarit de questions induit par le prompt.** Le prompt système cite « goût, formulation, réglementation, calendrier, décision » : 13 fiches sur 14 contiennent une question réglementaire, alors que 2 prospects seulement ont un signal réglementaire dans les données.
12. **Questions tournées vers Givaudan** dans 5 fiches sur 14, alors que la consigne demande des questions à poser au client.
13. **Filtre limité.** Il rejette « nous / notre / nos / je » et les consignes recopiées ; il ne détecte ni les inventions, ni la 2e personne (« Recrutez », « Lancez » observés dans 2 fiches), ni les doublons.
14. **Sources dépendantes du numéro choisi par le LLM.** La source affichée vient du fait numéroté, mais c'est le LLM qui choisit le numéro : au moins 4 points sur 42 portent une source qui ne correspond pas à leur contenu. L'affirmation « la source ne vient jamais du LLM » est donc à nuancer.
15. **Non-déterminisme.** Températures de 0,2, 0,5 puis 0,8 selon les essais : deux exécutions donnent des fiches différentes.
16. **Aucun contrôle des numéros de fait invalides** n'est signalé à l'utilisateur : un numéro hors plage est simplement ignoré (`ref()` dans `clean()`).

## D. Performance

17. **Durée** : médiane 62,2 s, maximum 200,9 s ; 2 fiches sur 15 dépassent 2 minutes, 1 sur 15 échoue (`504`). La contrainte « moins de 2 minutes » de l'ADR 0007 n'est pas tenue sur ce poste.
18. **Écart non expliqué** avec les 18 à 38 s annoncés dans l'ADR 0007 (mesure sur un autre poste).
19. **Durée supérieure au délai configuré** : la fiche Nordika Foods a pris 165 s alors que `FICHE_TIMEOUT` vaut 100 s ; la cause n'est pas établie.
20. **Mémoire** : 4,24 Gio utilisés sur 6,73 Gio disponibles : un modèle 7B est hors de portée de ce poste.

## E. Validation et usage

21. **Aucune validation terrain** dans le dépôt : pas d'évaluation de l'utilité des fiches par des commerciaux Givaudan.
22. **Relecture humaine des fiches non terminée** : les colonnes de `review_*.csv` doivent être remplies par l'équipe ; la relecture de `COMPARAISON.md` est une proposition.
23. **Confidentialité.** Aujourd'hui sans enjeu (données fictives, modèle local, hors ligne). Avec de vraies données CRM, l'usage d'une API hébergée enverrait les données prospect à un tiers (ADR 0007).
24. **Comparaison de modèles incomplète** : `qwen2.5:1.5b` non mesuré à la date de rédaction, modèles 7B et API hébergée non testés ; l'ADR 0007 reste « proposée ».

## F. Pistes pour la suite

- Retirer l'énumération de thèmes du prompt, ou la rendre conditionnelle aux signaux présents.
- Ajouter au filtre : détection de la 2e personne, des doublons et des questions tournées vers Givaudan.
- Contrôler la cohérence entre la source affichée et le contenu du point.
- Constituer un jeu de référence annoté (30 cas) et mesurer précision/rappel sur les inventions.
- Mesurer d'autres modèles (`qwen2.5:1.5b`, un 7B sur machine avec GPU) avec le même script.
