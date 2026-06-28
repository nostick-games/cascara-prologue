import { assetPath } from "../utils/assetPath.js";
import { loadImage } from "./map/mapUtils.js";
import { playNameInputDialog } from "../ui/mapNameInputDialog.js";

const TILE = 16;
const BOAT_TARGET_TILE_X = 5;
const NORA_TILE_X = 7;
const FLAMILLON_TILE_X = NORA_TILE_X;
const BOAT_SPEED = 28;
const NORA_SPEED = 38;
const FLAMILLON_SPEED = 160;
const FLAMILLON_BOUNCE_HEIGHT = 22;
const FLAMILLON_BOUNCE_SPEED = 90;
const BOAT_FRAMES = 4;
const BOAT_FRAME_SIZE = 48;
const NORA_WALK_FRAMES = 6;
const NORA_IDLE_FRAMES = 12;
const NORA_FRAME_SIZE = 32;
const FLAMILLON_FRAMES = 6;
const FLAMILLON_FRAME_SIZE = 128;
const FRAME_MS_BOAT = 160;
const FRAME_MS_NORA_WALK = 130;
const FRAME_MS_NORA_IDLE = 110;
const FRAME_MS_FLAMILLON = 150;

export class TutorialScreen {
  constructor({ mapScreen, overlayCanvas, t, nameInputNodes, quickActionButtons = [], baseProgression = null }) {
    this.mapScreen = mapScreen;
    this.overlayCanvas = overlayCanvas;
    this.t = t;
    this.nameInputNodes = nameInputNodes;
    this.quickActionButtons = quickActionButtons;
    this.baseProgression = baseProgression;
    this.running = false;
    this.boatImg = null;
    this.noraWalkImg = null;
    this.noraIdleImg = null;
    this.flamillonImg = null;
    this.boatX = 0;
    this.boatY = 0;
    this.noraX = 0;
    this.noraY = 0;
    this.flamillonX = 0;
    this.flamillonY = 0;
    this.noraVisible = false;
    this.noraIdling = false;
    this.flamillonVisible = false;
  }

  worldToCanvas(worldX, worldY) {
    const { mapScreen } = this;
    const scale = mapScreen.cameraScale();
    return {
      x: Math.round((worldX - mapScreen.camera.x) * scale),
      y: Math.round((worldY - mapScreen.camera.y) * scale)
    };
  }

  syncOverlaySize() {
    const src = this.mapScreen.nodes.canvas;
    const dst = this.overlayCanvas;
    if (dst.width !== src.width || dst.height !== src.height) {
      dst.width = src.width;
      dst.height = src.height;
    }
  }

  drawBoatOnMap(ctx, time) {
    if (!this.boatImg) return;
    const frame = Math.floor(time / FRAME_MS_BOAT) % BOAT_FRAMES;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.boatImg,
      frame * BOAT_FRAME_SIZE, 0, BOAT_FRAME_SIZE, BOAT_FRAME_SIZE,
      Math.round(this.boatX - BOAT_FRAME_SIZE / 2),
      Math.round(this.boatY - BOAT_FRAME_SIZE / 2),
      BOAT_FRAME_SIZE, BOAT_FRAME_SIZE
    );
  }

  renderOverlay(time) {
    this.syncOverlaySize();
    const ctx = this.overlayCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    const scale = this.mapScreen.cameraScale();

    if (this.noraVisible) {
      const img = this.noraIdling ? this.noraIdleImg : this.noraWalkImg;
      if (img) {
        const frames = this.noraIdling ? NORA_IDLE_FRAMES : NORA_WALK_FRAMES;
        const frameMs = this.noraIdling ? FRAME_MS_NORA_IDLE : FRAME_MS_NORA_WALK;
        const frame = Math.floor(time / frameMs) % frames;
        const pos = this.worldToCanvas(this.noraX, this.noraY);
        const drawSize = Math.round(NORA_FRAME_SIZE * scale);
        ctx.drawImage(
          img,
          frame * NORA_FRAME_SIZE, 0, NORA_FRAME_SIZE, NORA_FRAME_SIZE,
          pos.x - Math.round(drawSize / 2),
          pos.y - Math.round(drawSize / 2),
          drawSize, drawSize
        );
      }
    }

    if (this.flamillonVisible && this.flamillonImg) {
      const frame = Math.floor(time / FRAME_MS_FLAMILLON) % FLAMILLON_FRAMES;
      const pos = this.worldToCanvas(this.flamillonX, this.flamillonY);
      const drawSize = Math.round(FLAMILLON_FRAME_SIZE * scale);
      ctx.drawImage(
        this.flamillonImg,
        frame * FLAMILLON_FRAME_SIZE, 0, FLAMILLON_FRAME_SIZE, FLAMILLON_FRAME_SIZE,
        pos.x - Math.round(drawSize / 2),
        pos.y - Math.round(drawSize / 2),
        drawSize, drawSize
      );
    }
  }

  startRenderLoop() {
    const step = (time) => {
      if (!this.running) return;
      this.renderOverlay(time);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  animateFlamillonY(target, speed) {
    const direction = target > this.flamillonY ? 1 : -1;
    let resolveAnim;
    const promise = new Promise((resolve) => { resolveAnim = resolve; });
    let lastTime = null;
    const step = (time) => {
      if (!this.running) { resolveAnim(); return; }
      if (lastTime === null) lastTime = time;
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      const next = this.flamillonY + direction * speed * delta;
      const reached = direction > 0 ? next >= target : next <= target;
      this.flamillonY = reached ? target : next;
      if (reached) { resolveAnim(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return promise;
  }

  async animateFlamillonJumping(landY, numBounces = 4) {
    const startY = this.flamillonY;
    const totalDist = landY - startY;
    const segmentSize = totalDist / numBounces;
    for (let i = 0; i < numBounces - 1; i++) {
      const segTarget = startY + segmentSize * (i + 1);
      await this.animateFlamillonY(segTarget, FLAMILLON_SPEED);
      await this.animateFlamillonY(segTarget - FLAMILLON_BOUNCE_HEIGHT, FLAMILLON_BOUNCE_SPEED);
      await this.animateFlamillonY(segTarget, FLAMILLON_BOUNCE_SPEED * 1.2);
    }
    // Dernier segment avec rebond final à l'atterrissage
    await this.animateFlamillonY(landY, FLAMILLON_SPEED);
    await this.animateFlamillonY(landY - FLAMILLON_BOUNCE_HEIGHT, FLAMILLON_BOUNCE_SPEED);
    await this.animateFlamillonY(landY, FLAMILLON_BOUNCE_SPEED * 1.3);
  }

  animateTo(axis, target, speed) {
    let resolveAnim;
    const promise = new Promise((resolve) => { resolveAnim = resolve; });
    let lastTime = null;
    const step = (time) => {
      if (!this.running) { resolveAnim(); return; }
      if (lastTime === null) lastTime = time;
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      let current, next;
      if (axis === "x") {
        current = this.boatX;
        next = Math.min(current + speed * delta, target);
        this.boatX = next;
      } else if (axis === "y") {
        current = this.noraY;
        next = Math.min(current + speed * delta, target);
        this.noraY = next;
      }
      if (next >= target) { resolveAnim(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return promise;
  }

  clearOverlay() {
    this.syncOverlaySize();
    const ctx = this.overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
  }

  wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async start() {
    const { mapScreen, t } = this;

    const [boatImg, noraWalkImg, noraIdleImg, flamillonImg] = await Promise.all([
      loadImage(assetPath("assets/tuto/boat_hero.png")),
      loadImage(assetPath("assets/pnj/nora_walk_down.png")),
      loadImage(assetPath("assets/pnj/nora_idle_left.png")),
      loadImage(assetPath("assets/creatures/flamillon.png"))
    ]);
    this.boatImg = boatImg;
    this.noraWalkImg = noraWalkImg;
    this.noraIdleImg = noraIdleImg;
    this.flamillonImg = flamillonImg;

    mapScreen.onAfterTileLayer = (ctx, time, layerName) => {
      if (layerName === "Animations") this.drawBoatOnMap(ctx, time);
    };

    mapScreen.lockMapDialogInput();
    this.quickActionButtons.forEach((b) => { if (b) b.hidden = true; });
    this.running = true;

    const scale = mapScreen.cameraScale();
    const viewHeightWorld = mapScreen.nodes.canvas.height / scale;
    const mapHeightWorld = mapScreen.map.height * TILE;
    const boatTargetWorldX = (BOAT_TARGET_TILE_X + 0.5) * TILE;
    const boatWorldY = mapHeightWorld + viewHeightWorld * 0.28 - 4 * TILE;
    const noraWorldX = (NORA_TILE_X + 0.5) * TILE;
    const noraTargetWorldY = boatWorldY;
    const flamillonWorldX = (FLAMILLON_TILE_X + 0.5) * TILE;

    this.boatX = mapScreen.camera.x - BOAT_FRAME_SIZE;
    this.boatY = boatWorldY;
    this.noraX = noraWorldX;
    this.noraY = mapScreen.camera.y - NORA_FRAME_SIZE;
    this.flamillonX = flamillonWorldX;
    this.flamillonY = mapScreen.camera.y - FLAMILLON_FRAME_SIZE;
    this.noraVisible = false;
    this.noraIdling = false;
    this.flamillonVisible = false;

    this.startRenderLoop();

    // Phase 1 : bateau glisse depuis la gauche
    await this.animateTo("x", boatTargetWorldX, BOAT_SPEED);

    // Phase 2 : Nora descend depuis le haut
    this.noraVisible = true;
    await this.animateTo("y", noraTargetWorldY, NORA_SPEED);
    this.noraIdling = true;

    // Phase 3 : dialogue Nora intro
    const noraName = t("map.npc.nora.name");
    await mapScreen.playMessageDialog({
      message: `${noraName} : ${t("tuto.nora.intro.1")}`,
      messageHighlights: [noraName, "Cascara", "Veyr"],
      autoHide: true
    });

    // Phase 4 : saisie du nom du héros
    mapScreen.hideDialog();
    const { frame, prompt, input, okButton } = this.nameInputNodes;
    const heroName = await playNameInputDialog({
      frame, prompt, input, okButton,
      defaultName: "Hero",
      t
    });

    // Phase 5 : dialogue post-nom
    await mapScreen.playMessageDialog({
      message: `${noraName} : ${t("tuto.nora.intro.2", { hero: heroName })}`,
      messageHighlights: [noraName, heroName],
      autoHide: true
    });
    await mapScreen.playMessageDialog({
      message: t("tuto.nora.intro.2b"),
      autoHide: true
    });
    mapScreen.hideDialog();

    // Phase 6 : pause puis Flamillon apparaît en haut du viewport et saute
    await this.wait(1400);
    this.flamillonY = mapScreen.camera.y;
    this.flamillonVisible = true;
    await this.animateFlamillonJumping(noraTargetWorldY);

    // Phase 7 : Flamillon est là — on laisse les sprites visibles pour la transition
    // main.js appelle stop() après la transition (écran noir)
    mapScreen.unlockMapDialogInput();

    return heroName;
  }

  stop() {
    this.running = false;
    this.clearOverlay();
    this.mapScreen.onAfterTileLayer = null;
    this.quickActionButtons.forEach((b) => { if (b) b.hidden = false; });
  }

  animateCameraOffset(target, speed) {
    const { mapScreen } = this;
    let resolveAnim;
    const promise = new Promise((resolve) => { resolveAnim = resolve; });
    let lastTime = null;
    const direction = target > mapScreen.cameraYOffset ? 1 : -1;
    const step = (time) => {
      if (lastTime === null) lastTime = time;
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      mapScreen.cameraYOffset += direction * speed * delta;
      const reached = direction > 0
        ? mapScreen.cameraYOffset >= target
        : mapScreen.cameraYOffset <= target;
      if (reached) {
        mapScreen.cameraYOffset = target;
        mapScreen.updateCamera();
        resolveAnim();
        return;
      }
      mapScreen.updateCamera();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return promise;
  }

  animateNoraUp(speed) {
    let resolveAnim;
    const promise = new Promise((resolve) => { resolveAnim = resolve; });
    let lastTime = null;
    const { mapScreen } = this;
    const scale = mapScreen.cameraScale();
    const offscreenY = mapScreen.camera.y - NORA_FRAME_SIZE;
    const step = (time) => {
      if (!this.running) { resolveAnim(); return; }
      if (lastTime === null) lastTime = time;
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      this.noraY -= speed * delta;
      if (this.noraY <= offscreenY) { resolveAnim(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return promise;
  }

  async playEpilogue(heroName, mapReadyPromise = null) {
    const { mapScreen, t } = this;

    const [noraWalkUpImg, noraIdleImg] = await Promise.all([
      loadImage(assetPath("assets/pnj/nora_walk_up.png")),
      loadImage(assetPath("assets/pnj/nora_idle_left.png")),
      ...(mapReadyPromise ? [mapReadyPromise] : [])
    ]);

    mapScreen.nodes.canvas.style.background = "#0095E9";
    mapScreen.cameraYOffset = 2 * TILE;
    mapScreen.updateCamera();

    const heroWorldX = mapScreen.hero.x - TILE;
    const heroWorldY = mapScreen.hero.y;

    this.noraIdleImg = noraIdleImg;
    this.noraX = heroWorldX + NORA_FRAME_SIZE;
    this.noraY = heroWorldY;
    this.noraVisible = true;
    this.noraIdling = true;
    this.flamillonVisible = false;

    this.overlayCanvas.hidden = false;
    this.running = true;
    this.startRenderLoop();

    mapScreen.lockMapDialogInput();
    const noraName = t("map.npc.nora.name");
    await mapScreen.playMessageDialog({
      message: `${noraName} : ${t("tuto.epilogue.nora", { hero: heroName })}`,
      messageHighlights: [noraName, heroName],
      autoHide: true
    });
    this.baseProgression.availableXp = (this.baseProgression.availableXp ?? 0) + 5;
    await mapScreen.playMessageDialog({
      message: t("tuto.epilogue.gems"),
      autoHide: true
    });
    mapScreen.hideDialog();

    // Nora part vers le haut avec le spritesheet walk_up
    this.noraWalkImg = noraWalkUpImg;
    this.noraIdling = false;
    await this.animateNoraUp(NORA_SPEED);

    this.clearOverlay();
    this.overlayCanvas.hidden = true;
    await this.animateCameraOffset(0, 120);
    this.running = false;
    mapScreen.unlockMapDialogInput();
    this.quickActionButtons.forEach((b) => { if (b) b.hidden = false; });
  }
}
