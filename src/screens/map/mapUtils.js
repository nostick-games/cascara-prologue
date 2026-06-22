import {
  defaultMapId,
  mapBasePath
} from "./mapConfig.js";

export function mapUrlForId(mapId = defaultMapId) {
  return `${mapBasePath}${mapId}.tmj`;
}

export function propertiesFromObject(object) {
  return Object.fromEntries((object.properties ?? []).map((property) => [property.name, property.value]));
}

export function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });
}

export function animationKey(direction, moving) {
  const suffix = direction.charAt(0).toUpperCase() + direction.slice(1);
  return `${moving ? "walk" : "idle"}${suffix}`;
}

export function normalizeLayerName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function positiveModulo(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}
