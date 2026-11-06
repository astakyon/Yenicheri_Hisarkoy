// ═══════════════════════════════════════════════════════
// AYARLAR SİSTEMİ
// ═══════════════════════════════════════════════════════
const SETTINGS_KEY='yenicheri_settings';
let SETTINGS={
  touchEnabled: true,
  joySize: 'normal',      // 'small'|'normal'|'large'
  abilityBtns: true,
  weaponBar: true,
};
function loadSettings(){try{const d=localStorage.getItem(SETTINGS_KEY);if(d)SETTINGS={...SETTINGS,...JSON.parse(d)};}catch(e){}}
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(SETTINGS));}catch(e){}}
loadSettings();

function openSettings(){
  // Mevcut değerleri toggle'lara yansıt
  document.getElementById('toggleTouch').checked      = SETTINGS.touchEnabled;
  document.getElementById('toggleAbilityBtns').checked= SETTINGS.abilityBtns;
  document.getElementById('toggleWeaponBar').checked  = SETTINGS.weaponBar;
  document.getElementById('joySizeLabel').textContent = {small:'Küçük',normal:'Normal',large:'Büyük'}[SETTINGS.joySize];
  document.getElementById('settingsBox').style.display='flex';
}
function closeSettings(){
  document.getElementById('settingsBox').style.display='none';
}

function applyTouchSetting(enabled){
  SETTINGS.touchEnabled=enabled;saveSettings();
  const tl=document.getElementById('touchLayer');
  if(tl)tl.style.display=enabled?'block':'none';
}

function applyAbilityBtnSetting(enabled){
  SETTINGS.abilityBtns=enabled;saveSettings();
  const el=document.getElementById('abilityBtns');
  if(el)el.style.display=enabled?'flex':'none';
}

function applyWeaponBarSetting(enabled){
  SETTINGS.weaponBar=enabled;saveSettings();
  const el=document.getElementById('wepSel');
  const fan=document.getElementById('wepFan');
  if(el)el.style.display=enabled?'flex':'none';
  if(fan)fan.style.display=enabled?'block':'none';
}

function setJoySize(size){
  SETTINGS.joySize=size;saveSettings();
  document.getElementById('joySizeLabel').textContent={small:'Küçük',normal:'Normal',large:'Büyük'}[size];
  const base=document.getElementById('joyBase');
  const knob=document.getElementById('joyKnob');
  if(!base||!knob)return;
  const sizes={small:{base:'90px',knob:'38px',margin:'-19px'},normal:{base:'130px',knob:'56px',margin:'-28px'},large:{base:'160px',knob:'68px',margin:'-34px'}};
  const s=sizes[size];
  base.style.width=s.base;base.style.height=s.base;
  knob.style.width=s.knob;knob.style.height=s.knob;
  knob.style.margin=s.margin+' 0 0 '+s.margin;
}

function confirmReset(){
  showDlg('⚠ Kayıdı Sıfırla','Tüm ilerleme, akçe, level\nve ekipman silinecek!\n\nBu işlem geri alınamaz.','Evet, Sıfırla',function(){
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    location.reload();
  });
  // İkinci buton ekle (iptal)
  setTimeout(()=>{
    const b=document.getElementById('dlgB');
    if(b){const cancel=b.cloneNode();cancel.textContent='İptal';cancel.onclick=hideDlg;cancel.style.marginLeft='8px';b.parentNode.insertBefore(cancel,b.nextSibling);}
  },50);
}

// Ayarları oyun başladığında uygula
function applyAllSettings(){
  const tl=document.getElementById('touchLayer');
  if(tl)tl.style.display=SETTINGS.touchEnabled?'block':'none';
  const ab=document.getElementById('abilityBtns');
  if(ab)ab.style.display=SETTINGS.abilityBtns?'flex':'none';
  setJoySize(SETTINGS.joySize||'normal');
}

function updateGoldHud(){
  const mainGoldEl=document.getElementById('mainGoldV');
  const poolGoldEl=document.getElementById('poolGoldV');
  const poolRowEl=document.getElementById('poolRow');
  const zmGoldEl=document.getElementById('zmGold');
  const pMainEl=document.getElementById('pMain');
  const pPoolEl=document.getElementById('pPool');
  if(mainGoldEl)mainGoldEl.textContent=mainGold;
  if(poolGoldEl)poolGoldEl.textContent=poolGold;
  if(poolRowEl)poolRowEl.style.display=poolGold>0?'block':'none';
  if(zmGoldEl)zmGoldEl.textContent=mainGold;
  if(pMainEl)pMainEl.textContent=mainGold;
  if(pPoolEl)pPoolEl.textContent=poolGold;
}

