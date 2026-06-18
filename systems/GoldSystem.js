/**
 * systems/GoldSystem.js — Para yönetimi
 * Ana Akçe (kalıcı) + Havuz Akçesi (geçici, görev içi)
 * v1.00
 */

'use strict';
import { Bus, EVENTS } from '../core/Engine.js';
import { Save } from '../core/SaveSystem.js';

class GoldSystem {
  constructor() {
    this._mainGold = 0;   // Kalıcı, kışlada harcanır
    this._poolGold = 0;   // Geçici, görev içinde birikir
  }

  // ─── BAŞLATMA ──────────────────────────────────────────────
  init() {
    this._mainGold = Save.get('mainGold') || 0;
    this._poolGold = 0;
    this._emit();
  }

  // ─── ANA AKÇE ──────────────────────────────────────────────
  get mainGold()  { return this._mainGold; }
  get poolGold()  { return this._poolGold; }

  addMain(amount) {
    this._mainGold += amount;
    Save.set('mainGold', this._mainGold);
    this._emit();
    Bus.emit(EVENTS.UI_NOTIFICATION, { text: `+${amount} Akçe 🪙`, type: 'gold' });
  }

  spendMain(amount) {
    if (this._mainGold < amount) return false;
    this._mainGold -= amount;
    Save.set('mainGold', this._mainGold);
    this._emit();
    return true;
  }

  canAfford(amount) { return this._mainGold >= amount; }

  // ─── HAVUZ AKÇE (görev içi) ────────────────────────────────
  addPool(amount) {
    this._poolGold += amount;
    this._emit();
  }

  // Boss yenilince → havuz → ana akçeye geç
  transferPool() {
    if (this._poolGold <= 0) return;
    const amount = this._poolGold;
    this._mainGold += amount;
    this._poolGold = 0;
    Save.set('mainGold', this._mainGold);
    this._emit();
    Bus.emit(EVENTS.POOL_TRANSFERRED, { amount });
    Bus.emit(EVENTS.UI_NOTIFICATION, {
      text: `+${amount} Akçe kışlaya aktarıldı! 🪙`,
      type: 'transfer'
    });
    // İstatistik güncelle
    const prev = Save.get('stats.totalGoldEarned') || 0;
    Save.set('stats.totalGoldEarned', prev + amount);
  }

  // Boss yenmeden ölünce → havuz silinir
  losePool() {
    const lost = this._poolGold;
    this._poolGold = 0;
    this._emit();
    Bus.emit(EVENTS.POOL_LOST, { amount: lost });
    if (lost > 0) {
      Bus.emit(EVENTS.UI_NOTIFICATION, {
        text: `${lost} Akçe kaybedildi! 💸`,
        type: 'loss'
      });
    }
  }

  // Kışlaya dönünce (boss yenmeden) — havuz kaybedilir
  returnToBarracks() {
    this.losePool();
  }

  // ─── DURUM ─────────────────────────────────────────────────
  getState() {
    return { main: this._mainGold, pool: this._poolGold };
  }

  _emit() {
    Bus.emit(EVENTS.GOLD_CHANGED, this.getState());
  }
}

export const Gold = new GoldSystem();
