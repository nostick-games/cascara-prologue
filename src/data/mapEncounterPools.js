import { creatures } from "./creatures.js";

function allCreaturePool(weight = 20) {
  return Object.keys(creatures).map((creatureKey) => ({ creatureKey, weight }));
}

export const mapEncounterPools = {
  feu_01: [
    { creatureKey: "flamillon", weight: 60 },
    { creatureKey: "braiseCorne", weight: 40 }
  ],
  eau_01: [
    { creatureKey: "nacrelame", weight: 55 },
    { creatureKey: "ondeLente", weight: 45 }
  ],
  vent_01: [
    { creatureKey: "plumevif", weight: 55 },
    { creatureKey: "zephyr", weight: 45 }
  ],
  utilitaire_01: [
    { creatureKey: "loopio", weight: 55 },
    { creatureKey: "sillage", weight: 45 }
  ],
  mixte_01: allCreaturePool()
};
