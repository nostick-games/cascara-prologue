export const loopio = {
  id: "loopio",
  type: "utilitaire",
  nameKey: "creature.loopio.name",
  stageLabelKey: "creature.loopio.stage_label",
  spriteLabelKey: "creature.loopio.sprite_label",
  behaviorKey: "creature.loopio.behavior",
  sprites: {
    briefing: "assets/creatures/loopio.png",
    combat: "assets/creatures/loopio.png"
  },
  inheritedStats: {
    speciesBonus: {
      vitality: 2,
      perception: 1
    },
    levelBonuses: {
      2: { vitality: 1, perception: 1 },
      3: { defense: 1 }
    }
  },
  combat: {
    stats: {
      maxHp: 16,
      power: 3,
      defense: 2,
      speed: 4,
      perception: 4,
      critChance: 0.08,
      stability: 5
    },
    ai: {
      followUpActionIds: ["crystalGuard", "crystalTap"],
      singleLightActionChance: 0.38
    },
    actions: {
      crystalTap: {
        id: "crystalTap",
        nameKey: "creature.loopio.action.crystal_tap",
        patternKey: "combat.pattern.crystal_tap",
        cost: 1,
        baseDamage: 1,
        powerScale: 0.42,
        scalingScale: 0.015,
        feintable: true,
        marked: false,
        kind: "simple"
      },
      crystalGuard: {
        id: "crystalGuard",
        nameKey: "creature.loopio.action.crystal_guard",
        patternKey: "combat.pattern.crystal_guard",
        cost: 1,
        guard: 2,
        scalingGuard: 0.34,
        feintable: false,
        marked: false,
        kind: "protection"
      },
      prismJab: {
        id: "prismJab",
        nameKey: "creature.loopio.action.prism_jab",
        patternKey: "combat.pattern.prism_jab",
        cost: 2,
        baseDamage: 2,
        powerScale: 0.66,
        scalingScale: 0.022,
        critChance: 0.16,
        feintable: true,
        marked: true,
        kind: "strong"
      },
      headCrystalBurst: {
        id: "headCrystalBurst",
        nameKey: "creature.loopio.action.head_crystal_burst",
        patternKey: "combat.pattern.head_crystal_burst",
        cost: 3,
        baseDamage: 3,
        powerScale: 0.82,
        scalingScale: 0.032,
        critChance: 0.12,
        feintable: true,
        marked: true,
        charging: true,
        kind: "art"
      }
    },
    pattern: ["crystalTap", "crystalGuard", "prismJab", "crystalTap", "headCrystalBurst"]
  }
};
