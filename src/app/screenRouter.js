export const gameScreens = {
  home: "home",
  start: "start",
  huntBriefing: "huntBriefing",
  humanBriefing: "humanBriefing",
  combat: "combat",
  options: "options",
  map: "map"
};

export function createScreenRouter({
  body,
  screens,
  bodyClassByScreen = {},
  onChange = () => {}
}) {
  let currentScreen = null;

  function show(screenId) {
    Object.entries(screens).forEach(([id, element]) => {
      if (!element) return;
      element.hidden = id !== screenId;
    });

    Object.values(bodyClassByScreen).forEach((className) => {
      if (!className) return;
      className.split(/\s+/).filter(Boolean).forEach((name) => body.classList.remove(name));
    });

    const activeClass = bodyClassByScreen[screenId];
    if (activeClass) {
      activeClass.split(/\s+/).filter(Boolean).forEach((name) => body.classList.add(name));
    }

    currentScreen = screenId;
    onChange(screenId);
  }

  return {
    show,
    get current() {
      return currentScreen;
    }
  };
}
