import {
  minimapDiscoveryRadiusTiles,
  tileFlipFlags
} from "./mapConfig.js";

export function markNearbyMinimapTiles({ map, hero, discoveredTiles }) {
  if (!map) return;
  const heroTileX = Math.floor(hero.x / map.tilewidth);
  const heroTileY = Math.floor(hero.y / map.tileheight);
  const minTileX = Math.max(0, heroTileX - minimapDiscoveryRadiusTiles);
  const minTileY = Math.max(0, heroTileY - minimapDiscoveryRadiusTiles);
  const maxTileX = Math.min(map.width - 1, heroTileX + minimapDiscoveryRadiusTiles);
  const maxTileY = Math.min(map.height - 1, heroTileY + minimapDiscoveryRadiusTiles);
  const radiusSquared = minimapDiscoveryRadiusTiles * minimapDiscoveryRadiusTiles;

  for (let y = minTileY; y <= maxTileY; y += 1) {
    for (let x = minTileX; x <= maxTileX; x += 1) {
      const dx = x - heroTileX;
      const dy = y - heroTileY;
      if (dx * dx + dy * dy > radiusSquared) continue;
      discoveredTiles.add(`${x}:${y}`);
    }
  }
}

export function minimapTerrainModel({ map, collisionLayer, encounterLayer, cloudLayer, tilesets }) {
  const terrain = new Array(map.width * map.height).fill("water");
  const drawableLayers = map.layers.filter((layer) => (
    layer.visible !== false
    && layer.type === "tilelayer"
    && layer !== collisionLayer
    && layer !== encounterLayer
    && layer !== cloudLayer
  ));

  drawableLayers.forEach((layer) => {
    layer.data.forEach((rawGid, index) => {
      const gid = rawGid & ~tileFlipFlags;
      if (gid === 0) return;
      terrain[index] = isWaterGid(tilesets, gid) ? "water" : "land";
    });
  });

  return terrain;
}

export function isWaterGid(tilesets, gid) {
  const tileset = tilesets.find((candidate) => gid >= candidate.firstgid && gid <= candidate.lastgid);
  if (!tileset) return false;
  const haystack = `${tileset.name ?? ""} ${tileset.image?.src ?? ""} ${tileset.image ?? ""}`.toLowerCase();
  return haystack.includes("water");
}

export function getMinimapModel({
  loaded,
  map,
  minimapModel,
  discoveredTiles,
  discoveredRespawnIds,
  respawnPoints,
  hero,
  buildTerrain,
  buildZones
}) {
  if (!loaded) return null;
  const baseModel = minimapModel ?? {
    width: map.width,
    height: map.height,
    tileWidth: map.tilewidth,
    tileHeight: map.tileheight,
    terrain: buildTerrain(),
    zones: buildZones()
  };
  return {
    baseModel,
    model: {
      ...baseModel,
      discoveredTiles: new Set(discoveredTiles),
      respawns: respawnPoints
        .filter((point) => point.discoverable && discoveredRespawnIds.has(point.id))
        .map((point) => ({
          id: point.id,
          tileX: clampTile(map, Math.floor(point.x / map.tilewidth), "x"),
          tileY: clampTile(map, Math.floor(point.y / map.tileheight), "y")
        })),
      playerTile: {
        x: clampTile(map, Math.floor(hero.x / map.tilewidth), "x"),
        y: clampTile(map, Math.floor(hero.y / map.tileheight), "y")
      }
    }
  };
}

function clampTile(map, value, axis) {
  const max = axis === "x" ? map.width - 1 : map.height - 1;
  return Math.max(0, Math.min(max, value));
}
