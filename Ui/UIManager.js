/**
 * ui/UIManager.js — Ekran & bildirim yönetimi
 * Her ekran kendi HTML elementine sahip, manager açıp kapatır
 * v1.00
 */

'use strict';
import { Bus, EVENTS, VERSION } from '../core/Engine.js';

// ─── EKRAN ID'LERİ ───────────────────────────────────────────
export const SCREENS = {
  MENU:        'screen-menu',
  MAP_SELECT:  'screen-mapselect',
  LOADING:     'screen-loading',
  HUD:         'screen-hud',
  PAUSE:       'screen-pause',
  MILESTONE:   'screen-milestone',
  DEATH:       'screen-death',
  BARRACKS:    'screen-barracks',  // kışla içi menü
};

class UIManager {
  constructor() {
    this._active    = new Set();
    this._notifQ    = [];
    this._notifBusy = false;
  }

  // ─── BAŞLAT ────────────────────────────────────────────────
  init() {
    // Versiyon etiketlerini güncelle
    document.querySelectorAll('[data-version]').forEach(el => {
      el.textContent = VERSION;
    });

    // EventBus dinleyicileri
    Bus.on(EVENTS.UI_SHOW_SCREEN, ({ screen }) => this.show(screen));
    Bus.on(EVENTS.UI_HIDE_SCREEN, ({ screen }) => this.hide(screen));
    Bus.on(EVENTS.UI_NOTIFICATION, data => this.notify(data));

    // HUD güncellemeleri
    Bus.on(EVENTS.GOLD_CHANGED,   d => this._updateGold(d));
    Bus.on(EVENTS.WAVE_START,     d => this._updateWave(d));
    Bus.on(EVENTS.PLAYER_LEVEL_UP,d => this._updateLevel(d));
    Bus.on(EVENTS.PLAYER_DAMAGED, d => this._updateBars(d));
    Bus.on(EVENTS.PLAYER_HEALED,  d => this._updateBars(d));
  }

  // ─── EKRAN AÇ/KAPAT ────────────────────────────────────────
  show(screenId) {
    const el = document.getElementById(screenId);
    if (!el) return;
    el.style.display = 'flex';
    this._active.add(screenId);
  }

  hide(screenId) {
    const el = document.getElementById(screenId);
    if (!el) return;
    el.style.display = 'none';
    this._active.delete(screenId);
  }

  hideAll() {
    this._active.forEach(id => this.hide(id));
  }

  isVisible(screenId) { return this._active.has(screenId); }

  // ─── BİLDİRİM ──────────────────────────────────────────────
  notify({ text, type = 'info', duration = 2200 }) {
    this._notifQ.push({ text, type, duration });
    if (!this._notifBusy) this._processNotifQ();
  }

  _processNotifQ() {
    if (this._notifQ.length === 0) { this._notifBusy = false; return; }
    this._notifBusy = true;
    const { text, type, duration } = this._notifQ.shift();
    const el = document.getElementById('ui-notification');
    if (!el) { this._processNotifQ(); return; }

    el.textContent  = text;
    el.className    = `ui-notif ui-notif--${type}`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';

    setTimeout(() => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(-12px)';
      setTimeout(() => this._processNotifQ(), 300);
    }, duration);
  }

  // ─── HUD YÜKSELTMELERİ ────────────────────────────────────
  updateHUD({ hp, maxHp, en, maxEn }) {
    this._setBar('hud-hp',  hp,  maxHp);
    this._setBar('hud-en',  en,  maxEn);
    this._setText('hud-hp-val', Math.ceil(hp));
    this._setText('hud-en-val', Math.ceil(en));
  }

  updateAbilityCooldown(key, pct) {
    // pct: 0 = hazır, 1 = tam CD
    const el = document.getElementById(`ability-${key}-cd`);
    if (el) el.style.height = (pct * 100) + '%';
    const btn = document.getElementById(`ability-btn-${key}`);
    if (btn) btn.classList.toggle('ready', pct === 0);
  }

  _updateGold({ main, pool }) {
    this._setText('hud-gold-main', main);
    this._setText('hud-gold-pool', pool > 0 ? `(+${pool})` : '');
  }

  _updateWave({ wave, isBoss }) {
    this._setText('hud-wave', `Dalga ${wave}${isBoss ? ' ⚠ BOSS' : ''}`);
  }

  _updateLevel({ level }) {
    this._setText('hud-level', `Sv.${level}`);
  }

  _updateBars({ hp, maxHp, en, maxEn }) {
    this.updateHUD({ hp, maxHp, en, maxEn });
  }

  _setBar(id, val, max) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${(val / max) * 100}%`;
  }

  _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ─── MILESTONE MENÜSÜ ──────────────────────────────────────
  showMilestone({ wave, poolGold }) {
    this._setText('milestone-wave',  `Dalga ${wave} Tamamlandı!`);
    this._setText('milestone-pool',  `Havuz: ${poolGold} Akçe`);
    this.show(SCREENS.MILESTONE);
  }

  // ─── ÖLÜM EKRANI ───────────────────────────────────────────
  showDeath({ kills, poolGold, wave }) {
    this._setText('death-kills',  kills);
    this._setText('death-gold',   poolGold);
    this._setText('death-wave',   wave);
    this.hide(SCREENS.HUD);
    this.show(SCREENS.DEATH);
  }
}

export const UI = new UIManager();
