import { heroAnimations, mapCameraZoom, mapTabletCameraZoom, tileFlipFlags } from "./mapConfig.js";
import {
  drawChests as drawMapChests,
  drawHumanEncounterNpcs as drawMapHumanEncounterNpcs,
  drawMapNpcs as drawMapNpcSprites,
  drawPixelAnimations as drawMapPixelAnimations,
  drawRespawnPoints as drawMapRespawnPoints
} from "./mapObjectRenderers.js";
import { animationKey, positiveModulo } from "./mapUtils.js";

export function renderScale() {
  return Math.max(1, Math.floor((window.devicePixelRatio || 1) * 2));
}

export function cameraScale(host) {
  const isTabletLandscape = window.matchMedia("(orientation: landscape) and (pointer: coarse) and (min-height: 561px)").matches;
  return host.renderScale() * (isTabletLandscape ? mapTabletCameraZoom : mapCameraZoom);
}

export function updateCamera(host) {
  const scale = host.cameraScale();
  const viewWidth = host.nodes.canvas.width / scale;
  const viewHeight = host.nodes.canvas.height / scale;
  const mapWidth = host.map.width * host.map.tilewidth;
  const mapHeight = host.map.height * host.map.tileheight;
  host.camera.x = Math.max(0, Math.min(mapWidth - viewWidth, host.hero.x - viewWidth * 0.34));
  host.camera.y = Math.max(0, Math.min(mapHeight - viewHeight, host.hero.y - viewHeight * 0.62)) + host.cameraYOffset;
  host.markNearbyMinimapTiles();
}

export function heroScreenPosition(host) {
  const rect = host.nodes.canvas.getBoundingClientRect();
  const canvasToCss = rect.width / Math.max(1, host.nodes.canvas.width);
  const scale = host.cameraScale();
  return {
    x: rect.left + (host.hero.x - host.camera.x) * scale * canvasToCss,
    y: rect.top + (host.hero.y - host.camera.y) * scale * canvasToCss
  };
}

export function render(host, time) {
  const { canvas } = host.nodes;
  const ctx = host.ctx;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  const scale = host.cameraScale();
  ctx.scale(scale, scale);
  ctx.translate(-Math.round(host.camera.x), -Math.round(host.camera.y));
  if (host.onBeforeTileLayers) host.onBeforeTileLayers(ctx, time);
  host.drawTileLayers(time, { aboveHero: false });
  host.drawSimonTiles(time);
  host.drawRespawnPoints(time);
  host.drawChests(time, { ySortPass: "below" });
  host.drawMapNpcs(time, { ySortPass: "below" });
  host.drawHumanEncounterNpcs(time);
  host.drawHero(time);
  host.drawMapNpcs(time, { ySortPass: "above" });
  host.drawChests(time, { ySortPass: "above" });
  host.drawTileLayers(time, { aboveHero: true });
  host.drawPixelAnimations(time);
  host.drawCloudLayer(time);
  ctx.restore();
}

export function drawHumanEncounterNpcs(host, time) {
  drawMapHumanEncounterNpcs({
    ctx: host.ctx,
    time,
    encounters: host.activeHumanEncounters(),
    images: host.humanEncounterImages
  });
}

export function drawRespawnPoints(host, time) {
  drawMapRespawnPoints({
    ctx: host.ctx,
    time,
    image: host.respawnImage,
    respawnPoints: host.respawnPoints,
    discoveredRespawnIds: host.discoveredRespawnIds
  });
}

export function drawMapNpcs(host, time, { ySortPass }) {
  drawMapNpcSprites({
    ctx: host.ctx,
    time,
    mapNpcs: host.mapNpcs,
    heroY: host.hero.y,
    images: host.mapNpcImages,
    ySortPass
  });
}

export function drawChests(host, time, { ySortPass }) {
  drawMapChests({
    ctx: host.ctx,
    time,
    image: host.chestImage,
    chests: host.chests,
    heroY: host.hero.y,
    ySortPass,
    isChestOpen: (chest) => host.isChestOpen(chest)
  });
}

export function drawPixelAnimations(host, time) {
  drawMapPixelAnimations({
    ctx: host.ctx,
    time,
    pixelAnimationLayers: host.pixelAnimationLayers,
    resolveTile: (gid, frameTime) => host.resolveTile(gid, frameTime)
  });
}

export function drawTileLayers(host, time, { aboveHero = false } = {}) {
  host.map.layers
    .filter((layer) => host.shouldDrawTileLayer(layer))
    .filter((layer) => aboveHero
      ? host.isAboveHeroLayer(layer)
      : !host.isDecorUpLayer(layer) || host.layerOcclusionHeight(layer) > 0)
    .sort((left, right) => host.aboveHeroLayerOrder(left) - host.aboveHeroLayerOrder(right))
    .forEach((layer) => {
      const ySortPass = host.isDecorYSortLayer(layer)
        ? (aboveHero ? "above" : "below")
        : null;
      const occlusionPass = host.layerOcclusionHeight(layer) > 0 && host.isAboveHeroLayer(layer)
        ? (aboveHero ? "above" : "below")
        : null;
      host.drawTileLayer(layer, time, { ySortPass, occlusionPass });
      if (host.onAfterTileLayer) host.onAfterTileLayer(host.ctx, time, layer.name);
    });
}

export function drawTileLayer(host, layer, time, { ySortPass = null, occlusionPass = null } = {}) {
  const { tilewidth, tileheight } = host.map;
  const occlusionHeight = host.layerOcclusionHeight(layer);
  const layerFade = host.tileLayerFades.get(layer.name);
  const previousAlpha = host.ctx.globalAlpha;
  if (typeof layerFade === "number") {
    host.ctx.globalAlpha = previousAlpha * Math.max(0, Math.min(1, layerFade));
  }
  layer.data.forEach((rawGid, index) => {
    const gid = rawGid & ~tileFlipFlags;
    if (gid === 0) return;
    const tile = host.resolveTile(gid, time);
    if (!tile) return;
    const x = (index % layer.width) * tilewidth;
    const y = Math.floor(index / layer.width) * tileheight;
    if (ySortPass && occlusionPass !== "below") {
      const tileDepthY = y + tileheight + host.ySortOffset(layer);
      const isAboveHero = tileDepthY > host.hero.y;
      if ((ySortPass === "above") !== isAboveHero) return;
    }
    const drawX = x;
    const drawY = y + tileheight - tile.tileset.tileheight;
    if (occlusionPass === "above" && occlusionHeight > 0) {
      const clippedHeight = Math.min(tile.tileset.tileheight, occlusionHeight);
      const occlusionSide = host.layerOcclusionSide(layer);
      const sourceY = occlusionSide === "top"
        ? tile.sy
        : tile.sy + tile.tileset.tileheight - clippedHeight;
      const targetY = occlusionSide === "top"
        ? drawY
        : drawY + tile.tileset.tileheight - clippedHeight;
      host.ctx.drawImage(
        tile.tileset.image,
        tile.sx,
        sourceY,
        tile.tileset.tilewidth,
        clippedHeight,
        drawX,
        targetY,
        tile.tileset.tilewidth,
        clippedHeight
      );
      return;
    }
    host.ctx.drawImage(
      tile.tileset.image,
      tile.sx,
      tile.sy,
      tile.tileset.tilewidth,
      tile.tileset.tileheight,
      drawX,
      drawY,
      tile.tileset.tilewidth,
      tile.tileset.tileheight
    );
  });
  host.ctx.globalAlpha = previousAlpha;
}

export function drawCloudLayer(host, time) {
  const layer = host.cloudLayer;
  if (!layer || layer.visible === false) return;
  const opacity = Math.max(0, Math.min(1, host.layerNumber(layer, "opacity", layer.opacity ?? 1)));
  if (opacity <= 0) return;
  const speedX = host.layerNumber(layer, "speedX", 0);
  const speedY = host.layerNumber(layer, "speedY", 0);
  const { tilewidth, tileheight } = host.map;
  const repeatWidth = layer.width * tilewidth;
  const repeatHeight = layer.height * tileheight;
  if (repeatWidth <= 0 || repeatHeight <= 0) return;
  const offsetX = positiveModulo((time / 1000) * speedX, repeatWidth);
  const offsetY = positiveModulo((time / 1000) * speedY, repeatHeight);

  host.ctx.save();
  host.ctx.globalAlpha *= opacity;
  layer.data.forEach((rawGid, index) => {
    const gid = rawGid & ~tileFlipFlags;
    if (gid === 0) return;
    const tile = host.resolveTile(gid, time);
    if (!tile) return;
    const baseX = (index % layer.width) * tilewidth + offsetX;
    const baseY = Math.floor(index / layer.width) * tileheight + offsetY;
    const drawY = baseY + tileheight - tile.tileset.tileheight;
    [-repeatWidth, 0, repeatWidth].forEach((wrapX) => {
      [-repeatHeight, 0, repeatHeight].forEach((wrapY) => {
        host.ctx.drawImage(
          tile.tileset.image,
          tile.sx,
          tile.sy,
          tile.tileset.tilewidth,
          tile.tileset.tileheight,
          Math.round(baseX + wrapX),
          Math.round(drawY + wrapY),
          tile.tileset.tilewidth,
          tile.tileset.tileheight
        );
      });
    });
  });
  host.ctx.restore();
}

export function resolveTile(host, gid, time) {
  const tileset = host.tilesets.find((candidate) => gid >= candidate.firstgid && gid <= candidate.lastgid);
  if (!tileset) return null;
  const localId = gid - tileset.firstgid;
  const animatedId = host.resolveAnimatedTileId(tileset, localId, time);
  return {
    tileset,
    sx: (animatedId % tileset.columns) * tileset.tilewidth,
    sy: Math.floor(animatedId / tileset.columns) * tileset.tileheight
  };
}

export function resolveAnimatedTileId(tileset, localId, time) {
  const tile = tileset.tiles?.find?.((entry) => entry.id === localId);
  if (!tile?.animation?.length) return localId;
  const totalDuration = tile.animation.reduce((sum, frame) => sum + frame.duration, 0);
  let cursor = time % totalDuration;
  const frame = tile.animation.find((candidate) => {
    cursor -= candidate.duration;
    return cursor <= 0;
  });
  return frame?.tileid ?? localId;
}

export function drawHero(host, time) {
  if (host.heroHidden) return;
  if (host.heroRespawnAnimation) {
    const image = host.heroImages.respawn;
    const frame = host.heroRespawnFrame(time);
    const size = 32;
    host.ctx.drawImage(
      image,
      frame * size,
      0,
      size,
      size,
      Math.round(host.hero.x - size / 2),
      Math.round(host.hero.y - size + 4),
      size,
      size
    );
    return;
  }

  const moving = host.heroMoving;
  const key = animationKey(host.hero.direction, moving);
  const image = host.heroImages[key];
  const animation = heroAnimations[key];
  const frame = Math.floor(time / (moving ? 110 : 140)) % animation.frames;
  const size = 32;
  host.ctx.drawImage(
    image,
    frame * size,
    0,
    size,
    size,
    Math.round(host.hero.x - size / 2),
    Math.round(host.hero.y - size + 4),
    size,
    size
  );
}
