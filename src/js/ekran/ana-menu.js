// ── Ana menü yardımcıları (v1.76) ──
// DEVAM ET → Kışla (ana üs). Hikaye ayrı bir düğme: aynı yere iki yol açılmaz.
function menuDevam(){haritayaGir('kisla');}
function menuProfilGuncelle(){
  try{
    const p=SAVE.profil||{};
    const av=document.getElementById('mpAv'),ad=document.getElementById('mpAd'),sv=document.getElementById('mpSv'),dv=document.getElementById('mDevamAlt');
    if(av)av.textContent=p.avatar||'🪖';
    if(ad)ad.textContent=p.ad||'Yeniçeri';
    if(sv)sv.textContent=(typeof getFameTitle==='function'?getFameTitle():'')||'';
    if(dv){dv.textContent='Kışla · Sv '+(SAVE.level||1);}
  }catch(e){}
}
function nasilAc(){
  const sat=NASIL_METIN.split('\n').map(function(l){const i=l.indexOf(' → ');return i<0?'<div class="toggleSub">'+l+'</div>':'<div class="toggleRow"><div class="toggleLabel">'+l.slice(0,i)+'</div><div class="toggleSub" style="font-size:12px">'+l.slice(i+3)+'</div></div>';}).join('');
  document.getElementById('nasilPanel').innerHTML='<div class="ovHead"><div class="panTitle">📜 NASIL OYNANIR</div><button class="zmX" onclick="nasilKapat()" aria-label="Geri">✕</button></div><div class="ovBody">'+sat+'</div><div class="ovFoot"><button class="panBtn" onclick="nasilKapat()">← Geri</button></div>';
  document.getElementById('nasilBox').style.display='flex';
}
function nasilKapat(){document.getElementById('nasilBox').style.display='none';}
const NASIL_METIN='WASD / Joystick → Hareket\nShift / 🏃 → Koşma\nFare / ⚔ → Saldır\n1/2/3 → Silah seç\nE / Kapı → Bölgeye Gir\nKışlada Demir Kapı → Göreve Çık\nEsc → Duraklat';
function atolyeAc(){
  const b=document.getElementById('atolyeBox'),p=document.getElementById('atolyePanel');
  p.innerHTML='<div class="ovHead"><div class="panTitle">🛠 ATÖLYE</div><button class="zmX" onclick="atolyeKapat()">✕</button></div><div class="ovBody" style="display:flex;flex-direction:column;gap:8px"><button class="mBtn" onclick="atolyeKapat();kutuphaneAc()">📚 MODEL KÜTÜPHANESİ</button><button class="mBtn" onclick="atolyeKapat();openMapEditor()">🗺 HARİTA EDİTÖRÜ</button></div>';
  b.style.display='flex';
}
function atolyeKapat(){document.getElementById('atolyeBox').style.display='none';}
