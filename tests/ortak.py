"""Tarayıcı testleri için ortak yardımcılar (smoke.py, altin.py).

Ortam değişkenleri (hepsi isteğe bağlı):
  CHROME_PATH  tarayıcı yürütülebilir dosyası (yoksa Playwright'ın kendi Chromium'u)
  THREE_JS     yerel three.min.js (r128). Verilmezse CDN'e ulaşılması gerekir; ağ kapalıysa
               `npm i three@0.128.0` ile node_modules/three/build/three.min.js kullanılır.
"""
import functools
import http.server
import os
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def three_source():
    for p in (os.environ.get('THREE_JS'),
              os.path.join(ROOT, 'node_modules', 'three', 'build', 'three.min.js'),
              os.path.join(ROOT, 'vendor', 'three.min.js')):
        if p and os.path.isfile(p):
            with open(p, encoding='utf-8') as f:
                return f.read()
    return None


class _Sessiz(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def sunucu():
    """Proje kökünü yerelde sunar; (sunucu, url) döndürür."""
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(_Sessiz, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, 'http://127.0.0.1:%d/index.html' % srv.server_address[1]


def yonlendirici():
    """three.js'i yerel kopyadan verir, Google Fonts isteklerini boş yanıtlar."""
    three = three_source()

    def route(r):
        u = r.request.url
        if three and 'three.min.js' in u:
            r.fulfill(status=200, content_type='application/javascript', body=three)
        elif 'fonts.g' in u:
            r.fulfill(status=200, content_type='text/css', body='')
        else:
            r.continue_()
    return route


def tarayici(p):
    args = {'headless': True,
            'args': ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']}
    if os.environ.get('CHROME_PATH'):
        args['executable_path'] = os.environ['CHROME_PATH']
    return p.chromium.launch(**args)
