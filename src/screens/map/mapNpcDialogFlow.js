import { mapServiceDefinitions } from "../../data/mapServices.js";
import { shopDefinitions } from "../../data/shops.js";
import { heroName, mapNpcDialogs } from "./mapConfig.js";

export async function openNpcDialog(host, npc) {
  if (npc.serviceId) {
    const service = mapServiceDefinitions[npc.serviceId];
    if (!service) return;
    const speaker = npc.displayName ?? host.t(service.speakerKey) ?? npc.id;
    host.lockMapDialogInput();
    try {
      await host.onMapService({
        service,
        npc,
        speaker,
        host
      });
    } finally {
      host.hideDialog();
      host.hideMapChoicePanel();
      host.unlockMapDialogInput();
    }
    return;
  }
  if (npc.shopId) {
    const shop = shopDefinitions[npc.shopId];
    if (!shop) return;
    const speaker = npc.displayName ?? host.t(shop.speakerKey) ?? npc.id;
    host.lockMapDialogInput();
    try {
      await host.onShop({
        shop,
        npc,
        speaker,
        host
      });
    } finally {
      host.hideDialog();
      host.hideMapChoicePanel();
      host.unlockMapDialogInput();
    }
    return;
  }

  const dialog = mapNpcDialogs[npc.dialogId];
  if (!dialog) return;
  const isLocked = dialog.requiredCompletedDialogId
    && !host.completedNpcDialogIds.has(dialog.requiredCompletedDialogId);
  if (dialog.menu && !isLocked) {
    await openNpcMenuDialog(host, npc, dialog);
    return;
  }

  const alreadyCompleted = host.completedNpcDialogIds.has(npc.dialogId);
  const messageKeys = isLocked ? dialog.lockedKeys : alreadyCompleted ? dialog.repeatKeys : dialog.introKeys;
  if (!messageKeys?.length) return;
  const speaker = npc.displayName ?? host.t(dialog.speakerKey) ?? npc.id;
  host.lockMapDialogInput();
  for (const messageKey of messageKeys) {
    await host.playMessageDialog({
      message: `${speaker} : ${host.t(messageKey, { hero: heroName })}`,
      messageHighlights: [speaker, heroName, "Flamillon", "Sanctuaire de Cascara", "Nora"]
    });
  }
  if (!isLocked) host.completedNpcDialogIds.add(npc.dialogId);
  host.onMapChange(host.currentMapId);
  host.unlockMapDialogInput();
}

export async function openNpcMenuDialog(host, npc, dialog) {
  const speaker = npc.displayName ?? host.t(dialog.speakerKey) ?? npc.id;
  const menu = dialog.menu;
  host.lockMapDialogInput();

  let includeExitOption = menu.showExitOptionInitially === true;
  let hasShownIntro = host.completedNpcDialogIds.has(npc.dialogId);
  let shouldContinue = true;
  while (shouldContinue) {
    const options = npcMenuOptions(host, menu, { includeExitOption });
    const choice = await host.playChoiceDialog({
      message: `${speaker} : ${host.t(hasShownIntro ? menu.repeatKey : menu.introKey, { hero: heroName })}`,
      options,
      messageHighlights: [speaker, heroName, ...(menu.highlights ?? [])],
      optionLayout: menu.optionLayout ?? "vertical",
      autoHide: false
    });
    hasShownIntro = true;
    if (!choice || choice === menu.exitValue) break;
    const action = menu.options.find((option) => option.value === choice);
    if (!action || action.action === "exit") break;
    const result = await runNpcMenuAction(host, action, { speaker });
    if (result?.handoff) return;
    if (result?.revealExitOption) includeExitOption = true;
    if (result?.continueMenu) continue;
    shouldContinue = false;
  }

  host.hideDialog();
  host.hideMapChoicePanel();
  host.completedNpcDialogIds.add(npc.dialogId);
  host.unlockMapDialogInput();
}

export function npcMenuOptions(host, menu, { includeExitOption = false } = {}) {
  const options = menu.options.map((option) => ({
    label: host.t(option.labelKey),
    value: option.value
  }));
  if (includeExitOption && menu.exitOption) {
    options.push({
      label: host.t(menu.exitOption.labelKey),
      value: menu.exitOption.value
    });
  }
  return options;
}

export async function runNpcMenuAction(host, action, { speaker }) {
  if (action.action === "humanEncounter") {
    if (action.messageKey) {
      await host.playMessageDialog({
        message: `${speaker} : ${host.t(action.messageKey)}`,
        messageHighlights: [speaker, "fawnas"],
        continueDelayMs: action.continueDelayMs
      });
    }
    host.hideDialog();
    host.hideMapChoicePanel();
    host.completedNpcDialogIds.add("chad_training");
    host.unlockMapDialogInput();
    await host.onHumanEncounter({
      id: action.enemyId,
      skipChallenge: true,
      source: "npc"
    });
    return { handoff: true };
  }
  if (action.action !== "choicePanel") {
    return { continueMenu: false };
  }
  if (action.panelPromptKey) {
    await host.showDialog({
      message: `${speaker} : ${host.t(action.panelPromptKey)}`,
      messageHighlights: [speaker]
    });
  } else {
    host.hideDialog();
  }
  const choice = await host.activateMapChoicePanel(
    (action.panelChoices ?? []).map((id) => ({
      label: host.t(`${action.panelLabelKeyPrefix}${id}`),
      value: id
    }))
  );
  if (choice && action.responseKeyPrefix) {
    await host.playMessageDialog({
      message: `${speaker} : ${host.t(`${action.responseKeyPrefix}${choice}`)}`,
      messageHighlights: [speaker],
      autoHide: true
    });
  }
  return {
    continueMenu: true,
    revealExitOption: action.revealExitOption === true
  };
}
