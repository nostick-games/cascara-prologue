import { applyEnemyScalingToStats } from "./enemyScaling.js";

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createHeroFromBuild(build) {
  return {
    maxHp: build.vitality,
    hp: build.vitality,
    guard: 0,
    maxPa: build.pa,
    pa: build.pa,
    power: build.power,
    defense: build.defense,
    critChance: build.crit / 100,
    speed: build.speed,
    perception: build.perception,
    type: build.type ?? null,
    statuses: {},
    guarding: false,
    feintReduction: null,
    parriedBurningHorns: false,
    nextPaPenalty: 0
  };
}

export function createEnemyState({ name, type, combatProfile, scaling = 0, scalingConfig = {} }) {
  const stats = {
    ...(combatProfile?.typeProfile?.stats ?? {}),
    ...(combatProfile?.stats ?? {})
  };
  const scaledStats = applyEnemyScalingToStats(stats, scaling, scalingConfig);
  const maxHp = scaledStats.maxHp;
  const maxPa = scaledStats.maxPa ?? 3;
  const firstActionId = combatProfile?.pattern?.[0] ?? "hotClaw";
  const firstAction = combatProfile?.actions?.[firstActionId] ?? null;

  return {
    name,
    type: combatProfile?.dominantType ?? type,
    level: scaledStats.level ?? 1,
    maxHp,
    hp: maxHp,
    maxPa,
    pa: maxPa,
    guard: 0,
    statuses: {},
    power: scaledStats.power,
    defense: scaledStats.defense,
    speed: scaledStats.speed ?? 0,
    perception: scaledStats.perception ?? 0,
    critChance: scaledStats.critChance ?? ((scaledStats.crit ?? 0) / 100),
    typeStatusChanceOverride: scaledStats.typeStatusChanceOverride,
    stability: scaledStats.stability ?? 0,
    scaling,
    combatProfile,
    patternIndex: 0,
    currentAction: firstAction,
    charging: false,
    markedAttack: firstAction?.marked ?? false,
    turnPlan: firstActionId
  };
}

export function createCombatState({ hero, enemy, build, objectives }) {
  return {
    hero,
    enemy,
    build,
    turn: 1,
    phase: "player",
    capture: Math.min(18, build.perception * 3),
    objectives: Object.fromEntries(objectives.map((objective) => [objective.id, false])),
    ended: false
  };
}

export function applyExclusiveStatus(target, statusId, statusState) {
  target.statuses = {
    [statusId]: statusState
  };
  if (statusId !== "paralysie" && "blockedActionId" in target) {
    target.blockedActionId = null;
  }
}

export function spendActionPoints(hero, cost) {
  if (hero.pa < cost) return false;
  hero.pa -= cost;
  return true;
}

export function applyCaptureProgress(combat, amount) {
  combat.capture = clamp(combat.capture + amount, 0, 100);
}

export function updateEnemyPlan(combat) {
  const enemy = combat.enemy;
  const pattern = enemy.combatProfile?.pattern ?? [];
  const actions = enemy.combatProfile?.actions ?? {};
  const actionId = pattern[enemy.patternIndex % pattern.length];
  const action = actions[actionId];

  enemy.currentAction = action;
  enemy.turnPlan = actionId;
  enemy.charging = action?.charging ?? false;
  enemy.markedAttack = action?.marked ?? false;
  enemy.patternIndex += 1;

  return enemy.turnPlan;
}
