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
  {k:'borkTip',ad:'Başlık',sec:[['klasik','Börk'],['kisa','Kısa börk'],['sarik','Sarık'],['fes','Fes']]}
];
const GORUNUM_ESYA=[['yatagan','Yatağan'],['hancer','Hançer'],['kayis','Kayışlar'],['tufek','Tüfek']];
function _hex6(n){return '#'+('000000'+n.toString(16)).slice(-6);}
let GORUNUM_SEKME='giysi';
const GORUNUM_SEKMELER=[
  {k:'giysi',ad:'KIYAFET',renk:['gov','yaka','dugme']},
  {k:'kemer',ad:'KEMER',renk:['sash','toka','sal']},
  {k:'bork',ad:'BAŞLIK',tip:['borkTip'],renk:['bork','kasik']},
  {k:'yuz',ad:'YÜZ',tip:['biyikTip'],renk:['biyik']},
  {k:'esya',ad:'EKİPMAN',esya:true}
];
function gorunumSekme(k){GORUNUM_SEKME=k;gorunumCiz();}
function gorunumCiz(){
  const g=gorunumOku(),ic=document.getElementById('gorunumIc'),tb=document.getElementById('gorunumTabs');if(!ic)return;
  if(tb)tb.innerHTML=GORUNUM_SEKMELER.map(function(t){return '<button class="gTab'+(t.k===GORUNUM_SEKME?' on':'')+'" onclick="gorunumSekme(\''+t.k+'\')">'+t.ad+'</button>';}).join('');
  const t=GORUNUM_SEKMELER.find(function(x){return x.k===GORUNUM_SEKME;})||GORUNUM_SEKMELER[0];
  let h='';
  if(t.esya){
    h+='<div class="gEsya">';
    GORUNUM_ESYA.forEach(function(e){const a=g[e[0]]!==false;h+='<button class="gCard'+(a?' on':'')+'" onclick="gorunumDegis(\''+e[0]+'\','+(!a)+')"><b>'+e[1]+'</b><small>'+(a?'Takılı':'Çıkarıldı')+'</small></button>';});
    h+='</div>';
  }
  (t.tip||[]).forEach(function(k){
    const T=GORUNUM_TIPLER.find(function(x){return x.k===k;});
    h+='<div class="gLbl">'+T.ad+' TİPİ</div><div class="gChips">';
    T.sec.forEach(function(o){h+='<button class="gChip'+(g[T.k]===o[0]?' on':'')+'" onclick="gorunumDegis(\''+T.k+'\',\''+o[0]+'\')">'+o[1]+'</button>';});
    h+='</div>';
  });
  (t.renk||[]).forEach(function(k){
    const r=GORUNUM_SATIRLAR.find(function(x){return x.k===k;});
    h+='<div class="gLbl">'+r.ad.toUpperCase()+'</div><div class="gSw">';
    r.renk.forEach(function(c){h+='<button aria-label="'+_hex6(c)+'" class="'+(g[r.k]===c?'on':'')+'" onclick="gorunumDegis(\''+r.k+'\','+c+')" style="background:'+_hex6(c)+'"></button>';});
    h+='</div>';
  });
  ic.innerHTML=h;
}
function gorunumAc(){const ml=document.getElementById('menuLayer');if(ml)ml.classList.add('gOpen');document.getElementById('gorunumBox').style.display='flex';HERO.manuel=HERO.g?HERO.g.rotation.y:-.5;gorunumCiz();}
function gorunumKapat(){const ml=document.getElementById('menuLayer');if(ml)ml.classList.remove('gOpen');document.getElementById('gorunumBox').style.display='none';HERO.manuel=null;if(typeof kariyerDon==='function')kariyerDon();}
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
