#!/usr/bin/env python3
"""Gerçek tarayıcıda (başsız Chromium/Chrome) duman testi.

Çalıştırma:  python3 tests/smoke.py
Gereken:     pip install playwright   (+ bir Chromium/Chrome)

Ortam değişkenleri (hepsi isteğe bağlı):
  CHROME_PATH  tarayıcı yürütülebilir dosyası (yoksa Playwright'ın kendi Chromium'u)
  THREE_JS     yerel three.min.js (r128). Verilmezse CDN'e ulaşılması gerekir; ağ kapalıysa
               `npm i three@0.128.0` ile node_modules/three/build/three.min.js kullanılır.

Denetlenenler:
  - menü açılıyor, JavaScript hatası yok
  - Bölümler / Harita Editörü / Ayarlar / Oyuna Başla düğmelerine dokunulunca çalışıyor
  - dört harita (Kışla, Devriye, Av Ormanı, Demir Madeni) açılıyor ve 4 sn boyunca hata vermiyor
  - Demir Madeni savaşı: tuzak can götürüyor, eşkıya saldırıyor, ölüyor, 2. dalga geliyor
  - HUD (üst bar, can paneli, mini harita) birbirine binmiyor
"""
import functools
import http.server
import os
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fails = []


def check(cond, msg):
    print(('  ok  ' if cond else '  HATA ') + msg)
    if not cond:
        fails.append(msg)


def three_source():
    for p in (os.environ.get('THREE_JS'),
              os.path.join(ROOT, 'node_modules', 'three', 'build', 'three.min.js'),
              os.path.join(ROOT, 'vendor', 'three.min.js')):
        if p and os.path.isfile(p):
            with open(p, encoding='utf-8') as f:
                return f.read()
    return None


class Sessiz(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    handler = functools.partial(Sessiz, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = 'http://127.0.0.1:%d/index.html' % srv.server_address[1]
    three = three_source()

    def route(r):
        u = r.request.url
        if three and 'three.min.js' in u:
            r.fulfill(status=200, content_type='application/javascript', body=three)
        elif 'fonts.g' in u:
            r.fulfill(status=200, content_type='text/css', body='')
        else:
            r.continue_()

    launch = {'headless': True,
              'args': ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']}
    if os.environ.get('CHROME_PATH'):
        launch['executable_path'] = os.environ['CHROME_PATH']

    with sync_playwright() as p:
        b = p.chromium.launch(**launch)

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
        b.close()

    print()
    if fails:
        print('BAŞARISIZ: %d sorun' % len(fails))
        return 1
    print('duman testi geçti')
    return 0


if __name__ == '__main__':
    sys.exit(main())
