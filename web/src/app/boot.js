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
    // a host's table kept by an earlier version of the page (it took the host straight back after a refresh): no longer used
    try{localStorage.removeItem('guandan-host-table-v1')}catch(_){}
  }
}
