#!/usr/bin/env python3
"""Uygulama simgelerini tek bir çizimden üretir: python3 tools/ikonlar.py
Çıktı: icon-192.png, icon-512.png, icons/icon.svg, icons/icon-maskable-192|512.png, icons/icon-mono-512.png,
       icons/icon-48|72|96|128|144|180|256|384.png
Gerekli: playwright (+ Chromium). CHROME_PATH ile tarayıcı seçilebilir."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
from playwright.sync_api import sync_playwright  # noqa: E402

import ortak  # noqa: E402

KOK = ortak.ROOT

# Çizim: bordo zemin, altın hilal, kırmızı çerçeveli krem börk (yeniçeri başlığı), arkada sarkan kuyruk, önde altın kaşıklık
def svg(kapsam='any', renk=True):
    olcek = {'any': 1.0, 'maskable': 0.72, 'mono': 0.9}[kapsam]
    rx = 'rx="96"' if kapsam == 'any' else ''
    zemin = '' if kapsam == 'mono' else (
        '<defs><radialGradient id="g" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#a02020"/><stop offset="1" stop-color="#4a0a0a"/></radialGradient>'
        '<mask id="m"><rect width="512" height="512" fill="#fff"/><circle cx="392" cy="150" r="66" fill="#000"/></mask></defs>'
        '<rect width="512" height="512" ' + rx + ' fill="url(#g)"/>')
    altin, krem, krem2, kenar = ('#E8B923', '#EFE5CC', '#D6C9A8', '#6b1010') if kapsam != 'mono' else ('#000', '#000', '#000', '#000')
    hilal = ('<g mask="url(#m)"><circle cx="372" cy="150" r="70" fill="%s"/></g>' % altin) if kapsam != 'mono' else \
            '<path d="M372 80a70 70 0 1 0 0 140a56 56 0 1 1 0-140z" fill="#000"/>'
    govde = (
        '<path d="M335 235 C410 255 430 355 412 448 L352 436 C364 384 352 326 335 300 Z" fill="%s" stroke="%s" stroke-width="6" stroke-linejoin="round"/>'
        '<path d="M168 345 C160 215 212 148 256 148 C300 148 352 215 344 345 Z" fill="%s" stroke="%s" stroke-width="6" stroke-linejoin="round"/>'
        '<rect x="160" y="318" width="192" height="44" rx="10" fill="%s" stroke="%s" stroke-width="6"/>'
        '<ellipse cx="256" cy="215" rx="21" ry="46" fill="%s" stroke="%s" stroke-width="5"/>'
        '<rect x="238" y="168" width="36" height="14" rx="6" fill="%s"/>'
    ) % (krem2, kenar, krem, kenar, altin, kenar, altin, kenar, altin)
    if kapsam == 'mono':   # tek renk: siluet
        govde = govde.replace('stroke="#000"', 'stroke="none"')
    icerik = '<g transform="translate(256 256) scale(%s) translate(-256 -256)">%s%s</g>' % (olcek, hilal, govde)
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">%s%s</svg>' % (zemin, icerik)


def main():
    os.makedirs(os.path.join(KOK, 'icons'), exist_ok=True)
    with open(os.path.join(KOK, 'icons', 'icon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg('any'))
    isler = [('icon-192.png', 'any', 192), ('icon-512.png', 'any', 512)]
    isler += [('icons/icon-%d.png' % n, 'any', n) for n in (48, 72, 96, 128, 144, 180, 256, 384)]
    isler += [('icons/icon-maskable-192.png', 'maskable', 192), ('icons/icon-maskable-512.png', 'maskable', 512),
              ('icons/icon-mono-512.png', 'mono', 512)]
    with sync_playwright() as p:
        b = ortak.tarayici(p)
        for yol, kapsam, n in isler:
            pg = b.new_page(viewport={'width': n, 'height': n})
            pg.set_content('<body style="margin:0;background:transparent">%s</body>' % svg(kapsam).replace('width="512" height="512"', 'width="%d" height="%d"' % (n, n)))
            pg.screenshot(path=os.path.join(KOK, yol), omit_background=True)
            pg.close()
        b.close()
    print('%d simge üretildi' % (len(isler) + 1))


if __name__ == '__main__':
    main()
