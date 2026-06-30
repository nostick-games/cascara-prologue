import { getAffixesByIds, selectRandomAffixForType } from "../data/affixes.js";
import { selectCaptureObjectives } from "../data/captureObjectives.js";
import { creatures, encounterIntroKeys } from "../data/creatures.js";
import { captureEncounterPool, selectRandomCaptureEncounter } from "../data/encounters.js";
import { tutorialObjectives } from "../data/tutorialObjectives.js";
import { createHumanEncounter, selectHumanEncounterIntroKey } from "../data/humanEncounters.js";
import { worldMapPerceptionBonus } from "../game/mapProgression.js";
import { calculateEncounterScalingFromXp } from "../game/scaling.js";

export function createCaptureEncounterState({
  progression,
  defaultCompletedHunts = 0,
  mapEncounterZone = null,
  levelRange = null
}) {
  const encounter = selectRandomCaptureEncounter({
    encounterScaling: calculateEncounterScalingFromXp(progression.availableXp),
    mapEncounterZone,
    levelRange,
    perceptionBonus: worldMapPerceptionBonus(progression)
  });

  return {
    encounter,
    creature: encounter.creature,
    encounterAffix: encounter.affix,
    ownedHuntAffixes: getAffixesByIds(progression.ownedAffixIds),
    encounterIntroKey: encounterIntroKeys[Math.floor(Math.random() * encounterIntroKeys.length)],
    objectives: selectCaptureObjectives({
      huntNumber: (progression.captureHuntsCompleted ?? defaultCompletedHunts) + 1
    })
  };
}

export function createTutorialCaptureEncounterState({ progression, maxInstinctNumber } = {}) {
  const encounterDef = captureEncounterPool.find((e) => e.id === "capture_flamillon");
  const baseCreature = creatures["flamillon"];
  const creature = {
    ...baseCreature,
    combat: {
      ...baseCreature.combat,
      stats: { ...(baseCreature.combat?.stats ?? {}), level: 1, perception: 20 }
    }
  };
  const affix = selectRandomAffixForType(creature.type, { maxNumber: maxInstinctNumber });
  const encounter = { ...encounterDef, scaling: 0, affix, creature };

  return {
    encounter,
    creature,
    encounterAffix: affix,
    ownedHuntAffixes: getAffixesByIds(progression.ownedAffixIds),
    encounterIntroKey: "encounter.intro.tuto_flamillon",
    objectives: tutorialObjectives
  };
}

export function createHumanEncounterState({ progression, enemyId = null }) {
  const encounter = createHumanEncounter({
    enemyId,
    encounterScaling: calculateEncounterScalingFromXp(progression.availableXp)
  });

  return {
    encounter,
    enemy: encounter.enemy,
    encounterIntroKey: selectHumanEncounterIntroKey()
  };
}
