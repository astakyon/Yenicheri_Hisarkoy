/**
 * main.js — Oyun başlangıç noktası
 * Tüm sistemleri sırayla başlatır
 * v1.00
 */

'use strict';
import { VERSION, Loop, Bus, EVENTS }   from './core/Engine.js';
import { Save }                          from './core/SaveSystem.js';
import { Gold }                          from './systems/GoldSystem.js';
import { Player }                        from './systems/PlayerSystem.js';
import { AbilitySystem }                 from './systems/AbilitySystem.js';
import { Input }                         from './systems/InputSystem.js';
import { UI, SCREENS }                   from './ui/UIManager.js';
import { Maps }                          from './maps/MapManager.js';

// ─── BAŞLATMA ────────────────────────────────────────────────
async function boot() {
  console.log(`%c☽✦ YENİÇERİ: HİSARKÖY MUHAFIZI ${VERSION} ✦☾`, 'color:#FFD700;font-weight:bold;');

  // 1) Kayıt sistemi
  Save.load();

  // 2) Ekonomi
  Gold.init();

  // 3) Oyuncu
  Player.init();

  // 4) Yetenekler
  AbilitySystem.init();

  // 5) UI
  UI.init();

  // 6) Girdi
  const canvas = document.getElementById('c3d');
  if (canvas) Input.init(canvas);

  // 7) Ana döngüyü başlat
  Loop.start();

  // 8) Olayları bağla
  _bindGlobalEvents();

  // 9) Başlangıç ekranı
  if (Save.hasSave()) {
    UI.show(SCREENS.MENU);
    document.getElementById('btn-continue')?.removeAttribute('disabled');
  } else {
    UI.show(SCREENS.MENU);
    document.getElementById('btn-continue')?.setAttribute('disabled', 'true');
  }
}

// ─── GLOBAL OLAY BAĞLAYICILARI ───────────────────────────────
function _bindGlobalEvents() {
  // Dalga milestone → mola menüsü
  Bus.on(EVENTS.WAVE_MILESTONE, ({ wave }) => {
    UI.showMilestone({ wave, poolGold: Gold.poolGold });
  });

  // Boss öldü → para transferi
  Bus.on(EVENTS.BOSS_DIED, () => {
    Gold.transferPool();
  });

  // Oyuncu öldü → havuz kaybı + ölüm ekranı
  Bus.on(EVENTS.PLAYER_DIED, ({ kills, wave }) => {
    Gold.losePool();
    UI.showDeath({ kills, poolGold: 0, wave });
  });

  // Harita değişti → ilgili UI'ı göster
  Bus.on(EVENTS.MAP_CHANGE, ({ mapId }) => {
    UI.hideAll();
    if (mapId === 'kisla') {
      UI.show(SCREENS.HUD);
    } else {
      UI.show(SCREENS.HUD);
    }
  });

  // Duraklat
  Bus.on('input:pause', () => {
    if (UI.isVisible(SCREENS.PAUSE)) {
      UI.hide(SCREENS.PAUSE);
      // haritayı devam ettir
      Maps.currentMap?.resume?.();
    } else {
      UI.show(SCREENS.PAUSE);
      Maps.currentMap?.pause?.();
    }
  });
}

// ─── HTML BUTON HANDLER'LARI ──────────────────────────────────
// index.html'deki butonlar bunları çağırır
window.Game = {
  // Ana menü
  startNew()  { Save.reset(); Maps.load('kisla'); },
  continue_() { Maps.load('kisla'); },
  goMapSelect(){ UI.show(SCREENS.MAP_SELECT); },

  // Harita seç
  loadMap(id) { Maps.load(id); UI.hide(SCREENS.MAP_SELECT); },

  // Duraklat
  resume()     { Bus.emit('input:pause'); },
  toMainMenu() { Maps.exit(); UI.hideAll(); UI.show(SCREENS.MENU); Gold.returnToBarracks(); },

  // Milestone mola
  continueWave() {
    const { WaveSystem } = await import('./systems/WaveSystem.js');
    WaveSystem.continueAfterMilestone();
    UI.hide(SCREENS.MILESTONE);
  },
  returnToBarracks() {
    Gold.returnToBarracks();
    Maps.load('kisla');
    UI.hide(SCREENS.MILESTONE);
  },

  // Ölüm
  retry()     { Maps.load(Maps.currentId || 'gorev'); UI.hide(SCREENS.DEATH); },
  deathMenu() { Maps.exit(); UI.hideAll(); UI.show(SCREENS.MENU); },
};

// ─── BAŞLAT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', boot);
