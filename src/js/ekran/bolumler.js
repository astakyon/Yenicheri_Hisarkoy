// ═══════════════════════════════════════════════════════
// BÖLÜMLER (Chapters) — ana menüden açılır, bölge kilidi/seçimi
// ═══════════════════════════════════════════════════════
const WORLD_MAPS=[
  {id:'kisla',name:'Hisarköy Kışlası',icon:'🏰',desc:'Ana üs — geliştir, dinlen, hazırlan',unlocked:true,action:()=>{closeChapters();BEGIN('kisla');}},
  {id:'gorev', name:'Hisarköy Devriye',icon:'⚔',desc:'Haydutlara karşı savaş, akçe kazan',unlocked:true,action:()=>{closeChapters();BEGIN('gorev');}},
  {id:'orman', name:'Av Ormanı',      icon:'🏹',desc:'Hayvan avla, deri ve et kazan',unlockKey:'orman',action:()=>{closeChapters();BEGIN('orman');}},
  {id:'maden', name:'Demir Madeni',   icon:'⛏', desc:'Metal ve nadir maden topla, tuzaklara dikkat et',unlockKey:'maden',action:()=>{closeChapters();BEGIN('maden');}},
  {id:'tarim', name:'Tarım Ovası',    icon:'🌾',desc:'Köylüleri eşkıyalardan koru, tahıl topla',unlockKey:'tarim',action:()=>{closeChapters();BEGIN('tarim');}},
  {id:'sehir', name:'Yabancı Şehir',  icon:'🏙',desc:'Tehlikeli sokaklarda düzen sağla',unlocked:false,desc2:'Yakında açılacak'},
  {id:'saray', name:'Osmanlı Sarayı', icon:'👑',desc:'Son görev — Hain Veziri durdur',unlocked:false,desc2:'Yakında açılacak'},
];
// unlockKey'i olan haritalar SAVE.mapsUnlocked'tan canlı okunur
function isMapUnlocked(m){return m.unlockKey?!!(SAVE.mapsUnlocked&&SAVE.mapsUnlocked[m.unlockKey]):m.unlocked;}

function openChapters(){
  buildWorldMapGrid();
  document.getElementById('worldMapBox').style.display='flex';
}
function closeChapters(){
  document.getElementById('worldMapBox').style.display='none';
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
      <div class="wmDesc">${unlocked?m.desc:(m.desc2||'Kilitli')}</div>
      ${isCurrent?'<span class="wmBadge you">📍 BURADASIN</span>':''}
      ${!unlocked?'<span class="wmBadge lock">🔒 KİLİTLİ</span>':''}
    `;
    if(unlocked&&m.action)card.onclick=m.action;
    grid.appendChild(card);
  });
}

