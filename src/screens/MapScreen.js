import {
  chestSprite,
  cloudLayerName,
  collisionLayerName,
  decorUpLayerName,
  defaultMapId,
  defaultRespawnType,
  directionByKey,
  doorTriggerCooldownMs,
  doorsLayerName,
  encounterChance,
  encounterLayerName,
  heroAnimations,
  heroCollisionBox,
  heroName,
  heroRespawnFrameTimeline,
  heroSpawnTile,
  humanEncounterConfigById,
  humanEncounterConfigs,
  humanEncounterFallbackConfig,
  humanEncounterFallbackId,
  humanEncounterImageSources,
  humanEncounterNudgeSpeed,
  humanEncounterTriggerBox,
  joystickDeadZone,
  joystickMaxDistance,
  mapCameraZoom,
  npcLayerName,
  respawnSprite,
  respawnTriggerPaddingX,
  respawnTriggerPaddingY,
  tileFlipFlags
} from "./map/mapConfig.js";
import {
  encounterZoneSummaries as summarizeEncounterZones,
  loadChests as loadMapChests,
  loadDoors as loadMapDoors,
  loadEncounterZones as loadMapEncounterZones,
  loadMapNpcs as loadMapNpcObjects,
  loadPixelAnimationLayers as loadMapPixelAnimationLayers,
  loadRespawnPoints as loadMapRespawnPoints,
  loadUntypedEncounterZones as loadMapUntypedEncounterZones,
  pointInEncounterZone as isPointInEncounterZone,
  tileOverlapsZone as doesTileOverlapZone
} from "./map/mapObjectLoaders.js";
import {
  aboveHeroLayerOrder as getAboveHeroLayerOrder,
  decorUpLayerRank as getDecorUpLayerRank,
  isAboveHeroLayer as isLayerAboveHero,
  isDecorUpLayer as isLayerDecorUp,
  isDecorYSortLayer as isLayerDecorYSort,
  layerFlag as getLayerFlag,
  layerNumber as getLayerNumber,
  layerOcclusionHeight as getLayerOcclusionHeight,
  shouldDrawTileLayer as shouldDrawMapTileLayer,
  ySortOffset as getYSortOffset
} from "./map/mapLayerUtils.js";
import {
  activateDialogChoice as activateMapDialogChoice,
  activateMapChoicePanel as activateMapChoicePanelUi,
  createDialogContinueIndicator as createMapDialogContinueIndicator,
  ensureMapChoicePanel as ensureMapChoicePanelUi,
  ensureMapChoiceScrollControls as ensureMapChoiceScrollControlsUi,
  hideDialog as hideMapDialog,
  hideMapChoicePanel as hideMapChoicePanelUi,
  playChoiceDialog as playMapChoiceDialog,
  playMessageDialog as playMapMessageDialog,
  renderHighlightedDialogText as renderMapHighlightedDialogText,
  scrollMapChoicePanel as scrollMapChoicePanelUi,
  showChoiceDialog as showMapChoiceDialog,
  showDialog as showMapDialog,
  showMapChoiceScrollControls as showMapChoiceScrollControlsUi,
  typeDialogLines as typeMapDialogLines,
  typeDialogText as typeMapDialogText,
  updateMapChoiceScrollControls as updateMapChoiceScrollControlsUi,
  waitForDialogContinue as waitForMapDialogContinue
} from "./map/mapDialogUi.js";
import {
  isHeroInsideDoor as isHeroInDoorBounds,
  isHeroInsideHumanTrigger as isHeroInHumanTrigger,
  isHeroNearChest as isHeroInChestRange,
  isHeroNearNpc as isHeroInNpcRange
} from "./map/mapInteractionGeometry.js";
import {
  npcMenuOptions as buildNpcMenuOptions,
  openNpcDialog as openMapNpcDialog,
  openNpcMenuDialog as openMapNpcMenuDialog,
  runNpcMenuAction as runMapNpcMenuAction
} from "./map/mapNpcDialogFlow.js";
import {
  getMinimapModel as buildMinimapModel,
  isWaterGid as isTilesetWaterGid,
  markNearbyMinimapTiles as markNearbyMapMinimapTiles,
  minimapTerrainModel as buildMinimapTerrainModel
} from "./map/mapMinimapModel.js";
import {
  drawChests as drawMapChests,
  drawHumanEncounterNpcs as drawMapHumanEncounterNpcs,
  drawMapNpcs as drawMapNpcSprites,
  drawPixelAnimations as drawMapPixelAnimations,
  drawRespawnPoints as drawMapRespawnPoints
} from "./map/mapObjectRenderers.js";
import {
  animationKey,
  loadImage,
  mapUrlForId,
  normalizeLayerName,
  positiveModulo
} from "./map/mapUtils.js";

export class MapScreen {
  constructor({
    nodes,
    t,
    isMobile = () => false,
    isEncounterZoneAvailable = () => true,
    isChestOpened = () => false,
    onChestReward = () => {},
    onEncounter = () => {},
    onHumanEncounter = () => {},
    onShop = () => {},
    onMapService = () => {},
    onDoor = () => {},
    onRespawnDiscovery = () => {},
    onMapChange = () => {}
  }) {
    this.nodes = nodes;
    this.nodes.section = nodes.section ?? nodes.mapSection;
    this.t = t;
    this.isMobile = isMobile;
    this.isEncounterZoneAvailable = isEncounterZoneAvailable;
    this.isChestOpened = isChestOpened;
    this.onChestReward = onChestReward;
    this.onEncounter = onEncounter;
    this.onHumanEncounter = onHumanEncounter;
    this.onShop = onShop;
    this.onMapService = onMapService;
    this.onDoor = onDoor;
    this.onRespawnDiscovery = onRespawnDiscovery;
    this.onMapChange = onMapChange;
    this.heroName = heroName;
    this.ctx = nodes.canvas.getContext("2d");
    this.map = null;
    this.currentMapId = defaultMapId;
    this.currentMapUrl = mapUrlForId(defaultMapId);
    this.encounterLayer = null;
    this.encounterZones = [];
    this.minimapModel = null;
    this.discoveredTiles = new Set();
    this.discoveredRespawnIds = new Set();
    this.respawnPoints = [];
    this.doors = [];
    this.chests = [];
    this.mapNpcs = [];
    this.pixelAnimationLayers = [];
    this.activeRespawnId = null;
    this.collisionLayer = null;
    this.cloudLayer = null;
    this.humanEncounterPositions = new Map();
    this.clearedHumanEncounterIds = new Set();
    this.defeatedHumanEncounterIds = new Set();
    this.tilesets = [];
    this.heroImages = {};
    this.humanEncounterImages = new Map();
    this.mapNpcImages = new Map();
    this.chestImage = null;
    this.respawnImage = null;
    this.loaded = false;
    this.running = false;
    this.lastTime = 0;
    this.animationFrame = 0;
    this.keys = new Set();
    this.joystick = {
      active: false,
      pointerId: null,
      x: 0,
      y: 0
    };
    this.hero = {
      x: 32,
      y: 608,
      direction: "down",
      speed: 92
    };
    this.heroMoving = false;
    this.inputLocked = false;
    this.heroNudge = null;
    this.heroRespawnAnimation = null;
    this.heroRespawnAnimationTimeout = null;
    this.camera = { x: 0, y: 0 };
    this.lastEncounterTileKey = null;
    this.lastHumanEncounterTileKey = null;
    this.lastHumanEncounterId = null;
    this.lastChestTriggerId = null;
    this.lastDoorTriggerId = null;
    this.lastDoorTriggeredAt = 0;
    this.lastNpcDialogId = null;
    this.completedNpcDialogIds = new Set();
    this.encounterPaused = false;
    this.dialogTypingToken = 0;
    this.handleKeyDown = (event) => this.onKeyDown(event);
    this.handleKeyUp = (event) => this.onKeyUp(event);
    this.handleResize = () => this.resize();
    this.handleJoystickPointerDown = (event) => this.onJoystickPointerDown(event);
    this.handleJoystickPointerMove = (event) => this.onJoystickPointerMove(event);
    this.handleJoystickPointerUp = (event) => this.onJoystickPointerUp(event);
    this.bindJoystick();
  }

  async load() {
    if (this.loaded) return;
    const response = await fetch(this.currentMapUrl);
    if (!response.ok) {
      throw new Error(`Unable to load map: ${this.currentMapUrl}`);
    }
    this.map = await response.json();
    this.encounterLayer = this.map.layers.find((layer) => layer.name === encounterLayerName && layer.type === "tilelayer") ?? null;
    this.encounterZones = this.loadEncounterZones();
    this.respawnPoints = this.loadRespawnPoints();
    this.doors = this.loadDoors();
    this.chests = this.loadChests();
    this.mapNpcs = this.loadMapNpcs();
    this.pixelAnimationLayers = this.loadPixelAnimationLayers();
    this.activeRespawnId = this.defaultRespawnPoint()?.id ?? null;
    this.collisionLayer = this.map.layers.find((layer) => layer.name.toLowerCase() === collisionLayerName && layer.type === "tilelayer") ?? null;
    this.cloudLayer = this.map.layers.find((layer) => normalizeLayerName(layer.name) === cloudLayerName && layer.type === "tilelayer") ?? null;
    this.humanEncounterPositions = new Map(humanEncounterConfigs
      .map((config) => [config.id, this.resolveNpcAnchor(config.objectName)])
      .filter(([, position]) => Boolean(position)));
    this.tilesets = await Promise.all(this.map.tilesets.map(async (tileset, index, allTilesets) => {
      const next = allTilesets[index + 1];
      const imageUrl = new URL(tileset.image, new URL(this.currentMapUrl, window.location.origin)).pathname;
      return {
        ...tileset,
        lastgid: next ? next.firstgid - 1 : Number.POSITIVE_INFINITY,
        image: await loadImage(imageUrl)
      };
    }));
    this.heroImages = Object.fromEntries(await Promise.all(
      Object.entries(heroAnimations).map(async ([key, animation]) => [
        key,
        await loadImage(animation.src)
      ])
    ));
    this.humanEncounterImages = new Map(await Promise.all(
      humanEncounterImageSources.map(async (src) => [src, await loadImage(src)])
    ));
    this.mapNpcImages = new Map(await Promise.all(
      [...new Set(this.mapNpcs.map((npc) => npc.sprite.src))].map(async (src) => [src, await loadImage(src)])
    ));
    this.chestImage = await loadImage(chestSprite.src);
    this.respawnImage = await loadImage(respawnSprite.src);
    this.placeHeroBottomLeft();
    this.lastEncounterTileKey = this.heroTileKey();
    this.loaded = true;
    this.onMapChange(this.currentMapId);
  }

  async loadMap(mapId = defaultMapId, { spawnId = null, direction = null } = {}) {
    this.stop();
    this.currentMapId = mapId;
    this.currentMapUrl = mapUrlForId(mapId);
    this.loaded = false;
    this.map = null;
    this.encounterLayer = null;
    this.encounterZones = [];
    this.minimapModel = null;
    this.respawnPoints = [];
    this.doors = [];
    this.chests = [];
    this.mapNpcs = [];
    this.pixelAnimationLayers = [];
    this.activeRespawnId = null;
    this.collisionLayer = null;
    this.cloudLayer = null;
    this.humanEncounterPositions = new Map();
    this.tilesets = [];
    this.mapNpcImages = new Map();
    this.respawnImage = null;
    this.clearHeroRespawnAnimation();
    this.lastDoorTriggerId = null;
    this.lastNpcDialogId = null;
    this.lastDoorTriggeredAt = performance.now();
    await this.load();
    this.placeHeroAtSpawn(spawnId, { direction });
    this.lastEncounterTileKey = this.heroTileKey();
    this.lastHumanEncounterTileKey = this.heroTileKey();
    this.lastChestTriggerId = null;
    this.updateCamera();
    this.onMapChange(this.currentMapId);
  }

  isMinimapAvailable() {
    return this.currentMapId === defaultMapId && this.hasCompletedNpcDialog("nora_home_intro");
  }

  hasCompletedNpcDialog(dialogId) {
    return this.completedNpcDialogIds.has(dialogId);
  }

  async start({ reset = false } = {}) {
    if (reset && this.currentMapId !== defaultMapId) {
      await this.loadMap(defaultMapId);
    }
    await this.load();
    if (reset) {
      this.placeHeroBottomLeft();
      this.lastEncounterTileKey = this.heroTileKey();
      this.lastHumanEncounterTileKey = this.heroTileKey();
      this.clearedHumanEncounterIds.clear();
      this.defeatedHumanEncounterIds.clear();
      this.discoveredTiles.clear();
      this.lastChestTriggerId = null;
      this.lastDoorTriggerId = null;
      this.activeRespawnId = this.defaultRespawnPoint()?.id ?? null;
    }
    this.encounterPaused = false;
    this.running = true;
    this.hideDialog();
    this.keys.clear();
    this.resetJoystick();
    this.hideDialog();
    if (this.nodes.joystick) this.nodes.joystick.hidden = false;
    this.resize();
    this.updateCamera();
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("resize", this.handleResize);
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.tick(time));
  }

  stop() {
    this.running = false;
    this.encounterPaused = true;
    this.inputLocked = false;
    this.heroNudge = null;
    this.clearHeroRespawnAnimation();
    this.keys.clear();
    this.resetJoystick();
    if (this.nodes.joystick) this.nodes.joystick.hidden = true;
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("resize", this.handleResize);
  }

  placeHeroBottomLeft() {
    const tileWidth = this.map.tilewidth;
    const tileHeight = this.map.tileheight;
    this.hero.x = tileWidth * heroSpawnTile.x;
    this.hero.y = tileHeight * heroSpawnTile.y;
    this.hero.direction = "down";
  }

  placeHeroAtSpawn(spawnId = null, { direction = null } = {}) {
    const spawn = this.spawnPoint(spawnId) ?? this.defaultRespawnPoint();
    if (spawn) {
      this.hero.x = spawn.x;
      this.hero.y = spawn.y;
      this.hero.direction = direction ?? spawn.direction ?? "down";
    } else {
      this.placeHeroNearMapEntrance(direction);
    }
    this.heroMoving = false;
    this.heroNudge = null;
    this.inputLocked = false;
    this.keys.clear();
    this.resetJoystick();
  }

  placeHeroNearMapEntrance(direction = null) {
    const tileWidth = this.map.tilewidth;
    const tileHeight = this.map.tileheight;
    const candidates = [
      { x: this.map.width * tileWidth * 0.5, y: this.map.height * tileHeight - tileHeight * 6 },
      { x: this.map.width * tileWidth * 0.5, y: this.map.height * tileHeight * 0.5 },
      { x: tileWidth * 2, y: this.map.height * tileHeight - tileHeight * 2 }
    ];
    const target = candidates.find((candidate) => !this.isHeroBlocked(candidate.x, candidate.y)) ?? candidates[0];
    this.hero.x = this.clampHeroX(target.x);
    this.hero.y = this.clampHeroY(target.y);
    this.hero.direction = direction ?? "up";
  }

  respawnHero() {
    const respawn = this.activeRespawnPoint() ?? this.defaultRespawnPoint();
    if (!respawn) {
      this.placeHeroBottomLeft();
      return;
    }
    this.hero.x = respawn.x;
    this.hero.y = respawn.y;
    this.hero.direction = respawn.direction ?? "down";
    this.heroMoving = false;
    this.heroNudge = null;
    this.inputLocked = false;
    this.keys.clear();
    this.resetJoystick();
    this.lastEncounterTileKey = this.heroTileKey();
    this.lastHumanEncounterTileKey = this.heroTileKey();
    this.lastChestTriggerId = null;
    this.updateCamera();
  }

  clearHeroRespawnAnimation() {
    window.clearTimeout(this.heroRespawnAnimationTimeout);
    this.heroRespawnAnimationTimeout = null;
    this.heroRespawnAnimation = null;
  }

  playHeroRespawnAnimation(durationMs = 1200) {
    this.clearHeroRespawnAnimation();
    this.hero.direction = "down";
    this.heroMoving = false;
    this.inputLocked = true;
    this.keys.clear();
    this.resetJoystick();
    this.heroRespawnAnimation = {
      startedAt: performance.now(),
      durationMs
    };

    return new Promise((resolve) => {
      this.heroRespawnAnimationTimeout = window.setTimeout(() => {
        this.clearHeroRespawnAnimation();
        this.hero.direction = "down";
        this.inputLocked = false;
        resolve();
      }, durationMs);
    });
  }

  heroRespawnFrame(time) {
    const animation = this.heroRespawnAnimation;
    if (!animation) return 0;
    let elapsed = Math.max(0, time - animation.startedAt);
    for (const step of heroRespawnFrameTimeline) {
      if (elapsed <= step.duration) return step.frame;
      elapsed -= step.duration;
    }
    return 0;
  }

  resumeFromEncounter() {
    this.lastEncounterTileKey = this.heroTileKey();
    this.lastHumanEncounterTileKey = this.heroTileKey();
    return this.start();
  }

  clearHumanEncounter(id = humanEncounterFallbackId) {
    this.clearedHumanEncounterIds.add(id);
  }

  markHumanEncounterDefeated(id = humanEncounterFallbackId) {
    this.defeatedHumanEncounterIds.add(id);
  }

  isHumanEncounterDefeated(id = humanEncounterFallbackId) {
    return this.defeatedHumanEncounterIds.has(id);
  }

  animateHeroAwayFromHumanEncounter(id = this.lastHumanEncounterId ?? humanEncounterFallbackId) {
    const encounter = this.humanEncounterById(id);
    if (!encounter) return Promise.resolve();
    const target = this.resolveHeroNudgeTarget(encounter);
    if (!target || (target.x === this.hero.x && target.y === this.hero.y)) return Promise.resolve();
    this.inputLocked = true;
    this.keys.clear();
    this.resetJoystick();
    this.heroMoving = false;
    return new Promise((resolve) => {
      this.heroNudge = {
        targetX: target.x,
        targetY: target.y,
        resolve
      };
    });
  }

  resolveHeroNudgeTarget(encounter) {
    const padding = 8;
    const dx = this.hero.x - encounter.position.x;
    const dy = this.hero.y - encounter.position.y;
    const moveHorizontally = Math.abs(dx) > Math.abs(dy);
    const targetX = moveHorizontally
      ? encounter.position.x + Math.sign(dx || 1) * (humanEncounterTriggerBox.halfWidth + padding)
      : this.hero.x;
    const targetY = moveHorizontally
      ? this.hero.y
      : encounter.position.y + (dy >= 0
        ? humanEncounterTriggerBox.bottomOffset + padding
        : -(humanEncounterTriggerBox.topOffset + padding));

    return this.findPlaceHeroNear(targetX, targetY);
  }

  findPlaceHeroNear(targetX, targetY) {
    const clampedTargetX = this.clampHeroX(targetX);
    const clampedTargetY = this.clampHeroY(targetY);
    if (!this.isHeroBlocked(clampedTargetX, clampedTargetY)) {
      return { x: clampedTargetX, y: clampedTargetY };
    }

    const dx = clampedTargetX - this.hero.x;
    const dy = clampedTargetY - this.hero.y;
    for (let ratio = 0.85; ratio >= 0.15; ratio -= 0.1) {
      const x = this.clampHeroX(this.hero.x + dx * ratio);
      const y = this.clampHeroY(this.hero.y + dy * ratio);
      if (!this.isHeroBlocked(x, y)) {
        return { x, y };
      }
    }
    return null;
  }

  resize() {
    const { canvas } = this.nodes;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * ratio));
    const height = Math.max(1, Math.floor(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    this.ctx.imageSmoothingEnabled = false;
  }

  onKeyDown(event) {
    const direction = directionByKey[event.code];
    if (!direction) return;
    event.preventDefault();
    if (this.inputLocked) return;
    this.keys.add(event.code);
  }

  onKeyUp(event) {
    if (!directionByKey[event.code]) return;
    event.preventDefault();
    this.keys.delete(event.code);
  }

  bindJoystick() {
    const { joystick } = this.nodes;
    if (!joystick) return;
    joystick.addEventListener("pointerdown", this.handleJoystickPointerDown);
    joystick.addEventListener("pointermove", this.handleJoystickPointerMove);
    joystick.addEventListener("pointerup", this.handleJoystickPointerUp);
    joystick.addEventListener("pointercancel", this.handleJoystickPointerUp);
    joystick.addEventListener("lostpointercapture", this.handleJoystickPointerUp);
  }

  onJoystickPointerDown(event) {
    if (!this.running || this.inputLocked) return;
    event.preventDefault();
    this.joystick.active = true;
    this.joystick.pointerId = event.pointerId;
    this.nodes.joystick.setPointerCapture?.(event.pointerId);
    this.updateJoystickFromEvent(event);
  }

  onJoystickPointerMove(event) {
    if (!this.joystick.active || event.pointerId !== this.joystick.pointerId) return;
    event.preventDefault();
    this.updateJoystickFromEvent(event);
  }

  onJoystickPointerUp(event) {
    if (event.pointerId !== this.joystick.pointerId) return;
    event.preventDefault();
    this.resetJoystick();
  }

  updateJoystickFromEvent(event) {
    const base = this.nodes.joystickBase;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const distance = Math.hypot(rawX, rawY);
    const clampedDistance = Math.min(joystickMaxDistance, distance);
    const angle = Math.atan2(rawY, rawX);
    const x = distance > 0 ? Math.cos(angle) * clampedDistance : 0;
    const y = distance > 0 ? Math.sin(angle) * clampedDistance : 0;
    this.joystick.x = x / joystickMaxDistance;
    this.joystick.y = y / joystickMaxDistance;
    this.nodes.joystickStick.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  resetJoystick() {
    if (this.joystick.pointerId !== null && this.nodes.joystick?.hasPointerCapture?.(this.joystick.pointerId)) {
      this.nodes.joystick.releasePointerCapture(this.joystick.pointerId);
    }
    this.joystick.active = false;
    this.joystick.pointerId = null;
    this.joystick.x = 0;
    this.joystick.y = 0;
    if (this.nodes.joystickStick) {
      this.nodes.joystickStick.style.transform = "translate(0, 0)";
    }
  }

  tick(time) {
    if (!this.running) return;
    const delta = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.update(delta);
    this.render(time);
    requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  update(delta) {
    if (this.heroNudge) {
      this.updateHeroNudge(delta);
      this.updateCamera();
      return;
    }
    if (this.inputLocked) {
      this.heroMoving = false;
      this.updateCamera();
      return;
    }
    let dx = 0;
    let dy = 0;
    const pressedDirections = [...this.keys].map((key) => directionByKey[key]).filter(Boolean);
    const lastDirection = pressedDirections.at(-1);
    if (this.isDirectionPressed("left")) dx -= 1;
    if (this.isDirectionPressed("right")) dx += 1;
    if (this.isDirectionPressed("up")) dy -= 1;
    if (this.isDirectionPressed("down")) dy += 1;
    if (this.joystick.active) {
      dx += Math.abs(this.joystick.x) >= joystickDeadZone ? this.joystick.x : 0;
      dy += Math.abs(this.joystick.y) >= joystickDeadZone ? this.joystick.y : 0;
    }
    const joystickDirection = this.joystickDirection(dx, dy);
    if (joystickDirection) this.hero.direction = joystickDirection;
    else if (lastDirection) this.hero.direction = lastDirection;
    if (dx !== 0 && dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
    }
    this.heroMoving = dx !== 0 || dy !== 0;
    this.moveHero(dx, dy, delta);
    this.checkRespawnDiscovery();
    this.updateCamera();
    this.checkChestInteraction();
    this.checkDoorInteraction();
    this.checkNpcDialogInteraction();
    this.checkHumanEncounter(dx !== 0 || dy !== 0);
    this.checkEncounter(dx !== 0 || dy !== 0);
  }

  moveHero(dx, dy, delta) {
    const distance = this.hero.speed * delta;
    const nextX = this.clampHeroX(this.hero.x + dx * distance);
    if (!this.isHeroBlocked(nextX, this.hero.y)) {
      this.hero.x = nextX;
    }
    const nextY = this.clampHeroY(this.hero.y + dy * distance);
    if (!this.isHeroBlocked(this.hero.x, nextY)) {
      this.hero.y = nextY;
    }
  }

  updateHeroNudge(delta) {
    const nudge = this.heroNudge;
    const dx = nudge.targetX - this.hero.x;
    const dy = nudge.targetY - this.hero.y;
    const remaining = Math.hypot(dx, dy);
    const distance = humanEncounterNudgeSpeed * delta;
    if (remaining <= distance || remaining === 0) {
      this.hero.x = nudge.targetX;
      this.hero.y = nudge.targetY;
      this.heroNudge = null;
      this.inputLocked = false;
      this.lastEncounterTileKey = this.heroTileKey();
      this.lastHumanEncounterTileKey = this.heroTileKey();
      nudge.resolve();
      return;
    }
    this.hero.x += (dx / remaining) * distance;
    this.hero.y += (dy / remaining) * distance;
  }

  clampHeroX(x) {
    const mapWidth = this.map.width * this.map.tilewidth;
    return Math.max(0, Math.min(mapWidth - 1, x));
  }

  clampHeroY(y) {
    const mapHeight = this.map.height * this.map.tileheight;
    return Math.max(0, Math.min(mapHeight - 1, y));
  }

  isHeroBlocked(x, y) {
    if (!this.collisionLayer) return false;
    const { halfWidth, topOffset, bottomOffset } = heroCollisionBox;
    return [
      [x - halfWidth, y - topOffset],
      [x + halfWidth, y - topOffset],
      [x - halfWidth, y + bottomOffset],
      [x + halfWidth, y + bottomOffset]
    ].some(([pointX, pointY]) => this.isCollisionAt(pointX, pointY));
  }

  isCollisionAt(x, y) {
    const tileX = Math.floor(x / this.map.tilewidth);
    const tileY = Math.floor(y / this.map.tileheight);
    if (tileX < 0 || tileY < 0 || tileX >= this.collisionLayer.width || tileY >= this.collisionLayer.height) {
      return true;
    }
    const rawGid = this.collisionLayer.data[tileY * this.collisionLayer.width + tileX] ?? 0;
    return (rawGid & ~tileFlipFlags) !== 0;
  }

  isDirectionPressed(direction) {
    return [...this.keys].some((key) => directionByKey[key] === direction);
  }

  joystickDirection(dx, dy) {
    if (!this.joystick.active || (dx === 0 && dy === 0)) return null;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  }

  updateCamera() {
    const scale = this.cameraScale();
    const viewWidth = this.nodes.canvas.width / scale;
    const viewHeight = this.nodes.canvas.height / scale;
    const mapWidth = this.map.width * this.map.tilewidth;
    const mapHeight = this.map.height * this.map.tileheight;
    this.camera.x = Math.max(0, Math.min(mapWidth - viewWidth, this.hero.x - viewWidth * 0.34));
    this.camera.y = Math.max(0, Math.min(mapHeight - viewHeight, this.hero.y - viewHeight * 0.62));
    this.markNearbyMinimapTiles();
  }

  markNearbyMinimapTiles() {
    markNearbyMapMinimapTiles({
      map: this.map,
      hero: this.hero,
      discoveredTiles: this.discoveredTiles
    });
  }

  heroTileKey() {
    if (!this.map) return null;
    const tileX = Math.floor(this.hero.x / this.map.tilewidth);
    const tileY = Math.floor(this.hero.y / this.map.tileheight);
    return `${tileX}:${tileY}`;
  }

  loadEncounterZones() {
    return loadMapEncounterZones(this.map, this.encounterLayer);
  }

  loadRespawnPoints() {
    return loadMapRespawnPoints(this.map);
  }

  loadDoors() {
    return loadMapDoors(this.map);
  }

  loadPixelAnimationLayers() {
    return loadMapPixelAnimationLayers(this.map, (layer, propertyName, fallback) => (
      this.layerNumber(layer, propertyName, fallback)
    ));
  }

  loadMapNpcs() {
    return loadMapNpcObjects(this.map);
  }

  loadChests() {
    return loadMapChests(this.map);
  }

  defaultRespawnPoint() {
    return this.respawnPoints.find((point) => point.type === defaultRespawnType) ?? null;
  }

  activeRespawnPoint() {
    return this.respawnPoints.find((point) => point.id === this.activeRespawnId) ?? this.defaultRespawnPoint();
  }

  spawnPoint(spawnId = null) {
    if (!spawnId) return null;
    return this.respawnPoints.find((point) => point.id === spawnId) ?? null;
  }

  checkRespawnDiscovery() {
    const discovered = this.respawnPoints.find((point) => (
      point.discoverable
      && this.hero.x >= point.x - point.width / 2 - respawnTriggerPaddingX
      && this.hero.x <= point.x + point.width / 2 + respawnTriggerPaddingX
      && this.hero.y >= point.y - point.height / 2 - respawnTriggerPaddingY
      && this.hero.y <= point.y + point.height / 2 + respawnTriggerPaddingY
    ));
    if (!discovered || this.activeRespawnId === discovered.id) return;
    this.activeRespawnId = discovered.id;
    if (this.discoveredRespawnIds.has(discovered.id)) return;
    this.discoveredRespawnIds.add(discovered.id);
    this.encounterPaused = true;
    this.inputLocked = true;
    this.heroMoving = false;
    this.keys.clear();
    this.resetJoystick();
    Promise.resolve(this.onRespawnDiscovery({
      respawn: discovered,
      mapId: this.currentMapId,
      host: this
    })).finally(() => {
      this.encounterPaused = false;
      this.inputLocked = false;
    });
  }

  loadUntypedEncounterZones(objectZones) {
    return loadMapUntypedEncounterZones(this.map, this.encounterLayer, objectZones);
  }

  tileOverlapsZone(tileX, tileY, zone) {
    return doesTileOverlapZone({
      tileX,
      tileY,
      zone,
      tileWidth: this.map.tilewidth,
      tileHeight: this.map.tileheight
    });
  }

  pointInEncounterZone(x, y, zone) {
    return isPointInEncounterZone(x, y, zone);
  }

  encounterZoneSummaries() {
    return summarizeEncounterZones(this.encounterZones);
  }

  minimapTerrainModel() {
    return buildMinimapTerrainModel({
      map: this.map,
      collisionLayer: this.collisionLayer,
      encounterLayer: this.encounterLayer,
      cloudLayer: this.cloudLayer,
      tilesets: this.tilesets
    });
  }

  isWaterGid(gid) {
    return isTilesetWaterGid(this.tilesets, gid);
  }

  getMinimapModel() {
    const result = buildMinimapModel({
      loaded: this.loaded,
      map: this.map,
      minimapModel: this.minimapModel,
      discoveredTiles: this.discoveredTiles,
      discoveredRespawnIds: this.discoveredRespawnIds,
      respawnPoints: this.respawnPoints,
      hero: this.hero,
      buildTerrain: () => this.minimapTerrainModel(),
      buildZones: () => this.encounterZoneSummaries()
    });
    if (!result) return null;
    this.minimapModel = result.baseModel;
    return result.model;
  }

  heroScreenPosition() {
    const rect = this.nodes.canvas.getBoundingClientRect();
    const canvasToCss = rect.width / Math.max(1, this.nodes.canvas.width);
    const scale = this.cameraScale();
    return {
      x: rect.left + (this.hero.x - this.camera.x) * scale * canvasToCss,
      y: rect.top + (this.hero.y - this.camera.y) * scale * canvasToCss
    };
  }

  zoneForHero() {
    const heroFootY = this.hero.y + heroCollisionBox.bottomOffset;
    return this.encounterZones.find((zone) => this.pointInEncounterZone(this.hero.x, heroFootY, zone)) ?? null;
  }

  zoneForTile(tileX, tileY) {
    return this.encounterZones.find((zone) => this.tileOverlapsZone(tileX, tileY, zone)) ?? null;
  }

  checkEncounter(isMoving) {
    if (!isMoving || this.encounterPaused || !this.encounterLayer) return;
    const tileKey = this.heroTileKey();
    if (!tileKey || tileKey === this.lastEncounterTileKey) return;
    this.lastEncounterTileKey = tileKey;
    const [tileX, tileY] = tileKey.split(":").map(Number);
    const gid = this.encounterLayer.data[tileY * this.encounterLayer.width + tileX] ?? 0;
    const hasEncounterTile = (gid & ~tileFlipFlags) !== 0;
    const zone = this.zoneForHero() ?? (hasEncounterTile ? this.zoneForTile(tileX, tileY) : null);
    if (!hasEncounterTile && !zone) return;
    if (zone && !this.isEncounterZoneAvailable(zone)) return;
    const chance = zone?.encounterChance ?? encounterChance;
    if (Math.random() >= chance) return;
    this.encounterPaused = true;
    this.stop();
    this.onEncounter({
      tileX,
      tileY,
      hero: { ...this.hero },
      zone
    });
  }

  checkHumanEncounter(isMoving) {
    if (!isMoving || this.encounterPaused) return;
    const tileKey = this.heroTileKey();
    if (!tileKey || tileKey === this.lastHumanEncounterTileKey) return;
    this.lastHumanEncounterTileKey = tileKey;
    const encounter = this.activeHumanEncounters().find((candidate) => this.isHeroInsideHumanTrigger(candidate));
    if (!encounter) return;
    this.lastHumanEncounterId = encounter.id;
    this.encounterPaused = true;
    this.stop();
    this.onHumanEncounter({
      id: encounter.id,
      hero: { ...this.hero }
    });
  }

  checkChestInteraction() {
    if (this.encounterPaused) return;
    const chest = this.chests.find((candidate) => this.isHeroNearChest(candidate));
    if (!chest) {
      this.lastChestTriggerId = null;
      return;
    }
    if (this.isChestOpen(chest) || this.lastChestTriggerId === chest.id) return;
    this.lastChestTriggerId = chest.id;
    this.openChestPrompt(chest);
  }

  checkDoorInteraction() {
    if (this.encounterPaused || !this.doors.length) return;
    const door = this.doors.find((candidate) => this.isHeroInsideDoor(candidate));
    if (!door) {
      this.lastDoorTriggerId = null;
      return;
    }
    const now = performance.now();
    if (this.lastDoorTriggerId === door.id || now - this.lastDoorTriggeredAt < doorTriggerCooldownMs) return;
    this.lastDoorTriggerId = door.id;
    this.lastDoorTriggeredAt = now;
    this.encounterPaused = true;
    this.stop();
    this.onDoor({
      ...door,
      fromMap: this.currentMapId,
      hero: { ...this.hero }
    });
  }

  checkNpcDialogInteraction() {
    if (this.encounterPaused || !this.mapNpcs.length) return;
    const npc = this.mapNpcs.find((candidate) => this.isHeroNearNpc(candidate));
    if (!npc) {
      this.lastNpcDialogId = null;
      return;
    }
    if ((!npc.dialogId && !npc.shopId && !npc.serviceId) || this.lastNpcDialogId === npc.id) return;
    this.lastNpcDialogId = npc.id;
    this.openNpcDialog(npc);
  }

  isHeroNearChest(chest) {
    return isHeroInChestRange(this.hero, chest);
  }

  isHeroInsideDoor(door) {
    return isHeroInDoorBounds(this.hero, door);
  }

  isHeroNearNpc(npc) {
    return isHeroInNpcRange(this.hero, npc);
  }

  isChestOpen(chest) {
    return this.isChestOpened(chest.openedFlag);
  }

  async openChestPrompt(chest) {
    this.encounterPaused = true;
    this.inputLocked = true;
    this.heroMoving = false;
    this.keys.clear();
    this.resetJoystick();
    const choice = await this.playChoiceDialog({
      message: "Voulez-vous ouvrir le coffre ?",
      prompt: "",
      options: [
        { label: "Oui", value: "yes" },
        { label: "Non", value: "no" }
      ]
    });
    if (choice !== "yes") {
      this.encounterPaused = false;
      this.inputLocked = false;
      return;
    }
    await this.playChestOpeningAnimation(chest);
    await this.onChestReward(chest);
    this.encounterPaused = false;
    this.inputLocked = false;
  }

  playChestOpeningAnimation(chest) {
    chest.openingStartedAt = performance.now();
    return new Promise((resolve) => {
      window.setTimeout(() => {
        chest.openingStartedAt = null;
        resolve();
      }, chestSprite.frameDurationMs * chestSprite.frames);
    });
  }

  async openNpcDialog(npc) {
    await openMapNpcDialog(this, npc);
  }

  async openNpcMenuDialog(npc, dialog) {
    await openMapNpcMenuDialog(this, npc, dialog);
  }

  npcMenuOptions(menu, { includeExitOption = false } = {}) {
    return buildNpcMenuOptions(this, menu, { includeExitOption });
  }

  async runNpcMenuAction(action, { speaker }) {
    return runMapNpcMenuAction(this, action, { speaker });
  }

  lockMapDialogInput() {
    this.encounterPaused = true;
    this.inputLocked = true;
    this.heroMoving = false;
    this.keys.clear();
    this.resetJoystick();
  }

  unlockMapDialogInput() {
    this.encounterPaused = false;
    this.inputLocked = false;
  }

  isHeroInsideHumanTrigger(encounter) {
    return isHeroInHumanTrigger(this.hero, encounter);
  }

  isHumanEncounterActive(id = humanEncounterFallbackId) {
    return this.humanEncounterPositions.has(id) && !this.clearedHumanEncounterIds.has(id);
  }

  humanEncounterById(id = humanEncounterFallbackId) {
    const position = this.humanEncounterPositions.get(id);
    if (!position || !this.isHumanEncounterActive(id)) return null;
    const config = humanEncounterConfigById[id] ?? humanEncounterFallbackConfig;
    return {
      ...config,
      position
    };
  }

  activeHumanEncounters() {
    return humanEncounterConfigs
      .map((config) => this.humanEncounterById(config.id))
      .filter(Boolean);
  }

  showDialog({ message, prompt, messageHighlights = [], promptHighlights = [], showContinueIndicator = false }) {
    return showMapDialog(this, { message, prompt, messageHighlights, promptHighlights, showContinueIndicator });
  }

  showChoiceDialog({ message, prompt, options, messageHighlights = [], promptHighlights = [], optionLayout = "horizontal" }) {
    return showMapChoiceDialog(this, { message, prompt, options, messageHighlights, promptHighlights, optionLayout });
  }

  async playMessageDialog({
    message,
    messageHighlights = [],
    promptHighlights = [],
    autoHide = true,
    continueDelayMs = 160
  }) {
    await playMapMessageDialog(this, { message, messageHighlights, promptHighlights, autoHide, continueDelayMs });
  }

  async playChoiceDialog({ message, prompt, options, messageHighlights = [], promptHighlights = [], optionLayout = "horizontal", autoHide = true }) {
    return playMapChoiceDialog(this, { message, prompt, options, messageHighlights, promptHighlights, optionLayout, autoHide });
  }

  waitForDialogContinue(delayMs = 160) {
    return waitForMapDialogContinue(this, delayMs);
  }

  activateDialogChoice(options, { layout = "horizontal" } = {}) {
    return activateMapDialogChoice(this, options, { layout });
  }

  activateMapChoicePanel(options) {
    return activateMapChoicePanelUi(this, options);
  }

  ensureMapChoicePanel() {
    return ensureMapChoicePanelUi(this);
  }

  ensureMapChoiceScrollControls() {
    ensureMapChoiceScrollControlsUi(this);
  }

  showMapChoiceScrollControls() {
    showMapChoiceScrollControlsUi(this);
  }

  scrollMapChoicePanel(direction) {
    scrollMapChoicePanelUi(this, direction);
  }

  updateMapChoiceScrollControls() {
    updateMapChoiceScrollControlsUi(this);
  }

  hideDialog() {
    hideMapDialog(this);
  }

  hideMapChoicePanel() {
    hideMapChoicePanelUi(this);
  }

  typeDialogLines(lines, token, onComplete, lineIndex = 0, showContinueIndicator = false) {
    typeMapDialogLines(this, lines, token, onComplete, lineIndex, showContinueIndicator);
  }

  createDialogContinueIndicator() {
    return createMapDialogContinueIndicator();
  }

  typeDialogText(target, text, highlights, token, onComplete) {
    typeMapDialogText(this, target, text, highlights, token, onComplete);
  }

  renderHighlightedDialogText(target, text, highlights = []) {
    renderMapHighlightedDialogText(target, text, highlights);
  }

  renderScale() {
    return Math.max(1, Math.floor((window.devicePixelRatio || 1) * 2));
  }

  cameraScale() {
    return this.renderScale() * mapCameraZoom;
  }

  render(time) {
    const { canvas } = this.nodes;
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    const scale = this.cameraScale();
    ctx.scale(scale, scale);
    ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));
    this.drawTileLayers(time, { aboveHero: false });
    this.drawRespawnPoints(time);
    this.drawChests(time, { ySortPass: "below" });
    this.drawMapNpcs(time, { ySortPass: "below" });
    this.drawHumanEncounterNpcs(time);
    this.drawHero(time);
    this.drawMapNpcs(time, { ySortPass: "above" });
    this.drawChests(time, { ySortPass: "above" });
    this.drawTileLayers(time, { aboveHero: true });
    this.drawPixelAnimations(time);
    this.drawCloudLayer(time);
    ctx.restore();
  }

  drawHumanEncounterNpcs(time) {
    drawMapHumanEncounterNpcs({
      ctx: this.ctx,
      time,
      encounters: this.activeHumanEncounters(),
      images: this.humanEncounterImages
    });
  }

  drawRespawnPoints(time) {
    drawMapRespawnPoints({
      ctx: this.ctx,
      time,
      image: this.respawnImage,
      respawnPoints: this.respawnPoints,
      discoveredRespawnIds: this.discoveredRespawnIds
    });
  }

  drawMapNpcs(time, { ySortPass }) {
    drawMapNpcSprites({
      ctx: this.ctx,
      time,
      mapNpcs: this.mapNpcs,
      heroY: this.hero.y,
      images: this.mapNpcImages,
      ySortPass
    });
  }

  drawChests(time, { ySortPass }) {
    drawMapChests({
      ctx: this.ctx,
      time,
      image: this.chestImage,
      chests: this.chests,
      heroY: this.hero.y,
      ySortPass,
      isChestOpen: (chest) => this.isChestOpen(chest)
    });
  }

  drawPixelAnimations(time) {
    drawMapPixelAnimations({
      ctx: this.ctx,
      time,
      pixelAnimationLayers: this.pixelAnimationLayers,
      resolveTile: (gid, frameTime) => this.resolveTile(gid, frameTime)
    });
  }

  resolveNpcAnchor(objectName) {
    const npcLayer = this.map.layers.find((layer) => layer.name.toLowerCase() === npcLayerName && layer.type === "objectgroup");
    const object = npcLayer?.objects?.find((candidate) => candidate.name.toLowerCase() === objectName);
    if (!object) return null;
    return {
      x: object.x + object.width / 2,
      y: object.y + object.height / 2
    };
  }

  drawTileLayers(time, { aboveHero = false } = {}) {
    this.map.layers
      .filter((layer) => this.shouldDrawTileLayer(layer))
      .filter((layer) => aboveHero
        ? this.isAboveHeroLayer(layer)
        : !this.isDecorUpLayer(layer) || this.layerOcclusionHeight(layer) > 0)
      .sort((left, right) => this.aboveHeroLayerOrder(left) - this.aboveHeroLayerOrder(right))
      .forEach((layer) => {
        const ySortPass = this.isDecorYSortLayer(layer)
          ? (aboveHero ? "above" : "below")
          : null;
        const occlusionPass = this.layerOcclusionHeight(layer) > 0 && this.isAboveHeroLayer(layer)
          ? (aboveHero ? "above" : "below")
          : null;
        this.drawTileLayer(layer, time, { ySortPass, occlusionPass });
      });
  }

  shouldDrawTileLayer(layer) {
    return shouldDrawMapTileLayer({
      layer,
      collisionLayer: this.collisionLayer,
      cloudLayer: this.cloudLayer,
      isHumanEncounterActive: (id) => this.isHumanEncounterActive(id)
    });
  }

  isDecorUpLayer(layer) {
    return isLayerDecorUp(layer);
  }

  decorUpLayerRank(layer) {
    return getDecorUpLayerRank(layer);
  }

  aboveHeroLayerOrder(layer) {
    return getAboveHeroLayerOrder(layer);
  }

  isDecorYSortLayer(layer) {
    return isLayerDecorYSort(layer);
  }

  layerFlag(layer, propertyName) {
    return getLayerFlag(layer, propertyName);
  }

  isAboveHeroLayer(layer) {
    return isLayerAboveHero(layer);
  }

  ySortOffset(layer) {
    return getYSortOffset(layer);
  }

  layerNumber(layer, propertyName, fallback = 0) {
    return getLayerNumber(layer, propertyName, fallback);
  }

  layerOcclusionHeight(layer) {
    return getLayerOcclusionHeight(layer);
  }

  drawTileLayer(layer, time, { ySortPass = null, occlusionPass = null } = {}) {
    const { tilewidth, tileheight } = this.map;
    const occlusionHeight = this.layerOcclusionHeight(layer);
    layer.data.forEach((rawGid, index) => {
      const gid = rawGid & ~tileFlipFlags;
      if (gid === 0) return;
      const tile = this.resolveTile(gid, time);
      if (!tile) return;
      const x = (index % layer.width) * tilewidth;
      const y = Math.floor(index / layer.width) * tileheight;
      if (ySortPass && occlusionPass !== "below") {
        const tileDepthY = y + tileheight + this.ySortOffset(layer);
        const isAboveHero = tileDepthY > this.hero.y;
        if ((ySortPass === "above") !== isAboveHero) return;
      }
      const drawX = x;
      const drawY = y + tileheight - tile.tileset.tileheight;
      if (occlusionPass === "above" && occlusionHeight > 0) {
        const clippedHeight = Math.min(tile.tileset.tileheight, occlusionHeight);
        this.ctx.drawImage(
          tile.tileset.image,
          tile.sx,
          tile.sy + tile.tileset.tileheight - clippedHeight,
          tile.tileset.tilewidth,
          clippedHeight,
          drawX,
          drawY + tile.tileset.tileheight - clippedHeight,
          tile.tileset.tilewidth,
          clippedHeight
        );
        return;
      }
      this.ctx.drawImage(
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
  }

  drawCloudLayer(time) {
    const layer = this.cloudLayer;
    if (!layer || layer.visible === false) return;
    const opacity = Math.max(0, Math.min(1, this.layerNumber(layer, "opacity", layer.opacity ?? 1)));
    if (opacity <= 0) return;
    const speedX = this.layerNumber(layer, "speedX", 0);
    const speedY = this.layerNumber(layer, "speedY", 0);
    const { tilewidth, tileheight } = this.map;
    const repeatWidth = layer.width * tilewidth;
    const repeatHeight = layer.height * tileheight;
    if (repeatWidth <= 0 || repeatHeight <= 0) return;
    const offsetX = positiveModulo((time / 1000) * speedX, repeatWidth);
    const offsetY = positiveModulo((time / 1000) * speedY, repeatHeight);

    this.ctx.save();
    this.ctx.globalAlpha *= opacity;
    layer.data.forEach((rawGid, index) => {
      const gid = rawGid & ~tileFlipFlags;
      if (gid === 0) return;
      const tile = this.resolveTile(gid, time);
      if (!tile) return;
      const baseX = (index % layer.width) * tilewidth + offsetX;
      const baseY = Math.floor(index / layer.width) * tileheight + offsetY;
      const drawY = baseY + tileheight - tile.tileset.tileheight;
      [-repeatWidth, 0, repeatWidth].forEach((wrapX) => {
        [-repeatHeight, 0, repeatHeight].forEach((wrapY) => {
          this.ctx.drawImage(
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
    this.ctx.restore();
  }

  resolveTile(gid, time) {
    const tileset = this.tilesets.find((candidate) => gid >= candidate.firstgid && gid <= candidate.lastgid);
    if (!tileset) return null;
    const localId = gid - tileset.firstgid;
    const animatedId = this.resolveAnimatedTileId(tileset, localId, time);
    return {
      tileset,
      sx: (animatedId % tileset.columns) * tileset.tilewidth,
      sy: Math.floor(animatedId / tileset.columns) * tileset.tileheight
    };
  }

  resolveAnimatedTileId(tileset, localId, time) {
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

  drawHero(time) {
    if (this.heroRespawnAnimation) {
      const image = this.heroImages.respawn;
      const frame = this.heroRespawnFrame(time);
      const size = 32;
      this.ctx.drawImage(
        image,
        frame * size,
        0,
        size,
        size,
        Math.round(this.hero.x - size / 2),
        Math.round(this.hero.y - size + 4),
        size,
        size
      );
      return;
    }

    const moving = this.heroMoving;
    const key = animationKey(this.hero.direction, moving);
    const image = this.heroImages[key];
    const animation = heroAnimations[key];
    const frame = Math.floor(time / (moving ? 110 : 140)) % animation.frames;
    const size = 32;
    this.ctx.drawImage(
      image,
      frame * size,
      0,
      size,
      size,
      Math.round(this.hero.x - size / 2),
      Math.round(this.hero.y - size + 4),
      size,
      size
    );
  }
}
