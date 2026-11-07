// ═══════════════════════════════════════════════════════
// ANA DÖNGÜ
// ═══════════════════════════════════════════════════════
// Sabit tik: oyun mantığı her zaman saniyede 60 tikle çalışır (ekran 60, 90 ya da 120 Hz olsa da aynı hız).
// Mantığın büyük kısmı kare sayacıyla çalıştığı için (waveTimer--, atkCd--, düşman adımı) bu şarttır.
const TIK=1/60,MAX_TIK_KARE=6;
let tikBirikim=0;
function loop(){
  requestAnimationFrame(loop);
  if(document.getElementById('menuLayer').style.display!=='none')drawMenu();
  if(!S3||!REN)return;
  tikBirikim+=CLK?Math.min(CLK.getDelta(),.25):TIK;
  let n=0;
  while(tikBirikim>=TIK&&n<MAX_TIK_KARE){if(CLIENT.aktif)clientUpdate(TIK);else update(TIK);tikBirikim-=TIK;n++;}
  if(n>=MAX_TIK_KARE)tikBirikim=0;           // çok geride kalındı (örn. sekme arka plandaydı): yakalamaya çalışma
  if(playing&&!paused&&pl.mesh)renderFrame();
}
loop();
convertExistingMapsToEditor(); // Kışla & Av Ormanı'nı editör formatına bir kerelik dönüştür
