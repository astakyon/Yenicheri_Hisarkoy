/**
 * systems/AbilitySystem.js — Aktif yetenek yönetimi (Q/F/R)
 * v1.00
 */

'use strict';
import { Bus, EVENTS } from '../core/Engine.js';
import { Save } from '../core/SaveSystem.js';
import { ABILITY_DEFS } from './PlayerSystem.js';

class AbilitySystem {
  constructor() {
    this._slots    = { q: null, f: null, r: null };
    this._cooldowns = { q: 0, f: 0, r: 0 };  // saniye cinsinden kalan CD
    this._active   = { q: false, f: false, r: false }; // efekt süresi
    this._timers   = { q: 0, f: 0, r: 0 };   // efekt süresi kalan
  }

  init() {
    const saved = Save.get('player.abilities.active') || {};
    ['q', 'f', 'r'].forEach(key => {
      const sl = saved[key];
      if (sl && sl.unlocked && sl.level > 0) {
        const def = Object.values(ABILITY_DEFS).find(d => d.key === key);
        if (def) this._slots[key] = { def, level: sl.level };
      }
    });
  }

  // ─── GÜNCELLEME ────────────────────────────────────────────
  update(dt) {
    ['q', 'f', 'r'].forEach(key => {
      // CD geri sayım
      if (this._cooldowns[key] > 0) {
        this._cooldowns[key] = Math.max(0, this._cooldowns[key] - dt);
        if (this._cooldowns[key] === 0) Bus.emit(EVENTS.ABILITY_READY, { key });
      }
      // Aktif efekt süresi
      if (this._active[key]) {
        this._timers[key] = Math.max(0, this._timers[key] - dt);
        if (this._timers[key] === 0) this._active[key] = false;
      }
    });
  }

  // ─── YETENEĞİ KULLAN ───────────────────────────────────────
  use(key, context) {
    const slot = this._slots[key];
    if (!slot) return false;
    if (this._cooldowns[key] > 0) return false;

    const lvlData = slot.def.levels[slot.level - 1];
    const result  = this._applyEffect(key, slot.def.id || key, lvlData, context);
    if (!result) return false;

    this._cooldowns[key] = lvlData.cd;
    this._active[key]    = true;
    this._timers[key]    = lvlData.duration || 0;
    Bus.emit(EVENTS.ABILITY_USED, { key, def: slot.def, lvlData });
    return true;
  }

  _applyEffect(key, id, lvlData, ctx) {
    // ctx: { player, enemies, scene } — harita modülünden gelir
    if (!ctx) return false;

    if (id === 'savasciglik' || key === 'q') {
      // Yakındaki düşmanları geri it
      if (!ctx.enemies) return false;
      ctx.enemies.forEach(en => {
        const dx = en.x - ctx.px, dz = en.z - ctx.pz;
        const d  = Math.hypot(dx, dz);
        if (d < (lvlData.range || 5) && d > 0) {
          en.x += (dx / d) * 5;
          en.z += (dz / d) * 5;
          en.stunned = (lvlData.stunDur || 2);
        }
      });
      return true;
    }

    if (id === 'demir_kalkan' || key === 'f') {
      if (!ctx.setShield) return false;
      ctx.setShield(lvlData.duration || 3);
      return true;
    }

    if (id === 'hizli_atis' || key === 'r') {
      if (!ctx.setSpeedBuff) return false;
      ctx.setSpeedBuff(lvlData.speedMult || 2, lvlData.dmgMult || 1.5, lvlData.duration || 4);
      return true;
    }

    return false;
  }

  // ─── DURUM SORGULAMA ───────────────────────────────────────
  isReady(key)        { return !!this._slots[key] && this._cooldowns[key] === 0; }
  isUnlocked(key)     { return !!this._slots[key]; }
  getCooldown(key)    { return this._cooldowns[key]; }
  isActive(key)       { return this._active[key]; }
  getSlot(key)        { return this._slots[key]; }

  getCooldownPct(key) {
    const slot = this._slots[key];
    if (!slot) return 0;
    const maxCD = slot.def.levels[slot.level - 1].cd;
    return this._cooldowns[key] / maxCD;
  }
}

export const AbilitySystem = new AbilitySystem();
