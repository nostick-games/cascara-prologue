export function nativeHaptic(type = "medium") {
  if (typeof window === "undefined") return;
  const haptic = window.CascaraNative?.haptic;
  if (typeof haptic !== "function") return;
  Promise.resolve(haptic(type)).catch((error) => {
    console.warn("[CascaraNative] Haptic feedback failed.", error);
  });
}
