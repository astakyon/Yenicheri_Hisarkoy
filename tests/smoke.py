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
            ctx.add_init_script("try{sessionStorage.setItem('yc_dikey','1')}catch(e){}")
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
        pg.tap('text=SERBEST HARİTALAR'); pg.wait_for_timeout(300)
        check(pg.evaluate("getComputedStyle(document.getElementById('worldMapBox')).display") == 'flex', 'Bölümler açılıyor')
        pg.evaluate('closeChapters()')
        pg.tap('text=ATÖLYE'); pg.wait_for_timeout(200); pg.tap('text=HARİTA EDİTÖRÜ'); pg.wait_for_timeout(300)
        check(pg.evaluate("getComputedStyle(document.getElementById('mapEditorBox')).display") == 'flex', 'Harita Editörü açılıyor')
        pg.evaluate('closeMapEditor()')
        pg.tap('#mIcos >> text=AYARLAR'); pg.wait_for_timeout(300)
        check(pg.evaluate("getComputedStyle(document.getElementById('settingsBox')).display") == 'flex', 'Ayarlar açılıyor')
        pg.evaluate("document.getElementById('settingsBox').style.display='none'")
        pg.tap('text=HİKAYE'); pg.wait_for_timeout(300)
        check(pg.evaluate("getComputedStyle(document.getElementById('hikayeBox')).display") == 'flex', 'Hikaye paneli açılıyor')
        pg.evaluate('hikayeKapat()')
        pg.tap('#mProfil'); pg.wait_for_timeout(300)
        check(pg.evaluate("getComputedStyle(document.getElementById('profilBox')).display") == 'flex', 'Profil paneli açılıyor')
        pg.evaluate('profilKapat()')
        pg.evaluate("BEGIN('kisla')"); pg.wait_for_timeout(2500)
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
        for m in ('kisla', 'gorev', 'orman', 'maden', 'tarim', 'ciftlik', 'sehir', 'saray'):
            ctx, pg, errs = yeni_sayfa()
            pg.evaluate("SAVE.mapsUnlocked={orman:true,maden:true,tarim:true,ciftlik:true,sehir:true,saray:true}; BEGIN('%s')" % m)
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

        print('Kamera dönüşü ve yüz yönü')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(800)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          camYaw = 0; camYawS = 0;
          const a = readLocalInput();
          camYaw = Math.PI / 2; camYawS = camYaw;
          keys['w'] = true; keys['arrowup'] = true;
          const b = readLocalInput();
          keys['w'] = false; keys['arrowup'] = false;
          // kameraya göre ileri: kamera ofseti (sinθ,cosθ) -> ileri = -(sinθ,cosθ)
          const th = camYawS;
          const fwd = { x: -Math.sin(th), z: -Math.cos(th) };
          const wx = 0 * Math.cos(th) + (-1) * Math.sin(th), wz = -0 * Math.sin(th) + (-1) * Math.cos(th);
          camYaw = 0; camYawS = 0;
          // yüz yönü: hareket yönüne bakar, saldırıdan sonra nişana kilitlenir
          const p2 = Object.assign({}, pl, { mesh: pl.mesh.clone() }); p2.face = 0; p2.aimLock = 0;
          p2.mdx = 0; p2.mdz = 1; p2.ang = 0; yuzGuncelle(p2);
          const f1 = p2.face;
          p2.aimLock = 30; p2.ang = -1.2; for (let i = 0; i < 20; i++) yuzGuncelle(p2);
          return { a: !!a, fwd, wx: b.dx, wz: b.dz, f1, face2: p2.face };
        }""")
        check(abs(r['wx'] - r['fwd']['x']) < 1e-6 and abs(r['wz'] - r['fwd']['z']) < 1e-6, 'W tuşu kamera yönünde ileri gidiyor (dönüş matrisi)')
        check(r['f1'] != 0, 'yürürken yüz yönü hareket yönüne dönmeye başladı')
        check(abs(r['face2'] + 1.2) < 0.3, 'saldırı sonrası yüz yönü nişana kilitlendi')
        check(not errs, 'kamera testinde JavaScript hatası yok')
        ctx.close()

        print('Bina saydamlaşması, harita modelleri, editör küçük resimleri')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("SAVE.mapsUnlocked={orman:true,maden:true}; BEGIN('kisla')"); pg.wait_for_timeout(600)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          const kayit = kapatanlar.length;
          const e = kapatanlar[0], c = e.box.getCenter(new THREE.Vector3());
          pl.x = c.x; pl.z = c.z - (e.box.max.z - e.box.min.z) / 2 - 3; camYaw = 0; camYawS = 0;
          CAM.position.set(pl.x, 14, pl.z + 15);
          for (let i = 0; i < 60; i++) kapatanGuncelle();
          const solan = kapatanlar.filter(k => k.a < .5).length;
          pl.z = c.z + (e.box.max.z - e.box.min.z) / 2 + 3; CAM.position.set(pl.x, 14, pl.z + 15);
          for (let i = 0; i < 80; i++) kapatanGuncelle();
          const geri = kapatanlar[0].a;
          const resim = assetResim('bina_kucuk') === null;      // ilk çağrıda yüklenmemiş olabilir
          const ids = ['cevre_magara', 'cevre_destek', 'cevre_nehir'].map(i => { const g = modelYap(i, {}); return g.children.length > 0; });
          return { kayit, solan, geri, ids, url: !!(_arImg['bina_kucuk'] && _arImg['bina_kucuk'].url) };
        }""")
        check(r['kayit'] > 0, 'yüksek yapılar saydamlaşma listesine girdi (%d)' % r['kayit'])
        check(r['solan'] >= 1, 'kamera ile oyuncu arasına giren bina soldu')
        check(r['geri'] > .95, 'oyuncu binanın önüne geçince bina geri döndü')
        check(all(r['ids']), 'mağara, maden desteği ve akarsu modelleri kuruluyor')
        check(r['url'], 'editör paleti model küçük resmi üretti')
        for m in ('orman', 'maden'):
            pg.evaluate("BEGIN('%s')" % m); pg.wait_for_timeout(500)
        check(not errs, 'harita modellerinde JavaScript hatası yok')
        ctx.close()

        print('Oyun içi modeller = model kütüphanesi')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("SAVE.mapsUnlocked={orman:true,maden:true}; BEGIN('gorev')"); pg.wait_for_timeout(600)
        r = pg.evaluate("""() => {
          REN.render = () => {};
          const geo = x => (x.userData.govde || x).geometry; const ayni = (a, id, op) => { const b = modelYap(id, op); return !!geo(a) && geo(a) === geo(b); };
          const o = {};
          o.oyuncu = ayni(pl.mesh, 'yeniceri');
          spawnEnemy(false); spawnEnemy(true);
          o.dusman = enemies.length >= 2 && ayni(enemies[enemies.length - 2].mesh, 'dusman', { cubuk: true }) && ayni(enemies[enemies.length - 1].mesh, 'dusman_boss', { cubuk: true });
          o.npc = npcArr.length === 0 || npcArr.every(n => n.userData.govde && n.userData.kaynak === 'kod');
          o.varil = barrelsArr.length > 0 && barrelsArr.every(b => b.mesh.userData.yapi === true);
          dropLoot(1, 1, 3); o.ganimet = loots.length > 0 && loots.every(l => l.mesh.userData.kaynak === 'kod' && l.mesh.geometry.type === modelYap('ganimet_' + l.type).geometry.type);
          return o;
        }""")
        check(r['oyuncu'], 'oyuncu modeli kütüphanedeki yeniceri ile aynı geometri')
        check(r['dusman'], 'düşman ve boss kütüphanedeki modellerle aynı')
        check(r['varil'], 'görev haritasındaki variller kütüphane modeli')
        check(r['ganimet'], 'ganimet kütüphane modeli')
        pg.evaluate("BEGIN('orman')"); pg.wait_for_timeout(600)
        h = pg.evaluate("""() => { enemies.length = 0; ['geyik','kurt','domuz'].forEach(t => spawnAnimal(t, false)); spawnAnimal('ayi', true);
          const geo = x => (x.userData.govde || x).geometry;
          return enemies.length === 4 && enemies.every(e => { const g = geo(e.mesh); return !!g && e.mesh.userData.kaynak === 'kod'; }); }""")
        check(h, 'hayvanlar kütüphane modelleriyle kuruluyor')
        # kütüphanede ayarlanan boy oyuna yansır
        r2 = pg.evaluate("""() => { const t = MODEL_KAYIT.harita['yeniceri']; const eski = t.boy; t.boy = eski * 1.5; const g = modelYap('yeniceri'); const olcek = g.scale.y; t.boy = eski; return olcek; }""")
        check(abs(r2 - 1.5) < .01, 'kütüphanede değiştirilen boy oyunda uygulanıyor (x%.2f)' % r2)
        check(not errs, 'JavaScript hatası yok')
        ctx.close()

        print('Harita performans bütçesi')
        ctx, pg, errs = yeni_sayfa()
        pg.evaluate("SAVE.mapsUnlocked={orman:true,maden:true,tarim:true,ciftlik:true,sehir:true,saray:true}"); 
        for m, azamiCizim, azamiMesh in (('kisla', 90, 260), ('gorev', 90, 200), ('orman', 100, 200), ('maden', 110, 200), ('tarim', 100, 200), ('ciftlik', 100, 200), ('sehir', 100, 220), ('saray', 100, 200)):
            pg.evaluate("BEGIN('%s')" % m); pg.wait_for_timeout(700)
            r = pg.evaluate("""() => { REN.info.reset(); REN.render(S3, CAM); let mesh = 0, gercekIsik = 0; S3.traverse(o => { if (o.isMesh) mesh++; if (o.isPointLight) gercekIsik++; });
              return { cizim: REN.info.render.calls, mesh, gercekIsik, sanal: FENER.liste.length }; }""")
            check(r['cizim'] <= azamiCizim, '%s: çizim çağrısı %d (sınır %d)' % (m, r['cizim'], azamiCizim))
            check(r['mesh'] <= azamiMesh, '%s: mesh sayısı %d (sınır %d)' % (m, r['mesh'], azamiMesh))
            check(r['gercekIsik'] <= 8, '%s: gerçek nokta ışığı %d (fener havuzu, sınır 8)' % (m, r['gercekIsik']))
        check(not errs, 'JavaScript hatası yok')
        ctx.close()

        print('Kışla yerleşimi ve arayüz ölçeği (v1.53)')
        ctx, pg, errs = yeni_sayfa(844, 390)
        pg.evaluate("BEGIN('kisla')"); pg.wait_for_timeout(900)
        r = pg.evaluate("""() => {
          const ui = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui'));
          const hp = document.getElementById('bHP'), mm = document.getElementById('mmBox');
          // spawn çevresinde açık alan: 8 yarıçapta çarpışmasız nokta oranı
          let ac = 0, top = 0; for (let a = 0; a < 360; a += 15) for (let d = 3; d <= 9; d += 3) { top++; if (!checkCollision(pl.x + Math.cos(a*Math.PI/180)*d, pl.z + Math.sin(a*Math.PI/180)*d, .6)) ac++; }
          // uzun ince dekoratif duvar kalmadı mı (bina/sur dışı kutu çarpıştırıcılar)
          const ince = (colliders||[]).filter(c => c && c.w !== undefined && Math.min(c.w, c.d) <= 2 && Math.max(c.w, c.d) >= 30 && Math.abs(c.x) < 40 && Math.abs(c.z) < 40).length;
          return { ui, hpH: hp ? hp.getBoundingClientRect().height : 0, mmW: mm.getBoundingClientRect().width, acik: ac / top, ince };
        }""")
        check(r['ui'] >= .55, 'arayüz ölçeği telefonda makul (ekranı kaplamaz) (%.2f)' % r['ui'])
        check(r['hpH'] >= 12, 'can çubuğu okunur yükseklikte (%dpx)' % r['hpH'])
        check(r['mmW'] >= 60, 'mini harita yeterince büyük (%dpx)' % r['mmW'])
        check(r['acik'] >= .7, 'doğma noktası çevresi ferah (%.0f%% açık)' % (r['acik'] * 100))
        r2 = pg.evaluate("""() => {
          // her etkileşim noktası caddeye yakın (|x|<=14) ve çarpışmasız; yanında görevli var
          const kotu = [], npc = [];
          ZONES.filter(z => INTERACTABLE_ZONES.includes(z.id) && z.id !== 'demirKapi' && z.id !== 'carsi').forEach(z => {
            if (Math.abs(z.dx) > 14 || checkCollision(z.dx, z.dz, .5)) kotu.push(z.id);
            if (!npcArr.some(n => Math.hypot(n.position.x - z.dx, n.position.z - z.dz) < 5)) npc.push(z.id);
          });
          // talim alanı: dört kenar kapalı, caddeye bakan kenarda geçilebilir kapı
          const d = ZONES.find(z => z.id === 'drill');
          const kapi = !checkCollision(d.x + d.w / 2, d.z, .6);
          const kuzey = checkCollision(d.x, d.z - d.d / 2, .6), guney = checkCollision(d.x, d.z + d.d / 2, .6), bati = checkCollision(d.x - d.w / 2, d.z, .6), dogu = checkCollision(d.x + d.w / 2, d.z + d.d / 2 - 1, .6);
          return { kotu, npc, kapi, kapali: kuzey && guney && bati && dogu };
        }""")
        check(not r2['kotu'], 'etkileşim noktaları caddede ve ulaşılabilir (sorunlu: %s)' % (r2['kotu'] or 'yok'))
        check(not r2['npc'], 'her kapının önünde görevli var (eksik: %s)' % (r2['npc'] or 'yok'))
        check(r2['kapi'] and r2['kapali'], 'talim alanı kapalı, caddeye bakan kapıdan girilir')
        r3 = pg.evaluate("""() => { const c = document.getElementById('c3d'), y0 = camYaw;
          const mk = x => new Touch({identifier: 7, target: c, clientX: x, clientY: 300});
          c.dispatchEvent(new TouchEvent('touchstart', {touches: [mk(200)], targetTouches: [mk(200)], changedTouches: [mk(200)], bubbles: true, cancelable: true}));
          c.dispatchEvent(new TouchEvent('touchmove', {touches: [mk(260)], targetTouches: [mk(260)], changedTouches: [mk(260)], bubbles: true, cancelable: true}));
          const mm = document.getElementById('mmBox').getBoundingClientRect(), cb = document.getElementById('camBtns').getBoundingClientRect();
          return { dy: camYaw - y0, alt: cb.top >= mm.bottom - 2 && cb.top - mm.bottom < 20 }; }""")
        check(abs(r3['dy']) > .1, 'tek parmak sürükleme kamerayı döndürüyor (%.2f rad)' % r3['dy'])
        check(r3['alt'], 'kamera düğmeleri mini haritanın hemen altında')
        check(r['ince'] == 0, 'Kışla ortasında uzun ince dekoratif duvar yok')
        check(not errs, 'JavaScript hatası yok')
        ctx.close()

        print('Harita denetimi (v1.57): doğma noktası ulaşılabilir, yeterli açık alan')
        ctx, pg, errs = yeni_sayfa(1280, 720)
        for m, asgariAcik, asgariUlas in (('kisla', .6, 5000), ('gorev', .5, 1500), ('orman', .8, 6000), ('maden', .3, 1500), ('tarim', .7, 6000), ('ciftlik', .7, 3500), ('sehir', .5, 2500), ('saray', .5, 2500)):
            pg.evaluate("BEGIN('%s')" % m); pg.wait_for_timeout(700)
            r = pg.evaluate("""() => { const H = MAP_HALF, hu = new Set(); let top = 0;
              for (let x = -H + 2; x <= H - 2; x++) for (let z = -H + 2; z <= H - 2; z++) { top++; if (!checkCollision(x, z, .6)) hu.add(x + ',' + z); }
              const bas = [Math.round(pl.x), Math.round(pl.z)], gor = new Set([bas.join(',')]), q = [bas];
              while (q.length) { const [x, z] = q.pop(); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b]) => { const k = (x + a) + ',' + (z + b); if (hu.has(k) && !gor.has(k)) { gor.add(k); q.push([x + a, z + b]); } }); }
              return { acik: hu.size / top, ulas: gor.size, basOk: hu.has(bas.join(',')) }; }""")
            check(r['basOk'], '%s: doğma noktası çarpışmasız' % m)
            check(r['acik'] >= asgariAcik, '%s: açık alan %%%d (en az %%%d)' % (m, r['acik'] * 100, asgariAcik * 100))
            check(r['ulas'] >= asgariUlas, '%s: doğmadan ulaşılabilir alan %d hücre (en az %d)' % (m, r['ulas'], asgariUlas))
        check(not errs, 'JavaScript hatası yok')
        ctx.close()

        print('Tarım Ovası: köylüler, tahıl, baskın (v1.61)')
        ctx, pg, errs = yeni_sayfa(1280, 720)
        pg.evaluate("BEGIN('tarim')"); pg.wait_for_timeout(900)
        r = pg.evaluate("""() => {
          const bas = [Math.round(pl.x), Math.round(pl.z)], gor = new Set([bas.join(',')]), q = [bas];
          while (q.length) { const [x, z] = q.pop(); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b]) => { const k = (x + a) + ',' + (z + b); if (!gor.has(k) && Math.abs(x + a) < 45 && Math.abs(z + b) < 45 && !checkCollision(x + a, z + b, .6)) { gor.add(k); q.push([x + a, z + b]); } }); }
          const ulas = (x, z) => gor.has(Math.round(x) + ',' + Math.round(z));
          return { tahil: tarimTahillar.length, tahilKapali: tarimTahillar.filter(t => !ulas(t.x, t.z)).length,
            koylu: tarimKoyluler.length, koyluKapali: tarimKoyluler.filter(k => !ulas(k.x, k.z)).length,
            cikis: ulas(TARIM_CIKIS.x, TARIM_CIKIS.z - 2), baskin: TARIM_BASKIN.filter(p => !ulas(Math.max(-44, Math.min(44, p[0])), Math.max(-44, Math.min(44, p[1])))).length,
            evKapali: TARIM_EVLER.filter(e => ulas(e[0], e[1])).length, dusman: enemies.length }; }""")
        check(r['tahil'] == 36 and r['tahilKapali'] == 0, 'Tarım: 36 tahıl demeti var ve hepsine ulaşılıyor (%d, ulaşılamayan %d)' % (r['tahil'], r['tahilKapali']))
        check(r['koylu'] == 6 and r['koyluKapali'] == 0, 'Tarım: 6 köylü ve hepsi ulaşılabilir yerde')
        check(r['cikis'], 'Tarım: çıkışa ulaşılıyor')
        check(r['baskin'] == 0, 'Tarım: eşkıya giriş noktaları ulaşılabilir alanda (kapalı: %d)' % r['baskin'])
        check(r['evKapali'] == 0, 'Tarım: evlerin içi dolu (çarpışmalı)')
        check(r['dusman'] == 0 and pg.evaluate('tarimKuyruk.length') >= 2, 'Tarım: ilk baskın uyarıyla ve sırayla gelecek (kuyrukta %d)' % pg.evaluate('tarimKuyruk.length'))
        r = pg.evaluate("""() => { enemies.forEach(e => S3.remove(e.mesh)); enemies.length = 0; tarimKuyruk.length = 0; const t = tarimTahillar[0], m0 = akce, c0 = tarimTahilSayac;
          pl.x = t.x; pl.z = t.z; return { m0, c0 }; }""")
        pg.wait_for_timeout(400)
        r2 = pg.evaluate("() => ({ akce, sayac: tarimTahilSayac, kalan: tarimTahillar.length })")
        check(r2['sayac'] == r['c0'] + 1 and r2['akce'] > r['m0'] and r2['kalan'] == 35, 'Tarım: tahıl demetine gidince toplanıyor, akçe artıyor')
        r = pg.evaluate("""() => { const k = tarimKoyluler[0]; enemies.length = 0; tarimKuyruk.length = 0; spawnTarimEskiya(false, [k.x + 1.2, k.z]); const e = enemies[0]; const h0 = k.hp; k.donuk = true;
          pl.x = 40; pl.z = 40; return { h0 }; }""")
        pg.wait_for_timeout(1800)
        r2 = pg.evaluate("() => tarimKoyluler[0].hp")
        check(r2 < r['h0'], 'Tarım: eşkıya köylüye saldırıyor (can %d → %d)' % (r['h0'], r2))
        pg.evaluate("() => { enemies.forEach(e => S3.remove(e.mesh)); enemies.length = 0; tarimKoyluler.forEach(k => { k.hp = 0; S3.remove(k.mesh); }); }")
        pg.wait_for_timeout(500)
        check(pg.evaluate("playing") is False and 'Köy Yandı' in pg.evaluate("document.getElementById('dlgT').textContent"), 'Tarım: tüm köylüler ölünce görev başarısız')
        pg.evaluate("hideDlg(); BEGIN('tarim')"); pg.wait_for_timeout(600)
        pg.evaluate("() => { pl.x = 0; pl.z = 40; }"); pg.wait_for_timeout(300)
        yakin = pg.evaluate("pl.nearZone && pl.nearZone.id")
        pg.keyboard.press('e'); pg.wait_for_timeout(1000)
        check(yakin == 'tarimCikis' and pg.evaluate('currentMap') == 'kisla', 'Tarım: çıkışta E ile Kışla\'ya dönülüyor')
        check(not errs, 'JavaScript hatası yok')
        ctx.close()

        print('Karakter özelleştirme ve silah gösterimi (v1.62)')
        ctx, pg, errs = yeni_sayfa(1280, 720)
        pg.evaluate("BEGIN('kisla')"); pg.wait_for_timeout(900)
        g = lambda: pg.evaluate("() => { const q = pl.mesh.userData.silah, v = k => q[k].visible; return { kin: v('kinYat'), kilic: v('elYat'), tufek: v('elTufek'), yay: v('elYay'), sTufek: v('sirtTufek'), sYay: v('sirtYay') }; }")
        pg.evaluate("pl.cekiT = 0; selW(0); pl.cekiT = 0"); pg.wait_for_timeout(200)
        a = g()
        check(a['kin'] and not a['kilic'] and not a['tufek'] and not a['yay'] and a['sTufek'] and not a['sYay'], 'Sakin durumda yatağan kınında, tüfek sırtta çapraz, elde silah yok')
        pg.evaluate("pl.atkCd = 0; doMelee(pl)"); pg.wait_for_timeout(200)
        a = g(); check(a['kilic'] and not a['kin'], 'Saldırınca kılıç ele geliyor, kın boşalıyor')
        pg.evaluate("selW(2); pl.atkCd = 0; pl.cekiT = 0"); pg.wait_for_timeout(200)
        a = g(); check(a['sYay'] and not a['yay'] and a['kin'], 'Yay seçili ama savaş yokken yay sırtta, kılıç kınında')
        pg.evaluate("selW(2)"); pg.wait_for_timeout(200)
        a = g(); check(a['yay'] and not a['sYay'], 'Silah seçince yay ele geliyor')
        pg.evaluate("selW(1); pl.atkCd = 0; pl.cekiT = 0"); pg.wait_for_timeout(200)
        a = g(); check(a['sTufek'] and not a['tufek'], 'Tüfek seçili, savaş yok: tüfek sırtta')
        pg.evaluate('selW(1)'); pg.wait_for_timeout(200)
        a = g(); check(a['tufek'] and not a['sTufek'], 'Tüfek seçilince ele geliyor, sırt boşalıyor')
        pg.evaluate("selW(0)")
        r = pg.evaluate("""() => { const say = () => { const q = modelYap('yeniceri').userData.silah; return Object.keys(q).filter(a => /Yat|Han|sirtTufek/.test(a)).sort().join(','); };
          const tam = say(); gorunumDegis('hancer', false); const yatSiz = say(); gorunumDegis('yatagan', false); const ikisiz = say(); gorunumDegis('tufek', false); const tufeksiz = say();
          const govde = n => modelYap('yeniceri').userData.govde.geometry.attributes.position.count; const kayisli = (gorunumSifirla(), govde()); gorunumDegis('kayis', false); const kayissiz = govde(); gorunumSifirla();
          return { tam, yatSiz, ikisiz, tufeksiz, kayisAzaldi: kayissiz < kayisli, modeller: ['silah_yatagan','silah_hancer','silah_tufek','silah_yay'].every(i => !!MODEL_KAYIT.harita[i]) }; }""")
        check(r['tam'] == 'elYat,kinHan,kinYat,sirtTufek' and r['yatSiz'] == 'elYat,kinYat,sirtTufek' and r['ikisiz'] == 'sirtTufek' and r['tufeksiz'] == '', 'Yatağan, hançer ve tüfek ayrı ayrı takılıp çıkarılıyor (%s | %s | %s | %s)' % (r['tam'], r['yatSiz'], r['ikisiz'], r['tufeksiz']))
        check(r['kayisAzaldi'], 'Kayışlar çıkarılınca gövde modelinden kalkıyor')
        check(r['modeller'], 'Silahlar model kütüphanesinde ayrı modeller (silah_yatagan, silah_hancer, silah_tufek, silah_yay)')
        r = pg.evaluate("""() => { const eski = modelYap('yeniceri').userData.govde.geometry; gorunumDegis('gov', 0x1F5FA8); gorunumDegis('biyikTip', 'sivri'); gorunumDegis('borkTip', 'fes');
          const yeni = modelYap('yeniceri').userData.govde.geometry, kayit = SAVE.gorunum && SAVE.gorunum.gov; gorunumSifirla(); return { fark: eski !== yeni, kayit, sifir: modelYap('yeniceri').userData.govde.geometry === eski }; }""")
        check(r['fark'] and r['kayit'] == 0x1F5FA8, 'Renk, bıyık ve başlık seçimi modeli değiştiriyor ve kaydediliyor')
        check(r['sifir'], 'Varsayılana dönünce model eski haline geliyor')
        check(not errs, 'JavaScript hatası yok')
        ctx.close()

        print('Çiftlik: menüye dönüş ve eski kayıt (v1.75)')
        ctx, pg, errs = yeni_sayfa(1280, 720)
        pg.evaluate("SAVE.ciftlik = { parsel: Array.from({length: 12}, (_, i) => ({ e: i === 1 ? 'arpa' : null, t: Date.now() })) }; BEGIN('ciftlik')"); pg.wait_for_timeout(700)
        check(pg.evaluate("SAVE.ciftlik.sira") == 3, 'Çiftlik: eski kayıtta dolu parselli sıralar açık sayılıyor')
        pg.evaluate("ciftlikPanelAc('envanter')"); pg.wait_for_timeout(200)
        pg.evaluate("toMenu()"); pg.wait_for_timeout(300)
        check(pg.evaluate("document.getElementById('ciftlikEnvBtn').style.display") == 'none' and pg.evaluate("document.getElementById('ciftlikPanel').style.display") == 'none', 'Çiftlik: ana menüye dönünce envanter düğmesi ve paneli kapanıyor')
        ctx.close()

        print('Yabancı Şehir ve Osmanlı Sarayı: dalga, hazine, boss, zafer (v1.73)')
        for hid in ('sehir', 'saray'):
            ctx, pg, errs = yeni_sayfa(1280, 720)
            pg.evaluate("SAVE.mapsUnlocked={orman:true,maden:true,tarim:true,ciftlik:true,sehir:true,saray:true}; BEGIN('%s')" % hid); pg.wait_for_timeout(900)
            r = pg.evaluate("() => ({ acik: dmAyar().hazine.filter(h => !checkCollision(h[0], h[1], .6)).length, toplam: dmAyar().hazine.length, hazine: dmHazine.length, wave })")
            check(r['acik'] == r['toplam'] and r['hazine'] == r['toplam'] and r['wave'] == 0, '%s: %d hazine sandığı da çarpışmasız yerde' % (hid, r['toplam']))
            pg.evaluate("() => { pl.x = dmHazine[0].x; pl.z = dmHazine[0].z; }"); pg.wait_for_timeout(400)
            check(pg.evaluate("dmSayac") == 1 and pg.evaluate("akce") > 0, '%s: hazine sandığı toplanınca akçe geliyor' % hid)
            pg.evaluate("() => { pl.x = 0; pl.z = 30; waveTimer = 1; }"); pg.wait_for_timeout(700)
            check(pg.evaluate("wave") == 1 and pg.evaluate("waveActive") is True and pg.evaluate("dmKuyruk.length") > 0, '%s: ilk dalga düşmanları sıraya girdi' % hid)
            pg.evaluate("() => { dmKuyruk.forEach(q => q.t = 1); }"); pg.wait_for_timeout(500)
            check(pg.evaluate("enemies.length") > 0, '%s: düşmanlar doğdu' % hid)
            pg.evaluate("() => { enemies.forEach(e => e.hp = 0); dmKuyruk = []; }"); pg.wait_for_timeout(500)
            check(pg.evaluate("waveActive") is False and pg.evaluate("kills") > 0, '%s: dalga bitince kazanılıyor' % hid)
            pg.evaluate("() => { wave = dmAyar().dalga - 1; waveTimer = 1; }"); pg.wait_for_timeout(600)
            pg.evaluate("() => { dmKuyruk.forEach(q => q.t = 1); }"); pg.wait_for_timeout(500)
            check(pg.evaluate("enemies.some(e => e.isBoss)"), '%s: son dalgada patron doğdu' % hid)
            pg.evaluate("() => { enemies.forEach(e => e.hp = 0); dmKuyruk = []; }"); pg.wait_for_timeout(600)
            check(pg.evaluate("dmBitti") is True, '%s: patron yenilince zafer' % hid)
            pg.evaluate("hideDlg()")
            pg.evaluate("() => { pl.x = dmAyar().cikis.x; pl.z = dmAyar().cikis.z; }"); pg.wait_for_timeout(300)
            pg.keyboard.press('e'); pg.wait_for_timeout(900)
            check(pg.evaluate('currentMap') == 'kisla', '%s: çıkışta E ile Kışla\'ya dönülüyor' % hid)
            check(not errs, '%s: JavaScript hatası yok (%s)' % (hid, errs[:1]))
            ctx.close()

        print('Çiftlik: ek, büyüt, biç, sat (v1.63)')
        ctx, pg, errs = yeni_sayfa(1280, 720)
        pg.evaluate("SAVE.ciftlik = null; SAVE.mainGold = 100; mainGold = 100; BEGIN('ciftlik')"); pg.wait_for_timeout(900)
        r = pg.evaluate("""() => {
          const bas = [Math.round(pl.x), Math.round(pl.z)], gor = new Set([bas.join(',')]), q = [bas];
          while (q.length) { const [x, z] = q.pop(); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b]) => { const k = (x + a) + ',' + (z + b); if (!gor.has(k) && Math.abs(x + a) < 37 && Math.abs(z + b) < 37 && !checkCollision(x + a, z + b, .6)) { gor.add(k); q.push([x + a, z + b]); } }); }
          const ul = (x, z) => gor.has(Math.round(x) + ',' + Math.round(z));
          return { parsel: CIFTLIK_PARSELLER.length, kapali: CIFTLIK_PARSELLER.filter(p => !ul(p.x, p.z)).length, raf: ul(CIFTLIK_RAF.x, CIFTLIK_RAF.z), pazar: ul(CIFTLIK_PAZAR.x, CIFTLIK_PAZAR.z), cikis: ul(CIFTLIK_CIKIS.x, CIFTLIK_CIKIS.z - 2), dusman: enemies.length }; }""")
        check(r['parsel'] == 12 and r['kapali'] == 0, 'Çiftlik: 12 parselin hepsine ulaşılıyor')
        check(r['raf'] and r['pazar'] and r['cikis'], 'Çiftlik: raf, pazar ve çıkışa ulaşılıyor')
        check(r['dusman'] == 0, 'Çiftlik: düşman yok')
        pg.evaluate("() => { const q = CIFTLIK_PARSELLER[4]; pl.x = q.x; pl.z = q.z; }"); pg.wait_for_timeout(300)
        pg.keyboard.press('e'); pg.wait_for_timeout(200)
        check(pg.evaluate("SAVE.ciftlik.sira") == 1, 'Çiftlik: yetersiz akçeyle parsel sırası açılmıyor')
        pg.evaluate("mainGold = 700; SAVE.mainGold = 700"); pg.keyboard.press('e'); pg.wait_for_timeout(300)
        check(pg.evaluate("SAVE.ciftlik.sira") == 2 and pg.evaluate("mainGold") == 100, 'Çiftlik: 600 akçeyle ikinci parsel sırası açılıyor')
        pg.evaluate("SAVE.ciftlik.sira = 3; ciftlikGorselYenile()")
        pg.evaluate("() => { const q = CIFTLIK_PARSELLER[0]; pl.x = q.x; pl.z = q.z; }"); pg.wait_for_timeout(300)
        pg.keyboard.press('e'); pg.wait_for_timeout(300)
        r = pg.evaluate("() => ({ e: SAVE.ciftlik.parsel[0].e, altin: mainGold })")
        check(r['e'] == 'arpa' and r['altin'] == 100 and pg.evaluate("SAVE.ciftlik.tohum.arpa") == 4, 'Çiftlik: ekim çantadaki tohumu harcar, akçe düşmez (%s, %s akçe)' % (r['e'], r['altin']))
        pg.keyboard.press('e'); pg.wait_for_timeout(200)
        check(pg.evaluate("SAVE.ciftlik.depo.arpa") == 0, 'Çiftlik: olgunlaşmadan biçilmiyor')
        pg.evaluate("SAVE.ciftlik.parsel[0].t = Date.now() - 31000"); pg.wait_for_timeout(300)
        pg.keyboard.press('e'); pg.wait_for_timeout(300)
        r = pg.evaluate("() => ({ depo: SAVE.ciftlik.depo.arpa, bos: SAVE.ciftlik.parsel[0].e })")
        check(r['depo'] == 1 and r['bos'] is None, 'Çiftlik: olgun ekin biçilince depoya giriyor')
        pg.evaluate("() => { pl.x = CIFTLIK_RAF.x; pl.z = CIFTLIK_RAF.z + .5; }"); pg.wait_for_timeout(300)
        pg.keyboard.press('e'); pg.wait_for_timeout(200)
        check(pg.evaluate("ciftlikPanelTur") == 'envanter', 'Çiftlik: rafta E envanteri açıyor')
        pg.evaluate("document.querySelector('#ciftlikPanel [data-a=sec][data-k=bugday]').click()")
        check(pg.evaluate("SAVE.ciftlik.secili") == 'bugday' and pg.evaluate("document.querySelectorAll('#ciftlikPanel [data-a=sec]').length") == 12, 'Çiftlik: envanter kutucuğundan ekilecek ekin seçiliyor')
        pg.keyboard.press('i'); pg.wait_for_timeout(200)
        check(pg.evaluate("ciftlikPanelTur") is None, 'Çiftlik: I tuşu envanteri kapatıp açıyor')
        pg.evaluate("() => { pl.x = CIFTLIK_PAZAR.x; pl.z = CIFTLIK_PAZAR.z; }"); pg.wait_for_timeout(300)
        pg.keyboard.press('e'); pg.wait_for_timeout(300)
        check(pg.evaluate("ciftlikPanelTur") == 'pazar' and pg.evaluate("document.getElementById('ciftlikPanel').style.display") == 'block', 'Çiftlik: pazarda E paneli açıyor')
        pg.evaluate("ciftlikPanelEylem('al5','bugday')")
        r = pg.evaluate("() => ({ altin: mainGold, t: SAVE.ciftlik.tohum.bugday })")
        check(r['t'] == 5 and r['altin'] == 75, 'Çiftlik: pazardan tohum satın alınıyor (%s tohum, %s akçe)' % (r['t'], r['altin']))
        pg.evaluate("ciftlikPanelEylem('hepsat')")
        r = pg.evaluate("() => ({ altin: mainGold, depo: SAVE.ciftlik.depo.arpa })")
        check(r['depo'] == 0 and r['altin'] == 83, 'Çiftlik: pazarda satınca akçe kazanılıyor (%s akçe)' % r['altin'])
        pg.evaluate("ciftlikPanelKapat(); SAVE.ciftlik.depo.pamuk = 3; SAVE.ciftlik.depo.arpa = 24; pl.x = CIFTLIK_SANDIK.x; pl.z = CIFTLIK_SANDIK.z"); pg.wait_for_timeout(300)
        pg.keyboard.press('e'); pg.wait_for_timeout(300)
        check(pg.evaluate("ciftlikPanelTur") == 'sandik', 'Çiftlik: sandıkta E paneli açıyor')
        pg.evaluate("ciftlikPanelEylem('sandigaUrun','pamuk'); ciftlikPanelEylem('sandigaTohum','bugday')")
        r = pg.evaluate("() => ({ c: SAVE.ciftlik.depo.pamuk, s: SAVE.ciftlik.sandik.depo.pamuk, ts: SAVE.ciftlik.sandik.tohum.bugday })")
        check(r['c'] == 2 and r['s'] == 1 and r['ts'] == 1, 'Çiftlik: sandığa ürün ve tohum konuyor (%s)' % r)
        pg.evaluate("ciftlikPanelEylem('cantayaUrun','pamuk')")
        check(pg.evaluate("SAVE.ciftlik.depo.pamuk") == 2 and pg.evaluate("SAVE.ciftlik.sandik.depo.pamuk") == 1, 'Çiftlik: çanta doluyken sandıktan ürün alınamıyor')
        pg.evaluate("SAVE.ciftlik.depo.arpa = 5; ciftlikPanelEylem('cantayaUrun','pamuk')")
        check(pg.evaluate("SAVE.ciftlik.depo.pamuk") == 3, 'Çiftlik: sandıktan çantaya geri alınıyor')
        pg.evaluate("SAVE.ciftlik.depo.arpa = 24")
        pg.evaluate("SAVE.ciftlik.depo.pamuk = 0; ciftlikPanelEylem('sandigaUrun','arpa'); ciftlikPanelEylem('cantayaUrun','arpa'); ciftlikPanelEylem('cantayaUrun','arpa')")
        check(pg.evaluate("SAVE.ciftlik.depo.arpa") == 24, 'Çiftlik: çanta sınırı (24) aşılmıyor')
        pg.evaluate("ciftlikPanelKapat()")
        pg.evaluate("() => { pl.x = 0; pl.z = 32; }"); pg.wait_for_timeout(300)
        pg.keyboard.press('e'); pg.wait_for_timeout(900)
        check(pg.evaluate('currentMap') == 'kisla', 'Çiftlik: çıkışta E ile Kışla\'ya dönülüyor')
        check(not errs, 'JavaScript hatası yok')
        ctx.close()

        print('Karakter paneli ekrana sığar, sürükleyince karakter döner (v1.64)')
        for (w, h) in ((1366, 768), (844, 390), (412, 800)):
            ctx, pg, errs = yeni_sayfa(w, h)
            pg.wait_for_timeout(600); pg.evaluate("gorunumAc()"); pg.wait_for_timeout(500)
            ok = pg.evaluate("""() => { const out = []; ['#gorunumPanel .gFoot .grn', '#gorunumPanel .zmX'].forEach(sel => { const b = document.querySelector(sel); const r = b.getBoundingClientRect();
              const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight || !(b === e || b.contains(e))) out.push(sel); });
              const pr = document.getElementById('gorunumPanel').getBoundingClientRect(); if (pr.bottom > innerHeight + 1 || pr.top < -1) out.push('panel'); return out; }""")
            check(not ok, '%dx%d: panel ve Tamam/Kapat düğmeleri ekranda, tıklanabilir (sorunlu: %s)' % (w, h, ok or 'yok'))
            a0 = pg.evaluate("HERO.manuel")
            bx, by = (w / 2, h * .2) if h > w else (w - 60, h / 2)
            pg.mouse.move(bx, by); pg.mouse.down(); pg.mouse.move(bx - 100, by, steps=6); pg.mouse.up()
            a1 = pg.evaluate("HERO.manuel")
            check(abs(a1 - a0) > .5, '%dx%d: boş alanda sürükleyince karakter dönüyor (%.2f → %.2f)' % (w, h, a0, a1))
            pg.click('#gorunumPanel .gFoot .grn'); pg.wait_for_timeout(200)
            check(pg.evaluate("document.getElementById('gorunumBox').style.display") == 'none' and pg.evaluate("HERO.manuel") is None, '%dx%d: Tamam paneli kapatıyor' % (w, h))
            check(not errs, 'JavaScript hatası yok')
            ctx.close()

        print('Kapat düğmeleri ekranda ve tıklanabilir (v1.58)')
        for (w, h) in ((1366, 768), (844, 390), (412, 800)):
            ctx, pg, errs = yeni_sayfa(w, h)
            pg.evaluate("BEGIN('kisla')"); pg.wait_for_timeout(700)
            kotu = []
            for js, kutu, dugme in (("openZone('kervansaray')", 'zoneMenuBox', '.zmX'), ("openZone('carsi')", 'zoneMenuBox', '.zmFoot button'), ("openZone('drill')", 'zoneMenuBox', '.zmX'),
                                    ("openBigMap()", 'bigMapBox', '#bmClose'), ("openSettings()", 'settingsBox', 'button')):
                pg.evaluate(js); pg.wait_for_timeout(250)
                ok = pg.evaluate("""([kutu, dugme]) => { const b = document.querySelector('#' + kutu + ' ' + dugme); if (!b) return false; const r = b.getBoundingClientRect();
                  if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) return false;
                  const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && (b === e || b.contains(e)); }""", [kutu, dugme])
                if not ok: kotu.append(js)
                pg.evaluate("document.querySelectorAll('[id$=Box]').forEach(e=>e.style.display='none');playing=true;paused=false")
            check(not kotu, '%dx%d: kapat düğmeleri ekranda ve tıklanabilir (sorunlu: %s)' % (w, h, kotu or 'yok'))
            ov = pg.evaluate("""() => { const ids = ['mmBox','camBtns','abilityBtns','runBtn','atkBtn','joyBase','wepSel']; const R = {};
              ids.forEach(i => { const e = document.getElementById(i); if (!e || getComputedStyle(e).display === 'none') return; const b = e.getBoundingClientRect(); if (b.width > 0) R[i] = [b.left, b.top, b.right, b.bottom]; });
              const k = Object.keys(R), o = []; for (let a = 0; a < k.length; a++) for (let c = a + 1; c < k.length; c++) { const A = R[k[a]], B = R[k[c]]; if (A[0] < B[2] && B[0] < A[2] && A[1] < B[3] && B[1] < A[3]) o.push(k[a] + 'x' + k[c]); } return o; }""")
            check(not ov, '%dx%d: kamera düğmeleri ve eylem düğmeleri üst üste binmiyor (%s)' % (w, h, ov or 'yok'))
            ctx.close()

        print('Demir Madeni: bağlı mağara ağı (v1.58)')
        ctx, pg, errs = yeni_sayfa(1280, 720)
        pg.evaluate("BEGIN('maden')"); pg.wait_for_timeout(900)
        r = pg.evaluate("""() => {
          const bas = [Math.round(pl.x), Math.round(pl.z)], gor = new Set([bas.join(',')]), q = [bas];
          const aciktir = (x, z) => !checkCollision(x, z, .6);
          while (q.length) { const [x, z] = q.pop(); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b]) => { const k = (x + a) + ',' + (z + b); if (!gor.has(k) && Math.abs(x + a) < 37 && Math.abs(z + b) < 37 && aciktir(x + a, z + b)) { gor.add(k); q.push([x + a, z + b]); } }); }
          const kapaliOda = MADEN_ODALAR.filter(o => !gor.has(Math.round((o.x0 + o.x1) / 4) * 2 + ',' + Math.round((o.z0 + o.z1) / 4) * 2) && !gor.has(Math.round((o.x0 + o.x1) / 2) + ',' + Math.round((o.z0 + o.z1) / 2))).map(o => o.id);
          const spots = [[0,22],[0,6],[-8,-6],[8,-6],[-22,-6],[-31,-12],[22,-6],[31,-12],[-22,-28],[22,-28],[0,-30]];
          return { kapaliOda, kayada: spots.filter(p => checkCollision(p[0], p[1], .6)).length, tuzakKayada: madenTraps.filter(t => checkCollision(t.x, t.z, .3)).length, oda: MADEN_ODALAR.length }; }""")
        check(not r['kapaliOda'], 'doğma noktasından tüm odalara ulaşılıyor (ulaşılamayan: %s)' % (r['kapaliOda'] or 'yok'))
        check(r['kayada'] == 0, 'düşman ve boss doğma noktaları kayanın içinde değil')
        check(r['tuzakKayada'] == 0, 'tuzaklar kayanın içinde değil')
        r = pg.evaluate("""() => {
          const once = loots.filter(l => l.cevher).length, m0 = metal;
          pl.x = -22; pl.z = -8; return { once, m0 }; }""")
        pg.wait_for_timeout(500)
        r2 = pg.evaluate("() => ({ sonra: loots.filter(l => l.cevher).length, m1: metal, kayada: loots.filter(l => l.cevher && checkCollision(l.x, l.z, .3)).length, sis: S3.fog.far })")
        check(r['once'] >= 15, 'Maden: yerde toplanabilir cevher ve taş var (%d)' % r['once'])
        check(r2['m1'] > r['m0'] and r2['sonra'] < r['once'], 'Maden: cevhere yaklaşınca toplanıyor (metal %d → %d)' % (r['m0'], r2['m1']))
        check(r2['kayada'] == 0, 'Maden: hiçbir cevher kayanın içinde değil')
        pg.evaluate("camZoom = 2.2"); pg.wait_for_timeout(600)
        sis = pg.evaluate("S3.fog.near")
        check(sis > 40, 'Maden: kamera uzaklaşınca sis oyuncuyu karartmıyor (sis başlangıcı %d)' % sis)
        r4 = pg.evaluate("""() => { enemies.length = 0;
          const say = madenDamarlar.length, turler = [...new Set(madenDamarlar.map(n => n.tur))].sort().join(',');
          const kapali = madenDamarlar.filter(n => { for (let a = 0; a < 6.3; a += .8) if (!checkCollision(n.x + Math.cos(a) * 1.9, n.z + Math.sin(a) * 1.9, .5)) return false; return true; }).length;
          const n = madenDamarlar.find(d => d.tur === 'altin'); pl.x = n.x; pl.z = n.z + 2.2; pl.ang = -Math.PI / 2; pl.face = pl.ang; pl.hp = 100;
          const l0 = loots.length, h0 = n.hp; let i = 0; for (; i < 12 && n.hp > 0; i++) { pl.atkCd = 0; doMelee(pl); }
          return { say, turler, kapali, h0, hp: n.hp, ganimet: loots.length - l0, kalan: madenDamarlar.length }; }""")
        check(r4['say'] >= 20 and r4['turler'] == 'altin,bakir,demir,gumus,kaya', 'Maden: kazılabilir damar var (%d; %s)' % (r4['say'], r4['turler']))
        check(r4['kapali'] == 0, 'Maden: her damara yaklaşılabiliyor')
        check(r4['hp'] <= 0 and r4['ganimet'] >= 3 and r4['kalan'] == r4['say'] - 1, 'Maden: kazma vuruşuyla altın damarı kazıldı, ganimet düştü (%d vuruş hakkı, %d ganimet)' % (r4['h0'], r4['ganimet']))
        pg.evaluate("() => { pl.x = 0; pl.z = 34; }"); pg.wait_for_timeout(300)
        yakin = pg.evaluate("pl.nearZone && pl.nearZone.id")
        pg.keyboard.press('e'); pg.wait_for_timeout(1000)
        check(yakin == 'madenCikis' and pg.evaluate('currentMap') == 'kisla', 'Maden: çıkışta E ile Kışla\'ya dönülüyor')
        check(not errs, 'JavaScript hatası yok')
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
          p2.abLv = { q: 1, f: 1, r: 1 }; useAbility('f', p2);
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

        print('PWA (servis çalışanı, manifest, çevrimdışı açılış)')
        ctx, pg, errs = yeni_sayfa()
        pg.wait_for_timeout(500)
        r = pg.evaluate("""async () => {
          const reg = await navigator.serviceWorker.ready;
          await new Promise(r => setTimeout(r, 800));
          const adlar = await caches.keys();
          const onbellek = adlar.length ? (await (await caches.open(adlar[0])).keys()).map(k => new URL(k.url).pathname) : [];
          const mf = await (await fetch('manifest.webmanifest')).json();
          return { kapsam: new URL(reg.scope).pathname, adlar, onbellek, ad: mf.short_name, surum: document.querySelector('meta[name="game-version"]').content, yukle: getComputedStyle(document.getElementById('btnInstall')).display };
        }""")
        check(r['adlar'] and r['adlar'][0] == 'yenicheri-' + r['surum'], 'servis çalışanı kuruldu, önbellek adı sürümle aynı: %s' % r['adlar'])
        check(any(x.endswith('index.html') or x == '/' for x in r['onbellek']) and any('manifest' in x for x in r['onbellek']), 'sayfa ve manifest önbellekte')
        check(r['yukle'] == 'none', 'kurulum düğmesi, kurulum olayı gelmeden gizli')
        ctx.set_offline(True)
        try:
            pg.reload(wait_until='domcontentloaded')
            baslik = pg.title()
        except Exception as e:
            baslik = 'HATA ' + str(e)[:80]
        check('Yeniçeri' in baslik, 'ağ yokken sayfa önbellekten açıldı: %s' % baslik)
        ctx.close()

        print('Ağ şeridi (4 oyuncu, 40 düşman)')
        ctx, pg, errs = yeni_sayfa()
        r = pg.evaluate("""() => { BEGIN('orman'); REN.render = () => {};
          for (let i = 1; i <= 3; i++) SESSION.addPeer('c' + i, { send() {}, poll() { return []; } });
          enemies.forEach(e => S3.remove(e.mesh)); enemies = [];
          for (let i = 0; i < 40; i++) spawnAnimal(['geyik', 'kurt', 'domuz'][i % 3], false);
          for (let i = 0; i < 16; i++) { const m = modelYap('mermi_tufek'); S3.add(m); bullets.push({ id: newNetId(), mesh: m, vx: .3, vz: .1, life: 60 }); }
          for (let i = 0; i < 12; i++) dropLoot(Math.random() * 10, Math.random() * 10, 1);
          const s = snapshot(), tel = JSON.stringify(ozetPakla(s)), eski = JSON.stringify(s);
          const g = ozetAc(JSON.parse(tel));
          let fark = 0; s.e.forEach((e, i) => { fark = Math.max(fark, Math.abs(e.x - g.e[i].x), Math.abs(e.z - g.e[i].z)); });
          s.p.forEach((q, i) => { fark = Math.max(fark, Math.abs(q.x - g.p[i].x)); });
          return { tel: tel.length, eski: eski.length, fark: fark, ok: g.p.length === s.p.length && g.e.length === s.e.length && g.b.length === s.b.length && g.l.length === s.l.length && g.p[1].id === s.p[1].id && g.e[7].k === s.e[7].k && g.e[7].hp === s.e[7].hp };
        }""")
        print('      boyut: %d bayt (okunaklı biçim %d); 15 Hz ile %.0f KB/sn/istemci' % (r['tel'], r['eski'], r['tel'] * 15 / 1024))
        check(r['ok'], 'kompakt özet açılınca aynı oyuncu, düşman, mermi ve ganimet sayısı ve kimlikleri')
        check(r['fark'] <= .051, 'yuvarlama farkı en çok %.3f birim' % r['fark'])
        check(r['tel'] < r['eski'] * .62 and r['tel'] < 2800, 'kompakt özet küçük: %d bayt' % r['tel'])
        check(not errs, 'JavaScript hatası yok')
        ctx.close()

        print('Model kütüphanesi')
        ctx, pg, errs = yeni_sayfa()
        r = pg.evaluate("""() => {
          kutuphaneAc();
          const sonuc = { sayi: MODEL_KAYIT.liste.length, hatalar: [], bos: [] };
          MODEL_KAYIT.liste.forEach(t => {
            try {
              kutuphaneSec(t.id);
              const g = modelYap(t.id, { cubuk: true }), ist = modelIstatistik(g);
              const kutu = new THREE.Box3().setFromObject(g), h = kutu.max.y - kutu.min.y;
              if (ist.ucgen < 4) sonuc.bos.push(t.id);
              if (t.bar && !(g.userData.hpBg && g.userData.hpFl)) sonuc.hatalar.push(t.id + ': can çubuğu yok');
              if (!g.userData.govde) sonuc.hatalar.push(t.id + ': govde yok');
              if (t.boy && !t.bar && false) {}
            } catch (e) { sonuc.hatalar.push(t.id + ': ' + e.message); }
          });
          sonuc.liste = document.querySelectorAll('.libOge').length;
          sonuc.bilgi = document.getElementById('libBilgi').textContent.length > 20;
          kutuphaneKapat();
          return sonuc;
        }""")
        check(r['sayi'] >= 14 and r['liste'] == r['sayi'], 'kütüphanede %d model listeleniyor' % r['sayi'])
        check(not r['hatalar'] and not r['bos'], 'her model çiziliyor, üçgeni var, gövde ve can çubuğu tanımlı %s' % (r['hatalar'] + r['bos']))
        check(r['bilgi'], 'model bilgi paneli dolu')
        uniq = sorted(set(errs))
        check(not uniq, 'JavaScript hatası yok' + ('' if not uniq else ': ' + uniq[0]))
        ctx.close()

        print('Model kütüphanesi: .glb indir, içe aktar, kalıcılık')
        ctx, pg, errs = yeni_sayfa()
        veri = pg.evaluate("""async () => {
          await gltfDisaAktarHazir();
          const g = modelYap('kurt');
          return await new Promise(r => new THREE.GLTFExporter().parse(g, s => r(Array.from(new Uint8Array(s))), { binary: true }));
        }""")
        check(len(veri) > 500 and veri[:4] == [0x67, 0x6c, 0x54, 0x46], 'kurt modeli geçerli .glb olarak dışa aktarıldı (%d bayt)' % len(veri))
        pg.evaluate("kutuphaneAc(); kutuphaneSec('kurt')")
        pg.set_input_files('#libDosya', files=[{'name': 'kurt.glb', 'mimeType': 'model/gltf-binary', 'buffer': bytes(veri)}])
        pg.wait_for_function("MODEL_KAYIT.glb.kurt", timeout=8000)
        r = pg.evaluate("""() => { const g = modelYap('kurt', { cubuk: true }); return { kaynak: g.userData.kaynak, hp: !!g.userData.hpFl, govde: !!g.userData.govde,
            yuk: (() => { const k = new THREE.Box3().setFromObject(g.children[0]); return k.max.y - k.min.y; })(), boy: MODEL_KAYIT.harita.kurt.boy, alt: new THREE.Box3().setFromObject(g.children[0]).min.y }; }""")
        check(r['kaynak'] == 'glb' and r['hp'] and r['govde'], '.glb içe aktarılınca model glb kaynağından geliyor, can çubuğu ve gövde korunuyor')
        check(abs(r['yuk'] - r['boy']) < .05 and abs(r['alt']) < .05, 'model gerçek boyuna ölçeklendi (%.2f / %.2f m) ve ayakları zeminde' % (r['yuk'], r['boy']))
        r = pg.evaluate("""() => { REN && 0; kutuphaneKapat(); BEGIN('orman'); REN.render = () => {}; enemies.forEach(e => S3.remove(e.mesh)); enemies = [];
            spawnAnimal('kurt', false); const e = enemies[0]; e.hurtT = 3; for (let i = 0; i < 6; i++) update(1 / 60);
            return { mid: e.mid, kaynak: e.mesh.userData.kaynak, hata: false }; }""")
        check(r['mid'] == 'kurt' and r['kaynak'] == 'glb', 'oyunda doğan kurt .glb modelini kullandı, vuruş parlaması hata vermedi')
        pg.reload(wait_until='load'); pg.wait_for_timeout(1500)
        r = pg.evaluate("() => ({ k: MODEL_KAYIT.kaynak.kurt || null })")
        check(r['k'] == 'cihaz', 'sayfa yenilenince cihazdaki model IndexedDB\'den geri geldi')
        pg.evaluate("kutuphaneAc(); kutuphaneSec('kurt'); libSifirla()"); pg.wait_for_timeout(500)
        r = pg.evaluate("() => ({ k: MODEL_KAYIT.kaynak.kurt || null, g: modelYap('kurt').userData.kaynak })")
        check(r['k'] is None and r['g'] == 'kod', 'sıfırlayınca kod modeline dönüldü')
        uniq = sorted(set(errs))
        check(not uniq, 'JavaScript hatası yok' + ('' if not uniq else ': ' + uniq[0]))
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

        print('Profil, hikaye, ayarlar, kayıt (v1.76)')
        ctx, pg, errs = yeni_sayfa(844, 390)
        pg.evaluate("menuProfilGuncelle()")
        pg.evaluate("profilAdDegis('Test<b>Er')")
        check(pg.evaluate("SAVE.profil.ad") == 'TestbEr', 'profil adı temizleniyor')
        pg.evaluate("profilAvatarSec('🦅')")
        check(pg.evaluate("document.getElementById('mpAv').textContent") == '🦅' or pg.evaluate("SAVE.profil.avatar") == '🦅', 'profil avatarı seçiliyor')
        h = pg.evaluate("""() => { const g0=mainGold; hikayeSay('kill_gorev',10); const p=HIKAYE[0];
          const t1=hikayeTamam(p); SAVE.story2.odul=true; hikayeOdulAl();
          return {t1, act:SAVE.story2.act, bitti:SAVE.story2.bitti.slice(), gold:mainGold-g0, ilk:hikayePerdeDurum(HIKAYE[1])}; }""")
        check(h['t1'] and h['act'] == 2 and h['bitti'] == [1] and h['gold'] > 0 and h['ilk'] == 'aktif', 'hikaye: perde 1 tamam → ödül → perde 2 açıldı')
        h2 = pg.evaluate("() => { hikayeOdulAl(); return SAVE.story2.act; }")
        check(h2 == 2, 'hikaye: ödül tekrar alınamıyor')
        check(pg.evaluate("hikayePerdeDurum(HIKAYE[3])") == 'kilit', 'hikaye: ilerlemeyen perde kilitli')
        pg.evaluate("openSettings()"); pg.wait_for_timeout(200)
        sek = pg.evaluate("document.querySelectorAll('#settingsPanel .ayTab').length")
        check(sek >= 4, 'ayarlarda sekmeler var (%d)' % sek)
        for i in range(sek):
            pg.evaluate("document.querySelectorAll('#settingsPanel .ayTab')[%d].click()" % i); pg.wait_for_timeout(80)
        check(not errs, 'tüm ayar sekmeleri hatasız açılıyor')
        pg.evaluate("closeSettings()")
        pk = pg.evaluate("kayitPaketi()")
        pg.evaluate("SAVE.profil.ad='Degisti'")
        pg.evaluate("ayarSekme('hesap')")
        pg.evaluate("(t)=>{document.getElementById('ayKayit').value=t; kayitIce();}", pk)
        check(pg.evaluate("document.getElementById('dlgB')&&getComputedStyle(document.getElementById('dlgB')).display!=='none'"), 'geçerli kayıt: onay penceresi çıkıyor')
        pg.evaluate("hideDlg()")
        pg.evaluate("document.getElementById('ayKayit').value='{bozuk json'; kayitIce();")
        check(pg.evaluate("SAVE.profil.ad") == 'Degisti', 'bozuk kayıt reddedilip mevcut kayıt korunuyor')
        check(pg.evaluate("typeof SAVE") == 'object' and pg.evaluate("!!SAVE.stats"), 'bozuk kayıt içe aktarılınca oyun bozulmuyor')
        check(not errs, 'profil/hikaye testlerinde JS hatası yok: %s' % errs[:1])
        ctx.close()

        print('Telefonda HUD ekranı kaplamıyor (v1.77)')
        for (w, hh) in ((740, 340), (844, 390), (915, 412)):
            ctx, pg, errs = yeni_sayfa(w, hh)
            pg.evaluate("BEGIN('gorev')"); pg.wait_for_timeout(1200)
            oran = pg.evaluate("""() => { const r=['topLeftHud','mmBox'].map(i=>document.getElementById(i).getBoundingClientRect());
              const alan=r.reduce((a,b)=>a+b.width*b.height,0); return alan/(innerWidth*innerHeight); }""")
            check(oran < 0.2, '%dx%d: HUD alanı ekranın %%%d\'i (en çok %%20)' % (w, hh, oran * 100))
            ctx.close()

        print('Ekran boyutlarında menü ve paneller taşmıyor')
        for (w, hh) in ((844, 390), (667, 375), (390, 844), (360, 640), (1024, 768)):
            ctx, pg, errs = yeni_sayfa(w, hh)
            sorun = []
            for ad, fn, kutu in (('menü', '0', 'menuLayer'), ('ayar', 'openSettings()', 'settingsPanel'), ('profil', 'profilAc()', 'profilPanel'), ('hikaye', 'hikayeAc()', 'hikayePanel'), ('atölye', 'atolyeAc()', 'atolyePanel')):
                pg.evaluate(fn); pg.wait_for_timeout(150)
                r = pg.evaluate("(id)=>{const e=document.getElementById(id);const b=e.getBoundingClientRect();return [b.left,b.top,b.right,b.bottom,innerWidth,innerHeight,document.documentElement.scrollWidth]}", kutu)
                if r[0] < -1 or r[1] < -1 or r[2] > r[4] + 1 or r[3] > r[5] + 1:
                    sorun.append('%s %s' % (ad, [round(x) for x in r]))
                for k in ('settingsBox', 'profilBox', 'hikayeBox', 'atolyeBox'):
                    pg.evaluate("document.getElementById('%s').style.display='none'" % k)
            check(not sorun, '%dx%d: ekrana sığıyor %s' % (w, hh, sorun or ''))
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
