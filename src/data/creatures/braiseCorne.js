export const braiseCorne = {
  id: "braise_corne",
  type: "feu",
  nameKey: "creature.braise_corne.name",
  stageLabelKey: "creature.braise_corne.stage_label",
  spriteLabelKey: "creature.braise_corne.sprite_label",
  behaviorKey: "creature.braise_corne.behavior",
  sprites: {
    briefing: "assets/creatures/braise-corne.png",
    combat: "assets/creatures/braise-corne.png"
  },
  inheritedStats: {
    speciesBonus: {
      power: 1
    },
    levelBonuses: {
      2: { power: 1 },
      3: { crit: 1 }
    }
  },
  combat: {
    stats: {},
    actions: {
      hotClaw: {
        id: "hotClaw",
        nameKey: "creature.braise_corne.action.hot_claw",
        patternKey: "combat.pattern.hot_claw",
        cost: 1,
        baseDamage: 1,
        powerScale: 0.52,
        scalingScale: 0.02,
        feintable: true,
        marked: false,
        kind: "simple"
      },
      burningHorns: {
        id: "burningHorns",
        nameKey: "creature.braise_corne.action.burning_horns",
        patternKey: "combat.pattern.burning_horns",
        cost: 2,
        baseDamage: 3,
        powerScale: 0.82,
        scalingScale: 0.03,
        critChance: 0.18,
        feintable: true,
        marked: true,
        kind: "strong"
      },
      tightAshes: {
        id: "tightAshes",
        nameKey: "creature.braise_corne.action.tight_ashes",
        patternKey: "combat.pattern.tight_ashes",
        cost: 2,
        guard: 3,
        scalingGuard: 0.8,
        feintable: false,
        marked: false,
        kind: "protection"
      },
      flameCharge: {
        id: "flameCharge",
        nameKey: "creature.braise_corne.action.flame_charge",
        patternKey: "combat.pattern.flame_charge",
        cost: 3,
        baseDamage: 5,
        powerScale: 1.1,
        scalingScale: 0.04,
        feintable: true,
        marked: true,
        charging: true,
        kind: "art"
      }
    },
    pattern: ["hotClaw", "burningHorns", "tightAshes", "flameCharge"]
  }
};
