// ═══════════════════════════════════════════════════════
// KARAKTER
// ═══════════════════════════════════════════════════════
function createPlayerMesh(){return _yeniceriYap();}
function buildPlayer(){
  const g=createPlayerMesh();S3.add(g);pl.mesh=g;g.position.set(pl.x,0,pl.z);
  if(SESSION.haritaDegisti)SESSION.haritaDegisti();   // host: uzak oyuncuları yeni sahneye al
}

