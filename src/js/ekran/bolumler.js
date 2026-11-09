// ═══════════════════════════════════════════════════════
// BÖLÜMLER (Chapters) — ana menüden açılır, bölge kilidi/seçimi
// ═══════════════════════════════════════════════════════
const WORLD_MAPS=[
  {id:'kisla',name:'Hisarköy Kışlası',icon:'🏰',desc:'Ana üs — geliştir, dinlen, hazırlan',unlocked:true,action:()=>{haritayaGir('kisla');}},
  {id:'gorev', name:'Hisarköy Devriye',icon:'⚔',desc:'Haydutlara karşı savaş, akçe kazan',unlocked:true,action:()=>{haritayaGir('gorev');}},
  {id:'orman', name:'Av Ormanı',      icon:'🏹',desc:'Hayvan avla, deri ve et kazan',unlockKey:'orman',action:()=>{haritayaGir('orman');}},
  {id:'maden', name:'Demir Madeni',   icon:'⛏', desc:'Metal ve nadir maden topla, tuzaklara dikkat et',unlockKey:'maden',action:()=>{haritayaGir('maden');}},
  {id:'ciftlik', name:'Çiftlik',        icon:'🌱',desc:'Ekin ek, büyüt, biç ve pazarda sat',unlockKey:'ciftlik',action:()=>{haritayaGir('ciftlik');}},
  {id:'tarim', name:'Tarım Ovası',    icon:'🌾',desc:'Köylüleri eşkıyalardan koru, tahıl topla',unlockKey:'tarim',action:()=>{haritayaGir('tarim');}},
  {id:'sehir', name:'Yabancı Şehir',  icon:'🏙',desc:'Tehlikeli sokaklarda düzen sağla',unlockKey:'sehir',action:()=>{haritayaGir('sehir');}},
  {id:'saray', name:'Osmanlı Sarayı', icon:'👑',desc:'Son görev — Hain Veziri durdur',unlockKey:'saray',action:()=>{haritayaGir('saray');}},
];
// unlockKey'i olan haritalar SAVE.mapsUnlocked'tan canlı okunur
// v1.81: haritalar karakter seviyesine göre açılır (HARITA_SV); Kariyer ekranında listelenir
const HARITA_SV={kisla:1,gorev:1,orman:2,maden:3,tarim:4,ciftlik:4,sehir:6,saray:8};
function haritaSv(id){return HARITA_SV[id]||1;}
function isMapUnlocked(m){return (SAVE.level||1)>=haritaSv(m.id);}
// Oyuncu yolundan haritaya giriş (kilit denetimiyle)
function haritayaGir(id){
  if((SAVE.level||1)<haritaSv(id)){const m=WORLD_MAPS.find(function(x){return x.id===id;});lootPop('🔒 '+(m?m.name:id)+' için Sv '+haritaSv(id)+' gerekli (şu an Sv '+(SAVE.level||1)+')');return false;}
  ['worldMapBox','kariyerBox','hikayeBox'].forEach(function(b){const e=document.getElementById(b);if(e)e.style.display='none';});
  KARIYER_DON=false;BEGIN(id);return true;
}

function openChapters(){
  buildWorldMapGrid();
  document.getElementById('worldMapBox').style.display='flex';
}
function closeChapters(){
  document.getElementById('worldMapBox').style.display='none';
  if(typeof kariyerDon==='function')kariyerDon();
}

function buildWorldMapGrid(){
  const grid=document.getElementById('wmGrid');
  if(!grid)return;
  grid.innerHTML='';
  WORLD_MAPS.forEach(function(m){
    const unlocked=isMapUnlocked(m);
    const isCurrent=playing&&currentMap===m.id;
    const cls=isCurrent?'current':(unlocked?'unlocked':'locked');
    const card=document.createElement('div');
    card.className='wmCard '+cls;
    card.innerHTML=`
      <div class="wmIcon">${m.icon}</div>
      <div class="wmName">${m.name}</div>
      <div class="wmDesc">${unlocked?m.desc:'Seviye '+haritaSv(m.id)+' olunca açılır'}</div>
      ${isCurrent?'<span class="wmBadge you">📍 BURADASIN</span>':''}
      ${!unlocked?'<span class="wmBadge lock">🔒 Sv '+haritaSv(m.id)+' GEREKLİ</span>':(haritaSv(m.id)>1?'<span class="wmBadge" style="background:#2a3a1a;color:#bfe59a">Önerilen Sv '+haritaSv(m.id)+'</span>':'')}
      ${hikayeRozet(m.id)}
    `;
    if(unlocked&&m.action)card.onclick=m.action;
    grid.appendChild(card);
  });
}


// Hikâye rozeti: haritanın bağlı olduğu perde (aktif / bitti)
function hikayeRozet(id){
  if(typeof HIKAYE==='undefined')return '';
  const p=HIKAYE.find(function(x){return x.harita===id;});
  if(!p)return '';
  const d=hikayePerdeDurum(p);
  if(d==='aktif')return '<span class="wmStory">📖 PERDE '+p.no+' — AKTİF</span>';
  if(d==='bitti')return '<span class="wmStory" style="opacity:.7">✔ PERDE '+p.no+'</span>';
  return '';
}
