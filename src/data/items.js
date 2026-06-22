export const itemDefinitions = {
  potion_50: {
    id: "potion_50",
    type: "combat",
    nameKey: "item.potion_50.name",
    sprite: "assets/inventaire/objets/potion_100.png",
    paCost: 1,
    effect: "halfHeal"
  },
  antipara: {
    id: "antipara",
    type: "combat",
    nameKey: "item.antipara.name",
    sprite: "assets/inventaire/objets/antipara.png",
    paCost: 2,
    effect: "cureParalysis"
  },
  pommade: {
    id: "pommade",
    type: "combat",
    nameKey: "item.pommade.name",
    sprite: "assets/inventaire/objets/pommade.png",
    paCost: 2,
    effect: "cureBurn"
  },
  potion_100: {
    id: "potion_100",
    type: "combat",
    nameKey: "item.potion_100.name",
    sprite: "assets/inventaire/objets/potion_100.png",
    paCost: 1,
    effect: "fullHeal"
  },
  attelle: {
    id: "attelle",
    type: "combat",
    nameKey: "item.attelle.name",
    sprite: "assets/inventaire/objets/pommade.png",
    paCost: 2,
    effect: "cureExposed"
  }
};

export function combatItemsFromInventory(inventory) {
  return Object.entries(inventory)
    .map(([id, quantity]) => ({ item: itemDefinitions[id], quantity }))
    .filter(({ item, quantity }) => item?.type === "combat" && quantity > 0);
}
