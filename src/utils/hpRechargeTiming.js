export function hpRechargeStepDelay(totalHpToRestore = 1) {
  if (totalHpToRestore <= 5) return 220;
  if (totalHpToRestore <= 10) return 150;
  if (totalHpToRestore <= 20) return 95;
  return 55;
}
