export const ondeLente = {
  id: "onde_lente",
  number: 4,
  type: "eau",
  nameKey: "creature.onde_lente.name",
  stageLabelKey: "creature.onde_lente.stage_label",
  spriteLabelKey: "creature.onde_lente.sprite_label",
  behaviorKey: "creature.onde_lente.behavior",
  sprites: {
    briefing: "assets/creatures/onde-lente.png",
    combat: "assets/creatures/onde-lente.png"
  },
  inheritedStats: {
    speciesBonus: {
      vitality: 4,
      defense: 1
    },
    levelBonuses: {
      2: { vitality: 2, perception: 1 },
      3: { defense: 1 }
    }
  },
  combat: {
    stats: {
      maxHp: 24,
      power: 1,
      defense: 4,
      speed: 2,
      perception: 2,
      stability: 8
    },
    ai: {
      followUpActionIds: ["slowPulse"],
      singleLightActionChance: 0.4
    },
    actions: {
      slowPulse: {
        id: "slowPulse",
        nameKey: "creature.onde_lente.action.slow_pulse",
        patternKey: "combat.pattern.slow_pulse",
        cost: 1,
        baseDamage: 1,
        powerScale: 0.32,
        scalingScale: 0.01,
        feintable: true,
        marked: false,
        kind: "simple"
      },
      foamWall: {
        id: "foamWall",
        nameKey: "creature.onde_lente.action.foam_wall",
        patternKey: "combat.pattern.foam_wall",
        cost: 1,
        guard: 3,
        scalingGuard: 0.5,
        feintable: false,
        marked: false,
        kind: "protection"
      },
      heavyWave: {
        id: "heavyWave",
        nameKey: "creature.onde_lente.action.heavy_wave",
        patternKey: "combat.pattern.heavy_wave",
        cost: 2,
        baseDamage: 2,
        powerScale: 0.52,
        scalingScale: 0.018,
        feintable: true,
        marked: true,
        kind: "strong"
      },
      undertowLock: {
        id: "undertowLock",
        nameKey: "creature.onde_lente.action.undertow_lock",
        patternKey: "combat.pattern.undertow_lock",
        cost: 3,
        baseDamage: 2,
        powerScale: 0.66,
        scalingScale: 0.025,
        feintable: true,
        marked: true,
        charging: true,
        kind: "art"
      }
    },
    pattern: ["slowPulse", "heavyWave", "foamWall", "slowPulse", "undertowLock"]
  }
};
