import { applyHumanBuildTypeToAction } from "./humanBuildTypes.js";

export const standardHumanActions = {
  entaille: {
    id: "entaille",
    nameKey: "action.entaille.name",
    cost: 1,
    baseDamage: 1,
    powerScale: 0.75,
    feintable: true,
    kind: "simple"
  },
  garde: {
    id: "garde",
    nameKey: "action.garde.name",
    cost: 1,
    guard: 3,
    defenseScale: 0.65,
    kind: "protection"
  },
  feinte: {
    id: "feinte",
    nameKey: "action.feinte.name",
    cost: 2,
    baseDamage: 1,
    powerScale: 1.05,
    feintable: true,
    kind: "strong"
  },
  art: {
    id: "art",
    nameKey: "action.art.name",
    cost: 3,
    baseDamage: 2,
    powerScale: 1.25,
    marked: true,
    feintable: true,
    kind: "art"
  }
};

export const standardHumanPattern = ["entaille", "garde", "feinte", "art"];
export const standardHumanFollowUps = ["entaille", "garde"];

export function createHumanCombatProfile(enemy, { buildTypeProfile = null } = {}) {
  const baseActionIds = enemy.arsenal?.baseActionIds ?? Object.keys(standardHumanActions);
  const overrides = enemy.arsenal?.overrides ?? {};
  const disabledActionIds = new Set(enemy.arsenal?.disabledActionIds ?? []);
  const extraActions = enemy.arsenal?.extraActions ?? {};
  const actions = Object.fromEntries(
    [
      ...baseActionIds.map((actionId) => [actionId, standardHumanActions[actionId]]),
      ...Object.entries(extraActions)
    ]
      .filter(([actionId]) => !disabledActionIds.has(actionId))
      .filter(([, action]) => Boolean(action))
      .map(([actionId, action]) => [
        actionId,
        {
          ...action,
          ...(overrides[actionId] ?? {})
        }
      ])
      .map(([actionId, action]) => [
        actionId,
        applyHumanBuildTypeToAction(action, buildTypeProfile)
      ])
  );

  return {
    actions,
    dominantType: buildTypeProfile?.id ?? null,
    pattern: enemy.arsenal?.pattern ?? standardHumanPattern.filter((actionId) => actions[actionId]),
    ai: {
      followUpActionIds: enemy.arsenal?.followUpActionIds
        ?? standardHumanFollowUps.filter((actionId) => actions[actionId]),
      singleLightActionChance: enemy.arsenal?.singleLightActionChance ?? 0.35
    }
  };
}
