// ═══════════════════════════════════════════════════════
// UI YARDIMCILARI
// ═══════════════════════════════════════════════════════
function showDlg(t,p,b,cb){document.getElementById('dlgT').textContent=t;document.getElementById('dlgP').textContent=p;document.getElementById('dlgB').textContent=b;document.getElementById('dlgB').onclick=cb||hideDlg;document.getElementById('dlgLayer').style.display='flex';}
function hideDlg(){document.getElementById('dlgLayer').style.display='none';}
function lootPop(t){const f=document.getElementById('lootFd'),d=document.createElement('div');d.className='lpop';d.textContent=t;f.appendChild(d);setTimeout(()=>d.remove(),2200);}
function showWave(t){const e=document.getElementById('wvAnn');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',2700);}
const WEAPON_ICONS=['🗡','🔫','🏹'];
function selW(i){
  selWeapon=i;pl.cekiT=300;
  const sel=document.getElementById('wepSel');if(sel)sel.textContent=WEAPON_ICONS[i];
  [0,1,2].forEach(j=>{const e=document.getElementById('wf'+j);if(e)e.classList.toggle('on',j===i);});
}
let wepFanOpen=false;
function toggleWepFan(){
  wepFanOpen=!wepFanOpen;
  const sel=document.getElementById('wepSel');
  [0,1,2].forEach(j=>{const e=document.getElementById('wf'+j);if(e)e.classList.toggle('show',wepFanOpen);});
  if(sel)sel.classList.toggle('open',wepFanOpen);
}
function chooseWeapon(i){
  selW(i);
  toggleWepFan();
}

function doPause(){
  if(!playing)return;paused=true;playing=false;
  document.getElementById('pWv').textContent=wave;
  document.getElementById('pKl').textContent=kills;
  document.getElementById('pauseMapLbl').textContent=currentMap==='kisla'?'KIŞLA':'HİSARKÖY DEVRİYE';
  updateGoldHud();
  document.getElementById('pauseBox').style.display='flex';
}
function doResume(){document.getElementById('pauseBox').style.display='none';paused=false;playing=true;}

function toMenu(){
  if(typeof ciftlikPanelKapat==='function'){ciftlikPanelKapat();ciftlikEnvBtn(false);}
  ['pauseBox','deathBox','milestoneBox','zoneMenuBox','hudLayer','gameLayer','touchLayer','worldMapBox','bigMapBox'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.display='none';
  });
  document.getElementById('topBar').style.display='none';document.getElementById('mmBox').style.display='none';document.getElementById('topLeftHud').style.display='none';
  document.getElementById('testExitBtn').style.display='none';
  isTestMode=false;
  document.getElementById('menuLayer').style.display='block';
  losePool();playing=false;paused=false;clearAll();
  if(CLIENT.aktif)leaveClient();
  if(ODA.peer)odaKapat();
}

function toKisla(){
  ['pauseBox','milestoneBox'].forEach(id=>document.getElementById(id).style.display='none');
  losePool();
  BEGIN('kisla');
}

function showDeath(){
  document.getElementById('dKl').textContent=kills;
  document.getElementById('dWv').textContent=wave;
  document.getElementById('dPool').textContent=poolGold;
  losePool();
  document.getElementById('deathBox').style.display='flex';
}
function doRetry(){document.getElementById('deathBox').style.display='none';startGorev();}

// Milestone mola
function showMilestone(){
  document.getElementById('mileWaveTxt').textContent='⚔ Dalga '+wave+' Tamamlandı!';
  document.getElementById('milePool').textContent=poolGold;
  document.getElementById('milestoneBox').style.display='flex';
}
function mileContinue(){document.getElementById('milestoneBox').style.display='none';wave++;waveTimer=170;playing=true;}

