import { clamp } from "./combatState.js";

export const combatFormulaConfig = {
  heroCriticalMultiplier: 1.55,
  enemyCriticalMultiplier: 1.45,
  enemyDefenseReduction: 0.7,
  heroDefenseReduction: 0.55,
  heroGuardBase: 0,
  heroGuardDefenseScale: 1,
  enemyHpScaling: 3,
  enemyPowerScalingEvery: 2,
  enemyDefenseScalingEvery: 2,
  enemyDefensePerHeroPower: 0.5,
  enemyHeroPowerDefenseCap: 6,
  enemyDamageScaling: 0,
  enemyGuardScaling: 0,
  enemyStabilityScaling: 1,
  captureProgressDamageScale: 0.28,
  captureProgressCriticalBonus: 8,
  captureFailureProgressBase: 10,
  earlyCaptureMinimumChance: 5,
  captureObjectiveBonus: 4,
  capturePerfectMasteryBonus: 12,
  captureStabilityPenaltyScale: 4,
  hitBaseChance: 90,
  hitSpeedPointScale: 2,
  hitMinChance: 75,
  hitMaxChance: 98
};

export function rollChance(chance, random = Math.random) {
  return random() < chance;
}

export function calculateHitChance({ attackerSpeed, targetSpeed }) {
  const config = combatFormulaConfig;
  const speedGap = attackerSpeed - targetSpeed;
  return clamp(
    config.hitBaseChance + speedGap * config.hitSpeedPointScale,
    config.hitMinChance,
    config.hitMaxChance
  );
}

export function calculateHeroDamageBreakdown({ hero, enemy, baseDamage, powerScale, critical }) {
  const config = combatFormulaConfig;
  const rawDamage = baseDamage + hero.power * powerScale;
  const criticalDamage = critical ? rawDamage * config.heroCriticalMultiplier : rawDamage;
  const mitigatedDamage = criticalDamage - enemy.defense * config.enemyDefenseReduction;
  const damage = Math.max(1, Math.round(mitigatedDamage));

  return {
    damage,
    power: Math.max(1, Math.round(criticalDamage)),
    defenseReduction: Math.max(0, Math.round(criticalDamage) - damage)
  };
}

export function calculateHeroDamage(options) {
  return calculateHeroDamageBreakdown(options).damage;
}

export function calculateEnemyDamageBreakdown({ enemy, hero, action, critical }) {
  const config = combatFormulaConfig;
  const powerScale = (action.powerScale ?? 1)
    + enemy.scaling * (action.scalingScale ?? 0);
  const rawDamage = (action.baseDamage ?? 1)
    + enemy.power * powerScale
    + enemy.scaling * config.enemyDamageScaling;
  const criticalDamage = critical ? rawDamage * config.enemyCriticalMultiplier : rawDamage;
  const mitigatedDamage = criticalDamage - hero.defense * config.heroDefenseReduction;
  const damage = Math.max(1, Math.round(mitigatedDamage));

  return {
    damage,
    power: Math.max(1, Math.round(criticalDamage)),
    defenseReduction: Math.max(0, Math.round(criticalDamage) - damage)
  };
}

export function calculateEnemyDamage(options) {
  return calculateEnemyDamageBreakdown(options).damage;
}

export function calculateEnemyGuard({ enemy, action }) {
  const config = combatFormulaConfig;
  return Math.round((action.guard ?? 0)
    + enemy.scaling * ((action.scalingGuard ?? 0) + config.enemyGuardScaling));
}

export function calculateHeroGuard({ hero, action }) {
  const config = combatFormulaConfig;
  const baseGuard = action.baseGuard ?? config.heroGuardBase;
  const defenseScale = action.defenseScale ?? config.heroGuardDefenseScale;

  return Math.round(baseGuard + hero.defense * defenseScale);
}

export function absorbGuard(target, incomingDamage) {
  const blocked = Math.min(target.guard, incomingDamage);
  target.guard -= blocked;

  return {
    blocked,
    damage: incomingDamage - blocked
  };
}

export function calculateCaptureProgressFromDamage({ damage, critical }) {
  const config = combatFormulaConfig;
  return Math.ceil(damage * config.captureProgressDamageScale)
    + (critical ? config.captureProgressCriticalBonus : 0);
}

export function countCompletedObjectives(objectives) {
  return Object.values(objectives).filter(Boolean).length;
}

export function calculateCaptureChance({ combat, perception, stabilityReduction = 0 }) {
  const config = combatFormulaConfig;
  const completedObjectives = countCompletedObjectives(combat.objectives);
  const scaledStability = Math.max(
    0,
    combat.enemy.stability + combat.enemy.scaling * config.enemyStabilityScaling - stabilityReduction
  );
  const stabilityPenalty = completedObjectives >= 3
    ? 0
    : scaledStability * config.captureStabilityPenaltyScale;
  const masteryBonus = completedObjectives >= 4 ? config.capturePerfectMasteryBonus : 0;
  const objectiveBonus = completedObjectives * config.captureObjectiveBonus;

  return Math.max(
    config.earlyCaptureMinimumChance,
    combat.capture + objectiveBonus + masteryBonus + perception * 2 - stabilityPenalty
  );
}

export function calculateFailedCaptureProgress(perception) {
  return combatFormulaConfig.captureFailureProgressBase + perception;
}

export function applyHitPoints(target, damage) {
  target.hp = clamp(target.hp - damage, 0, target.maxHp);
}
