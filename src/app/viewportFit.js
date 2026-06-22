export function createViewportFit({ appNode, body = document.body }) {
  const mobileFitQuery = window.matchMedia("(orientation: landscape) and (max-height: 560px)");

  function clearFit() {
    appNode.style.removeProperty("--fit-scale");
    appNode.style.removeProperty("--fit-x");
    appNode.style.removeProperty("--fit-y");
  }

  function usesNativeFullscreenLayout() {
    return body.classList.contains("start-active")
      || body.classList.contains("map-active")
      || body.classList.contains("briefing-active")
      || body.classList.contains("combat-active");
  }

  function update() {
    if (usesNativeFullscreenLayout() || !mobileFitQuery.matches) {
      clearFit();
      return;
    }

    const margin = 8;
    const appWidth = appNode.offsetWidth;
    const appHeight = appNode.scrollHeight;
    const availableWidth = Math.max(1, window.innerWidth - margin * 2);
    const availableHeight = Math.max(1, window.innerHeight - margin * 2);
    const scale = Math.min(1, availableWidth / appWidth, availableHeight / appHeight);
    const x = Math.max(margin, (window.innerWidth - appWidth * scale) / 2);
    const y = Math.max(margin, (window.innerHeight - appHeight * scale) / 2);

    appNode.style.setProperty("--fit-scale", scale.toFixed(4));
    appNode.style.setProperty("--fit-x", `${Math.round(x)}px`);
    appNode.style.setProperty("--fit-y", `${Math.round(y)}px`);
  }

  function schedule() {
    requestAnimationFrame(update);
  }

  function addListeners() {
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    mobileFitQuery.addEventListener("change", schedule);
  }

  return {
    mobileFitQuery,
    schedule,
    update,
    addListeners
  };
}
