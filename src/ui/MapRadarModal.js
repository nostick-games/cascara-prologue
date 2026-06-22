import { setPixelButtonLabel } from "./PixelButton.js";
import { StatRadar } from "./StatRadar.js";
import { bindPress } from "./bindPress.js";

export class MapRadarModal {
  constructor({
    nodes,
    t,
    stats,
    build,
    initialBuild,
    resetBuild,
    totalPoints,
    isLocked = () => false,
    onChange = () => {},
    onReset = () => {},
    onClose = () => {}
  }) {
    this.nodes = nodes;
    this.t = t;
    this.onReset = onReset;
    this.onClose = onClose;
    this.radar = new StatRadar({
      canvas: nodes.radarCanvas,
      controlsNode: nodes.statsNode,
      modal: nodes.statModal,
      modalTitle: nodes.statModalTitle,
      modalDescription: nodes.statModalDescription,
      modalPoints: nodes.statModalPoints,
      modalClose: nodes.statModalClose,
      modalShield: nodes.statModalShield,
      stats,
      build,
      initialBuild,
      resetBuild,
      totalPoints,
      t,
      isLocked,
      onChange
    });

    bindPress(nodes.closeButton, () => this.close());
    bindPress(nodes.resetBuildButton, () => {
      if (this.canResetBuild()) this.onReset();
    });
    nodes.shield.addEventListener("click", () => this.close());
  }

  setTotalPoints(totalPoints) {
    this.radar.setTotalPoints(totalPoints);
  }

  canResetBuild() {
    return this.radar.resettableSpentPoints() > 0;
  }

  renderStaticText() {
    setPixelButtonLabel(this.nodes.closeButton, this.t("ui.ok"));
    setPixelButtonLabel(this.nodes.resetBuildButton, "♺");
    this.nodes.resetBuildButton.setAttribute("aria-label", this.t("ui.reset"));
    this.nodes.resetBuildButton.title = this.t("ui.reset");
  }

  render() {
    this.renderStaticText();
    this.nodes.pointsLeft.textContent = this.radar.pointsLeft();
    this.nodes.pointsUnit.innerHTML = `<img src="assets/inventaire/gemme.png" alt="XP" class="points-icon">`;
    this.nodes.resetBuildButton.disabled = !this.canResetBuild();
    this.radar.render();
  }

  open() {
    if (!this.nodes.modal || !this.nodes.shield) return;
    this.renderStaticText();
    this.nodes.shield.hidden = false;
    this.nodes.modal.hidden = false;
    this.render();
    this.radar.playIntro();
  }

  close() {
    this.radar.closeModal();
    this.nodes.modal.hidden = true;
    this.nodes.shield.hidden = true;
    this.onClose();
  }
}
