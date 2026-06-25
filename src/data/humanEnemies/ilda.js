export const ilda = {
  id: "ilda",
  type: "voleur",
  typeNameKey: "human_enemy.type.eclaireuse.name",
  nameKey: "human_enemy.ilda.name",
  stageLabelKey: "human_enemy.ilda.stage_label",
  spriteLabelKey: "human_enemy.ilda.sprite_label",
  sprites: {
    briefing: "assets/enemys/ilda/ilda.png",
    combat: "assets/enemys/ilda/ilda.png",
    frameCount: 7,
    frameWidth: 32,
    frameHeight: 32,
    combatScale: {
      desktop: 4,
      mobile: 4.5,
      mobileTall: 4.5
    }
  },
  mapDialog: {
    challengeKey: "map.ilda.challenge",
    fightQuestionKey: "map.ilda.fight_question",
    defeatedKey: "map.ilda.defeated",
    defeatBehavior: "stay"
  },
  stats: {
    maxHp: 8,
    maxPa: 3,
    power: -1
  },
  arsenal: {
    baseActionIds: ["entaille", "garde", "feinte", "art"],
    pattern: ["entaille", "feinte", "garde", "art"],
    followUpActionIds: ["entaille", "feinte"],
    singleLightActionChance: 0.52
  },
  equippedCreatures: [
    { creatureId: "zephyr", level: 1 }
  ],
  activeAffixId: "pas_de_rafale",
  rewards: {
    victory: {
      stars: 8,
      gold: 5
    }
  }
};
