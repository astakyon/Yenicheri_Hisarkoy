// ═══════════════════════════════════════════════════════
// OTURUM (Session) — tek ve çok oyunculu için ortak host yolu
// Tek kişilik = "sıfır eşli host": girdi LoopbackTransport'tan geçip aynı host koduna ulaşır.
// Çok oyunculuda aynı arayüzü PeerJS taşıması sağlayacak (F2).
// ═══════════════════════════════════════════════════════
class LoopbackTransport{
  constructor(){this.kuyruk=[];}
  send(msg){this.kuyruk.push(msg);}            // yerel host'a teslim
  poll(){const m=this.kuyruk;this.kuyruk=[];return m;}
}
const SESSION={
  isHost:true,
  transport:new LoopbackTransport(),
  inputs:new Map(),                              // oyuncu id -> son girdi komutu
  submitLocal:function(cmd){this.transport.send({t:'input',id:WORLD.localId,cmd:cmd});},
  // Bir tik: gelen girdileri al, her oyuncuyu kendi komutuyla hareket ettir
  step:function(dt){
    this.transport.poll().forEach(function(m){if(m.t==='input')SESSION.inputs.set(m.id,m.cmd);});
    WORLD.players.forEach(function(p,id){
      const c=SESSION.inputs.get(id);
      if(c&&p.mesh)movePlayer(p,c,dt);
    });
  }
};
