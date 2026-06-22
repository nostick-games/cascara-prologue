const frameCountCache = new Map();

// Les planches créatures sont des bandes horizontales de frames carrées (height = largeur d'une frame).
// On déduit le nombre de frames de l'image, sauf si la créature fournit déjà sprites.frameCount.
function resolveFrameCount(spriteUrl, hint) {
  if (hint) return Promise.resolve(hint);
  if (frameCountCache.has(spriteUrl)) return Promise.resolve(frameCountCache.get(spriteUrl));
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const frames = Math.max(1, Math.round(image.naturalWidth / image.naturalHeight));
      frameCountCache.set(spriteUrl, frames);
      resolve(frames);
    };
    image.onerror = () => resolve(1);
    image.src = spriteUrl;
  });
}

// Affiche le sprite idle d'une créature dans un élément carré de `size` px (animation pixelée en boucle).
export function applyCreatureIdleSprite(element, { spriteUrl, frameCountHint, size }) {
  if (!element || !spriteUrl) return;
  element.style.backgroundImage = `url("${spriteUrl}")`;
  element.style.setProperty("--creature-idle-size", `${size}px`);

  const token = Symbol("creature-idle");
  element.dataset.idleToken = token.description;
  element._creatureIdleToken = token;

  resolveFrameCount(spriteUrl, frameCountHint).then((frames) => {
    if (element._creatureIdleToken !== token) return;
    const totalWidth = size * frames;
    element.style.setProperty("--creature-idle-bg-size", `${totalWidth}px ${size}px`);
    element.style.setProperty("--creature-idle-offset", `-${totalWidth}px`);
    element.style.setProperty("--creature-idle-steps", frames);
  });
}
