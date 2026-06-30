export const affixes = [
  {
    id: "pas_de_rafale",
    number: 1,
    nameKey: "affix.pas_de_rafale.name",
    descriptionKey: "affix.pas_de_rafale.description",
    level: 0,
    type: "vent",
    sourceCreature: "rafalynx",
    targetSkill: "entaille",
    mode: "mixte",
    trigger: "attaque_adverse_ratee",
    effect: {
      critBonusByLevel: [10, 15, 20],
      usesPerTurn: 1
    },
    radarImpact: {
      stat: "crit",
      kind: "conditional",
      amount: 15
    }
  },
  {
    id: "etincelle_critique",
    number: 2,
    nameKey: "affix.etincelle_critique.name",
    descriptionKey: "affix.etincelle_critique.description",
    level: 0,
    type: "feu",
    sourceCreature: "braise_corne",
    targetSkill: "entaille",
    mode: "combat",
    trigger: "premier_critique",
    effect: {
      applyStatus: "brulure_legere",
      statusDamageByLevel: [2, 3, 4],
      usesPerCombat: 1
    },
    radarImpact: {
      stat: "crit",
      kind: "proc",
      amount: 8
    }
  },
  {
    id: "refuge_clair",
    number: 3,
    nameKey: "affix.refuge_clair.name",
    descriptionKey: "affix.refuge_clair.description",
    level: 0,
    type: "eau",
    sourceCreature: "ondigarde",
    targetSkill: "garde",
    mode: "mixte",
    trigger: "garde_utilisee",
    effect: {
      shieldBonusByLevel: [2, 3, 4],
      usesPerTurn: 1
    },
    radarImpact: {
      stat: "defense",
      kind: "flat",
      amount: 3
    }
  },
  {
    id: "morsure_sure",
    number: 4,
    nameKey: "affix.morsure_sure.name",
    descriptionKey: "affix.morsure_sure.description",
    level: 0,
    type: "feu",
    sourceCreature: "rocroc",
    targetSkill: "entaille",
    mode: "mixte",
    trigger: "premiere_entaille",
    effect: {
      damageBonusByLevel: [1, 2, 3],
      usesPerCombat: 1
    },
    radarImpact: {
      stat: "power",
      kind: "conditional",
      amount: 1
    }
  },
  {
    id: "instinct_ecaille",
    number: 5,
    nameKey: "affix.instinct_ecaille.name",
    descriptionKey: "affix.instinct_ecaille.description",
    level: 0,
    type: "eau",
    sourceCreature: "ecailroc",
    targetSkill: "garde",
    mode: "mixte",
    trigger: "heros_sous_moitie_pv",
    effect: {
      shieldBonusByLevel: [3, 4, 5],
      usesPerCombat: 1
    },
    radarImpact: {
      stat: "defense",
      kind: "conditional",
      amount: 3
    }
  },
  {
    id: "instinct_concentration",
    number: 6,
    nameKey: "affix.instinct_concentration.name",
    descriptionKey: "affix.instinct_concentration.description",
    level: 0,
    type: "vent",
    sourceCreature: "lumisprit",
    targetSkill: "attaque",
    mode: "mixte",
    trigger: "tour_fini_avec_pa",
    effect: {
      damageMultiplierBonusByLevel: [0.05, 0.1, 0.15],
      usesPerCombat: 1
    },
    radarImpact: {
      stat: "power",
      kind: "conditional",
      amount: 5
    }
  },
  {
    id: "marque_de_braise",
    number: 7,
    nameKey: "affix.marque_de_braise.name",
    descriptionKey: "affix.marque_de_braise.description",
    level: 0,
    type: "feu",
    sourceCreature: "fournaiseau",
    targetSkill: "capture",
    mode: "capture",
    trigger: "objectif_capture_complete",
    effect: {
      captureStabilityPenaltyByLevel: [2, 3, 4]
    },
    radarImpact: {
      stat: "perception",
      kind: "captureTool",
      amount: 1
    }
  },
  {
    id: "souffle_relatif",
    number: 8,
    nameKey: "affix.souffle_relatif.name",
    descriptionKey: "affix.souffle_relatif.description",
    level: 0,
    type: "utilitaire",
    category: "utility",
    sourceCreature: "aeromine",
    targetSkill: "pa",
    mode: "utilitaire",
    trigger: "debut_tour_joueur",
    effect: {
      apGainChanceByLevel: [10, 15, 20],
      apGain: 1,
      usesPerTurn: 1
    },
    radarImpact: {
      stat: "pa",
      kind: "proc",
      amount: 1
    }
  },
  {
    id: "elan_de_survie",
    number: 9,
    nameKey: "affix.elan_de_survie.name",
    descriptionKey: "affix.elan_de_survie.description",
    level: 0,
    type: "utilitaire",
    category: "utility",
    sourceCreature: "vivacier",
    targetSkill: "pa",
    mode: "utilitaire",
    trigger: "heros_sous_moitie_pv",
    effect: {
      apGainChanceByLevel: [15, 20, 25],
      apGain: 1
    },
    radarImpact: {
      stat: "pa",
      kind: "proc",
      amount: 1
    }
  },
  {
    id: "retour_de_geste",
    number: 10,
    nameKey: "affix.retour_de_geste.name",
    descriptionKey: "affix.retour_de_geste.description",
    level: 0,
    type: "utilitaire",
    category: "utility",
    sourceCreature: "tempoile",
    targetSkill: "pa",
    mode: "utilitaire",
    trigger: "apres_action_3_pa",
    effect: {
      apGainChanceByLevel: [20, 25, 30],
      apGain: 1,
      usesPerTurn: 1
    },
    radarImpact: {
      stat: "pa",
      kind: "conditional",
      amount: 1
    }
  }
];

export function getAffixesByType(type) {
  return affixes.filter((affix) => affix.type === type);
}

export function getAffixesByIds(ids) {
  const idSet = new Set(ids);
  return affixes.filter((affix) => idSet.has(affix.id));
}

export function selectRandomAffixForType(type, { random = Math.random, maxNumber } = {}) {
  let candidates = getAffixesByType(type);
  // Plafond de numéro d'instinct (propriété de map) : on n'attache pas un instinct
  // dont le numéro dépasse cette valeur. Si le filtre vide le pool du type, on
  // retombe sur la liste complète du type pour ne jamais renvoyer null par erreur.
  if (Number.isFinite(maxNumber)) {
    const capped = candidates.filter((affix) => (affix.number ?? Infinity) <= maxNumber);
    if (capped.length) candidates = capped;
  }
  if (candidates.length === 0) return null;

  return candidates[Math.floor(random() * candidates.length)];
}
