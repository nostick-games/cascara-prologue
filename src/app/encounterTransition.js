const transitionKinds = ["diamond", "bars", "checker"];
const flashDurationMs = 420;
const whiteFlashDurationMs = 420;
const blackoutDurationMs = 90;
const transitionDurationMs = 900;
const defeatFadeDurationMs = 360;
const mapFadeDurationMs = 360;
const respawnRevealDurationMs = 1200;

export function playEncounterTransition(transitionNode, { boundsNode = null, keepVisible = false } = {}) {
  updateTransitionBounds(transitionNode, boundsNode);
  return playTransitionStep(transitionNode, "flash", flashDurationMs, { preserveBounds: true })
    .then(() => holdBlackout(transitionNode, blackoutDurationMs))
    .then(() => {
      const kind = transitionKinds[Math.floor(Math.random() * transitionKinds.length)];
      return playTransitionStep(transitionNode, kind, transitionDurationMs, { keepVisible });
    });
}

export function playWhiteFlash(transitionNode, { boundsNode = null } = {}) {
  updateTransitionBounds(transitionNode, boundsNode);
  return playTransitionStep(transitionNode, "white-flash", whiteFlashDurationMs);
}

export function cleanupEncounterTransition(transitionNode, { preserveBounds = false } = {}) {
  transitionNode.hidden = true;
  transitionNode.className = "encounter-transition";
  if (!preserveBounds) {
    clearTransitionBounds(transitionNode);
  }
}

export function playDefeatFadeToBlack(transitionNode, { boundsNode = null } = {}) {
  updateTransitionBounds(transitionNode, boundsNode);
  return playTransitionStep(transitionNode, "defeat-fade", defeatFadeDurationMs, {
    keepVisible: true,
    preserveBounds: true
  });
}

export function playMapFadeToBlack(transitionNode, { boundsNode = null } = {}) {
  updateTransitionBounds(transitionNode, boundsNode);
  return playTransitionStep(transitionNode, "map-fade-out", mapFadeDurationMs, {
    keepVisible: true,
    preserveBounds: true
  });
}

export function playMapFadeFromBlack(transitionNode, { boundsNode = null } = {}) {
  updateTransitionBounds(transitionNode, boundsNode);
  return playTransitionStep(transitionNode, "map-fade-in", mapFadeDurationMs);
}

export function playRespawnReveal(transitionNode, { boundsNode = null, center = null } = {}) {
  updateTransitionBounds(transitionNode, boundsNode);
  const layer = transitionNode.querySelector(".encounter-transition-layer");
  if (center) {
    layer?.style.setProperty("--respawn-reveal-x", `${Math.round(center.x)}px`);
    layer?.style.setProperty("--respawn-reveal-y", `${Math.round(center.y)}px`);
  }
  return playTransitionStep(transitionNode, "respawn-reveal", respawnRevealDurationMs, {
    preserveBounds: false
  }).then(() => {
    layer?.style.removeProperty("--respawn-reveal-x");
    layer?.style.removeProperty("--respawn-reveal-y");
  });
}

function playTransitionStep(transitionNode, kind, fallbackDurationMs, { keepVisible = false, preserveBounds = false } = {}) {
  transitionNode.className = `encounter-transition is-${kind}${keepVisible ? " will-hold-blackout" : ""}`;
  transitionNode.hidden = false;

  return new Promise((resolve) => {
    let completed = false;
    let fallbackId = null;

    const done = () => {
      if (completed) return;
      completed = true;
      window.clearTimeout(fallbackId);
      if (!keepVisible) {
        cleanupEncounterTransition(transitionNode, { preserveBounds });
      } else {
        setBlackout(transitionNode);
      }
      resolve();
    };

    transitionNode.addEventListener("animationend", done, { once: true });
    fallbackId = window.setTimeout(done, fallbackDurationMs);
  });
}

function holdBlackout(transitionNode, durationMs) {
  setBlackout(transitionNode);
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function setBlackout(transitionNode) {
  transitionNode.className = "encounter-transition is-blackout";
  transitionNode.hidden = false;
}

function updateTransitionBounds(transitionNode, boundsNode) {
  const rect = boundsNode?.getBoundingClientRect?.();
  if (!rect) {
    transitionNode.style.left = "0";
    transitionNode.style.top = "0";
    transitionNode.style.width = "100vw";
    transitionNode.style.height = "100vh";
    return;
  }
  transitionNode.style.left = `${Math.round(rect.left)}px`;
  transitionNode.style.top = `${Math.round(rect.top)}px`;
  transitionNode.style.width = `${Math.ceil(rect.width)}px`;
  transitionNode.style.height = `${Math.ceil(rect.height)}px`;
}

function clearTransitionBounds(transitionNode) {
  transitionNode.style.left = "";
  transitionNode.style.top = "";
  transitionNode.style.width = "";
  transitionNode.style.height = "";
}
