#!/usr/bin/env python3
"""src/ -> index.html (tek dosyalık oyun)

Kullanım:
  python3 tools/build.py            index.html üretir
  python3 tools/build.py --check    index.html güncel mi? (CI / test için; güncel değilse 1 döner)
  python3 tools/build.py --out YOL  başka bir dosyaya yazar

Kaynak düzeni (docs/MIMARI.md):
  src/index.html      şablon: @@CSS@@, @@BODY@@, @@JS@@ yer tutucuları ve {{VERSION}}
  src/css/main.css    bütün stiller
  src/html/body.html  menüler, paneller, HUD, dokunmatik düğmeler
  src/js/SIRA.txt     JS modüllerinin birleştirme sırası (tek script olarak birleşir)
  src/js/<konu>/*.js  oyun kodu
  VERSION             'v1.xx' biçiminde sürüm; {{VERSION}} yerine yazılır

index.html doğrudan düzenlenmez; her zaman src/ içinden üretilir.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')


def read(path):
    with open(path, encoding='utf-8', newline='') as f:
        return f.read()


def harita_css():
    """src/assets/kariyer-harita.(jpg|png|webp) varsa Kariyer haritası arka planı olarak gömülür."""
    import base64
    for ext, mime in (('jpg', 'jpeg'), ('png', 'png'), ('webp', 'webp')):
        yol = os.path.join(SRC, 'assets', 'kariyer-harita.' + ext)
        if os.path.exists(yol):
            with open(yol, 'rb') as f:
                b = base64.b64encode(f.read()).decode()
            return "\n:root{--ky-harita:url(data:image/%s;base64,%s) center/100%% 100%% no-repeat}\n" % (mime, b)
    return ''


def module_order():
    """SIRA.txt'yi okur; listeyi ve diskteki dosyaları karşılaştırır."""
    js_dir = os.path.join(SRC, 'js')
    listed = []
    for line in read(os.path.join(js_dir, 'SIRA.txt')).splitlines():
        line = line.strip()
        if line and not line.startswith('#'):
            listed.append(line)
    errors = []
    seen = set()
    for name in listed:
        if name in seen:
            errors.append('SIRA.txt içinde birden fazla geçiyor: ' + name)
        seen.add(name)
        if not os.path.isfile(os.path.join(js_dir, name)):
            errors.append('SIRA.txt\'de var ama dosya yok: ' + name)
    on_disk = set()
    for base, _dirs, files in os.walk(js_dir):
        for fn in files:
            if fn.endswith('.js'):
                on_disk.add(os.path.relpath(os.path.join(base, fn), js_dir).replace(os.sep, '/'))
    for name in sorted(on_disk - seen):
        errors.append('Dosya var ama SIRA.txt\'de yok (oyuna eklenmez): ' + name)
    return listed, errors


def build():
    listed, errors = module_order()
    version = read(os.path.join(ROOT, 'VERSION')).strip()
    if not re.fullmatch(r'v\d+\.\d+', version):
        errors.append("VERSION 'v1.23' biçiminde olmalı, bulunan: " + repr(version))
    if errors:
        raise SystemExit('Derleme durdu:\n  - ' + '\n  - '.join(errors))

    js_parts = []
    for name in listed:
        text = read(os.path.join(SRC, 'js', name))
        if not text.endswith('\n'):
            text += '\n'
        js_parts.append(text)

    out = read(os.path.join(SRC, 'index.html'))
    for key, text in (('@@CSS@@', read(os.path.join(SRC, 'css', 'main.css')) + harita_css()),
                      ('@@BODY@@', read(os.path.join(SRC, 'html', 'body.html'))),
                      ('@@JS@@', ''.join(js_parts))):
        if out.count(key) != 1:
            raise SystemExit('Şablonda %s tam bir kez olmalı' % key)
        out = out.replace(key, text)
    out = out.replace('{{VERSION}}', version)
    return out


def main(argv):
    out_path = os.path.join(ROOT, 'index.html')
    check = False
    args = list(argv)
    while args:
        a = args.pop(0)
        if a == '--check':
            check = True
        elif a == '--out' and args:
            out_path = os.path.abspath(args.pop(0))
        else:
            raise SystemExit(__doc__)
    html = build()
    if check:
        cur = read(out_path) if os.path.isfile(out_path) else None
        if cur != html:
            print('index.html GÜNCEL DEĞİL — python3 tools/build.py çalıştırın', file=sys.stderr)
            return 1
        print('index.html güncel (%d bayt)' % len(html.encode('utf-8')))
        return 0
    with open(out_path, 'w', encoding='utf-8', newline='') as f:
        f.write(html)
    print('yazıldı: %s (%d bayt, %d modül)' % (os.path.relpath(out_path, ROOT), len(html.encode('utf-8')), len(module_order()[0])))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
