# Mimari — Yeniçeri: Hisarköy Muhafızı

Oyun **tek bir `index.html`** olarak çalışır (GitHub Pages, telefonda Chrome).
Ama kaynak kod parçalara bölünmüştür; `index.html` her zaman `src/` klasöründen **üretilir**.

```
src/
  index.html          şablon: @@CSS@@, @@BODY@@, @@JS@@ yer tutucuları ve {{VERSION}}
  css/main.css        bütün stiller
  html/body.html      menüler, paneller, HUD, dokunmatik düğmeler
  js/SIRA.txt         JS modüllerinin birleştirme sırası
  js/<konu>/*.js      oyun kodu (35 modül)
tools/build.py        src/ -> index.html   (--check: güncel mi?)
tests/                test_kaynak.py (tarayıcısız), smoke.py (gerçek tarayıcı), altin.py (davranış referansı), run.sh (hepsi)
docs/                 bu belge ve yol haritası
arsiv/                bölmeden önceki tek dosyalık sürüm (game_v1.33.html)
VERSION               'v1.xx' — başlık, ana menü ve VERSION sabiti buradan gelir
index.html            ÜRETİLEN dosya, GitHub Pages bunu yayınlar
```

**Kural:** `index.html` doğrudan düzenlenmez. `src/` içinde değiştir → `python3 tools/build.py` → `sh tests/run.sh` → yayınla.

## Modüller (konu klasörleri)

| Klasör | İçerik |
|---|---|
| `cekirdek/` | sürüm ve kayıt (`SAVE`), ayarlar, oyun durumu (global değişkenler), **dünya modeli** (`WORLD`, oyuncu kaydı, `newNetId`, `nearestPlayer`), Three.js başlatma, ana güncelleme, oyun başlatma, ana döngü |
| `karakter/` | XP / seviye / sınıf, aktif yetenekler (Q/F/R), oyuncu modeli |
| `savas/` | düşman, ganimet ve efektler, savaş |
| `haritalar/` | her harita için sahne (`*-sahne`), yapay zekâ (`*-ai`) ve güncelleme (`*-guncelleme`): Kışla, Devriye, Av Ormanı, Demir Madeni |
| `editor/` | Harita Editörü: asset kütüphanesi, özel harita, mevcut haritaları editör biçimine çevirme |
| `ekran/` | menü animasyonu, Bölümler, büyük harita (krokisi, zoom/pan), mini harita, UI yardımcıları, bölge menüsü |
| `gorev/` | hikâye ve yan görevler, başarılar |
| `kontrol/` | klavye, dokunmatik, nişan |

Tüm dosyalar **tek script** olarak, `SIRA.txt` sırasıyla birleşir. Bu yüzden:
- Bir dosya yalnızca kendisinden **önce** gelen dosyalardaki `const`/`let` değişkenlerine yükleme anında erişebilir (aksi halde "before initialization" hatası). Fonksiyonların içinden erişmek serbest.
- Yeni dosya: kullandığı dosyalardan sonra, `cekirdek/ana-dongu.js`'den önce `SIRA.txt`'ye eklenir. Listede olmayan dosya derlemeyi durdurur.

## Yeni harita eklemek
1. `haritalar/<ad>-sahne.js`: `buildXXX()` (3D sahne, `clearScene()` ile başlar, `MAP_HALF` ayarlar)
2. `haritalar/<ad>-guncelleme.js`: `startXXX()` ve `updateXXX(dt)`
3. `cekirdek/guncelleme.js` içindeki dağıtıma `updateXXX`, `cekirdek/oyun-baslat.js` içindeki `BEGIN()`'e `startXXX` ekle
4. `ekran/bolumler.js` (`WORLD_MAPS`) ve `ekran/buyuk-harita.js` (`BLUEPRINT_MAPS`) kayıtları + `drawBlueprintXXX`
5. `editor/haritalari-donustur.js` içine `convertXXXToEditorMap()` ve `convertExistingMapsToEditor()`'a çağrısı
6. Kervansaray'da satın alma düğmesi (`gorev/`… `bolge-menusu.js` içindeki `buildKervansarayUI`)
7. `tests/smoke.py` içindeki harita listesine ekle

## Hata ayıklama dersleri (bu projede öğrenildi)
- **Silinmiş elemana erişim sessiz katildir.** `getElementById('x').style…` ve `x` HTML'de yoksa her çağrıda `null` hatası olur. `tests/test_kaynak.py` bunu otomatik yakalar; elle de null korumalı yazın.
- **Düşman parça sırası:** `enemies[i].mesh.children[n]` ile belirli indekse erişme; HP çubuğu gibi parçaların referansını düşman nesnesinde (`hpBg`, `hpFl`) tut.
- **Dolu blok kamerayı kapatır:** kamera yukarıdan ve güneyden bakar; oyuncunun önüne yüksek dolu blok koyma (Demir Madeni girişi böyle bozuldu).
- **CSS yerine yapı:** mobil WebView'da HUD için iç içe `fixed`/`%` yerine düz `flex` akışı kullan.

## Dünya modeli (F1, sürüyor)
`cekirdek/dunya-modeli.js`:
- `WORLD.players` (Map): bütün oyuncular. Şimdilik yalnızca yerel oyuncu (`pl`) kayıtlı; F2'de uzak oyuncular buraya eklenir.
- `nearestPlayer(x,z)`: en yakın **canlı** oyuncu. Düşman yapay zekâsı hedefini buradan alır (`pl`'den değil); hasar da hedef oyuncuya uygulanır.
- `newNetId()`: her düşmana (`en.id`) host'ta artan, kararlı bir kimlik. Ağda varlıklar bu kimlikle anılacak. Mermi ve ganimet kimlikleri sırada.
- `pl` değişkeni uyumluluk için hâlâ global (yerel oyuncu). Modül modül `localPlayer()`/`forEachPlayer()` çağrılarına geçilecek.

## Test
```
python3 tools/build.py          # üret
sh tests/run.sh                 # kaynak denetimleri + duman testi + altın test
SMOKE=0 sh tests/run.sh         # yalnızca kaynak denetimleri (tarayıcı gerekmez)
```
Tarayıcı testi için `pip install playwright` ve bir Chromium/Chrome gerekir. Three.js CDN'ine erişim yoksa
`npm i three@0.128.0` yapıp (ya da `THREE_JS=/yol/three.min.js`) yerel kopya verin; `CHROME_PATH` ile tarayıcı seçilir.

**Altın test (`tests/altin.py`):** tarayıcı döngüsünü kapatır, `Math.random`'u sabit tohumlu yapar, her haritayı 1.500 kare (25 sn) sabit adımla ve betikli girdilerle çalıştırır, 250 karede bir oyun durumunun özetini `tests/altin-referans.json` ile karşılaştırır. Refaktörde oyunun davranışının değişmediğinin kanıtıdır. Davranış **bilerek** değiştiyse `python3 tests/altin.py --yaz` ile referansı yenileyin (farkı önce okuyun).
