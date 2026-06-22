import {
  chestTriggerRadius,
  doorTriggerPaddingX,
  doorTriggerPaddingY,
  heroCollisionBox,
  humanEncounterTriggerBox
} from "./mapConfig.js";

export function isHeroNearChest(hero, chest) {
  const chestCenterX = chest.x;
  const chestCenterY = chest.y - chest.height / 2;
  return Math.hypot(hero.x - chestCenterX, hero.y - chestCenterY) <= chestTriggerRadius;
}

export function isHeroInsideDoor(hero, door) {
  const { halfWidth, topOffset, bottomOffset } = heroCollisionBox;
  const paddingX = door.triggerPaddingX ?? doorTriggerPaddingX;
  const paddingY = door.triggerPaddingY ?? doorTriggerPaddingY;
  return (
    hero.x + halfWidth >= door.x - paddingX
    && hero.x - halfWidth <= door.x + door.width + paddingX
    && hero.y + bottomOffset >= door.y - paddingY
    && hero.y - topOffset <= door.y + door.height + paddingY
  );
}

export function isHeroNearNpc(hero, npc) {
  return Math.hypot(hero.x - npc.x, hero.y - npc.y) <= npc.triggerRadius;
}

export function isHeroInsideHumanTrigger(hero, encounter) {
  const { halfWidth, topOffset, bottomOffset } = humanEncounterTriggerBox;
  return (
    hero.x >= encounter.position.x - halfWidth
    && hero.x <= encounter.position.x + halfWidth
    && hero.y >= encounter.position.y - topOffset
    && hero.y <= encounter.position.y + bottomOffset
  );
}
