import {
  chestSprite,
  humanEncounterFallbackConfig,
  humanEncounterSpriteById,
  respawnSprite
} from "./mapConfig.js";

export function drawHumanEncounterNpcs({ ctx, time, encounters, images }) {
  encounters.forEach((encounter) => {
    const sprite = humanEncounterSpriteById[encounter.id] ?? humanEncounterFallbackConfig.sprite;
    const image = images.get(sprite.src);
    if (!image) return;
    const frame = Math.floor(time / 140) % sprite.frames;
    const { frameSize, drawSize } = sprite;
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, encounter.opacity ?? 1));
    ctx.drawImage(
      image,
      frame * frameSize,
      0,
      frameSize,
      frameSize,
      Math.round(encounter.position.x - drawSize / 2),
      Math.round(encounter.position.y - drawSize / 2),
      drawSize,
      drawSize
    );
    ctx.restore();
  });
}

export function drawRespawnPoints({ ctx, time, image, respawnPoints, discoveredRespawnIds }) {
  if (!image) return;
  respawnPoints.forEach((point) => {
    if (!point.visible || !point.discoverable) return;
    if (discoveredRespawnIds.has(point.id)) return;
    const frame = Math.floor(time / respawnSprite.frameDurationMs) % respawnSprite.frames;
    ctx.drawImage(
      image,
      frame * respawnSprite.frameSize,
      0,
      respawnSprite.frameSize,
      respawnSprite.frameSize,
      Math.round(point.x - respawnSprite.drawSize / 2),
      Math.round(point.y - respawnSprite.drawSize / 2),
      respawnSprite.drawSize,
      respawnSprite.drawSize
    );
  });
}

export function drawMapNpcs({ ctx, time, mapNpcs, heroY, images, ySortPass }) {
  mapNpcs.forEach((npc) => {
    const isAboveHero = npc.y > heroY;
    if ((ySortPass === "above") !== isAboveHero) return;
    const image = images.get(npc.sprite.src);
    if (!image) return;
    const { frameSize, drawSize } = npc.sprite;
    const frames = npc.sprite.frames ?? Math.max(1, Math.floor(image.width / frameSize));
    const frame = Math.floor(time / npc.sprite.frameDurationMs) % frames;
    ctx.drawImage(
      image,
      frame * frameSize,
      0,
      frameSize,
      frameSize,
      Math.round(npc.x - drawSize / 2),
      Math.round(npc.y - drawSize),
      drawSize,
      drawSize
    );
  });
}

export function drawChests({ ctx, time, image, chests, heroY, ySortPass, isChestOpen }) {
  if (!image) return;
  chests.forEach((chest) => {
    const isAboveHero = chest.y > heroY;
    if ((ySortPass === "above") !== isAboveHero) return;
    const elapsedOpening = chest.openingStartedAt === null ? null : Math.max(0, time - chest.openingStartedAt);
    const frame = elapsedOpening === null
      ? (isChestOpen(chest) ? chestSprite.frames - 1 : 0)
      : Math.min(chestSprite.frames - 1, Math.floor(elapsedOpening / chestSprite.frameDurationMs));
    ctx.drawImage(
      image,
      frame * chestSprite.frameSize,
      0,
      chestSprite.frameSize,
      chestSprite.frameSize,
      Math.round(chest.x - chestSprite.drawSize / 2),
      Math.round(chest.y - chestSprite.drawSize),
      chestSprite.drawSize,
      chestSprite.drawSize
    );
  });
}

export function drawPixelAnimations({ ctx, time, pixelAnimationLayers, resolveTile }) {
  pixelAnimationLayers.forEach((layer) => {
    if (!layer.visible || layer.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, layer.opacity));
    layer.objects.forEach((object) => {
      if (!object.visible || object.opacity <= 0) return;
      const tile = resolveTile(object.gid, time);
      if (!tile) return;
      const drawWidth = object.width || tile.tileset.tilewidth;
      const drawHeight = object.height || tile.tileset.tileheight;
      ctx.save();
      ctx.globalAlpha *= Math.max(0, Math.min(1, object.opacity));
      ctx.drawImage(
        tile.tileset.image,
        tile.sx,
        tile.sy,
        tile.tileset.tilewidth,
        tile.tileset.tileheight,
        Math.round(object.x),
        Math.round(object.y - drawHeight),
        drawWidth,
        drawHeight
      );
      ctx.restore();
    });
    ctx.restore();
  });
}
