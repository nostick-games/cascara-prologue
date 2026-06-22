export function applyEnemyScalingToStats(stats = {}, scaling = 0, scalingConfig = {}) {
  const hpScaling = stats.hpScaling ?? scalingConfig.enemyHpScaling ?? 0;
  const powerScalingEvery = scalingConfig.enemyPowerScalingEvery ?? Number.POSITIVE_INFINITY;
  const defenseScalingEvery = scalingConfig.enemyDefenseScalingEvery ?? Number.POSITIVE_INFINITY;
  const investedHeroPower = Math.max(
    0,
    (scalingConfig.heroPower ?? scalingConfig.baseHeroPower ?? 0) - (scalingConfig.baseHeroPower ?? 0)
  );
  const heroPowerDefenseBonus = Math.min(
    scalingConfig.enemyHeroPowerDefenseCap ?? Number.POSITIVE_INFINITY,
    Math.floor(investedHeroPower * (scalingConfig.enemyDefensePerHeroPower ?? 0))
  );

  return {
    ...stats,
    maxHp: (stats.maxHp ?? 24) + scaling * hpScaling,
    power: (stats.power ?? 1) + Math.floor(scaling / powerScalingEvery),
    defense: (stats.defense ?? 0) + Math.floor(scaling / defenseScalingEvery) + heroPowerDefenseBonus
  };
}
