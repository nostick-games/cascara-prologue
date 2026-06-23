import { humanEnemyTypeProfile } from "../humanEnemyTypes.js";
import { aragor } from "./aragor.js";
import { chad } from "./chad.js";
import { ilda } from "./ilda.js";
import { orve } from "./orve.js";
import { ranbu } from "./ranbu.js";
import { createHumanCombatProfile } from "./humanArsenal.js";
import { dominantHumanBuildType, humanBuildTypeProfile } from "./humanBuildTypes.js";
import { computeEquippedCreatureStats } from "./inheritedStats.js";

const humanStatIds = ["maxHp", "maxPa", "power", "defense", "crit", "speed", "perception"];

function mergeAdditiveStats(...statSources) {
  const merged = Object.fromEntries(
    humanStatIds.map((statId) => [
      statId,
      statSources.reduce((sum, source = {}) => sum + (source[statId] ?? 0), 0)
    ])
  );
  merged.maxHp += statSources.reduce((sum, source = {}) => sum + (source.vitality ?? 0), 0);
  return merged;
}

const counterTypeByPlayerType = {
  feu: "eau",
  eau: "vent",
  vent: "feu"
};
const creatureIdsByType = {
  feu: ["braise_corne", "flamillon"],
  eau: ["nacrelame", "onde_lente"],
  vent: ["zephyr", "plumevif"],
  utilitaire: ["loopio", "sillage"]
};
const fallbackTrainingCreatureIds = [
  "braise_corne",
  "nacrelame",
  "zephyr",
  "flamillon",
  "onde_lente",
  "plumevif",
  "loopio",
  "sillage"
];

function withTypeProfile(enemy) {
  const typeProfile = humanEnemyTypeProfile(enemy.type);
  const inheritedStats = computeEquippedCreatureStats(enemy.equippedCreatures);
  const buildTypeProfile = enemy.forcedBuildTypeProfile ?? dominantHumanBuildType(inheritedStats.sources);

  return {
    ...enemy,
    typeProfile,
    buildTypeProfile,
    combat: {
      ...createHumanCombatProfile(enemy, { buildTypeProfile }),
      inheritedStats,
      stats: {
        ...mergeAdditiveStats(
          typeProfile?.stats,
          enemy.stats,
          inheritedStats.total,
          buildTypeProfile?.statBonus
        ),
        ...(enemy.finalStats ?? {})
      }
    }
  };
}

function combatStatsFromPlayerBuild(playerBaseBuild = {}, playerBuild = {}, { speedBonus = 0 } = {}) {
  return {
    maxHp: playerBaseBuild.vitality ?? 5,
    maxPa: playerBaseBuild.pa ?? 3,
    power: playerBaseBuild.power ?? 2,
    defense: playerBaseBuild.defense ?? 2,
    crit: playerBaseBuild.crit ?? 3,
    speed: (playerBuild.speed ?? playerBaseBuild.speed ?? 3) + speedBonus,
    perception: playerBaseBuild.perception ?? 4
  };
}

function selectedTrainingCreatureIds({ desiredType, selectedCreatureIds, count }) {
  const selected = new Set(selectedCreatureIds);
  const preferred = desiredType ? (creatureIdsByType[desiredType] ?? []) : [];
  const pool = [...preferred, ...fallbackTrainingCreatureIds]
    .filter((creatureId, index, list) => list.indexOf(creatureId) === index)
    .filter((creatureId) => !selected.has(creatureId));

  return pool.slice(0, count);
}

export function createAdaptiveTrainingHumanEnemy(enemy, {
  playerBaseBuild = {},
  playerBuild = {},
  playerBuildType = null,
  playerTeam = []
} = {}) {
  if (!enemy?.training?.adaptiveTeam) return enemy;
  const selectedCreatureIds = playerTeam.map((entry) => entry.creatureId).filter(Boolean);
  const teamSize = Math.min(3, selectedCreatureIds.length);
  const counterType = counterTypeByPlayerType[playerBuildType] ?? null;
  const preferredType = counterType ?? playerTeam[0]?.type ?? null;
  const equippedCreatures = selectedTrainingCreatureIds({
    desiredType: preferredType,
    selectedCreatureIds,
    count: teamSize
  }).map((creatureId) => ({ creatureId, level: 1 }));
  const buildTypeProfile = counterType ? humanBuildTypeProfile(counterType, 1) : null;

  return withTypeProfile({
    ...enemy,
    equippedCreatures,
    finalStats: combatStatsFromPlayerBuild(playerBaseBuild, playerBuild, {
      speedBonus: enemy.training?.initiativeSpeedBonus ?? 0
    }),
    forcedBuildTypeProfile: buildTypeProfile
  });
}

export const humanEnemies = {
  aragor: withTypeProfile(aragor),
  chad: withTypeProfile(chad),
  ilda: withTypeProfile(ilda),
  orve: withTypeProfile(orve),
  ranbu: withTypeProfile(ranbu)
};

export const defaultHumanEnemy = humanEnemies.aragor;
