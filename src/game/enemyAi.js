export const defaultEnemyAiConfig = {
  actionDelayMs: 1120,
  singleLightActionChance: 0.35
};

export function getEnemyAiConfig(enemy) {
  return {
    ...defaultEnemyAiConfig,
    ...(enemy.combatProfile?.ai ?? {})
  };
}

export function selectAffordableEnemyAction(enemy) {
  if (enemy.currentAction && (enemy.currentAction.cost ?? 0) <= enemy.pa) {
    return enemy.currentAction;
  }

  return selectEnemyFollowUpAction(enemy);
}

export function selectEnemyFollowUpAction(enemy) {
  const actionsById = enemy.combatProfile?.actions ?? {};
  const followUpActionIds = enemy.combatProfile?.ai?.followUpActionIds ?? [];
  const actions = followUpActionIds.length
    ? followUpActionIds.map((actionId) => actionsById[actionId]).filter(Boolean)
    : Object.values(actionsById);

  return actions
    .filter((action) => {
      const cost = action.cost ?? 0;
      return cost > 0 && cost <= enemy.pa && !action.marked && !action.charging;
    })
    .sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0))[0] ?? null;
}

export function shouldEnemyHoldAfterLightAction({ enemy, previousAction, random = Math.random }) {
  if ((previousAction?.cost ?? 0) !== 1) return false;
  const { singleLightActionChance } = getEnemyAiConfig(enemy);
  return random() < singleLightActionChance;
}
