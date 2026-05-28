# Benchmark EdTech — Couverture catalogue d'exercices (vue enseignant)

> Recherche comparative UX — mai 2026  
> Contexte : ClassBoard, tableau de bord enseignant pour le suivi de progression par élève/classe

---

## 1. Khan Academy — Mastery Map

**Format d'affichage**  
Trois onglets : Activity / Skills / Mastery. L'onglet Mastery combine deux vues : (1) des **barres horizontales colorées** segmentées par niveau de maîtrise pour chaque compétence (distribution de classe), et (2) une **heatmap élève × compétence** où chaque cellule est colorée selon le niveau atteint (5 niveaux : gris → bleu clair → bleu → vert clair → vert foncé).

**Granularité** : Cours > Unité > Compétence individuelle.

**Action principale encouragée** : Identifier les compétences à réviser (couleurs froides = faiblesse collective) puis assigner du contenu ciblé directement depuis le rapport.

**Forces** : Très granulaire, heatmap lisible d'un coup d'œil, orientée action pédagogique, 5 niveaux distincts et intuitifs.

**Faiblesses** : Charge cognitive élevée pour les enseignants non habitués aux tableaux de bord. Affiche ce que les élèves ont *fait*, pas ce que l'enseignant a *planifié*.

**Réf.** : [support.khanacademy.org — Activity, Skills, Mastery tabs](https://support.khanacademy.org/hc/en-us/articles/360031052391)

---

## 2. IXL Learning — Standards Proficiency Report

**Format d'affichage**  
Vue "bird's-eye" en tableau : une ligne par standard officiel, colonnes montrant le % de la classe proficient / en progrès / pas assez de données. Descente possible sur chaque standard pour voir les SmartScores individuels. Palette de bleus (dark = "Likely knows", medium = "Partially knows", light = "Doesn't know", gris = "Not enough data").

**Granularité** : Standard national/état > Compétence IXL > Élève > Question individuelle.

**Action principale encouragée** : Repérer les standards collectivement insuffisants, puis créer automatiquement des **groupes de remédiation** ciblés depuis le rapport.

**Forces** : Très aligné sur les standards officiels, création de groupes automatisée, drill-down jusqu'à la question individuelle.

**Faiblesses** : Interface dense, vocabulaire technique (SmartScore, %) déroutant ; ne distingue pas "planifié par l'enseignant" vs "fait par l'élève".

**Réf.** : [ixl.com/help-center — Standards Proficiency Overview](https://www.ixl.com/help-center/article/4668068/how_can_i_use_the_standards_proficiency_overview_report)

---

## 3. Mathletics — Course Reporting

**Format d'affichage**  
**Matrice élèves × activités** avec code couleur par cellule (performance ou complétion). Les thèmes (topics) sont repliables : vue condensée = score moyen par thème ; vue dépliée = score par activité. Des chiffres dans les cellules indiquent le nombre de tentatives. Marqueurs "Overdue" pour les activités assignées non complétées.

**Granularité** : Thème > Activité > Tentative individuelle.

**Action principale encouragée** : Basculer entre vue "forces" et vue "faiblesses" ; filtrer entre devoirs assignés, activités compensatoires ("Fill Learning Gap"), et travail volontaire.

**Forces** : La matrice offre une couverture complète du curriculum d'un coup d'œil. Distinction claire entre travail assigné et travail autonome.

**Faiblesses** : Dense avec beaucoup d'élèves. N'indique pas clairement ce que l'enseignant n'a **pas encore couvert** dans le catalogue.

**Réf.** : [knowledgebase.mathletics.com — Course Reporting](https://knowledgebase.mathletics.com/en_US/take-action-results-reporting/4-course-reporting)

---

## 4. Duolingo for Schools — Activity Log & Reports

**Format d'affichage**  
Sidebar "Activity Log" en quasi-temps réel : liste des élèves avec XP gagnés, leçon en cours, unité atteinte. L'onglet Reports donne la complétion par devoir (précision + temps passé). La vue couverture curriculum a été **réduite** : accent mis sur XP, nombre de leçons, niveau, temps — pas sur le contenu précis couvert.

**Granularité** : Unité macro uniquement pour la couverture curriculum.

**Action principale encouragée** : Créer des devoirs en termes de volume (XP, nombre de leçons), monitorer la progression linéaire, rappeler les retardataires.

**Forces** : Simplicité extrême, mise à jour temps réel, rassurant pour une prise en main débutante.

**Faiblesses** : Très faible granularité sur la couverture de contenu. L'enseignant ne sait pas *quoi* l'élève a appris, seulement *combien* il a travaillé. Progression imposée par Duolingo, pas de liberté dans le catalogue.

**Réf.** : [duolingoschools.zendesk.com — Activity log](https://duolingoschools.zendesk.com/hc/en-us/articles/6894350549773)

---

## 5. Quizlet — Class Progress

**Format d'affichage**  
Vue par set de cartes : liste des élèves avec statut (démarré / complété) et meilleur score. Vue agrégée "Mastery" : les termes du set sont **groupés par taux de réussite collectif**, les plus souvent ratés en premier. Filtrable par période. Scores par mode (Test, Match, Gravity).

**Granularité** : Set > Terme individuel (avec taux d'erreur).

**Action principale encouragée** : Identifier les termes à réviser collectivement ("most missed terms") et ajuster la prochaine séance.

**Forces** : Vision claire et immédiate des lacunes conceptuelles ou lexicales. Tri par difficulté collective très efficace.

**Faiblesses** : Couverture limitée aux sets (pas de vue catalogue). Pertinent uniquement pour l'apprentissage par cartes mémoire. Fonctionnalités avancées payantes.

**Réf.** : [quizlet.com/features/teacher-class-progress](https://quizlet.com/features/teacher-class-progress)

---

## 6. Kahoot — Rapport post-session

**Format d'affichage**  
Vue post-session : stats globales (joueurs, questions, scores), puis **vue par question** (taux de réussite collectif) et **vue par joueur** (score + questions ratées). Questions difficiles identifiées automatiquement. Export tableur disponible.

**Granularité** : Session > Question individuelle > Élève.

**Action principale encouragée** : Générer automatiquement un **nouveau Kahoot avec uniquement les questions ratées** pour un reteaching ciblé immédiat.

**Forces** : Très actionnable après une session, accessible sans formation, régénération de quiz ciblé en 1 clic.

**Faiblesses** : Vue par session uniquement, pas de vue longitudinale ou cumulative. Impossible de voir "quels chapitres du programme ont été testés au total".

**Réf.** : [kahoot.com/blog — Analytics & reports](https://kahoot.com/blog/2020/05/06/analytics-new-free-kahoot-reports-formative-assessment/)

---

## 7. Pronote — Vue Compétences

**Format d'affichage**  
Grille de compétences par matière ou domaine transversal (cycle 2/3/4, socle commun France). Chaque compétence est évaluée via des **pastilles colorées** à 4 niveaux (1 à 4, équivalent TBM / D / A / ES). Le bulletin de compétences agrège visuellement les positionnements par période.

**Granularité** : Domaine (D1 à D5 du socle) > Élément de programme > Compétence évaluée.

**Action principale encouragée** : Saisir ou calculer les positionnements, créer des grilles de compétences, générer bilans périodiques et de cycle, publier selon le calendrier institutionnel.

**Forces** : Fortement aligné sur les programmes officiels français. Outil de reporting institutionnel intégré dans le quotidien scolaire.

**Faiblesses** : Conçu pour la **saisie de résultats** plutôt que pour la **planification de couverture**. Pas de vue "quoi reste à couvrir". Pas de vision rapide par classe entière sur une compétence unique. Très rigide institutionnellement.

**Réf.** : [doc.index-education.com — Compétences Pronote](https://doc.index-education.com/fr/pronote/pronote/PRONOTE/C/Comp%C3%A9tences.htm)

---

## 8. Moodle — Activity Completion Report

**Format d'affichage**  
**Matrice élèves × activités**. Cellules avec icônes distinctives : tick bleu (complété sans seuil), tick vert (complété avec seuil de note), croix rouge (impossible), bordure rouge (override manuel). Distinction visuelle entre complétion automatique (bordure pointillée) et manuelle (bordure pleine).

**Granularité** : Cours > Activité individuelle. Filtre par groupe.

**Action principale encouragée** : Identifier qui n'a pas complété quoi ; marquer manuellement des activités comme complètes.

**Forces** : Vue exhaustive de la complétion, distinction auto/manuel claire, très configurable.

**Faiblesses** : UX datée et austère. Pas de code couleur sur la performance (seulement présence/absence). Aucune suggestion pédagogique. Complexité de configuration pour les non-techniciens.

**Réf.** : [docs.moodle.org — Activity completion report](https://docs.moodle.org/502/en/Activity_completion_report)

---

## 9. Google Classroom — Analytics (2025)

**Format d'affichage**  
Onglet Analytics par classe : pourcentage de devoirs rendus sur la période, alertes contextuelles proactives ("2 élèves n'ont pas visité la page depuis une semaine", "3 élèves ont progressé de +25 %"). Vue par devoir : nombre d'élèves n'ayant pas ouvert les fichiers attachés.

**Granularité** : Classe > Devoir > Élève. Aucune notion de curriculum ou de compétence.

**Action principale encouragée** : Envoyer des rappels individuels ou collectifs directement depuis l'interface, identifier les élèves désengagés.

**Forces** : Alertes intelligentes et proactives, très fluide dans l'écosystème Google, quasiment aucune formation nécessaire.

**Faiblesses** : Zéro vue sur la couverture de programme. Aucune notion de compétence. Outil de gestion de rendu, pas de suivi pédagogique.

**Réf.** : [workspaceupdates.googleblog.com — New analytics 2025](https://workspaceupdates.googleblog.com/2025/06/new-class-analytics-and-insights-in-google-classroom.html)

---

## 10. Anton.app — Vue enseignant

**Format d'affichage**  
Vue classe avec assignation d'exercices et rapport individuel par sujet. L'application propose 200 000+ exercices couvrant tout le curriculum (maternelle à collège). Contenu structuré en sujets > unités avec test final. Tableau de bord enseignant récent (Teacher Plus) avec différenciation par groupe de niveau.

**Granularité** : Matière > Thème > Unité.

**Action principale encouragée** : Assigner des exercices ciblés à la classe ou à des groupes, consulter les rapports de progression individuels, différencier par niveau.

**Forces** : Catalogue massif multi-matières, gratuit pour l'essentiel, bien aligné sur les programmes français.

**Faiblesses** : La vue couverture du catalogue (exercices faits vs disponibles dans le programme) est peu développée dans la version enseignant. Interface moins sophistiquée que les leaders américains sur la lecture de progression.

**Réf.** : [anton.app/en_us](https://anton.app/en_us/)

---

## Synthèse

### Les 3 patterns dominants

**1. La matrice élève × compétence/activité**  
Khan Academy (Mastery Map), Mathletics et Moodle convergent tous vers ce format. C'est le plus informatif pour saisir d'un coup la couverture complète : une ligne par élève (ou par compétence), une colonne par compétence (ou par élève), et une couleur par cellule. Toute la question est dans la palette : 4–5 niveaux semblent être le maximum lisible sans formation.

**2. Le drill-down progressif**  
IXL est le champion de ce pattern : vue macro → standard → compétence → élève → question individuelle, sans jamais changer d'interface. Toutes les plateformes matures proposent ce principe, mais peu le font aussi proprement.

**3. L'action directe depuis le rapport**  
Kahoot (re-générer un quiz ciblé), IXL (créer des groupes de remédiation), Google Classroom (envoyer un rappel) partagent ce principe : le rapport n'est pas une fin en soi, il déclenche une action immédiate en 1 clic. C'est le facteur le plus différenciant entre les plateformes "passives" et les plateformes "actionnables".

### Les pièges récurrents

- **Afficher uniquement ce qui a été fait**, jamais ce qui reste à couvrir. La vue des "blancs" (exercices du catalogue non encore abordés) est absente de toutes les plateformes sans exception.
- **Confondre couverture et maîtrise** : beaucoup de plateformes affichent "complété" quand elles veulent dire "vu", sans distinction entre "vu et maîtrisé" vs "vu et échoué".
- **Surcharger le tableau de bord enseignant** : dès qu'une classe dépasse 25 élèves et un catalogue de 30+ exercices, les matrices deviennent illisibles sans filtres intelligents.
- **Ignorer la dimension temporelle** : rare est la plateforme qui montre la couverture semaine par semaine (Khan Academy le permet partiellement via les filtres de période).

### Les 3 idées les plus inspirantes pour ClassBoard

1. **Le tri par difficulté collective (Quizlet "most missed")** : plutôt qu'afficher les exercices dans l'ordre du catalogue, trier les exercices par taux d'échec ou par fréquence d'erreur collective. Idée directement transposable à un catalogue d'exercices mathématiques.

2. **La distinction planifié / fait / maîtrisé (Mathletics)** : introduire trois états distincts par exercice — "dans le programme" (prévu par l'enseignant), "tenté" (élève a commencé), "maîtrisé" (score seuil atteint). Actuellement absent de toutes les plateformes concurrentes pour la couverture du catalogue.

3. **L'alerte proactive plutôt que le rapport passif (Google Classroom)** : au lieu d'obliger l'enseignant à lire un tableau, envoyer des alertes contextuelles ("5 élèves n'ont pas fait l'exercice sur les fractions depuis 2 semaines", "la classe entière a raté l'exercice 4.3").

### Recommandation de pattern pour ClassBoard

**Adopter le pattern "Matrice compacte + vue 'non couvert'"**, combinant :

- Une **grille catalogue (exercice × classe ou exercice × élève)** avec 3 états de couleur — non commencé (gris clair), en cours/partiel (ambre), réussi (vert) — plutôt que 5 niveaux qui nécessitent une légende.
- Une **bande de "couverture du programme"** en en-tête : sur 30 exercices du chapitre, 12 faits, 5 en cours, 13 non couverts. C'est la donnée absente de toutes les plateformes et la plus utile pour un enseignant qui planifie.
- Un **tri optionnel par "exercices difficiles"** (les plus souvent ratés en premier) pour l'action immédiate.

Cette combinaison répond au besoin principal d'un enseignant de collège : *"où en suis-je dans la couverture du programme, et où sont les lacunes ?"* — sans nécessiter de formation. Elle évite le piège de la matrice dense en rendant la vue "non couvert" aussi visible que la vue "maîtrisé".

---

*Sources complètes dans le corps du document. Recherche réalisée à partir des documentations officielles et des bases de connaissances publiées par chaque plateforme.*
