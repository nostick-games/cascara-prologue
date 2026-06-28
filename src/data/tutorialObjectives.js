export const tutorialObjectives = [
  {
    id: "tuto_hp25",
    type: "enemyHpThreshold",
    threshold: 0.25,
    labelKey: "objective.tuto_hp25.label",
    reward: 25,
    availability: "always"
  },
  {
    id: "tuto_guard",
    type: "guardOnce",
    labelKey: "objective.tuto_guard.label",
    reward: 18
  },
  {
    id: "tuto_survive4",
    type: "surviveTurns",
    turns: 4,
    labelKey: "objective.tuto_survive4.label",
    reward: 20
  },
  {
    id: "tuto_hidden",
    type: "artOnce",
    labelKey: "objective.tuto_hidden.label",
    reward: 28,
    hiddenUntilPerception: true
  }
];
