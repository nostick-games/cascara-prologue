const mandatoryPressureObjectives = [
  {
    id: "enemyHpUnder25",
    type: "enemyHpThreshold",
    threshold: 0.25,
    labelKey: "objective.enemy_hp_under_25.label",
    reward: 25,
    availability: "always"
  },
  {
    id: "enemyHpUnder10",
    type: "enemyHpThreshold",
    threshold: 0.1,
    labelKey: "objective.enemy_hp_under_10.label",
    reward: 30,
    availability: "after15"
  }
];

const visibleEasyObjectives = [
  { id: "survive3", family: "surviveTurns", type: "surviveTurns", turns: 3, labelKey: "objective.survive_3.label", reward: 18 },
  { id: "survive4", family: "surviveTurns", type: "surviveTurns", turns: 4, labelKey: "objective.survive_4.label", reward: 24 },
  { id: "sparePa", type: "sparePa", labelKey: "objective.spare_pa.label", reward: 20 },
  { id: "guardOnce", type: "guardOnce", labelKey: "objective.guard_once.label", reward: 18 },
  { id: "feintOnce", type: "feintOnce", labelKey: "objective.feint_once.label", reward: 20 },
  { id: "artOnce", type: "artOnce", labelKey: "objective.art_once.label", reward: 20 },
  { id: "captureBeforeTurn4", type: "captureBeforeTurn", turn: 4, labelKey: "objective.capture_before_turn_4.label", reward: 20 },
  { id: "entailleTwice", type: "useAction", actionId: "entaille", count: 2, labelKey: "objective.entaille_twice.label", reward: 20 }
];

const hiddenObjectives = [
  {
    id: "feintSpecial",
    type: "feintSpecial",
    labelKey: "objective.feint_special.label",
    reward: 25,
    hiddenUntilPerception: 4
  },
  {
    id: "captureWithOnePa",
    type: "captureWithOnePa",
    labelKey: "objective.capture_with_one_pa.label",
    reward: 25,
    hiddenUntilPerception: 4
  },
  {
    id: "preventSpecial",
    type: "preventSpecial",
    labelKey: "objective.prevent_special.label",
    reward: 25,
    hiddenUntilPerception: 4
  },
  {
    id: "criticalBeforeCapture",
    type: "criticalBeforeCapture",
    labelKey: "objective.critical_before_capture.label",
    reward: 25,
    hiddenUntilPerception: 4
  },
  {
    id: "parry",
    type: "parryCritical",
    labelKey: "objective.parry.label",
    reward: 25,
    hiddenUntilPerception: 4
  }
];

function shuffle(items, random) {
  return [...items].sort(() => random() - 0.5);
}

function objectiveCountForHunt(huntNumber) {
  return Math.min(4, Math.max(1, huntNumber));
}

function pressureObjectiveForHunt(huntNumber, random) {
  const canUseRiskyVariant = huntNumber > 15 && random() < 0.35;
  return canUseRiskyVariant ? mandatoryPressureObjectives[1] : mandatoryPressureObjectives[0];
}

function takeUniqueObjectiveFamilies(candidates, count) {
  const selected = [];
  const usedFamilies = new Set();

  candidates.forEach((objective) => {
    if (selected.length >= count) return;
    const family = objective.family ?? objective.id;
    if (usedFamilies.has(family)) return;
    selected.push(objective);
    usedFamilies.add(family);
  });

  return selected;
}

export function selectCaptureObjectives({ huntNumber = 4, random = Math.random } = {}) {
  const objectiveCount = objectiveCountForHunt(huntNumber);
  const objectives = [pressureObjectiveForHunt(huntNumber, random)];

  const hiddenSlot = objectiveCount >= 4;
  const visibleSlots = objectiveCount - objectives.length - (hiddenSlot ? 1 : 0);
  objectives.push(...takeUniqueObjectiveFamilies(
    shuffle(visibleEasyObjectives, random),
    Math.max(0, visibleSlots)
  ));

  if (hiddenSlot) {
    objectives.push(shuffle(hiddenObjectives, random)[0]);
  }

  return objectives;
}

export const captureObjectives = selectCaptureObjectives();
