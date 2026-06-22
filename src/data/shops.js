export const shopDefinitions = {
  prologue_lobo: {
    id: "prologue_lobo",
    npcId: "merchant_prologue",
    speakerKey: "map.npc.lobo.name",
    introKey: "map.shop.lobo.intro",
    thanksKey: "map.shop.lobo.thanks",
    optionBrowseKey: "map.shop.option.browse",
    optionExitKey: "map.shop.option.exit",
    optionQuantityKey: "map.shop.option.quantity",
    optionMoreKey: "map.shop.option.more",
    optionCancelKey: "map.shop.option.cancel",
    quantityPromptKey: "map.shop.quantity_prompt",
    items: [
      { itemId: "potion_50", price: 18, descriptionKey: "map.shop.item.potion_50.description" },
      { itemId: "potion_100", price: 45, descriptionKey: "map.shop.item.potion_100.description" },
      { itemId: "antipara", price: 12, descriptionKey: "map.shop.item.antipara.description" },
      { itemId: "pommade", price: 12, descriptionKey: "map.shop.item.pommade.description" },
      { itemId: "attelle", price: 10, descriptionKey: "map.shop.item.attelle.description" }
    ]
  }
};
