# Guide technique - Projet P

Ce document sert de bible technique pour le développement du jeu. Il complète le guide de conception en décrivant les choix d'architecture, les conventions de code, les données de gameplay, l'interface, la localisation et les règles à respecter quand le prototype grandira.

## 1. Objectif technique

Projet P est un RPG tactique de capture jouable dans un navigateur web, pensé d'abord pour mobile en mode paysage.

Les priorités techniques sont :

- garder une base modulaire, testable et réutilisable ;
- séparer les données de gameplay, l'état de combat, l'interface et le rendu ;
- préparer la localisation dès le début ;
- rendre l'interface lisible sur smartphone paysage ;
- permettre à terme l'intégration d'exploration, dialogues, sauvegarde, cartes Tiled et combats plus complets.

Le prototype actuel couvre surtout la séquence de capture :

1. Briefing de créature.
2. Préparation du héros via radar.
3. Combat de capture.
4. Objectifs et jauge de capture.

## 2. Stack technique

Stack actuelle :

- HTML, CSS et JavaScript moderne.
- Modules ES.
- Vite pour le serveur local, le build et le chargement des modules.
- Phaser pour la scène de combat.
- Canvas HTML pour le radar de statistiques.

Commandes de développement :

```bash
npm install
npm run dev
npm run build
npm run preview
```

Le jeu ne doit plus être ouvert directement en `file://`. Les imports ES et les assets doivent passer par un serveur local.

URL locale typique :

```text
http://localhost:5173/
```

URL réseau mobile typique :

```text
http://10.0.0.123:5173/
```

## 3. Structure actuelle du projet

```text
Projet P/
  index.html
  package.json
  vite.config.js
  assets/
    creatures/
  src/
    main.js
    data/
      affixes.js
      actions.js
      captureObjectives.js
      creatures.js
      creatures/
        braiseCorne.js
        index.js
      encounters.js
      hero/
        baseHero.js
        index.js
      progression/
        baseProgression.js
        index.js
      stats.js
    game/
      enemyAi.js
      combatFormulas.js
      combatState.js
    ui/
      StatRadar.js
    locales/
      en.js
      fr.js
      index.js
    utils/
      i18n.js
```

Rôle des fichiers principaux :

- `index.html` : point d'entrée HTML, styles globaux provisoires et container racine de l'application.
- `src/main.js` : point de composition de l'application, branchement DOM initial, création des écrans, du routeur et des contrôleurs.
- `src/app/appShell.js` : shell DOM principal de l'application, responsable de monter les containers des écrans dans le point d'ancrage `#app`.
- `src/app/screenRouter.js` : routeur léger des écrans de jeu, utilisé pour passer du briefing au combat et prêt à accueillir la carte.
- `src/data/*.js` : données de jeu stables.
- `src/data/affixes.js` : liste des affixes disponibles et tirage aléatoire par type.
- `src/data/creatures/*.js` : fiches individuelles des créatures.
- `src/data/encounters.js` : pool et sélection des rencontres de capture.
- `src/data/hero/*.js` : fiche du héros et statistiques de départ.
- `src/data/progression/*.js` : état initial de progression globale du joueur.
- `src/game/enemyAi.js` : règles génériques du comportement adverse, indépendantes d'une espèce ou d'un type.
- `src/game/CombatController.js` : contrôleur de séquence de combat, responsable de l'état courant du combat, des actions joueur et des tours adverses.
- `src/game/combatAffixes.js` : application des instincts de chasse pendant le combat.
- `src/game/combatLog.js` : journal de combat typé lettre par lettre.
- `src/game/combatDebug.js` : logs console détaillés pour diagnostiquer les incohérences de combat.
- `src/game/combatItems.js` : helpers d'inventaire de combat et application des effets d'objets.
- `src/game/combatObjectives.js` : validation des objectifs de capture et progression associée.
- `src/game/combatRewards.js` : attribution des instincts gagnés à la capture.
- `src/game/combatTurns.js` : déroulé des tours joueur/adversaire, choix d'actions adverses, enchaînements et passage de main.
- `src/game/combatFormulas.js` : formules et coefficients d'équilibrage du combat.
- `src/game/combatState.js` : état et fonctions pures du combat.
- `src/game/affixEffects.js` : helpers d'effets et d'affichage des niveaux d'instincts.
- `src/screens/HuntBriefingScreen.js` : écran de briefing de chasse, responsable du radar, de la fiche créature, des modales de briefing et de la sélection d'instinct.
- `src/screens/CombatScreen.js` : écran de combat, responsable du HUD, des jauges, objectifs, boutons d'action, PA et animations DOM de l'arène.
- `src/ui/InventoryModal.js` : composant de sac réutilisable, responsable du rendu des objets, de la sélection et des alertes d'usage.
- `src/ui/StatRadar.js` : composant radar réutilisable.
- `src/locales/*.js` : dictionnaires de traduction et langue par défaut.
- `src/utils/i18n.js` : système de traduction par clés.

À mesure que le jeu grandit, `src/main.js` devra être progressivement vidé au profit de modules spécialisés.

## 3.1. Écrans de jeu

`index.html` reste le point d'entrée HTML unique de l'application. Il ne doit pas devenir une page métier dédiée au briefing, au combat ou à la carte. Son rôle est limité au chargement des styles globaux, au verrouillage d'orientation et au point d'ancrage `#app`.

Le shell DOM principal est monté par `src/app/appShell.js`. Ce fichier contient les containers nécessaires aux écrans existants, mais ne doit pas porter de règles de jeu. À terme, les fragments propres à un écran pourront encore descendre dans leurs modules respectifs si leur structure devient trop volumineuse.

Les grandes séquences doivent être pensées comme des écrans applicatifs :

- `map` : exploration et traversée de la carte ;
- `huntBriefing` : briefing de chasse, radar, instinct préparé et conditions ;
- `combat` : combat de capture ou combat standard ;
- écrans futurs : résultat, dialogue, boutique, inventaire global.

Le passage d'un écran à l'autre passe par `src/app/screenRouter.js`. Le routeur ne connaît pas les règles de jeu : il affiche ou masque les containers, applique la classe globale du body et déclenche les callbacks de recalcul d'affichage.

Objectif à moyen terme :

```text
src/
  app/
    screenRouter.js
  screens/
    MapScreen.js
    HuntBriefingScreen.js
    CombatScreen.js
  ui/
    ModalFrame.js
    InventoryModal.js
    StatRadar.js
```

Les modales qui utilisent le cadre pixel partagé doivent reprendre les classes CSS `pixel-modal` et `pixel-modal-content`, puis assembler les mêmes morceaux graphiques que le sac de combat (`assets/inventaire/fond_*`). Les écrans restent responsables de leur positionnement, mais pas du dessin du cadre.

Règle :

> Un écran orchestre son interface, mais les données de gameplay et les règles restent dans `src/data` et `src/game`.

Cela permet d'ajouter la carte sans transformer `main.js` ou `index.html` en bloc monolithique. Les refactorisations doivent rester progressives : extraire un écran ou un composant à la fois, avec un build valide à chaque étape.

## 4. Principes d'architecture

Le code doit suivre une séparation claire :

- les données décrivent le jeu ;
- l'état représente la partie en cours ;
- les règles modifient l'état ;
- l'interface affiche l'état ;
- Phaser rend les scènes animées ;
- la localisation transforme les clés en texte visible.

Une règle importante :

> Aucune donnée de gameplay ne doit dépendre directement du DOM.

Exemple souhaité :

```js
export const actionDefinitions = {
  entaille: {
    nameKey: "action.entaille.name",
    icon: "⚔️",
    cost: 1,
    baseDamage: 4,
    powerScale: 1.2
  }
};
```

Exemple à éviter :

```js
button.innerHTML = "Entaille";
```

Le texte visible doit toujours venir d'une clé de traduction.

## 5. Données de gameplay

Les données doivent rester déclaratives et faciles à enrichir.

### Créatures

Les créatures sont définies dans des fichiers individuels sous `src/data/creatures/`.

Le fichier `src/data/creatures.js` sert de façade d'import stable pour le reste du prototype.

Une créature doit au minimum avoir :

- un `id` stable ;
- une clé de nom ;
- une clé de comportement ;
- des clés d'accessibilité pour son affichage ;
- des références d'assets quand les sprites seront généralisés.

Convention d'ID :

```js
braise_corne
rafalynx
```

Les IDs techniques restent en anglais ou en `snake_case`, indépendamment de la langue affichée.

Les caractéristiques de combat propres à une créature vivent dans sa définition :

- PV et PA de base ;
- puissance, défense, rapidité et stabilité ;
- chance de critique ;
- actions de créature ;
- coût, dégâts, garde et intention ;
- pattern de capture.

Exemple actuel : Braise-Corne possède `Griffe chaude`, `Cornes ardentes`, `Cendres serrées` et `Charge flamboyante`.

`scaling` n'appartient pas à la fiche d'espèce. Il est calculé en amont à partir de l'XP possédée par le joueur, avant que celui-ci rencontre une première créature. La rencontre reçoit cette valeur et l'injecte dans l'état de combat.

Objectif :

- pouvoir augmenter progressivement une créature sans modifier toutes ses actions ;
- éviter que chaque nouvelle créature invente sa propre logique de montée en puissance ;
- conserver `baseDamage`, `guard`, `power`, `defense` et `stability` comme valeurs lisibles de l'espèce.

Règle actuelle :

```js
encounterScaling = Math.floor(ownedXp / 5)
```

Exemple : `ownedXp: 10` donne `encounterScaling: 2`.

Le scaling augmente doucement les créatures :

- PV : +3 par point de scaling ;
- Puissance : +1 tous les 2 points de scaling ;
- Défense : +1 tous les 3 points de scaling ;
- Stabilité : +1 par point de scaling.

Le scaling n'ajoute plus directement des dégâts plats aux attaques. Les actions offensives peuvent toutefois définir `scalingScale`, qui augmente doucement leur `powerScale` effectif :

```js
effectivePowerScale = action.powerScale + scaling * action.scalingScale
```

Les actions défensives peuvent définir `scalingGuard`, qui augmente doucement leur garde :

```js
effectiveGuard = action.guard + scaling * action.scalingGuard
```

Les coefficients globaux du scaling vivent dans `combatFormulaConfig`.

### Rencontres

Les rencontres sont définies dans `src/data/encounters.js`.

Même si le prototype ne contient encore qu'une créature, la sélection passe déjà par un pool de rencontres. Cela évite de coder une créature en dur dans `main.js`.

Une rencontre doit pouvoir porter à terme :

- un `id` stable ;
- une référence de créature ;
- une référence d'objectifs ;
- une référence de récompenses ;
- un niveau ou contexte de zone ;
- une politique de challenge ;
- des modificateurs ponctuels.

Politique de challenge recommandée :

- une rencontre doit viser un niveau proche du héros ;
- l'écart standard accepté est de `-1` à `+1` niveau autour du joueur ;
- une rencontre peut être volontairement plus faible ou plus forte, mais cela doit être explicite dans ses données ;
- le joueur ne doit pas rencontrer une créature devenue totalement obsolète, par exemple niveau 3 contre héros niveau 34 ;
- si une ancienne zone reste accessible, elle doit proposer une version remise à niveau, une variante rare, ou une récompense réduite clairement assumée ;
- le scaling ne doit pas effacer la progression du joueur : un héros mieux préparé doit sentir qu'il maîtrise mieux le combat.

Structure actuelle :

```js
challenge: {
  targetLevel: 1,
  scalingMode: "match_player",
  allowedLevelDelta: 1
}
```

`scalingMode: "match_player"` signifie que la rencontre vise un challenge accessible et contemporain du niveau du joueur. Ce n'est pas un auto-scaling aveugle : les stats, patterns, objectifs et récompenses doivent rester cohérents avec l'espèce et la zone.

### Affixes

Les affixes appartiennent à des créatures individuelles capturées. En combat standard, ils sont actifs si la créature qui les porte est équipée.

En combat de capture, les créatures équipées sont retirées. Le joueur pourra toutefois préparer un affixe de chasse avant la capture. Cet affixe :

- provient d'une créature déjà capturée ;
- doit être choisi avant la révélation complète du briefing ;
- peut être actif pendant le combat de capture ;
- ne donne pas le type, les stats, l'effort ou les synergies de la créature ;
- ne contribue pas au bonus 12.

Chaque créature rencontrée reçoit un affixe propre au moment de la sélection de rencontre. Le tirage se fait selon le type de la créature :

```js
selectRandomAffixForType(creature.type)
```

Exemple : Braise-Corne est de type `feu`, donc il tire actuellement dans les affixes Feu comme `Étincelle critique` ou `Marque de braise`.

Le fichier d'affixes contient :

- un `id` stable ;
- une clé de nom ;
- une clé de description ;
- un niveau d'affixe, `level`, initialisé à `0` ;
- un type élémentaire ;
- une créature source ;
- une compétence cible ;
- un mode : `combat`, `capture` ou `mixte` ;
- un déclencheur ;
- un effet ;
- un impact radar indicatif.

Les affixes possèdent deux paliers d'évolution futurs. Leur progression pourra donc faire passer `level` de `0` à `1`, puis `2`.

Le prototype expose déjà un bouton `Affixe` dans le briefing. Il ouvre une liste déroulante des affixes possédés par le joueur, définis pour l'instant dans `baseProgression.ownedAffixIds`.

Les créatures capturées sont enregistrées séparément dans `baseProgression.capturedCreatures`. Une capture réussie avec 1 ou 2 objectifs ajoute bien la créature à l'équipe, mais sans instinct (`affixId: null`). À partir de 3 objectifs, la créature capturée porte aussi l'instinct gagné ; à 4 objectifs, l'instinct est obtenu à son palier supérieur.

Règles de sélection pour la chasse :

- un seul affixe peut être préparé ;
- quand un affixe est coché, les autres sont grisés et non sélectionnables ;
- décocher l'affixe préparé rend les autres à nouveau disponibles ;
- cette règle ne concerne que les combats de capture.

En combat normal, le joueur pourra équiper jusqu'à 3 créatures. Chaque créature équipée portera alors son propre affixe, sans passer par cette limite de préparation de chasse.

### Créatures équipées et stats héritées

En combat standard contre un humain, les créatures équipées servent à modifier le build du héros. Elles ne remplacent pas le héros dans l'arène.

Règles techniques :

- le joueur peut équiper jusqu'à 3 créatures ;
- une seule créature utilitaire peut être équipée dans ce groupe ;
- chaque créature équipée ajoute des statistiques héritées au radar ;
- chaque créature équipée expose son instinct ;
- le joueur choisit un seul instinct actif parmi les instincts des créatures équipées ;
- les instincts non choisis ne se déclenchent pas pendant le combat ;
- les PA évoluent hors radar et ne sont pas alimentés par les stats héritées classiques.
- les PA disponibles d'un adversaire humain sont définis dans sa fiche individuelle, pas dans son type générique, afin qu'un boss ou un duel spécial puisse changer d'économie d'action.
- deux créatures équipées du même type donnent un type dominant au build ;
- trois créatures de types différents donnent un build normal polyvalent ;
- une créature utilitaire ne crée pas de type dominant, mais ne l'empêche pas si les deux autres créatures partagent un type.

Radar de combat humain :

| ID | Rôle |
| --- | --- |
| `vitality` | Points de vie |
| `power` | Dégâts directs |
| `defense` | Garde, réduction et survie |
| `crit` | Burst et opportunités |
| `speed` | Priorité, précision et esquive |
| `perception` | Lecture de l'intention adverse |

La Perception ne doit pas donner directement plus de dégâts ou de défense contre un humain. Elle sert à révéler l'intention de l'adversaire selon des paliers.

Exemple de paliers :

| Perception | Lecture |
| ---: | --- |
| 1-2 | L'adversaire prépare une action. |
| 3-4 | L'adversaire prépare une attaque, une défense ou une technique. |
| 5-6 | L'adversaire prépare une action coûteuse ou tactique. |
| 7+ | L'action préparée peut être identifiée plus précisément. |

La contribution d'une créature doit être data-driven.

Les bonus de type vivent dans `src/data/creatureTypes.js` :

```js
feu: {
  inheritedStats: {
    power: 1,
    crit: 1
  }
}
```

Les bonus propres à chaque créature vivent dans sa fiche `src/data/creatures/*.js` :

```js
inheritedStats: {
  speciesBonus: {
    power: 1
  },
  levelBonuses: {
    2: { power: 1 },
    3: { crit: 1 }
  }
}
```

La formule cible est :

```text
stats finales =
stats de base du héros
+ progression permanente du joueur
+ stats héritées des créatures équipées
```

Le calcul doit rester séparé de l'affichage du radar. Le radar reçoit seulement les valeurs finales et, si nécessaire, une ventilation permettant d'afficher :

- base ;
- progression ;
- créatures équipées ;
- total.

Répartition de départ pour la verticale :

| Type | Stats héritées de type |
| --- | --- |
| Feu | +1 Puissance, +1 Critique |
| Eau | +1 Défense, +1 Perception |
| Vent | +1 Vitesse, +1 Critique |
| Utilitaire | +1 Défense, +1 Perception |

Certaines créatures peuvent aussi donner un bonus de Vitalité dans leurs bonus propres d'espèce ou de niveau. La Vitalité héritée suit la même règle data-driven que les autres stats héritées : elle vit dans `inheritedStats.speciesBonus` ou `inheritedStats.levelBonuses`, pas dans le composant de radar. Si une stat héritée dépasse le maximum du radar, l'excédent est perdu.

### Type dominant et noms d'actions

Le type dominant est calculé à partir des créatures équipées.

```js
buildAffinity: {
  type: "eau", // "feu", "eau", "vent" ou null
  strength: "majority", // "majority", "pure", "ultimate" ou "none"
  sourceCreatureIds: ["nacrelame", "onde_lente"]
}
```

Règles de calcul recommandées :

| Composition | `type` | `strength` |
| --- | --- | --- |
| 2 créatures du même type | type majoritaire | `majority` |
| 2 créatures du même type + 1 utilitaire | type majoritaire | `majority` |
| 3 créatures du même type | type commun | `pure` |
| 3 créatures du même type niveau III | type commun | `ultimate` |
| 3 types différents | `null` | `none` |

Le type dominant peut enrichir les noms d'actions du héros. La donnée d'action doit garder son `id` stable et son rôle de base ; seul le libellé actif change.

Exemple de structure :

```js
typedNameKeys: {
  feu: "action.entaille.fire",
  eau: "action.entaille.water",
  vent: "action.entaille.wind"
}
```

L'interface doit pouvoir afficher :

```text
Entaille liquide
Entaille - 1 PA
```

Le type dominant ne doit pas être codé dans les instincts. C'est une couche de build séparée.

### Avantage élémentaire

Le triangle de type est :

```text
eau > feu > vent > eau
```

La fonction de combat doit pouvoir déterminer si le build du héros domine le type adverse :

```js
const typeAdvantage = {
  eau: "feu",
  feu: "vent",
  vent: "eau"
};
```

Si `typeAdvantage[heroBuildAffinity.type] === enemy.type`, le héros obtient un bonus offensif.

Le bonus doit rester paramétrable :

```js
affinityBonus: {
  majority: { damageMultiplier: 1.1 },
  pure: { damageMultiplier: 1.2 },
  ultimate: { damageMultiplier: 1.45, critBonus: 10 }
}
```

Ces valeurs sont indicatives. Le bonus ultime correspond au cas rare où le joueur équipe 3 créatures du même type, toutes niveau III.

Un build sans type dominant ne reçoit pas de bonus d'avantage élémentaire, mais il reste plus polyvalent par ses statistiques héritées et son choix d'instinct actif.

### Actions

Les actions sont définies dans `src/data/actions.js`.

Une action doit décrire :

- sa clé de nom ;
- son icône ;
- son coût en PA ;
- son type ;
- ses valeurs de combat si elle inflige des dégâts, protège ou applique un effet ;
- à terme, sa portée, ses tags et ses effets avancés.

Les valeurs de base du héros vivent dans `src/data/actions.js`. Les formules qui interprètent ces valeurs vivent dans `src/game/combatFormulas.js`.

Exemples :

```js
baseDamage: 1
powerScale: 1.2
baseGuard: 14
defenseScale: 2
```

Actions de base pour la première verticale :

| ID | Nom FR | Coût | Rôle |
| --- | --- | ---: | --- |
| `entaille` | Entaille | 1 PA | attaque simple |
| `garde` | Garde | 1 PA | défense simple |
| `feinte` | Feinte | 2 PA | réponse à une intention adverse |
| `art` | Art | 2 PA | compétence tactique influencée par le build ou la préparation |
| `capture` | Capture | 1 PA | tentative de capture contre une créature |

Tags futurs possibles :

```text
attack
defense
shield
capture
interrupt
parry
fire
utility
```

### Héros

Le héros possède une fiche dédiée dans `src/data/hero/baseHero.js`.

Cette fiche décrit :

- son `id` ;
- son niveau de départ ;
- ses points de build disponibles au briefing ;
- ses statistiques de départ.

`src/data/stats.js` ne décrit pas le héros. Il décrit le système de statistiques utilisé par le radar : libellés, couleurs, minimums et maximums. `src/data/playerRadarStats.js` expose ensuite la configuration commune du radar joueur utilisée par les écrans du jeu.

Statistiques de départ actuelles :

| Stat | Valeur |
| --- | ---: |
| Vitalité | 40 |
| PA | 3 |
| Puissance | 5 |
| Défense | 2 |
| Critique | 5% |
| Vitesse | 1 |
| Perception | 1 |

### Objectifs de capture

Les objectifs sont définis dans `src/data/captureObjectives.js`.

Un objectif doit décrire :

- son `id` ;
- sa clé de texte ;
- sa récompense de progression de capture ;
- son éventuel seuil de Perception.

La Perception révèle des objectifs ou indices, mais elle ne doit pas être améliorée avec l'XP pendant le briefing.

## 6. Statistiques et radar

Les statistiques principales sont :

| ID | Nom FR | Rôle |
| --- | --- | --- |
| `vitality` | Vitalité | Points de vie |
| `pa` | PA | Économie d'action |
| `power` | Puissance | Dégâts à l'épée |
| `defense` | Défense | Mitigation, garde, parade |
| `crit` | Critique | Burst, interruption |
| `speed` | Vitesse | Priorité, précision, esquive |
| `perception` | Perception | Lecture de capture |

Les valeurs de départ du héros sont définies dans `src/data/hero/baseHero.js`.

Maximums actuels de capture :

| Stat | Maximum |
| --- | ---: |
| Vitalité | 60 |
| PA | 6 |
| Puissance | 20 |
| Défense | 14 |
| Critique | 45% |
| Vitesse | 22 |
| Perception | 7 |

Règles importantes :

- Le radar joueur complet est défini dans `src/data/playerRadarStats.js`.
- Les écrans qui affichent le build du joueur doivent utiliser cette configuration commune au lieu de créer une variante locale.
- PA est visible dans le radar, mais verrouillé pour l'attribution de gemmes du prototype.
- Perception est attribuable dans le radar joueur commun.
- Vitesse remplace l'ancienne Initiative. Elle détermine qui agit en premier et influence les chances de toucher.
- Les actions offensives utilisent une chance de toucher de base de 90%, modifiée de 2% par point d'écart de Vitesse, bornée entre 75% et 98%.
- Garde, Protection et Capture ne peuvent pas manquer.
- Perception peut progresser via le radar joueur commun, puis sera enrichie à terme par runes, objets de chasse, services ou créatures utilitaires.
- Le radar normalise chaque stat selon son propre maximum.
- Le radar doit rester lisible avant d'être spectaculaire.

Le composant `StatRadar` doit rester réutilisable. Il reçoit ses dépendances par constructeur : canvas, noeuds DOM, stats, build, fonction de traduction et callbacks.

À terme, le radar devrait être isolé de toute connaissance de la capture. Il doit seulement afficher et modifier un build selon une configuration.

## 7. Séquence de capture

La capture est une séquence séparée du combat standard.

État actuel :

1. Le joueur arrive au briefing.
2. Il lit les informations connues de la créature.
3. Il consulte les conditions de capture.
4. Il attribue de l'XP dans le radar.
5. Il lance le combat, même si toute l'XP n'est pas distribuée.
6. Le build courant est conservé pour créer le héros de combat.

Pendant une capture :

- les créatures équipées ne combattent pas directement ;
- les affixes de créatures équipées ne sont pas automatiquement actifs ;
- un affixe de chasse préparé pourra exister plus tard ;
- le héros reste au centre du combat ;
- la capture ne dépend pas uniquement des PV ennemis.

## 8. Combat

Le combat actuel est un duel au tour par tour.

État de combat :

- héros ;
- créature ennemie ;
- tour courant ;
- phase (`player`, `enemy`, `done`) ;
- jauge de capture ;
- objectifs accomplis ;
- fin de combat.

Le héros possède :

- PV ;
- garde ;
- PA ;
- puissance ;
- défense ;
- critique ;
- vitesse ;
- perception.

La créature possède :

- PV ;
- PA ;
- plan de tour ;
- état de charge ;
- attaque marquée.

Les règles de combat pures doivent rester dans `src/game/`.

Les comportements adverses génériques vivent dans `src/game/enemyAi.js`.
Ils ne doivent pas dépendre de Braise-Corne ou d'un type élémentaire précis. Une créature définit ses actions dans sa fiche, tandis que l'IA commune décide comment utiliser ces actions :

- jouer l'action prévue par le pattern ;
- chercher une action secondaire si la créature a encore assez de PA ;
- éviter les attaques marquées ou en charge comme simples actions de suivi ;
- parfois conserver ses PA après une action légère à 1 PA pour introduire du hasard ;
- permettre un réglage optionnel par profil via `combat.ai`.

Fonctions actuelles :

- `getEnemyAiConfig`
- `selectAffordableEnemyAction`
- `selectEnemyFollowUpAction`
- `shouldEnemyHoldAfterLightAction`
- `calculateHeroDamage`
- `calculateEnemyDamage`
- `calculateHeroGuard`
- `calculateHitChance`
- `calculateCaptureChance`
- `createHeroFromBuild`
- `createEnemyState`
- `createCombatState`
- `spendActionPoints`
- `applyCaptureProgress`
- `updateEnemyPlan`

Les coefficients temporaires d'équilibrage doivent être centralisés dans `combatFormulaConfig`, pas dispersés dans `main.js`.

À terme, les actions du joueur doivent quitter `src/main.js` pour devenir des handlers ou des effets réutilisables.

## 9. Phaser

Phaser est utilisé pour la scène de combat.

Responsabilités Phaser :

- afficher la scène ;
- gérer les sprites et animations ;
- jouer les feedbacks visuels ;
- représenter l'état de combat reçu depuis la logique.

Responsabilités hors Phaser :

- calculer les dégâts ;
- gérer les PA ;
- valider les objectifs ;
- gérer la capture ;
- traduire les textes ;
- gérer la sauvegarde.

Règle :

> Phaser affiche l'état. Il ne doit pas devenir la source de vérité du gameplay.

La scène actuelle `CaptureScene` devra être déplacée dans un fichier dédié, par exemple :

```text
src/scenes/CaptureScene.js
```

## 10. Interface mobile et responsive

Le jeu est pensé pour smartphone en paysage.

Principes actuels :

- le mode portrait est bloqué par un écran d'orientation ;
- le layout mobile paysage est géré par media query ;
- l'application est enveloppée dans `.app-fit` ;
- `updateViewportFit()` calcule une échelle pour faire tenir l'interface dans la fenêtre ;
- le fond global reste uni `#17171A`.

Invariants à préserver :

- aucun élément essentiel ne doit dépasser en paysage mobile ;
- les boutons doivent rester tactiles ;
- le radar doit rester lisible ;
- les modales doivent bloquer les clics hors bouton OK ;
- les textes ne doivent pas imposer de scroll en capture sur un écran cible.

Le responsive doit être testé au minimum sur :

```text
932 x 430
844 x 390
667 x 375
```

La version future en app installée ou PWA n'aura pas la barre du navigateur. Le prototype doit toutefois rester utilisable dans Safari pendant les tests.

### 10.1 Palette UI

La palette d'interface doit rester courte et stable. Les couleurs d'accent ne doivent pas être réinventées composant par composant.

Variables CSS de référence, définies dans `src/styles/base.css` :

```css
--ui-pink: #F2CBA4;
--ui-orange: #F7B04D;
--ui-gray: #B6B0A5;
--ui-blue: #C0CBDC;
--ui-enemy-red: #B51700;
```

Règles :

- tout élément orange de l'interface utilise `#F7B04D` ou `var(--ui-orange)` ;
- `--gold` reste un alias technique de `--ui-orange` pour les composants existants ;
- le gris de texte secondaire utilise `#B6B0A5` ou `var(--ui-gray)` ;
- le bleu `#C0CBDC` est réservé aux fonds d'encarts de lecture et aux blocs de jauges PV/Garde ;
- le rose `#F2CBA4` est réservé aux accents doux et aux variantes d'UI qui demandent moins d'intensité que l'orange ;
- le rouge `#B51700` est réservé aux noms d'ennemis dans les dialogues de map, quand il faut un signal plus lisible que l'orange ;
- les nouvelles couleurs doivent être ajoutées comme variables nommées avant d'être utilisées dans plusieurs fichiers CSS.

Exemples d'éléments concernés par `--ui-orange` :

- nom des créatures dans la phrase dynamique du briefing ;
- libellé `Objectifs de capture` et carrés remplis en version mobile ;
- ronds de PA affichés dans les boutons d'action ;
- jauge de progression des étoiles en fin de combat ;
- curseur de lecture du journal de combat ;
- accents de bordure ou d'ombre liés à une information importante.

## 11. Modales

Les modales servent à concentrer l'information sans alourdir l'écran principal.

Types actuels :

- modale de compétence du radar ;
- modale Comportement ;
- modale Récompenses ;
- modale Conditions de capture.

Règles :

- quand une modale est ouverte, le reste de l'interface ne doit pas être cliquable ;
- seul le bouton OK ferme la modale ;
- les textes doivent venir de clés de traduction ;
- les modales doivent rester lisibles sur mobile paysage.

## 12. Localisation

La localisation est obligatoire dès maintenant.

Règles :

- aucun texte visible ne doit être ajouté sans clé ;
- les phrases avec variables doivent être traduites comme phrases complètes ;
- ne pas concaténer des morceaux de phrases traduites ;
- les clés doivent rester stables ;
- le français reste la langue par défaut du prototype.

Bon exemple :

```js
t("encounter.intro.combat", { creature: creatureName })
```

Mauvais exemple :

```js
"Vous allez combattre " + creatureName + " !"
```

Le système actuel est dans `src/utils/i18n.js`.

Langues actuelles :

- `fr`
- `en`

Les prochaines étapes recommandées :

- conserver les dictionnaires hors de `src/main.js` ;
- enrichir `src/locales/fr.js` et `src/locales/en.js` ;
- ajouter une validation automatisée des clés au build.

## 13. Assets

Les assets doivent être rangés par type.

Structure recommandée :

```text
assets/
  creatures/
    braise-corne/
      idle.png
      attack.png
      hurt.png
      death.png
  ui/
  maps/
  audio/
```

Le prototype utilise actuellement :

```text
assets/creatures/[creature-id].png
```

Pour les sprites animés :

- utiliser des spritesheets de briefing normalisés en 6 frames de 128 x 128 px ;
- placer la créature au centre de chaque frame pour éviter les réglages spécifiques ;
- éviter de coder les tailles directement dans la scène ;
- documenter les dimensions de frame ;
- préférer des spritesheets propres à long terme.

## 14. Sauvegarde

La sauvegarde n'est pas encore implémentée, mais elle doit être anticipée.

Éléments à sauvegarder à terme :

- progression permanente du héros ;
- créatures capturées ;
- affixes individuels ;
- objectifs et indices déjà découverts ;
- flags de quêtes ;
- inventaire ;
- runes et préparation de chasse ;
- options de langue ;
- paramètres d'accessibilité.

Format recommandé pour le web :

- `localStorage` pour le prototype ;
- IndexedDB si les données deviennent volumineuses ;
- export/import JSON pour debug et tests.

La sauvegarde doit utiliser des IDs techniques stables, jamais des textes affichés.

## 15. Tests et vérification

Avant de considérer une modification comme terminée :

1. Lancer `npm run build`.
2. Tester le briefing.
3. Tester une attribution de stat dans le radar.
4. Tester une modale radar.
5. Tester les modales du briefing.
6. Lancer le combat.
7. Jouer au moins un tour complet.
8. Vérifier la console du navigateur.
9. Vérifier le layout mobile paysage.

Pour les changements de texte :

- vérifier le français ;
- vérifier que les clés anglaises existent ;
- tester si possible avec `?lang=en`.

Pour les changements responsive :

- tester bureau ;
- tester paysage mobile large ;
- tester paysage mobile compact ;
- vérifier les modales.

## 16. Conventions de code

Conventions générales :

- modules ES ;
- fonctions pures pour les règles ;
- données déclaratives ;
- IDs stables en anglais ou `snake_case` ;
- textes visibles via localisation ;
- aucun effet de gameplay caché dans les composants UI ;
- pas de dépendance DOM dans les modules `src/game/` et `src/data/`.

Nommage recommandé :

```text
createHeroFromBuild
createCombatState
applyCaptureProgress
captureObjectives
statDefinitions
```

Les composants UI peuvent manipuler le DOM, mais doivent recevoir leurs dépendances depuis l'extérieur.

## 17. Découpage cible

Découpage recommandé pour les prochains chantiers :

```text
src/
  app/
    bootstrap.js
    gameController.js
  combat/
    combatActions.js
    combatRules.js
    combatTypes.js
  capture/
    captureRules.js
    captureRewards.js
  data/
  locales/
  scenes/
    CaptureScene.js
  ui/
    StatRadar.js
    Modal.js
    BriefingView.js
    CombatHud.js
  utils/
```

Objectif :

- `main.js` ne doit garder que le démarrage de l'application ;
- les scènes Phaser doivent être autonomes ;
- les vues DOM doivent être séparées de la logique ;
- les données doivent pouvoir être enrichies sans toucher au moteur.

## 18. Feuille de route technique

Prochaines priorités recommandées :

1. Extraire `CaptureScene` dans `src/scenes/CaptureScene.js`.
2. Extraire les actions de combat dans `src/combat/combatActions.js`.
3. Créer un petit contrôleur de séquence briefing -> combat.
4. Créer un composant modal réutilisable.
5. Ajouter une validation simple des clés de traduction.
6. Ajouter un état de sauvegarde prototype.
7. Remplacer les emojis de combat par des sprites temporaires.
8. Préparer une première carte Tiled minimale.
9. Documenter le format des créatures capturées et des affixes.

## 19. Décisions à ne pas oublier

- Le héros reste le centre du combat.
- Les créatures définissent le build, elles ne remplacent pas le héros.
- En capture, les créatures équipées sont retirées.
- PA et Perception ne sont pas améliorés avec l'XP classique.
- La Perception sert à lire la chasse, pas à gonfler directement le combat.
- Le radar est un outil de compréhension du build.
- La capture doit enseigner la créature.
- Les rencontres doivent rester proches du niveau du joueur, sauf intention explicite.
- Les textes passent par des clés de localisation.
- Le mobile paysage est une contrainte de design, pas une adaptation secondaire.

## 20. App iOS de test

Une app iOS prototype existe dans `ios/Cascara/Cascara.xcodeproj`.

Objectif actuel :

- charger la version GitHub Pages du jeu dans un `WKWebView` ;
- profiter automatiquement des mises à jour web apres chaque deploiement GitHub Pages ;
- exposer quelques capacites natives utiles au prototype sans viser l'App Store.

URL chargee :

```text
https://nostick-games.github.io/cascara-prologue/
```

Pont natif injecte dans la page :

```js
await window.CascaraNative.save("autosave", saveState);
const saveState = await window.CascaraNative.load("autosave");
await window.CascaraNative.delete("autosave");
await window.CascaraNative.haptic("success");
await window.CascaraNative.log("message de debug");
```

Les sauvegardes natives sont stockees en JSON dans `Application Support/CascaraSaves`.

Build de verification :

```bash
xcodebuild -project ios/Cascara/Cascara.xcodeproj -scheme Cascara -configuration Debug -sdk iphonesimulator -derivedDataPath /tmp/cascara-ios-derived CODE_SIGNING_ALLOWED=NO build
```

## 21. Glossaire technique

| Terme | Sens |
| --- | --- |
| Build | Configuration actuelle du héros et de ses modificateurs |
| Radar | Visualisation normalisée des statistiques |
| Capture | Duel tactique permettant d'obtenir une créature |
| Objectif | Condition qui augmente la qualité ou les chances de capture |
| Affixe | Effet individuel porté par une créature capturée |
| Trace de chasse | Affixe préparé pour aider une capture sans équiper la créature |
| PA | Points d'action |
| Perception | Stat de lecture, préparation et révélation |
| Source de vérité | État de jeu faisant autorité pour le gameplay |
