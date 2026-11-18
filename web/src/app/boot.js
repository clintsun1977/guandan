/* ---------- boot (keeps the game across live page updates) ---------- */
function boot(data){
  if(data&&data.G&&data.G.hands&&data.G.phase!=='start'){
    G=data.G;G.tok++;sel=new Set();
    G.trickPlays=G.trickPlays||[];G.heapN=G.heapN||0;G.seen=G.seen||[];G.log=G.log||[];
    if(G.phase==='play'&&G.turn===-1){
      G.heapN+=G.trickPlays.reduce((s,t)=>s+t.play.cards.length,0);G.trickPlays=[];
      G.trick=null;G.passes=0;G.last=[null,null,null,null];G.turn=G.nextLeader??G.leader??0;
    }
    pileRebuild();
    if(G.phase==='shuffle'||G.phase==='cut'){G.busy=false;beginDeal();return}
    if(G.phase==='deal'){finishDeal();return}
    if(G.phase==='tribute'){runGives();return}
    if(G.phase==='tribPick'){G.clock=null;tribWait();return}
    if(G.phase==='play'){
      startTurn();
    }else{if(G.phase==='roundEnd'||G.phase==='over')G.reveal=4;render();if(G.phase==='roundEnd'||G.phase==='over')showResult()}
  }else{
    showStart();
    autoEnter();
    // a host's table kept by an earlier version of the page (it took the host straight back after a refresh): no longer used
    try{localStorage.removeItem('guandan-host-table-v1')}catch(_){}
  }
}
// a page reloaded by autoGo (network/guest.js) goes straight on: to watch the room it left, or to take the seat that was freed for it
function autoEnter(){
  let o=null;
  try{o=JSON.parse(sessionStorage.getItem('guandan-auto')||'null');sessionStorage.removeItem('guandan-auto')}catch(_){}
  if(!o||Date.now()-o.t>60000||!/^\d{4}$/.test(o.code||'')||!myNick)return;
  if(o.act==='watch'){$('#specCode').value=o.code;$('#specGo').click()}
  else if(o.act==='join'){setMode('join');$('#roomCode').value=o.code;$('#joinBtn').click()}
}
