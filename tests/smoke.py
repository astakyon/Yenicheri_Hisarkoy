#!/usr/bin/env python3
"""Gerçek tarayıcıda (başsız Chromium/Chrome) duman testi.

Çalıştırma:  python3 tests/smoke.py
Gereken:     pip install playwright   (+ bir Chromium/Chrome)

Ortam değişkenleri: bkz. tests/ortak.py (CHROME_PATH, THREE_JS)

Denetlenenler:
  - menü açılıyor, JavaScript hatası yok
  - Bölümler / Harita Editörü / Ayarlar / Oyuna Başla düğmelerine dokunulunca çalışıyor
  - dört harita (Kışla, Devriye, Av Ormanı, Demir Madeni) açılıyor ve 4 sn boyunca hata vermiyor
  - Demir Madeni savaşı: tuzak can götürüyor, eşkıya saldırıyor, ölüyor, 2. dalga geliyor
  - HUD (üst bar, can paneli, mini harita) birbirine binmiyor
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright  # noqa: E402

import ortak  # noqa: E402

fails = []


def check(cond, msg):
    print(('  ok  ' if cond else '  HATA ') + msg)
    if not cond:
        fails.append(msg)


def main():
    srv, url = ortak.sunucu()
    route = ortak.yonlendirici()

    with sync_playwright() as p:
        b = ortak.tarayici(p)

        def yeni_sayfa(w=412, h=915):
            ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True)
            ctx.route('**/*', route)
            pg = ctx.new_page()
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(url, wait_until='load')
            pg.wait_for_timeout(1000)
            return ctx, pg, errs

        print('Menü ve düğmeler')
        ctx, pg, errs = yeni_sayfa()
        check(pg.evaluate("typeof THREE") == 'object', 'THREE yüklendi (CDN erişimi ya da THREE_JS gerekir)')
        pg.tap('text=BÖLÜMLER'); pg.wait_for_timeout(300)
        check(pg.evaluate("getComputedStyle(document.getElementById('worldMapBox')).display") == 'flex', 'Bölümler açılıyor')
        pg.evaluate('closeChapters()')
        pg.tap('text=HARİTA EDİTÖRÜ'); pg.wait_for_timeout(300)
        check(pg.evaluate("getComputedStyle(document.getElementById('mapEditorBox')).display") == 'flex', 'Harita Editörü açılıyor')
        pg.evaluate('closeMapEditor()')
        pg.tap('text=AYARLAR'); pg.wait_for_timeout(300)
        check(pg.evaluate("getComputedStyle(document.getElementById('settingsBox')).display") == 'flex', 'Ayarlar açılıyor')
        pg.evaluate("document.getElementById('settingsBox').style.display='none'")
        pg.tap('text=OYUNA BAŞLA'); pg.wait_for_timeout(2500)
        check(pg.evaluate('currentMap') == 'kisla' and pg.evaluate('playing'), 'Oyuna Başla Kışla\'yı açıyor')

        r = pg.evaluate("""() => {
          const ids=['topBar','mmBox','topLeftHud','abilityBtns','runBtn','wepSel','atkBtn','joyBase'];
          const R={};ids.forEach(i=>{const e=document.getElementById(i);if(!e)return;const s=getComputedStyle(e);if(s.display==='none')return;const b=e.getBoundingClientRect();if(b.width>0)R[i]=[b.left,b.top,b.right,b.bottom];});
          const k=Object.keys(R),ov=[];for(let a=0;a<k.length;a++)for(let c=a+1;c<k.length;c++){const A=R[k[a]],B=R[k[c]];if(A[0]<B[2]&&B[0]<A[2]&&A[1]<B[3]&&B[1]<A[3])ov.push(k[a]+'x'+k[c]);}
          return {n:k.length,ov};}""")
        check(r['n'] >= 7 and not r['ov'], 'HUD öğeleri birbirine binmiyor (%d öğe, çakışma: %s)' % (r['n'], r['ov'] or 'yok'))
        pg.evaluate('toMenu()'); pg.wait_for_timeout(300)
        check(pg.evaluate("getComputedStyle(document.getElementById('menuLayer')).display") == 'block', 'Menüye dönüş çalışıyor')
        check(not errs, 'menüde JavaScript hatası yok' + ('' if not errs else ': ' + errs[0]))
        ctx.close()

        print('Haritalar')
        for m in ('kisla', 'gorev', 'orman', 'maden'):
            ctx, pg, errs = yeni_sayfa()
            pg.evaluate("SAVE.mapsUnlocked={orman:true,maden:true}; BEGIN('%s')" % m)
            pg.wait_for_timeout(4000)
            st = pg.evaluate('({map:currentMap,playing})')
            check(st['map'] == m and st['playing'], '%s açıldı' % m)
            uniq = sorted(set(errs))
            check(not uniq, '%s: 4 sn boyunca hata yok%s' % (m, '' if not uniq else ' -> ' + uniq[0]))
            ctx.close()

        print('Demir Madeni savaşı')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("SAVE.mapsUnlocked={maden:true}; BEGIN('maden')"); pg.wait_for_timeout(2500)
        pg.evaluate('pl.x=madenTraps[0].x; pl.z=madenTraps[0].z'); pg.wait_for_timeout(600)
        check(pg.evaluate('madenTraps[0].triggered') and pg.evaluate('pl.hp') < pg.evaluate('pl.maxHp'), 'tuzak patladı ve can götürdü')
        pg.evaluate('pl.hp=pl.maxHp; pl.ifr=0; pl.x=0; pl.z=20; enemies.forEach(e=>{e.x=0;e.z=20.8;})'); pg.wait_for_timeout(1500)
        check(pg.evaluate('pl.hp') < pg.evaluate('pl.maxHp'), 'eşkıya saldırıp can götürdü')
        pg.evaluate('enemies.forEach(e=>e.hp=0)'); pg.wait_for_timeout(1200)
        check(pg.evaluate('kills') >= 1 and pg.evaluate('enemies.length') == 0, 'eşkıyalar öldü, ölümler sayıldı')
        pg.evaluate('waveTimer=2'); pg.wait_for_timeout(1500)
        check(pg.evaluate('wave') == 2 and pg.evaluate('enemies.length') > 0, '2. dalga geldi')
        uniq = sorted(set(errs))
        check(not uniq, 'savaş boyunca JavaScript hatası yok' + ('' if not uniq else ': ' + uniq[0]))
        ctx.close()
        print('Dünya modeli (çok oyuncuya hazırlık)')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(1500)
        r = pg.evaluate("""() => {
          const kimlikler = enemies.map(e => e.id);
          const benzersiz = kimlikler.every(i => Number.isInteger(i)) && new Set(kimlikler).size === kimlikler.length;
          enemies.forEach(e => { e.x = 500; e.z = 500; e.mesh.position.set(500, 0, 500); });
          const e0 = enemies[0]; pl.x = 0; pl.z = 0; pl.ifr = 99;
          WORLD.players.set('uzak', { x: 10, z: 0, hp: 100, ifr: 99 });
          e0.x = 9; e0.z = 0;
          update(1 / 60);
          const yakinaGitti = e0.x > 9;           // (10,0)'daki uzak oyuncuya doğru: x artmalı
          WORLD.players.get('uzak').hp = 0;         // uzak oyuncu ölünce hedef yerel oyuncuya döner
          e0.x = 9; e0.z = 0;
          update(1 / 60);
          const olunceDondu = e0.x < 9;
          WORLD.players.delete('uzak');
          return { n: kimlikler.length, benzersiz, yakinaGitti, olunceDondu, yerel: nearestPlayer(0, 0) === pl };
        }""")
        check(r['n'] > 0 and r['benzersiz'], 'her düşmanın kararlı ve benzersiz id\'si var (%d düşman)' % r['n'])
        check(r['yakinaGitti'], 'düşman en yakın oyuncuya (uzaktaki ikinci oyuncuya) yöneliyor')
        check(r['olunceDondu'], 'ikinci oyuncu ölünce düşman yerel oyuncuya dönüyor')
        check(r['yerel'], 'tek oyuncuda nearestPlayer() yerel oyuncuyu veriyor')
        uniq = sorted(set(errs))
        check(not uniq, 'JavaScript hatası yok' + ('' if not uniq else ': ' + uniq[0]))
        ctx.close()
        print('Sabit tik (ekran hızından bağımsız oyun hızı)')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          const raf = window.requestAnimationFrame, gd = CLK.getDelta, rr = REN.render;
          window.requestAnimationFrame = () => 0; REN.render = () => {};
          const out = {};
          for (const hz of [30, 60, 120, 144]) {
            gt = 0; tikBirikim = 0; CLK.getDelta = () => 1 / hz;
            for (let i = 0; i < hz * 2; i++) loop();      // 2 saniyelik oyun
            out[hz] = gt;
          }
          window.requestAnimationFrame = raf; CLK.getDelta = gd; REN.render = rr;
          return out;
        }""")
        check(all(abs(v - 120) <= 1 for v in r.values()), '2 sn oyun = ~120 tik; 30/60/120/144 Hz: %s' % r)
        uniq = sorted(set(errs))
        check(not uniq, 'JavaScript hatası yok' + ('' if not uniq else ': ' + uniq[0]))
        ctx.close()

        print('Tuzak yeniden kurulumu (oyun süresiyle, duraklatmada durur)')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("SAVE.mapsUnlocked={maden:true}; BEGIN('maden')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          pl.maxHp = pl.hp = 1e9; enemies.forEach(e => { e.x = 500; e.z = 500; });
          const t = madenTraps[0]; pl.x = t.x; pl.z = t.z; update(1 / 60);
          const tetiklendi = t.triggered;
          pl.x = -30; pl.z = 30;
          paused = true; for (let i = 0; i < 2000; i++) update(1 / 60); paused = false;   // duraklatma: tik ilerlemez
          const duraklatmadaKaldi = t.triggered;
          for (let i = 0; i < 470; i++) update(1 / 60);
          const erkenSonra = t.triggered;
          for (let i = 0; i < 20; i++) update(1 / 60);
          return { tetiklendi, duraklatmadaKaldi, erkenSonra, sonra: t.triggered };
        }""")
        check(r['tetiklendi'], 'tuzak patladı')
        check(r['duraklatmadaKaldi'], 'duraklatmada geri sayım ilerlemiyor')
        check(r['erkenSonra'] and not r['sonra'], '8 sn (480 tik) sonra yeniden kuruluyor')
        uniq = sorted(set(errs))
        check(not uniq, 'JavaScript hatası yok' + ('' if not uniq else ': ' + uniq[0]))
        ctx.close()

        print('Girdi komutu (movePlayer)')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          const p2 = Object.assign({}, pl, { mesh: pl.mesh.clone() }); p2.x = 0; p2.z = 0;
          for (let x = -20; x <= 20; x += 2) { for (let z = -20; z <= 20; z += 2) { if (!checkCollision(x, z, 2) && !checkCollision(x + 3, z, 2)) { p2.x = x; p2.z = z; x = 99; break; } } }
          const bx = p2.x;
          const x0 = pl.x, z0 = pl.z;
          for (let i = 0; i < 30; i++) movePlayer(p2, { dx: 1, dz: 0, run: false, aimX: 99, aimZ: p2.z }, 1 / 60);
          return { p2x: p2.x - bx, yerelAyni: pl.x === x0 && pl.z === z0, ang: p2.ang };
        }""")
        check(r['p2x'] > 0 and r['yerelAyni'], 'komutla ikinci oyuncu hareket etti, yerel oyuncu yerinde kaldı')
        ctx.close()

        print('Kimlikler (düşman, mermi, ganimet)')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          selWeapon = 1; pl.en = 100; worldAim.x = pl.x + 5; worldAim.z = pl.z; doRanged(); doRanged();
          dropLoot(0, 0, 4);
          const hepsi = [].concat(enemies, bullets, loots).map(o => o.id);
          return { n: hepsi.length, bm: bullets.length, lt: loots.length,
                   tam: hepsi.every(Number.isInteger), benzersiz: new Set(hepsi).size === hepsi.length };
        }""")
        check(r['bm'] == 2 and r['lt'] == 4, '2 mermi ve 4 ganimet oluştu')
        check(r['tam'] and r['benzersiz'], 'düşman+mermi+ganimet: %d varlığın hepsinde benzersiz tamsayı id' % r['n'])
        ctx.close()
        b.close()

    print()
    if fails:
        print('BAŞARISIZ: %d sorun' % len(fails))
        return 1
    print('duman testi geçti')
    return 0


if __name__ == '__main__':
    sys.exit(main())
