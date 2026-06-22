const elementalTypes = ["feu", "eau", "vent"];
const signatureMaxCharge = 100;
const triadeElementByAction = {
  entaille: "feu",
  garde: "eau",
  feinte: "vent"
};

const simpleSignatureByType = {
  feu: "feu_simple",
  eau: "eau_simple",
  vent: "vent_simple",
  utilitaire: "utilitaire_simple"
};

const reinforcedSignatureByType = {
  feu: "feu_renforcee",
  eau: "eau_renforcee",
  vent: "vent_renforcee"
};

const hybridSignatureByTypes = {
  "eau+feu": "feu_eau",
  "feu+vent": "feu_vent",
  "eau+vent": "eau_vent"
};

const tacticalSignatureByType = {
  feu: "feu_tactique",
  eau: "eau_tactique",
  vent: "vent_tactique"
};

export const humanSignatureDefinitions = {
  feu_simple: {
    id: "feu_simple",
    nameKey: "signature.feu_simple.name",
    chargeLogKey: "log.signature_charged_fire",
    readyLogKey: "log.signature_ready_fire",
    kind: "fire"
  },
  eau_simple: {
    id: "eau_simple",
    nameKey: "signature.eau_simple.name",
    chargeLogKey: "log.signature_charged_water",
    readyLogKey: "log.signature_ready_water",
    kind: "water"
  },
  vent_simple: {
    id: "vent_simple",
    nameKey: "signature.vent_simple.name",
    chargeLogKey: "log.signature_charged_wind",
    readyLogKey: "log.signature_ready_wind",
    kind: "wind"
  },
  utilitaire_simple: {
    id: "utilitaire_simple",
    nameKey: "signature.utilitaire_simple.name",
    chargeLogKey: "log.signature_charged_utility",
    readyLogKey: "log.signature_ready_utility",
    kind: "utility"
  },
  feu_renforcee: {
    id: "feu_renforcee",
    nameKey: "signature.feu_renforcee.name",
    chargeLogKey: "log.signature_charged_fire",
    readyLogKey: "log.signature_ready_fire",
    kind: "fire",
    rank: 2
  },
  eau_renforcee: {
    id: "eau_renforcee",
    nameKey: "signature.eau_renforcee.name",
    chargeLogKey: "log.signature_charged_water",
    readyLogKey: "log.signature_ready_water",
    kind: "water",
    rank: 2
  },
  vent_renforcee: {
    id: "vent_renforcee",
    nameKey: "signature.vent_renforcee.name",
    chargeLogKey: "log.signature_charged_wind",
    readyLogKey: "log.signature_ready_wind",
    kind: "wind",
    rank: 2
  },
  feu_eau: {
    id: "feu_eau",
    nameKey: "signature.feu_eau.name",
    chargeLogKey: "log.signature_charged_fire_water",
    readyLogKey: "log.signature_ready_fire_water",
    kind: "fireWater"
  },
  feu_vent: {
    id: "feu_vent",
    nameKey: "signature.feu_vent.name",
    chargeLogKey: "log.signature_charged_fire_wind",
    readyLogKey: "log.signature_ready_fire_wind",
    kind: "fireWind"
  },
  eau_vent: {
    id: "eau_vent",
    nameKey: "signature.eau_vent.name",
    chargeLogKey: "log.signature_charged_water_wind",
    readyLogKey: "log.signature_ready_water_wind",
    kind: "waterWind"
  },
  feu_tactique: {
    id: "feu_tactique",
    nameKey: "signature.feu_tactique.name",
    chargeLogKey: "log.signature_charged_fire",
    readyLogKey: "log.signature_ready_fire",
    kind: "fireTactical"
  },
  eau_tactique: {
    id: "eau_tactique",
    nameKey: "signature.eau_tactique.name",
    chargeLogKey: "log.signature_charged_water",
    readyLogKey: "log.signature_ready_water",
    kind: "waterTactical"
  },
  vent_tactique: {
    id: "vent_tactique",
    nameKey: "signature.vent_tactique.name",
    chargeLogKey: "log.signature_charged_wind",
    readyLogKey: "log.signature_ready_wind",
    kind: "windTactical"
  },
  triade_instable: {
    id: "triade_instable",
    nameKey: "signature.triade_instable.name",
    chargeLogKey: "log.signature_charged_triade",
    readyLogKey: "log.signature_ready_triade",
    kind: "triade"
  },
  alchimie_de_guerre: {
    id: "alchimie_de_guerre",
    nameKey: "signature.alchimie_de_guerre.name",
    chargeLogKey: "log.signature_charged_alchemy",
    readyLogKey: "log.signature_ready_alchemy",
    kind: "alchemy"
  },
  assaut_fulgurant: {
    id: "assaut_fulgurant",
    nameKey: "signature.assaut_fulgurant.name",
    chargeLogKey: "log.signature_charged_assault",
    readyLogKey: "log.signature_ready_assault",
    kind: "assault"
  },
  verrou_mouvant: {
    id: "verrou_mouvant",
    nameKey: "signature.verrou_mouvant.name",
    chargeLogKey: "log.signature_charged_lock",
    readyLogKey: "log.signature_ready_lock",
    kind: "lock"
  }
};

function signatureById(id) {
  return humanSignatureDefinitions[id] ?? null;
}

function signatureIdForTypes(types = []) {
  const filteredTypes = types.filter(Boolean);
  if (filteredTypes.length === 0) return null;
  if (filteredTypes.length === 1) return simpleSignatureByType[filteredTypes[0]] ?? null;

  const counts = filteredTypes.reduce((acc, type) => {
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
  const utilityCount = counts.utilitaire ?? 0;
  const elementTypes = elementalTypes.filter((type) => counts[type] > 0);

  if (filteredTypes.length === 2) {
    const repeatedType = Object.entries(counts).find(([, count]) => count >= 2)?.[0];
    if (repeatedType && repeatedType !== "utilitaire") return reinforcedSignatureByType[repeatedType] ?? null;
    if (utilityCount === 1 && elementTypes.length === 1) return tacticalSignatureByType[elementTypes[0]] ?? null;
    if (elementTypes.length === 2) return hybridSignatureByTypes[elementTypes.sort().join("+")] ?? null;
  }

  const dominantType = Object.entries(counts)
    .filter(([type]) => type !== "utilitaire")
    .find(([, count]) => count >= 2)?.[0];
  if (dominantType) return reinforcedSignatureByType[dominantType] ?? null;

  if (elementTypes.length === 3) return "triade_instable";
  if (utilityCount === 1 && elementTypes.length === 2) {
    const key = elementTypes.sort().join("+");
    if (key === "eau+feu") return "alchimie_de_guerre";
    if (key === "feu+vent") return "assaut_fulgurant";
    if (key === "eau+vent") return "verrou_mouvant";
  }

  if (utilityCount === 1 && elementTypes.length === 1) return tacticalSignatureByType[elementTypes[0]] ?? null;
  return null;
}

export function createHumanSignatureFromTypes(types = []) {
  const definition = signatureById(signatureIdForTypes(types));
  if (!definition) return null;

  return {
    ...definition,
    charge: 0,
    readyAnnounced: false,
    activeElement: "feu",
    pending: null
  };
}

export function createHumanSignatureFromEquippedCreatures(equippedCreatures = []) {
  return createHumanSignatureFromTypes(equippedCreatures.map((entry) => entry.type));
}

export function chargeHumanSignature(signature, amount) {
  if (!signature || signature.pending || signature.consumed) return false;
  const wasReady = signature.charge >= signatureMaxCharge;
  signature.charge = Math.min(signatureMaxCharge, signature.charge + amount);
  return !wasReady && signature.charge >= signatureMaxCharge;
}

export function signatureChargePercent(signature) {
  return Math.round(signature?.charge ?? 0);
}

export function isHumanSignatureReady(signature) {
  return Boolean(signature && signature.charge >= signatureMaxCharge && !signature.pending && !signature.consumed);
}

export function resetHumanSignature(signature, { consumed = false } = {}) {
  if (!signature) return;
  signature.charge = 0;
  signature.readyAnnounced = false;
  signature.pending = null;
  signature.consumed = consumed;
}

export function updateTriadeElementFromAction(signature, action) {
  if (!signature || signature.kind !== "triade") return;
  if (elementalTypes.includes(action?.type)) signature.activeElement = action.type;
  else if (triadeElementByAction[action?.id]) signature.activeElement = triadeElementByAction[action.id];
}

function chargeForStyle(style, event = {}) {
  if (style === "fire") {
    return event.damage > 0 ? Math.min(28, 8 + event.damage * 4) : 0;
  }
  if (style === "water") {
    return Math.min(24, (event.guardGained ?? 0) * 4)
      + Math.min(18, (event.savedPa ?? 0) * 6);
  }
  if (style === "wind") {
    return (event.actionId === "feinte" && event.hit ? 24 : 0)
      + (event.actedFirst ? 15 : 0)
      + (event.guardGained > 0 ? 8 : 0);
  }
  if (style === "utility") {
    return (event.actionId && !["signature", "bag", "initiative"].includes(event.actionId) ? 10 : 0)
      + Math.min(12, (event.savedPa ?? 0) * 4)
      + (event.guardGained > 0 ? 6 : 0);
  }
  return 0;
}

function stylesForSignature(signature, event = {}) {
  if (!signature) return [];
  if (signature.kind === "triade") {
    return [{
      feu: "fire",
      eau: "water",
      vent: "wind"
    }[signature.activeElement] ?? "fire"];
  }
  const stylesByKind = {
    fire: ["fire"],
    fireTactical: ["fire", "utility"],
    fireWater: ["fire", "water"],
    assault: ["fire", "wind", "utility"],
    water: ["water"],
    waterTactical: ["water", "utility"],
    alchemy: ["fire", "water", "utility"],
    wind: ["wind"],
    windTactical: ["wind", "utility"],
    waterWind: ["water", "wind"],
    lock: ["water", "wind", "utility"],
    utility: ["utility"]
  };
  return stylesByKind[signature.kind] ?? [];
}

export function signatureChargeAmountForEvent(signature, event = {}) {
  if (!signature || signature.consumed || signature.pending) return 0;
  if (event.actionId === "signature" || event.actionId === "bag") return 0;
  if (event.actionId !== "initiative" && !event.executed) return 0;
  const amount = stylesForSignature(signature, event)
    .reduce((sum, style) => sum + chargeForStyle(style, event), 0);
  return Math.min(32, amount);
}

export function translatedSignatureName(t, signature) {
  return signature ? t(signature.nameKey) : "";
}
