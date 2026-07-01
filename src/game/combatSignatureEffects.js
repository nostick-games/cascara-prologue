import { translatedSignatureName } from "./humanSignatures.js";

export function signatureName(t, signature) {
  return translatedSignatureName(t, signature);
}

export function signatureElementName(t, signature) {
  return t(`affix.type.${signature?.activeElement ?? "feu"}`);
}

export function signatureLogKey(signature, kind) {
  if (!signature) return kind === "ready" ? "log.signature_ready_generic" : "log.signature_charged_generic";
  return kind === "ready"
    ? (signature.readyLogKey ?? "log.signature_ready_generic")
    : (signature.chargeLogKey ?? "log.signature_charged_generic");
}

export function signatureLogParams(t, signature, ownerName) {
  return {
    name: ownerName,
    signature: signatureName(t, signature),
    element: signatureElementName(t, signature)
  };
}

export function signatureEffectKind(signature) {
  if (signature?.kind !== "triade") return signature?.kind;
  return {
    feu: "fire",
    eau: "water",
    vent: "wind"
  }[signature.activeElement] ?? "fire";
}

export function signatureEffectCanBeMitigated(kind) {
  return [
    "fire",
    "fireWater",
    "fireTactical",
    "fireWind",
    "assault",
    "wind",
    "windTactical",
    "waterWind",
    "lock",
    "alchemy"
  ].includes(kind);
}

export function signatureComponents(signature, kind) {
  const reinforcedElement = (element) => ({
    direct: [element],
    secondary: [element],
    utility: false
  });
  const simpleElement = (element) => ({
    direct: [element],
    secondary: [],
    utility: false
  });

  if (signature?.kind === "triade") return reinforcedElement(kind);

  const componentsByKind = {
    fire: signature.rank >= 2 ? reinforcedElement("fire") : simpleElement("fire"),
    water: signature.rank >= 2 ? reinforcedElement("water") : simpleElement("water"),
    wind: signature.rank >= 2 ? reinforcedElement("wind") : simpleElement("wind"),
    utility: { direct: [], secondary: [], utility: true },
    fireWater: { direct: ["fire", "water"], secondary: ["fire"], utility: false, reducedDirect: true },
    fireWind: { direct: ["fire", "wind"], secondary: ["wind"], utility: false, reducedDirect: true },
    waterWind: { direct: ["water", "wind"], secondary: ["wind"], utility: false, reducedDirect: true },
    fireTactical: { ...reinforcedElement("fire"), utility: true },
    waterTactical: { ...reinforcedElement("water"), utility: true },
    windTactical: { ...reinforcedElement("wind"), utility: true },
    alchemy: { direct: ["fire", "water"], secondary: ["fire"], utility: true },
    assault: { direct: ["fire", "wind"], secondary: ["fire"], utility: true, assaultBonus: true },
    lock: { direct: ["water", "wind"], secondary: ["wind"], utility: true }
  };

  return componentsByKind[kind] ?? { direct: [], secondary: [], utility: false };
}
