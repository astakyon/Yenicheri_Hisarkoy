// ═══════════════════════════════════════════════════════
// AYARLAR SİSTEMİ
// ═══════════════════════════════════════════════════════
const SURUM='{{VERSION}}';
const SETTINGS_KEY='yenicheri_settings';
let SETTINGS={
  touchEnabled: true,
  joySize: 'normal',      // 'small'|'normal'|'large'
  abilityBtns: true,
  weaponBar: true,
  joyOp: 100,             // joystick saydamlığı %
  master: 80, muzik: 45, efekt: 80, sessiz: false,
  kalite: 'yuksek',       // 'dusuk'|'orta'|'yuksek'
  golge: true, olcek: 100, fps: false,
  titresim: true,
  uiBoyut: 100,           // arayüz boyutu %
  atmosfer: 'aksam'       // menü atmosferi (ATMOSFERLER anahtarı)
};
function loadSettings(){try{const d=localStorage.getItem(SETTINGS_KEY);if(d)SETTINGS={...SETTINGS,...JSON.parse(d)};}catch(e){}}
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(SETTINGS));}catch(e){}}
loadSettings();

// ── MENÜ ATMOSFERİ (v1.85) ─────────────────────────────
// Yeni atmosfer eklemek: (1) buraya bir satır, (2) main.css'te '#menuLayer[data-atm="anahtar"]{...}' bloğu
// (--atm-sky, --atm-glow, --atm-star, --atm-vig değişkenleri). Ayrıntı: docs/ATMOSFER.md
const ATMOSFERLER={aksam:'Akşam',gece:'Gece',safak:'Şafak',sis:'Sisli'};
function atmosferUygula(ad){
  if(!ATMOSFERLER[ad])ad='aksam';
  const m=document.getElementById('menuLayer');if(m)m.setAttribute('data-atm',ad);
  const sc=document.getElementById('starCv');if(sc&&typeof getComputedStyle==='function'){
    const o=getComputedStyle(m).getPropertyValue('--atm-star').trim();sc.style.opacity=o||'1';}
}

let AYAR_SEKME='kontrol';
function openSettings(){ayarCiz();document.getElementById('settingsBox').style.display='flex';}
function closeSettings(){document.getElementById('settingsBox').style.display='none';}
function ayarSekme(k){AYAR_SEKME=k;ayarCiz();}
function _ayRow(ad,alt,ctl){return '<div class="toggleRow"><div><div class="toggleLabel">'+ad+'</div>'+(alt?'<div class="toggleSub">'+alt+'</div>':'')+'</div><div>'+ctl+'</div></div>';}
function _ayTog(k,fn){return '<label class="toggle"><input type="checkbox" '+(SETTINGS[k]?'checked':'')+' onchange="ayarDegis(\''+k+'\',this.checked'+(fn?','+fn:'')+')"><span class="toggleSlider"></span></label>';}
function _aySlider(k,min,max,st){return '<input class="ayRange" type="range" min="'+min+'" max="'+max+'" step="'+(st||1)+'" value="'+SETTINGS[k]+'" oninput="ayarDegis(\''+k+'\',+this.value);this.nextElementSibling.textContent=this.value+\'%\'"><span class="ayVal">'+SETTINGS[k]+'%</span>';}
function _aySec(k,secenekler){return '<div class="ayChips">'+secenekler.map(function(o){return '<button class="ayChip'+(String(SETTINGS[k])===String(o[0])?' on':'')+'" onclick="ayarDegis(\''+k+'\','+JSON.stringify(o[0]).replace(/"/g,"\'")+',true)">'+o[1]+'</button>';}).join('')+'</div>';}
function ayarDegis(k,v,yenile){
  SETTINGS[k]=v;saveSettings();
  if(k==='touchEnabled')applyTouchSetting(v);
  else if(k==='abilityBtns')applyAbilityBtnSetting(v);
  else if(k==='weaponBar')applyWeaponBarSetting(v);
  else if(k==='joySize')setJoySize(v);
  else if(k==='joyOp')applyJoyOp();
  else if(['master','muzik','efekt','sessiz'].indexOf(k)>=0&&typeof SES!=='undefined'){SES.baslat();SES.hacim();}
  else if(['kalite','golge','olcek'].indexOf(k)>=0)applyGrafik();
  else if(k==='fps')applyFps();
  else if(k==='atmosfer')atmosferUygula(v);
  else if(k==='uiBoyut'&&typeof uiOlcekle==='function')uiOlcekle();
  else if(k==='titresim'&&v&&typeof SES!=='undefined')SES.titre(30);
  if(yenile)ayarCiz();
}
function ayarCiz(){
  const SEK=[['kontrol','🎮','Kontroller'],['ses','🔊','Ses'],['grafik','🖥','Grafik'],['hesap','👤','Hesap'],['hakkinda','ℹ','Hakkında']];
  let h='<div class="ovHead"><div><div class="panTitle">⚙ AYARLAR</div></div><button class="zmX" onclick="closeSettings()" aria-label="Kapat">✕</button></div>';
  h+='<div class="ayTabs">'+SEK.map(function(t){return '<button class="ayTab'+(AYAR_SEKME===t[0]?' on':'')+'" onclick="ayarSekme(\''+t[0]+'\')"><span>'+t[1]+'</span><b>'+t[2]+'</b></button>';}).join('')+'</div>';
  h+='<div class="ovBody">';
  if(AYAR_SEKME==='kontrol'){
    h+=_ayRow('📱 Dokunmatik Kontroller','Joystick ve butonları göster/gizle',_ayTog('touchEnabled'));
    h+=_ayRow('🖥 Arayüz Boyutu','Yazı, çubuk ve HUD boyutu — ekran doluysa küçült',_aySec('uiBoyut',[[60,'Çok küçük'],[75,'Küçük'],[100,'Normal'],[125,'Büyük']]));
    h+=_ayRow('🕹 Joystick Boyutu','',_aySec('joySize',[['small','Küçük'],['normal','Normal'],['large','Büyük']]));
    h+=_ayRow('🌫 Joystick Saydamlığı','Düşükse oyun alanını daha az kapatır',_aySlider('joyOp',30,100,5));
    h+=_ayRow('⚡ Yetenek Butonları (Q/F/R)','Savaş ekranında göster',_ayTog('abilityBtns'));
    h+=_ayRow('🗡 Silah Seçim Çubuğu','Alt barı göster/gizle',_ayTog('weaponBar'));
    h+=_ayRow('📳 Titreşim','Vuruş ve ölümde (destekleyen telefonlarda)',_ayTog('titresim'));
  }else if(AYAR_SEKME==='ses'){
    h+=_ayRow('🔇 Sessiz Mod','Tüm sesleri kapat',_ayTog('sessiz'));
    h+=_ayRow('🔊 Ana Ses','',_aySlider('master',0,100,5));
    h+=_ayRow('🎵 Müzik','Sakin Hicaz ezgisi',_aySlider('muzik',0,100,5));
    h+=_ayRow('⚔ Efektler','Vuruş, ganimet, menü',_aySlider('efekt',0,100,5));
    h+='<div style="text-align:center;margin-top:10px"><button class="panBtn" style="width:auto;padding:8px 18px" onclick="SES.baslat();SES.tik();SES.vur();SES.topla();">▶ Sesi dene</button></div>';
  }else if(AYAR_SEKME==='grafik'){
    h+=_ayRow('✨ Kalite','Düşük = pil ve düşük cihazlar için',_aySec('kalite',[['dusuk','Düşük'],['orta','Orta'],['yuksek','Yüksek']]));
    h+=_ayRow('🌑 Gölgeler','Kapatmak performansı artırır',_ayTog('golge'));
    h+=_ayRow('📐 Çözünürlük Ölçeği','Düşürmek akıcılığı artırır',_aySec('olcek',[[60,'%60'],[80,'%80'],[100,'%100']]));
    h+=_ayRow('📊 FPS Göstergesi','Sağ üstte kare hızı',_ayTog('fps'));
    h+=_ayRow('🌆 Menü Atmosferi','Ana menünün gökyüzü ve ışığı',_aySec('atmosfer',Object.keys(ATMOSFERLER).map(function(k){return [k,ATMOSFERLER[k]];})));
  }else if(AYAR_SEKME==='hesap'){
    h+='<div class="toggleSub" style="margin:2px 0 8px">Kayıt, bu tarayıcıda saklanır. Başka cihaza taşımak için dışa aktarıp yapıştırın.</div>';
    h+='<textarea id="ayKayit" class="ayTxt" rows="4" placeholder="Dışa aktarılan kayıt burada görünür; içe aktarmak için buraya yapıştırın"></textarea>';
    h+='<div class="ayBtnRow"><button class="panBtn" onclick="kayitDisa()">📤 Dışa Aktar</button><button class="panBtn" onclick="kayitKopyala()">📋 Kopyala</button><button class="panBtn grn" onclick="kayitIce()">📥 İçe Aktar</button></div>';
    h+='<div class="divider"></div><button class="panBtn red" onclick="confirmReset()">🗑 Kayıdı Sıfırla</button>';
  }else{
    h+='<div class="ayAbout"><div class="ayLogo">YENİÇERİ</div><div class="ayLogo2">HİSARKÖY MUHAFIZI</div><div class="ayVer">'+(typeof SURUM!=='undefined'?SURUM:'')+'</div>';
    h+='<p>3D Osmanlı aksiyon RPG — kışla, av, maden, tarım, şehir ve saray. Hikayeyi sürdür, çiftliğini büyüt, arkadaşlarınla oda kur.</p>';
    h+='<p class="toggleSub">Telefonda en iyi deneyim için yatay modda, tam ekran (Ana Ekrana Ekle) oynayın.</p></div>';
  }
  h+='</div><div class="ovFoot"><button class="panBtn" onclick="closeSettings()">← Geri</button></div>';
  document.getElementById('settingsPanel').innerHTML=h;
}
function kayitPaketi(){return JSON.stringify({yeniceri:1,surum:(typeof SURUM!=='undefined'?SURUM:''),save:SAVE,ayar:SETTINGS});}
function kayitDisa(){const t=document.getElementById('ayKayit');if(t){t.value=kayitPaketi();t.select();}}
function kayitKopyala(){
  kayitDisa();const t=document.getElementById('ayKayit');
  try{if(navigator.clipboard)navigator.clipboard.writeText(t.value).then(function(){lootPop('📋 Kayıt kopyalandı');},function(){document.execCommand('copy');lootPop('📋 Kayıt seçildi, kopyalayın');});else{document.execCommand('copy');lootPop('📋 Kayıt kopyalandı');}}catch(e){lootPop('📋 Metin seçildi, elle kopyalayın');}
}
function kayitIce(){
  const t=document.getElementById('ayKayit');let o=null;
  try{o=JSON.parse(t.value);}catch(e){}
  if(!o||o.yeniceri!==1||!o.save||typeof o.save!=='object'||typeof o.save.mainGold!=='number'){lootPop('⚠ Geçersiz kayıt metni');return;}
  showDlg('📥 Kayıt İçe Aktar','Mevcut kayıt bu kayıtla DEĞİŞTİRİLECEK.\nDevam edilsin mi?','Evet, Yükle',function(){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(o.save));if(o.ayar)localStorage.setItem(SETTINGS_KEY,JSON.stringify(o.ayar));}catch(e){lootPop('⚠ Kayıt yazılamadı');return;}
    location.reload();
  });
  setTimeout(function(){const b=document.getElementById('dlgB');if(b&&!document.getElementById('dlgIptal')){const c=b.cloneNode();c.id='dlgIptal';c.textContent='İptal';c.onclick=hideDlg;c.style.marginLeft='8px';b.parentNode.insertBefore(c,b.nextSibling);}},50);
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
function applyJoyOp(){['joyBase','joyKnob'].forEach(function(i){const e=document.getElementById(i);if(e)e.style.opacity=(SETTINGS.joyOp||100)/100;});}
function applyGrafik(){
  if(typeof REN==='undefined'||!REN)return;
  const k=SETTINGS.kalite,golge=SETTINGS.golge&&k!=='dusuk';
  const oran=Math.min(window.devicePixelRatio||1,k==='yuksek'?2:1.5)*(SETTINGS.olcek/100)*(k==='dusuk'?.8:1);
  REN.setPixelRatio(Math.max(.5,oran));REN.setSize(window.innerWidth,window.innerHeight);
  if(REN.shadowMap.enabled!==golge){REN.shadowMap.enabled=golge;if(typeof S3!=='undefined'&&S3)S3.traverse(function(o){if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.needsUpdate=true;});}});}
}
let _fpsN=0,_fpsT=0,_fpsOn=false;
function applyFps(){
  let b=document.getElementById('fpsBox');
  if(!b){b=document.createElement('div');b.id='fpsBox';b.style.cssText='display:none;position:fixed;right:6px;bottom:6px;z-index:99998;background:rgba(0,0,0,.6);color:#9f9;font:700 11px monospace;padding:2px 6px;border-radius:4px;pointer-events:none;';document.body.appendChild(b);}
  b.style.display=SETTINGS.fps?'block':'none';
  if(SETTINGS.fps&&!_fpsOn){_fpsOn=true;_fpsT=performance.now();(function f(){_fpsN++;const n=performance.now();if(n-_fpsT>=1000){b.textContent=Math.round(_fpsN*1000/(n-_fpsT))+' FPS';_fpsN=0;_fpsT=n;}if(SETTINGS.fps)requestAnimationFrame(f);else _fpsOn=false;})();}
}
function applyAllSettings(){
  const tl=document.getElementById('touchLayer');
  if(tl)tl.style.display=SETTINGS.touchEnabled?'block':'none';
  const ab=document.getElementById('abilityBtns');
  if(ab)ab.style.display=SETTINGS.abilityBtns?'flex':'none';
  setJoySize(SETTINGS.joySize||'normal');applyJoyOp();applyGrafik();applyFps();atmosferUygula(SETTINGS.atmosfer);
  if(typeof SES!=='undefined')SES.hacim();
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

