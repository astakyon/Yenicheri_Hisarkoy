// ═══════════════════════════════════════════════════════
// UYGULAMA OLARAK YÜKLEME (PWA) VE ÇEVRİMDIŞI ÖNBELLEK
// Android Chrome'da ana menüde "⬇ UYGULAMAYI YÜKLE" görünür; yüklenince tam ekran, uygulama gibi açılır.
// Aynı sayfa Google Play'e TWA ile paketlenir (docs/ANDROID.md).
// ═══════════════════════════════════════════════════════
let kurulumOlayi=null;
function uygulamaIcindeMi(){
  return (window.matchMedia&&(matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches))||navigator.standalone===true||/[?&]src=app/.test(location.search);
}
function kurulumDugmesiniGuncelle(){
  const b=document.getElementById('btnInstall');
  if(b)b.style.display=(kurulumOlayi&&!uygulamaIcindeMi())?'':'none';
}
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();kurulumOlayi=e;kurulumDugmesiniGuncelle();});
window.addEventListener('appinstalled',function(){kurulumOlayi=null;kurulumDugmesiniGuncelle();});
function installApp(){
  if(!kurulumOlayi)return;
  kurulumOlayi.prompt();
  kurulumOlayi.userChoice.then(function(){kurulumOlayi=null;kurulumDugmesiniGuncelle();}).catch(function(){});
}
try{
  // Servis çalışanı yalnızca güvenli adreste (https) ve yerel denemede çalışır; sürüm değişince önbellek yenilenir
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))
    navigator.serviceWorker.register('sw.js?v='+encodeURIComponent(document.querySelector('meta[name="game-version"]').content)).catch(function(){});
}catch(e){}
