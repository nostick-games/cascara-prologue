const appShellTemplate = `
  <section class="start-section panel" id="startSection">
    <h1 id="startChoiceTitle"></h1>
    <div class="start-choice-actions">
      <button id="chooseCreatureHunt" class="secondary" type="button"></button>
      <button id="chooseHumanCombat" class="secondary" type="button"></button>
      <button id="chooseMap" class="secondary" type="button"></button>
    </div>
  </section>

  <section class="map-section game-panel" id="mapSection" hidden>
    <canvas class="map-canvas" id="mapCanvas" width="960" height="540"></canvas>
    <div class="map-quick-actions" aria-label="Raccourcis de la map">
      <button class="map-quick-action" id="mapPopulationButton" type="button" hidden>
        <img src="/assets/inventaire/minimap.png" alt="">
      </button>
      <button class="map-quick-action" id="mapRadarButton" type="button" hidden>
        <img src="/assets/inventaire/gemme.png" alt="">
      </button>
      <button class="map-quick-action" id="mapInventoryButton" type="button">
        <img src="/assets/inventaire/inventory.png" alt="">
      </button>
      <button class="map-quick-action" id="mapCreaturesButton" type="button">
        <img src="/assets/inventaire/creatures.png" alt="">
      </button>
    </div>
    <div class="map-joystick" id="mapJoystick" hidden aria-hidden="true">
      <div class="map-joystick-base">
        <div class="map-joystick-stick" id="mapJoystickStick"></div>
      </div>
    </div>
    <div class="map-dialog-frame" id="mapDialogFrame" hidden>
      <div class="map-dialog-log" id="mapDialogLog"></div>
    </div>
    <div class="map-choice-panel" id="mapChoicePanel" hidden>
      <div class="map-choice-list" id="mapChoiceList"></div>
    </div>
  </section>

  <div class="briefing-modal-shield map-population-modal-shield" id="mapPopulationModalShield" hidden></div>
  <div class="briefing-modal map-population-modal pixel-modal" id="mapPopulationModal" hidden>
    <div class="inventory-corner inventory-top-left"></div>
    <div class="inventory-edge inventory-top"></div>
    <div class="inventory-corner inventory-top-right"></div>
    <div class="inventory-edge inventory-left"></div>
    <div class="briefing-modal-content map-population-content pixel-modal-content">
      <h3 id="mapPopulationModalTitle"></h3>
      <p id="mapPopulationModalDescription"></p>
      <canvas class="map-population-canvas" id="mapPopulationCanvas" width="520" height="360"></canvas>
      <div class="map-population-legend" id="mapPopulationLegend"></div>
      <button id="mapPopulationModalClose" class="primary" type="button"></button>
    </div>
    <div class="inventory-edge inventory-right"></div>
    <div class="inventory-corner inventory-bottom-left"></div>
    <div class="inventory-edge inventory-bottom"></div>
    <div class="inventory-corner inventory-bottom-right"></div>
  </div>

  <div class="briefing-modal-shield map-radar-modal-shield" id="mapRadarModalShield" hidden></div>
  <div class="briefing-modal map-radar-modal pixel-modal" id="mapRadarModal" hidden>
    <div class="inventory-corner inventory-top-left"></div>
    <div class="inventory-edge inventory-top"></div>
    <div class="inventory-corner inventory-top-right"></div>
    <div class="inventory-edge inventory-left"></div>
    <div class="briefing-modal-content map-radar-content pixel-modal-content">
      <div class="map-radar-radar-area">
        <div class="radar-wrap map-radar-wrap">
          <canvas class="radar-canvas" id="mapRadarCanvas" width="520" height="520"></canvas>
          <div class="radar-controls" id="mapRadarStats"></div>
        </div>
        <div class="radar-modal-shield" id="mapRadarStatModalShield" hidden></div>
        <div class="radar-modal pixel-modal" id="mapRadarStatModal" hidden>
          <div class="inventory-corner inventory-top-left"></div>
          <div class="inventory-edge inventory-top"></div>
          <div class="inventory-corner inventory-top-right"></div>
          <div class="inventory-edge inventory-left"></div>
          <div class="radar-modal-content pixel-modal-content">
            <h3 id="mapRadarStatModalTitle"></h3>
            <p id="mapRadarStatModalDescription"></p>
            <div class="modal-points" id="mapRadarStatModalPoints"></div>
            <button id="mapRadarStatModalClose" class="primary" type="button"></button>
          </div>
          <div class="inventory-edge inventory-right"></div>
          <div class="inventory-corner inventory-bottom-left"></div>
          <div class="inventory-edge inventory-bottom"></div>
          <div class="inventory-corner inventory-bottom-right"></div>
        </div>
      </div>
      <aside class="map-radar-side-panel">
        <span class="pixel-button-frame" aria-hidden="true">
          <span class="pixel-button-piece top-left"></span>
          <span class="pixel-button-piece top"></span>
          <span class="pixel-button-piece top-right"></span>
          <span class="pixel-button-piece left"></span>
          <span class="pixel-button-piece center"></span>
          <span class="pixel-button-piece right"></span>
          <span class="pixel-button-piece bottom-left"></span>
          <span class="pixel-button-piece bottom"></span>
          <span class="pixel-button-piece bottom-right"></span>
        </span>
        <div class="gem-counter-control map-radar-gem-control">
          <span class="points" id="mapRadarPointsLabel"><span id="mapRadarPointsUnit">XP : </span><span id="mapRadarPointsLeft">10</span></span>
          <button id="mapRadarResetBuild" class="secondary gem-reset-button" type="button"></button>
        </div>
      </aside>
      <button id="mapRadarModalClose" class="primary map-radar-ok" type="button"></button>
    </div>
    <div class="inventory-edge inventory-right"></div>
    <div class="inventory-corner inventory-bottom-left"></div>
    <div class="inventory-edge inventory-bottom"></div>
    <div class="inventory-corner inventory-bottom-right"></div>
  </div>

  <div class="briefing-modal-shield map-reward-modal-shield" id="mapRewardModalShield" hidden></div>
  <div class="briefing-modal map-reward-modal pixel-modal" id="mapRewardModal" hidden>
    <div class="inventory-corner inventory-top-left"></div>
    <div class="inventory-edge inventory-top"></div>
    <div class="inventory-corner inventory-top-right"></div>
    <div class="inventory-edge inventory-left"></div>
    <div class="briefing-modal-content map-reward-content pixel-modal-content">
      <h3 id="mapRewardModalTitle"></h3>
      <p id="mapRewardModalDescription"></p>
      <button id="mapRewardModalOk" class="primary" type="button"></button>
    </div>
    <div class="inventory-edge inventory-right"></div>
    <div class="inventory-corner inventory-bottom-left"></div>
    <div class="inventory-edge inventory-bottom"></div>
    <div class="inventory-corner inventory-bottom-right"></div>
  </div>

  <div class="encounter-transition" id="encounterTransition" hidden aria-hidden="true">
    <div class="encounter-transition-layer"></div>
  </div>

  <section class="layout hunt-briefing-layout" id="prepSection" hidden>
    <p class="encounter-sentence" id="encounterSentence"></p>

    <section class="panel briefing-panel hunt-briefing-panel">
      <span class="pixel-button-frame" aria-hidden="true">
        <span class="pixel-button-piece top-left"></span>
        <span class="pixel-button-piece top"></span>
        <span class="pixel-button-piece top-right"></span>
        <span class="pixel-button-piece left"></span>
        <span class="pixel-button-piece center"></span>
        <span class="pixel-button-piece right"></span>
        <span class="pixel-button-piece bottom-left"></span>
        <span class="pixel-button-piece bottom"></span>
        <span class="pixel-button-piece bottom-right"></span>
      </span>
      <div class="hunt-briefing-content">
        <div class="encounter-card">
          <div class="creature-stage" id="creatureStage">
            <div class="creature-sprite" id="creatureSprite" role="img"></div>
          </div>
        </div>

        <div class="creature-info-actions">
          <div class="hunt-creature-meta-row">
            <div class="roster-meta-block hunt-creature-type" id="huntCreatureType"></div>
            <div class="roster-meta-block hunt-creature-level" id="huntCreatureLevel"></div>
          </div>
          <button id="behaviorButton" class="secondary" type="button"></button>
          <button id="captureConditionsButton" class="secondary" type="button"></button>
        </div>
      </div>
    </section>

    <aside class="panel radar-panel hunt-radar-panel">
      <div class="radar-wrap">
        <canvas class="radar-canvas" id="radar" width="520" height="520"></canvas>
        <div class="radar-controls" id="stats"></div>
      </div>
      <div class="radar-modal-shield" id="radarModalShield" hidden></div>
      <div class="radar-modal pixel-modal" id="radarModal" hidden>
        <div class="inventory-corner inventory-top-left"></div>
        <div class="inventory-edge inventory-top"></div>
        <div class="inventory-corner inventory-top-right"></div>
        <div class="inventory-edge inventory-left"></div>
        <div class="radar-modal-content pixel-modal-content">
          <h3 id="radarModalTitle"></h3>
          <p id="radarModalDescription"></p>
          <div class="modal-points" id="radarModalPoints"></div>
          <button id="radarModalClose" class="primary" type="button"></button>
        </div>
        <div class="inventory-edge inventory-right"></div>
        <div class="inventory-corner inventory-bottom-left"></div>
        <div class="inventory-edge inventory-bottom"></div>
        <div class="inventory-corner inventory-bottom-right"></div>
      </div>
    </aside>

    <div class="hunt-side-panel human-side-panel">
      <span class="pixel-button-frame" aria-hidden="true">
        <span class="pixel-button-piece top-left"></span>
        <span class="pixel-button-piece top"></span>
        <span class="pixel-button-piece top-right"></span>
        <span class="pixel-button-piece left"></span>
        <span class="pixel-button-piece center"></span>
        <span class="pixel-button-piece right"></span>
        <span class="pixel-button-piece bottom-left"></span>
        <span class="pixel-button-piece bottom"></span>
        <span class="pixel-button-piece bottom-right"></span>
      </span>
      <div class="human-side-content hunt-side-content">
        <div class="gem-counter-control">
          <span class="points" id="pointsLeftLabel"><span id="pointsUnit">XP : </span><span id="pointsLeft">10</span></span>
          <button id="resetBuild" class="secondary gem-reset-button" type="button"></button>
        </div>
        <div class="human-side-actions hunt-side-actions">
          <button id="affixButton" class="secondary" type="button"></button>
          <button id="fleeButton" class="secondary" type="button"></button>
          <button id="startCapture" class="primary"></button>
        </div>
      </div>
    </div>

  </section>

  <section class="layout human-briefing-layout" id="humanBriefingSection" hidden>
    <p class="encounter-sentence" id="humanEncounterSentence"></p>

    <section class="panel briefing-panel human-briefing-panel">
      <span class="pixel-button-frame" aria-hidden="true">
        <span class="pixel-button-piece top-left"></span>
        <span class="pixel-button-piece top"></span>
        <span class="pixel-button-piece top-right"></span>
        <span class="pixel-button-piece left"></span>
        <span class="pixel-button-piece center"></span>
        <span class="pixel-button-piece right"></span>
        <span class="pixel-button-piece bottom-left"></span>
        <span class="pixel-button-piece bottom"></span>
        <span class="pixel-button-piece bottom-right"></span>
      </span>
      <div class="human-briefing-content">
        <div class="encounter-card">
          <div class="human-stage" id="humanStage">
            <div class="human-sprite" id="humanSprite" role="img"></div>
          </div>
        </div>
        <div class="enemy-team-slots" id="humanEnemyTeamSlots"></div>
        <button id="humanEnemyRadarButton" class="secondary human-enemy-radar-button" type="button"></button>
      </div>
    </section>

    <aside class="panel radar-panel human-radar-panel">
      <div class="radar-wrap">
        <canvas class="radar-canvas" id="humanRadar" width="520" height="520"></canvas>
        <div class="radar-controls" id="humanStats"></div>
      </div>

      <div class="radar-modal-shield" id="humanRadarModalShield" hidden></div>
      <div class="radar-modal pixel-modal" id="humanRadarModal" hidden>
        <div class="inventory-corner inventory-top-left"></div>
        <div class="inventory-edge inventory-top"></div>
        <div class="inventory-corner inventory-top-right"></div>
        <div class="inventory-edge inventory-left"></div>
        <div class="radar-modal-content pixel-modal-content">
          <h3 id="humanRadarModalTitle"></h3>
          <p id="humanRadarModalDescription"></p>
          <div class="modal-points" id="humanRadarModalPoints"></div>
          <button id="humanRadarModalClose" class="primary" type="button"></button>
        </div>
        <div class="inventory-edge inventory-right"></div>
        <div class="inventory-corner inventory-bottom-left"></div>
        <div class="inventory-edge inventory-bottom"></div>
        <div class="inventory-corner inventory-bottom-right"></div>
      </div>
    </aside>

    <div class="human-side-panel">
      <span class="pixel-button-frame" aria-hidden="true">
        <span class="pixel-button-piece top-left"></span>
        <span class="pixel-button-piece top"></span>
        <span class="pixel-button-piece top-right"></span>
        <span class="pixel-button-piece left"></span>
        <span class="pixel-button-piece center"></span>
        <span class="pixel-button-piece right"></span>
        <span class="pixel-button-piece bottom-left"></span>
        <span class="pixel-button-piece bottom"></span>
        <span class="pixel-button-piece bottom-right"></span>
      </span>
      <div class="human-side-content">
        <div class="gem-counter-control">
          <span class="points" id="humanPointsLeftLabel"><span id="humanPointsUnit">XP : </span><span id="humanPointsLeft">10</span></span>
          <button id="humanResetBuild" class="secondary gem-reset-button" type="button"></button>
        </div>
        <div class="human-roster-slots" id="humanRosterSlots">
          <button class="roster-slot" type="button" data-slot="0"></button>
          <button class="roster-slot" type="button" data-slot="1"></button>
          <button class="roster-slot" type="button" data-slot="2"></button>
        </div>
        <div class="human-side-actions">
          <button id="humanInstinctButton" class="secondary" type="button"></button>
          <button id="startHumanCombat" class="primary"></button>
        </div>
      </div>
    </div>
  </section>

  <div class="briefing-modal-shield" id="humanEnemyRadarModalShield" hidden></div>
  <div class="briefing-modal human-enemy-radar-modal pixel-modal" id="humanEnemyRadarModal" hidden>
    <div class="inventory-corner inventory-top-left"></div>
    <div class="inventory-edge inventory-top"></div>
    <div class="inventory-corner inventory-top-right"></div>
    <div class="inventory-edge inventory-left"></div>
    <div class="briefing-modal-content pixel-modal-content">
      <h3 id="humanEnemyRadarModalTitle"></h3>
      <p id="humanEnemyRadarModalDescription"></p>
      <div class="enemy-radar-scroll">
        <canvas class="enemy-radar-canvas" id="humanEnemyRadarCanvas" width="520" height="360"></canvas>
      </div>
      <button id="humanEnemyRadarModalClose" class="primary" type="button"></button>
    </div>
    <div class="inventory-edge inventory-right"></div>
    <div class="inventory-corner inventory-bottom-left"></div>
    <div class="inventory-edge inventory-bottom"></div>
    <div class="inventory-corner inventory-bottom-right"></div>
  </div>

  <div class="briefing-modal-shield" id="humanEnemyTeamModalShield" hidden></div>
  <div class="briefing-modal human-enemy-team-modal pixel-modal" id="humanEnemyTeamModal" hidden>
    <div class="inventory-corner inventory-top-left"></div>
    <div class="inventory-edge inventory-top"></div>
    <div class="inventory-corner inventory-top-right"></div>
    <div class="inventory-edge inventory-left"></div>
    <div class="briefing-modal-content pixel-modal-content">
      <h3 id="humanEnemyTeamModalTitle"></h3>
      <div class="enemy-team-modal-list" id="humanEnemyTeamModalList"></div>
      <button id="humanEnemyTeamModalClose" class="primary" type="button"></button>
    </div>
    <div class="inventory-edge inventory-right"></div>
    <div class="inventory-corner inventory-bottom-left"></div>
    <div class="inventory-edge inventory-bottom"></div>
    <div class="inventory-corner inventory-bottom-right"></div>
  </div>

  <div class="briefing-modal-shield" id="briefingModalShield" hidden></div>
  <div class="briefing-modal pixel-modal" id="briefingModal" hidden>
    <div class="inventory-corner inventory-top-left"></div>
    <div class="inventory-edge inventory-top"></div>
    <div class="inventory-corner inventory-top-right"></div>
    <div class="inventory-edge inventory-left"></div>
    <div class="briefing-modal-content pixel-modal-content">
      <h3 id="briefingModalTitle"></h3>
      <p id="briefingModalDescription"></p>
      <div class="objective-list modal-objectives" id="briefingModalObjectives" hidden></div>
      <button id="briefingModalClose" class="primary" type="button"></button>
    </div>
    <div class="inventory-edge inventory-right"></div>
    <div class="inventory-corner inventory-bottom-left"></div>
    <div class="inventory-edge inventory-bottom"></div>
    <div class="inventory-corner inventory-bottom-right"></div>
  </div>

  <div class="briefing-modal-shield" id="instinctModalShield" hidden></div>
  <div class="briefing-modal pixel-modal" id="instinctModal" hidden>
    <div class="inventory-corner inventory-top-left"></div>
    <div class="inventory-edge inventory-top"></div>
    <div class="inventory-corner inventory-top-right"></div>
    <div class="inventory-edge inventory-left"></div>
    <div class="briefing-modal-content pixel-modal-content">
      <h3 id="instinctModalTitle"></h3>
      <p id="instinctModalPrompt"></p>
      <div class="objective-list modal-objectives" id="instinctModalList"></div>
      <button id="instinctModalClose" class="primary" type="button"></button>
    </div>
    <div class="inventory-edge inventory-right"></div>
    <div class="inventory-corner inventory-bottom-left"></div>
    <div class="inventory-edge inventory-bottom"></div>
    <div class="inventory-corner inventory-bottom-right"></div>
  </div>

  <section class="combat-section panel game-panel" id="combatSection" hidden>
    <div id="game">
      <div class="battle-stage" id="battleStage">
        <div class="enemy-gauges">
          <div class="bar-block">
            <div class="bar-head"><span id="enemyBarLabel"></span><span id="enemyHpText">0 / 0 PV</span></div>
            <div class="bar"><div class="bar-fill hp" id="enemyHpBar"></div></div>
          </div>
          <div class="bar-block">
            <div class="bar-head"><span id="enemyGuardBarLabel"></span><span id="enemyGuardText">0</span></div>
            <div class="bar"><div class="bar-fill guard" id="enemyGuardBar"></div></div>
          </div>
          <div class="pa-row" id="enemyPaDots"></div>
        </div>

        <div class="enemy-zone">
          <div class="combat-sprite creature-combat-sprite" id="enemySprite" role="img"></div>
        </div>

        <div class="hero-zone">
          <div class="combat-sprite hero-combat-sprite" id="heroSprite" role="img"></div>
        </div>

        <div class="hero-gauges">
          <div class="bar-block">
            <div class="bar-head"><span id="heroBarLabel"></span><span id="heroHpText">0 / 0 PV</span></div>
            <div class="bar"><div class="bar-fill hp" id="heroHpBar"></div></div>
          </div>
          <div class="bar-block">
            <div class="bar-head"><span id="guardBarLabel"></span><span id="guardText">0</span></div>
            <div class="bar"><div class="bar-fill guard" id="guardBar"></div></div>
          </div>
          <div class="pa-row" id="paDots"></div>
        </div>
      </div>

      <div class="phase-cover" id="phaseCover">
        <div>
          <strong id="loadingDuelTitle"></strong>
          <p id="loadingDuelDescription"></p>
        </div>
      </div>
    </div>

    <div class="combat-ui" id="combatUi" hidden>
      <div class="combat-actions">
        <button data-action="signature"></button>
        <button data-action="entaille"></button>
        <button data-action="garde"></button>
        <button data-action="feinte"></button>
        <button data-action="art"></button>
        <button data-action="capture"></button>
        <button data-action="bag"></button>
        <button data-action="end"></button>
      </div>
      <div class="combat-objectives">
        <h3 class="combat-objectives-title" id="combatObjectivesTitle"></h3>
        <div class="objective-list" id="objectives"></div>
      </div>
    </div>
    <div class="log-frame">
      <div class="log" id="log" aria-live="polite"></div>
    </div>

    <div class="inventory-modal-shield" id="inventoryModalShield" hidden>
      <div class="inventory-modal pixel-modal" id="inventoryModal" role="dialog" aria-modal="true">
        <div class="inventory-corner inventory-top-left"></div>
        <div class="inventory-edge inventory-top"></div>
        <div class="inventory-corner inventory-top-right"></div>
        <div class="inventory-edge inventory-left"></div>
        <div class="inventory-center pixel-modal-content">
          <div class="inventory-status-row">
            <div class="inventory-hp">
              <div class="bar-head"><span id="inventoryHeroHpLabel"></span><span id="inventoryHeroHpText">0 / 0 PV</span></div>
              <div class="bar"><div class="bar-fill hp" id="inventoryHeroHpBar"></div></div>
            </div>
            <div class="inventory-currencies">
              <span class="inventory-currency"><img src="/assets/inventaire/or.png" alt=""><span id="inventoryGoldText">0</span></span>
              <span class="inventory-currency"><img src="/assets/inventaire/XP.png" alt=""><span id="inventoryStarsText">0</span></span>
              <span class="inventory-currency"><img src="/assets/inventaire/gemme.png" alt=""><span id="inventoryGemsText">0</span></span>
            </div>
          </div>
          <div class="inventory-items" id="inventoryItems"></div>
          <button class="secondary inventory-options" id="inventoryModalOptions" type="button"></button>
          <button class="primary inventory-ok" id="inventoryModalClose" type="button"></button>
        </div>
        <div class="inventory-edge inventory-right"></div>
        <div class="inventory-corner inventory-bottom-left"></div>
        <div class="inventory-edge inventory-bottom"></div>
        <div class="inventory-corner inventory-bottom-right"></div>
      </div>
    </div>
  </section>
`;

export function mountAppShell(root) {
  if (!root) {
    throw new Error("Missing app root for shell mounting.");
  }

  root.innerHTML = appShellTemplate;
}
