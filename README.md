# YENİÇERİ: HİSARKÖY MUHAFIZI — KOD MİMARİSİ
## v1.00

---

## 📁 KLASÖR YAPISI

```
yenicheri/
├── index.html              ← Tek HTML dosyası, tüm UI elementleri burada
├── main.js                 ← Giriş noktası, sistemleri başlatır
│
├── core/                   ← Çekirdek motor, hiçbir oyun mantığı yok
│   ├── Engine.js           ← EventBus, GameLoop, sabitler, VERSİYON
│   └── SaveSystem.js       ← localStorage kayıt/yükleme
│
├── systems/                ← Oyun sistemleri (birbirinden bağımsız)
│   ├── PlayerSystem.js     ← Stat, level, XP, silah/zırh tanımları
│   ├── GoldSystem.js       ← Ana akçe + havuz akçesi yönetimi
│   ├── WaveSystem.js       ← Dalga mantığı, milestone tespiti
│   ├── AbilitySystem.js    ← Aktif yetenekler Q/F/R, CD yönetimi
│   └── InputSystem.js      ← Klavye + Fare + Dokunmatik birleşik girdi
│
├── maps/                   ← Her harita kendi modülü
│   ├── MapManager.js       ← Harita kayıt defteri, lazy load, geçiş
│   ├── GorevMap.js         ← Hisarköy devriye (mevcut oyun)
│   ├── KislaMap.js         ← Yeniçeri kışlası
│   ├── AvMap.js            ← [İleride] Hayvan avlama
│   ├── MadenMap.js         ← [İleride] Maden tüneli
│   ├── TarimMap.js         ← [İleride] Tarım ovası
│   ├── SehirMap.js         ← [İleride] Yabancı şehir
│   └── SarayMap.js         ← [İleride] Osmanlı sarayı
│
└── ui/
    └── UIManager.js        ← Ekran aç/kapat, bildirim kuyruğu, HUD

```

---

## 🔌 SİSTEMLER ARASI İLETİŞİM

Modüller **birbirine doğrudan bağımlı değil**.
Hepsi `EventBus` (Engine.js → `Bus`) üzerinden haberleşir.

```
GoldSystem  →  Bus.emit('gold:changed')  →  UIManager günceller
WaveSystem  →  Bus.emit('wave:milestone') →  main.js mola menüsü açar
PlayerSystem → Bus.emit('player:died')   →  main.js havuzu siler, ölüm ekranı
```

### Olaylar (EVENTS):
| Olay | Kim gönderir | Kim dinler |
|---|---|---|
| `map:change` | MapManager | UIManager, main.js |
| `gold:changed` | GoldSystem | UIManager |
| `wave:start` | WaveSystem | GorevMap, UIManager |
| `wave:milestone` | WaveSystem | main.js → mola menüsü |
| `boss:died` | GorevMap | main.js → para transferi |
| `player:died` | GorevMap | main.js → havuz sil, ölüm ekranı |
| `input:pause` | InputSystem | main.js |
| `input:ability` | InputSystem | GorevMap → AbilitySystem |
| `input:joyMove` | InputSystem | UIManager → knob animasyonu |

---

## ➕ YENİ HARİTA EKLEMEK

1. `maps/YeniMap.js` dosyası oluştur, `BaseMap` arayüzünü uygula:
```js
export default class YeniMap {
  async init()    { /* Three.js sahneyi kur */ }
  update(dt)      { /* her frame */ }
  pause()         { /* durdur */ }
  resume()        { /* devam et */ }
  destroy()       { /* temizle */ }
}
```

2. `maps/MapManager.js` → `MAP_REGISTRY`'e ekle:
```js
yeni: {
  id: 'yeni', name: 'Yeni Harita', icon: '🗺',
  type: 'combat', unlocked: false,
  loader: () => import('./YeniMap.js'),
},
```

**Bu kadar.** Başka hiçbir dosyaya dokunmana gerek yok.

---

## 💾 KAYIT SİSTEMİ

`Save.get('player.level')`     ← Tek satırla oku  
`Save.set('player.level', 5)` ← Tek satırla yaz + otomatik kaydet  
`Save.getData()`               ← Tüm veri  

---

## 🪙 PARA SİSTEMİ

```
Ana Akçe (mainGold)   ← Kalıcı, localStorage
    ↑ transferPool()
Havuz Akçe (poolGold) ← Geçici, RAM'de
    → Boss yenilince: transferPool() → Ana'ya geçer
    → Boss yenmeden ölünce: losePool() → silinir
    → Kışlaya erken dönünce: returnToBarracks() → silinir
```

---

## 📦 İNDİRME DOSYALARI

Her dosya bağımsız indirilebilir:

| Dosya | Boyut | Açıklama |
|---|---|---|
| `core/Engine.js` | ~3KB | EventBus, döngü, sabitler |
| `core/SaveSystem.js` | ~3KB | Kayıt sistemi |
| `systems/PlayerSystem.js` | ~5KB | Karakter, silah, zırh tanımları |
| `systems/GoldSystem.js` | ~2KB | Para yönetimi |
| `systems/WaveSystem.js` | ~2KB | Dalga sistemi |
| `systems/AbilitySystem.js` | ~3KB | Yetenek sistemi |
| `systems/InputSystem.js` | ~4KB | Girdi sistemi |
| `maps/MapManager.js` | ~3KB | Harita yönetici |
| `ui/UIManager.js` | ~4KB | UI yöneticisi |
| `main.js` | ~3KB | Giriş noktası |

---

## 🔄 VERSİYONLAMA

`core/Engine.js` → `export const VERSION = 'v1.00';`

Her güncellemede bu satırı değiştir.  
UI'daki tüm `[data-version]` elementleri otomatik güncellenir.
