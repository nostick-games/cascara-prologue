export const flamillon = {
  id: "flamillon",
  type: "feu",
  nameKey: "creature.flamillon.name",
  stageLabelKey: "creature.flamillon.stage_label",
  spriteLabelKey: "creature.flamillon.sprite_label",
  behaviorKey: "creature.flamillon.behavior",
  sprites: {
    briefing: "assets/creatures/flamillon.png",
    combat: "assets/creatures/flamillon.png"
  },
  inheritedStats: {
    speciesBonus: {
      crit: 2
    },
    levelBonuses: {
      2: { crit: 1 },
      3: { speed: 1 }
    }
  },
  combat: {
    stats: {
      perception: 2
    },
    actions: {
      emberPeck: {
        id: "emberPeck",
        nameKey: "creature.flamillon.action.ember_peck",
        patternKey: "combat.pattern.ember_peck",
        cost: 1,
        baseDamage: 1,
        powerScale: 0.48,
        scalingScale: 0.02,
        feintable: true,
        marked: false,
        kind: "simple"
      },
      sparkWing: {
        id: "sparkWing",
        nameKey: "creature.flamillon.action.spark_wing",
        patternKey: "combat.pattern.spark_wing",
        cost: 2,
        baseDamage: 2,
        powerScale: 0.78,
        scalingScale: 0.03,
        critChance: 0.22,
        feintable: true,
        marked: true,
        kind: "strong"
      },
      cinderVeil: {
        id: "cinderVeil",
        nameKey: "creature.flamillon.action.cinder_veil",
        patternKey: "combat.pattern.cinder_veil",
        cost: 2,
        guard: 2,
        scalingGuard: 0.55,
        feintable: false,
        marked: false,
        kind: "protection"
      },
      flareDive: {
        id: "flareDive",
        nameKey: "creature.flamillon.action.flare_dive",
        patternKey: "combat.pattern.flare_dive",
        cost: 3,
        baseDamage: 4,
        powerScale: 1,
        scalingScale: 0.04,
        feintable: true,
        marked: true,
        charging: true,
        kind: "art"
      }
    },
    pattern: ["emberPeck", "sparkWing", "cinderVeil", "flareDive"]
  }
};
