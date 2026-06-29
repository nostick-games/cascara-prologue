import { heroCollisionBox, simonTileSprites } from "./mapConfig.js";
import { nativeHaptic } from "../../utils/nativeBridge.js";

const simonOriginTriggerRadius = 3;
const simonColors = ["green", "blue", "orange", "red"];

export function isSimonLockedChest(chest) {
  return chest.id === "puits_chest_01";
}

export function simonSolvedFlag(chest) {
  return `${chest.openedFlag}_simon_solved`;
}

export function isSimonPuzzleSolved(host, chest) {
  return host.isChestOpened(simonSolvedFlag(chest));
}

export function simonOriginTile(host) {
  return host.simonTiles.find((tile) => tile.key === "origin") ?? null;
}

export function simonColorTiles(host) {
  return host.simonTiles.filter((tile) => tile.color);
}

export function isHeroOnSimonTile(host, tile, { padding = 5 } = {}) {
  if (!tile) return false;
  const pointX = host.hero.x;
  const pointY = host.hero.y + heroCollisionBox.bottomOffset;
  return pointX >= tile.x - padding
    && pointX <= tile.x + tile.width + padding
    && pointY >= tile.y - padding
    && pointY <= tile.y + tile.height + padding;
}

export function currentSimonColorTile(host) {
  return simonColorTiles(host).find((tile) => isHeroOnSimonTile(host, tile, { padding: 5 })) ?? null;
}

export function isHeroCenteredOnSimonOrigin(host) {
  const tile = simonOriginTile(host);
  if (!tile) return false;
  const pointX = host.hero.x;
  const pointY = host.hero.y - 12;
  return Math.abs(pointX - tile.centerX) <= simonOriginTriggerRadius
    && Math.abs(pointY - tile.centerY) <= simonOriginTriggerRadius;
}

export function updateSimonPuzzle(host) {
  const puzzle = host.activeSimonPuzzle;
  if (!puzzle) return false;
  const now = performance.now();
  if (puzzle.phase === "waitingOrigin" && isHeroCenteredOnSimonOrigin(host)) {
    launchSimonSequence(host, puzzle);
    return true;
  }
  if (puzzle.phase !== "listening") return true;

  const tile = currentSimonColorTile(host);
  if (!tile) {
    puzzle.holdColor = null;
    puzzle.holdStartedAt = 0;
    puzzle.holdConsumed = false;
    return true;
  }
  if (puzzle.holdColor !== tile.color) {
    puzzle.holdColor = tile.color;
    puzzle.holdStartedAt = now;
    puzzle.holdConsumed = false;
    return true;
  }
  if (puzzle.holdConsumed || now - puzzle.holdStartedAt < 280) return true;
  puzzle.holdConsumed = true;
  resolveSimonInput(host, tile.color);
  return true;
}

export async function launchSimonSequence(host, puzzle) {
  if (!puzzle || puzzle.phase !== "waitingOrigin") return;
  const token = puzzle.token;
  const sequence = puzzle.sequences[puzzle.stage];
  puzzle.phase = "showing";
  puzzle.inputIndex = 0;
  puzzle.holdColor = null;
  puzzle.holdStartedAt = 0;
  puzzle.holdConsumed = false;
  host.inputLocked = true;
  host.heroMoving = false;
  host.keys.clear();
  host.resetJoystick();
  nativeHaptic("medium");
  await host.delay(320);
  for (const color of sequence) {
    if (!isCurrentSimonPuzzle(host, token)) return;
    setSimonFlash(host, color, { durationMs: 620 });
    nativeHaptic("light");
    await host.delay(680);
    await host.delay(120);
  }
  if (!isCurrentSimonPuzzle(host, token)) return;
  puzzle.phase = "listening";
  host.inputLocked = false;
}

export function resolveSimonInput(host, color) {
  const puzzle = host.activeSimonPuzzle;
  if (!puzzle || puzzle.phase !== "listening") return;
  const expected = puzzle.sequences[puzzle.stage][puzzle.inputIndex];
  if (color !== expected) {
    failSimonPuzzle(host, color);
    return;
  }
  nativeHaptic("light");
  setSimonFlash(host, color, { durationMs: 320 });
  puzzle.inputIndex += 1;
  if (puzzle.inputIndex >= puzzle.sequences[puzzle.stage].length) {
    completeSimonStage(host);
  }
}

export async function completeSimonStage(host) {
  const puzzle = host.activeSimonPuzzle;
  if (!puzzle || puzzle.phase === "resolving") return;
  const token = puzzle.token;
  puzzle.phase = "resolving";
  host.inputLocked = true;
  host.heroMoving = false;
  host.keys.clear();
  host.resetJoystick();
  await host.delay(420);
  if (!isCurrentSimonPuzzle(host, token)) return;
  nativeHaptic("success");

  const isLastStage = puzzle.stage >= puzzle.sequences.length - 1;
  const messageKey = isLastStage
    ? "map.simon.complete"
    : puzzle.stage === 0
      ? "map.simon.stage_1_clear"
      : "map.simon.stage_2_clear";
  if (isLastStage) {
    host.onMapFlagUnlocked(puzzle.solvedFlag);
  }
  await host.playMessageDialog({
    message: host.t(messageKey),
    messageHighlights: ["Echo"]
  });
  if (!isCurrentSimonPuzzle(host, token)) return;
  if (isLastStage) {
    host.activeSimonPuzzle = null;
    host.simonFlash = null;
    host.encounterPaused = false;
    host.inputLocked = false;
    return;
  }
  puzzle.stage += 1;
  puzzle.phase = "waitingOrigin";
  puzzle.inputIndex = 0;
  puzzle.holdColor = null;
  puzzle.holdStartedAt = 0;
  puzzle.holdConsumed = false;
  host.inputLocked = false;
}

export async function failSimonPuzzle(host, color) {
  const puzzle = host.activeSimonPuzzle;
  if (!puzzle || puzzle.phase === "resolving") return;
  const token = puzzle.token;
  puzzle.phase = "resolving";
  host.inputLocked = true;
  host.heroMoving = false;
  host.keys.clear();
  host.resetJoystick();
  nativeHaptic("error");
  setSimonFlash(host, color, { durationMs: 420, black: true });
  await host.delay(500);
  if (!isCurrentSimonPuzzle(host, token)) return;
  await host.playMessageDialog({
    message: host.t("map.simon.fail"),
    messageHighlights: ["Echo"]
  });
  if (!isCurrentSimonPuzzle(host, token)) return;
  host.activeSimonPuzzle = null;
  host.simonFlash = null;
  host.encounterPaused = false;
  host.inputLocked = false;
}

export function isCurrentSimonPuzzle(host, token) {
  return host.activeSimonPuzzle?.token === token;
}

export function setSimonFlash(host, color, { durationMs = 500, black = false } = {}) {
  host.simonFlash = {
    color,
    black,
    startedAt: performance.now(),
    durationMs
  };
}

export function randomSimonSequence(length) {
  return Array.from({ length }, () => simonColors[Math.floor(Math.random() * simonColors.length)]);
}

export async function startSimonPuzzleForChest(host, chest) {
  if (!simonOriginTile(host) || simonColorTiles(host).length < 4) {
    await host.playMessageDialog({
      message: host.t("map.simon.fail"),
      messageHighlights: ["Echo"]
    });
    host.encounterPaused = false;
    host.inputLocked = false;
    return;
  }
  await host.playMessageDialog({
    message: host.t("map.simon.chest_locked")
  });
  await host.playMessageDialog({
    message: host.t("map.simon.locked_intro"),
    messageHighlights: ["Echo"]
  });
  host.activeSimonPuzzle = {
    chestId: chest.id,
    solvedFlag: simonSolvedFlag(chest),
    token: Symbol(chest.id),
    stage: 0,
    phase: "waitingOrigin",
    sequences: [
      ["green", "blue", "orange", "red"],
      randomSimonSequence(4),
      randomSimonSequence(6)
    ],
    inputIndex: 0,
    holdColor: null,
    holdStartedAt: 0,
    holdConsumed: false
  };
  host.encounterPaused = true;
  host.inputLocked = false;
  host.heroMoving = false;
  host.keys.clear();
  host.resetJoystick();
}

export function drawSimonTiles(host, time) {
  if (!host.simonTiles.length) return;
  const ctx = host.ctx;
  const active = Boolean(host.activeSimonPuzzle);
  host.simonTiles.forEach((tile) => {
    if (!tile.visible) return;
    const sprite = simonTileSprites[tile.key];
    const image = host.simonTileImages.get(tile.key);
    if (!sprite || !image) return;
    const drawSize = sprite.drawSize;
    const drawX = Math.round(tile.centerX - drawSize / 2);
    const drawY = Math.round(tile.centerY - drawSize / 2);
    ctx.drawImage(image, drawX, drawY, drawSize, drawSize);
    if (!tile.color || !active) return;

    const flash = host.simonFlash;
    const isFlashing = flash?.color === tile.color;
    const progress = isFlashing
      ? Math.max(0, Math.min(1, (time - flash.startedAt) / flash.durationMs))
      : 1;
    const intensity = isFlashing ? 1 - Math.abs(progress * 2 - 1) : 0;
    const baseAlpha = 0.66;
    const overlayAlpha = flash?.black && isFlashing
      ? baseAlpha + intensity * (0.96 - baseAlpha)
      : baseAlpha * (1 - intensity);

    if (overlayAlpha <= 0.01) return;
    const overlay = simonTileOverlayImage(host, tile.key, image, drawSize);
    ctx.save();
    ctx.globalAlpha = overlayAlpha;
    ctx.drawImage(overlay, drawX, drawY, drawSize, drawSize);
    ctx.restore();
  });
}

export function simonTileOverlayImage(host, key, image, drawSize) {
  const cacheKey = `${key}:${drawSize}`;
  const cached = host.simonTileOverlayImages.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = drawSize;
  canvas.height = drawSize;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, drawSize, drawSize);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(image, 0, 0, drawSize, drawSize);
  ctx.globalCompositeOperation = "source-over";
  host.simonTileOverlayImages.set(cacheKey, canvas);
  return canvas;
}
