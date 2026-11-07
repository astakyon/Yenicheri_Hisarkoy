#!/usr/bin/env python3
"""Tarayıcısız kaynak denetimleri. Çalıştırma: python3 tests/test_kaynak.py

1. index.html, src/'den üretilen çıktıyla aynı mı (güncel mi)?
2. Birleşik script Node ile söz dizimi denetiminden geçiyor mu?
3. Üst düzeyde aynı isimle iki kez tanımlanmış function var mı? (tek script'te sonraki, öncekini sessizce ezer)
4. getElementById('x') ile istenen her id, HTML'de ya da JS'te üretiliyor mu?
   (Silinmiş bir elemana erişim 'Cannot read properties of null' hatasının en sık kaynağıdır.)
"""
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import build  # noqa: E402

# Bilinen ve kodda null korumalı olan, bilerek tanımsız bırakılmış id'ler
NULL_GUVENLI_IDLER = {'btmBar'}

fails = []


def ok(msg):
    print('  ok  ' + msg)


def fail(msg):
    fails.append(msg)
    print('  HATA ' + msg)


def js_dosyalari():
    listed, _ = build.module_order()
    return [(n, build.read(os.path.join(build.SRC, 'js', n))) for n in listed]


# 1 ----------------------------------------------------------------------
html = build.build()
cur_path = os.path.join(ROOT, 'index.html')
if os.path.isfile(cur_path) and build.read(cur_path) == html:
    ok('index.html src/ ile güncel')
else:
    fail('index.html güncel değil: python3 tools/build.py')

# 2 ----------------------------------------------------------------------
js_all = ''.join(t if t.endswith('\n') else t + '\n' for _, t in js_dosyalari()).replace('{{VERSION}}', 'v0.0')
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tf:
    tf.write(js_all)
try:
    r = subprocess.run(['node', '--check', tf.name], capture_output=True, text=True)
    if r.returncode == 0:
        ok('birleşik script söz dizimi geçerli (%d satır)' % js_all.count('\n'))
    else:
        fail('söz dizimi hatası:\n' + r.stderr[:600])
except FileNotFoundError:
    print('  atlandı: node yok (söz dizimi denetimi yapılamadı)')
finally:
    os.unlink(tf.name)

# 3 ----------------------------------------------------------------------
tanim = {}
for name, text in js_dosyalari():
    for m in re.finditer(r'^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(', text, re.M):
        tanim.setdefault(m.group(1), []).append(name)
cift = {k: v for k, v in tanim.items() if len(v) > 1}
if cift:
    for k, v in sorted(cift.items()):
        fail('function %s birden çok kez tanımlı: %s' % (k, ', '.join(v)))
else:
    ok('%d üst düzey function, tekrar yok' % len(tanim))

# 4 ----------------------------------------------------------------------
body = build.read(os.path.join(build.SRC, 'html', 'body.html'))
tanimli = set(re.findall(r'\bid="([A-Za-z0-9_\-]+)"', body))
istenen = set()
for name, text in js_dosyalari():
    istenen |= set(re.findall(r"getElementById\(\s*'([A-Za-z0-9_\-]+)'\s*\)", text))
    tanimli |= set(re.findall(r'\bid="([A-Za-z0-9_\-]+)"', text))          # innerHTML ile üretilenler
    tanimli |= set(re.findall(r"\.id\s*=\s*'([A-Za-z0-9_\-]+)'", text))     # createElement ile üretilenler
eksik = sorted(istenen - tanimli - NULL_GUVENLI_IDLER)
if eksik:
    fail("getElementById ile istenen ama hiçbir yerde tanımlı olmayan id'ler: " + ', '.join(eksik))
else:
    ok("%d id isteniyor, hepsi tanımlı" % len(istenen))

# 5 — PWA / TWA dosyaları ------------------------------------------------
import json as _json
def _json_oku(yol):
    with open(os.path.join(build.ROOT, yol), encoding='utf-8') as f:
        return _json.load(f)
try:
    mf = _json_oku('manifest.webmanifest')
    eksik_simge = [i['src'] for i in mf['icons'] if not os.path.isfile(os.path.join(build.ROOT, i['src']))]
    if eksik_simge:
        fail('manifest simgeleri diskte yok: ' + ', '.join(eksik_simge))
    elif not any('maskable' in i['purpose'] for i in mf['icons']) or not any(i['sizes'] == '512x512' for i in mf['icons']):
        fail('manifest: 512x512 ve maskable simge şart')
    elif not (mf.get('start_url') and mf.get('scope') and mf.get('display') and mf.get('name')):
        fail('manifest: start_url, scope, display, name zorunlu')
    else:
        ok('manifest geçerli, %d simge diskte' % len(mf['icons']))
    twa = _json_oku('twa-manifest.json')
    surum = build.read(os.path.join(build.ROOT, 'VERSION')).strip()
    ana, alt = surum.lstrip('v').split('.')
    # twa-manifest sürümü iş akışında VERSION'dan yazılır; dosyadaki değer yalnızca başlangıç değeridir
    if twa['themeColor'].lower() != mf['theme_color'].lower() or twa['orientation'] != mf['orientation']:
        fail('twa-manifest.json ile manifest.webmanifest tema rengi ya da yön olarak ayrışmış')
    elif not re.fullmatch(r'[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+', twa['packageId']):
        fail('twa-manifest packageId geçersiz: ' + twa['packageId'])
    else:
        ok('twa-manifest tutarlı (%s, sürüm kodu iş akışında %d%02d)' % (twa['packageId'], int(ana), int(alt)))
    html = build.read(os.path.join(build.ROOT, 'index.html'))
    if 'rel="manifest"' not in html or 'game-version' not in html:
        fail('index.html: manifest bağlantısı ya da game-version etiketi yok')
    else:
        ok('index.html manifest ve sürüm etiketini taşıyor')
    r = subprocess.run(['node', '--check', os.path.join(build.ROOT, 'sw.js')], capture_output=True, text=True)
    ok('sw.js söz dizimi geçerli') if r.returncode == 0 else fail('sw.js söz dizimi hatası: ' + r.stderr[:300])
except FileNotFoundError as e:
    fail('PWA dosyası eksik: ' + str(e))

print()
if fails:
    print('BAŞARISIZ: %d sorun' % len(fails))
    sys.exit(1)
print('kaynak denetimleri geçti')
