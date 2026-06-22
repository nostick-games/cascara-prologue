import { getAffixesByIds } from "../data/affixes.js";
import { selectCaptureObjectives } from "../data/captureObjectives.js";
import { encounterIntroKeys } from "../data/creatures.js";
import { selectRandomCaptureEncounter } from "../data/encounters.js";
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
