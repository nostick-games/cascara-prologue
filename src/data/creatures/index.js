import { braiseCorne } from "./braiseCorne.js";
import { flamillon } from "./flamillon.js";
import { loopio } from "./loopio.js";
import { nacrelame } from "./nacrelame.js";
import { ondeLente } from "./ondeLente.js";
import { plumevif } from "./plumevif.js";
import { sillage } from "./sillage.js";
import { zephyr } from "./zephyr.js";
import { creatureTypeProfile } from "../creatureTypes.js";

function withTypeProfile(creature) {
  return {
    ...creature,
    combat: {
      ...creature.combat,
      typeProfile: creatureTypeProfile(creature.type)
    }
  };
}

export const creatures = {
  braiseCorne: withTypeProfile(braiseCorne),
  flamillon: withTypeProfile(flamillon),
  loopio: withTypeProfile(loopio),
  nacrelame: withTypeProfile(nacrelame),
  ondeLente: withTypeProfile(ondeLente),
  plumevif: withTypeProfile(plumevif),
  sillage: withTypeProfile(sillage),
  zephyr: withTypeProfile(zephyr)
};
