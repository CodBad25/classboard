# Audit du besoin pédagogique — Couverture catalogue

> UX research · ClassBoard · Mai 2026

---

## 1. Les vraies questions du prof, par fréquence d'usage

### Chaque jour (avant ou après la séance)
- **"Est-ce que mes élèves ont fait les exos du chapitre en cours ?"**
  Ce n'est pas une question exhaustive — juste les 3–5 exos pertinents *maintenant*, pas les 50 du catalogue.
- **"Qui n'a rien touché cette semaine ?"**
  Repérer les absents ou les décrocheurs passifs, pas mesurer une couverture globale.

### En fin de chapitre (toutes les 3–4 semaines)
- **"Quels exos n'ont été testés par presque personne ?"**
  Identifier les ressources ignorées pour décider de les présenter en classe ou de les supprimer du catalogue.
- **"Quelle fraction de la classe a une couverture satisfaisante sur ce chapitre ?"**
  Seuil binaire implicite : «la majorité a fait au moins X exos» → le chapitre est couvert, on passe.

### En conseil de classe ou suivi individuel (trimestriel)
- **"Cet élève s'est engagé sur le catalogue ? Oui / Non / Un peu ?"**
  Besoin d'une lecture rapide par élève, pas d'un détail exo par exo — juste une indication d'engagement global.

---

## 2. Actions concrètes déclenchées après consultation

| Ce que le prof voit | Action déclenchée |
|---|---|
| Exo non touché par la classe | Le projeter / l'introduire oralement en séance |
| Élève à 0 exo sur le chapitre | Rappel verbal, voire note dans ClassBoard |
| Couverture classe < 40 % | Reporter l'évaluation ou allonger la phase d'entraînement |
| Exo fait par 80 % des élèves | Valider comme "vu" dans le suivi de progression |
| Élève à forte couverture | Signal positif à mentionner en conseil de classe |

---

## 3. Anti-patterns : ce qui rend la vue INUTILE

- **La heatmap brute exos × élèves** — 50 colonnes de noms techniques tronqués, illisible dès 25 élèves.
- **Mélanger tous les chapitres** — la couverture d'un exo de septembre n'a pas de sens en mai.
- **Les pourcentages flottants** (67,3 %) — le prof pense en seuils grossiers (rien / un peu / bien).
- **Le vocabulaire technique des slugs** (`fractions-mult-v2`, `pgcd-algo-1`) — le prof pense aux titres pédagogiques.
- **La granularité temps passé par exo** — c'est un bruit, pas un signal ; le prof veut "fait / pas fait".
- **Une seule vue pour toutes les temporalités** — ce qu'on lit chaque jour n'est pas ce qu'on lit en conseil de classe.

---

## 4. Recommandation : le composant unique

**Un bandeau de couverture par chapitre**, filtré sur la classe sélectionnée, affichant :
- Le nom lisible du chapitre (pas un slug)
- Une barre de progression classe (% d'élèves ayant touché ≥ 1 exo du chapitre)
- Le nombre d'exos non touchés du tout par la classe, avec leur titre (liste dépliable)

Ce composant répond aux questions quotidiennes *et* de fin de chapitre en une lecture de 5 secondes, sans jamais imposer la matrice exos × élèves.
