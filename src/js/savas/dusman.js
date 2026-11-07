// ═══════════════════════════════════════════════════════
// DÜŞMAN
// ═══════════════════════════════════════════════════════
function spawnEnemy(isBoss){
  const g=modelYap(isBoss?'dusman_boss':'dusman',{cubuk:true});const hpBg=g.userData.hpBg,hpFl=g.userData.hpFl;
  const a=Math.random()*Math.PI*2,dist=28+Math.random()*3;const ex=Math.cos(a)*dist,ez=Math.sin(a)*dist;
  g.position.set(ex,0,ez);S3.add(g);
  const maxHp=isBoss?160:18+wave*4;
  enemies.push({id:newNetId(),mesh:g,hpFl:hpFl,hpBg:hpBg,govde:g.userData.govde,mid:isBoss?'dusman_boss':'dusman',hp:maxHp,maxHp:maxHp,x:ex,z:ez,spd:.055+wave*.005,isBoss:isBoss,hurtT:0});
}
function spawnWave(n){waveActive=true;const cnt=3+n*2,isBoss=n%5===0;showWave(isBoss?'⚠ BOSS DALGASI — İsyancı Reis!':'⚔ Dalga '+n+' — '+cnt+' Düşman');for(let i=0;i<cnt;i++)spawnEnemy(isBoss&&i===0);}

