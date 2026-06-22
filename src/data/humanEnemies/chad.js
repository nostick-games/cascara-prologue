export const chad = {
  id: "chad",
  type: "entraineur",
  nameKey: "human_enemy.chad.name",
  stageLabelKey: "human_enemy.chad.stage_label",
  spriteLabelKey: "human_enemy.chad.sprite_label",
  sprites: {
    briefing: "assets/pnj/chad.png",
    combat: "assets/pnj/chad.png",
    frameCount: 4,
    frameWidth: 32,
    frameHeight: 32,
    combatScale: {
      desktop: 4,
      mobile: 4.5,
      mobileTall: 4.5
    }
  },
  training: {
    adaptiveTeam: true,
    initiativeSpeedBonus: 1,
    firstReturnDialogKey: "map.npc.chad.after_first_training",
    returnDialogKey: "map.npc.chad.after_training"
  },
  stats: {},
  arsenal: {
    baseActionIds: ["entaille", "garde", "feinte", "art"],
    singleLightActionChance: 0.4
  },
  equippedCreatures: [],
  rewards: {}
};
