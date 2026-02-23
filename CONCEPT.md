# ClassBoard

> Tableau de bord enseignant : rappels par élève et notes par classe, intégré au dashboard BelTools.

## Problème

En tant que prof, j'ai besoin de me souvenir d'informations liées aux classes et aux élèves :
- Un élève doit rendre une punition
- Un élève était absent et doit rattraper un contrôle
- Matériel oublié à signaler
- Où on en est dans le programme avec telle classe
- Prochaine évaluation prévue
- Projet en cours

Ces infos sont aujourd'hui éparpillées (post-its, mémoire, Pronote...).

## Solution

Une mini-application qui centralise ces informations et les affiche dans le dashboard BelTools, contextualisées selon la classe en cours.

## Deux types de contenus

### 1. Rappels par élève
- Liés à un élève spécifique d'une classe
- Ont une date d'échéance ou un statut (à faire / fait)
- Exemples : "Rendre punition", "Rattraper éval du 12/02", "Mot aux parents à signer"
- Se résolvent (on les coche quand c'est fait)

### 2. Notes par classe
- Informations générales sur une classe
- Pas forcément liées à un élève
- Exemples : "Éval prévue semaine 12", "Finir chapitre aires", "Projet Desmos en cours"
- Peuvent être persistantes ou temporaires

## Intégration BelTools

Le dashboard BelTools affiche déjà la classe en cours. L'idée serait d'enrichir cette info :
- Quand on est en cours avec les 6A → afficher les rappels actifs pour cette classe
- Petit badge avec le nombre de rappels en attente
- Clic pour ouvrir ClassBoard avec la classe pré-sélectionnée

## Classes concernées (2025-2026)

| Classe | Couleur |
|--------|---------|
| 6e A   | Bleu    |
| 6e C   | Bleu    |
| 5e A   | Vert    |
| 5e BD3 | Vert    |
| 4e D   | Violet  |

## Stack envisagée

À définir. Options possibles :
- **Simple** : HTML/JS statique + localStorage (comme BelTools)
- **Léger** : Astro ou Next.js + fichier JSON local
- **Complet** : Next.js + base de données (Neon/Supabase)

## Questions ouvertes

- [ ] D'où viennent les listes d'élèves ? (saisie manuelle, import Pronote CSV ?)
- [ ] Hébergement : même serveur Oracle que BelTools ou Vercel ?
- [ ] Faut-il une authentification ou c'est juste pour usage perso ?
- [ ] Synchronisation entre appareils (ordi maison + ordi collège) ?

## Statut

**Phase : Idéation** — Le concept est posé, pas encore de code.
