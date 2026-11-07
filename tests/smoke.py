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

        print('Oturum (SESSION + LoopbackTransport)')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          const p2 = Object.assign({}, pl, { mesh: pl.mesh.clone() }); p2.x = 0; p2.z = 0;
          for (let x = -20; x <= 20; x += 2) { for (let z = -20; z <= 20; z += 2) { if (!checkCollision(x, z, 2) && !checkCollision(x + 3, z, 2)) { p2.x = x; p2.z = z; x = 99; break; } } }
          WORLD.players.set('p2', p2); const bx = p2.x, lx = pl.x;
          for (let i = 0; i < 30; i++) {
            SESSION.transport.send({ t: 'input', id: 'p2', cmd: { dx: 1, dz: 0, run: false, aimX: 99, aimZ: p2.z } });
            SESSION.step(1 / 60);
          }
          const sonuc = { p2: p2.x - bx, yerel: pl.x - lx, bos: SESSION.transport.kuyruk.length };
          WORLD.players.delete('p2'); SESSION.inputs.delete('p2');
          return sonuc;
        }""")
        check(r['p2'] > 0 and r['bos'] == 0, 'taşımadan gelen uzak girdi ikinci oyuncuyu hareket ettirdi, kuyruk boşaldı')
        ctx.close()

        print('Yetenekler oyuncu başına')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          SAVE.abilities.f = { id: 'demir_kalkan', lvl: 1, unlocked: true };
          const ab2 = { cd: { q: 0, f: 0, r: 0 }, active: { q: false, f: false, r: false }, timer: { q: 0, f: 0, r: 0 } };
          const p2 = Object.assign({}, pl, { mesh: pl.mesh.clone(), ab: ab2 }); p2.x = 40; p2.z = 40;
          WORLD.players.set('p2', p2);
          useAbility('f', p2);
          const p2Kalkan = p2.ab.active.f, yerelKalkan = pl.ab.active.f, cd2 = p2.ab.cd.f, cdYerel = pl.ab.cd.f;
          for (let i = 0; i < 125; i++) updateAbilities(1 / 60);
          const sonra = { aktif: p2.ab.active.f, cd: p2.ab.cd.f };
          WORLD.players.delete('p2');
          return { p2Kalkan, yerelKalkan, cd2, cdYerel, sonra, alias: abilityActive === pl.ab.active };
        }""")
        check(r['p2Kalkan'] and not r['yerelKalkan'] and r['cd2'] > 0 and r['cdYerel'] == 0, 'ikinci oyuncunun kalkanı yalnızca kendisinde')
        check(not r['sonra']['aktif'] and r['sonra']['cd'] > 0, 'kalkan 2 sn sonra bitti, bekleme sürüyor')
        check(r['alias'], 'eski global adlar yerel oyuncunun durumuna bağlı')
        ctx.close()

        print('Silah ve zırh oyuncu başına')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          SAVE.armor = 'none'; selWeapon = 0;
          const p2 = Object.assign({}, pl, { mesh: pl.mesh.clone(), armor: 'ottoman', weapon: 1, x: 30, z: 30, en: 100 });
          const yerelSilah = pl.weapon, ayna = (pl.weapon = 2, selWeapon === 2);
          pl.weapon = 0;
          const n0 = bullets.length; doRanged(p2, { x: 40, z: 30 });
          const mermi = bullets[bullets.length - 1];
          return { zirhP2: getArmorDef(p2), zirhYerel: getArmorDef(pl), yerelSilah, ayna,
                   yeniMermi: bullets.length - n0, mermiX: mermi.mesh.position.x, p2En: p2.en, yerelEn: pl.en,
                   hasarP2: getWeaponDmg('tufek', p2), id: Number.isInteger(mermi.id) };
        }""")
        check(r['zirhP2'] == 0.5 and r['zirhYerel'] == 0, 'zırh oyuncuya göre: %s / %s' % (r['zirhP2'], r['zirhYerel']))
        check(r['ayna'] and r['yerelSilah'] == 0, 'pl.weapon eski selWeapon ile aynı değer')
        check(r['yeniMermi'] == 1 and r['mermiX'] == 30 and r['p2En'] == 92 and r['yerelEn'] == 100 and r['id'], 'p2 mermisi p2 konumundan çıktı, yalnızca p2 enerjisi azaldı')
        ctx.close()

        print('Tuzak tüm oyunculara etki eder')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("SAVE.mapsUnlocked={maden:true}; BEGIN('maden')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          enemies.forEach(e => { e.x = 500; e.z = 500; });
          const t = madenTraps[0]; SAVE.armor = 'none';
          const p2 = Object.assign({}, pl, { mesh: pl.mesh.clone(), armor: 'ottoman', x: t.x + 0.5, z: t.z });
          const p3 = Object.assign({}, pl, { mesh: pl.mesh.clone(), x: t.x + 90, z: t.z });
          pl.x = t.x; pl.z = t.z; pl.hp = pl.maxHp = p2.hp = p3.hp = 100;
          WORLD.players.set('p2', p2); WORLD.players.set('p3', p3);
          checkMadenTraps();
          const o = { yerel: pl.hp, p2: p2.hp, uzak: p3.hp, tetik: t.triggered };
          WORLD.players.delete('p2'); WORLD.players.delete('p3');
          return o;
        }""")
        check(r['tetik'] and r['yerel'] == 82 and r['p2'] == 91 and r['uzak'] == 100, 'yakın iki oyuncu hasar aldı (zırhla 91), uzaktaki almadı: %s' % r)
        ctx.close()

        print('Durum özeti (snapshot)')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("SAVE.mapsUnlocked={maden:true}; BEGIN('maden')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          selWeapon = 1; pl.en = 100; worldAim.x = pl.x + 5; worldAim.z = pl.z; doRanged(); dropLoot(pl.x + 3, pl.z, 3);
          const p2 = Object.assign({}, pl, { mesh: pl.mesh.clone(), x: 3, z: 3 }); WORLD.players.set('p2', p2);
          for (let i = 0; i < 400; i++) update(1 / 60);       // dalga düşmanları doğsun
          const s = snapshot(); const js = JSON.stringify(s);
          const back = JSON.parse(js);
          const ids = [].concat(back.e, back.b, back.l).map(o => o.id);
          const o = { bayt: js.length, oyuncu: back.p.length, dusman: back.e.length, mermi: back.b.length, ganimet: back.l.length,
                      esit: JSON.stringify(back) === js, benzersiz: new Set(ids).size === ids.length, t: back.t, gt };
          WORLD.players.delete('p2'); return o;
        }""")
        check(r['oyuncu'] == 2 and r['dusman'] > 0, 'özet iki oyuncu ve %d düşman içeriyor' % r['dusman'])
        check(r['esit'] and r['benzersiz'] and r['t'] == r['gt'], 'JSON gidiş-dönüş aynı, id\'ler benzersiz, tik numarası doğru')
        print('      boyut: %d bayt (%d oyuncu, %d düşman, %d mermi, %d ganimet)' % (r['bayt'], r['oyuncu'], r['dusman'], r['mermi'], r['ganimet']))
        ctx.close()

        print('Host + istemci (PairTransport)')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          const [hostUcu, istemciUcu] = makePair();
          const p2 = SESSION.addPeer('c1', hostUcu);
          for (let x = -20; x <= 20; x += 2) { for (let z = -20; z <= 20; z += 2) { if (!checkCollision(x, z, 2) && !checkCollision(x + 8, z, 2)) { p2.x = x; p2.z = z; x = 99; break; } } }
          const istemci = new ClientView(istemciUcu), bx = p2.x;
          const MS = 1000 / 60; let sahte = 0, ihlal = 0, onceki = -1e9, goruntuSayisi = 0, enBuyukFark = 0;
          // sahte kimlik denemesi: istemci kendini 'local' diye tanıtmaya çalışır
          istemciUcu.send({ t: 'input', id: 'local', cmd: { dx: 0, dz: -1, run: false, aimX: 0, aimZ: 0 } });
          const yerel0 = pl.z;
          for (let i = 0; i < 180; i++) {
            istemci.sendInput({ dx: 1, dz: 0, run: false, aimX: p2.x + 50, aimZ: p2.z });
            update(1 / 60);
            sahte += MS; istemci.poll(sahte);
            const v = istemci.view(sahte);
            if (v && i > 30) {
              const o = v.p.find(q => q.id === 'c1');
              if (o) { goruntuSayisi++; if (o.x < onceki - 1e-6) ihlal++; onceki = o.x; enBuyukFark = Math.max(enBuyukFark, p2.x - o.x); }
            }
          }
          const v = istemci.view(sahte), o = v.p.find(q => q.id === 'c1');
          const res = { hostX: p2.x - bx, gorunenX: o.x - bx, fark: p2.x - o.x, enBuyukFark, ihlal, goruntuSayisi,
                        oyuncuSayisi: v.p.length, yerelZ: Math.abs(pl.z - yerel0) < 1e-9, sonSnapTik: istemci.last.t, gt };
          SESSION.removePeer('c1'); return res;
        }""")
        check(r['hostX'] > 2 and r['oyuncuSayisi'] == 2, 'host uzak oyuncuyu girdisiyle yürüttü (%.2f birim), istemci iki oyuncu görüyor' % r['hostX'])
        check(r['ihlal'] == 0 and r['goruntuSayisi'] > 100, 'istemci görüntüsü akıcı: geriye sıçrama yok (%d kare)' % r['goruntuSayisi'])
        check(0 <= r['enBuyukFark'] < 1.5, 'görüntü hosttan en çok %.2f birim geride (~100 ms + 15 Hz)' % r['enBuyukFark'])
        check(r['yerelZ'], 'sahte \'local\' kimliği yerel oyuncuyu oynatamadı')
        check(r['gt'] - r['sonSnapTik'] <= 4, 'özetler 15 Hz geliyor (son özet %d tik önce)' % (r['gt'] - r['sonSnapTik']))
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
