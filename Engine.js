/**
 * YENİÇERİ: HİSARKÖY MUHAFIZI
 * core/Engine.js — Ana motor, sabit değerler, EventBus
 * v1.00
 */

'use strict';

// ─── VERSİYON ────────────────────────────────────────────────
export const VERSION = 'v1.00';

// ─── SABİTLER ────────────────────────────────────────────────
export const CONSTANTS = {
  WORLD_SIZE: 60,
  CAMERA_HEIGHT: 14,
  CAMERA_DISTANCE: 15,
  CAMERA_SMOOTH: 0.09,
  CAMERA_SMOOTH_JOY: 0.18,
  JOY_DEAD: 10,
  JOY_MAX: 50,
  MAGNET_DIST: 7,
  COLLECT_DIST: 1.3,
  BOSS_EVERY_N_WAVES: 5,
  WAVE_PAUSE_FRAMES: 170,
};

// ─── EVENT BUS ───────────────────────────────────────────────
// Modüller birbirine doğrudan bağımlı olmadan haberleşir
class EventBus {
  constructor() { this._listeners = {}; }

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return () => this.off(event, fn); // unsubscribe fonksiyonu döndür
  }

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }

  clear() { this._listeners = {}; }
}

export const Bus = new EventBus();

// ─── OYUN OLAYLARI ───────────────────────────────────────────
export const EVENTS = {
  // Harita
  MAP_CHANGE:        'map:change',
  MAP_READY:         'map:ready',

  // Oyuncu
  PLAYER_MOVE:       'player:move',
  PLAYER_DAMAGED:    'player:damaged',
  PLAYER_DIED:       'player:died',
  PLAYER_HEALED:     'player:healed',
  PLAYER_LEVEL_UP:   'player:levelUp',

  // Düşman
  ENEMY_DIED:        'enemy:died',
  BOSS_DIED:         'boss:died',
  BOSS_SPAWNED:      'boss:spawned',

  // Dalga
  WAVE_START:        'wave:start',
  WAVE_END:          'wave:end',
  WAVE_MILESTONE:    'wave:milestone',  // 5'in katı

  // Para
  GOLD_CHANGED:      'gold:changed',    // { main, pool }
  POOL_TRANSFERRED:  'gold:poolTransfer',
  POOL_LOST:         'gold:poolLost',

  // Loot
  LOOT_COLLECTED:    'loot:collected',  // { type, amount }

  // UI
  UI_SHOW_SCREEN:    'ui:showScreen',
  UI_HIDE_SCREEN:    'ui:hideScreen',
  UI_NOTIFICATION:   'ui:notification',

  // Yetenek
  ABILITY_USED:      'ability:used',    // { id }
  ABILITY_READY:     'ability:ready',   // { id }

  // Kayıt
  GAME_SAVED:        'game:saved',
  GAME_LOADED:       'game:loaded',
};

// ─── ANA DÖNGÜ YÖNETİCİSİ ───────────────────────────────────
class GameLoop {
  constructor() {
    this._systems  = [];   // { id, update(dt) }
    this._running  = false;
    this._raf      = null;
    this._lastTime = 0;
  }

  register(id, updateFn) {
    this._systems.push({ id, update: updateFn });
  }

  unregister(id) {
    this._systems = this._systems.filter(s => s.id !== id);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._tick(this._lastTime);
  }

  stop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _tick(now) {
    if (!this._running) return;
    const dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;
    this._systems.forEach(s => {
      try { s.update(dt); }
      catch (e) { console.error(`[Loop] ${s.id} hatası:`, e); }
    });
    this._raf = requestAnimationFrame(t => this._tick(t));
  }
}

export const Loop = new GameLoop();
