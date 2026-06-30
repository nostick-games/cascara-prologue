export const aragor = {
  id: "aragor",
  type: "gardien",
  gender: "masculin",
  nameKey: "human_enemy.aragor.name",
  stageLabelKey: "human_enemy.aragor.stage_label",
  spriteLabelKey: "human_enemy.aragor.sprite_label",
  sprites: {
    briefing: "assets/enemys/aragor/aragor_idle.png",
    combat: "assets/enemys/aragor/aragor_idle.png",
    frameCount: 5,
    frameWidth: 32,
    frameHeight: 32,
    combatScale: {
      desktop: 4,
      mobile: 4.5,
      mobileTall: 4.5
    }
  },
  mapDialog: {
    challengeKey: "map.aragor.challenge",
    fightQuestionKey: "map.aragor.fight_question",
    needTeamKey: "map.aragor.need_team",
    requiredOwnedCreatureCount: 3,
    defeatBehavior: "dialogThenFade"
  },
  stats: {
    maxPa: 3,
    defense: -2,
    perception: 3
  },
  arsenal: {
    baseActionIds: ["entaille", "garde", "feinte", "art"]
  },
  equippedCreatures: [
    { creatureId: "braise_corne", level: 1 },
    { creatureId: "flamillon", level: 1 },
    { creatureId: "zephyr", level: 1 }
  ],
  activeAffixId: "morsure_sure",
  rewards: {
    victory: {
      stars: 28,
      gold: 24
    }
  }
};
