// ═══ KARİYER (v1.85): tam sayfa harita yolu — sol ikon çubuğu (Devam Et, Hikaye, Serbest, Karakterim, Yeni Oyun), altın noktalı yolda haritalar, altta seçili harita ═══
let KARIYER_DON=false;   // alt sayfadan (Hikaye vb.) kapanınca Kariyer'e dön
function kariyerAc(){KARIYER_DON=false;kariyerCiz();document.getElementById('kariyerBox').style.display='flex';}
function kariyerKapat(){document.getElementById('kariyerBox').style.display='none';KARIYER_DON=false;if(typeof menuProfilGuncelle==='function')menuProfilGuncelle();}
// Kariyer'den bir alt sayfaya git; alt sayfa kapanınca Kariyer'e dönülür
function kariyerGit(fn){document.getElementById('kariyerBox').style.display='none';KARIYER_DON=true;fn();}
function kariyerDon(){if(KARIYER_DON){KARIYER_DON=false;kariyerCiz();document.getElementById('kariyerBox').style.display='flex';}}
let KARIYER_SEC='kisla';   // yolda seçili harita
function kariyerSec(id){KARIYER_SEC=id;kariyerCiz();}
// Haritaların yoldaki konumu (% — yatay: x,y). Dikey ekranda x/y yer değiştirir.
const KY_PT=[[10,70],[22,42],[34,66],[46,36],[58,62],[70,32],[80,58],[90,28]];
function kariyerCiz(){
  const lv=SAVE.level||1,fame=SAVE.fame||0;
  let sonraki=null,onceki=FAME_TITLES[0];
  FAME_TITLES.forEach(function(t){if(fame>=t.min)onceki=t;else if(!sonraki)sonraki=t;});
  const xy=Math.min(100,Math.round((SAVE.xp||0)/(SAVE.xpNext||100)*100));
  const fy=sonraki?Math.min(100,Math.round((fame-onceki.min)/(sonraki.min-onceki.min)*100)):100;
  const ic=function(d){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';};
  const nav=function(d,ad,fn,cls){return '<button class="mBtn'+(cls?' '+cls:'')+'" onclick="'+fn+'"><span class="kyIc">'+ic(d)+'</span><span class="kyLb">'+ad+'</span></button>';};
  let h='<div class="ovHead kyHead"><div class="panTitle">KARİYER</div>'
   +'<div class="kyRank"><span class="kyLv">'+lv+'</span><div><b>'+getFameTitle().toUpperCase()+'</b><div class="pfBar"><i style="width:'+xy+'%"></i></div></div><small>XP '+(SAVE.xp||0)+'/'+(SAVE.xpNext||100)+'<br>Ün '+fame+(sonraki?'/'+sonraki.min:'')+'</small></div>'
   +'<button class="zmX" onclick="kariyerKapat()" aria-label="Kapat">✕</button></div>';
  h+='<div class="kyBody"><div class="kyNav">'
   +nav('<path d="M7 4l13 8-13 8z" fill="currentColor"/>','DEVAM ET',"kariyerKapat();haritayaGir('kisla')",'kyOn')
   +nav('<path d="M6 4h11a2 2 0 012 2v12a2 2 0 01-2 2H6zM9 9h7M9 13h7"/>','HİKAYE','kariyerGit(hikayeAc)')
   +nav('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>','SERBEST','kariyerGit(openChapters)')
   +nav('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 4-7 8-7s8 2 8 7"/>','KARAKTERİM','kariyerGit(gorunumAc)')
   +nav('<path d="M12 4v16M4 12h16"/>','YENİ OYUN','confirmReset()')
   +'</div><div class="kyMain"><div class="kyMap">';
  // yol (yatay + dikey ekran için iki ayrı çizgi)
  const yol=function(sw){let d='';KY_PT.forEach(function(p,i){const x=sw?p[1]:p[0],y=sw?p[0]:p[1];if(!i){d+='M'+x+' '+y;return;}const q=KY_PT[i-1],qx=sw?q[1]:q[0],qy=sw?q[0]:q[1];d+=sw?' C'+qx+' '+((qy+y)/2)+' '+x+' '+((qy+y)/2)+' '+x+' '+y:' C'+((qx+x)/2)+' '+qy+' '+((qx+x)/2)+' '+y+' '+x+' '+y;});return d;};
  h+='<svg class="kyPath kyPh" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="'+yol(false)+'"/></svg><svg class="kyPath kyPv" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="'+yol(true)+'"/></svg>';
  let sec=WORLD_MAPS.find(function(m){return m.id===KARIYER_SEC;})||WORLD_MAPS[0];
  WORLD_MAPS.forEach(function(m,i){
    const gerek=haritaSv(m.id),acik=lv>=gerek,pt=KY_PT[i]||[50,50];
    h+='<button class="hkKart kyNode '+(acik?'aktif':'kilit')+(m.id===sec.id?' sec':'')+'" style="--x:'+pt[0]+'%;--y:'+pt[1]+'%;--px:'+pt[1]+'%;--py:'+pt[0]+'%" onclick="kariyerSec(\''+m.id+'\')" aria-label="'+m.name+'"><i>'+(acik?m.icon:'🔒')+'</i><span>'+m.name+'</span></button>';
  });
  h+='</div>';
  const gerek=haritaSv(sec.id),acik=lv>=gerek,pr=(typeof HIKAYE!=='undefined')?HIKAYE.find(function(x){return x.harita===sec.id;}):null;
  h+='<div class="kyInfo"><div class="kyInfoT"><b>'+sec.name.toUpperCase()+'</b><small>'+sec.desc+'</small><small class="kyMeta">'+(acik?'✔ Açık':'🔒 Sv '+gerek+' gerekli ('+(gerek-lv)+' seviye kaldı)')+' · Önerilen Sv '+gerek+(pr?' · 📖 Perde '+pr.no:'')+'</small></div>';
  if(lv>=10&&!SAVE.class)h+='<button class="kySinif" onclick="kariyerKapat();document.getElementById(\'classBox\').style.display=\'flex\'">🎖 SINIFINI SEÇ</button>';
  h+=(acik?'<button class="hkBtn kyGir" onclick="haritayaGir(\''+sec.id+'\')">▶ GİR</button>':'<button class="hkBtn kyGir" disabled>🔒</button>')+'</div></div></div>';
  h+='<div class="ovFoot"><button class="panBtn" onclick="kariyerKapat()">← Ana Menü</button></div>';
  document.getElementById('kariyerPanel').innerHTML=h;
}
