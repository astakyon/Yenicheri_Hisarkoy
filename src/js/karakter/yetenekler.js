// ═══════════════════════════════════════════════════════
// AKTİF YETENEK SİSTEMİ (Q/F/R)
// ═══════════════════════════════════════════════════════
const ABILITY_DEFS={
  savasciglik:{name:'Savaş Çığlığı',icon:'⚡',key:'q',
    levels:[
      {cd:8, range:4,stunDur:1.5,desc:'Yakınları geri it, 1.5sn sersemlet'},
      {cd:7, range:5,stunDur:2.0,desc:'Alan +1, sersem 2sn'},
      {cd:6, range:6,stunDur:2.5,desc:'Alan +1, sersem 2.5sn'},
      {cd:5, range:7,stunDur:3.0,desc:'Alan +1, sersem 3sn'},
      {cd:4, range:8,stunDur:3.0,desc:'Alan +1, sersem 3sn'},
    ],
    unlockCost:100,
  },
  demir_kalkan:{name:'Demir Kalkan',icon:'🛡',key:'f',
    levels:[
      {cd:15,duration:2,  desc:'2sn hasar engeli'},
      {cd:13,duration:2.5,desc:'2.5sn hasar engeli'},
      {cd:11,duration:3,  desc:'3sn hasar engeli'},
      {cd:9, duration:3.5,desc:'3.5sn hasar engeli'},
      {cd:7, duration:4,  desc:'4sn hasar engeli'},
    ],
    unlockCost:150,
  },
  hizli_atis:{name:'Hızlı Atış',icon:'🔥',key:'r',
    levels:[
      {cd:20,speedMult:1.8,dmgMult:1.3,duration:3,  desc:'3sn hız x1.8, hasar x1.3'},
      {cd:18,speedMult:2.0,dmgMult:1.5,duration:3.5,desc:'3.5sn hız x2, hasar x1.5'},
      {cd:16,speedMult:2.0,dmgMult:1.5,duration:4,  desc:'4sn hız x2, hasar x1.5'},
      {cd:14,speedMult:2.2,dmgMult:1.8,duration:4,  desc:'4sn hız x2.2, hasar x1.8'},
      {cd:12,speedMult:2.5,dmgMult:2.0,duration:5,  desc:'5sn hız x2.5, hasar x2'},
    ],
    unlockCost:200,
  },
};

// CD takip (saniye)
let abilityCDs={q:0,f:0,r:0};
let abilityActive={q:false,f:false,r:false};
let abilityTimer={q:0,f:0,r:0};

function getAbilityDef(key){
  const id=SAVE.abilities[key]?.id;
  return id?Object.values(ABILITY_DEFS).find(a=>a.key===key):null;
}
function getAbilityLvl(key){return SAVE.abilities[key]?.lvl||0;}
function isAbilityUnlocked(key){return SAVE.abilities[key]?.unlocked===true&&getAbilityLvl(key)>0;}

function useAbility(key){
  if(!playing||paused)return;
  if(!isAbilityUnlocked(key))return;
  if(abilityCDs[key]>0)return;
  const def=getAbilityDef(key);if(!def)return;
  const lvl=getAbilityLvl(key);
  const lvlData=def.levels[lvl-1];
  if(!lvlData)return;

  if(key==='q'){
    // Savaş Çığlığı — yakın düşmanları geri it
    const range=lvlData.range||4;
    enemies.forEach(function(en){
      const dx=en.x-pl.x,dz=en.z-pl.z,d=Math.hypot(dx,dz);
      if(d<range&&d>0){en.x+=dx/d*5;en.z+=dz/d*5;en.mesh.position.set(en.x,0,en.z);en.stunned=(lvlData.stunDur||1.5)*60;}
    });
    addFX(pl.x,pl.z,0xFFFF00,12);
    lootPop('⚡ Savaş Çığlığı!');
  } else if(key==='f'){
    // Demir Kalkan
    abilityActive.f=true;
    abilityTimer.f=(lvlData.duration||2)*60;
    lootPop('🛡 Demir Kalkan aktif!');
  } else if(key==='r'){
    // Hızlı Atış
    abilityActive.r=true;
    abilityTimer.r=(lvlData.duration||3)*60;
    pl.spd=getBaseSpd()*(lvlData.speedMult||1.8);
    pl.rspd=pl.spd*1.8;
    lootPop('🔥 Hızlı Atış aktif!');
  }

  abilityCDs[key]=lvlData.cd*60; // frame cinsine çevir
  updateAbilityHUD();
}

function updateAbilities(dt){
  ['q','f','r'].forEach(function(key){
    if(abilityCDs[key]>0){
      abilityCDs[key]--;
      if(abilityCDs[key]===0)lootPop(['⚡','🛡','🔥'][['q','f','r'].indexOf(key)]+' Yetenek hazır!');
    }
    if(abilityActive[key]&&abilityTimer[key]>0){
      abilityTimer[key]--;
      if(abilityTimer[key]===0){
        abilityActive[key]=false;
        if(key==='r'){pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;}
      }
    }
  });
  updateAbilityHUD();
}

function updateAbilityHUD(){
  ['q','f','r'].forEach(function(key){
    const unlocked=isAbilityUnlocked(key);
    const def=getAbilityDef(key);
    const cdMax=def&&getAbilityLvl(key)>0?def.levels[getAbilityLvl(key)-1].cd*60:1;
    const cdPct=Math.min(abilityCDs[key]/cdMax*100,100);
    const ready=unlocked&&abilityCDs[key]===0;
    const active=abilityActive[key];

    // HUD slot
    const slot=document.getElementById('abSlot_'+key);
    const cdEl=document.getElementById('abCd_'+key);
    const txtEl=document.getElementById('abTxt_'+key);
    if(slot){
      slot.className='abilitySlot'+(unlocked?' unlocked':'  locked')+(ready?' ready':'')+(active?' active':'');
      if(cdEl)cdEl.style.height=cdPct+'%';
      if(txtEl)txtEl.textContent=abilityCDs[key]>0?Math.ceil(abilityCDs[key]/60)+'s':'';
    }
    // Mobil buton
    const mob=document.getElementById('abMob_'+key);
    const mobCd=document.getElementById('abMobCd_'+key);
    if(mob){
      mob.className='abBtn'+(unlocked?' unlocked':'  locked')+(ready?' ready':'')+(active?' active':'');
      if(mobCd)mobCd.style.height=cdPct+'%';
    }
  });
}

// Drill Ground — Yetenek aç/yükselt
function unlockAbility(key){
  const def=getAbilityDef(key)||Object.values(ABILITY_DEFS).find(a=>a.key===key);
  if(!def)return;
  if(!spendMain(def.unlockCost))return;
  SAVE.abilities[key]={id:def.id||key,lvl:1,unlocked:true};
  saveGame();
  updateAbilityHUD();
  lootPop(def.icon+' '+def.name+' açıldı!');
  openZone('drill');
}
function upgradeAbility(key){
  const ab=SAVE.abilities[key];if(!ab||!ab.unlocked)return;
  const def=getAbilityDef(key)||Object.values(ABILITY_DEFS).find(a=>a.key===key);
  if(!def)return;
  const lvl=ab.lvl||1;if(lvl>=5)return;
  const cost=def.levels[lvl].unlockCost||def.levels[lvl].cd*50;
  // Yükseltme maliyeti: CD * 50 yaklaşık
  const upgCosts=[0,200,400,800,1600];
  if(!spendMain(upgCosts[lvl]||200))return;
  SAVE.abilities[key].lvl=lvl+1;saveGame();
  lootPop(def.icon+' '+def.name+' Sv.'+(lvl+1)+'!');
  openZone('drill');
}

