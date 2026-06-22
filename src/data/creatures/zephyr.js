export const zephyr = {
  id: "zephyr",
  type: "vent",
  nameKey: "creature.zephyr.name",
  stageLabelKey: "creature.zephyr.stage_label",
  spriteLabelKey: "creature.zephyr.sprite_label",
  behaviorKey: "creature.zephyr.behavior",
  sprites: {
    briefing: "assets/creatures/zephyr.png",
    combat: "assets/creatures/zephyr.png",
    frameCount: 4
  },
  inheritedStats: {
    speciesBonus: {
      crit: 1
    },
    levelBonuses: {
      2: { speed: 1 },
      3: { crit: 1 }
    }
  },
  combat: {
    stats: {
      maxHp: 17,
      power: 3,
      defense: 1,
      speed: 6,
      perception: 4,
      critChance: 0.09,
      stability: 4
    },
    ai: {
      followUpActionIds: ["tailwind", "needleGust"],
      singleLightActionChance: 0.38
    },
    actions: {
      needleGust: {
        id: "needleGust",
        nameKey: "creature.zephyr.action.needle_gust",
        patternKey: "combat.pattern.needle_gust",
        cost: 1,
        baseDamage: 1,
        powerScale: 0.44,
        scalingScale: 0.015,
        feintable: true,
        marked: false,
        kind: "simple"
      },
      tailwind: {
        id: "tailwind",
        nameKey: "creature.zephyr.action.tailwind",
        patternKey: "combat.pattern.tailwind",
        cost: 1,
        guard: 1,
        scalingGuard: 0.32,
        feintable: false,
        marked: false,
        kind: "protection"
      },
      skyCut: {
        id: "skyCut",
        nameKey: "creature.zephyr.action.sky_cut",
        patternKey: "combat.pattern.sky_cut",
        cost: 2,
        baseDamage: 2,
        powerScale: 0.74,
        scalingScale: 0.025,
        critChance: 0.18,
        feintable: true,
        marked: true,
        kind: "strong"
      },
      vacuumBurst: {
        id: "vacuumBurst",
        nameKey: "creature.zephyr.action.vacuum_burst",
        patternKey: "combat.pattern.vacuum_burst",
        cost: 3,
        baseDamage: 3,
        powerScale: 0.88,
        scalingScale: 0.035,
        feintable: true,
        marked: true,
        charging: true,
        kind: "art"
      }
    },
    pattern: ["needleGust", "tailwind", "skyCut", "needleGust", "vacuumBurst"]
  }
};
