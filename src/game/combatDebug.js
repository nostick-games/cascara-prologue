export class CombatDebug {
  constructor({ getCombat }) {
    this.getCombat = getCombat;
    this.step = 0;
  }

  reset() {
    this.step = 0;
  }

  log(event, details = {}) {
    const combat = this.getCombat();
    if (!combat) return;
    this.step += 1;
    console.debug("[Combat]", {
      step: this.step,
      event,
      turn: combat.turn,
      phase: combat.phase,
      hero: {
        hp: combat.hero.hp,
        maxHp: combat.hero.maxHp,
        pa: combat.hero.pa,
        maxPa: combat.hero.maxPa,
        guard: combat.hero.guard,
        power: combat.hero.power,
        defense: combat.hero.defense,
        speed: combat.hero.speed,
        perception: combat.hero.perception,
        critChance: combat.hero.critChance,
        feintReduction: combat.hero.feintReduction
      },
      enemy: {
        name: combat.enemy.name,
        hp: combat.enemy.hp,
        maxHp: combat.enemy.maxHp,
        pa: combat.enemy.pa,
        maxPa: combat.enemy.maxPa,
        guard: combat.enemy.guard,
        power: combat.enemy.power,
        defense: combat.enemy.defense,
        speed: combat.enemy.speed,
        perception: combat.enemy.perception,
        critChance: combat.enemy.critChance,
        stability: combat.enemy.stability,
        scaling: combat.enemy.scaling,
        turnPlan: combat.enemy.turnPlan,
        charging: combat.enemy.charging
      },
      capture: combat.capture,
      objectives: { ...combat.objectives },
      details
    });
  }
}
