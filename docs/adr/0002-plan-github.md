# 0002. Utiliser le plan GitHub gratuit avec un dépôt public

- Statut : proposée
- Date : 2026-11-09
- Décideurs : tech-leads

## Contexte

L'organisation GitHub du hackathon doit protéger son travail : branches `main` et `develop` protégées par un ruleset, pull request obligatoire, check `qualite` de la CI exigé, et relecture des fichiers sensibles par l'équipe `tech-leads` via CODEOWNERS.

Sur le plan gratuit de GitHub, ces protections ne s'appliquent qu'aux dépôts **publics**. Pour les obtenir sur un dépôt **privé**, il faut le plan Team, payant par membre et par mois.

Le code du projet ne contient ni secret ni donnée confidentielle : les clés et mots de passe restent dans des fichiers `.env` ignorés par git, et la base de données n'est jamais versionnée.

## Options

1. Plan gratuit et dépôt public : toutes les protections nécessaires, sans coût. Le code est visible par tous.
2. Plan Team et dépôt privé : mêmes protections et code caché. Un coût par membre, pour une organisation qui ne vit que le temps du hackathon.
3. Plan gratuit et dépôt privé : aucun coût et code caché, mais sans ruleset, sans check exigé ni relecture obligatoire. Les protections demandées deviennent impossibles.

## Décision

Nous choisissons l'option 1, le plan gratuit avec un dépôt public, parce qu'elle offre toutes les protections exigées sans coût, et que le code ne contient rien de confidentiel.

## Conséquences

- Positives : ruleset, check obligatoire et CODEOWNERS actifs sans payer. Le dépôt peut servir de portfolio à l'équipe.
- Négatives, à accepter : tout le monde peut lire le code et l'historique. Une clé commitée par erreur serait publique immédiatement : il faudrait la révoquer aussitôt.
- À revoir si : le partenaire fournit des données ou du code confidentiels, ou demande que le projet reste privé. Il faudrait alors passer le dépôt en privé avec le plan Team.
