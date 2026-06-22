export function nativeHaptic(type = "medium") {
  if (typeof window === "undefined") return;
  const haptic = window.CascaraNative?.haptic;
  if (typeof haptic !== "function") return;
  Promise.resolve(haptic(type)).catch((error) => {
    console.warn("[CascaraNative] Haptic feedback failed.", error);
  });
}

export async function nativeSave(slot, data) {
  const save = typeof window !== "undefined" ? window.CascaraNative?.save : null;
  if (typeof save === "function") {
    await save(slot, data);
    return;
  }
  window.localStorage?.setItem(storageKey(slot), JSON.stringify(data));
}

export async function nativeLoad(slot) {
  const load = typeof window !== "undefined" ? window.CascaraNative?.load : null;
  if (typeof load === "function") return load(slot);
  const raw = window.localStorage?.getItem(storageKey(slot));
  return raw ? JSON.parse(raw) : null;
}

function storageKey(slot) {
  return `cascara:${slot || "autosave"}`;
}
