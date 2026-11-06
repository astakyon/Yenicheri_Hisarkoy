// ═══════════════════════════════════════════════════════
// DÜŞMAN
// ═══════════════════════════════════════════════════════
function spawnEnemy(isBoss){
  const g=new THREE.Group();const eCol=isBoss?0x7B0000:0x4a2000;const bw=isBoss?1.3:.88,bh=isBoss?1.7:1.35;
  const body=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,isBoss?.75:.48),new THREE.MeshLambertMaterial({color:eCol}));body.position.y=isBoss?1.25:1;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.BoxGeometry(isBoss?.78:.58,isBoss?.65:.52,isBoss?.65:.5),new THREE.MeshLambertMaterial({color:0xA06840}));head.position.y=isBoss?2.25:2;g.add(head);
  if(isBoss){const crown=new THREE.Mesh(new THREE.ConeGeometry(.5,.5,6),new THREE.MeshLambertMaterial({color:0xFFD700}));crown.position.y=.75;head.add(crown);}
  const hpBg=new THREE.Mesh(new THREE.PlaneGeometry(isBoss?1.6:1.1,.14),new THREE.MeshBasicMaterial({color:0x330000,side:THREE.DoubleSide,depthTest:false}));hpBg.position.set(0,isBoss?3.1:2.9,0);g.add(hpBg);
  const hpFl=new THREE.Mesh(new THREE.PlaneGeometry(isBoss?1.6:1.1,.14),new THREE.MeshBasicMaterial({color:isBoss?0xFFD700:0x22cc55,side:THREE.DoubleSide,depthTest:false}));hpFl.position.set(0,isBoss?3.1:2.9,.01);g.add(hpFl);
  const a=Math.random()*Math.PI*2,dist=28+Math.random()*3;const ex=Math.cos(a)*dist,ez=Math.sin(a)*dist;
  g.position.set(ex,0,ez);S3.add(g);
  const maxHp=isBoss?160:18+wave*4;
  enemies.push({id:newNetId(),mesh:g,hpFl:hpFl,hp:maxHp,maxHp:maxHp,x:ex,z:ez,spd:.055+wave*.005,isBoss:isBoss,hurtT:0});
}
function spawnWave(n){waveActive=true;const cnt=3+n*2,isBoss=n%5===0;showWave(isBoss?'⚠ BOSS DALGASI — İsyancı Reis!':'⚔ Dalga '+n+' — '+cnt+' Düşman');for(let i=0;i<cnt;i++)spawnEnemy(isBoss&&i===0);}

