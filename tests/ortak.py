"""Tarayıcı testleri için ortak yardımcılar (smoke.py, altin.py).

Ortam değişkenleri (hepsi isteğe bağlı):
  CHROME_PATH  tarayıcı yürütülebilir dosyası (yoksa Playwright'ın kendi Chromium'u)
  PEER_JS      yerel peerjs.min.js (çok oyunculu testler için; ya da `npm i peerjs@1.5.4`)
  THREE_JS     yerel three.min.js (r128). Verilmezse CDN'e ulaşılması gerekir; ağ kapalıysa
               `npm i three@0.128.0` ile node_modules/three/build/three.min.js kullanılır.
"""
import functools
import http.server
import os
import re
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def peer_source():
    for p in (os.environ.get('PEER_JS'),
              os.path.join(ROOT, 'node_modules', 'peerjs', 'dist', 'peerjs.min.js'),
              os.path.join(ROOT, 'vendor', 'peerjs.min.js')):
        if p and os.path.isfile(p):
            with open(p, encoding='utf-8') as f:
                return f.read()
    return None


def ornek_dizini():
    """three r128 'examples/js' (GLTFLoader, GLTFExporter). THREE_EXAMPLES ya da THREE_JS yanındaki node_modules/three/examples/js."""
    for p in (os.environ.get('THREE_EXAMPLES'),
              os.path.join(os.path.dirname(os.path.dirname(os.environ.get('THREE_JS', ''))), 'examples', 'js') if os.environ.get('THREE_JS') else None,
              os.path.join(ROOT, 'node_modules', 'three', 'examples', 'js')):
        if p and os.path.isdir(p):
            return p
    return None


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


def yonlendirici(sabit_uuid=False):
    """three.js'i yerel kopyadan verir, Google Fonts isteklerini boş yanıtlar.
    sabit_uuid: THREE nesne kimliği (UUID) Math.random yerine sayaçtan gelir. Aksi halde model ayrıntısı
    (nesne sayısı) tek kişilik altın testin rastgele sayı akışını kaydırır."""
    three = three_source()
    if three and sabit_uuid:
        three, n = re.subn(r'function ct\(\)\{const t=4294967295\*Math\.random\(\)\|0.*?toUpperCase\(\)\}', 'function ct(){window.__uuidN=(window.__uuidN||0)+1;return"U"+window.__uuidN}', three, count=1, flags=re.S)
        if n != 1:
            raise SystemExit('three.min.js içinde generateUUID bulunamadı (sabit_uuid için)')
    peer = peer_source()

    ornek = ornek_dizini()

    def route(r):
        u = r.request.url
        if ornek and 'three@0.128.0/examples/js/' in u:
            yol = os.path.join(ornek, u.split('examples/js/')[1].split('?')[0])
            if os.path.isfile(yol):
                with open(yol, encoding='utf-8') as f:
                    r.fulfill(status=200, content_type='application/javascript', body=f.read())
                return
        if three and 'three.min.js' in u:
            r.fulfill(status=200, content_type='application/javascript', body=three)
        elif peer and 'peerjs' in u and u.endswith('.js'):
            r.fulfill(status=200, content_type='application/javascript', body=peer)
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
