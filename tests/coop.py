#!/usr/bin/env python3
"""Çok oyunculu uçtan uca test: iki ayrı tarayıcı sayfası (host + istemci), yerel PeerJS sinyal sunucusu, gerçek WebRTC.

Gerekli: node, `npm i peer@1.0.2 peerjs@1.5.4` (PEER_MODULES=<node_modules yolu>, PEER_JS=<peerjs.min.js>),
         playwright. Ortak ortam değişkenleri tests/ortak.py'de. Hazır değilse test atlanır (çıkış kodu 0).
Çalıştırma: python3 tests/coop.py
"""
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright  # noqa: E402

import ortak  # noqa: E402

fails = []


def check(cond, msg):
    print('  %s  %s' % ('ok ' if cond else 'HATA', msg))
    if not cond:
        fails.append(msg)


def sinyal_sunucusu():
    mod = os.environ.get('PEER_MODULES')
    if not mod or not os.path.isdir(os.path.join(mod, 'peer')):
        return None, 0
    port = 9000 + (os.getpid() % 800)
    env = dict(os.environ, NODE_PATH=mod)
    js = "const {PeerServer}=require('peer');PeerServer({host:'127.0.0.1',port:%d,path:'/',allow_discovery:false});console.log('hazir');setInterval(()=>{},1e6)" % port
    pr = subprocess.Popen(['node', '-e', js], env=env, stdout=subprocess.PIPE, text=True)
    pr.stdout.readline()
    return pr, port


def main():
    if not ortak.peer_source():
        print('atlandı: peerjs.min.js yok (PEER_JS ayarla)')
        return 0
    sunucu, port = sinyal_sunucusu()
    if not sunucu:
        print('atlandı: yerel PeerServer yok (PEER_MODULES ayarla)')
        return 0
    srv, url = ortak.sunucu()
    route = ortak.yonlendirici()
    url = url + '?peer=127.0.0.1:%d' % port
    try:
        with sync_playwright() as p:
            b = ortak.tarayici(p)
            hatalar = {'host': [], 'istemci': []}

            def sayfa(ad):
                ctx = b.new_context(viewport={'width': 800, 'height': 400}, has_touch=True)
                ctx.route('**/*', route)
                pg = ctx.new_page()
                pg.on('pageerror', lambda e: hatalar[ad].append(str(e)))
                pg.goto(url, wait_until='load')
                pg.wait_for_timeout(800)
                return ctx, pg

            print('Oda kur ve katıl')
            hctx, host = sayfa('host')
            ictx, ist = sayfa('istemci')
            host.evaluate("odaKur()")
            host.wait_for_function("ODA.durum === 'acik'", timeout=15000)
            kod = host.evaluate("ODA.kod")
            check(len(kod) == 5, 'host oda kodu aldı: %s' % kod)
            check(host.evaluate("playing && currentMap") == 'kisla', 'host oyunu başlattı (Kışla)')
            ist.evaluate("odayaKatil('%s')" % kod)
            try:
                ist.wait_for_function("CLIENT.aktif === true", timeout=15000)
                katildi = True
            except Exception:
                katildi = False
            check(katildi, 'istemci odaya katıldı (WebRTC bağlantısı kuruldu)')
            if not katildi:
                print(ist.evaluate("document.getElementById('coopDurum').textContent"))
                return 1
            host.wait_for_function("SESSION.peers.size === 1", timeout=5000)
            check(ist.evaluate("CLIENT.id") == 'c1' and ist.evaluate("currentMap") == 'kisla', 'istemci kimliği c1, harita host ile aynı')

            print('Hareket ve tahmin')
            host.evaluate("""() => { const p = WORLD.players.get('c1'); window.__bx = p.x; window.__hz = p.z; }""")
            ist.evaluate("window.__bx = pl.x")
            ist.evaluate("keys['d'] = true")
            ist.wait_for_timeout(2000)
            ist.evaluate("keys['d'] = false")
            ist.wait_for_timeout(600)
            h = host.evaluate("() => { const p = WORLD.players.get('c1'); return { dx: p.x - window.__bx, x: p.x, z: p.z }; }")
            i = ist.evaluate("() => ({ dx: pl.x - window.__bx, x: pl.x, z: pl.z })")
            check(h['dx'] > 1.5, 'host, uzak oyuncuyu girdisiyle yürüttü (%.2f birim)' % h['dx'])
            check(abs(h['x'] - i['x']) < .3 and abs(h['z'] - i['z']) < .3, 'istemcinin tahmini host ile uyumlu (fark %.3f, %.3f)' % (abs(h['x'] - i['x']), abs(h['z'] - i['z'])))

            print('Dünya görüntüsü')
            host.evaluate("""() => { const e = enemies[0]; if (!e) { spawnEnemy(false); } }""")
            host.evaluate("() => { const p = WORLD.players.get('c1'); window.__ex = p.x + 3; window.__ez = p.z; }")
            host.wait_for_timeout(800)
            r = ist.evaluate("""() => ({ hayaletOyuncu: CLIENT.hayalet.p.size, hayaletDusman: CLIENT.hayalet.e.size, sonOzetTik: CLIENT.sonOzet && CLIENT.sonOzet.t })""")
            hd = host.evaluate("enemies.length")
            check(r['hayaletOyuncu'] == 1, 'istemci host oyuncusunu çiziyor')
            check(hd > 0 and r['hayaletDusman'] == hd, 'istemci %d düşmanın hepsini çiziyor' % hd)

            print('Saldırı ve hasar')
            host.evaluate("""() => { const c = WORLD.players.get('c1'); enemies.forEach(e => { e.x = c.x + Math.cos(c.ang) * 2.6; e.z = c.z + Math.sin(c.ang) * 2.6; e.hp = e.maxHp = 100; e.mesh.position.set(e.x, 0, e.z); }); c.hp = c.maxHp = 100; window.__hp0 = enemies[0].hp; }""")
            ist.evaluate("""() => { worldAim.x = pl.x + 5; worldAim.z = pl.z; doMelee(); }""")
            ist.wait_for_timeout(800)
            hp1 = host.evaluate("enemies.length ? Math.min.apply(null, enemies.map(e => e.hp)) : 0")
            check(hp1 < 100, 'istemcinin kılıç saldırısı host\'ta düşmana hasar verdi (can 100 → %s)' % hp1)
            n0 = host.evaluate("bullets.length")
            ist.evaluate("""() => { pl.weapon = 1; pl.en = 100; doRanged(); }""")
            try:
                host.wait_for_function("bullets.length > %d" % n0, timeout=2000)
                ateş = True
            except Exception:
                ateş = False
            check(ateş, 'istemcinin ateşi host\'ta mermi oluşturdu')
            if ateş:
                ist.wait_for_function("CLIENT.hayalet.b.size > 0", timeout=2000)
                check(True, 'mermi istemcide de çiziliyor')

            print('Gecikmeli bağlantı (her yön 75 ms, ~150 ms gidiş-dönüş, %2 özet kaybı)')
            ist.evaluate("""() => { const lag = new LagTransport(CLIENT.tr, 75, 0.02); CLIENT.tr = lag; CLIENT.gorunum.tr = lag; }""")
            ist.wait_for_timeout(600)
            ist.evaluate("window.__maxHata = 0; window.__izle = setInterval(() => { const o = CLIENT.sonOzet && CLIENT.sonOzet.p.find(q => q.id === CLIENT.id); if (o) window.__maxHata = Math.max(window.__maxHata, Math.hypot(o.x - pl.x, o.z - pl.z)); }, 50)")
            ist.evaluate("keys['d'] = true"); ist.wait_for_timeout(1500)
            ist.evaluate("keys['d'] = false; keys['s'] = true"); ist.wait_for_timeout(1000)
            ist.evaluate("keys['s'] = false"); ist.wait_for_timeout(1200)
            sonuc = ist.evaluate("""() => { clearInterval(window.__izle); const o = CLIENT.sonOzet.p.find(q => q.id === CLIENT.id);
              return { son: Math.hypot(o.x - pl.x, o.z - pl.z), enBuyuk: window.__maxHata, bekleyen: CLIENT.bekleyen.length }; }""")
            check(sonuc['son'] < .2, 'durunca tahmin ile host konumu birleşti (fark %.3f)' % sonuc['son'])
            check(sonuc['enBuyuk'] < 2.5, 'hareket sırasında en büyük fark %.2f birim (özet gecikmesi kadar beklenir)' % sonuc['enBuyuk'])
            check(sonuc['bekleyen'] < 40, 'onaylanmamış girdi birikmedi (%d)' % sonuc['bekleyen'])
            ist.evaluate("() => { CLIENT.tr = CLIENT.tr.ic; CLIENT.gorunum.tr = CLIENT.tr; }")

            ekran = os.environ.get('COOP_EKRAN')
            if ekran:
                host.screenshot(path=os.path.join(ekran, 'coop-host.png'))
                ist.screenshot(path=os.path.join(ekran, 'coop-istemci.png'))

            print('Ayrılma')
            ist.evaluate("leaveClient()")
            host.wait_for_function("SESSION.peers.size === 0", timeout=8000)
            check(True, 'istemci ayrılınca host oyuncuyu kaldırdı')
            # host odayı kapatınca istemci bağlantı koptu iletisini görür
            ist.evaluate("odayaKatil('%s')" % kod)
            ist.wait_for_function("CLIENT.aktif === true", timeout=15000)
            host.evaluate("odaKapat()")
            ist.wait_for_function("document.getElementById('dlgLayer').style.display === 'flex' || document.getElementById('dlgLayer').style.display === 'block'", timeout=10000)
            check('Bağlantı koptu' in ist.evaluate("document.getElementById('dlgT').textContent"), 'host odayı kapatınca istemci "Bağlantı koptu" iletisini gördü')
            for ad, hs in hatalar.items():
                u = sorted(set(hs))
                check(not u, '%s sayfasında JavaScript hatası yok%s' % (ad, '' if not u else ': ' + u[0][:140]))
            b.close()
    finally:
        sunucu.kill()
    print()
    if fails:
        print('BAŞARISIZ: %d sorun' % len(fails))
        return 1
    print('çok oyunculu test geçti')
    return 0


if __name__ == '__main__':
    sys.exit(main())
