import { bindPress } from "./bindPress.js";
import { setPixelButtonLabel } from "./PixelButton.js";

const minimapWaterColor = "#4c9fd0";
const minimapLandColor = "#caa06b";
const minimapDotColor = "#d43b32";
const minimapEmptyZoneColor = "#7f7f7f";
const minimapUnknownColor = "#07080b";
const minimapPlayerColor = "#53e45f";
const minimapRespawnColor = "#7edcff";
const minimapMinCellSize = 5;
const minimapBlinkMs = 360;

export class MapPopulationModal {
  constructor({
    shield,
    modal,
    title,
    description,
    canvas,
    legend,
    closeButton,
    t,
    getMapModel,
    getZonePopulation
  }) {
    this.shield = shield;
    this.modal = modal;
    this.title = title;
    this.description = description;
    this.canvas = canvas;
    this.legend = legend;
    this.closeButton = closeButton;
    this.t = t;
    this.getMapModel = getMapModel;
    this.getZonePopulation = getZonePopulation;
    this.animationFrame = null;
    this.currentModel = null;

    bindPress(closeButton, () => this.close());
    shield?.addEventListener("click", () => this.close());
  }

  async open() {
    const model = await Promise.resolve(this.getMapModel());
    if (!model) return;
    this.currentModel = model;
    this.renderStaticText();
    this.shield.hidden = false;
    this.modal.hidden = false;
    this.startAnimation();
  }

  close() {
    this.stopAnimation();
    this.modal.hidden = true;
    this.shield.hidden = true;
    this.currentModel = null;
  }

  startAnimation() {
    this.stopAnimation();
    const render = (time) => {
      if (this.modal.hidden || !this.currentModel) return;
      this.draw(this.currentModel, time);
      this.animationFrame = window.requestAnimationFrame(render);
    };
    this.animationFrame = window.requestAnimationFrame(render);
  }

  stopAnimation() {
    if (this.animationFrame !== null) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  renderStaticText() {
    this.title.textContent = this.t("ui.map_population_title");
    this.description.textContent = "";
    this.description.hidden = true;
    this.legend.innerHTML = `
      <span><i class="minimap-legend-dot"></i>${this.t("ui.map_population_available")}</span>
      <span><i class="minimap-legend-empty"></i>${this.t("ui.map_population_empty")}</span>
    `;
    setPixelButtonLabel(this.closeButton, this.t("ui.ok"));
  }

  draw(model, time = 0) {
    const ctx = this.canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = this.canvas.clientWidth || 520;
    const cssHeight = this.canvas.clientHeight || 360;
    const width = Math.floor(cssWidth * ratio);
    const height = Math.floor(cssHeight * ratio);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);

    const padding = 12 * ratio;
    const cellSize = Math.max(
      1,
      Math.floor(Math.min((width - padding * 2) / model.width, (height - padding * 2) / model.height))
    );
    const drawWidth = model.width * cellSize;
    const drawHeight = model.height * cellSize;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    ctx.fillStyle = minimapUnknownColor;
    ctx.fillRect(0, 0, width, height);
    this.drawTiles(ctx, model, { cellSize, offsetX, offsetY });
    const zoneTiles = this.drawZones(ctx, model, { cellSize, offsetX, offsetY });
    this.drawRespawns(ctx, model, { cellSize, offsetX, offsetY });
    this.drawPlayer(ctx, model, { cellSize, offsetX, offsetY, time, zoneTiles });
  }

  drawTiles(ctx, model, viewport) {
    const { cellSize, offsetX, offsetY } = viewport;
    model.terrain.forEach((terrain, index) => {
      const tileX = index % model.width;
      const tileY = Math.floor(index / model.width);
      if (!this.isTileDiscovered(model, tileX, tileY)) return;
      const x = Math.floor(offsetX + tileX * cellSize);
      const y = Math.floor(offsetY + tileY * cellSize);
      ctx.fillStyle = terrain === "water" ? minimapWaterColor : minimapLandColor;
      ctx.fillRect(x, y, cellSize, cellSize);
    });
  }

  isTileDiscovered(model, tileX, tileY) {
    return model.discoveredTiles?.has(`${tileX}:${tileY}`) ?? true;
  }

  zoneCenterTile(model, zone) {
    return {
      x: Math.max(0, Math.min(model.width - 1, Math.floor(zone.centerX / model.tileWidth))),
      y: Math.max(0, Math.min(model.height - 1, Math.floor(zone.centerY / model.tileHeight)))
    };
  }

  isZoneDiscovered(model, zone) {
    const left = Math.max(0, Math.floor(zone.x / model.tileWidth));
    const right = Math.min(model.width - 1, Math.floor((zone.x + zone.width - 1) / model.tileWidth));
    const top = Math.max(0, Math.floor(zone.y / model.tileHeight));
    const bottom = Math.min(model.height - 1, Math.floor((zone.y + zone.height - 1) / model.tileHeight));
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        if (this.isTileDiscovered(model, x, y)) return true;
      }
    }
    return false;
  }

  drawZones(ctx, model, viewport) {
    const { cellSize, offsetX, offsetY } = viewport;
    const zoneTiles = new Set();
    model.zones.forEach((zone) => {
      if (!this.isZoneDiscovered(model, zone)) return;
      const population = this.getZonePopulation(zone);
      const tile = this.zoneCenterTile(model, zone);
      zoneTiles.add(`${tile.x}:${tile.y}`);
      const markerSize = Math.max(cellSize, minimapMinCellSize);
      const x = Math.floor(offsetX + tile.x * cellSize + (cellSize - markerSize) / 2);
      const y = Math.floor(offsetY + tile.y * cellSize + (cellSize - markerSize) / 2);
      ctx.fillStyle = population.available ? minimapDotColor : minimapEmptyZoneColor;
      ctx.fillRect(x, y, markerSize, markerSize);
    });
    return zoneTiles;
  }

  drawRespawns(ctx, model, viewport) {
    const { cellSize, offsetX, offsetY } = viewport;
    (model.respawns ?? []).forEach((respawn) => {
      if (!this.isTileDiscovered(model, respawn.tileX, respawn.tileY)) return;
      const markerSize = Math.max(cellSize, minimapMinCellSize + 1);
      const x = Math.floor(offsetX + respawn.tileX * cellSize + (cellSize - markerSize) / 2);
      const y = Math.floor(offsetY + respawn.tileY * cellSize + (cellSize - markerSize) / 2);
      ctx.fillStyle = minimapRespawnColor;
      ctx.fillRect(x, y, markerSize, markerSize);
    });
  }

  drawPlayer(ctx, model, viewport) {
    const { cellSize, offsetX, offsetY, time, zoneTiles } = viewport;
    const player = model.playerTile;
    if (!player || !this.isTileDiscovered(model, player.x, player.y)) return;
    const visible = Math.floor(time / minimapBlinkMs) % 2 === 0;
    if (!visible) return;

    const markerSize = Math.max(cellSize, minimapMinCellSize);
    const overlapsZoneMarker = zoneTiles?.has(`${player.x}:${player.y}`);
    const direction = player.x < model.width - 1 ? 1 : -1;
    const xTile = overlapsZoneMarker
      ? Math.max(0, Math.min(model.width - 1, player.x + direction))
      : player.x;
    const x = Math.floor(offsetX + xTile * cellSize + (cellSize - markerSize) / 2);
    const y = Math.floor(offsetY + player.y * cellSize + (cellSize - markerSize) / 2);
    ctx.fillStyle = minimapPlayerColor;
    ctx.fillRect(x, y, markerSize, markerSize);
  }
}
