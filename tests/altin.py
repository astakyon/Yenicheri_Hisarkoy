#!/usr/bin/env python3
"""Tek kişilik oyunun referans ("altın") testi.

Amaç: refaktör sırasında (F1: World/Entity/Player, Session) oyunun davranışının DEĞİŞMEDİĞİNİ kanıtlamak.

Nasıl çalışır:
  - tarayıcının animasyon döngüsü kapatılır, Math.random sabit tohumlu üreteçle değiştirilir
  - her harita için oyun kare kare, sabit zaman adımıyla (update(1/60)) ve betikli girdilerle çalıştırılır
  - belirli karelerde oyun durumunun özeti (konumlar, can, ölümler, dalga, ganimet, XP) kaydedilir
  - özetler tests/altin-referans.json ile karşılaştırılır; fark varsa ilk farklı kare ve alan yazdırılır

Çalıştırma:
  python3 tests/altin.py          referansla karşılaştır
  python3 tests/altin.py --yaz    referansı yeniden üret (yalnızca oyun davranışı BİLEREK değiştiyse)

Not: Sayılar 3 ondalığa yuvarlanır. Tarayıcı sürümü çok değişirse Math.sin/cos farkları referansı
etkileyebilir; bu durumda --yaz ile yenileyin ve farkın gerçekten tarayıcıdan geldiğini doğrulayın.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright  # noqa: E402

import ortak  # noqa: E402

REFERANS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'altin-referans.json')
HARITALAR = ['kisla', 'gorev', 'orman', 'maden']
KARE = 1500          # harita başına 25 saniyelik oyun
KONTROL_ARALIGI = 250

# kare numarası -> [x, z] (ya da 'tuzak'): betikli ışınlanmalar
ISINLANMA = {
    'maden': {400: 'tuzak', 700: [0, -4], 1000: [-22, -8], 1250: [22, 8]},
    'orman': {600: [0, 0], 1000: [-10, 10]},
    'gorev': {700: [0, 0]},
}

ON_SCRIPT = """
(() => {
  let s = 1;
  function mulberry32() { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  Math.random = mulberry32;
  window.__tohum = n => { s = n | 0; };
  window.requestAnimationFrame = () => 0;      // döngüyü biz süreceğiz
  // Günlük görevler bugünün tarihinden seçilir; tarih sabitlenmezse referans her gün değişir
  const GercekTarih = Date, SABIT = GercekTarih.UTC(2026, 10, 6, 12, 0, 0);
  window.Date = class extends GercekTarih {
    constructor(...a) { if (a.length) super(...a); else super(SABIT); }
    static now() { return SABIT; }
  };
})();
"""

KOS_JS = """
([harita, kare, aralik, ISIN]) => {
  SAVE.mapsUnlocked = { orman: true, maden: true };
  __tohum(20260101);
  BEGIN(harita);
  REN.render = () => {};                        // çizim simülasyonu etkilemez, hız için kapat
  const r = v => Math.round(v * 1e3) / 1e3;
  const ozet = () => ({
    gt, harita: currentMap, dalga: wave, dalgaAktif: waveActive, dalgaSayaci: waveTimer,
    oyuncu: { x: r(pl.x), z: r(pl.z), hp: r(pl.hp), en: r(pl.en) },
    oldurme: kills, akce: akce, ana_altin: mainGold, havuz_altin: poolGold,
    xp: SAVE.xp, seviye: SAVE.level,
    dusman: enemies.map(e => [e.animalType || e.type || '', r(e.x), r(e.z), r(e.hp)]).sort(),
    ganimet: loots.length, mermi: bullets.length,
  });
  const olcumler = [];
  for (let f = 0; f < kare; f++) {
    const d = f % 240;                          // betikli girdi: kare çizen bir gezinti
    keys['d'] = d < 80; keys['s'] = d >= 80 && d < 140; keys['a'] = d >= 140 && d < 200; keys['w'] = d >= 200;
    keys['shift'] = (f % 480) < 60;
    const hop = (ISIN[harita] || {})[f];            // betikli ışınlanma: tuzak ve düşman bölgelerini de kapsa
    if (hop) { const h = hop === 'tuzak' ? [madenTraps[0].x, madenTraps[0].z] : hop; pl.x = h[0]; pl.z = h[1]; }
    if (f % 25 === 0) { try { doMelee(); } catch (e) {} }
    update(1 / 60);
    if ((f + 1) % aralik === 0) olcumler.push(ozet());
  }
  return olcumler;
}
"""


def calistir():
    sonuc = {}
    srv, url = ortak.sunucu()
    route = ortak.yonlendirici()
    with sync_playwright() as p:
        b = ortak.tarayici(p)
        for h in HARITALAR:
            ctx = b.new_context(viewport={'width': 412, 'height': 915})
            ctx.add_init_script(ON_SCRIPT)
            ctx.route('**/*', route)
            pg = ctx.new_page()
            hatalar = []
            pg.on('pageerror', lambda e: hatalar.append(str(e)))
            pg.goto(url, wait_until='load')
            pg.wait_for_timeout(500)
            sonuc[h] = pg.evaluate(KOS_JS, [h, KARE, KONTROL_ARALIGI, {k: {str(n): v for n, v in d.items()} for k, d in ISINLANMA.items()}])
            if hatalar:
                sonuc[h].append({'JS_HATASI': sorted(set(hatalar))[:3]})
            ctx.close()
        b.close()
    return sonuc


def fark_bul(ref, yeni, yol=''):
    """İlk farkı (yol, beklenen, bulunan) olarak döndürür."""
    if type(ref) != type(yeni):
        return yol, ref, yeni
    if isinstance(ref, dict):
        for k in sorted(set(ref) | set(yeni)):
            if k not in ref or k not in yeni:
                return yol + '/' + k, ref.get(k), yeni.get(k)
            f = fark_bul(ref[k], yeni[k], yol + '/' + k)
            if f:
                return f
        return None
    if isinstance(ref, list):
        for i in range(max(len(ref), len(yeni))):
            if i >= len(ref) or i >= len(yeni):
                return yol + '[%d]' % i, ref[i] if i < len(ref) else None, yeni[i] if i < len(yeni) else None
            f = fark_bul(ref[i], yeni[i], yol + '[%d]' % i)
            if f:
                return f
        return None
    return None if ref == yeni else (yol, ref, yeni)


def main():
    yaz = '--yaz' in sys.argv
    sonuc = calistir()
    hata = [h for h, o in sonuc.items() if o and 'JS_HATASI' in o[-1]]
    for h in hata:
        print('HATA: %s sırasında JavaScript hatası: %s' % (h, sonuc[h][-1]['JS_HATASI']))
    if yaz:
        if hata:
            print('Referans yazılmadı: önce hataları giderin.')
            return 1
        with open(REFERANS, 'w', encoding='utf-8') as f:
            json.dump(sonuc, f, ensure_ascii=False, indent=1, sort_keys=True)
            f.write('\n')
        print('referans yazıldı: %s' % os.path.relpath(REFERANS))
        for h, o in sonuc.items():
            son = o[-1]
            print('  %-6s dalga %d, %d öldürme, %d düşman, oyuncu hp %s' % (h, son['dalga'], son['oldurme'], len(son['dusman']), son['oyuncu']['hp']))
        return 0
    if not os.path.isfile(REFERANS):
        print('Referans yok. Önce: python3 tests/altin.py --yaz')
        return 1
    with open(REFERANS, encoding='utf-8') as f:
        ref = json.load(f)
    # JSON gidiş-dönüşü ile aynı biçime getir
    yeni = json.loads(json.dumps(sonuc, ensure_ascii=False, sort_keys=True))
    kotu = 0
    for h in HARITALAR:
        fark = fark_bul(ref.get(h), yeni.get(h), '/' + h)
        if fark:
            kotu += 1
            print('  HATA %s: davranış değişti -> %s\n        beklenen: %s\n        bulunan : %s' % (h, fark[0], str(fark[1])[:160], str(fark[2])[:160]))
        else:
            son = yeni[h][-1]
            print('  ok  %s: %d kontrol noktası aynı (dalga %d, %d öldürme)' % (h, len(yeni[h]), son['dalga'], son['oldurme']))
    print()
    if kotu or hata:
        print('BAŞARISIZ: oyun davranışı referanstan farklı')
        return 1
    print('altın test geçti')
    return 0


if __name__ == '__main__':
    sys.exit(main())
