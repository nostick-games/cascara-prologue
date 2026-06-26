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

// Objectifs visibles (⭐ simples + ⭐⭐ intermédiaires).
const visibleObjectives = [
  { id: "guardOnce", type: "guardOnce", labelKey: "objective.guard_once.label", reward: 18 },
  { id: "feintOnce", type: "feintOnce", labelKey: "objective.feint_once.label", reward: 20 },
  { id: "artOnce", type: "artOnce", labelKey: "objective.art_once.label", reward: 20 },
  { id: "sparePa", type: "sparePa", labelKey: "objective.spare_pa.label", reward: 20 },
  { id: "captureBeforeTurn3", family: "tempo", type: "captureBeforeTurn", turn: 3, labelKey: "objective.capture_before_turn_3.label", reward: 24 },
  { id: "survive5", family: "tempo", type: "surviveTurns", turns: 5, labelKey: "objective.survive_5.label", reward: 24 },
  { id: "criticalBeforeCapture", type: "criticalBeforeCapture", labelKey: "objective.critical_before_capture.label", reward: 24 },
  { id: "guardBlock6", type: "guardDamageBlocked", damage: 6, labelKey: "objective.guard_block_6.label", reward: 24 },
  { id: "threeDistinctActions", type: "distinctActions", count: 3, labelKey: "objective.three_distinct_actions.label", reward: 22 }
];

// Objectifs avancés (⭐⭐⭐), cachés tant que la Perception du joueur < celle du fawna.
const hiddenObjectives = [
  { id: "interrupt", type: "interruptSpecial", labelKey: "objective.interrupt.label", reward: 28, hiddenUntilPerception: true },
  { id: "parry", type: "parryCritical", labelKey: "objective.parry.label", reward: 28, hiddenUntilPerception: true },
  { id: "captureWithOnePa", type: "captureWithOnePa", labelKey: "objective.capture_with_one_pa.label", reward: 28, hiddenUntilPerception: true },
  { id: "captureAboveHalfHp", type: "captureAboveHp", threshold: 0.5, labelKey: "objective.capture_above_half_hp.label", reward: 28, hiddenUntilPerception: true },
  { id: "captureWithoutEntaille", type: "captureWithoutAction", actionId: "entaille", labelKey: "objective.capture_without_entaille.label", reward: 28, hiddenUntilPerception: true }
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
    shuffle(visibleObjectives, random),
    Math.max(0, visibleSlots)
  ));

  if (hiddenSlot) {
    objectives.push(shuffle(hiddenObjectives, random)[0]);
  }

  return objectives;
}

export const captureObjectives = selectCaptureObjectives();
