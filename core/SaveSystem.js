/**
 * core/SaveSystem.js — Kalıcı kayıt sistemi (localStorage)
 * v1.00
 */

'use strict';
import { Bus, EVENTS } from './Engine.js';

const SAVE_KEY = 'yenicheri_save_v1';

// ─── VARSAYILAN KAYIT DURUMU ─────────────────────────────────
const DEFAULT_SAVE = {
  version:   'v1.00',
  timestamp: 0,

  // Para
  mainGold:  0,        // Kışlada kalıcı akçe

  // Karakter
  player: {
    level:   1,
    xp:      0,
    xpNext:  100,
    class:   null,     // 'yenicheri' | 'sipahi' | 'akinci' | 'azap'
    fame:    0,        // Ün puanı
    maxHp:   100,
    maxEn:   100,
    skin:    { kaftan: 'red', bork: 'standard', weapon: 'plain' },
  },

  // Silahlar (her biri 1-5 seviye)
  weapons: {
    yatagan: { owned: true,  level: 1 },
    tufek:   { owned: true,  level: 1 },
    ok:      { owned: true,  level: 1 },
    mizrak:  { owned: false, level: 0 },
    balta:   { owned: false, level: 0 },
  },

  // Zırh
  armor: {
    current: 'none',   // 'none' | 'leather' | 'chain' | 'plate' | 'ottoman'
    owned:   ['none'],
  },

  // Yetenekler
  abilities: {
    active: {
      q: { id: 'savasciglik', level: 0, unlocked: false },
      f: { id: 'demir_kalkan', level: 0, unlocked: false },
      r: { id: 'hizli_atis',  level: 0, unlocked: false },
    },
    passive: {
      guc:         0,  // 0-3 seviye
      hiz:         0,
      dayaniklilik: 0,
      loot:        0,
      kritik:      0,
    },
  },

  // Açılmış haritalar
  maps: {
    kisla:  { unlocked: true,  completed: false },
    gorev:  { unlocked: true,  completed: false },
    av:     { unlocked: false, completed: false },
    maden:  { unlocked: false, completed: false },
    tarim:  { unlocked: false, completed: false },
    sehir:  { unlocked: false, completed: false },
    saray:  { unlocked: false, completed: false },
  },

  // Başarılar
  achievements: {},

  // İstatistikler
  stats: {
    totalEnemiesKilled: 0,
    totalBossKilled:    0,
    highestWave:        0,
    totalGoldEarned:    0,
    totalPlayTime:      0,
  },
};

// ─── KAYIT SİSTEMİ ───────────────────────────────────────────
class SaveSystem {
  constructor() {
    this._data = null;
  }

  // Kayıtlı veriyi yükle (yoksa varsayılan)
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Derin birleştirme — yeni alanlar eklendiyse varsayılan değerlerle doldur
        this._data = this._deepMerge(DEFAULT_SAVE, parsed);
      } else {
        this._data = this._deepClone(DEFAULT_SAVE);
      }
    } catch (e) {
      console.warn('[Save] Yükleme hatası, varsayılan kullanılıyor:', e);
      this._data = this._deepClone(DEFAULT_SAVE);
    }
    Bus.emit(EVENTS.GAME_LOADED, this._data);
    return this._data;
  }

  // Kaydet
  save() {
    if (!this._data) return;
    this._data.timestamp = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this._data));
      Bus.emit(EVENTS.GAME_SAVED, this._data);
    } catch (e) {
      console.error('[Save] Kayıt hatası:', e);
    }
  }

  // Belirli bir alanı güncelle ve otomatik kaydet
  set(path, value) {
    const keys = path.split('.');
    let obj = this._data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.save();
  }

  // Belirli bir alanı oku
  get(path) {
    const keys = path.split('.');
    let obj = this._data;
    for (const key of keys) {
      if (obj == null) return undefined;
      obj = obj[key];
    }
    return obj;
  }

  // Tüm veriyi al
  getData() { return this._data; }

  // Sıfırla
  reset() {
    this._data = this._deepClone(DEFAULT_SAVE);
    this.save();
  }

  // Kayıt var mı?
  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  _deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

  _deepMerge(defaults, saved) {
    const result = this._deepClone(defaults);
    function merge(target, source) {
      for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          merge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    merge(result, saved);
    return result;
  }
}

export const Save = new SaveSystem();
