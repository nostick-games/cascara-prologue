import {
  defaultMapId,
  defaultRespawnType,
  discoveredRespawnTypes,
  doorTriggerPaddingX,
  doorTriggerPaddingY,
  doorsLayerName,
  encounterZonesLayerName,
  itemsLayerName,
  mapNpcDefaults,
  npcLayerName,
  npcTriggerRadius,
  pixelAnimationsLayerName,
  simonLayerName,
  teleportLayerName,
  tileFlipFlags
} from "./mapConfig.js";
import {
  finiteNumber,
  normalizeLayerName,
  propertiesFromObject
} from "./mapUtils.js";
import { assetPath } from "../../utils/assetPath.js";

export function tileOverlapsZone({ tileX, tileY, zone, tileWidth, tileHeight }) {
  const left = tileX * tileWidth;
  const top = tileY * tileHeight;
  const right = left + tileWidth;
  const bottom = top + tileHeight;
  return (
    left < zone.x + zone.width &&
    right > zone.x &&
    top < zone.y + zone.height &&
    bottom > zone.y
  );
}

export function pointInEncounterZone(x, y, zone) {
  return (
    x >= zone.x
    && x <= zone.x + zone.width
    && y >= zone.y
    && y <= zone.y + zone.height
  );
}

export function loadEncounterZones(map, encounterLayer) {
  const layer = map.layers.find(
    (candidate) => candidate.name === encounterZonesLayerName && candidate.type === "objectgroup"
  );
  const objectZones = (layer?.objects ?? []).map((object) => {
    const properties = propertiesFromObject(object);
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      id: properties.id ?? null,
      poolId: properties.poolId ?? null,
      minLevel: properties.minLevel,
      maxLevel: properties.maxLevel,
      encounterChance: properties.encounterChance
    };
  });
  return [
    ...objectZones,
    ...loadUntypedEncounterZones(map, encounterLayer, objectZones)
  ];
}

export function loadRespawnPoints(map) {
  const layer = map.layers.find(
    (candidate) => normalizeLayerName(candidate.name) === teleportLayerName && candidate.type === "objectgroup"
  );
  return (layer?.objects ?? [])
    .map((object) => {
      const properties = propertiesFromObject(object);
      const id = properties.id ?? object.name;
      const rawType = properties.type ?? object.type;
      const isNamedRespawn = typeof id === "string" && id !== "default_respawn" && id.endsWith("_respawn");
      const type = rawType || (isNamedRespawn ? "respawn_discovered" : null);
      const isSpawn = type === defaultRespawnType
        || discoveredRespawnTypes.has(type)
        || type === "spawn"
        || properties.spawn === true
        || Boolean(properties.id);
      if (!id || !isSpawn) return null;
      return {
        id,
        type,
        x: object.x + object.width / 2,
        y: object.y + object.height / 2,
        width: object.width,
        height: object.height,
        direction: properties.direction ?? "down",
        visible: object.visible !== false,
        discoverable: discoveredRespawnTypes.has(type) || properties.discoverableRespawn === true || isNamedRespawn
      };
    })
    .filter(Boolean);
}

export function loadDoors(map) {
  const layer = map.layers.find(
    (candidate) => normalizeLayerName(candidate.name) === doorsLayerName && candidate.type === "objectgroup"
  );
  return (layer?.objects ?? [])
    .map((object) => {
      const properties = propertiesFromObject(object);
      const type = properties.type ?? object.type;
      if (type !== "door" && !properties.targetMap) return null;
      const id = properties.id ?? object.name ?? `door_${object.id}`;
      const triggerPadding = finiteNumber(properties.triggerPadding, null);
      return {
        id,
        label: properties.label ?? id,
        targetMap: properties.targetMap ?? defaultMapId,
        targetSpawn: properties.targetSpawn ?? null,
        direction: properties.direction ?? null,
        triggerPaddingX: finiteNumber(properties.triggerPaddingX, triggerPadding ?? doorTriggerPaddingX),
        triggerPaddingY: finiteNumber(properties.triggerPaddingY, triggerPadding ?? doorTriggerPaddingY),
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height
      };
    })
    .filter(Boolean);
}

export function loadPixelAnimationLayers(map, layerNumber) {
  return map.layers
    .filter((layer) => normalizeLayerName(layer.name) === pixelAnimationsLayerName && layer.type === "objectgroup")
    .map((layer) => ({
      name: layer.name,
      opacity: layer.opacity ?? 1,
      visible: layer.visible !== false,
      sortOffset: layerNumber(layer, "sortOffset", 0),
      objects: (layer.objects ?? [])
        .filter((object) => (object.gid & ~tileFlipFlags) !== 0)
        .map((object) => ({
          id: object.id,
          gid: object.gid & ~tileFlipFlags,
          x: object.x,
          y: object.y,
          width: object.width,
          height: object.height,
          visible: object.visible !== false,
          opacity: Number(propertiesFromObject(object).opacity ?? 1)
        }))
    }))
    .filter((layer) => layer.objects.length > 0);
}

export function loadMapNpcs(map) {
  const layer = map.layers.find(
    (candidate) => normalizeLayerName(candidate.name) === npcLayerName && candidate.type === "objectgroup"
  );
  return (layer?.objects ?? [])
    .map((object) => {
      const properties = propertiesFromObject(object);
      const id = properties.id ?? object.name ?? `npc_${object.id}`;
      const defaults = mapNpcDefaults[id] ?? {};
      const type = properties.type || object.type || defaults.type;
      if (type !== "npc") return null;
      const spriteId = properties.sprite ?? defaults.sprite ?? id;
      const frameSize = finiteNumber(properties.frameSize ?? defaults.frameSize, 32);
      const frames = properties.frames == null && defaults.frames == null
        ? null
        : finiteNumber(properties.frames ?? defaults.frames, 1);
      return {
        id,
        displayName: properties.displayName ?? properties.name ?? null,
        dialogId: properties.dialog ?? properties.dialogId ?? defaults.dialogId ?? null,
        shopId: properties.shop ?? properties.shopId ?? defaults.shopId ?? null,
        serviceId: properties.service ?? properties.serviceId ?? defaults.serviceId ?? null,
        direction: properties.direction ?? "down",
        x: object.x + (object.width || 0) / 2,
        y: object.y + (object.height || 0),
        triggerRadius: finiteNumber(properties.triggerRadius, npcTriggerRadius),
        sprite: {
          src: assetPath(`assets/pnj/${spriteId}.png`),
          frameSize,
          frames,
          drawSize: finiteNumber(properties.drawSize ?? defaults.drawSize, frameSize),
          frameDurationMs: finiteNumber(properties.frameDuration ?? defaults.frameDuration, 140)
        }
      };
    })
    .filter(Boolean);
}

export function loadChests(map) {
  const layer = map.layers.find(
    (candidate) => normalizeLayerName(candidate.name) === itemsLayerName && candidate.type === "objectgroup"
  );
  return (layer?.objects ?? [])
    .map((object) => {
      const properties = propertiesFromObject(object);
      const objectName = object.name?.toLowerCase?.() ?? "";
      const objectType = object.type?.toLowerCase?.() ?? "";
      const contentType = properties.contentType?.toLowerCase?.() ?? "";
      const looksLikeChest = objectName.includes("chest") || objectName.includes("coffre") || objectType === "chest";
      if (!looksLikeChest && !properties.chestID && !properties.chestId) return null;
      const id = properties.chestID ?? properties.chestId ?? object.name ?? `chest_${object.id}`;
      return {
        id,
        openedFlag: properties.openedFlag ?? `${id}_opened`,
        contentType,
        contentId: properties.contentId ?? "gem",
        quantity: Number(properties.quantity ?? 1) || 1,
        x: object.x + object.width / 2,
        y: object.y + object.height,
        width: object.width,
        height: object.height,
        openingStartedAt: null
      };
    })
    .filter(Boolean);
}

export function loadSimonTiles(map) {
  const layer = map.layers.find(
    (candidate) => normalizeLayerName(candidate.name) === simonLayerName && candidate.type === "objectgroup"
  );
  return (layer?.objects ?? [])
    .map((object) => {
      const properties = propertiesFromObject(object);
      const id = properties.id ?? object.name ?? "";
      const normalizedId = String(id).toLowerCase();
      const color = normalizedId.replace(/^simon_/, "");
      const isOrigin = color === "origine" || color === "origin";
      const colorMap = {
        bleu: "blue",
        blue: "blue",
        orange: "orange",
        rouge: "red",
        red: "red",
        vert: "green",
        green: "green"
      };
      const key = isOrigin ? "origin" : colorMap[color];
      if (!key) return null;
      return {
        id,
        key,
        color: isOrigin ? null : key,
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
        centerX: object.x + object.width / 2,
        centerY: object.y + object.height / 2,
        visible: object.visible !== false
      };
    })
    .filter(Boolean);
}

export function loadUntypedEncounterZones(map, encounterLayer, objectZones) {
  if (!encounterLayer) return [];
  const { width, height } = encounterLayer;
  const visited = new Set();
  const zones = [];

  const tileKey = (x, y) => `${x}:${y}`;
  const hasEncounterTile = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    const gid = encounterLayer.data[y * width + x] ?? 0;
    return (gid & ~tileFlipFlags) !== 0;
  };
  const isCoveredByObjectZone = (x, y) => objectZones.some((zone) => tileOverlapsZone({
    tileX: x,
    tileY: y,
    zone,
    tileWidth: map.tilewidth,
    tileHeight: map.tileheight
  }));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = tileKey(x, y);
      if (visited.has(key) || !hasEncounterTile(x, y) || isCoveredByObjectZone(x, y)) continue;

      const stack = [{ x, y }];
      const component = [];
      visited.add(key);
      while (stack.length) {
        const current = stack.pop();
        component.push(current);
        [
          { x: current.x - 1, y: current.y },
          { x: current.x + 1, y: current.y },
          { x: current.x, y: current.y - 1 },
          { x: current.x, y: current.y + 1 }
        ].forEach((next) => {
          const nextKey = tileKey(next.x, next.y);
          if (
            visited.has(nextKey)
            || !hasEncounterTile(next.x, next.y)
            || isCoveredByObjectZone(next.x, next.y)
          ) {
            return;
          }
          visited.add(nextKey);
          stack.push(next);
        });
      }

      const minX = Math.min(...component.map((tile) => tile.x));
      const maxX = Math.max(...component.map((tile) => tile.x));
      const minY = Math.min(...component.map((tile) => tile.y));
      const maxY = Math.max(...component.map((tile) => tile.y));
      zones.push({
        x: minX * map.tilewidth,
        y: minY * map.tileheight,
        width: (maxX - minX + 1) * map.tilewidth,
        height: (maxY - minY + 1) * map.tileheight,
        id: `zone_neutre_${zones.length + 1}`,
        poolId: null,
        minLevel: null,
        maxLevel: null,
        encounterChance: null,
        synthetic: true
      });
    }
  }

  return zones;
}

export function encounterZoneSummaries(encounterZones) {
  const zonesById = new Map();
  encounterZones.forEach((zone) => {
    const key = zone.id ?? zone.poolId;
    if (!key) return;
    const existing = zonesById.get(key);
    if (!existing) {
      zonesById.set(key, {
        ...zone,
        left: zone.x,
        top: zone.y,
        right: zone.x + zone.width,
        bottom: zone.y + zone.height
      });
      return;
    }
    existing.left = Math.min(existing.left, zone.x);
    existing.top = Math.min(existing.top, zone.y);
    existing.right = Math.max(existing.right, zone.x + zone.width);
    existing.bottom = Math.max(existing.bottom, zone.y + zone.height);
    existing.x = existing.left;
    existing.y = existing.top;
    existing.width = existing.right - existing.left;
    existing.height = existing.bottom - existing.top;
  });

  return [...zonesById.values()].map((zone) => ({
    id: zone.id,
    poolId: zone.poolId,
    x: zone.x,
    y: zone.y,
    width: zone.width,
    height: zone.height,
    centerX: zone.x + zone.width / 2,
    centerY: zone.y + zone.height / 2
  }));
}
