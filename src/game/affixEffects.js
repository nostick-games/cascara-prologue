export function affixLevelValue(affix, values, fallback = 0) {
  return values?.[affix.level] ?? values?.[0] ?? fallback;
}

export function huntAffixLevel(t, affix) {
  const levelLabels = ["I", "II", "III"];
  return t("ui.affix_level", { level: levelLabels[affix.level] ?? String(affix.level + 1) });
}
