// ═══════════════════════════════════════════════════════
// FAZ 3 — XP / LEVEL / SINIF / ÜN SİSTEMİ
// ═══════════════════════════════════════════════════════

// ── Ün unvanları ──
const FAME_TITLES=[
  {min:0,    title:'Acemi Yeniçeri'},
  {min:50,   title:'Asker'},
  {min:150,  title:'Onbaşı'},
  {min:400,  title:'Bölükbaşı'},
  {min:900,  title:'Çorbacı'},
  {min:2000, title:'Ağa'},
  {min:4000, title:'Yeniçeri Ağası'},
];
function getFameTitle(){
  for(let i=FAME_TITLES.length-1;i>=0;i--){if((SAVE.fame||0)>=FAME_TITLES[i].min)return FAME_TITLES[i].title;}
  return FAME_TITLES[0].title;
}

// ── Sınıf bonusları ──
const CLASS_BONUS={
  yenicheri:{name:'Yeniçeri',icon:'🗡',hpMult:1.15,spdMult:1.15,dmgMult:1.15},
  sipahi:   {name:'Sipahi',  icon:'🏇',hpMult:1.0, spdMult:1.30,dmgMult:1.20},
  akinci:   {name:'Akıncı', icon:'🏹',hpMult:1.0, spdMult:1.20,dmgMult:1.40},
  azap:     {name:'Azap',   icon:'🛡',hpMult:1.50,spdMult:1.0, dmgMult:1.0 },
};
function getClassMult(type){
  const c=CLASS_BONUS[SAVE.class];if(!c)return 1;return c[type]||1;
}

// ── XP Ekle ──
function addXP(amount){
  SAVE.xp+=amount;
  SAVE.stats.totalXp=(SAVE.stats.totalXp||0)+amount;
  while(SAVE.xp>=SAVE.xpNext){
    SAVE.xp-=SAVE.xpNext;
    SAVE.level++;
    SAVE.xpNext=Math.floor(SAVE.xpNext*1.5);
    onLevelUp(SAVE.level);
  }
  saveGame();
  updateXPHud();
}

function onLevelUp(lvl){
  // Her level: +5 can, +2 enerji
  SAVE.maxHpBonus=(SAVE.maxHpBonus||0)+5;
  SAVE.maxEnBonus=(SAVE.maxEnBonus||0)+2;
  // Level 10: sınıf seçimi
  if(lvl===10&&!SAVE.class){
    setTimeout(()=>{
      playing=false;
      document.getElementById('classBox').style.display='flex';
    },500);
  }
  checkAchievements('level');
  // Level atla animasyonu
  showLevelUpAnn(lvl);
  lootPop('Level '+lvl+'! 🎖 +5 Can +2 Enerji');
  pl.maxHp=getBaseMaxHp();pl.maxEn=getBaseMaxEn();
  pl.hp=Math.min(pl.hp+5,pl.maxHp);
}

function showLevelUpAnn(lvl){
  const el=document.getElementById('levelUpAnn');
  el.innerHTML='🎖 LEVEL '+lvl+'!<br><span style="font-size:10px;color:#aaa;">'+getFameTitle()+'</span>';
  el.style.display='block';
  setTimeout(()=>el.style.display='none',2500);
}

// ── Ün Ekle ──
function addFame(n){
  SAVE.fame=(SAVE.fame||0)+n;
  saveGame();
  updateCharHud();
}

// ── HUD Güncelle ──
function updateXPHud(){
  const pct=SAVE.xpNext>0?Math.min(SAVE.xp/SAVE.xpNext*100,100):0;
  const xpf=document.getElementById('xpf');if(xpf)xpf.style.width=pct+'%';
  const xpn=document.getElementById('xpn');if(xpn)xpn.textContent=SAVE.xp+'/'+SAVE.xpNext;
  updateCharHud();
}
function updateCharHud(){
  const lvl=document.getElementById('cnameLevel');if(lvl)lvl.textContent='Sv.'+SAVE.level;
  const ttl=document.getElementById('cnameTitle');if(ttl){
    const cls=CLASS_BONUS[SAVE.class];
    ttl.textContent=(cls?cls.icon+' ':'')+getFameTitle();
  }
}

// ── Sınıf seç ──
function selectClass(cls){
  SAVE.class=cls;saveGame();
  document.getElementById('classBox').style.display='none';
  const c=CLASS_BONUS[cls];
  pl.maxHp=getBaseMaxHp();pl.maxEn=getBaseMaxEn();
  pl.hp=pl.maxHp;
  lootPop(c.icon+' '+c.name+' sınıfı seçildi!');
  updateCharHud();
  checkSpecialAchievement('class_select');
  if(currentMap==='kisla')playing=true;
}

// ── Karakter paneli ──
function openCharPanel(){
  if(!playing&&!paused)return;
  playing=false;
  const cls=CLASS_BONUS[SAVE.class];
  const fame=SAVE.fame||0;
  const fameNext=FAME_TITLES.find(f=>f.min>fame);
  document.getElementById('charUnvan').textContent=getFameTitle()+(cls?' — '+cls.name+' '+cls.icon:'');
  document.getElementById('charStats').innerHTML=`
    <div class="statRow"><span>Level</span><span class="statVal">${SAVE.level}</span></div>
    <div class="statRow"><span>XP</span><span class="statVal">${SAVE.xp} / ${SAVE.xpNext}</span></div>
    <div class="statRow"><span>Ün</span><span class="statVal">${fame}${fameNext?' / '+fameNext.min:' (MAX)'}</span></div>
    <div class="divider"></div>
    <div class="statRow"><span>Max Can</span><span class="statVal">${getBaseMaxHp()}</span></div>
    <div class="statRow"><span>Max Enerji</span><span class="statVal">${getBaseMaxEn()}</span></div>
    <div class="statRow"><span>Hareket Hızı</span><span class="statVal">${getBaseSpd().toFixed(1)}</span></div>
    <div class="statRow"><span>Zırh</span><span class="statVal">${({none:'Yok',leather:'Deri',chain:'Zincir',plate:'Plaka',ottoman:'Osmanlı'}[SAVE.armor]||'Yok')}</span></div>
    <div class="divider"></div>
    <div class="statRow"><span>Toplam Öldürme</span><span class="statVal">${SAVE.stats.kills||0}</span></div>
    <div class="statRow"><span>Boss Öldürme</span><span class="statVal">${SAVE.stats.bossKills||0}</span></div>
    <div class="statRow"><span>En Yüksek Dalga</span><span class="statVal">${SAVE.stats.highWave||0}</span></div>
    <div class="statRow"><span>Toplam XP</span><span class="statVal">${SAVE.stats.totalXp||0}</span></div>
  `;
  document.getElementById('charBox').style.display='flex';
}

