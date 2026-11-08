// ═══════════════════════════════════════════════════════
// ÇİFTLİK — envanter, pazar ve sandık panelleri (v1.69)
// Çanta: toplanan ürün (en çok CIFTLIK_CANTA adet) + tohum. Sandık: sınırsız depo.
// ═══════════════════════════════════════════════════════
const CIFTLIK_CANTA=24;
let ciftlikPanelTur=null;   // 'pazar' | 'sandik' | null
function ciftlikCantaDolu(c){return CIFTLIK_SIRA.reduce(function(a,k){return a+c.depo[k];},0);}
function ciftlikPanelDiv(){
  let d=document.getElementById('ciftlikPanel');
  if(!d){
    d=document.createElement('div');d.id='ciftlikPanel';
    d.style.cssText='display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:23;width:min(460px,94vw);max-height:calc(100dvh - 16px);overflow-y:auto;background:rgba(20,14,8,.95);border:2px solid #b8923a;border-radius:10px;padding:10px 12px;color:#f0e0b8;font-family:Cinzel,serif;font-size:13px;touch-action:pan-y;';
    d.addEventListener('click',function(e){const b=e.target.closest('[data-a]');if(b)ciftlikPanelEylem(b.getAttribute('data-a'),b.getAttribute('data-k'));});
    d.addEventListener('touchstart',function(e){e.stopPropagation();},{passive:true});
    document.body.appendChild(d);
  }
  return d;
}
function ciftlikPanelAc(tur){ciftlikPanelTur=tur;ciftlikPanelCiz();ciftlikPanelDiv().style.display='block';}
function ciftlikPanelKapat(){ciftlikPanelTur=null;const d=document.getElementById('ciftlikPanel');if(d)d.style.display='none';}
function ciftlikPanelCiz(){
  if(!ciftlikPanelTur)return;
  const c=ciftlikHazirla(),d=ciftlikPanelDiv(),B='style="padding:5px 9px;margin:0 2px;border:1px solid #b8923a;border-radius:6px;background:#3a2a10;color:#f0e0b8;cursor:pointer;font-family:inherit;font-size:12px"';
  let h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:15px;color:#E8C060">'+(ciftlikPanelTur==='pazar'?'💰 PAZAR':'📦 SANDIK')+'</b><span>💰 '+mainGold+' akçe</span><button class="zmX" data-a="kapat">✕</button></div>';
  h+='<div style="opacity:.8;margin-bottom:6px">🎒 Çanta: '+ciftlikCantaDolu(c)+' / '+CIFTLIK_CANTA+' ürün</div>';
  if(ciftlikPanelTur==='pazar'){
    h+='<div style="color:#E8C060;margin:4px 0">🌰 Tohum al</div>';
    CIFTLIK_SIRA.forEach(function(k){const e=CIFTLIK_EKIN[k];
      h+='<div style="display:flex;align-items:center;justify-content:space-between;margin:3px 0"><span>'+e.simge+' '+e.ad+' <small>('+e.sure+' sn, satış '+e.deger+')</small> — çantada '+c.tohum[k]+'</span><span><button '+B+' data-a="al1" data-k="'+k+'">+1 · '+e.tohum+'</button><button '+B+' data-a="al5" data-k="'+k+'">+5 · '+e.tohum*5+'</button></span></div>';});
    h+='<div style="color:#E8C060;margin:8px 0 4px">💰 Ürün sat</div>';
    let top=0;
    CIFTLIK_SIRA.forEach(function(k){const e=CIFTLIK_EKIN[k];top+=c.depo[k]*e.deger;
      h+='<div style="display:flex;align-items:center;justify-content:space-between;margin:3px 0"><span>'+e.simge+' '+e.ad+' × '+c.depo[k]+' <small>(her biri '+e.deger+')</small></span><button '+B+' data-a="sat" data-k="'+k+'">Sat</button></div>';});
    h+='<div style="margin-top:6px"><button '+B+' data-a="hepsat">Hepsini sat (+'+top+')</button></div>';
    const lv=c.sulama||0;
    h+='<div style="color:#E8C060;margin:8px 0 4px">💧 Sulama sistemi</div><div style="display:flex;justify-content:space-between;align-items:center"><span>Seviye '+lv+' / 3 — ekin büyümesi %'+lv*15+' hızlı</span>'+(lv<3?'<button '+B+' data-a="sulama">Yükselt · '+ciftlikSulamaFiyat(lv)+'</button>':'<span>✔ en üst</span>')+'</div>';
  }else{
    const s=c.sandik;
    h+='<div style="display:grid;grid-template-columns:1fr auto auto;gap:3px 6px;align-items:center">';
    h+='<b>Ürün</b><b>🎒 Çanta</b><b>📦 Sandık</b>';
    CIFTLIK_SIRA.forEach(function(k){const e=CIFTLIK_EKIN[k];
      h+='<span>'+e.simge+' '+e.ad+'</span><span><button '+B+' data-a="sandigaUrun" data-k="'+k+'">'+c.depo[k]+' ▶</button></span><span><button '+B+' data-a="cantayaUrun" data-k="'+k+'">◀ '+s.depo[k]+'</button></span>';});
    CIFTLIK_SIRA.forEach(function(k){const e=CIFTLIK_EKIN[k];
      h+='<span>🌰 '+e.ad+' tohumu</span><span><button '+B+' data-a="sandigaTohum" data-k="'+k+'">'+c.tohum[k]+' ▶</button></span><span><button '+B+' data-a="cantayaTohum" data-k="'+k+'">◀ '+s.tohum[k]+'</button></span>';});
    h+='</div><div style="opacity:.7;margin-top:6px;font-size:11px">Düğmeye basınca 1 adet taşınır (Shift/uzun basma gerekmez).</div>';
  }
  d.innerHTML=h;
}
function ciftlikPanelEylem(a,k){
  const c=ciftlikHazirla();
  if(a==='kapat'){ciftlikPanelKapat();return;}
  if(a==='al1'||a==='al5'){
    const n=a==='al5'?5:1,fy=CIFTLIK_EKIN[k].tohum*n;
    if(mainGold<fy){lootPop('Yetersiz akçe ('+fy+' gerek)');return;}
    ciftlikAltin(-fy);c.tohum[k]+=n;saveGame();
  }else if(a==='sat'){
    const n=c.depo[k];if(!n){lootPop('Çantada satacak '+CIFTLIK_EKIN[k].ad+' yok');return;}
    const t=n*CIFTLIK_EKIN[k].deger;c.depo[k]=0;ciftlikAltin(t);SAVE.stats.satis=(SAVE.stats.satis||0)+t;saveGame();lootPop('💰 +'+t+' Akçe');
  }else if(a==='hepsat'){ciftlikSat();}
  else if(a==='sulama'){
    const lv=c.sulama||0,fy=ciftlikSulamaFiyat(lv);
    if(lv>=3)return;if(mainGold<fy){lootPop('Sulama için '+fy+' akçe gerek');return;}
    ciftlikAltin(-fy);c.sulama=lv+1;saveGame();lootPop('💧 Sulama Sv '+c.sulama);
  }else if(a==='sandigaUrun'){if(c.depo[k]>0){c.depo[k]--;c.sandik.depo[k]++;saveGame();}}
  else if(a==='cantayaUrun'){
    if(c.sandik.depo[k]<=0){}else if(ciftlikCantaDolu(c)>=CIFTLIK_CANTA)lootPop('Çanta dolu');else{c.sandik.depo[k]--;c.depo[k]++;saveGame();}
  }
  else if(a==='sandigaTohum'){if(c.tohum[k]>0){c.tohum[k]--;c.sandik.tohum[k]++;saveGame();}}
  else if(a==='cantayaTohum'){if(c.sandik.tohum[k]>0){c.sandik.tohum[k]--;c.tohum[k]++;saveGame();}}
  ciftlikPanelCiz();
}
