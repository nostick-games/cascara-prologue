import { combatItemsFromInventory } from "../data/items.js";

export function listCombatInventoryItems({ inventory, t }) {
  return combatItemsFromInventory(inventory ?? {})
    .sort((left, right) => t(left.item.nameKey).localeCompare(t(right.item.nameKey)));
}

export function isCombatItemEffective({ combat, item }) {
  if (!combat) return false;
  if (item.effect === "halfHeal" || item.effect === "fullHeal") return combat.hero.hp < combat.hero.maxHp;
  if (item.effect === "cureParalysis") return Boolean(combat.hero.statuses?.paralysie);
  if (item.effect === "cureBurn") return Boolean(combat.hero.statuses?.brulure);
  if (item.effect === "cureExposed") return Boolean(combat.hero.statuses?.a_decouvert);
  return false;
}

export function applyCombatItemToState({ combat, entry, inventory, t, addLog }) {
  if (!combat) return;

  combat.hero.pa = Math.max(0, combat.hero.pa - entry.item.paCost);
  inventory[entry.item.id] = Math.max(0, (inventory[entry.item.id] ?? 0) - 1);
  if (entry.item.effect === "halfHeal") {
    const missingHp = Math.max(0, combat.hero.maxHp - combat.hero.hp);
    const heal = Math.max(1, Math.ceil(missingHp / 2));
    combat.hero.hp = Math.min(combat.hero.maxHp, combat.hero.hp + heal);
    addLog(t("log.item_potion_50"));
  }

  if (entry.item.effect === "fullHeal") {
    combat.hero.hp = combat.hero.maxHp;
    combat.displayHp.hero = combat.hero.hp;
    addLog(t("log.item_potion_100"));
  }
  if (entry.item.effect === "cureParalysis") {
    delete combat.hero.statuses.paralysie;
    combat.hero.blockedActionId = null;
    addLog(t("log.item_antipara"));
  }
  if (entry.item.effect === "cureBurn") {
    delete combat.hero.statuses.brulure;
    addLog(t("log.item_pommade"));
  }
  if (entry.item.effect === "cureExposed") {
    delete combat.hero.statuses.a_decouvert;
    addLog(t("log.item_attelle"));
  }
}
