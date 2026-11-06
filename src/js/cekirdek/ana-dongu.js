// ═══════════════════════════════════════════════════════
// ANA DÖNGÜ
// ═══════════════════════════════════════════════════════
function loop(){
  requestAnimationFrame(loop);
  if(document.getElementById('menuLayer').style.display!=='none')drawMenu();
  if(!S3||!REN)return;
  const dt=CLK?Math.min(CLK.getDelta(),.05):.016;
  update(dt);
}
loop();
convertExistingMapsToEditor(); // Kışla & Av Ormanı'nı editör formatına bir kerelik dönüştür
