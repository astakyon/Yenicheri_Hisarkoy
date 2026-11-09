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
  showDlg('📜 Nasıl Oynanır',NASIL_METIN,'Anlaşıldı!',hideDlg);
}
const NASIL_METIN='WASD / Joystick → Hareket\nShift / 🏃 → Koşma\nFare / ⚔ → Saldır\n1/2/3 → Silah seç\nE / Kapı → Bölgeye Gir\nKışlada Demir Kapı → Göreve Çık\nEsc → Duraklat';
function atolyeAc(){
  const b=document.getElementById('atolyeBox'),p=document.getElementById('atolyePanel');
  p.innerHTML='<div class="ovHead"><div class="panTitle">🛠 ATÖLYE</div><button class="zmX" onclick="atolyeKapat()">✕</button></div><div class="ovBody" style="display:flex;flex-direction:column;gap:8px"><button class="mBtn" onclick="atolyeKapat();kutuphaneAc()">📚 MODEL KÜTÜPHANESİ</button><button class="mBtn" onclick="atolyeKapat();openMapEditor()">🗺 HARİTA EDİTÖRÜ</button></div>';
  b.style.display='flex';
}
function atolyeKapat(){document.getElementById('atolyeBox').style.display='none';}
