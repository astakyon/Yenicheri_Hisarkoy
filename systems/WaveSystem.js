/**
 * systems/WaveSystem.js — Dalga yönetimi
 * v1.00
 */

'use strict';
import { Bus, EVENTS, CONSTANTS } from '../core/Engine.js';
import { Save } from '../core/SaveSystem.js';

class WaveSystem {
  constructor() {
    this._wave       = 1;
    this._active     = false;
    this._timer      = 0;       // dalgalar arası bekleme (frame)
    this._enemyCount = 0;       // bu dalgadaki toplam düşman
    this._aliveCount = 0;
  }

  // ─── BAŞLATMA ──────────────────────────────────────────────
  reset() {
    this._wave       = 1;
    this._active     = false;
    this._timer      = CONSTANTS.WAVE_PAUSE_FRAMES;
    this._aliveCount = 0;
  }

  get wave()       { return this._wave; }
  get active()     { return this._active; }
  get isBossWave() { return this._wave % CONSTANTS.BOSS_EVERY_N_WAVES === 0; }
  get isMilestone(){ return this.isBossWave; }  // boss dalgası = milestone

  // ─── GÜNCELLEME (her frame) ────────────────────────────────
  update() {
    if (this._active) return;
    if (this._timer > 0) { this._timer--; return; }
    this._startWave();
  }

  // Düşman öldü bildirimi
  onEnemyKilled(isBoss) {
    this._aliveCount = Math.max(0, this._aliveCount - 1);
    if (this._aliveCount === 0 && this._active) {
      this._endWave();
    }
  }

  // Dışarıdan canlı düşman sayısı ayarla
  setAliveCount(n) { this._aliveCount = n; }

  // ─── İÇ MANTIK ─────────────────────────────────────────────
  _startWave() {
    this._active     = true;
    this._enemyCount = 3 + (this._wave - 1) * 2;
    this._aliveCount = this._enemyCount;

    const data = {
      wave:     this._wave,
      count:    this._enemyCount,
      isBoss:   this.isBossWave,
    };
    Bus.emit(EVENTS.WAVE_START, data);
  }

  _endWave() {
    this._active = false;

    const data = { wave: this._wave, isBoss: this.isBossWave };
    Bus.emit(EVENTS.WAVE_END, data);

    // 5'in katıysa → milestone
    if (this._wave % CONSTANTS.BOSS_EVERY_N_WAVES === 0) {
      Bus.emit(EVENTS.WAVE_MILESTONE, { wave: this._wave });
      // Milestone'da timer'ı durdur, UI yönetsin
      this._timer = 99999;
    } else {
      this._timer = CONSTANTS.WAVE_PAUSE_FRAMES;
      this._wave++;
    }
  }

  // Milestone onaylandı → devam et
  continueAfterMilestone() {
    this._wave++;
    this._timer = CONSTANTS.WAVE_PAUSE_FRAMES;
  }

  // İstatistik güncelle
  updateHighScore() {
    const prev = Save.get('stats.highestWave') || 0;
    if (this._wave > prev) Save.set('stats.highestWave', this._wave);
  }
}

export const WaveSystem = new WaveSystem();
