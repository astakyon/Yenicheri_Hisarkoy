// ═══════════════════════════════════════════════════════
// OYUNCU PROFİLİ (v1.76) — ad, avatar, rütbe, unvan, istatistik, başarım vitrini
// Veri SAVE.profil içinde; oynama süresi saniye olarak sayılır.
// ═══════════════════════════════════════════════════════
const PROFIL_AVATARLAR=['🪖','⚔️','🏹','🛡️','🐺','🦅','🔥','🌙','⭐','👑'];
function profilHazirla(){
  if(!SAVE.profil||typeof SAVE.profil!=='object')SAVE.profil={};
  const P=SAVE.profil;
  if(!P.ad)P.ad='Yeniçeri';
  if(PROFIL_AVATARLAR.indexOf(P.avatar)<0)P.avatar='🪖';
  if(!P.unvan)P.unvan='rutbe';
  if(!P.id)P.id='YC-'+Math.random().toString(36).slice(2,6).toUpperCase()+Math.floor(Math.random()*90+10);
  if(!P.olusturma)P.olusturma=Date.now();
  if(typeof P.sure!=='number')P.sure=0;
  return P;
}
function profilAdTemizle(s){return String(s||'').replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü _.\-]/g,'').trim().slice(0,14);}
// Seçilebilir unvanlar: koşul sağlanınca açılır
function profilUnvanlar(){
  const hk=(typeof hikayeDurum==='function')?hikayeDurum():null;
  return [
    {id:'rutbe',ad:getFameTitle(),acik:true},
    {id:'muhafiz',ad:'Hisarköy Muhafızı',acik:!!(hk&&hk.bitti)},
    {id:'efsane',ad:'Efsane',acik:!!(SAVE.achievements&&SAVE.achievements.kills_500)},
    {id:'avci',ad:'Orman Avcısı',acik:(SAVE.stats.animalsHunted||0)>=25},
    {id:'ciftbasi',ad:'Çiftbaşı',acik:(SAVE.stats.satis||0)>=500}
  ];
}
function profilUnvanAd(){
  const P=profilHazirla(),u=profilUnvanlar().find(function(x){return x.id===P.unvan&&x.acik;});
  return u?u.ad:getFameTitle();
}
function profilSure(s){const sa=Math.floor(s/3600),dk=Math.floor(s%3600/60);return sa>0?sa+' sa '+dk+' dk':dk+' dk';}
let _profilAcik=false;
function profilAc(bolum){_profilAcik=true;profilCiz();document.getElementById('profilBox').style.display='flex';
  const b=document.querySelector('#profilPanel .ovBody');if(b){b.scrollTop=0;if(bolum==='basarim'){const e=Array.prototype.find.call(b.querySelectorAll('.pfSec'),function(x){return x.textContent.indexOf('BAŞARIM')>=0;});if(e)b.scrollTop=e.offsetTop-b.offsetTop;}}}
function profilKapat(){_profilAcik=false;document.getElementById('profilBox').style.display='none';if(typeof menuProfilGuncelle==='function')menuProfilGuncelle();}
function profilAdDegis(v){profilHazirla().ad=profilAdTemizle(v)||'Yeniçeri';saveGame();menuProfilGuncelle&&menuProfilGuncelle();}
function profilAvatarSec(a){profilHazirla().avatar=a;saveGame();profilCiz();}
function profilUnvanSec(id){const u=profilUnvanlar().find(function(x){return x.id===id;});if(u&&u.acik){profilHazirla().unvan=id;saveGame();profilCiz();}}
function profilCiz(){
  const P=profilHazirla(),st=SAVE.stats||{},hk=(typeof hikayeDurum==='function')?hikayeDurum():{tam:0,toplam:6};
  const xp=Math.max(0,Math.min(100,Math.round((SAVE.xp||0)/Math.max(1,SAVE.xpNext||100)*100)));
  const earned=ACHIEVEMENTS.filter(function(a){return SAVE.achievements[a.id];}).length;
  let h='<div class="ovHead"><div class="panTitle">👤 PROFİL</div><button class="zmX" onclick="profilKapat()" aria-label="Kapat">✕</button></div><div class="ovBody">';
  h+='<div class="pfHead"><div class="pfAvBig">'+P.avatar+'</div><div style="flex:1;min-width:0"><div class="pfName"><input id="pfAd" maxlength="14" value="'+P.ad.replace(/"/g,'')+'" onchange="profilAdDegis(this.value);this.value=SAVE.profil.ad" aria-label="Oyuncu adı"></div>';
  h+='<div class="pfRank">'+profilUnvanAd().toUpperCase()+' · SV '+(SAVE.level||1)+'</div><div class="pfBar"><i style="width:'+xp+'%"></i></div><div class="toggleSub" style="margin-top:3px">Kimlik: '+P.id+' · 🪙 '+mainGold+' akçe</div></div></div>';
  h+='<div class="pfSec">AVATAR</div><div class="pfAvs">'+PROFIL_AVATARLAR.map(function(a){return '<button class="pfAv'+(a===P.avatar?' on':'')+'" onclick="profilAvatarSec(\''+a+'\')">'+a+'</button>';}).join('')+'</div>';
  h+='<div class="pfSec">UNVAN</div><div class="pfTit">'+profilUnvanlar().map(function(u){return '<button class="ayChip'+(P.unvan===u.id?' on':'')+'" '+(u.acik?'onclick="profilUnvanSec(\''+u.id+'\')"':'disabled style="opacity:.4"')+'>'+(u.acik?'':'🔒 ')+u.ad+'</button>';}).join('')+'</div>';
  h+='<div class="pfSec">İSTATİSTİKLER</div><div class="pfStats">';
  [['Oynama süresi',profilSure(P.sure)],['Öldürülen düşman',st.kills||0],['Patron zaferi',st.bossKills||0],['En yüksek dalga',st.highWave||0],['Avlanan hayvan',st.animalsHunted||0],['Pazarda satış (akçe)',st.satis||0],['Hazine sandığı',st.hazine||0],['Toplam kazanç (akçe)',st.totalGoldEarned||0],['Hikaye perdesi',hk.tam+' / '+hk.toplam],['Başarım',earned+' / '+ACHIEVEMENTS.length]].forEach(function(r){h+='<div class="pfStat"><b>'+r[1]+'</b><span>'+r[0].toUpperCase()+'</span></div>';});
  h+='</div><div class="pfSec">BAŞARIMLAR</div><div class="pfBadges">'+ACHIEVEMENTS.map(function(a){const k=!!SAVE.achievements[a.id];return '<div class="pfBadge'+(k?'':' off')+'" title="'+a.desc+'"><i>'+a.icon+'</i>'+a.title+'</div>';}).join('')+'</div>';
  h+='</div><div class="ovFoot"><button class="panBtn grn" onclick="profilKapat()">← Geri</button></div>';
  document.getElementById('profilPanel').innerHTML=h;
}
// Oynama süresi sayacı (oyun açık, duraklatılmamış ve sekme görünürken)
setInterval(function(){
  if(typeof playing!=='undefined'&&playing&&!paused&&!document.hidden){const P=profilHazirla();P.sure++;if(P.sure%30===0)saveGame();}
},1000);
profilHazirla();
