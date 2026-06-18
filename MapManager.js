/**
 * maps/MapManager.js — Çoklu harita yönetimi
 * Yeni harita eklemek için sadece MAP_REGISTRY'e kayıt yeterli
 * v1.00
 */

'use strict';
import { Bus, EVENTS, Loop } from '../core/Engine.js';
import { Save } from '../core/SaveSystem.js';

// ─── HARİTA KAYIT DEFTERİ ────────────────────────────────────
// Yeni harita eklemek için buraya bir satır ekle:
export const MAP_REGISTRY = {
  kisla: {
    id:          'kisla',
    name:        'Yeniçeri Kışlası',
    icon:        '🏰',
    description: 'Ana üssün. Geliştir, dinlen, hazırlan.',
    type:        'base',       // 'base' | 'combat' | 'hunt' | 'gather'
    unlocked:    true,
    loader:      () => import('./KislaMap.js'),
  },
  gorev: {
    id:          'gorev',
    name:        'Hisarköy Devriye',
    icon:        '⚔',
    description: 'Haydutlardan koru. Dalga dalga savaş.',
    type:        'combat',
    unlocked:    true,
    loader:      () => import('./GorevMap.js'),
  },
  av: {
    id:          'av',
    name:        'Anadolu Ormanı',
    icon:        '🏹',
    description: 'Hayvan avla, deri ve et topla.',
    type:        'hunt',
    unlocked:    false,
    loader:      () => import('./AvMap.js'),
  },
  maden: {
    id:          'maden',
    name:        'Demir Madeni',
    icon:        '⛏',
    description: 'Metal ve nadir maden topla.',
    type:        'gather',
    unlocked:    false,
    loader:      () => import('./MadenMap.js'),
  },
  tarim: {
    id:          'tarim',
    name:        'Tarım Ovası',
    icon:        '🌾',
    description: 'Köylüleri koru, tahıl topla.',
    type:        'combat',
    unlocked:    false,
    loader:      () => import('./TarimMap.js'),
  },
  sehir: {
    id:          'sehir',
    name:        'Yabancı Şehir',
    icon:        '🏙',
    description: 'Tehlikeli sokaklarda düzen sağla.',
    type:        'combat',
    unlocked:    false,
    loader:      () => import('./SehirMap.js'),
  },
  saray: {
    id:          'saray',
    name:        'Osmanlı Sarayı',
    icon:        '👑',
    description: 'Son görev. Hain Veziri durdur.',
    type:        'combat',
    unlocked:    false,
    loader:      () => import('./SarayMap.js'),
  },
};

// ─── HARİTA YÖNETİCİSİ ───────────────────────────────────────
class MapManager {
  constructor() {
    this._currentMap    = null;   // aktif harita modülü
    this._currentId     = null;
    this._transitioning = false;
  }

  // Haritayı yükle ve başlat
  async load(mapId) {
    const def = MAP_REGISTRY[mapId];
    if (!def) { console.error(`[Map] "${mapId}" bulunamadı`); return; }

    const saveUnlocked = Save.get(`maps.${mapId}.unlocked`);
    if (!saveUnlocked && !def.unlocked) {
      Bus.emit(EVENTS.UI_NOTIFICATION, { text: 'Bu harita kilitli! 🔒', type: 'error' });
      return;
    }

    if (this._transitioning) return;
    this._transitioning = true;

    // Mevcut haritayı kapat
    if (this._currentMap) {
      this._currentMap.destroy?.();
      Loop.unregister('activeMap');
    }

    // Yeni haritayı yükle (lazy import)
    try {
      Bus.emit(EVENTS.UI_SHOW_SCREEN, { screen: 'loading', mapId });
      const module = await def.loader();
      this._currentMap = new module.default();
      this._currentId  = mapId;
      await this._currentMap.init();
      Loop.register('activeMap', dt => this._currentMap.update(dt));
      Bus.emit(EVENTS.MAP_READY,  { mapId });
      Bus.emit(EVENTS.MAP_CHANGE, { mapId, def });
      Bus.emit(EVENTS.UI_HIDE_SCREEN, { screen: 'loading' });
    } catch (e) {
      console.error(`[Map] "${mapId}" yüklenirken hata:`, e);
      Bus.emit(EVENTS.UI_NOTIFICATION, { text: 'Harita yüklenemedi!', type: 'error' });
    }

    this._transitioning = false;
  }

  // Mevcut haritadan çık
  exit() {
    if (this._currentMap) {
      this._currentMap.destroy?.();
      Loop.unregister('activeMap');
      this._currentMap = null;
      this._currentId  = null;
    }
  }

  get currentId()  { return this._currentId; }
  get currentMap() { return this._currentMap; }

  // Harita bilgisi
  getMapDef(id) { return MAP_REGISTRY[id]; }
  getAllMaps()   { return Object.values(MAP_REGISTRY); }

  // Harita aç
  unlockMap(id) {
    Save.set(`maps.${id}.unlocked`, true);
    Bus.emit(EVENTS.UI_NOTIFICATION, {
      text: `${MAP_REGISTRY[id]?.name} haritası açıldı! 🗺`,
      type: 'unlock'
    });
  }
}

export const Maps = new MapManager();
