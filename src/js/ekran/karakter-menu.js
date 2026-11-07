// ═══════════════════════════════════════════════════════
// KARAKTER ÖZELLEŞTİRME (v1.62) — renkler, bıyık ve börk tipi; SAVE.gorunum'a kaydedilir
// ═══════════════════════════════════════════════════════
const GORUNUM_SATIRLAR=[
  {k:'gov',ad:'Kıyafet',renk:[0x9B2020,0x1F5FA8,0x2E7D32,0x6A1B9A,0x1a1a1a,0xB8860B,0x6D4C41,0x00796B]},
  {k:'sash',ad:'Kemer (kuşak)',renk:[0x2a3f8a,0x8B1818,0x2E7D32,0x1a1a1a,0xD4A82A,0x6A1B9A,0xEFE6CE,0x6D4C41]},
  {k:'sal',ad:'Şalvar',renk:[0x2a3f8a,0x8B1818,0x1a1a1a,0x2E7D32,0x6D4C41,0x6A1B9A,0xEFE6CE,0x455A64]},
  {k:'yaka',ad:'Yaka ve şerit',renk:[0xD4A82A,0xC0C0C8,0x8B1818,0x1F5FA8,0x2E7D32,0xEFE6CE,0x1a1a1a,0xB87333]},
  {k:'dugme',ad:'Düğme',renk:[0xD4A82A,0xC0C0C8,0x8B1818,0x1F5FA8,0x2E7D32,0xEFE6CE,0x1a1a1a,0xB87333]},
  {k:'toka',ad:'Kemer tokası',renk:[0xD4A82A,0xC0C0C8,0xB87333,0x1a1a1a,0x8B1818,0x1F5FA8,0x2E7D32,0xEFE6CE]},
  {k:'bork',ad:'Börk',renk:[0xE8DCC0,0xFFFFFF,0xB02020,0x1F5FA8,0x2E7D32,0x3a2a1a,0x1a1a1a,0xD4A82A]},
  {k:'kasik',ad:'Kaşık',renk:[0xC8C8CC,0xD4A82A,0xB87333,0x3a2a1a,0xFFFFFF,0x8B1818,0x1F5FA8,0x1a1a1a]},
  {k:'biyik',ad:'Bıyık / sakal rengi',renk:[0x3a2000,0x1a1008,0x6a4a1a,0x9a6a2a,0xB0B0B0,0xE8E8E8,0x8B1818,0xC8941C]}
];
const GORUNUM_TIPLER=[
  {k:'biyikTip',ad:'Bıyık',sec:[['yok','Yok'],['klasik','Klasik'],['kalin','Kalın'],['sivri','Sivri uçlu'],['uzun','Uzun sarkık'],['sakal','Sakallı']]},
  {k:'kemer',ad:'Kemer silahı (yatağan belde, hançer kuşakta)',sec:[['ikisi','Yatağan + Hançer'],['yatagan','Yatağan'],['hancer','Hançer'],['yok','Yok']]},
  {k:'borkTip',ad:'Başlık',sec:[['klasik','Börk'],['kisa','Kısa börk'],['sarik','Sarık'],['fes','Fes']]}
];
function _hex6(n){return '#'+('000000'+n.toString(16)).slice(-6);}
function gorunumCiz(){
  const g=gorunumOku(),ic=document.getElementById('gorunumIc');if(!ic)return;
  let h='';
  GORUNUM_TIPLER.forEach(function(t){
    h+='<div class="toggleLabel" style="margin:8px 0 4px">'+t.ad+'</div><div style="display:flex;flex-wrap:wrap;gap:5px">';
    t.sec.forEach(function(o){h+='<button class="panBtn'+(g[t.k]===o[0]?' grn':'')+'" style="width:auto;margin:0;padding:6px 10px" onclick="gorunumDegis(\''+t.k+'\',\''+o[0]+'\')">'+o[1]+'</button>';});
    h+='</div>';
  });
  GORUNUM_SATIRLAR.forEach(function(r){
    h+='<div class="toggleLabel" style="margin:10px 0 4px">'+r.ad+'</div><div style="display:flex;flex-wrap:wrap;gap:6px">';
    r.renk.forEach(function(c){h+='<button aria-label="'+_hex6(c)+'" onclick="gorunumDegis(\''+r.k+'\','+c+')" style="width:32px;height:32px;border-radius:50%;cursor:pointer;background:'+_hex6(c)+';border:3px solid '+(g[r.k]===c?'#FFD24A':'#4a3410')+'"></button>';});
    h+='</div>';
  });
  ic.innerHTML=h;
}
function gorunumAc(){document.getElementById('gorunumBox').style.display='flex';HERO.manuel=HERO.g?HERO.g.rotation.y:-.5;gorunumCiz();}
function gorunumKapat(){document.getElementById('gorunumBox').style.display='none';HERO.manuel=null;}
// Panelin dışında (boş alanda) sürükleyerek karakteri istediğin yöne döndür
(function(){
  const kutu=document.getElementById('gorunumBox');if(!kutu)return;let x0=null;
  kutu.addEventListener('pointerdown',function(e){if(e.target.closest('#gorunumPanel'))return;x0=e.clientX;try{kutu.setPointerCapture(e.pointerId);}catch(_){}});
  kutu.addEventListener('pointermove',function(e){if(x0===null)return;HERO.manuel=(HERO.manuel||0)+(e.clientX-x0)*.012;x0=e.clientX;});
  const bit=function(){x0=null;};kutu.addEventListener('pointerup',bit);kutu.addEventListener('pointercancel',bit);
})();
function gorunumYenile(){
  if(typeof HERO!=='undefined'&&HERO.s&&HERO.g){HERO.s.remove(HERO.g);HERO.g=modelYap('yeniceri');HERO.s.add(HERO.g);}
}
function gorunumDegis(k,v){
  SAVE.gorunum=Object.assign(gorunumOku(),{[k]:v});saveGame();gorunumCiz();gorunumYenile();
}
function gorunumSifirla(){SAVE.gorunum=null;saveGame();gorunumCiz();gorunumYenile();}
