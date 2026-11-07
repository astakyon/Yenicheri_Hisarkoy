// ═══════════════════════════════════════════════════════
// VERSİYON & KALICI VERİ
// ═══════════════════════════════════════════════════════
const VERSION='{{VERSION}}';

// LocalStorage kayıt
const SAVE_KEY='yenicheri_save_104';
let SAVE={
  mainGold:0,
  weapons:{yatagan:{lvl:1},tufek:{lvl:1},ok:{lvl:1}},
  armor:'none',
  armorOwned:['none'],
  passives:{guc:0,hiz:0,dayaniklilik:0,loot:0},
  maxHpBonus:0,
  maxEnBonus:0,
  xp:0, level:1, xpNext:100,
  class:null, fame:0,
  abilities:{
    q:{id:'savasciglik',lvl:0,unlocked:false},
    f:{id:'demir_kalkan',lvl:0,unlocked:false},
    r:{id:'hizli_atis',lvl:0,unlocked:false},
  },
  // Faz 4 — Görev & Başarı
  story:{chapter:1, completedQuests:[]},
  sideQuests:{active:null, completed:[]},
  daily:{date:'', quests:[], completed:[]},
  achievements:{},
  stats:{kills:0,bossKills:0,highWave:0,totalXp:0,totalGoldEarned:0,animalsHunted:0},
  mapsUnlocked:{orman:true,maden:true,tarim:true,ciftlik:true}
};
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(e){}}
function loadGame(){
  try{
    const d=localStorage.getItem(SAVE_KEY);
    if(d){
      const p=JSON.parse(d);
      SAVE={...SAVE,...p};
      SAVE.weapons={...{yatagan:{lvl:1},tufek:{lvl:1},ok:{lvl:1}},...(p.weapons||{})};
      SAVE.passives={...{guc:0,hiz:0,dayaniklilik:0,loot:0},...(p.passives||{})};
      SAVE.abilities={...SAVE.abilities,...(p.abilities||{})};
      SAVE.story={...SAVE.story,...(p.story||{})};
      SAVE.daily={...SAVE.daily,...(p.daily||{})};
      SAVE.achievements={...SAVE.achievements,...(p.achievements||{})};
      SAVE.stats={...SAVE.stats,...(p.stats||{})};
      SAVE.mapsUnlocked={...SAVE.mapsUnlocked,...(p.mapsUnlocked||{}),orman:true,maden:true,tarim:true,ciftlik:true}; // v1.56: Orman, Maden (v1.61: Tarım) herkese açık
    }
  }catch(e){}
}
loadGame();

// ── Para sistemi ──
let mainGold=SAVE.mainGold||0;
let poolGold=0;

function addMainGold(n){
  mainGold+=n;SAVE.mainGold=mainGold;
  SAVE.stats.totalGoldEarned=(SAVE.stats.totalGoldEarned||0)+n;
  saveGame();updateGoldHud();
  checkAchievements('totalGold');
}
function addPoolGold(n){poolGold+=Math.floor(n*(getPassiveBonus('loot')));updateGoldHud();}
function transferPool(){if(poolGold>0){addMainGold(poolGold);lootPop('+'+poolGold+' Akçe kışlaya aktarıldı! 🪙');poolGold=0;updateGoldHud();}}
function losePool(){if(poolGold>0){lootPop(poolGold+' Akçe kaybedildi! 💸');poolGold=0;updateGoldHud();}}
function spendMain(n){if(mainGold<n)return false;mainGold-=n;SAVE.mainGold=mainGold;saveGame();updateGoldHud();return true;}
