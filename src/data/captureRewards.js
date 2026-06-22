export const captureRewardBase = {
  flee: {
    stars: 10,
    gold: 4
  },
  capture: {
    stars: 25,
    gold: 10
  },
  captureThreeObjectives: {
    stars: 35,
    gold: 18
  },
  captureFourObjectives: {
    stars: 35,
    gold: 28
  }
};

const levelStarBonus = [0, 10, 20];
const levelGoldMultiplier = [1, 1.5, 2];

function levelIndex(level = 1) {
  return Math.max(0, Math.min(2, level - 1));
}

export function rewardLevelForCreature(creature) {
  return creature?.combat?.stats?.level
    ?? creature?.combat?.typeProfile?.stats?.level
    ?? 1;
}

export function captureRewardValue(reward, level = 1) {
  const index = levelIndex(level);
  return {
    stars: reward.stars + levelStarBonus[index],
    gold: Math.round(reward.gold * levelGoldMultiplier[index])
  };
}

export function captureRewardPreview(creature) {
  const level = rewardLevelForCreature(creature);
  return {
    level,
    flee: captureRewardValue(captureRewardBase.flee, level),
    capture: captureRewardValue(captureRewardBase.capture, level),
    captureThreeObjectives: captureRewardValue(captureRewardBase.captureThreeObjectives, level),
    captureFourObjectives: captureRewardValue(captureRewardBase.captureFourObjectives, level)
  };
}
