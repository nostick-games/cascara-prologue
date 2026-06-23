# Guide de conception complet - RPG tactique de capture et de synergies

## 1. Vision generale

Le projet est un RPG tactique au tour par tour jouable dans un navigateur web.

Le joueur controle directement un heros qui combat avec :

- ses armes ;
- ses competences ;
- ses statistiques ;
- les creatures qu'il equipe ;
- les instincts portes par ces creatures.

Contrairement a un jeu de capture classique, les creatures ne combattent pas directement. Elles servent de modificateurs de gameplay, de sources de synergies, de specialisations tactiques et d'outils utilitaires.

Le jeu repose sur :

- les builds ;
- les arbitrages ;
- les types elementaires ;
- la gestion des points d'action ;
- les synergies ;
- les critiques ;
- les captures tactiques ;
- la progression permanente du heros.

La promesse centrale :

> Le joueur ne collectionne pas seulement des creatures. Il collectionne des facons de jouer.

Le projet vise une forte lisibilite, une profondeur strategique, et un scope raisonnable pour un jeu web independant.

## 2. Philosophie generale

Le jeu oppose constamment specialisation et polyvalence.

Le joueur doit choisir entre :

- des builds extremes tres puissants ;
- des compositions hybrides plus flexibles ;
- des outils utilitaires qui stabilisent ou ouvrent des options ;
- une progression permanente qui enrichit le heros sans remplacer les builds.

Les systemes doivent etre :

- faciles a comprendre ;
- difficiles a optimiser parfaitement ;
- assez modulaires pour accueillir beaucoup de contenu sans tout recoder.

Le jeu doit favoriser :

- la creativite ;
- l'experimentation ;
- les synergies inattendues ;
- les styles de jeu differents ;
- les choix de preparation avant combat.

## 3. Boucle de jeu

La boucle principale :

1. Le joueur explore une zone compacte.
2. Il rencontre des PNJ, des secrets, des ressources et des traces de creatures.
3. Il participe a des combats standards pour tester son build.
4. Il declenche des combats de capture pour obtenir de nouvelles creatures.
5. Une capture reussie peut debloquer une creature equipable avec son instinct individuel.
6. Le joueur ajuste ses creatures equipees et ses capacites.
7. Le radar de statistiques montre immediatement la transformation du build.
8. Le joueur tente des zones, des boss ou des arenes qui encouragent d'autres styles.

Objectif de la boucle :

> Chaque nouvelle creature doit donner envie de repenser le build du heros.

## 4. Structure du monde

Le monde est construit avec Tiled.

Le jeu privilegie :

- des zones compactes ;
- des maps denses ;
- de l'exploration lisible ;
- des secrets ;
- des synergies environnementales ;
- des transitions claires entre exploration, dialogue, combat et capture.

Composition du monde :

- villages ;
- routes ;
- forets ;
- grottes ;
- zones speciales ;
- arenes ;
- zones de capture.

Les donjons restent separes de l'overworld.

### Populations de zones de capture

Les zones de capture possedent une population capturable limitee.

Principe :

> Une fuite ne retire pas durablement une creature de la zone. Une capture reussie retire une presence capturable.

Ce systeme evite que le joueur puisse farmer indefiniment des creatures dans une meme zone et remplir son inventaire avec une equipe plethorique difficile a gerer.

Effets par issue :

| Issue | Effet sur la population de zone |
| ----- | ------------------------------- |
| Creature tombee a 0 PV et fuite | aucune presence consommee |
| Capture echouee | aucune presence consommee |
| Capture reussie sans instinct | 1 presence consommee |
| Capture reussie avec instinct | 1 presence consommee |

La mini-map peut representer la presence de creatures par un seul point rouge par zone :

| Affichage mini-map | Lecture |
| ------------------ | ------- |
| 1 point rouge | des creatures sont presentes dans la zone |
| aucun point rouge | plus aucune creature presente dans la zone |

Quand une zone n'a plus de point rouge, elle ne propose plus de creature du tout. Le joueur peut encore traverser la zone, mais il ne doit plus y declencher de chasse ou de rencontre sauvage tant qu'elle n'est pas repeuplee.

Les zones peuvent se repeupler, mais jamais instantanement pour permettre le farm.

Repopulation possible :

- apres certains passages de l'histoire ;
- apres une action specifique du joueur ;
- apres une intervention du Sanctuaire ;
- apres la decouverte d'une nouvelle zone ou d'un nouveau cycle narratif.

Ce systeme doit rester lisible : le joueur doit comprendre qu'il preleve des creatures dans un milieu vivant, et que capturer a plus de poids que simplement combattre.

## 5. Taille recommandee de la premiere verticale

Premiere verticale cible :

- 1 village ;
- 1 a 2 routes ;
- 1 foret ;
- 1 grotte ;
- 1 petite ville ou arene de conclusion.

Taille recommandee :

- maps de 30 x 30 a 50 x 50 tuiles ;
- tuiles de 16 x 16 pixels.

Objectif :

- privilegier la densite plutot que la taille brute.

Avant la verticale complete, il faut creer une micro verticale technique :

- 1 ecran de village ;
- 1 PNJ ;
- 1 dialogue a choix ;
- 1 flag ;
- 1 combat simple ;
- 1 recompense ;
- retour au village ;
- dialogue modifie apres victoire.

Cette micro verticale doit utiliser les vrais systemes du jeu : donnees, dialogues, flags, rencontres, recompenses et sauvegarde.

## 6. Prologue narratif

La premiere verticale fait office de prologue.

Pitch :

> Le joueur arrive sur une ile pour aider Nora, une specialiste des creatures locales, a etudier des instincts inhabituels apparus recemment. Apres une premiere capture improvisee, Nora revele sa vraie inquietude : l'agressivite des creatures et le silence du Sanctuaire pourraient etre lies.

Le jeu peut commencer simplement par l'affichage d'une lettre de Nora.

Exemple de lettre :

```txt
Lettre de Nora

A qui trouvera cette demande,

Les creatures de l'ile de Veyr developpent depuis peu des instincts inhabituels.
Certaines semblent plus agressives, d'autres manifestent des comportements que je n'avais encore jamais observes.

J'ai besoin d'un assistant capable d'aller sur le terrain, d'observer, d'enroler et de documenter ces creatures.

Si vous acceptez, rejoignez-moi sur la plage nord de l'ile.
Nous irons ensuite ensemble jusqu'au village de Briseval.

Nora
Specialiste des creatures insulaires
```

Deroule recommande :

1. Le joueur debarque sur l'ile.
2. Il retrouve rapidement Nora.
3. Nora l'accueille et presente la mission comme une etude de terrain.
4. Une creature attaque Nora et le joueur.
5. Nora guide le joueur pendant le premier combat.
6. Le joueur apprend les bases du combat et de la capture.
7. Le joueur enrole sa premiere creature dans son equipe.
8. Nora constate que l'agressivite de la creature n'est pas normale.
9. Nora revele alors la vraie mission : enqueter sur le Sanctuaire.
10. Elle explique que la cohabitation entre humains et creatures etait stable jusque-la.
11. Elle est inquiete de l'absence de nouvelles du Sanctuaire et soupconne un lien avec les comportements recents.
12. Ils rejoignent le village de Briseval.
13. Nora invite le joueur a collecter, observer et comparer les creatures de l'ile pour comprendre ce qui se passe.
14. Le village donne acces au Sanctuaire, a l'inventaire de creatures et a l'entrainement.
15. Un autre PNJ peut etre affronte autant de fois que necessaire pour tester les builds.
16. Un PNJ bloque l'acces a la grotte menant au-dela de la montagne.
17. Pour passer, le joueur doit former une equipe de 3 creatures et remporter un combat standard contre ce PNJ.
18. La grotte devient l'objectif de conclusion du prologue.

Revelation apres la capture-tutoriel :

> Nora n'a pas seulement besoin d'aide pour etudier des creatures inhabituelles. Elle cherche a comprendre pourquoi le Sanctuaire ne repond plus, et pourquoi des creatures autrefois pacifiques deviennent agressives. La premiere capture prouve que le joueur peut approcher ces creatures sans simplement les repousser.

### Trame narrative globale

Au debut, Nora pense etudier un phenomene naturel :

- les creatures deviennent agressives ;
- leurs instincts changent ;
- certaines especes semblent perturbees ;
- le Sanctuaire ne repond plus.

Son hypothese initiale est scientifique : maladie, evolution, changement environnemental, perturbation locale ou desequilibre naturel.

La verite est humaine et politique :

> Le Sanctuaire a ete pris par un mouvement fanatique qui rejette la coexistence entre humains et creatures.

Pour ce mouvement :

- les humains doivent dominer l'ile ;
- les creatures ne sont que des animaux ou des outils ;
- la coexistence ancienne est une faiblesse ;
- les creatures doivent etre capturees, enfermees, dressees et forcees a combattre.

Le conflit central oppose donc deux rapports aux creatures :

| Vision | Rapport aux creatures |
| ------ | --------------------- |
| Heros / Nora | partenaires, confiance, observation, cooperation |
| Fanatiques | outils, domination, dressage, combats forces |

Les creatures ne deviennent pas agressives a cause d'une corruption magique abstraite. Elles reagissent a une souffrance provoquee par des humains.

Les creatures sont reliees par une conscience instinctive collective :

- ce n'est pas une ruche ;
- ce n'est pas un esprit unique ;
- c'est un reseau naturel d'emotions, d'alertes et de comportements.

Quand une espece souffre, les autres ne comprennent pas forcement la cause exacte. Elles ressentent :

- la peur ;
- la mefiance ;
- l'alerte ;
- l'agressivite ;
- la rupture de l'equilibre.

Comme elles ne savent pas identifier l'origine du danger, certaines deviennent hostiles a tous les humains.

### Progression narrative possible

Acte 1 :

- les creatures deviennent agressives ;
- Nora enquete ;
- le joueur apprend les captures ;
- les premieres traces du Sanctuaire apparaissent.

Acte 2 :

- le joueur decouvre des creatures blessees ou traumatisees ;
- des humains hostiles apparaissent ;
- certaines especes semblent disparaitre ou se cacher.

Acte 3 :

- revelation : le Sanctuaire a ete pris ;
- les creatures y sont enfermees ou utilisees dans des combats forces ;
- le lien instinctif entre especes est perturbe.

Acte 4 :

- assaut ou infiltration du Sanctuaire ;
- liberation des creatures ;
- affrontement contre le chef du mouvement fanatique.

Principe narratif :

> Le joueur ne capture pas pour posseder. Il enrole, rassure et gagne la confiance. Les adversaires humains capturent pour dominer.

Journal de terrain :

Apres la premiere capture, Nora remet au joueur un journal de terrain relie a son laboratoire. Ce journal sert a la fois :

- de carnet d'observation ;
- de journal de combat ;
- de support pour les annotations de Nora ;
- de trace des comportements, objectifs et instincts rencontres.

Le journal consigne les actions du combat en temps reel, mais sa voix n'est pas neutre : Nora raconte, interprete et annote les evenements au fil de la chasse. Cela permet de donner une couleur stylistique au journal de combat, tout en rappelant que le joueur travaille avec une specialiste.

Exemple :

```txt
Braise-Corne gratte le sol. Mauvais signe.
Il va charger. Garde ton souffle, ou prepare une Feinte.
```

Certaines informations peuvent rester incompletes lorsque la Perception est trop faible, que le comportement connu est insuffisant ou que la creature brouille les traces.

Fonctions de Nora :

- introduire le role d'assistant chercheur ;
- guider le premier combat et la premiere capture ;
- reveler progressivement la vraie mission ;
- donner une voix au journal de terrain et au journal de combat ;
- expliquer les creatures, les instincts et les captures ;
- orienter le joueur vers le Sanctuaire ;
- faire du Sanctuaire un mystere narratif, pas seulement un lieu-systeme ;
- contextualiser le bloc "Comportement connu" ;
- distiller les systemes de gameplay au fil de la progression ;
- donner une raison narrative a la collecte et a l'etude des creatures.

Ce prologue evoque le plaisir d'assister une recherche sur les creatures, tout en se distinguant par l'etude des instincts, des comportements, des conditions de capture et d'un Sanctuaire devenu silencieux.

## 7. Le heros

Le heros combat directement.

Il possede :

- une arme principale ;
- un bouclier ou outil defensif ;
- des capacites actives ;
- des statistiques ;
- une progression permanente.

Les creatures enrichissent ce gameplay sans le remplacer.

Le heros doit rester competent meme sans creatures equipees, notamment pendant les combats de capture.

## 8. Armes du heros

Les armes definissent :

- le rythme ;
- certaines capacites ;
- le style de combat.

Exemples d'armes futures :

- epee equilibree ;
- lance rapide ;
- marteau lourd ;
- arme a distance ;
- doubles lames.

Pour la premiere verticale, une seule arme est recommandee :

- epee tactique polyvalente.

Le bouclier sert de support defensif et peut porter des capacites de garde ou de parade.

## 9. Instincts de creatures

Les instincts sont des effets associes a des creatures individuelles capturees.

Quand le joueur equipe une creature, il equipe aussi l'instinct de cette creature.

Principe :

> Une espece donne une identite de type. L'instinct donne une identite individuelle.

Deux creatures de la meme espece peuvent donc avoir des instincts differents. Le joueur peut vouloir capturer plusieurs fois une meme espece pour obtenir l'instinct le plus adapte a son futur build.

Les instincts de creatures ont une incidence en combat standard :

- ils sont actifs si la creature qui les porte est equipee ;
- ils modifient le radar de build ;
- ils renforcent l'identite de la composition ;
- ils progressent avec l'evolution de la creature.

En combat de capture, les creatures equipees sont retirees. Leurs instincts ne sont donc pas automatiquement actifs. Le joueur s'appuie alors sur le heros, ses competences de base, sa progression permanente, ses objets de chasse, ses runes de Perception et les informations obtenues.

Exception recommandee :

> Le joueur peut preparer un instinct de creature comme trace de chasse pour une capture, sans equiper la creature elle-meme.

Un instinct de chasse prepare :

- provient d'une creature deja capturee ;
- est choisi avant le briefing complet ;
- est actif pendant le combat de capture ;
- ne donne pas le type de la creature ;
- ne donne pas son effort ;
- ne donne pas ses statistiques ;
- ne declenche pas ses synergies ;
- ne contribue jamais au bonus 12.

Cette regle permet aux captures precedentes d'aider les captures futures sans casser la separation entre combat standard et combat de capture.

Limites recommandees :

- 1 instinct de chasse prepare au debut ;
- 2 maximum plus tard, via amelioration rare ou outil specialise ;
- choix verrouille avant la revelation complete des objectifs caches ;
- certains instincts peuvent etre marques `combat`, `capture` ou `mixte`.

Hierarchie recommandee :

- heros : base stable ;
- competences du heros : progression permanente ;
- instinct de chasse prepare : outil ponctuel de capture ;
- creatures equipees : specialisation temporaire ;
- instincts de creatures : micro-identite et comportement individuel ;
- bonus 12 : transformation majeure.

Les instincts doivent encourager des comportements, pas seulement donner des bonus plats.

Mauvais exemple :

- +5 % critique.

Meilleur exemple :

- apres un deplacement, la prochaine Entaille gagne +15 % critique.

Faire evoluer une creature ameliore son instinct. Cela donne du poids au choix de la creature exacte que le joueur decide de garder dans son equipe.

Exemple :

- Braise-Corne A : instinct de critique ;
- Braise-Corne B : instinct d'interruption ;
- Braise-Corne C : instinct defensif contre le Feu.

Un build Feu pur peut donc contenir plusieurs creatures Feu, mais demander un vrai choix entre leurs instincts.

## 10. Progression permanente du heros

Le heros possede une progression rogue-lite legere.

Meme sans creatures equipees, il conserve :

- ses statistiques ameliorees ;
- ses capacites debloquees ;
- certaines specialisations ;
- sa maitrise generale.

Cette progression evite :

- une sensation de faiblesse excessive ;
- les regressions trop brutales ;
- l'impression de perdre toute puissance durant les captures.

La progression permanente ne doit pas rendre les builds temporaires inutiles. Elle doit ouvrir des options, stabiliser certains styles et donner au joueur un sentiment d'histoire mecanique.

## 11. Experience

Le joueur progresse en XP apres chaque combat, gagne ou perdu.

Le jeu ne doit pas donner trop facilement des points d'XP entiers. A la place, les recompenses donnent des etoiles d'experience.

Principe :

> 100 etoiles = 1 gemme. 1 gemme = 1 point d'XP potentiel. 10 gemmes = 1 PA achetable en boutique.

Les etoiles sont donc la progression fractionnee. Les gemmes sont la ressource de progression complete que le joueur peut depenser.

Les gemmes servent a deux choses :

- ameliorer le radar du heros ;
- acheter des PA en boutique a un cout eleve.

Cela cree une tension volontaire :

> Depenser ses gemmes pour renforcer le radar donne une progression large. Economiser 10 gemmes pour acheter 1 PA donne une progression rare, tres forte et plus specialisee.

Exemple d'affichage :

```txt
Etoiles +25
Progression : 75 / 100 -> 100 / 100
Gemme obtenue
Gemmes disponibles : 1
```

Cette approche permet de recompenser souvent le joueur sans accelerer trop fortement la progression.

Les gemmes peuvent ameliorer de maniere permanente :

- les caracteristiques de base du heros ;
- certaines capacites du heros ;
- certaines specialisations permanentes.

Les gemmes alimentent principalement la couche stable du radar : le radar du heros.

Caracteristiques ameliorables avec les gemmes :

- Puissance ;
- Defense ;
- Vitalite ;
- Critique ;
- Initiative.

Les PA ne sont pas ameliores directement comme une statistique normale du radar. Ils peuvent etre achetes en boutique contre 10 gemmes, avec des plafonds stricts. La Perception ne peut pas etre amelioree avec des gemmes.

Regle PA :

| Achat | Cout | Limite |
| ----- | ---- | ------ |
| +1 PA | 10 gemmes | plafonds generaux de PA |

Cet achat doit rester rare. Il ne doit pas transformer les PA en progression ouverte.

Les gains de PA, maximums de PA, reductions de cout importantes et effets d'economie d'action doivent rester principalement le privilege des creatures utilitaires, de quelques instincts tres limites ou de bonus temporaires specifiques. Cela protege l'equilibrage du combat et donne une identite forte aux utilitaires.

La Perception doit utiliser une economie separee, liee a la preparation de chasse : runes, objets, services ou creatures specialisees. Cela evite qu'un joueur puisse investir des points d'XP pendant un briefing, reveler un objectif cache, puis reinitialiser ses choix.

### Gemmes et scaling

Le jeu doit suivre plusieurs valeurs :

| Valeur | Utilisation |
| ------ | ----------- |
| Etoiles courantes | progression vers la prochaine gemme |
| Gemmes disponibles | ressource que le joueur peut depenser |
| Gemmes depensees | historique des choix de progression |
| Gemmes gagnees a vie | base principale du scaling |

Le scaling des creatures doit se baser sur les gemmes gagnees a vie, pas seulement sur les gemmes disponibles ni seulement sur les gemmes deja consommees.

Raison :

- si le scaling depend seulement des gemmes depensees, le joueur peut garder ses gemmes pour affronter des creatures plus faibles ;
- si le scaling depend seulement des gemmes disponibles, le joueur peut depenser ses gemmes avant une chasse pour faire baisser artificiellement la difficulte ;
- avec les gemmes gagnees a vie, la difficulte suit la progression reelle du joueur, quelle que soit sa facon de depenser.

Principe :

> Le joueur peut choisir comment utiliser ses gemmes, mais il ne peut pas utiliser l'economie pour faire baisser artificiellement le niveau des chasses.

Etat actuel du prototype :

- le scaling de rencontre est calcule avec les gemmes gagnees a vie : `floor(gemmes gagnees / 5)` ;
- les PV ennemis gagnent `+3` par palier de scaling, sauf profil particulier ;
- la Puissance ennemie gagne `+1` tous les 2 paliers ;
- la Defense ennemie gagne `+1` tous les 2 paliers ;
- pour eviter que la Puissance du heros trivialise l'armure ennemie, la Defense ennemie gagne aussi `floor(Puissance investie * 0.5)`, plafonne a `+6`.

La Puissance investie est calculee au-dessus de la Puissance de base du heros. Cette correction doit rester prudente : elle freine le spam d'Entaille en fin de progression, mais ne doit pas donner au joueur l'impression que monter sa Puissance est retourne contre lui.

Les maps monde deja visitees augmentent aussi la Perception effective des fawnas : chaque nouvelle map monde apres la premiere donne `+1 Perception` aux fawnas rencontres. Les interieurs et maisons, par exemple les maps dont l'identifiant commence par `maison_`, ne comptent pas.

Recompenses d'etoiles recommandees pour la verticale :

| Resultat | Etoiles |
| -------- | ------- |
| Fuite de creature | +10 a +15 |
| Capture opportuniste | +20 a +25 |
| Capture avec 3 objectifs | +35 |
| Capture avec 4 objectifs | +35 |
| Combat standard gagne | +25 a +50 |
| Defaite du joueur | +10 a +20 |

Pour la premiere verticale, une base simple peut etre :

- fuite de creature : +10 etoiles ;
- capture opportuniste : +25 etoiles ;
- capture 3 objectifs : +35 etoiles ;
- capture 4 objectifs : +35 etoiles ;
- combat standard gagne : +40 etoiles ;
- defaite : +10 etoiles.

Regle economique :

> L'XP sert a la progression permanente. La monnaie sert a la preparation.

Recompenses recommandees :

- victoire : etoiles, monnaie, recompenses ;
- defaite : etoiles partielles, informations conservees ;
- capture reussie : etoiles et creature equipee avec son instinct individuel si les objectifs le permettent ;
- capture ratee : etoiles partielles, indices ou objectifs reveles conserves.

Si une rencontre est trop faible par rapport au joueur, son gain d'etoiles doit etre reduit afin de limiter le farm.

Les ameliorations achetees avec l'XP doivent etre plafonnees.

Plafonds recommandes :

- chaque caracteristique de base possede un nombre limite de rangs ;
- chaque capacite possede quelques ameliorations definies ;
- aucun axe de progression ne doit permettre une croissance infinie des statistiques de combat.

Quand le joueur a maximise ses ameliorations principales, l'XP excedentaire ne doit pas servir a gonfler indefiniment les stats. Elle peut etre :

- stockee pour du contenu futur ;
- convertie en ressource secondaire ;
- utilisee pour debloquer des variantes de capacites ;
- utilisee pour des ameliorations de confort ;
- utilisee pour des maitrises specialisees mais plafonnees ;
- convertie en ressource de respecialisation ou d'amelioration horizontale.

Principe :

> La progression par XP doit avoir une fin en puissance brute, puis s'ouvrir vers des options horizontales.

## 12. Respecialisation

Le joueur peut modifier librement son build temporaire :

- creatures equipees ;
- instincts de creatures equipes avec elles ;
- preparation avant combat ou capture.

En revanche, la reattribution des points d'XP investis dans la progression permanente doit etre encadree.

Principe :

> Le joueur peut changer librement sa preparation, mais pas gratuitement son identite permanente.

La respecialisation des points d'XP :

- est possible ;
- ne supprime pas l'XP totale gagnee ;
- ne retire pas les creatures capturees ;
- remet a zero les investissements permanents ;
- demande une ressource dediee, une relique, un service en ville ou une recompense speciale.

Exemple d'objet :

- Memoire blanche : reinitialise les points d'XP investis et permet de les reattribuer.

Objectif :

- permettre au joueur de corriger ou reorienter son heros ;
- eviter de punir l'experimentation ;
- empecher l'optimisation gratuite avant chaque combat ;
- conserver une histoire mecanique au personnage.

## 13. Monnaie permanente

Le jeu utilise une monnaie unique.

Elle est obtenue via :

- combats ;
- captures ;
- exploration ;
- objectifs secondaires.

Cette monnaie sert a acheter ou financer :

- potions ;
- consommables tactiques ;
- outils de capture ;
- runes de perception ;
- indices ;
- services ;
- analyses de specialistes ;
- reparations ou ameliorations temporaires ;
- ressources de preparation avant exploration.

La monnaie ne doit pas etre la ressource principale pour augmenter les statistiques permanentes du radar. Cela permet d'eviter un conflit frustrant entre survivre au prochain combat et faire progresser durablement le heros.

Exception : la Perception peut etre augmentee par une economie de preparation, par exemple des runes achetees avec la monnaie du jeu. Ces runes doivent etre equipees, consommees ou verrouillees avant le briefing de capture afin d'eviter les changements opportunistes apres revelation d'une information cachee.

## 14. Exemples d'ameliorations permanentes

Offensive :

- attaque chargee amelioree ;
- critiques renforces ;
- combo supplementaire.

Tactique :

- +1 PA au premier tour ;
- reduction de cout ponctuelle ;
- recuperation de PA conditionnelle.

Defensive :

- meilleure garde ;
- resistance elementaire ;
- reduction des degats critiques.

Capture :

- lecture d'objectifs caches ;
- ralentissement d'ennemis ;
- outils de chasse ;
- meilleure survie dans les duels de capture.

## 15. Les creatures

Le joueur peut equiper jusqu'a 3 creatures.

Les creatures modifient :

- les statistiques ;
- les capacites ;
- les synergies ;
- le rythme du combat ;
- les instincts actifs en combat standard ;
- la forme et les animations du radar.

Deux categories existent :

- creatures de type ;
- creatures utilitaires.

Une creature doit donner une habitude de jeu reconnaissable. Elle ne doit pas seulement ajouter un pourcentage.

Question de design pour chaque creature :

> Quelle petite habitude de jeu cette creature donne-t-elle au joueur ?

### Contribution radar des creatures equipees

Chaque creature equipee apporte trois choses distinctes :

- son type ;
- son instinct individuel ;
- une contribution de statistiques visible dans le radar de build.

Le type donne la direction generale du bonus. L'instinct donne la personnalite precise de la creature. Les statistiques donnent une consequence lisible et immediate dans le radar.

En combat standard contre un humain, le joueur peut equiper jusqu'a 3 creatures, dont au maximum 1 creature utilitaire. Ces creatures ne remplacent pas le heros : elles modifient son radar et lui donnent acces a des instincts.

Regle importante :

- les 3 creatures equipees contribuent toutes aux statistiques heritees ;
- chaque creature equipee apporte son instinct disponible ;
- le joueur choisit 1 seul instinct actif parmi les instincts des creatures equipees ;
- les instincts non choisis restent disponibles dans l'equipe, mais ne se declenchent pas pendant le combat ;
- les PA du heros evoluent ailleurs et ne font pas partie du radar herite.
- les PA disponibles d'un adversaire humain sont propres a sa fiche, pour permettre a un boss ou un adversaire special d'avoir une economie d'action differente.
- si au moins 2 creatures equipees partagent le meme type elementaire, le build du heros devient un build de ce type ;
- si les 3 creatures equipees sont de types differents, le build reste normal et polyvalent.

Le radar de combat humain contient :

- Vitalite ;
- Puissance ;
- Defense ;
- Critique ;
- Vitesse ;
- Perception.

Les creatures equipees peuvent apporter de la Vitalite heritee en plus de leurs bonus de Puissance, Defense, Critique, Vitesse ou Perception. Cette Vitalite represente la robustesse transmise par le lien tactique, sans faire combattre directement la creature a la place du heros.

Pour les adversaires humains, la Vitalite heritee des fawnas equipes est convertie en PV maximum. Un humain qui equipe plusieurs fawnas doit donc devenir plus durable, pas seulement plus offensif. Les boss humains ne doivent pas ecraser accidentellement leur profil de type : par exemple, un gardien comme Aragor doit conserver un total de PV de boss autour de 60 a 70 PV, et non retomber a une valeur de duel mineur.

La Perception sert ici a lire l'intention adverse. Elle ne donne pas directement plus de degats ou de defense.

Exemple de lecture :

| Perception | Information obtenue |
| ---------- | ------------------- |
| Faible | L'adversaire prepare une action. |
| Moyenne | L'adversaire prepare une attaque, une defense ou une technique. |
| Elevee | L'adversaire prepare une action couteuse ou tactique. |
| Tres elevee | L'action preparee peut etre identifiee plus precisement. |

### Type dominant du build

Le type dominant vient des creatures equipees :

| Composition | Type du build |
| ----------- | ------------- |
| 2 creatures du meme type | Build de ce type |
| 3 creatures du meme type | Build de ce type renforce |
| 3 creatures de types differents | Build normal polyvalent |
| 2 creatures typees + 1 utilitaire | Build du type majoritaire |

Le type dominant transforme l'habillage des actions du heros et peut leur donner une coloration elementaire.

Exemple :

- Entaille devient Entaille liquide avec un build Eau ;
- Feinte peut devenir Feinte tsunami avec un build Eau ;
- Art peut devenir Art de braise, Art de reflux ou Art de rafale selon le type dominant.

Ces noms doivent rester lisibles : l'action conserve son role de base, mais son nom actif raconte le build courant.

Le type dominant applique aussi la logique de chifoumi :

```text
Eau > Feu > Vent > Eau
```

Un build Eau est donc offensivement avantagé contre un adversaire Feu. Un build Feu est avantagé contre un adversaire Vent. Un build Vent est avantagé contre un adversaire Eau.

Ce bonus doit etre offensif avant tout : degats, critique, precision ou effet tactique selon l'action. Il ne doit pas rendre le joueur invulnerable.

Le build polyvalent ne profite pas de bonus de domination elementaire, mais il conserve une meilleure repartition de statistiques et d'instincts disponibles.

### Signature de build humain

Les combats contre humains ne doivent pas donner l'impression d'affronter seulement un bloc de statistiques. Les fawnas equipes doivent rester lisibles en combat sans devenir des cibles separees ni transformer le duel en combat d'equipe complet.

Direction retenue :

> Le dresseur canalise son equipe. L'equipe ne remplace pas le combattant, mais elle lui donne une Signature de build.

La Signature ne doit pas etre un deuxieme Art. L'Art reste une action active a 3 PA, jouee dans le tempo normal. La Signature est un evenement de cadence : elle se charge, devient disponible, puis cree un moment fort lisible.

Regle recommandee :

- chaque combattant humain possede une jauge de Signature ;
- la jauge monte selon son archetype de build, ses actions ou ses runes ;
- a `100 %`, un bouton ou une intention Signature devient disponible ;
- cote joueur, le bouton Signature est aussi la jauge : il reste grise tant qu'il n'est pas plein, puis devient disponible ;
- cote joueur, l'effet se declenche immediatement quand le joueur clique, afin de creer un moment de puissance clair ;
- cote ennemi, la Signature est telegraphee au tour N puis se resout au tour N+1 ;
- dans le prototype, chaque combattant ne peut utiliser sa Signature qu'une seule fois par combat ;
- apres resolution, la jauge retombe a `0 %` et le bouton passe en etat utilise.

Le telegraphe est obligatoire pour les ennemis. Il donne au joueur une vraie reponse : monter sa Garde, garder des PA, tenter une Feinte, interrompre, purger un statut ou accepter le risque.

Pendant le telegraphe d'une Signature ennemie, Feinte doit avoir un contre-effet minimal lorsqu'il existe un effet direct a attenuer. Une Feinte reussie n'annule pas toute la Signature : elle supprime ou attenue la partie directe de la resolution, par exemple les degats directs, la rupture immediate de Garde ou un deni de PA direct, mais conserve l'effet secondaire comme Brulure, Paralysie ou Blessure.

Dans le prototype actuel, la mitigation est surtout branchee sur les parties directes Feu et Vent. Les Signatures de controle Eau pur ne doivent pas consommer la Feinte ni afficher de message d'attenuation tant que le deni de PA n'est pas explicitement traite comme partie directe mitigable. La Garde absorbe les degats directs d'une Signature, mais ne bloque pas automatiquement son effet secondaire.

La Signature est determinee par la composition de l'equipe equipee. Elle doit rester issue d'une petite table de profils connus plutot que d'une generation procedurale trop fine.

La charge ne doit pas etre un simple forfait identique pour toutes les actions. Elle doit rendre l'identite du build lisible :

| Archetype | Charge principalement quand... |
| --------- | ------------------------------ |
| Feu | le combattant inflige des degats |
| Eau | le combattant gagne de la Garde ou finit son tour avec des PA conserves |
| Vent | le combattant reussit une Feinte, agit en premier ou gagne un peu de Garde |
| Utilitaire | le combattant joue regulierement, conserve des PA ou gagne de la Garde |

Les signatures hybrides cumulent plusieurs sources de charge, avec un plafond par evenement pour eviter qu'une seule action remplisse toute la jauge. Exemple : Feu + Eau charge a la fois par degats infliges et par economie defensive ; Feu + Vent charge par pression offensive et Feinte ; Eau + Vent charge par Garde, PA conserves et Feinte.

Hierarchie recommandee :

| Composition | Signature |
| ----------- | --------- |
| 1 fawna | Signature simple du type ou utilitaire |
| 2 fawnas du meme type | Signature renforcee du type |
| 2 fawnas elementaires differents | Signature hybride des deux types |
| 1 type elementaire + 1 Utilitaire | Signature tactique du type |
| 3 fawnas avec majorite claire | Signature dominante |
| Feu + Eau + Vent | Triade instable |
| Feu + Eau + Utilitaire | Alchimie de guerre |
| Feu + Vent + Utilitaire | Assaut fulgurant |
| Eau + Vent + Utilitaire | Verrou mouvant |

Un seul fawna utilitaire peut etre equipe a la fois. La table ne doit donc jamais prevoir de cas avec 2 Utilitaires.

Les Signatures sont actives, contrairement aux instincts qui restent passifs ou conditionnels. Elles doivent avoir un effet immediatement comprehensible et un message de resolution simple.

La resolution doit suivre une grammaire d'effets atomiques :

| Element | Partie directe | Partie secondaire |
| ------- | --------------- | ------------------ |
| Feu | degats | Brulure |
| Eau | retrait de `1 PA` au prochain tour | Paralysie |
| Vent | rupture de Garde, avec degats d'excedent | Blessure |
| Utilitaire | - | rider : `+1 PA` au lanceur |

La composition applique ensuite ces briques :

| Composition | Effet | Feinte |
| ----------- | ----- | ------ |
| 1 element | partie directe seule | annule Feu/Vent, ne contre pas le controle Eau pur |
| 2 memes elements | directe + secondaire de l'element | effet direct Feu/Vent annule, secondaire conserve |
| 2 elements differents | directes reduites des deux elements + 1 secondaire | effet direct Feu/Vent annule, secondaire conserve |
| element + Utilitaire | directe + secondaire de l'element + `+1 PA` lanceur | comme renforcee |
| 3 fawnas | signature propre, mais doit exprimer tous les types presents | selon ses effets directs |

Exemples d'effets dans le prototype :

| Signature | Composition | Effet actif |
| --------- | ----------- | ----------- |
| Signature Feu simple | 1 Feu | inflige des degats |
| Signature Eau simple | 1 Eau | retire `1 PA` au prochain tour |
| Signature Vent simple | 1 Vent | reduit la Garde et convertit l'excedent en degats de rupture |
| Signature utilitaire simple | 1 Utilitaire | donne `+1 PA`, sans depasser le maximum de PA sauf effet special |
| Signature Feu renforcee | 2 Feu ou majorite Feu | inflige des degats et Brulure avec une valeur plus forte |
| Signature Eau renforcee | 2 Eau ou majorite Eau | retire `1 PA` au prochain tour et applique Paralysie |
| Signature Vent renforcee | 2 Vent ou majorite Vent | reduit fortement la Garde, convertit l'excedent en degats de rupture et applique Blessure |
| Triade instable | Feu + Eau + Vent | utilise l'element actif courant : Feu, Eau ou Vent |
| Alchimie de guerre | Feu + Eau + Utilitaire | degats + Brulure, `+1 PA` lanceur et `-1 PA` cible au prochain tour |
| Assaut fulgurant | Feu + Vent + Utilitaire | degats Feu, rupture Vent, Brulure, `+1 PA` lanceur et bonus si la cible est a `0 PA` |
| Verrou mouvant | Eau + Vent + Utilitaire | `-1 PA` au prochain tour, Paralysie, rupture de Garde et Blessure |

La Triade instable affiche toujours son element actif. Cet element peut changer selon le dernier element joue par le combattant ; si l'action precedente n'a pas d'element, l'element actif precedent est conserve. Pour rendre la Triade jouable meme sans type dominant sur les actions de base, le prototype peut lire Entaille comme Feu, Garde comme Eau et Feinte comme Vent. Art conserve l'element actif courant, sauf variante explicitement typee.

Effets recommandes pour Triade instable :

| Element actif | Effet |
| ------------- | ----- |
| Feu | inflige des degats et Brulure |
| Eau | retire `1 PA` au prochain tour de la cible et applique Paralysie |
| Vent | reduit la Garde de `X`, convertit l'excedent en degats de rupture legers si la cible n'a pas assez de Garde, et applique Blessure |

Messages de charge :

| Type de Signature | Message |
| ----------------- | ------- |
| Generique | `La signature {signature} de {name} est chargee !` |
| Triade instable | `La signature {signature} de {name} est chargee ! Element actif : {element}.` |
| Alchimie de guerre | `La signature {signature} de {name} est chargee ! Echange de tempo pret.` |
| Assaut fulgurant | `La signature {signature} de {name} est chargee ! Gardez des PA.` |
| Verrou mouvant | `La signature {signature} de {name} est chargee ! Votre Garde est menacee.` |

Quand une Signature du joueur est chargee mais pas encore utilisee, un rappel court peut revenir apres chaque action. Le rappel doit etre module par build pour eviter de mentionner un element actif sur une Signature qui n'en a pas.

Exemples de resolution :

```txt
La Triade instable de Miguel inflige 8 degats et brule Aragor !
La Triade instable de Miguel retire 1 PA et paralyse Aragor !
La Triade instable de Miguel reduit la Garde d'Aragor de 4 points, inflige 2 degats de rupture et lui inflige Blessure !
La signature tactique de Miguel donne +1 PA !
```

Pour un ennemi, la jauge n'est pas visible directement dans l'interface. Le journal peut annoncer certains paliers, idealement selon la Perception du joueur :

```txt
La signature Triade instable d'Aragor est chargee a 75 %.
Aragor prepare Triade instable. Element actif : Feu.
Triade instable frappera au prochain tour.
```

La Perception peut ameliorer la lecture d'une Signature ennemie : a faible Perception, le joueur voit seulement qu'une Signature se prepare ; a haute Perception, il peut connaitre son nom, son type ou son effet exact avant resolution.

Les runes peuvent modifier la cadence de Signature sans changer son identite. Elles sont un bon levier de progression parce qu'elles ameliorent le rythme du combat plutot qu'un simple multiplicateur de degats.

Exemples de runes :

| Rune | Effet possible |
| ---- | -------------- |
| Rune d'elan | commence le combat avec une jauge de Signature partiellement remplie |
| Rune de cadence | charge la Signature quand le joueur joue plusieurs actions differentes dans un tour |
| Rune de maitrise | reduit le cooldown apres resolution |
| Rune d'echo | conserve une partie de la jauge apres resolution |
| Rune de lecture | gagne un bonus quand l'ennemi telegraphe sa Signature |
| Rune de riposte | charge la Signature du joueur lorsqu'il contre ou feinte une Signature ennemie |

Ces runes ne doivent pas supprimer le telegraphe. Meme acceleree, une Signature doit rester annoncee et contrable ; sinon elle redevient un Art plus puissant.

### Specialisation extreme

Si le joueur equipe 3 creatures du meme type et que les 3 sont niveau III, il obtient une specialisation extreme. Ce cas doit etre rare, lisible et puissant.

La specialisation extreme peut donner :

- un bonus offensif tres fort contre le type sensible ;
- des noms d'actions plus marques ;
- un effet supplementaire sur l'action principale du type ;
- une modification visible du radar ;
- une animation ou un habillage UI specifique.

Ce bonus doit recompenser l'investissement du joueur, mais il doit garder un contre-jeu : un build Eau extreme doit rester moins confortable contre Vent qu'il ne l'est contre Feu.

Principe :

> Une creature Feu doit rendre le radar plus offensif. Une creature Eau doit le rendre plus solide ou controle. Une creature Vent doit le rendre plus rapide ou evasif.

Les creatures d'un meme type doivent partager une identite statistique commune, sans etre interchangeables. Le type indique les statistiques privilegiees, mais il ne fixe pas des valeurs identiques pour toutes les creatures du type.

Exemple :

> Les creatures Feu privilegient souvent Puissance et Critique, mais une creature Feu peut donner beaucoup de Puissance et peu de Critique, tandis qu'une autre peut faire l'inverse.

L'espece et l'instinct peuvent orienter cette identite.

Exemples :

- Braise-Corne : Feu oriente Puissance / Critique ;
- Salamandre Braise : Feu oriente Puissance / Critique ;
- Flammillon : Feu oriente Critique / Vitesse ;
- Ecume-Lame : Eau orientee Defense / Perception ;
- Onde-Lente : Eau orientee Defense / Perception ;
- Rafalynx : Vent oriente Vitesse / Critique ;
- Plume-Sillage : Vent orientee Vitesse / Critique.

Matrice simple pour la verticale :

| Type | Stat principale | Stat secondaire | Intention radar |
| ---- | --------------- | ---------------- | --------------- |
| Feu | Puissance | Critique | pression, burst, risque |
| Eau | Defense | Perception | controle, endurance, lecture |
| Vent | Vitesse | Critique | vitesse, esquive, opportunisme |
| Utilitaire | Defense | Perception | confort tactique sans bonus de type ultime |

Les utilitaires peuvent modifier le radar de maniere plus speciale : extension translucide sur l'axe PA, pulsation de Perception, marqueur de reduction de cout ou indicateur de recuperation. Ils ne doivent pas compter pour les bonus de specialisation elementaire.

### Evolution et contribution radar

L'evolution augmente a la fois :

- l'effort de la creature ;
- son instinct ;
- sa contribution au radar.

Regle simple :

| Niveau | Effort | Contribution radar recommandee |
| ------ | ------ | ------------------------------ |
| Niveau 1 | 2 | 2 points repartis sur 2 stats |
| Niveau 2 | 3 | 3 points repartis sur 2 stats |
| Niveau 3 | 4 | 4 points repartis sur 2 stats |

Exemples de progression :

| Creature | Niveau 1 | Niveau 2 | Niveau 3 |
| -------- | -------- | -------- | -------- |
| Feu offensif | +1 Puissance, +1 Critique | +2 Puissance, +1 Critique | +2 Puissance, +2 Critique |
| Eau defensive | +1 Defense, +1 Perception | +2 Defense, +1 Perception | +2 Defense, +2 Perception |
| Vent rapide | +1 Vitesse, +1 Critique | +2 Vitesse, +1 Critique | +3 Vitesse, +1 Critique |

Cette progression donne une raison de faire evoluer une creature precise plutot que de seulement capturer une espece. Deux creatures du meme type peuvent donc contribuer au meme plan general tout en changeant le detail du radar et du build.

Formule de principe :

```text
Radar final du heros =
statistiques du heros
+ progression permanente
+ statistiques heritees des creatures equipees
```

Chaque creature devrait donc definir :

- une contribution liee a son type, definie dans la fiche du type ;
- une contribution propre a son espece, definie dans la fiche de la creature ;
- une progression de contribution selon son niveau ;
- un instinct associe, disponible mais pas automatiquement actif.

## 16. Inventaire de creatures

Le joueur possede un inventaire de creatures accessible dans l'interface.

Cet inventaire sert a :

- consulter toutes les creatures capturees ;
- voir leur espece, type, niveau, effort et instinct individuel ;
- distinguer les creatures avec instinct, sans instinct, instinct I ou instinct II ;
- consulter les informations connues sur leur comportement ;
- comparer plusieurs creatures d'une meme espece ;
- choisir les creatures equipees avant un combat standard ;
- choisir un instinct de chasse prepare avant un combat de capture.

L'inventaire doit permettre de filtrer ou trier par :

- type ;
- espece ;
- niveau ;
- presence ou absence d'instinct ;
- niveau d'instinct ;
- role tactique ;
- statut equipe ou stocke.

Il ne remplace pas le Sanctuaire. L'inventaire sert a gerer et equiper. Le Sanctuaire sert a liberer, etudier et transformer les doublons en connaissance.

## 17. Sanctuaire

Le Sanctuaire est un lieu specifique sur la map.

Sur le plan narratif, le Sanctuaire n'est pas seulement un service de gestion des doublons. Il devient progressivement l'un des centres du conflit principal : son silence cache sa prise de controle par un mouvement fanatique hostile a la coexistence entre humains et creatures.

Au debut du jeu, le joueur ne doit pas comprendre immediatement toute la situation. Le Sanctuaire peut d'abord apparaitre comme :

- un lieu absent ;
- une destination dont on n'a plus de nouvelles ;
- une institution de confiance qui ne repond plus ;
- une source d'inquietude pour Nora.

Il sert a :

- accueillir les creatures capturees dont le joueur ne veut plus ;
- liberer des creatures ;
- obtenir une petite recompense ;
- faire progresser la connaissance d'une espece ;
- alimenter le bloc "Comportement connu" du briefing de capture.

Liberer une creature dans le Sanctuaire ne doit pas donner une recompense trop forte, afin d'eviter le farm de captures faibles. La recompense principale doit etre la connaissance.

Recompenses possibles :

- progression du comportement connu de l'espece ;
- petite quantite d'or ;
- fragment de rune ou ressource mineure ;
- contribution a une quete de specialiste ;
- mise a jour du bestiaire.

Principe :

> Les captures imparfaites restent utiles parce qu'elles peuvent enrichir la connaissance d'une espece.

Si le comportement d'une espece est connu a 100 %, liberer une creature supplementaire de cette espece peut donner un petit gain d'or ou une ressource mineure. Ce gain doit rester modeste.

Le Sanctuaire donne une fonction aux doublons :

- creature sans instinct ;
- creature avec instinct faible ;
- creature remplacee par une meilleure capture ;
- creature d'une espece deja connue ;
- creature capturee surtout pour l'XP.

## 18. Limite des creatures utilitaires

Regle recommandee :

> Le joueur peut equiper 3 creatures maximum, dont 0 ou 1 utilitaire.

Compositions possibles :

- specialisation pure : Feu / Feu / Feu ;
- specialisation modulee : Feu / Feu / Utilitaire ;
- hybride elementaire : Feu / Eau / Vent ;
- hybride assiste : Feu / Eau / Utilitaire.

Raison :

- les utilitaires sont universels ;
- ils peuvent facilement dominer les creatures typees ;
- ils peuvent casser l'economie des PA, des critiques ou de l'initiative ;
- ils rendent le radar et l'identite du build moins lisibles s'ils sont trop nombreux.

Le bonus ultime de type demande donc de renoncer aux utilitaires.

Cette limite peut etre assouplie plus tard par une regle speciale, une arme, un talent ou un mode de jeu, mais elle ne doit pas etre la regle de base.

## 19. Les types

Pour la premiere verticale, le systeme repose sur 3 types.

| Type | Fort contre |
| ---- | ----------- |
| Vent | Eau |
| Eau | Feu |
| Feu | Vent |

Objectifs :

- lisibilite ;
- equilibrage plus simple ;
- synergies plus comprehensibles ;
- identites fortes.

## 20. Philosophie des types

Feu :

- offensif ;
- burst ;
- critiques agressifs ;
- gros couts en PA ;
- puissance elevee mais risque important.

Eau :

- controle ;
- ralentissements ;
- manipulation des PA ;
- endurance ;
- defense tactique.

Vent :

- vitesse ;
- initiative ;
- mobilite ;
- esquive ;
- multi-actions.

## 21. Progression des creatures

Chaque creature possede 3 niveaux d'evolution.

| Niveau | Effort |
| ------ | ------ |
| Niveau 1 | 2 |
| Niveau 2 | 3 |
| Niveau 3 | 4 |

Une creature au niveau maximum vaut donc 4 points d'effort.

L'evolution d'une creature ameliore aussi :

- l'instinct individuel qu'elle porte ;
- sa contribution au radar de build ;
- son poids dans les synergies de type via l'effort.

Le joueur ne choisit donc pas seulement une espece ou un type : il choisit une creature precise a faire progresser.

Objectif :

> Faire evoluer une creature doit se voir dans le radar, se sentir dans le combat et renforcer l'attachement a cette capture precise.

Etat actuel du prototype :

- une creature equipee gagne `+1` progression quand le joueur remporte un combat non entrainement ;
- Niveau I -> Niveau II : `3` combats gagnes en equipe ;
- Niveau II -> Niveau III : `7` combats gagnes supplementaires ;
- les combats d'entrainement ne comptent pas pour eviter le farm sans enjeu ;
- le compteur est attache a la creature capturee individuellement, pas a l'espece ;
- la fiche de creature affiche l'avancement vers le prochain niveau.

Exemple :

```txt
Flamillon capture niveau I : 0 / 3
Apres 3 victoires equipe : niveau II, compteur 0 / 7
Apres 7 victoires supplementaires : niveau III, niveau maximum atteint
```

### Evolution et niveau d'instinct

La qualite de capture ne donne pas seulement un niveau d'instinct fixe. Elle donne un bonus de potentiel d'instinct.

Formule :

```txt
Niveau d'instinct = niveau d'evolution de la creature + bonus de qualite de capture
Plafond : niveau III
```

Bonus de qualite :

| Qualite de capture | Bonus |
| ------------------ | ----- |
| 0 a 2 objectifs | aucun instinct |
| 3 objectifs | +0 |
| 4 objectifs | +1 |

Exemples :

| Niveau de creature | 3 objectifs | 4 objectifs |
| ------------------ | ----------- | ----------- |
| Niveau I | instinct I | instinct II |
| Niveau II | instinct II | instinct III |
| Niveau III | instinct III | instinct III |

Quand une creature evolue, son niveau d'instinct est recalcule avec la meme formule.

Exemples :

- creature niveau I capturee avec 3 objectifs : instinct I ;
- elle evolue niveau II : instinct II ;
- elle evolue niveau III : instinct III.

Autre exemple :

- creature niveau I capturee avec 4 objectifs : instinct II ;
- elle evolue niveau II : instinct III ;
- elle evolue niveau III : instinct III.

Une creature capturee sans instinct reste sans instinct meme si elle evolue. Elle peut toujours etre utile pour ses statistiques, son type ou ses synergies, mais elle ne gagne pas retroactivement un instinct.

## 22. Bonus de specialisation

Equiper :

- 3 creatures du meme type ;
- toutes au niveau maximum ;

donne un score d'effort de 12.

Le joueur obtient alors :

- un bonus majeur ;
- une specialisation extreme ;
- une transformation forte du gameplay.

Le bonus 12 doit etre plus qu'un bonus numerique. Il doit changer la facon de jouer.

## 23. Exemples de bonus 12

### Feu 12 - Surchauffe

Effets possibles :

- critiques explosifs ;
- brulures renforcees ;
- gros bonus de degats apres depense importante de PA ;
- risque accru apres les grosses attaques.

Style :

- explosif ;
- dangereux ;
- satisfaisant ;
- fragile si mal gere.

### Eau 12 - Maree Basse

Effets possibles :

- les ennemis commencent avec -1 PA ;
- retirer un PA genere de la garde ;
- les capacites de controle gagnent en puissance ;
- le combat devient une guerre d'attrition.

Style :

- controle froid ;
- tempo defensif ;
- domination progressive.

### Vent 12 - Courant Libre

Effets possibles :

- initiative massive ;
- recuperation de PA apres esquive ou deplacement ;
- attaques rapides favorisees ;
- multi-actions.

Style :

- mobile ;
- nerveux ;
- tactique ;
- dependant du positionnement.

## 24. Les builds

### Builds specialises

Avantages :

- tres puissants ;
- gameplay marque ;
- acces au bonus 12 ;
- radar tres lisible.

Inconvenients :

- vulnerabilites fortes ;
- moins de flexibilite ;
- dependance aux contraintes du type.

### Builds hybrides

Avantages :

- adaptabilite ;
- economie ;
- polyvalence ;
- meilleures reponses aux situations variees.

Inconvenients :

- absence de bonus ultime ;
- identite parfois moins explosive ;
- optimisation plus subtile.

### Builds avec utilitaire

Avantages :

- stabilite ;
- confort tactique ;
- outils de capture ou d'economie ;
- correction d'une faiblesse.

Inconvenients :

- renoncement au bonus 12 ;
- moins de specialisation ;
- risque de build trop generique si les utilitaires sont trop forts.

## 25. Systeme de combat

Le combat est :

- au tour par tour ;
- base sur les points d'action ;
- centre sur les choix de tempo ;
- influence par les creatures, instincts et statistiques.

Le heros agit directement. Les creatures ne sont pas des unites autonomes.

## 26. Niveau de challenge

Le jeu doit proposer un challenge accessible :

- pas trop facile ;
- pas trop difficile ;
- lisible ;
- encourageant l'experimentation sans rendre la progression triviale.

Principe :

> Les creatures et adversaires doivent rester proches du niveau reel du joueur.

Le jeu doit eviter les ecarts absurdes de niveau, par exemple un joueur tres avance qui affronte encore des creatures beaucoup trop faibles. Une creature de debut de jeu peut rester simple dans ses patterns, mais elle doit rester pertinente si le joueur la rencontre dans une zone adaptee a sa progression.

Objectifs :

- eviter les combats sans interet ;
- eviter le grind contre des cibles trop faibles ;
- preserver la tension des captures ;
- garder les recompenses lisibles et proportionnees ;
- permettre au joueur de tester ses builds contre des adversaires credibles.

Regles recommandees :

- les zones proposent une fourchette de niveau proche du joueur attendu ;
- les creatures rares ou puissantes peuvent depasser legerement cette fourchette ;
- les rencontres faibles peuvent exister pour le rythme, mais ne doivent pas dominer l'experience ;
- les recompenses diminuent fortement si une rencontre est trop faible par rapport au joueur ;
- les captures importantes doivent rester calibrees comme des duels de maitrise, pas comme de simples formalites.

Le niveau reel du joueur doit prendre en compte les gemmes gagnees a vie.

Cela inclut :

- les gemmes disponibles ;
- les gemmes depensees dans le radar ;
- les gemmes depensees en boutique pour acheter des PA.

Le briefing de chasse doit donc considerer la progression totale du joueur, pas seulement ses statistiques actuellement equipees ou ses gemmes non depensees.

Exemple :

```txt
Joueur A : 12 gemmes gagnees, 12 depensees dans le radar
Joueur B : 12 gemmes gagnees, 10 depensees pour +1 PA, 2 gardees

Les deux joueurs ont le meme niveau de scaling de base.
Leur build differe, mais la chasse ne baisse pas de niveau parce que les gemmes ont ete depensees autrement.
```

Pour les futurs adversaires humains, la meme logique s'applique : ils doivent etre proches du niveau du joueur, mais leur difficulte peut venir davantage de leur build, de leurs instincts, de leurs creatures equipees et de leurs synergies.

### Etat actuel d'equilibrage du prototype

Le prototype vise une difficulte challengeante mais juste : le joueur doit gagner en pretant attention aux intentions, aux PA, aux statuts et a sa preparation, sans devoir resoudre chaque combat comme une enigme punitive.

Regles actuellement retenues :

- les combats de capture sont calibres autour du heros seul, de ses objets et de sa preparation ;
- les combats humains expriment le build complet : heros, fawnas equipes, instinct choisi, type dominant, Art type et Signature ;
- les combats d'entrainement ne doivent pas devenir une source principale de progression ;
- quand l'adversaire humain agit en premier grace a sa Vitesse, le joueur gagne un coussin de `+3 Garde` afin que l'initiative adverse soit un avantage de tempo, pas un bouton de victoire automatique ;
- les adversaires humains doivent recevoir les PV issus de la Vitalite de leurs fawnas equipes, afin que leurs equipes ne soient pas seulement offensives ;
- un boss humain doit garder un plan de PV explicite, par exemple autour de `60-70 PV` pour un gardien de prologue.

Equilibrage defensif actuel :

| Element | Valeur prototype | Intention |
| ------- | ---------------- | --------- |
| Reduction par Defense du heros | `0.55` par point | eviter que Defense trivialise les fawnas de debut |
| Reduction par Defense ennemie | `0.70` par point | garder l'armure ennemie sensible aux multi-coups |
| Garde de base du heros | `round(2 + Defense * 0.5)` | limiter le double effet Defense passive + Garde |
| Persistance de Garde | environ `45 %` par tour | recompenser la defense sans empiler a l'infini |
| Bonus d'initiative adverse | `+3 Garde` au joueur | amortir les ouvertures adverses rapides |

Equilibrage offensif actuel :

- Entaille reste le coup simple efficace en degats par PA ;
- Feinte coute plus cher, mais apporte lecture, attenuation et interruption ;
- Art coute `3 PA`, inflige moins de degats purs qu'un spam d'Entaille, mais retire `1 PA` si elle touche ;
- le retrait de PA de l'Art est volontairement fort : il justifie un degat brut plus faible ;
- les builds de type modifient les actions pour donner une identite forte sans remplacer les quatre boutons fondamentaux.

Le statut Vent s'appelle maintenant `Blessure` dans l'interface. Il garde l'effet de fragilisation de posture : perte de Garde au debut du tour, avec degats de rupture si la Garde ne suffit pas.

## 27. Arsenal de base du heros

Pour la premiere verticale, le heros possede un arsenal tres simple :

- une epee ;
- un bouclier ;
- quelques competences de base ;
- une action de capture disponible uniquement contre les creatures.

Les noms de base doivent rester sobres et fonctionnels. Les creatures equipees, le type dominant ou l'instinct de chasse prepare peuvent enrichir ces noms et leurs effets.

Actions de base en combat standard :

| Action | Cout | Role |
| ------ | ---- | ---- |
| Entaille | 1 PA | attaque simple |
| Garde | 1 PA | defense simple |
| Feinte | 2 PA | reponse a une intention adverse |
| Art | 3 PA | competence tactique influencee par le build, retire 1 PA a l'ennemi si elle touche |

Actions de base en combat de capture :

| Action | Cout | Role |
| ------ | ---- | ---- |
| Entaille | 1 PA | attaque simple |
| Garde | 1 PA | defense simple |
| Feinte | 2 PA | reponse a une intention adverse |
| Art | 3 PA | competence tactique influencee par la preparation, retire 1 PA a la creature si elle touche |
| Capture | 1 PA | tentative de capture |

Capture n'est pas disponible pendant les combats standards.

### Roles des competences

Entaille :

- action offensive simple ;
- sert a infliger des degats fiables ;
- peut declencher des instincts lies aux attaques rapides ou aux actions a 1 PA.

Garde :

- action defensive simple ;
- sert a reduire les degats, preparer une parade ou survivre a une attaque annoncee ;
- peut alimenter des instincts defensifs ou de contre.
- la Defense passive du heros retire environ `0.55` degat par point de Defense sur les coups recus.
- dans le prototype, la Garde du heros vaut `round(2 + Defense * 0.5)`.
- la Garde restante persiste partiellement d'un tour a l'autre, a hauteur d'environ 45 %, ce qui impose de limiter son double effet avec la Defense passive.

Feinte :

- action de lecture et de reaction ;
- sert a repondre a une intention adverse ;
- peut eviter, punir, interrompre ou modifier le tempo si elle est utilisee au bon moment.

Art :

- competence tactique principale a 3 PA ;
- remplace l'ancien role de "coup de bouclier" comme action plus ouverte ;
- peut devenir physique, magique ou elementaire selon le build ;
- s'adapte naturellement au type dominant des creatures equipees.
- en capture, l'Art du heros inflige moins de degats purs qu'une sequence d'Entailles, mais son retrait de PA est volontairement punitif.

Formule de degats du heros :

```txt
Degats bruts = degats de base de l'action + Puissance * coefficient de l'action
Degats critiques = degats bruts * multiplicateur critique
Degats finaux = max(1, round(degats critiques - Defense ennemie * 0.70))
```

Valeurs de base actuelles :

| Action | Degats de base | Coefficient Puissance | Particularite |
| ------ | -------------- | --------------------- | ------------- |
| Entaille | `1` | `1.20` | meilleur rendement simple |
| Feinte | `1` | `1.80` | coute `2 PA`, pose l'attenuation si elle touche |
| Art | `1` | `0.95` | coute `3 PA`, retire `1 PA` si elle touche |

### Arts de type dominant

Quand le build humain possede un type dominant, ses actions gardent leur role mais gagnent une teinte mecanique.

| Type dominant | Bonus de stats par rang | Effet sur les actions |
| ------------- | ----------------------- | --------------------- |
| Feu | `+2 Puissance`, `-1 Defense` | Entaille, Feinte et Art gagnent `+1 degat de base` par rang ; Art gagne encore `+1` au rang III |
| Eau | `+2 Defense`, `-1 Vitesse` | Garde est renforcee ; Art donne de la Garde au lanceur et retire un PA supplementaire au rang III |
| Vent | `+1 Vitesse`, `+5 Critique`, `-1 Puissance` | Feinte gagne du critique ; Art rembourse du PA au lanceur |

Details actuels :

| Type | Rang I | Rang II | Rang III |
| ---- | ------ | ------- | -------- |
| Feu - Art | `+1` degat de base | `+2` degats de base | `+4` degats de base |
| Eau - Art | `+2 Garde` | `+3 Garde` | `+3 Garde`, `-2 PA` cible si touche |
| Vent - Feinte | `+3 %` critique | `+6 %` critique | `+9 %` critique |
| Vent - Art | rembourse `1 PA` | rembourse `1 PA` | rembourse `2 PA` |

Ces valeurs sont volontairement expressives. Les deux points a surveiller sont :

- l'Art Vent rang III, qui devient tres efficient avec un cout effectif proche de `1 PA` ;
- l'Art Eau rang III, qui combine defense personnelle et controle de PA.

Capture :

- action propre aux combats de creatures ;
- permet de tenter une capture ;
- peut etre transformee par un instinct de chasse prepare ;
- peut echouer ou ne pas donner l'instinct vise si la tentative est trop precoce.

### Variantes de noms par type

Les noms de base doivent rester visibles dans l'interface, mais le nom actif peut etre enrichi par le type dominant.

Exemples :

| Base | Feu | Eau | Vent |
| ---- | --- | --- | ---- |
| Entaille | Entaille ardente | Entaille liquide | Entaille eclair |
| Garde | Garde de braise | Garde de maree | Garde legere |
| Feinte | Feinte brulante | Feinte tsunami | Feinte de rafale |
| Art | Art ardent | Art du reflux | Art de rafale |

Pour la lisibilite, l'interface peut afficher le nom enrichi avec le role de base en sous-label.

Exemple :

```txt
Art du reflux
Art - 3 PA
```

### Instincts et icones de competences

Un instinct ne doit pas modifier le heros de maniere abstraite. Il doit declarer une cible claire :

- une competence precise ;
- une famille de competences ;
- une condition de jeu.

Exemples :

| Type d'instinct | Cible | Exemple |
| ------------- | ----- | ------- |
| Instinct de competence | Entaille | apres une esquive, Entaille gagne du critique |
| Instinct de famille | actions a 1 PA | les actions a 1 PA gagnent un bonus apres deplacement |
| Instinct de condition | prochaine action | apres parade, la prochaine action coute moins cher |
| Instinct de capture | Capture | Capture gagne un bonus si un objectif est accompli |

L'interface peut illustrer un instinct avec l'icone de la competence qu'il modifie. Si un instinct affecte Entaille, son badge apparait sur l'icone d'Entaille. S'il affecte Capture, son badge apparait sur l'icone de Capture pendant les combats de creatures.

Exemple :

```txt
Pas de rafale
Cible : Entaille
Condition : apres esquive
Effet : la prochaine Entaille gagne du critique
Source : Rafalynx
```

## 28. Actions de base des creatures

Les creatures sauvages possedent elles aussi un arsenal simple.

Objectif :

- rendre leurs intentions lisibles ;
- permettre au joueur de repondre avec Garde, Feinte, Art ou Capture ;
- faciliter la creation d'objectifs de capture ;
- donner une identite claire a chaque type via son Art.

Actions de base d'une creature :

| Action | Cout | Role |
| ------ | ---- | ---- |
| Coup simple | 1 PA | degats standards |
| Coup fort | 2 PA | degats standards plus eleves |
| Protection | 2 PA | defense, garde ou reduction de degats |
| Art | 3 PA | coup signature lie au type ou a l'espece |

Coup simple :

- attaque de base ;
- sert a maintenir la pression ;
- doit etre facile a comprendre et a anticiper.

Coup fort :

- attaque plus engageante ;
- cree une fenetre de reaction ;
- peut etre paree, interrompue ou punie selon les objectifs.

Protection :

- action defensive ;
- peut reduire les degats, preparer un contre, renforcer une phase ou proteger un objectif ;
- peut creer un objectif du type "briser une defense".

Art :

- action signature ;
- coute 3 PA ;
- exprime le type ou la personnalite de la creature ;
- peut appliquer un statut au heros ;
- doit etre annoncee assez clairement pour permettre une reponse tactique.

### Statuts provoques par les actions de creatures

Les Arts offensifs des creatures sont la source principale de statuts. Les Coups forts peuvent aussi en appliquer, mais avec une chance reduite. Les Coups simples n'en appliquent pas dans le prototype actuel.

Objectif :

- donner plus de poids aux attaques speciales ;
- differencier les types autrement que par les degats ;
- creer une raison claire de parer, interrompre ou anticiper un Art ;
- relier le danger d'une creature a son niveau d'evolution.

Regle recommandee :

> Quand une action speciale ou engageante d'une creature touche, elle peut appliquer un statut lie au type de la creature. L'intensite du statut depend du niveau de la creature.

Chance de base recommandee pour la verticale :

| Niveau de creature | Chance d'appliquer le statut |
| ------------------ | ---------------------------- |
| Niveau 1 | 40 % |
| Niveau 2 | 55 % |
| Niveau 3 | 70 % |

Ces valeurs doivent rester lisibles et previsibles. Les creatures rares, les boss ou certains instincts peuvent modifier ces chances, mais l'interface doit le signaler lorsque cela compte.

Multiplicateurs actuels selon le type d'action :

| Action creature | Multiplicateur de chance |
| --------------- | ------------------------ |
| Coup simple | `0 %` |
| Coup fort | `60 %` de la chance de type |
| Art | `100 %` de la chance de type |

Exemple : une creature niveau I avec `40 %` de chance de statut applique son statut a `24 %` sur un Coup fort, et `40 %` sur un Art.

Exemples par type :

| Type | Statut possible | Effet |
| ---- | --------------- | ----- |
| Feu | Brulure | degats automatiques au debut de chaque tour du joueur |
| Eau | Paralysie | chance d'empecher la prochaine action du joueur a chaque tour |
| Vent | Blessure | perte de Garde au debut de chaque tour du joueur, avec degats de rupture legers si la Garde est insuffisante |

Exemple Feu :

| Niveau de creature | Brulure appliquee |
| ------------------ | ----------------- |
| Niveau 1 | 1 degat au debut de chaque tour du joueur |
| Niveau 2 | 2 degats au debut de chaque tour du joueur |
| Niveau 3 | 3 degats au debut de chaque tour du joueur |

La Brulure frappe au debut du tour du joueur, avant qu'il choisisse sa premiere action. Elle n'a pas de limite de tours par defaut : elle persiste jusqu'a la fin de la chasse, jusqu'a une purge, ou jusqu'a une condition propre a la creature. Elle met donc de la pression sur la capture, la Garde et les decisions de tempo.

Exemple Eau :

| Niveau de creature | Paralysie appliquee |
| ------------------ | ------------------- |
| Niveau 1 | 20 % de chance qu'une action du joueur soit impossible par tour |
| Niveau 2 | 25 % de chance qu'une action du joueur soit impossible par tour |
| Niveau 3 | 30 % de chance qu'une action du joueur soit impossible par tour |

La Paralysie ne doit pas supprimer tout le tour du joueur. Elle n'a pas de limite de tours par defaut : tant que le statut est actif, un test a lieu a chaque tour du joueur. Si le test echoue, une action du joueur est empechee pour ce tour, puis le joueur continue avec les PA restants si les regles de l'action le permettent.

Cela conserve la tension sans retirer completement le controle.

Exemple Vent :

| Niveau de creature | Blessure appliquee |
| ------------------ | ------------------ |
| Niveau 1 | -1 Garde au debut de chaque tour du joueur |
| Niveau 2 | -2 Garde au debut de chaque tour du joueur |
| Niveau 3 | -3 Garde au debut de chaque tour du joueur |

Blessure ne bloque jamais les actions du joueur. Elle fragilise sa posture defensive et rend les creatures Vent dangereuses contre les strategies qui accumulent de la Garde.

Si la cible n'a pas assez de Garde pour absorber toute la reduction, l'excedent peut devenir des degats de rupture legers. Cette conversion permet aux effets Vent de rester utiles contre une cible sans Garde, sans leur donner le role de degats directs du Feu.

La Garde peut absorber les degats d'un Art, mais elle n'empeche pas automatiquement le statut si l'Art se resout.

La Feinte doit rester une reponse forte, mais elle ne doit pas donner une immunite parfaite aux statuts. Dans le prototype, si la Feinte interrompt un Art offensif, le statut peut encore passer avec 50 % de sa chance normale. Exemple : un Art de niveau 2 conserve donc 27,5 % de chance d'appliquer son statut malgre la Feinte. Le journal de combat doit signaler explicitement ce cas.

Tous les statuts sont supprimes a la fin du combat. Ils ne doivent pas suivre le joueur dans l'exploration ou dans le combat suivant, sauf regle speciale explicitement introduite plus tard.

Le joueur pourra aussi annuler un statut pendant le combat avec un objet pris dans son sac. Cette partie n'est pas prioritaire pour la premiere implementation du systeme de statuts, mais elle doit etre prevue dans les donnees : certains objets pourront purger Brulure, Paralysie, Blessure ou tous les statuts.

### Feinte contre actions de creatures

La Feinte du joueur sert a repondre aux actions offensives de la creature.

Regle recommandee :

- Feinte peut parer ou contrer un Coup simple ;
- Feinte peut parer ou contrer un Coup fort ;
- Feinte peut parer, contrer ou interrompre un Art offensif ;
- Feinte ne peut pas parer Protection.

Protection doit etre geree autrement :

- briser la defense avec une condition ou un Art ;
- temporiser avec Garde ;
- conserver des PA ;
- tenter Capture si les objectifs sont prets ;
- attendre la fin de l'effet.

Exemples d'Arts par type :

| Type | Exemple d'Art | Intention |
| ---- | ------------- | --------- |
| Feu | Charge flamboyante | burst, brulure, critique ou interruption possible |
| Eau | Reflux captif | retrait de PA, ralentissement ou defense |
| Vent | Rafale fuyante | esquive, initiative, deplacement ou multi-coup |

Les objectifs de capture peuvent etre lies a ces actions :

- interrompre un Art ;
- parer un Coup fort ;
- briser Protection ;
- survivre a un Art ;
- vider les PA de la creature avant son Art ;
- provoquer une reaction pendant une fenetre de preparation.

## 29. Statistiques des creatures

Les creatures possedent leurs propres statistiques de combat.

Elles doivent rester plus simples que les statistiques du heros, mais assez expressives pour differencier les especes.

Statistiques recommandees :

| Stat | Role |
| ---- | ---- |
| PV | survie de la creature |
| PA | nombre d'actions possibles par tour |
| Puissance | degats des coups |
| Defense | reduction des degats recus |
| Rapidite | determine qui agit en premier |
| Critique | chance ou puissance des coups critiques |
| Stabilite | resistance a la capture anticipee ou a certaines interruptions |
| Perception | difficulte a lire les intentions et objectifs caches de la creature |

Rapidité :

- remplit pour les creatures le role que l'Initiative remplit pour le heros ;
- determine l'ordre d'action au debut du combat ou du tour ;
- permet aux creatures Vent d'avoir une identite claire.

Regle simple :

```txt
Si Rapidite creature > Initiative heros : la creature agit en premier.
Si Initiative heros >= Rapidite creature : le heros agit en premier.
```

Stabilite :

- mesure la capacite d'une creature a resister a une capture tentee trop tot ;
- rend les captures opportunistes plus risquees ;
- peut etre reduite ou contournee par les objectifs accomplis.

Regle simple :

```txt
0 a 2 objectifs accomplis : Capture testee contre Stabilite.
3 objectifs accomplis : Capture maitrisee.
4 objectifs accomplis : Capture parfaite.
```

La Perception existe aussi cote fawna. Elle represente la difficulte a lire ses intentions et ses conditions cachees. Le joueur revele une attaque marquee ou un objectif cache lorsque sa Perception preparee est superieure ou egale a celle du fawna.

Les fawnas gagnent en outre +1 Perception effective pour chaque nouvelle map monde visitee apres la map de depart. Les maisons et interieurs ne comptent pas.

Exemple Braise-Corne :

```txt
PV: 24
PA: 3
Puissance: 6
Defense: 2
Rapidite: 5
Critique: 15 %
Stabilite: 6
```

Lecture :

- assez rapide ;
- critique dangereux ;
- defense faible ;
- stabilite moyenne ;
- vulnerable si le joueur apprend a parer ou interrompre.

### Exemple : Braise-Corne

Braise-Corne est une creature Feu orientee critique.

| Action generique | Nom Braise-Corne | Cout | Feinte possible | Intention |
| ---------------- | ---------------- | ---- | --------------- | --------- |
| Coup simple | Griffe chaude | 1 PA | oui | pression reguliere |
| Coup fort | Cornes ardentes | 2 PA | oui | gros coup physique, critique possible |
| Protection | Cendres serrees | 2 PA | non | reduction de degats, temporisation |
| Art | Charge flamboyante | 3 PA | oui | attaque signature, parable ou interruptible, peut appliquer Brulure |

Exemple de comportement connu :

```txt
Braise-Corne enchaine des Griffes chaudes pour maintenir la pression.
Ses Cornes ardentes peuvent provoquer un critique.
Quand il s'entoure de Cendres serrees, il reduit les degats subis.
S'il accumule assez de PA, il prepare une Charge flamboyante, interruptible ou parable. Si elle touche, elle peut appliquer Brulure.
```

Exemples d'objectifs de capture :

- survivre 4 tours ;
- interrompre Charge flamboyante ;
- finir un tour avec au moins 1 PA ;
- objectif cache : provoquer un critique apres avoir pare Cornes ardentes.

## 30. Points d'action

Chaque capacite possede un cout.

| Action | Cout |
| ------ | ---- |
| Entaille | 1 PA |
| Garde | 1 PA |
| Feinte | 2 PA |
| Art | 3 PA |
| Capture | 1 PA, uniquement en combat de creature |

Les PA representent :

- le tempo ;
- la flexibilite ;
- la gestion tactique ;
- la possibilite de jouer prudemment ou agressivement.

Les effets qui modifient les PA doivent etre controles avec soin, car ils peuvent facilement casser le jeu.

Plafond recommande :

- 3 PA : base de depart ;
- 4 PA : progression normale ou etat courant avance ;
- 5 PA : plafond normal ;
- 6 PA : etat exceptionnel, temporaire ou tres conditionnel.

Les PA ne doivent jamais devenir une progression ouverte. Atteindre 6 PA doit rester rare et provenir principalement d'utilitaires, de bonus temporaires, de bonus 12 ou d'effets conditionnels clairement limites.

## 31. Touche, esquive et coups manques

Les actions offensives peuvent manquer.

Objectif :

- donner plus de valeur a l'Initiative ;
- rendre les creatures rapides plus distinctes ;
- creer des risques tactiques sans rendre le combat injuste.

L'Initiative du heros et la Rapidite des creatures doivent influencer les chances de toucher et d'esquiver.

Principe :

> Plus un combattant est rapide par rapport a sa cible, plus il touche facilement et plus il evite facilement les coups.

Resolution recommandee :

```txt
Chance de toucher = chance de base + ecart de vitesse
```

Pour le heros :

```txt
Ecart de vitesse = Initiative heros - Rapidite creature
```

Pour une creature :

```txt
Ecart de vitesse = Rapidite creature - Initiative heros
```

Regle simple pour la verticale :

- chance de base : 90 % ;
- chaque point d'ecart de vitesse modifie la chance de toucher de 2 % ;
- chance minimale : 75 % ;
- chance maximale : 98 %.

Exemple :

```txt
Initiative heros : 5
Rapidite creature : 8
Ecart : -3
Chance de toucher du heros : 90 % - 6 % = 84 %
Chance de toucher de la creature : 90 % + 6 % = 96 %
```

Les coups manques doivent rester lisibles et limites.

Recommandations :

- Entaille, Art, Coup simple, Coup fort et Arts offensifs peuvent manquer ;
- Garde, Protection et Capture ne devraient pas utiliser cette regle ;
- un coup manque n'inflige pas de degats et ne peut pas critiquer ;
- certains effets de type Vent peuvent augmenter l'esquive ou reduire la chance de toucher adverse ;
- les boss et creatures rares peuvent annoncer certains coups impossibles a esquiver, mais cela doit etre explicite.

Le hasard ne doit pas voler la decision au joueur. Les chances de toucher doivent donc rester bornees et visibles dans l'interface lorsque cela compte.

## 32. Exemple d'utilitaire PA

### Niveau 1 - Impulsion

- 25 % de chance de gagner 1 PA au debut du tour.

### Niveau 2 - Economie

- la premiere competence a 2 PA du tour coute 1 PA de moins.

### Niveau 3 - Tempo

- maximum de PA augmente de 1.

Ce type d'utilitaire est puissant car il fonctionne dans presque tous les builds. Il justifie la limite de 1 utilitaire equipe.

## 33. Critiques

Le critique ne sert pas uniquement a infliger davantage de degats.

Il peut :

- donner des PA ;
- declencher des effets ;
- interrompre ;
- appliquer des statuts ;
- accelerer le rythme du combat ;
- alimenter certains objectifs de capture.

Les builds critiques peuvent etre :

- explosifs ;
- fragiles ;
- tres dynamiques ;
- dependants de conditions.

Les instincts et utilitaires peuvent modifier les effets des critiques, mais il faut eviter qu'un build critique devienne automatiquement optimal dans toutes les situations.

## 34. Les deux types de combat

Le jeu possede :

- les combats standards ;
- les combats de capture.

## 35. Combats standards

Le joueur :

- prepare son build ;
- equipe ses creatures ;
- choisit les creatures dont les instincts correspondent a sa strategie ;
- optimise ses synergies.

Ces combats servent a :

- exprimer les builds ;
- experimenter ;
- exploiter les specialisations ;
- obtenir monnaie, progression et ressources.

En combat standard, le heros beneficie :

- de ses statistiques permanentes ;
- de ses capacites ;
- de ses creatures equipees ;
- des instincts portes par ces creatures.

Les instincts de creatures peuvent donc influencer un combat normal, mais uniquement si la creature qui les porte est equipee. Ils servent a differencier deux creatures d'une meme espece, a corriger une faiblesse, a activer une condition ou a creer une passerelle entre deux strategies.

Les combats standards utilisent les plafonds de build complet : ils peuvent autoriser des valeurs plus hautes que les captures, car les creatures equipees et les bonus de specialisation doivent s'y exprimer pleinement.

## 36. Combats de capture

Les combats de capture sont differents.

Le joueur entre :

- sans creatures equipees ;
- avec uniquement son heros ;
- avec sa progression permanente ;
- avec eventuellement un instinct de chasse prepare.

Objectif :

- empecher les builds optimises de trivialiser les captures ;
- faire des captures des duels memorables ;
- tester la maitrise du joueur ;
- enseigner les mecaniques des creatures.

Les combats de capture utilisent des plafonds plus bas que les combats standards. Ils sont concus autour du heros, de ses competences, de ses objets de chasse, de sa Perception preparee, de son eventuel instinct de chasse et de sa progression permanente, pas autour des creatures equipees.

Les captures ne reposent pas principalement sur l'epuisement des PV.

Si une creature tombe a 0 PV pendant une chasse, elle n'est pas mise KO et elle ne meurt pas : elle s'enfuit.

Consequences :

- la sequence de chasse prend fin ;
- la creature ne peut plus etre capturee pendant cette rencontre ;
- elle laisse une petite recompense derriere elle ;
- le joueur recoit seulement les recompenses minimales prevues ;
- aucun instinct n'est obtenu ;
- aucune presence capturable n'est consommee dans la zone ;
- cela ajoute une tension entre affaiblir la creature et ne pas la pousser a fuir.

Cette petite recompense peut prendre la forme de :

- etoiles minimum ;
- or minimum ;
- trace mineure ;
- ressource de chasse faible ;
- petit progres de connaissance si la creature a ete observee.

Le joueur doit accomplir des objectifs tactiques.

Le joueur peut tenter une capture meme si la creature possede encore des PV.

Cette tentative comporte des risques :

- la capture peut echouer si la creature est encore trop stable, trop dangereuse ou si les objectifs principaux ne sont pas assez avances ;
- la creature peut etre capturee sans donner l'instinct vise ;
- certains objectifs secondaires, caches ou de maitrise peuvent etre perdus si la capture est tentee trop tot ;
- la tentative peut mettre fin au combat ou consommer une ressource de capture selon les regles choisies.

Effet sur la population de zone :

- capture echouee : aucune presence consommee ;
- capture reussie : 1 presence capturable consommee ;
- fuite a 0 PV : aucune presence consommee.

Cette option permet au joueur de capturer de facon opportuniste, notamment s'il veut surtout gagner des etoiles ou progresser dans sa connaissance d'une creature, sans forcement viser l'instinct optimal.

Le briefing de capture peut afficher plusieurs niveaux d'information :

- objectifs visibles : informations de base du combat ;
- objectifs caches : reveles par Perception ou preparation de chasse ;
- comportement connu : revele par observation, specialiste ou bestiaire.

## 37. Objectifs de capture

Chaque chasse possede un nombre d'objectifs defini en amont. Le format complet contient 4 objectifs.

Progression recommandee :

| Chasse | Objectifs | Objectif cache |
| ------ | --------- | -------------- |
| 1re chasse | 1 objectif visible | non |
| 2e chasse | 2 objectifs visibles | non |
| 3e chasse | 3 objectifs visibles | non |
| 4e chasse et suivantes | 4 objectifs | possible |

A partir de la 4e chasse, le joueur entre dans la boucle complete de capture. Les chasses ne reduisent plus leur nombre d'objectifs, sauf cas special volontaire : tutoriel avance, creature narrative, rencontre rare ou mode de jeu particulier.

Au briefing de chasse, la creature tire au hasard ses objectifs dans les listes compatibles avec son espece, son niveau de difficulte et la progression du joueur.

Regle obligatoire :

> Chaque chasse doit contenir un objectif de pression offensive. Par defaut : reduire les PV ennemis sous 25 %.

Cet objectif force le joueur a utiliser ses actions offensives. Sans lui, une chasse pourrait etre resolue uniquement par defense, attente ou gestion de PA.

Objectif obligatoire :

| Objectif | Disponibilite | Role |
| -------- | ------------- | ---- |
| Reduire les PV ennemis sous 25 % | toutes les chasses | pression offensive standard |

Apres la 15e chasse, une variante plus exigeante peut entrer dans le tirage :

| Objectif | Disponibilite | Role |
| -------- | ------------- | ---- |
| Reduire les PV ennemis sous 10 % | apres la 15e chasse | pression offensive risquee |

La variante sous 10 % doit etre utilisee avec prudence, car elle rapproche fortement la creature de la fuite. Elle peut remplacer l'objectif sous 25 %, mais ne doit pas s'ajouter systematiquement a lui.

Objectifs visibles faciles :

| Objectif | Parametre |
| -------- | --------- |
| Survivre X tours | X = 3 ou 4 |
| Finir un tour avec au moins 1 PA | se valide aussi si le combat se termine par une capture reussie avec au moins 1 PA restant |
| Utiliser Garde au moins une fois | - |
| Reussir une Feinte | - |
| Ne pas tomber sous 50 % de PV | - |
| Utiliser Art au moins une fois | - |
| Capturer avant le tour X | X = 3 ou 4 |
| Utiliser Entaille au moins 2 fois | - |

Objectifs caches :

| Objectif | Intention |
| -------- | --------- |
| Reussir une Feinte contre l'attaque speciale de la creature | lecture du pattern |
| Capturer avec exactement 1 PA restant | precision de tempo |
| Empecher toute attaque speciale pendant la chasse | controle / interruption |
| Provoquer un critique avant la capture | prise de risque offensive |

Les creatures rares peuvent :

- modifier les objectifs ;
- cacher certaines informations ;
- posseder plusieurs phases ;
- reagir a la maniere dont le joueur a prepare sa chasse.

La Perception peut reveler certains objectifs caches ou indices de capture. Dans le prototype, la 4e condition cachee est lisible si la Perception du joueur est superieure ou egale a la Perception effective du fawna. Sinon, elle apparait comme une condition inconnue jusqu'a ce qu'elle soit accomplie ou jusqu'a ce qu'une regle de connaissance la revele.

Principe important :

> Capturer une creature doit apprendre au joueur comment cette creature fonctionne ensuite dans un build.

## 38. Connaissance, specialistes et bestiaire

Le bloc de briefing "Comportement connu" ne doit pas forcement etre disponible gratuitement.

Il peut dependre d'un systeme de connaissance de creature, alimente par :

- l'observation en combat ;
- une premiere rencontre ratee ou reussie ;
- une capture precedente ;
- des traces trouvees sur la map ;
- une sous-quete ;
- un specialiste des creatures ;
- un service paye avec la monnaie du jeu ;
- certains objets de chasse.

Separation recommandee :

- la Perception revele les objectifs caches et les conditions d'instincts ;
- le specialiste ou le bestiaire revele les comportements connus ;
- les outils, les competences du heros et les creatures equipees en combat standard permettent d'executer le plan.

Exemple avant analyse :

```txt
Comportement connu :
Analyse incomplete. Consultez un specialiste ou observez la creature en combat.
```

Exemple apres analyse :

```txt
Comportement connu :
Griffes rapides, souffle de braise qui perturbe les PA, puis charge flamboyante interruptible ou parable.
```

Ce systeme donne une place au monde hors combat. Le joueur peut rencontrer une creature, echouer ou renoncer, rapporter des indices, consulter un specialiste, puis revenir mieux prepare.

Le specialiste ne doit pas etre obligatoire pour capturer. Il doit rendre la capture plus lisible, moins risquee, ou plus rentable en instincts.

## 39. Recompenses de capture

Une chasse a deux issues principales :

1. le joueur capture la creature, avec plus ou moins d'objectifs remplis ;
2. la creature tombe a 0 PV et fuit.

Une capture reussie peut donner :

1. des etoiles d'experience ;
2. une creature equipable ;
3. de l'or ;
4. un instinct individuel selon la qualite de la capture.

La fuite donne moins de recompenses qu'une capture. Elle doit toutefois donner quelque chose afin que le joueur ne sente pas que toute la chasse a ete inutile.

La progression de chasse ne donne pas directement des points complets. Elle donne des etoiles :

```txt
+25 etoiles = 25 % d'une gemme
+100 etoiles = 1 gemme
+1 gemme = 1 amelioration radar possible
+10 gemmes = 1 PA achetable en boutique
```

Exemple :

- capturer une creature Feu critique peut donner une creature Feu avec un instinct de critique/brulure ;
- capturer une creature Eau de controle peut donner une creature Eau avec un instinct de retrait de PA ;
- capturer une creature Vent mobile peut donner une creature Vent avec un instinct d'initiative ou de deplacement.

L'instinct n'est pas un bonus herite separe du heros. Il appartient a la creature capturee. Pour utiliser cet instinct en combat standard, le joueur doit equiper cette creature.

Une meme espece de creature peut etre capturee avec plusieurs instincts differents. Ces instincts ne doivent pas dependre uniquement du hasard : ils peuvent etre lies aux objectifs de capture accomplis.

Regle de qualite de capture pour une creature niveau I :

| Situation | Creature obtenue | Instinct | Etoiles | Or |
| --------- | ---------------- | -------- | --------- | -- |
| Capture tentee avec 0 a 2 objectifs remplis | si la capture reussit | aucun | +25 | or faible |
| Capture echouee avec 0 a 2 objectifs remplis | non | aucun | aucun gain immediat, retour a la chasse | aucun gain immediat |
| Capture reussie avec 3 objectifs remplis | oui | niveau I | +35 | or normal |
| Capture reussie avec 4 objectifs remplis | oui | niveau II | +35 | or eleve |
| Creature tombee a 0 PV avant capture | non, elle fuit | aucun | +10 | or tres faible |

Pour les creatures niveau II et III, le niveau d'instinct suit la formule definie dans la progression des creatures :

```txt
Niveau d'instinct = niveau d'evolution + bonus de qualite de capture
Plafond : III
```

Table de reference :

| Niveau de creature capturee | 3 objectifs | 4 objectifs |
| --------------------------- | ----------- | ----------- |
| Niveau I | instinct I | instinct II |
| Niveau II | instinct II | instinct III |
| Niveau III | instinct III | instinct III |

Ces valeurs correspondent a une creature de niveau 1. Les creatures de niveau 2 et 3, rencontrees plus tard dans le jeu, doivent donner de meilleures recompenses sans casser le rythme de progression.

Bonus de niveau recommande :

| Niveau de creature | Bonus d'etoiles | Multiplicateur d'or |
| ------------------ | ----------------- | ------------------- |
| Niveau 1 | +0 | x1,0 |
| Niveau 2 | +10 | x1,5 |
| Niveau 3 | +20 | x2,0 |

Exemple :

```txt
Capture 4 objectifs d'une creature niveau 1 : +35 etoiles
Capture 4 objectifs d'une creature niveau 2 : +45 etoiles
Capture 4 objectifs d'une creature niveau 3 : +55 etoiles
```

La fuite applique aussi le bonus de niveau, mais sur une base faible. Exemple : une creature niveau 3 qui fuit donne +30 etoiles au lieu de +10. Cela recompense le risque d'avoir affronte une creature plus dangereuse, sans donner les gains d'une capture reussie.

Base d'or recommandee pour la premiere verticale :

| Situation | Or recommande |
| --------- | ------------- |
| Fuite de creature | 3 a 5 |
| Capture opportuniste, 0 a 2 objectifs | 8 a 10 |
| Capture avec 3 objectifs | 15 a 20 |
| Capture avec 4 objectifs | 25 a 30 |

Ces valeurs peuvent ensuite etre multipliees par la rarete, la zone, le niveau de la creature ou un bonus de preparation.

Le joueur peut donc capturer une creature sans remplir les objectifs pour obtenir rapidement l'espece, mais cette creature n'a pas d'instinct. Elle peut quand meme etre equipee, puis remplacee plus tard par une meilleure capture.

Principe :

> Les objectifs de capture servent aussi de conditions de deblocage d'instincts.

Exemple :

- capture opportuniste : creature sans instinct ;
- 3 objectifs accomplis sur une creature niveau I : instinct niveau I ;
- 4 objectifs accomplis sur une creature niveau I : instinct niveau II ;
- capture parfaite speciale : choix entre plusieurs instincts possibles sur la creature capturee.

Les instincts doivent rester lies a la qualite de la capture et aux objectifs accomplis.

Ainsi, recapturer une creature a un interet clair. Le joueur ne recapture pas seulement pour obtenir un doublon : il chasse une trace precise, utile pour preparer d'autres combats ou d'autres captures.

Exemple avec une creature Feu critique :

- provoquer un critique pendant la capture peut generer un instinct de critique sur la creature capturee ;
- interrompre sa capacite chargee peut generer un instinct d'interruption ;
- survivre sans subir Brulure peut generer un instinct defensif contre le Feu ;
- reussir tous les objectifs peut permettre de choisir l'instinct de la creature capturee.

Cette logique transforme la capture en apprentissage et en maitrise progressive d'une espece.

## 40. Exemples de creatures

### Braise-Corne

Type :

- Feu.

Identite :

- critiques explosifs.

Effets possibles :

- niveau 1 : le premier critique du combat applique Brulure ;
- niveau 2 : les ennemis brules subissent plus de degats critiques ;
- niveau 3 : une fois par combat, un critique rembourse 1 PA.

Instinct individuel possible :

- Etincelle critique : le premier critique d'un combat applique une Brulure legere.

### Fournaiseau

Type :

- Feu.

Identite :

- depense elevee, gros retour.

Effets possibles :

- bonus apres une capacite a 3 PA ;
- degats accrus si le heros finit son tour a 0 PA ;
- risque defensif temporaire apres grosse attaque.

Instinct individuel possible :

- Frappe ardente : apres avoir depense 3 PA en une action, la prochaine Entaille gagne un bonus de degats.

### Nacrelame

Type :

- Eau.

Identite :

- retrait de PA.

Effets possibles :

- niveau 1 : toucher un ennemi deux fois dans le tour lui retire 1 PA au prochain tour ;
- niveau 2 : si l'ennemi a 0 PA restant, le heros gagne de la garde ;
- niveau 3 : une capacite Eau coute 1 PA de moins une fois tous les deux tours.

Instinct individuel possible :

- Courant brise : une fois par combat, retirer un PA a un ennemi donne de la garde.

### Ondigarde

Type :

- Eau.

Identite :

- defense et temporisation.

Effets possibles :

- gagner garde si le heros conserve 1 PA ;
- reduire les degats apres une parade ;
- transformer un tour defensif en avantage au tour suivant.

Instinct individuel possible :

- Refuge clair : finir un tour avec au moins 1 PA donne une petite garde.

### Rafalynx

Type :

- Vent.

Identite :

- initiative et mobilite.

Effets possibles :

- niveau 1 : bonus d'initiative ;
- niveau 2 : apres un deplacement, la prochaine Entaille a plus de critique ;
- niveau 3 : si le heros agit avant l'ennemi, sa premiere attaque coute 0 PA une fois par combat.

Instinct individuel possible :

- Pas de rafale : apres une esquive reussie, la prochaine Entaille gagne du critique.

### Plumevif

Type :

- Vent.

Identite :

- actions multiples.

Effets possibles :

- bonus aux attaques rapides ;
- recuperation conditionnelle de PA ;
- enchainements limites si le heros reste mobile.

Instinct individuel possible :

- Elan leger : apres deux actions a 1 PA dans le meme tour, gagne un petit bonus d'esquive.

### Relais

Type :

- Utilitaire.

Identite :

- economie de PA.

Effets possibles :

- chance de gagner 1 PA au debut du tour ;
- reduction de cout sur la premiere competence a 2 PA ;
- maximum de PA augmente.

Instinct individuel possible :

- Reserve tactique : une fois par combat, commencer un tour avec 0 PA restant au tour precedent donne +1 PA.

### Loupe

Type :

- Utilitaire.

Identite :

- capture et lecture.

Effets possibles :

- revele plus vite les objectifs caches ;
- augmente les gains de capture ;
- rend certains patterns plus lisibles.

Instinct individuel possible :

- Oeil du chasseur : revele une trace ou un indice supplementaire pendant l'exploration.

### Pivot

Type :

- Utilitaire.

Identite :

- changement de rythme.

Effets possibles :

- bonus apres alternance attaque/defense ;
- reduction de penalite apres changement de posture ;
- petit bonus d'initiative apres un tour defensif.

Instinct individuel possible :

- Reprise : apres une parade reussie, la prochaine action offensive coute 1 PA de moins une fois par combat.

## 41. Radar de statistiques

Le radar est un element central de l'interface.

Il represente :

- le heros ;
- les builds ;
- les synergies ;
- les specialisations ;
- les effets temporaires ou probabilistes.

Les 7 statistiques principales :

| Stat | Fonction |
| ---- | -------- |
| Puissance | degats |
| Defense | mitigation |
| Vitalite | points de vie |
| Critique | burst / variance |
| PA | economie d'action |
| Initiative | vitesse / priorite / precision / esquive |
| Perception | lecture / chasse / objectifs caches |

Valeurs de depart recommandees :

| Stat | Depart |
| ---- | ------ |
| Puissance | 2 |
| Defense | 2 |
| Vitalite | 10 PV |
| Critique | 3 % |
| PA | 3 |
| Initiative | 3 |
| Perception | 2 |

Plafonds recommandes pour les combats de capture :

| Stat | Plafond capture |
| ---- | --------------- |
| Puissance | 10 |
| Defense | 6 |
| Vitalite | 60 PV |
| Critique | 20 % |
| PA | 5 |
| Initiative | 10 |
| Perception | 5, via runes ou preparation dediee |

Les combats de capture doivent rester des duels de maitrise. Ils sont equilibres autour du heros, de sa progression permanente et de sa preparation de chasse. Les creatures ne sont pas equipees ; seul un instinct de chasse prepare peut eventuellement accompagner le heros.

Plafonds recommandes pour les combats standards :

| Stat | Plafond normal | Specialise / temporaire |
| ---- | -------------- | ----------------------- |
| Puissance | 15 | 20 |
| Defense | 10 | 14 |
| Vitalite | 60 PV | 75 PV |
| Critique | 30 % | 45 % |
| PA | 5 | 6 exceptionnel |
| Initiative | 15 | 22 |
| Perception | 5 | 7 via preparation dediee |

Les combats standards peuvent aller plus haut parce qu'ils expriment le build complet : heros, creatures equipees, instincts de creatures, utilitaires et bonus de specialisation.

Principe :

> Le heros seul doit etre competent. Le heros equipe doit etre expressif. Le heros specialise doit etre spectaculaire, mais pas permanent dans toutes les stats.

Exemple de decomposition pour une statistique comme Puissance :

```txt
Puissance de base max XP : 10
Avec creatures equipees : 15
Avec specialisation Feu 12 : 20
```

Chaque statistique possede sa propre unite reelle. Le radar normalise la representation visuelle.

Exemple :

- les PA utilisent une petite echelle ;
- les PV utilisent une grande echelle.

Le radar doit garder une lecture coherente malgre ces differences.

La Perception represente la capacite du heros a lire le monde et les creatures.

Elle peut servir a :

- reveler des objectifs caches de capture ;
- indiquer les conditions permettant d'obtenir des instincts ameliores ;
- afficher des indices sur les patterns d'une creature sauvage ;
- reveler sur la map des traces de creatures plus puissantes ;
- identifier des rencontres plus rares ou plus dangereuses ;
- augmenter la qualite ou la quantite d'informations avant une chasse.

La Perception ne s'ameliore pas avec l'XP. Elle progresse via une economie de preparation : runes achetees avec la monnaie, objets de chasse, services ou creatures specialisees.

Les bonus de Perception doivent etre choisis ou verrouilles avant la revelation des informations de briefing. Une fois les objectifs caches reveles, le joueur ne doit pas pouvoir retirer gratuitement la source de Perception qui a permis cette revelation.

Elle ne doit pas remplacer l'observation du joueur, mais elle peut reduire l'opacite et transformer la chasse en preparation lisible.

## 42. Double couche du radar

Radar du heros :

- progression permanente ;
- toujours visible ;
- forme stable ;
- represente l'identite durable du personnage.

Couche d'instincts de creatures :

- visible en combat standard si les creatures equipees portent des instincts ;
- rattachee aux creatures equipees ;
- peut modifier la forme du radar de build ;
- peut ajouter des pulsations, segments translucides ou marqueurs conditionnels ;
- indique les effets individuels apportes par les creatures choisies.

Radar de build :

- synergies ;
- bonus temporaires ;
- creatures equipees ;
- contributions statistiques des creatures equipees ;
- instincts de creatures ;
- forme plus dynamique.

En combat standard :

- radar complet visible : heros, creatures, contributions statistiques, instincts de creatures et synergies.

En combat de capture :

- disparition de la couche de creatures ;
- disparition des contributions statistiques des creatures equipees ;
- disparition des instincts de creatures non prepares ;
- affichage eventuel de l'instinct de chasse prepare ;
- couche heros et preparation de chasse visible ;
- le joueur voit ce qu'il conserve vraiment.

## 43. Journal de terrain et journal de combat

Le journal de terrain est l'objet donne par Nora au debut du prologue. Dans l'interface, il fait aussi office de journal de combat.

Role ludique :

- afficher les evenements importants du combat ;
- rappeler les objectifs accomplis ou echoues ;
- signaler les comportements observes ;
- donner des indices lorsque la Perception ou la connaissance le permet ;
- garder une trace des captures, fuites et recompenses.

Role narratif :

- maintenir Nora presente sans qu'elle accompagne physiquement le joueur partout ;
- donner une voix identifiable au journal ;
- faire sentir que chaque chasse alimente une enquete ;
- transformer le log de combat en outil de recherche.

Principe :

> Le journal ne dit pas seulement ce qui se passe. Nora raconte ce qu'elle voit, ce qu'elle comprend, et parfois ce qu'elle craint.

Le style doit rester utile avant d'etre litteraire. Les phrases doivent etre courtes, lisibles en combat et immediatement actionnables.

Exemples :

```txt
Braise-Corne baisse la tete. Il prepare quelque chose.
Nora : C'est sa charge. Feinte possible, si tu gardes assez de PA.
```

```txt
La creature vacille. Elle est assez affaiblie pour tenter une capture.
Nora : Attention, encore trop bas et elle fuira.
```

Lorsque l'information manque, le journal peut l'assumer :

```txt
Mouvement difficile a lire.
Nora : Je n'ai pas assez de donnees sur cette espece.
```

## 44. Radar ennemi et creatures sauvages

Les ennemis standards possedent un radar partiellement visible.

Certaines informations restent cachees :

- utilitaires ;
- bonus exacts ;
- synergies rares ;
- capacites speciales.

Les creatures sauvages capturables ne possedent pas de radar visible.

Le joueur voit :

- les objectifs ;
- les comportements ;
- les patterns ;
- les indices de capture.

Objectif :

- preserver le mystere ;
- encourager l'observation ;
- eviter de transformer la capture en simple lecture de statistiques.

## 45. Utilitaires dans le radar

Les utilitaires modifient :

- la forme ;
- les animations ;
- les comportements visuels du radar.

Exemple :

- un bonus PA probabiliste augmente legerement l'axe PA ;
- il cree une pulsation ;
- il peut afficher une extension translucide ;
- il represente le potentiel tactique plutot qu'une valeur fixe.

Le radar doit permettre :

- de comprendre un build en un regard ;
- d'identifier les specialisations ;
- de visualiser le style de jeu ;
- de rendre les builds desirables avant meme le combat.

## 46. Donnees et extensibilite

La verticale ne doit pas seulement prouver le gameplay. Elle doit prouver la chaine de production.

Question centrale :

> Est-ce que je peux ajouter du contenu sans tout recoder ?

Le contenu repetable doit vivre en donnees :

- creatures ;
- types ;
- competences ;
- armes ;
- instincts ;
- dialogues ;
- quetes ;
- objectifs de capture ;
- connaissances de creature ;
- inventaire de creatures ;
- sanctuaire ;
- ennemis ;
- rencontres ;
- maps ;
- recompenses ;
- effets de statut ;
- bonus de synergie.

Le code ne doit pas contenir une regle specifique comme :

- Braise-Corne donne +15 % critique.

Le code doit savoir lire un effet generique :

- appliquer un bonus de critique ;
- appliquer une brulure ;
- reduire un cout ;
- retirer un PA ;
- declencher une action conditionnelle.

## 47. Editeur de dialogue

L'editeur de dialogue doit etre concu pour tout le jeu, pas seulement pour la slice.

Il doit fonctionner comme un editeur de noeuds narratifs.

Un dialogue peut contenir :

- texte ;
- portrait ;
- choix joueur ;
- conditions ;
- variables ;
- actions ;
- branchements ;
- declenchement de quete ;
- declenchement de combat ;
- declenchement de capture ;
- recompense ;
- changement d'etat du monde.

Exemple de structure :

```json
{
  "id": "village_elder_intro",
  "nodes": [
    {
      "id": "start",
      "speaker": "elder",
      "textKey": "dialogue.village_elder_intro.start",
      "choices": [
        {
          "labelKey": "dialogue.village_elder_intro.choice_accept",
          "next": "accept",
          "actions": [
            { "type": "set_flag", "flag": "forest_intro_accepted", "value": true }
          ]
        },
        {
          "labelKey": "dialogue.village_elder_intro.choice_decline",
          "next": "decline"
        }
      ]
    }
  ]
}
```

Actions generiques utiles :

```json
{ "type": "start_combat", "encounter": "tutorial_duel" }
{ "type": "start_capture", "creature": "rafalynx" }
{ "type": "give_currency", "amount": 20 }
{ "type": "unlock_area", "area": "forest_path" }
{ "type": "set_flag", "flag": "met_hunter", "value": true }
{ "type": "give_creature", "creature": "braise_corne", "instinct": "spark_critical" }
```

## 48. Localisation et traduction

La traduction doit etre prevue des la verticale, meme si toutes les langues ne sont pas encore finalisees.

Principe :

> Le contenu de jeu reference une cle de texte. La langue choisit comment afficher cette cle.

Les dialogues, competences, creatures, instincts, objectifs, objets et textes d'interface ne doivent pas contenir directement les phrases finales. Ils doivent utiliser des cles de localisation.

Exemple :

```json
{
  "id": "braise_corne",
  "nameKey": "creature.braise_corne.name",
  "descriptionKey": "creature.braise_corne.description"
}
```

Fichiers recommandes :

```txt
locales/
  fr/
    ui.json
    dialogue.json
    creatures.json
    instincts.json
    abilities.json
    quests.json
  en/
    ui.json
    dialogue.json
    creatures.json
    instincts.json
    abilities.json
    quests.json
```

Exemple :

```json
{
  "dialogue.village_elder_intro.start": "La foret est agitee depuis hier."
}
```

```json
{
  "dialogue.village_elder_intro.start": "The forest has been restless since yesterday."
}
```

Les textes avec variables doivent etre traduits comme des phrases completes.

Exemple :

```json
{
  "capture.objective.survive_turns": "Survivre {turns} tours."
}
```

```json
{
  "capture.objective.survive_turns": "Survive for {turns} turns."
}
```

Il faut eviter de concatener des morceaux de phrases dans le code, car cela casse rapidement la traduction.

A prevoir des la production :

- un glossaire franco-anglais des termes importants ;
- des cles stables et lisibles ;
- des metadonnees de contexte pour les dialogues importants ;
- une validation des cles manquantes ;
- une langue de fallback ;
- des tests d'interface avec textes plus longs en anglais ou en francais.

Glossaire initial :

| Francais | Anglais |
| -------- | ------- |
| creature | creature |
| instinct | instinct |
| PA | AP |
| Puissance | Power |
| Defense | Defense |
| Vitalite | Vitality |
| Critique | Critical |
| Initiative | Initiative |
| Perception | Perception |
| Capture | Capture |
| Rune de perception | Perception Rune |

Les IDs techniques doivent rester stables, idealement en anglais ou en snake_case, independamment de la langue affichee.

## 49. Flags et variables

Le jeu a besoin d'un systeme global de flags et variables.

Exemples :

- `flags.met_elder`
- `flags.forest_unlocked`
- `quest.capture_rafalynx.started`
- `quest.capture_rafalynx.completed`
- `world.bridge_repaired`
- `player.has_capture_tool`
- `npc.hunter_mood`

Ces etats doivent pouvoir etre lus par :

- dialogues ;
- PNJ ;
- coffres ;
- portes ;
- rencontres ;
- quetes ;
- tutoriels ;
- captures.

Sans ce systeme, le projet risque d'accumuler des exceptions codees a la main.

## 50. Ordre de developpement recommande

Ordre recommande :

1. Definir les formats de donnees.
2. Creer le chargeur de donnees et la validation des IDs.
3. Creer le systeme de localisation et la validation des cles de texte.
4. Creer le systeme de flags et variables.
5. Creer le systeme de dialogue.
6. Creer un editeur de dialogue simple mais base sur le format final.
7. Creer un overworld minimal avec Tiled, collisions, PNJ et interactions.
8. Creer un combat minimal : PA, attaque, ennemi, victoire/defaite.
9. Creer la transition dialogue -> combat -> recompense -> retour au monde.
10. Ajouter les creatures equipees.
11. Ajouter les instincts portes par les creatures.
12. Ajouter le radar.
13. Ajouter les captures tactiques.
14. Ajouter la progression permanente.
15. Construire la premiere vraie zone.

Principe directeur :

> Tout contenu qui sera repete 10 fois doit etre editable en donnees avant d'etre multiplie.

## 51. Objectif de la premiere verticale

Contenu recommande :

- 1 arme ;
- 1 bouclier ;
- 3 types ;
- 6 creatures typees ;
- 3 utilitaires ;
- plusieurs instincts individuels possibles par espece ;
- 1 emplacement d'instinct de chasse prepare pour les captures ;
- inventaire de creatures ;
- Sanctuaire pour liberer et etudier les creatures ;
- combats standards ;
- combats de capture ;
- systeme de PA ;
- systeme de critiques ;
- radar fonctionnel ;
- petite region jouable ;
- ouverture par lettre de Nora ;
- village de Briseval ;
- Nora comme specialiste et mentor ;
- PNJ d'entrainement rejouable ;
- PNJ bloquant l'acces a la grotte ;
- grotte de conclusion du prologue.

Priorites absolues :

- plaisir des builds ;
- synergies ;
- systeme de capture ;
- sensations tactiques ;
- progression du heros ;
- lisibilite du radar ;
- pipeline de donnees ;
- editeur de dialogue extensible.

Avant :

- grandes maps ;
- contenu massif ;
- dizaines de creatures ;
- nouveaux types ;
- armes multiples ;
- raretes complexes ;
- loot aleatoire.

## 52. Premier livrable conseille

Premier livrable :

> Un mini village ou parler a un PNJ lance un duel, puis modifie le monde apres victoire.

Ce moment doit utiliser les vrais systemes :

- dialogue data-driven ;
- actions generiques ;
- flags ;
- rencontre declaree en donnees ;
- recompense declaree en donnees ;
- sauvegarde d'etat.

Ce livrable ne sert pas a impressionner visuellement. Il sert a valider la machine de production du jeu.

Une fois ce circuit propre, on peut ajouter :

- creatures ;
- instincts ;
- radar ;
- captures ;
- synergies ;
- progression.

## 53. Regles de design a garder en tete

- Une creature doit changer une habitude de jeu.
- Un instinct doit encourager un comportement.
- Un instinct appartient a une creature individuelle, pas a une progression permanente separee du heros.
- Un instinct de creature peut etre prepare comme trace de chasse en capture, mais sans apporter type, effort, stats ou synergies.
- Un utilitaire doit etre un joker, pas le meilleur choix par defaut.
- Une capture doit enseigner la creature capturee.
- Un bonus 12 doit transformer le gameplay.
- Le radar doit etre utile, pas seulement joli.
- Les rencontres doivent rester proches du niveau reel du joueur pour eviter les combats sans interet.
- La progression permanente doit enrichir le heros sans annuler les builds.
- Le build temporaire doit etre flexible, mais la respecialisation permanente doit rester ritualisee.
- La verticale doit tester la production de contenu autant que le gameplay.

## 54. Phrase de reference

> Le heros est le centre du combat. Les creatures definissent son build actuel. Chaque creature porte un instinct qui lui donne une identite individuelle. En capture, un instinct peut devenir une trace de chasse limitee. Le radar rend cette composition lisible en un regard.
