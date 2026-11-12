# 0004. Construire le front `web/` avec React et TypeScript

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : l'équipe

## Contexte

Le front `web/` est aujourd'hui une page en TypeScript sans framework (`web/src/main.ts`) : un formulaire qui envoie une question à l'API et une liste des réponses. Le besoin a changé : l'application devient un dashboard pour les commerciaux de Givaudan, avec trois pages (tableau de bord, base des prospects, fiche prospect), validées sur maquette le 10 novembre.

Ces pages répètent les mêmes éléments : cartes d'indicateurs, tableaux triables et filtrables, badges de score, navigation commune. Elles affichent pour l'instant des données mockées, remplacées plus tard par l'API et la base fournies par l'équipe Data/IA. Le prototype en TypeScript sans framework montre déjà les limites : HTML dans des chaînes de caractères, écouteurs d'événements rebranchés à chaque rendu, état de la page géré à la main.

Contraintes : deux semaines de hackathon, plusieurs personnes sur le front en parallèle, une CI qui vérifie déjà lint, format et build (`.github/workflows/ci.yml`), et Vite déjà en place.

## Options

1. Garder TypeScript sans framework : aucune dépendance. Chaque composant réécrit le rendu, l'état et les événements, et le code devient difficile à relire à plusieurs.
2. React avec TypeScript (TSX), toujours servi par Vite : composants réutilisables, routage entre les pages avec React Router, beaucoup de bibliothèques de tableaux et de graphiques le jour où on en a besoin. Connu de l'équipe. Ajoute des dépendances et une étape de migration de la page actuelle.
3. Vue ou Svelte avec TypeScript : mêmes avantages de composants. Moins connus de l'équipe, et moins de ressources pour les tableaux de bord.

## Décision

Nous choisissons l'option 2 : `web/` passe à React et TypeScript, toujours avec Vite, parce que le dashboard est fait de composants répétés sur plusieurs pages et que l'équipe connaît React.

Concrètement :

- Dépendances ajoutées à `web/` : `react`, `react-dom`, `react-router`. En développement : `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`, et `eslint-plugin-react-hooks` dans `eslint.config.mjs`.
- Fichiers en `.tsx` et pas en `.jsx`, pour garder le typage et les règles `typescript-eslint` déjà en CI.
- Pas de framework CSS : une feuille de style globale avec des variables de couleur, comme dans la maquette.
- Les types des données (`Prospect`, `Signal`…) sont dans `web/src/types.ts`. Les données mockées passent par une seule fonction d'accès, que l'on remplacera par les appels à `/api/...` décrits dans `openapi.yaml` (ADR 0003).
- Le proxy `/api` de `web/vite.config.ts` et les scripts `npm run dev` / `npm run build` ne changent pas.

## Conséquences

- Positives : un composant par élément de la maquette, réutilisé sur les trois pages. Les pages se répartissent facilement entre plusieurs personnes. Passer des données mockées à l'API ne touche qu'un fichier.
- Négatives, à accepter : six dépendances de plus à maintenir. La page actuelle de questions-réponses doit être reprise en React ou retirée, ce qui concerne les tickets #9 et #10.
- À revoir si : le dashboard a besoin de rendu côté serveur ou de SEO (passer à un framework comme Next.js), ou si les besoins de graphiques imposent une bibliothèque lourde.
