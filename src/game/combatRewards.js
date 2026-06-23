import { getAffixesByIds } from "../data/affixes.js";
import { captureRewardPreview } from "../data/captureRewards.js";

const starsPerXp = 100;

export function completedObjectiveCount(combat) {
  return Object.values(combat.objectives).filter(Boolean).length;
}

export function completedBaseObjectiveCount({ combat, objectivesData }) {
  return objectivesData
    .filter((objective) => !objective.hiddenUntilPerception)
    .filter((objective) => combat.objectives[objective.id])
    .length;
}

export function grantEncounterAffixReward({
  baseProgression,
  combat,
  combatDebug,
  encounterAffix,
  objectivesData,
  setOwnedHuntAffixes
}) {
  if (!encounterAffix || combat.affixRewardGranted) return null;
  const completed = completedObjectiveCount(combat);
  const completedBase = completedBaseObjectiveCount({ combat, objectivesData });
  if (completed < 3) return null;

  const rewardLevel = completed >= 4 ? 1 : 0;
  encounterAffix.level = Math.max(encounterAffix.level ?? 0, rewardLevel);
  if (!baseProgression.ownedAffixIds.includes(encounterAffix.id)) {
    baseProgression.ownedAffixIds.push(encounterAffix.id);
  }
  setOwnedHuntAffixes(getAffixesByIds(baseProgression.ownedAffixIds));
  combat.affixRewardGranted = true;
  combatDebug("encounter_affix_unlocked", {
    affixId: encounterAffix.id,
    level: encounterAffix.level,
    completedObjectives: completed,
    completedBaseObjectives: completedBase
  });
  return encounterAffix;
}

export function grantCapturedCreatureReward({
  baseProgression,
  combat,
  combatDebug,
  creature,
  rewardedAffix = null
}) {
  if (!creature || combat.creatureRewardGranted) return null;

  baseProgression.capturedCreatures ??= [];
  const completedObjectives = completedObjectiveCount(combat);
  const capturedCreature = {
    id: `${creature.id}_${baseProgression.capturedCreatures.length + 1}`,
    creatureId: creature.id,
    level: creature.level ?? 1,
    teamWins: 0,
    levelWins: 0,
    capturedAt: Date.now(),
    completedObjectives,
    affixId: rewardedAffix?.id ?? null,
    affixLevel: rewardedAffix?.level ?? null
  };

  baseProgression.capturedCreatures.push(capturedCreature);
  combat.creatureRewardGranted = true;
  combatDebug("creature_captured", capturedCreature);
  return capturedCreature;
}

function rewardForOutcome({ combat, creature, outcome }) {
  if (outcome === "victory") {
    const reward = creature?.rewards?.victory;
    return reward ? { ...reward, tier: "humanVictory" } : null;
  }

  if (!["capture", "flee"].includes(outcome)) return null;

  const rewards = captureRewardPreview(creature);
  if (outcome === "flee") return { ...rewards.flee, tier: "flee" };

  const completed = completedObjectiveCount(combat);
  if (completed >= 4) return { ...rewards.captureFourObjectives, tier: "captureFourObjectives" };
  if (completed >= 3) return { ...rewards.captureThreeObjectives, tier: "captureThreeObjectives" };
  return { ...rewards.capture, tier: "capture" };
}

function creditProgressionRewards(baseProgression, reward) {
  baseProgression.stars ??= 0;
  baseProgression.gold ??= 0;
  baseProgression.availableXp ??= 0;

  const starsBefore = baseProgression.stars;
  const availableXpBefore = baseProgression.availableXp;
  const totalStars = baseProgression.stars + reward.stars;
  const gainedXp = Math.floor(totalStars / starsPerXp);
  baseProgression.stars = totalStars % starsPerXp;
  baseProgression.availableXp += gainedXp;
  baseProgression.gold += reward.gold;

  return {
    ...reward,
    starsBefore,
    starsAfter: baseProgression.stars,
    starsPerXp,
    availableXpBefore,
    gainedXp,
    totalStars: baseProgression.stars,
    totalGold: baseProgression.gold,
    availableXp: baseProgression.availableXp
  };
}

export function grantCombatCurrencyReward({
  baseProgression,
  combat,
  combatDebug,
  creature,
  outcome
}) {
  if (combat.currencyRewardGranted) return null;

  const reward = rewardForOutcome({ combat, creature, outcome });
  if (!reward) return null;

  const credited = creditProgressionRewards(baseProgression, reward);
  combat.currencyRewardGranted = true;
  combatDebug("combat_currency_reward", {
    outcome,
    tier: credited.tier,
    stars: credited.stars,
    gold: credited.gold,
    gainedXp: credited.gainedXp,
    totalStars: credited.totalStars,
    totalGold: credited.totalGold,
    availableXp: credited.availableXp,
    completedObjectives: completedObjectiveCount(combat)
  });

  return credited;
}
