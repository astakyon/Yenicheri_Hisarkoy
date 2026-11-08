// ═══════════════════════════════════════════════════════
// SES — WebAudio ile üretilen basit efektler ve Hicaz dizili sakin müzik (v1.76)
// Dosya yok: her şey kodla üretilir. İlk dokunuş/tuş ile başlar (tarayıcı kuralı).
// ═══════════════════════════════════════════════════════
const SES={
  ctx:null,ana:null,muzikG:null,efektG:null,muzikT:null,nota:0,
  baslat:function(){
    if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return;}
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      this.ctx=new AC();
      this.ana=this.ctx.createGain();this.muzikG=this.ctx.createGain();this.efektG=this.ctx.createGain();
      this.muzikG.connect(this.ana);this.efektG.connect(this.ana);this.ana.connect(this.ctx.destination);
      this.hacim();this.muzikBaslat();
    }catch(e){this.ctx=null;}
  },
  hacim:function(){
    if(!this.ctx)return;
    const s=SETTINGS,sessiz=s.sessiz?0:1;
    this.ana.gain.value=sessiz*(s.master/100);
    this.muzikG.gain.value=.5*(s.muzik/100);
    this.efektG.gain.value=(s.efekt/100);
  },
  ton:function(f,sure,tip,vol,hedefG,gec,f2){
    if(!this.ctx||this.ctx.state!=='running')return;
    const t=this.ctx.currentTime+(gec||0),o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=tip||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+sure);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+sure);
    o.connect(g);g.connect(hedefG||this.efektG);o.start(t);o.stop(t+sure+.05);
  },
  tik:function(){this.ton(660,.07,'triangle',.18);this.ton(990,.06,'triangle',.1,null,.03);},
  vur:function(){this.ton(220,.12,'sawtooth',.16,null,0,90);this.ton(1400,.05,'square',.05);this.titre(12);},
  topla:function(){this.ton(880,.09,'sine',.14);this.ton(1320,.14,'sine',.12,null,.07);},
  zafer:function(){[523,659,784,1047].forEach((f,i)=>this.ton(f,.35,'triangle',.18,null,i*.13));},
  titre:function(ms){if(SETTINGS.titresim&&navigator.vibrate){try{navigator.vibrate(ms);}catch(e){}}},
  // Hicaz: D Eb F# G A Bb C# D — sakin, yavaş rastgele yürüyüş + alçak sürekli ses
  muzikBaslat:function(){
    if(!this.ctx||this.muzikT)return;
    const dizi=[293.66,311.13,369.99,392,440,466.16,554.37,587.33];
    const cal=()=>{
      if(!this.ctx)return;
      if(SETTINGS.muzik>0&&!SETTINGS.sessiz&&!document.hidden){
        this.nota=Math.max(0,Math.min(dizi.length-1,this.nota+(Math.random()<.5?-1:1)*(1+(Math.random()<.3?1:0))));
        this.ton(dizi[this.nota],2.4,'triangle',.22,this.muzikG);
        if(Math.random()<.35)this.ton(dizi[(this.nota+2)%dizi.length]/2,3.2,'sine',.14,this.muzikG,.4);
        if(!this._drone||this._drone<Date.now()){this.ton(73.42,9,'sine',.2,this.muzikG);this._drone=Date.now()+8000;}
      }
      this.muzikT=setTimeout(cal,1700+Math.random()*900);
    };
    cal();
  }
};
['pointerdown','keydown','touchstart'].forEach(function(ev){window.addEventListener(ev,function(){SES.baslat();},{passive:true});});
document.addEventListener('click',function(e){
  const t=e.target&&e.target.closest&&e.target.closest('.mBtn,.panBtn,.zmX,.mIco,.wmCard,.ayTab,.hkBtn,.pfAv,.meSmallBtn,#wmClose,.mBtnS');
  if(t)SES.tik();
},true);
