export const plumevif = {
  id: "plumevif",
  type: "vent",
  nameKey: "creature.plumevif.name",
  stageLabelKey: "creature.plumevif.stage_label",
  spriteLabelKey: "creature.plumevif.sprite_label",
  behaviorKey: "creature.plumevif.behavior",
  sprites: {
    briefing: "assets/creatures/plumevif.png",
    combat: "assets/creatures/plumevif.png"
  },
  inheritedStats: {
    speciesBonus: {
      speed: 1
    },
    levelBonuses: {
      2: { speed: 1 },
      3: { crit: 1 }
    }
  },
  combat: {
    stats: {
      maxHp: 15,
      power: 2,
      speed: 7,
      critChance: 0.07
    },
    ai: {
      followUpActionIds: ["flutterGuard", "quickPeck"],
      singleLightActionChance: 0.45
    },
    actions: {
      quickPeck: {
        id: "quickPeck",
        nameKey: "creature.plumevif.action.quick_peck",
        patternKey: "combat.pattern.quick_peck",
        cost: 1,
        baseDamage: 1,
        powerScale: 0.42,
        scalingScale: 0.015,
        feintable: true,
        marked: false,
        kind: "simple"
      },
      flutterGuard: {
        id: "flutterGuard",
        nameKey: "creature.plumevif.action.flutter_guard",
        patternKey: "combat.pattern.flutter_guard",
        cost: 1,
        guard: 1,
        scalingGuard: 0.35,
        feintable: false,
        marked: false,
        kind: "protection"
      },
      cuttingGust: {
        id: "cuttingGust",
        nameKey: "creature.plumevif.action.cutting_gust",
        patternKey: "combat.pattern.cutting_gust",
        cost: 2,
        baseDamage: 2,
        powerScale: 0.68,
        scalingScale: 0.025,
        critChance: 0.14,
        feintable: true,
        marked: true,
        kind: "strong"
      },
      featherCyclone: {
        id: "featherCyclone",
        nameKey: "creature.plumevif.action.feather_cyclone",
        patternKey: "combat.pattern.feather_cyclone",
        cost: 3,
        baseDamage: 3,
        powerScale: 0.9,
        scalingScale: 0.035,
        feintable: true,
        marked: true,
        charging: true,
        kind: "art"
      }
    },
    pattern: ["quickPeck", "cuttingGust", "flutterGuard", "featherCyclone", "cuttingGust"]
  }
};
