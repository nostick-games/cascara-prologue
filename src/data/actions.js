export const actionDefinitions = {
  signature: {
    id: "signature",
    nameKey: "action.signature.name",
    icon: "✦",
    cost: 0,
    kind: "signature"
  },
  entaille: {
    id: "entaille",
    nameKey: "action.entaille.name",
    icon: "⚔️",
    cost: 1,
    kind: "attack",
    baseDamage: 1,
    powerScale: 1.2
  },
  garde: {
    id: "garde",
    nameKey: "action.garde.name",
    icon: "🛡️",
    cost: 1,
    kind: "defense",
    baseGuard: 2,
    defenseScale: 0.5
  },
  feinte: {
    id: "feinte",
    nameKey: "action.feinte.name",
    icon: "🗡️",
    cost: 2,
    kind: "reaction",
    baseDamage: 1,
    powerScale: 1.8
  },
  art: {
    id: "art",
    nameKey: "action.art.name",
    icon: "💥",
    cost: 3,
    kind: "art",
    baseDamage: 1,
    powerScale: 0.95,
    enemyPaDamage: 1
  },
  capture: {
    id: "capture",
    nameKey: "action.capture.name",
    icon: "✨",
    cost: 1,
    kind: "capture"
  },
  end: {
    id: "end",
    nameKey: "action.end.name",
    icon: "⏱️",
    cost: 0,
    kind: "utility"
  },
  bag: {
    id: "bag",
    nameKey: "action.bag.name",
    icon: "🎒",
    cost: 0,
    kind: "utility"
  }
};
