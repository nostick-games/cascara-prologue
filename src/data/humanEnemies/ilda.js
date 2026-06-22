export const ilda = {
  id: "ilda",
  type: "villageoise",
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
    maxHp: 10,
    maxPa: 3
  },
  arsenal: {
    baseActionIds: ["entaille", "garde", "feinte", "art"],
    singleLightActionChance: 0.48
  },
  equippedCreatures: [
    { creatureId: "onde_lente", level: 1 }
  ],
  activeAffixId: "instinct_ecaille",
  rewards: {
    victory: {
      stars: 10,
      gold: 4
    }
  }
};
