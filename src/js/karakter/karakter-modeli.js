// ═══════════════════════════════════════════════════════
// KARAKTER
// ═══════════════════════════════════════════════════════
function buildPlayer(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(.9,1.5,.55),new THREE.MeshLambertMaterial({color:0x9B2020}));body.position.y=1.15;body.castShadow=true;g.add(body);
  const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.5,.62,.8,8),new THREE.MeshLambertMaterial({color:0x8B1818}));skirt.position.y=.55;g.add(skirt);
  [-0.22,0.22].forEach(ox=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.36,.9,.4),new THREE.MeshLambertMaterial({color:0x501010}));leg.position.set(ox,.45,0);g.add(leg);const bt=new THREE.Mesh(new THREE.BoxGeometry(.36,.3,.5),new THREE.MeshLambertMaterial({color:0x2a1000}));bt.position.set(ox,.15,.05);g.add(bt);});
  const head=new THREE.Mesh(new THREE.BoxGeometry(.62,.58,.55),new THREE.MeshLambertMaterial({color:0xC8956C}));head.position.y=2.15;head.castShadow=true;g.add(head);
  const must=new THREE.Mesh(new THREE.BoxGeometry(.35,.08,.1),new THREE.MeshLambertMaterial({color:0x3a2000}));must.position.set(0,2.05,.28);g.add(must);
  const bork=new THREE.Mesh(new THREE.CylinderGeometry(.2,.33,.75,8),new THREE.MeshLambertMaterial({color:0xD4B050}));bork.position.set(0,2.65,0);g.add(bork);
  const borkT=new THREE.Mesh(new THREE.CylinderGeometry(.06,.2,.5,6),new THREE.MeshLambertMaterial({color:0xFFD700}));borkT.position.y=.62;bork.add(borkT);
  const wpn=new THREE.Mesh(new THREE.BoxGeometry(.07,1.1,.05),new THREE.MeshLambertMaterial({color:0xD0D0D0}));wpn.name='wpn';wpn.position.set(.58,1.4,0);wpn.rotation.z=-.28;g.add(wpn);
  g.castShadow=true;S3.add(g);pl.mesh=g;g.position.set(pl.x,0,pl.z);
}

