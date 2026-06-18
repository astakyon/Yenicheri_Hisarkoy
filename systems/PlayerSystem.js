/**
 * systems/PlayerSystem.js — Oyuncu istatistikleri, level, XP, zırh
 * v1.00
 */

'use strict';
import { Bus, EVENTS, CONSTANTS } from '../core/Engine.js';
import { Save } from '../core/SaveSystem.js';

// ─── ZIRh TANIMLAMALARI ──────────────────────────────────────
export const ARMOR_DEFS = {
  none:    { name: 'Zırhsız',          hpBonus: 0,   defense: 0,   speedPenalty: 0,   cost: 0    },
  leather: { name: 'Deri Zırh',        hpBonus: 25,  defense: 0.10, speedPenalty: 0,   cost: 200  },
  chain:   { name: 'Zincir Zırh',      hpBonus: 50,  defense: 0.20, speedPenalty: 0.05, cost: 500  },
  plate:   { name: 'Plaka Zırh',       hpBonus: 80,  defense: 0.35, speedPenalty: 0.10, cost: 1000 },
  ottoman: { name: 'Osmanlı Plakası',  hpBonus: 120, defense: 0.50, speedPenalty: 0.08, cost: 2500 },
};

// ─── SİLAH TANIMLAMALARI ─────────────────────────────────────
export const WEAPON_DEFS = {
  yatagan: {
    name: 'Yatağan',
    type: 'melee',
    icon: '🗡',
    baseDamage: 14,
    levelDamage: [14, 20, 28, 38, 50],
    upgradeCost: [0, 150, 300, 600, 1200],
  },
  tufek: {
    name: 'Tüfek',
    type: 'ranged',
    icon: '🔫',
    baseDamage: 36,
    levelDamage: [36, 48, 64, 84, 110],
    upgradeCost: [0, 200, 400, 800, 1600],
  },
  ok: {
    name: 'Ok-Yay',
    type: 'ranged',
    icon: '🏹',
    baseDamage: 22,
    levelDamage: [22, 30, 40, 52, 68],
    upgradeCost: [0, 120, 240, 480, 960],
  },
};

// ─── PASIF YETENEK TANIMLAMALARI ─────────────────────────────
export const PASSIVE_DEFS = {
  guc: {
    name: 'Güç',
    icon: '⚔',
    levels: [
      { cost: 100, desc: '+%10 hasar',  effect: { damageBonus: 0.10 } },
      { cost: 250, desc: '+%20 hasar',  effect: { damageBonus: 0.20 } },
      { cost: 500, desc: '+%35 hasar',  effect: { damageBonus: 0.35 } },
    ],
  },
  hiz: {
    name: 'Hız',
    icon: '💨',
    levels: [
      { cost: 100, desc: '+%10 hız',    effect: { speedBonus: 0.10 } },
      { cost: 250, desc: '+%20 hız',    effect: { speedBonus: 0.20 } },
      { cost: 500, desc: 'Koşu enerjisi -%30', effect: { speedBonus: 0.20, runCostMult: 0.70 } },
    ],
  },
  dayaniklilik: {
    name: 'Dayanıklılık',
    icon: '❤',
    levels: [
      { cost: 150, desc: '+25 max can',        effect: { maxHpBonus: 25 } },
      { cost: 350, desc: '+50 max can',        effect: { maxHpBonus: 50 } },
      { cost: 700, desc: 'Hasar alınca can yenile', effect: { maxHpBonus: 50, regenOnHit: 5 } },
    ],
  },
  loot: {
    name: 'Loot',
    icon: '🧲',
    levels: [
      { cost: 80,  desc: 'Mıknatıs +3m',       effect: { magnetBonus: 3 } },
      { cost: 200, desc: '+%20 akçe',           effect: { magnetBonus: 3, goldMult: 1.20 } },
      { cost: 400, desc: 'Nadir item +%15',     effect: { magnetBonus: 3, goldMult: 1.20, rareChance: 0.15 } },
    ],
  },
  kritik: {
    name: 'Kritik',
    icon: '💥',
    levels: [
      { cost: 120, desc: '+%10 kritik şans',    effect: { critChance: 0.10 } },
      { cost: 300, desc: '+%20 kritik şans',    effect: { critChance: 0.20 } },
      { cost: 600, desc: 'Kritik x2.5 hasar',  effect: { critChance: 0.20, critMult: 2.50 } },
    ],
  },
};

// ─── AKTİF YETENEK TANIMLAMALARI ─────────────────────────────
export const ABILITY_DEFS = {
  savasciglik: {
    name: 'Savaş Çığlığı',
    key: 'q',
    icon: '⚡',
    unlockCost: 100,
    baseCooldown: 8,
    description: 'Yakın düşmanları geri iter, 2 sn sersemletir',
    levels: [
      { cost: 0,   range: 4, stunDur: 1.5, cd: 8  },
      { cost: 200, range: 5, stunDur: 2.0, cd: 7  },
      { cost: 400, range: 6, stunDur: 2.5, cd: 6  },
      { cost: 800, range: 7, stunDur: 3.0, cd: 5  },
      { cost: 1600,range: 8, stunDur: 3.0, cd: 4  },
    ],
  },
  demir_kalkan: {
    name: 'Demir Kalkan',
    key: 'f',
    icon: '🛡',
    unlockCost: 150,
    baseCooldown: 15,
    description: '3 sn hasar engeli',
    levels: [
      { cost: 0,   duration: 2, cd: 15 },
      { cost: 250, duration: 2.5, cd: 13 },
      { cost: 500, duration: 3, cd: 11 },
      { cost: 1000,duration: 3.5, cd: 9  },
      { cost: 2000,duration: 4, cd: 7  },
    ],
  },
  hizli_atis: {
    name: 'Hızlı Atış',
    key: 'r',
    icon: '🔥',
    unlockCost: 200,
    baseCooldown: 20,
    description: '4 sn hız x2, hasar x1.5',
    levels: [
      { cost: 0,   speedMult: 1.8, dmgMult: 1.3, duration: 3, cd: 20 },
      { cost: 300, speedMult: 2.0, dmgMult: 1.5, duration: 3.5, cd: 18 },
      { cost: 600, speedMult: 2.0, dmgMult: 1.5, duration: 4, cd: 16 },
      { cost: 1200,speedMult: 2.2, dmgMult: 1.8, duration: 4, cd: 14 },
      { cost: 2400,speedMult: 2.5, dmgMult: 2.0, duration: 5, cd: 12 },
    ],
  },
};

// ─── OYUNCU SİSTEMİ ──────────────────────────────────────────
class PlayerSystem {
  constructor() {
    this._base = {
      hp: 100, maxHp: 100,
      en: 100, maxEn: 100,
      spd: 4, rspd: 7,
      damage: 1.0,   // çarpan
      defense: 0,
      critChance: 0,
      critMult: 2.0,
      magnetDist: CONSTANTS.MAGNET_DIST,
      goldMult: 1.0,
      runCostMult: 1.0,
    };
    this._computed = { ...this._base }; // pasif+zırh+silah bonuslarıyla hesaplanmış
    this._saveData = null;
  }

  init() {
    this._saveData = Save.getData();
    this._recompute();
    return this;
  }

  // ─── HESAPLAMA ─────────────────────────────────────────────
  _recompute() {
    const sd = this._saveData;
    const c = { ...this._base };

    // Pasif bonuslar
    const pass = sd.player.abilities?.passive || {};
    Object.entries(PASSIVE_DEFS).forEach(([key, def]) => {
      const lvl = pass[key] || 0;
      if (lvl > 0) {
        const eff = def.levels[lvl - 1].effect;
        if (eff.damageBonus)   c.damage       += eff.damageBonus;
        if (eff.speedBonus)    { c.spd *= (1 + eff.speedBonus); c.rspd *= (1 + eff.speedBonus); }
        if (eff.maxHpBonus)    c.maxHp += eff.maxHpBonus;
        if (eff.magnetBonus)   c.magnetDist += eff.magnetBonus;
        if (eff.goldMult)      c.goldMult = eff.goldMult;
        if (eff.runCostMult)   c.runCostMult = eff.runCostMult;
        if (eff.critChance)    c.critChance += eff.critChance;
        if (eff.critMult)      c.critMult = eff.critMult;
      }
    });

    // Zırh bonusu
    const armorId = sd.armor?.current || 'none';
    const armor   = ARMOR_DEFS[armorId];
    if (armor) {
      c.maxHp   += armor.hpBonus;
      c.defense += armor.defense;
      c.spd     *= (1 - armor.speedPenalty);
      c.rspd    *= (1 - armor.speedPenalty);
    }

    // Kayıttan gelen max hp/en
    c.maxHp = Math.max(c.maxHp, sd.player.maxHp || 100);
    c.maxEn = sd.player.maxEn || 100;

    this._computed = c;
    this._computed.hp = c.maxHp; // her hesaplamada canı doldurmuyoruz, dışarıdan ayarlanır
  }

  // Silah hasarı (seviye + damage çarpanı + kritik)
  getWeaponDamage(weaponId) {
    const def = WEAPON_DEFS[weaponId];
    if (!def) return 10;
    const lvl   = Save.get(`weapons.${weaponId}.level`) || 1;
    const base  = def.levelDamage[Math.min(lvl - 1, 4)];
    const roll  = Math.random() < this._computed.critChance;
    const mult  = roll ? this._computed.critMult : 1.0;
    return Math.floor(base * this._computed.damage * mult);
  }

  get stats()   { return this._computed; }
  get saveData(){ return this._saveData; }

  // Level atlama
  addXP(amount) {
    const sd = this._saveData.player;
    sd.xp += amount;
    while (sd.xp >= sd.xpNext) {
      sd.xp    -= sd.xpNext;
      sd.level += 1;
      sd.xpNext = Math.floor(sd.xpNext * 1.5);
      sd.maxHp += 5;
      sd.maxEn += 2;
      Save.save();
      Bus.emit(EVENTS.PLAYER_LEVEL_UP, { level: sd.level });
      Bus.emit(EVENTS.UI_NOTIFICATION, { text: `Seviye ${sd.level}! 🎖`, type: 'levelup' });
    }
    Save.save();
    this._recompute();
  }
}

export const Player = new PlayerSystem();
