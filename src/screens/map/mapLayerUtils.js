import {
  aragorObjectName,
  caveClosedLayerName,
  caveOpenLayerName,
  decorYSortDefaultOffset,
  decorYSortLayerName
} from "./mapConfig.js";
import { normalizeLayerName } from "./mapUtils.js";

export function layerFlag(layer, propertyName) {
  const property = layer.properties?.find((candidate) => candidate.name === propertyName);
  return property?.value === true || property?.value === "true";
}

export function layerNumber(layer, propertyName, fallback = 0) {
  const property = layer.properties?.find((candidate) => candidate.name === propertyName);
  const value = property?.value ?? fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function isDecorUpLayer(layer) {
  return /^decor up ?\d*$/.test(normalizeLayerName(layer.name));
}

export function decorUpLayerRank(layer) {
  if (!isDecorUpLayer(layer)) return 0;
  const [, suffix] = normalizeLayerName(layer.name).match(/^decor up ?(\d*)$/) ?? [];
  return suffix ? Number(suffix) : 1;
}

export function aboveHeroLayerOrder(layer) {
  if (isDecorUpLayer(layer)) return 100 + decorUpLayerRank(layer);
  return 0;
}

export function isDecorYSortLayer(layer) {
  const name = normalizeLayerName(layer.name);
  return name === decorYSortLayerName
    || name.includes("ysort")
    || layerFlag(layer, "ySort");
}

export function isAboveHeroLayer(layer) {
  return isDecorUpLayer(layer) || isDecorYSortLayer(layer);
}

export function ySortOffset(layer) {
  const hasCustomOffset = layer.properties?.some((property) => property.name === "sortOffset");
  if (hasCustomOffset) return layerNumber(layer, "sortOffset", 0);
  return normalizeLayerName(layer.name) === decorYSortLayerName ? decorYSortDefaultOffset : 0;
}

export function layerOcclusionHeight(layer) {
  return Math.max(0, layerNumber(layer, "occlusionHeight", 0));
}

export function shouldDrawTileLayer({
  layer,
  collisionLayer,
  cloudLayer,
  isHumanEncounterActive
}) {
  if (layer.visible === false || layer.type !== "tilelayer" || layer === collisionLayer || layer === cloudLayer) {
    return false;
  }
  const layerName = normalizeLayerName(layer.name);
  const aragorDefeated = !isHumanEncounterActive(aragorObjectName);
  if (layerName === caveClosedLayerName) return !aragorDefeated;
  if (layerName === caveOpenLayerName) return aragorDefeated;
  return true;
}
