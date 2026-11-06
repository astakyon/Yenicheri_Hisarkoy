// ═══════════════════════════════════════════════════════
// FAZ 4 — GÖREV & BAŞARI SİSTEMİ
// ═══════════════════════════════════════════════════════

// ── ANA HİKAYE GÖREVLERİ ──
const STORY_QUESTS=[
  // Bölüm 1
  {id:'s1q1',chapter:1,title:'İlk Devriye',
   desc:'Hisarköy\'de ilk devriyeni tamamla.',
   obj:'10 haydut öldür',
   type:'kills', target:10,
   reward:{gold:100,xp:150,fame:20},
   dialog:{
     start:'Komutan: "Yeni yeniçeri! Hisarköy\'ü haydutlar bastı. İlk görevin: 10 haydut bertaraf et!"',
     end:'Komutan: "Bravo asker! Hisarköy biraz daha güvende. İşte ödülün."'
   }
  },
  {id:'s1q2',chapter:1,title:'Haydut Lideri',
   desc:'Hisarköy\'ü yöneten haydut liderini öldür.',
   obj:'İlk Boss\'u öldür',
   type:'bossKills', target:1,
   reward:{gold:200,xp:300,fame:40},
   dialog:{
     start:'Muhbir: "Lider 5. dalgada çıkıyor. Onu öldür, haydutlar dağılır!"',
     end:'Halk: "Kahramanımız! Lider düştü, Hisarköy kurtuldu!"'
   }
  },
  {id:'s1q3',chapter:1,title:'Gece Baskını',
   desc:'5 dalga geç ve hayatta kal.',
   obj:'5 dalga tamamla',
   type:'waves', target:5,
   reward:{gold:300,xp:400,fame:60},
   dialog:{
     start:'İstihbarat: "Düşman gece baskını planlıyor. 5 dalga boyunca dayanmalısın!"',
     end:'Komutan: "Dayanıklılığın efsane olacak! Hisarköy seninle gurur duyuyor."'
   }
  },
  // Bölüm 2
  {id:'s2q1',chapter:2,title:'Tunç Nehri Geçidi',
   desc:'3 Boss öldür ve Hisarköy\'ü savun.',
   obj:'3 Boss öldür',
   type:'bossKills', target:3,
   reward:{gold:500,xp:600,fame:100},
   dialog:{
     start:'Vezir: "Tunç Nehri\'nden geçmeye çalışıyorlar. 3 komutanı durdur!"',
     end:'Vezir: "Olağanüstü! Nehir hattı tutuldu. Osmanlı\'ya hizmetin kayıt altına alındı."'
   }
  },
  {id:'s2q2',chapter:2,title:'Kervansaray Baskını',
   desc:'25 dalga geç.',
   obj:'25 dalga tamamla',
   type:'waves', target:25,
   reward:{gold:800,xp:1000,fame:150},
   dialog:{
     start:'Tüccar: "Kervansaray\'ımız haydutlara karşı korunsun! Uzun savaş seni bekliyor."',
     end:'Tüccar: "Yüce Allah razı olsun! Tüm mallarımız güvende."'
   }
  },
];

// ── YAN GÖREVLER ──
const SIDE_QUESTS=[
  {id:'sq1',title:'Temizlik Operasyonu',obj:'20 düşman öldür',type:'kills',target:20,reward:{gold:150,xp:100}},
  {id:'sq2',title:'Dayanıklılık Testi',obj:'10 dalga geç',type:'waves',target:10,reward:{gold:200,xp:150}},
  {id:'sq3',title:'Boss Avcısı',obj:'2 Boss öldür',type:'bossKills',target:2,reward:{gold:350,xp:250}},
  {id:'sq4',title:'Savaş Makinesi',obj:'50 düşman öldür',type:'kills',target:50,reward:{gold:300,xp:200}},
  {id:'sq5',title:'Efsane Savaşçı',obj:'100 düşman öldür',type:'kills',target:100,reward:{gold:600,xp:400}},
  {id:'sq6',title:'Reis Katili',obj:'5 Boss öldür',type:'bossKills',target:5,reward:{gold:750,xp:500}},
];

// ── GÜNLÜK GÖREVLER ──
const DAILY_POOL=[
  {id:'d1',title:'Günlük Devriye',obj:'5 düşman öldür',type:'kills',target:5,reward:{gold:80,xp:50}},
  {id:'d2',title:'Sabah Talimi',obj:'3 dalga geç',type:'waves',target:3,reward:{gold:60,xp:40}},
  {id:'d3',title:'Haydut Temizliği',obj:'15 düşman öldür',type:'kills',target:15,reward:{gold:120,xp:80}},
  {id:'d4',title:'Komutan Avı',obj:'1 Boss öldür',type:'bossKills',target:1,reward:{gold:200,xp:120}},
  {id:'d5',title:'Akçe Avcısı',obj:'10 dalga geç',type:'waves',target:10,reward:{gold:150,xp:100}},
  {id:'d6',title:'Kısa Devriye',obj:'8 düşman öldür',type:'kills',target:8,reward:{gold:100,xp:60}},
];

// ── BAŞARILAR ──
const ACHIEVEMENTS=[
  // Öldürme
  {id:'kills_10',   icon:'⚔', title:'İlk Kan',       desc:'10 düşman öldür',   type:'kills',     target:10,   reward:{gold:50,  xp:50}},
  {id:'kills_50',   icon:'⚔', title:'Savaşçı',       desc:'50 düşman öldür',   type:'kills',     target:50,   reward:{gold:100, xp:100}},
  {id:'kills_100',  icon:'⚔', title:'Kahraman',      desc:'100 düşman öldür',  type:'kills',     target:100,  reward:{gold:200, xp:200}},
  {id:'kills_500',  icon:'⚔', title:'Efsane',        desc:'500 düşman öldür',  type:'kills',     target:500,  reward:{gold:500, xp:500}},
  // Boss
  {id:'boss_1',     icon:'👑', title:'İlk Zafir',     desc:'1 Boss öldür',      type:'bossKills', target:1,    reward:{gold:100, xp:100}},
  {id:'boss_5',     icon:'👑', title:'Boss Avcısı',   desc:'5 Boss öldür',      type:'bossKills', target:5,    reward:{gold:300, xp:300}},
  {id:'boss_10',    icon:'👑', title:'Boss Katili',   desc:'10 Boss öldür',     type:'bossKills', target:10,   reward:{gold:600, xp:600}},
  // Dalga
  {id:'wave_5',     icon:'🌊', title:'İlk Fırtına',   desc:'5 dalga geç',       type:'waves',     target:5,    reward:{gold:80,  xp:80}},
  {id:'wave_10',    icon:'🌊', title:'Dalgakıran',    desc:'10 dalga geç',      type:'waves',     target:10,   reward:{gold:150, xp:150}},
  {id:'wave_25',    icon:'🌊', title:'Fırtına Efendisi',desc:'25 dalga geç',   type:'waves',     target:25,   reward:{gold:400, xp:400}},
  {id:'wave_50',    icon:'🌊', title:'Asla Durma',    desc:'50 dalga geç',      type:'waves',     target:50,   reward:{gold:800, xp:800}},
  // Level
  {id:'level_5',    icon:'🎖', title:'Tecrübeli',     desc:'Level 5 ol',         type:'level',     target:5,    reward:{gold:100, xp:0}},
  {id:'level_10',   icon:'🎖', title:'Usta Yeniçeri', desc:'Level 10 ol',        type:'level',     target:10,   reward:{gold:300, xp:0}},
  {id:'level_20',   icon:'🎖', title:'Efsane Komutan',desc:'Level 20 ol',       type:'level',     target:20,   reward:{gold:800, xp:0}},
  // Akçe
  {id:'gold_1000',  icon:'🪙', title:'Tasarrufçu',    desc:'1000 Akçe kazan',   type:'totalGold', target:1000, reward:{gold:50,  xp:50}},
  {id:'gold_5000',  icon:'🪙', title:'Tüccar Ruhlu',  desc:'5000 Akçe kazan',   type:'totalGold', target:5000, reward:{gold:200, xp:200}},
  {id:'gold_10000', icon:'🪙', title:'Hazine Efendisi',desc:'10000 Akçe kazan', type:'totalGold', target:10000,reward:{gold:500, xp:500}},
  // Özel
  {id:'class_select',icon:'🏆',title:'Yol Seçildi',  desc:'Sınıf seç',          type:'special',   target:1,    reward:{gold:200, xp:200}},
  {id:'all_weapons', icon:'🗡', title:'Silah Ustası',  desc:'Tüm silahları Sv.3 yap',type:'special',target:1,  reward:{gold:400, xp:300}},
];

// ── GÖREV TRACKER (savaş sırasında sayaç) ──
let questTracker={kills:0, waves:0, bossKills:0};

// Görev sayaçlarını güncelle
function trackQuest(type, amount){
  amount=amount||1;
  questTracker[type]=(questTracker[type]||0)+amount;
  checkQuestProgress(type);
}

function checkQuestProgress(type){
  // Hikaye görevi
  const activeStory=getActiveStoryQuest();
  if(activeStory&&activeStory.type===type){
    const prog=questTracker[type]||0;
    if(prog>=activeStory.target) completeStoryQuest(activeStory);
  }
  // Yan görev
  const sq=SAVE.sideQuests?.active;
  if(sq&&sq.type===type){
    const prog=questTracker[type]||0;
    if(prog>=sq.target) completeSideQuest(sq);
  }
  // Günlük görevler
  checkDailyProgress(type);
  // Başarılar
  checkAchievements(type);
  // Görev HUD güncelle
  updateQuestHUD();
}

// ── HİKAYE GÖREVLERİ ──
function getActiveStoryQuest(){
  const completed=SAVE.story?.completedQuests||[];
  return STORY_QUESTS.find(q=>!completed.includes(q.id))||null;
}

function startStoryDialog(quest){
  showDlg('📜 '+quest.title, quest.dialog.start+'\n\nHedef: '+quest.obj, 'Göreve Çık!', hideDlg);
}

function completeStoryQuest(quest){
  if((SAVE.story.completedQuests||[]).includes(quest.id))return;
  SAVE.story.completedQuests=SAVE.story.completedQuests||[];
  SAVE.story.completedQuests.push(quest.id);
  saveGame();
  addMainGold(quest.reward.gold);
  addXP(quest.reward.xp);
  addFame(quest.reward.fame||0);
  questTracker={kills:0,waves:0,bossKills:0};
  lootPop('📜 Görev tamamlandı: '+quest.title+'!');
  setTimeout(()=>{
    showDlg('✅ '+quest.title+' — TAMAMLANDI',
      quest.dialog.end+'\n\nÖdül: +'+quest.reward.gold+' Akçe | +'+quest.reward.xp+' XP',
      'Devam Et', hideDlg);
  }, 1000);
  // Sonraki görev varsa bildiri
  const next=getActiveStoryQuest();
  if(next) setTimeout(()=>lootPop('Yeni görev: '+next.title),3000);
}

// ── YAN GÖREVLER ──
function getAvailableSideQuest(){
  const done=SAVE.sideQuests?.completed||[];
  return SIDE_QUESTS.filter(q=>!done.includes(q.id));
}
function acceptSideQuest(id){
  const q=SIDE_QUESTS.find(q=>q.id===id);if(!q)return;
  SAVE.sideQuests={...SAVE.sideQuests,active:{...q,progress:0}};
  questTracker={kills:0,waves:0,bossKills:0};
  saveGame();
  lootPop('Yan görev kabul edildi: '+q.title);
  closeZoneMenu();
}
function completeSideQuest(sq){
  if(!SAVE.sideQuests?.active)return;
  SAVE.sideQuests.completed=SAVE.sideQuests.completed||[];
  SAVE.sideQuests.completed.push(sq.id);
  SAVE.sideQuests.active=null;
  saveGame();
  addMainGold(sq.reward.gold);
  addXP(sq.reward.xp);
  lootPop('📋 Yan görev tamamlandı: '+sq.title+'! +'+sq.reward.gold+' Akçe');
}

// ── GÜNLÜK GÖREVLER ──
function getTodayStr(){return new Date().toISOString().slice(0,10);}
function refreshDailyIfNeeded(){
  const today=getTodayStr();
  if(SAVE.daily?.date===today)return;
  // Günü döndür — pseudo-random ama günlük sabit 3 görev
  const seed=parseInt(today.replace(/-/g,''))%1000;
  const pool=[...DAILY_POOL];
  const picked=[];
  let s=seed;
  while(picked.length<3&&pool.length>0){
    const idx=s%pool.length;picked.push({...pool[idx],progress:0});
    pool.splice(idx,1);s=Math.floor(s*1.7+13)%997;
  }
  SAVE.daily={date:today,quests:picked,completed:[]};
  saveGame();
}
function checkDailyProgress(type){
  if(!SAVE.daily?.quests)return;
  let changed=false;
  SAVE.daily.quests.forEach(function(q,i){
    if((SAVE.daily.completed||[]).includes(i))return;
    if(q.type!==type)return;
    q.progress=(q.progress||0)+(questTracker[type]||0);
    if(q.progress>=q.target){
      SAVE.daily.completed=SAVE.daily.completed||[];
      SAVE.daily.completed.push(i);
      addMainGold(q.reward.gold);
      addXP(q.reward.xp);
      lootPop('📅 Günlük tamamlandı: '+q.title+'! +'+q.reward.gold+' Akçe');
      changed=true;
    }
  });
  if(changed)saveGame();
}

// ── BAŞARI SİSTEMİ ──
function checkAchievements(type){
  ACHIEVEMENTS.forEach(function(ach){
    if(SAVE.achievements[ach.id])return; // zaten kazanılmış
    let val=0;
    if(ach.type==='kills')      val=SAVE.stats.kills||0;
    else if(ach.type==='bossKills')val=SAVE.stats.bossKills||0;
    else if(ach.type==='waves') val=SAVE.stats.highWave||0;
    else if(ach.type==='level') val=SAVE.level||1;
    else if(ach.type==='totalGold')val=SAVE.stats.totalGoldEarned||0;
    else return; // special tipler ayrıca tetiklenir
    if(val>=ach.target) unlockAchievement(ach.id);
  });
}
function checkSpecialAchievement(id){
  const ach=ACHIEVEMENTS.find(a=>a.id===id);
  if(!ach||SAVE.achievements[id])return;
  unlockAchievement(id);
}
function unlockAchievement(id){
  const ach=ACHIEVEMENTS.find(a=>a.id===id);if(!ach)return;
  SAVE.achievements[id]=true;saveGame();
  if(ach.reward.gold>0)addMainGold(ach.reward.gold);
  if(ach.reward.xp>0)addXP(ach.reward.xp);
  showAchievementBanner(ach);
}
function showAchievementBanner(ach){
  const el=document.getElementById('achievementBanner');
  if(!el)return;
  el.innerHTML=`${ach.icon} <b>${ach.title}</b><br><span style="font-size:8px;color:#aaa">${ach.desc}</span>`;
  el.style.display='block';el.style.animation='achAnim 3s forwards';
  setTimeout(()=>{el.style.display='none';el.style.animation='';},3200);
}

// ── GÖREV HUD ──
function updateQuestHUD(){
  const aq=getActiveStoryQuest();
  const el=document.getElementById('gorevT');
  if(!el)return;
  if(currentMap==='gorev'&&aq){
    const prog=questTracker[aq.type]||0;
    el.textContent='📜 '+aq.title+': '+prog+'/'+aq.target;
  } else if(currentMap==='gorev'){
    el.textContent='Tüm hikaye görevleri tamamlandı! ✅';
  }
}

// ── CAMİİ'DE GÖREV PANELI ──
function buildCamiiUI(){
  refreshDailyIfNeeded();
  const aq=getActiveStoryQuest();
  const sq=SAVE.sideQuests?.active;
  const dailyQuests=SAVE.daily?.quests||[];
  const dailyDone=SAVE.daily?.completed||[];

  let html='';

  // Ana hikaye görevi
  html+=`<div style="color:#FFD700;font-size:9px;letter-spacing:2px;margin-bottom:8px;">📜 HİKAYE GÖREVİ</div>`;
  if(aq){
    const prog=questTracker[aq.type]||0;
    const pct=Math.min(prog/aq.target*100,100);
    html+=`<div class="itemCard" style="margin-bottom:10px;">
      <div class="cardIcon">📜</div>
      <div class="cardName">${aq.title}</div>
      <div class="cardDesc">${aq.obj}</div>
      <div class="lvlBar" style="margin-top:6px;"><div class="lvlBarFill" style="width:${pct}%;background:linear-gradient(90deg,#8B4513,#FFD700)"></div></div>
      <div style="color:#888;font-size:8px;margin-top:3px;">${prog} / ${aq.target}</div>
      <div style="color:#D4B896;font-size:8px;margin-top:4px;">Ödül: 🪙${aq.reward.gold} | ⭐${aq.reward.xp}XP | Ün+${aq.reward.fame}</div>
    </div>`;
  } else {
    html+=`<div style="color:#27ae60;font-size:10px;text-align:center;padding:8px;">✅ Tüm hikaye görevleri tamamlandı!</div>`;
  }

  html+='<div class="divider"></div>';

  // Günlük görevler
  html+=`<div style="color:#FFD700;font-size:9px;letter-spacing:2px;margin-bottom:8px;">📅 GÜNLÜK GÖREVLER</div>`;
  dailyQuests.forEach(function(q,i){
    const done=dailyDone.includes(i);
    const prog=Math.min(q.progress||0,q.target);
    const pct=prog/q.target*100;
    html+=`<div class="itemCard ${done?'owned':''}" style="margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="cardName" style="font-size:10px;">${done?'✅ ':''} ${q.title}</div>
        <div style="color:#FFD700;font-size:9px;">🪙${q.reward.gold}</div>
      </div>
      <div class="cardDesc">${q.obj}</div>
      ${!done?`<div class="lvlBar"><div class="lvlBarFill" style="width:${pct}%"></div></div>
      <div style="color:#888;font-size:8px;">${prog}/${q.target}</div>`:''}
    </div>`;
  });

  html+='<div class="divider"></div>';

  // Kaydet & buff
  html+=`<div class="cardGrid">
    <div class="itemCard">
      <div class="cardIcon">💾</div><div class="cardName">Kaydet</div>
      <div class="cardDesc">İlerlemeyi kaydet</div>
      <button onclick="saveManual()" style="margin-top:5px;width:100%;padding:5px;background:rgba(52,152,219,.2);border:1px solid #3498db;border-radius:3px;color:#5dade2;font-size:10px;cursor:pointer;font-family:Cinzel,serif;">Kaydet</button>
    </div>
    <div class="itemCard">
      <div class="cardIcon">🙏</div><div class="cardName">Dua Et</div>
      <div class="cardDesc">Sonraki görevde +%5 hasar</div>
      <button onclick="doBuff()" style="margin-top:5px;width:100%;padding:5px;background:rgba(255,215,0,.15);border:1px solid #8B6914;border-radius:3px;color:#FFD700;font-size:10px;cursor:pointer;font-family:Cinzel,serif;">Dua Et</button>
    </div>
  </div>`;
  return html;
}

// ── BAŞARILAR PANELI (Kervansaray) ──
function buildKervansarayUI(){
  const earned=ACHIEVEMENTS.filter(a=>SAVE.achievements[a.id]);
  const total=ACHIEVEMENTS.length;
  let html=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <div style="color:#FFD700;font-size:9px;letter-spacing:2px;">🏆 BAŞARILAR</div>
    <div style="color:#888;font-size:9px;">${earned.length}/${total}</div>
  </div>`;
  // İlerleme barı
  html+=`<div class="lvlBar" style="margin-bottom:12px;"><div class="lvlBarFill" style="width:${earned.length/total*100}%;background:linear-gradient(90deg,#8B6914,#FFD700)"></div></div>`;
  // Liste
  html+='<div style="display:flex;flex-direction:column;gap:6px;">';
  ACHIEVEMENTS.forEach(function(ach){
    const done=!!SAVE.achievements[ach.id];
    html+=`<div class="itemCard ${done?'owned':''}" style="display:flex;align-items:center;gap:10px;${done?'':'opacity:.5'}">
      <div style="font-size:20px;min-width:28px;text-align:center;">${done?ach.icon:'🔒'}</div>
      <div style="flex:1;">
        <div class="cardName" style="font-size:10px;">${done?ach.title:'???'}</div>
        <div class="cardDesc">${done?ach.desc:'Gizli başarı'}</div>
      </div>
      ${done?`<div style="color:#FFD700;font-size:8px;text-align:right;">+${ach.reward.gold}🪙<br>+${ach.reward.xp}XP</div>`:''}
    </div>`;
  });
  html+='</div>';
  // Haritalar
  html+=`<div class="divider"></div>
  <div style="color:#FFD700;font-size:9px;letter-spacing:2px;margin-bottom:8px;">🗺 YENİ TOPRAKLAR</div>`;
  const ormanCost=300;
  const ormanOwned=SAVE.mapsUnlocked&&SAVE.mapsUnlocked.orman;
  html+=`<div class="itemCard" style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
    <div style="font-size:24px;">🏹</div>
    <div style="flex:1;">
      <div class="cardName">Anadolu Ormanı</div>
      <div class="cardDesc">Hayvan avla — sessiz yaklaş, iz takip et, deri ve et kazan</div>
    </div>
    ${ormanOwned
      ?`<button onclick="closeZoneMenu();BEGIN('orman')" style="padding:6px 12px;background:rgba(39,174,96,.25);border:1px solid #27ae60;border-radius:3px;color:#2ecc71;font-size:9px;cursor:pointer;font-family:Cinzel,serif;white-space:nowrap;">Ava Çık</button>`
      :`<button onclick="buyOrmanMap()" style="padding:6px 10px;background:${mainGold>=ormanCost?'rgba(255,215,0,.15)':'rgba(100,0,0,.15)'};border:1px solid ${mainGold>=ormanCost?'#8B6914':'#7B1414'};border-radius:3px;color:${mainGold>=ormanCost?'#FFD700':'#c0392b'};font-size:9px;cursor:pointer;font-family:Cinzel,serif;white-space:nowrap;">💰 ${ormanCost} Akçe</button>`
    }
  </div>`;
  const madenCost=400;
  const madenOwned=SAVE.mapsUnlocked&&SAVE.mapsUnlocked.maden;
  html+=`<div class="itemCard" style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
    <div style="font-size:24px;">⛏</div>
    <div style="flex:1;">
      <div class="cardName">Demir Madeni</div>
      <div class="cardDesc">Karanlık tünel — fenerini takip et, tuzaklara dikkat et, maden topla</div>
    </div>
    ${madenOwned
      ?`<button onclick="closeZoneMenu();BEGIN('maden')" style="padding:6px 12px;background:rgba(39,174,96,.25);border:1px solid #27ae60;border-radius:3px;color:#2ecc71;font-size:9px;cursor:pointer;font-family:Cinzel,serif;white-space:nowrap;">Madene İn</button>`
      :`<button onclick="buyMadenMap()" style="padding:6px 10px;background:${mainGold>=madenCost?'rgba(255,215,0,.15)':'rgba(100,0,0,.15)'};border:1px solid ${mainGold>=madenCost?'#8B6914':'#7B1414'};border-radius:3px;color:${mainGold>=madenCost?'#FFD700':'#c0392b'};font-size:9px;cursor:pointer;font-family:Cinzel,serif;white-space:nowrap;">💰 ${madenCost} Akçe</button>`
    }
  </div>`;
  [{name:'Tarım Ovası',icon:'🌾'},{name:'Yabancı Şehir',icon:'🏙'},{name:'Osmanlı Sarayı',icon:'👑'}].forEach(function(m){
    html+=`<div class="itemCard" style="display:flex;align-items:center;gap:10px;opacity:.5;margin-bottom:5px;">
      <div style="font-size:20px;">${m.icon}</div>
      <div><div class="cardName">${m.name}</div><div class="cardDesc">Yakında...</div></div>
      <span style="font-size:8px;color:#f39c12;border:1px solid #f39c12;border-radius:3px;padding:2px 6px;margin-left:auto;">Yakında</span>
    </div>`;
  });
  return html;
}

function buyOrmanMap(){
  const cost=300;
  if(!spendMain(cost))return;
  SAVE.mapsUnlocked=SAVE.mapsUnlocked||{};
  SAVE.mapsUnlocked.orman=true;
  saveGame();
  lootPop('🏹 Anadolu Ormanı açıldı! Av başlasın!');
  openZone('kervansaray');
}

function buyMadenMap(){
  const cost=400;
  if(!spendMain(cost))return;
  SAVE.mapsUnlocked=SAVE.mapsUnlocked||{};
  SAVE.mapsUnlocked.maden=true;
  saveGame();
  lootPop('⛏ Demir Madeni açıldı! Karanlığa hazır ol!');
  openZone('kervansaray');
}

// Yan görev paneli (Çarşı'ya eklenir)
function buildCarsiUI(){
  const available=getAvailableSideQuest();
  const active=SAVE.sideQuests?.active;
  let html='';

  // Aktif yan görev
  if(active){
    const prog=questTracker[active.type]||0;
    const pct=Math.min(prog/active.target*100,100);
    html+=`<div style="color:#FFD700;font-size:9px;letter-spacing:2px;margin-bottom:8px;">📋 AKTİF YAN GÖREV</div>
    <div class="itemCard owned" style="margin-bottom:10px;">
      <div class="cardName">${active.title}</div>
      <div class="cardDesc">${active.obj}</div>
      <div class="lvlBar"><div class="lvlBarFill" style="width:${pct}%"></div></div>
      <div style="color:#888;font-size:8px;margin-top:3px;">${prog}/${active.target}</div>
      <div style="color:#D4B896;font-size:8px;margin-top:4px;">Ödül: 🪙${active.reward.gold} | ⭐${active.reward.xp}XP</div>
    </div><div class="divider"></div>`;
  }

  // Mevcut yan görevler
  html+=`<div style="color:#FFD700;font-size:9px;letter-spacing:2px;margin-bottom:8px;">📋 YAN GÖREVLER</div>`;
  if(!available.length){
    html+='<div style="color:#27ae60;text-align:center;font-size:10px;padding:8px;">✅ Tüm yan görevler tamamlandı!</div>';
  } else {
    available.slice(0,3).forEach(function(q){
      const isActive=active&&active.id===q.id;
      html+=`<div class="itemCard" style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;">
          <div class="cardName" style="font-size:10px;">${q.title}</div>
          <div style="color:#FFD700;font-size:9px;">🪙${q.reward.gold}</div>
        </div>
        <div class="cardDesc">${q.obj}</div>
        ${!isActive?`<button onclick="acceptSideQuest('${q.id}')" style="margin-top:5px;width:100%;padding:4px;background:rgba(39,174,96,.2);border:1px solid #27ae60;border-radius:3px;color:#2ecc71;font-size:9px;cursor:pointer;font-family:Cinzel,serif;">Kabul Et</button>`:'<span style="color:#FFD700;font-size:9px;">✓ Aktif</span>'}
      </div>`;
    });
  }

  html+='<div class="divider"></div>';
  html+=`<div class="cardGrid">
    <div class="itemCard">
      <div class="cardIcon">🧪</div><div class="cardName">Can İksiri</div>
      <div class="cardDesc">Görevde +50 can yeniler</div>
      <div class="cardCost ${mainGold>=80?'':'cantAfford'}">💰 80 Akçe</div>
      <button onclick="buyPotion()" style="margin-top:4px;width:100%;padding:4px;background:rgba(39,174,96,.2);border:1px solid #27ae60;border-radius:3px;color:#2ecc71;font-size:9px;cursor:pointer;font-family:Cinzel,serif;">Satın Al</button>
    </div>
    <div class="itemCard">
      <div class="cardIcon">⚡</div><div class="cardName">Enerji İçeceği</div>
      <div class="cardDesc">Göreve tam enerjiyle başla</div>
      <div class="cardCost ${mainGold>=50?'':'cantAfford'}">💰 50 Akçe</div>
      <button onclick="buyEnergy()" style="margin-top:4px;width:100%;padding:4px;background:rgba(52,152,219,.2);border:1px solid #3498db;border-radius:3px;color:#5dade2;font-size:9px;cursor:pointer;font-family:Cinzel,serif;">Satın Al</button>
    </div>
  </div>`;
  return html;
}
function getPassiveBonus(type){
  const lvl=SAVE.passives[type]||0;
  const tbl={guc:[0,.1,.2,.35],hiz:[0,.1,.2,.3],dayaniklilik:[0,25,50,80],loot:[1,1.2,1.4,1.6]};
  return(tbl[type]||[0])[Math.min(lvl,(tbl[type]||[0]).length-1)];
}
function getArmorDef(){const d={none:0,leather:.1,chain:.2,plate:.35,ottoman:.5};return d[SAVE.armor]||0;}
function getArmorHpBonus(){const d={none:0,leather:25,chain:50,plate:80,ottoman:120};return d[SAVE.armor]||0;}
function getArmorSpdPenalty(){const d={none:0,leather:0,chain:.05,plate:.1,ottoman:.08};return d[SAVE.armor]||0;}
function getBaseMaxHp(){return Math.floor((100+getArmorHpBonus()+(getPassiveBonus('dayaniklilik'))+(SAVE.maxHpBonus||0))*getClassMult('hpMult'));}
function getBaseMaxEn(){return 100+(SAVE.maxEnBonus||0);}
function getBaseSpd(){return 4*(1+getPassiveBonus('hiz'))*(1-getArmorSpdPenalty())*getClassMult('spdMult');}
function getMagnetDist(){const b=[7,9,11,14];return b[SAVE.passives.loot||0]||7;}
function getWeaponDmg(wid){
  const base={yatagan:[14,20,28,38,50],tufek:[36,48,64,84,110],ok:[22,30,40,52,68]};
  const lvl=(SAVE.weapons[wid]?.lvl||1)-1;
  const rBuff=abilityActive&&abilityActive.r?((ABILITY_DEFS.hizli_atis?.levels||[])[Math.max((getAbilityLvl('r')||1)-1,0)]?.dmgMult||1):1;
  const dmgMult=(1+getPassiveBonus('guc'))*getClassMult('dmgMult')*rBuff;
  return Math.floor((base[wid]||[14])[Math.min(lvl,4)]*dmgMult);
}

