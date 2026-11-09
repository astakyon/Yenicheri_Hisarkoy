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


def katil_dene(sayfa, kod):
    # Eşler arası bağlantı kurulumu ortama bağlı (PeerJS) ve yavaş olabilir; yeniden denemek ikinci kimlik açtığı için yalnızca bekleme süresi uzun
    sayfa.evaluate("odayaKatil('%s')" % kod)
    sayfa.wait_for_function("CLIENT.aktif === true", timeout=40000)


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
            host.evaluate("SAVE.gorunum = { gov: 0x445566, biyikTip: 'sakal' }")
            host.evaluate("odaKur()")
            host.wait_for_function("ODA.durum === 'acik'", timeout=15000)
            kod = host.evaluate("ODA.kod")
            check(len(kod) == 5, 'host oda kodu aldı: %s' % kod)
            check(host.evaluate("playing && currentMap") == 'kisla', 'host oyunu başlattı (Kışla)')
            ist.evaluate("SAVE.abilities.f = { id: 'f', lvl: 1, unlocked: true }")
            ist.evaluate("SAVE.gorunum = { gov: 0x112233, tufek: false, biyikTip: 'yok' }")
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

            print('Görünüm eşitleme (v1.71)')
            ist.wait_for_timeout(900)
            r = host.evaluate("() => { const p = WORLD.players.get('c1'); return { gov: p.gor && p.gor.gov, tufek: !!(p.mesh.userData.silah && p.mesh.userData.silah.sirtTufek) }; }")
            check(r['gov'] == 0x112233 and r['tufek'] is False, 'host, istemcinin görünümünü uyguladı (%s)' % r)
            r = ist.evaluate("() => { const g = Array.from(CLIENT.hayalet.p.values())[0]; return g ? JSON.parse(g.userData.lk).gov : null; }")
            check(r == 0x445566, 'istemci, host oyuncusunu host\'un seçtiği kıyafetle çiziyor (%s)' % r)

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

            print('Harita değişimi')
            host.evaluate("() => { startGorev(); }")
            ist.wait_for_function("currentMap === 'gorev'", timeout=5000)
            host.evaluate("() => { enemies.length = 0; waveActive = false; waveTimer = 999999; }")
            ist.wait_for_timeout(600)
            d = host.evaluate("() => { const c = WORLD.players.get('c1'); return Math.hypot(c.x - pl.x, c.z - pl.z); }")
            check(ist.evaluate("currentMap") == 'gorev' and d < 4, 'host haritayı değiştirince istemci de geçti, oyuncular yan yana (%.1f birim)' % d)
            check(ist.evaluate("CLIENT.hayalet.p.size") == 1, 'istemci yeni sahnede host oyuncusunu çiziyor')
            ist.evaluate("keys['d'] = true"); ist.wait_for_timeout(700); ist.evaluate("keys['d'] = false"); ist.wait_for_timeout(500)
            fark = ist.evaluate("() => { const o = CLIENT.sonOzet.p.find(q => q.id === CLIENT.id); return Math.hypot(o.x - pl.x, o.z - pl.z); }")
            check(fark < .5, 'yeni haritada tahmin host ile uyumlu (fark %.2f)' % fark)

            print('Yetenek, ganimet ve XP oyuncu başına')
            ist.evaluate("useAbility('f')")
            host.wait_for_function("WORLD.players.get('c1').ab.active.f === true", timeout=3000)
            check(True, 'istemcinin Demir Kalkan yeteneği host\'ta uygulandı')
            ist.wait_for_function("pl.ab.cd.f > 0", timeout=3000)
            check(True, 'bekleme süresi istemcinin ekranına geldi')
            check(host.evaluate("pl.ab.active.f") is False, 'host oyuncusunun kalkanı etkilenmedi')
            host.evaluate("() => { const c = WORLD.players.get('c1'); loots.length = 0; dropLoot(c.x + .1, c.z, 4); loots.forEach(l => { l.x = c.x + .1; l.z = c.z; }); }")
            ist.wait_for_function("(akce + deri + metal) > 0", timeout=4000)
            h = host.evaluate("() => { const c = WORLD.players.get('c1'); return { c: (c.akce|0) + (c.deri|0) + (c.metal|0), host: akce + deri + metal }; }")
            check(h['c'] > 0 and h['host'] == 0, 'uzak oyuncu ganimeti kendisi topladı (host\'a yazılmadı)')
            xp0 = ist.evaluate("SAVE.stats.totalXp || 0")
            host.evaluate("kazancDagit(40)")
            ist.wait_for_function("(SAVE.stats.totalXp || 0) >= %d" % (xp0 + 40), timeout=3000)
            check(True, 'öldürme XP\'si istemcinin kendi kaydına eklendi')

            print('Ölme ve canlandırma')
            host.evaluate("() => { const c = WORLD.players.get('c1'); c.hp = 0; oyuncuOldu(c); }")
            ist.wait_for_function("document.getElementById('downBox').style.display === 'block'", timeout=3000)
            check(host.evaluate("playing") and ist.evaluate("playing"), 'bir oyuncu düşünce oyun bitmedi')
            host.evaluate("() => { const c = WORLD.players.get('c1'); window.__dx0 = c.x; }")
            ist.evaluate("worldAim.x = pl.x + 5; worldAim.z = pl.z; keys['d'] = true")
            ist.wait_for_timeout(500)
            ist.evaluate("keys['d'] = false")
            check(abs(host.evaluate("WORLD.players.get('c1').x - window.__dx0")) < .01, 'düşmüş oyuncu hareket edemiyor (girdi yok sayıldı)')
            host.evaluate("() => { const c = WORLD.players.get('c1'); pl.x = c.x + 1; pl.z = c.z; pl.mesh.position.set(pl.x, 0, pl.z); enemies.length = 0; }")
            host.wait_for_function("WORLD.players.get('c1').hp > 0", timeout=6000)
            check(True, 'yoldaş yanında durunca canlandı (hp %s)' % host.evaluate("WORLD.players.get('c1').hp"))
            ist.wait_for_function("document.getElementById('downBox').style.display === 'none'", timeout=3000)
            check(True, 'istemcide "düştün" göstergesi kapandı')

            print('Hikaye ortak kredisi')
            ist.evaluate("hikayeHazirla(); window.__av0 = SAVE.story2.c.av || 0; window.__k0 = SAVE.story2.c['kill_' + currentMap] || 0;")
            host.evaluate("kazancDagit(5); kazancDagit(5); hikayeOrtakKredi('av')")
            ist.wait_for_function("(SAVE.story2.c.av || 0) === window.__av0 + 1 && (SAVE.story2.c['kill_' + currentMap] || 0) === window.__k0 + 2", timeout=6000)
            check(True, 'istemci host\'un verdiği öldürme/av kredisini KENDİ hikaye kaydında saydı')

            print('Yeniden bağlanma')
            pos0 = host.evaluate("() => { const c = WORLD.players.get('c1'); return [c.x, c.z]; }")
            ist.evaluate("CLIENT.tr.conn.close()")
            host.wait_for_function("SESSION.offline.has('c1')", timeout=8000)
            check(host.evaluate("WORLD.players.has('c1') && SESSION.peers.size === 0"), 'bağlantı kopunca host oyuncuyu hemen silmedi, bekletti')
            ist.wait_for_function("CLIENT.baglaniyor === true || CLIENT.kopuk === false", timeout=3000)
            host.wait_for_function("SESSION.peers.has('c1') && !SESSION.offline.has('c1')", timeout=40000)
            ist.wait_for_function("CLIENT.kopuk === false && CLIENT.baglaniyor === false", timeout=75000)
            check(ist.evaluate("CLIENT.aktif && CLIENT.id") == 'c1' and host.evaluate("WORLD.players.size") == 2, 'istemci aynı kimlikle (c1) geri döndü, fazladan oyuncu oluşmadı')
            ist.wait_for_timeout(700)
            ist.evaluate("keys['d'] = true"); ist.wait_for_timeout(800); ist.evaluate("keys['d'] = false"); ist.wait_for_timeout(500)
            pos1 = host.evaluate("() => { const c = WORLD.players.get('c1'); return [c.x, c.z]; }")
            check(pos1[0] - pos0[0] > .5, 'yeniden bağlanınca hareket yine host\'a işliyor (%.2f birim)' % (pos1[0] - pos0[0]))

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
            print('Herkes düşünce oyun biter')
            h2ctx, host2 = sayfa('host'); i2ctx, ist2 = sayfa('istemci')
            host2.evaluate("odaKur()"); host2.wait_for_function("ODA.durum === 'acik'", timeout=15000)
            kod2 = host2.evaluate("ODA.kod")
            katil_dene(ist2, kod2)
            host2.wait_for_function("SESSION.peers.size === 1", timeout=5000)
            host2.evaluate("() => { pl.hp = 0; oyuncuOldu(pl); }")
            host2.wait_for_timeout(300)
            check(host2.evaluate("playing") and ist2.evaluate("playing"), 'host düştü ama yoldaşı hayatta: oyun sürüyor')
            host2.evaluate("() => { WORLD.players.get('c1').hp = 0; oyuncuOldu(WORLD.players.get('c1')); }")
            host2.wait_for_function("document.getElementById('deathBox').style.display === 'flex'", timeout=3000)
            ist2.wait_for_function("document.getElementById('deathBox').style.display === 'flex'", timeout=5000)
            check(True, 'herkes düşünce hem host hem istemcide ölüm ekranı geldi')
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
