import { createAdaptiveTrainingHumanEnemy, defaultHumanEnemy, humanEnemies } from "./humanEnemies/index.js";
import { combatFormulaConfig } from "../game/combatFormulas.js";
import { applyEnemyScalingToStats } from "../game/enemyScaling.js";

export const humanEncounterIntroKeys = [
  "human_encounter.intro.fight",
  "human_encounter.intro.challenge",
  "human_encounter.intro.ready"
];

export function selectHumanEncounterIntroKey({ random = Math.random } = {}) {
  return humanEncounterIntroKeys[Math.floor(random() * humanEncounterIntroKeys.length)];
}

function withEncounterScaling(enemy, scaling) {
  return {
    ...enemy,
    combat: {
      ...enemy.combat,
      baseStats: enemy.combat.stats,
      scaling,
      scaledStats: applyEnemyScalingToStats(enemy.combat.stats, scaling, combatFormulaConfig)
    }
  };
}

export function createHumanEncounter({ enemyId = defaultHumanEnemy.id, encounterScaling = 0 } = {}) {
  const enemy = humanEnemies[enemyId] ?? defaultHumanEnemy;
  return {
    id: `human_${enemy.id}`,
    scaling: encounterScaling,
    enemy: withEncounterScaling(enemy, encounterScaling)
  };
}

export function createAdaptiveHumanEncounterEnemy({
  enemy,
  encounterScaling = 0,
  playerBaseBuild = {},
  playerBuild = {},
  playerBuildType = null,
  playerTeam = []
} = {}) {
  return withEncounterScaling(createAdaptiveTrainingHumanEnemy(enemy, {
    playerBaseBuild,
    playerBuild,
    playerBuildType,
    playerTeam
  }), encounterScaling);
}

export function createDefaultHumanEncounter({ encounterScaling = 0 } = {}) {
  return createHumanEncounter({ enemyId: defaultHumanEnemy.id, encounterScaling });
}
