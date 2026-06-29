import { joystickMaxDistance } from "./mapConfig.js";
import { isMapChoiceScrollControlTarget } from "./mapDialogUi.js";

export function setJoystickMode(host, mode) {
  host.joystickMode = mode === "movable" ? "movable" : "fixed";
  host.resetJoystick();
  host.updateJoystickModeUi();
}

export function updateJoystickModeUi(host) {
  const joystick = host.nodes.joystick;
  if (!joystick) return;
  joystick.classList.toggle("is-movable", host.joystickMode === "movable");
  joystick.classList.toggle("is-fixed", host.joystickMode !== "movable");
  joystick.hidden = !host.running || host.joystickMode === "movable";
  if (host.joystickMode !== "movable") {
    joystick.style.left = "";
    joystick.style.top = "";
    joystick.style.bottom = "";
  }
}

export function bindJoystick(host) {
  const { joystick } = host.nodes;
  if (!joystick) return;
  joystick.addEventListener("pointerdown", host.handleJoystickPointerDown);
  joystick.addEventListener("pointermove", host.handleJoystickPointerMove);
  joystick.addEventListener("pointerup", host.handleJoystickPointerUp);
  joystick.addEventListener("pointercancel", host.handleJoystickPointerUp);
  joystick.addEventListener("lostpointercapture", host.handleJoystickPointerUp);
  host.nodes.section?.addEventListener("pointerdown", host.handleMapPointerDown);
  host.nodes.section?.addEventListener("pointermove", host.handleJoystickPointerMove);
  host.nodes.section?.addEventListener("pointerup", host.handleJoystickPointerUp);
  host.nodes.section?.addEventListener("pointercancel", host.handleJoystickPointerUp);
  host.nodes.section?.addEventListener("lostpointercapture", host.handleJoystickPointerUp);
}

export function onJoystickPointerDown(host, event) {
  if (host.joystickMode === "movable") return;
  if (!host.running || host.inputLocked) return;
  event.preventDefault();
  host.joystick.active = true;
  host.joystick.pointerId = event.pointerId;
  host.joystick.captureTarget = host.nodes.joystick;
  host.joystick.captureTarget?.setPointerCapture?.(event.pointerId);
  updateJoystickFromEvent(host, event);
}

export function onMapPointerDown(host, event) {
  if (host.joystickMode !== "movable" || !canStartMovableJoystick(host, event)) return;
  event.preventDefault();
  host.joystick.active = true;
  host.joystick.pointerId = event.pointerId;
  host.joystick.captureTarget = host.nodes.section;
  placeMovableJoystick(host, event);
  host.nodes.joystick.hidden = false;
  host.joystick.captureTarget?.setPointerCapture?.(event.pointerId);
  updateJoystickFromEvent(host, event);
}

export function canStartMovableJoystick(host, event) {
  const simonPuzzleControlsMap = Boolean(host.activeSimonPuzzle);
  if (!host.running || host.inputLocked || host.joystick.active) return false;
  if (host.encounterPaused && !simonPuzzleControlsMap) return false;
  if (event.pointerType && event.pointerType !== "touch") return false;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (isMapChoiceScrollControlTarget(target)) return false;
  if (target.closest("button, a, input, select, textarea, [role='button']")) return false;
  if (target.closest(".map-quick-actions, .map-dialog-frame, .map-choice-panel, .map-choice-scroll-controls, .map-joystick")) return false;
  return target === host.nodes.canvas || target === host.nodes.section || host.nodes.canvas?.contains(target);
}

export function placeMovableJoystick(host, event) {
  const joystick = host.nodes.joystick;
  const section = host.nodes.section;
  if (!joystick || !section) return;
  const rect = section.getBoundingClientRect();
  const size = joystick.offsetWidth || 136;
  const maxLeft = Math.max(0, rect.width - size);
  const maxTop = Math.max(0, rect.height - size);
  const left = Math.max(0, Math.min(maxLeft, event.clientX - rect.left - size / 2));
  const top = Math.max(0, Math.min(maxTop, event.clientY - rect.top - size / 2));
  joystick.style.left = `${Math.round(left)}px`;
  joystick.style.top = `${Math.round(top)}px`;
  joystick.style.bottom = "auto";
}

export function onJoystickPointerMove(host, event) {
  if (host.joystickMode === "movable" && event.currentTarget !== host.nodes.section) return;
  if (host.joystickMode !== "movable" && event.currentTarget !== host.nodes.joystick) return;
  if (!host.joystick.active || event.pointerId !== host.joystick.pointerId) return;
  event.preventDefault();
  updateJoystickFromEvent(host, event);
}

export function onJoystickPointerUp(host, event) {
  if (host.joystickMode === "movable" && event.currentTarget !== host.nodes.section) return;
  if (host.joystickMode !== "movable" && event.currentTarget !== host.nodes.joystick) return;
  if (event.pointerId !== host.joystick.pointerId) return;
  event.preventDefault();
  resetJoystick(host);
}

export function updateJoystickFromEvent(host, event) {
  const base = host.nodes.joystickBase;
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
  host.joystick.x = x / joystickMaxDistance;
  host.joystick.y = y / joystickMaxDistance;
  host.nodes.joystickStick.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

export function resetJoystick(host) {
  if (host.joystick.pointerId !== null && host.joystick.captureTarget?.hasPointerCapture?.(host.joystick.pointerId)) {
    host.joystick.captureTarget.releasePointerCapture(host.joystick.pointerId);
  }
  host.joystick.active = false;
  host.joystick.pointerId = null;
  host.joystick.captureTarget = null;
  host.joystick.x = 0;
  host.joystick.y = 0;
  if (host.nodes.joystickStick) {
    host.nodes.joystickStick.style.transform = "translate(0, 0)";
  }
  if (host.nodes.joystick && host.joystickMode === "movable") {
    host.nodes.joystick.hidden = true;
  }
}

export function joystickDirection(host, dx, dy) {
  if (!host.joystick.active || (dx === 0 && dy === 0)) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}
