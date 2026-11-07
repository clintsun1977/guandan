/* ---------- events: every move goes through the host, which applies it and passes it on ---------- */
function playEvt(p,pl){
  return pl?{k:'play',p:toAbs(p),ids:pl.cards.map(c=>c.id),type:pl.type,value:pl.value,n:pl.n}:{k:'pass',p:toAbs(p)};
}
// solo and host: apply now (and, as host, send it on); a friend's page sends its move to the host and
// waits for it to come back, so every table applies the same moves in the same order
function act(e){
  if(SPEC)return;
  if(NET.mode==='guest'){
    if(NET.hostConn&&NET.hostConn.open){NET.pending=['play','pass','return','tribute'].includes(e.k);NET.pendingAt=Date.now();NET.hostConn.send({t:'act',e})}
    return;
  }
  if(applyEvt(e)&&NET.mode==='host')broadcast({t:'evt',e});
}
// apply one event if this table has reached the point where it fits; false means "not yet", so a friend's page
// keeps it queued until its own animations and pauses catch up with the host's
function applyEvt(e){
  const p=e.p!=null?toLocal(e.p):null;
  switch(e.k){
    case'round':
      if(!e.reset&&!['roundEnd','start'].includes(G.phase))return false;
      startRound(e);return true;
    case'shuffle':
      if(G.phase!=='shuffle'||G.busy)return false;
      doShuffle();return true;
    case'cut':
      if(G.phase!=='cut'||G.busy)return false;
      doCut();return true;
    case'return':{
      if(G.phase!=='return'&&G.phase!=='prep')return false;
      if(!owesReturn(p)||!G.hands[p].some(c=>c.id===e.id))return true;
      G.fresh=G.fresh.filter(id=>id!==e.id);
      if(p===0){sel=new Set();NET.pending=false}
      if(G.phase==='prep'){returnNow(p,e.id);return true}
      G.retPick[p]=e.id;
      retWait();
      return true;
    }
    case'tribute':{
      if(G.phase!=='tribPick')return false;
      if(!G.tribGivers.includes(p)||G.tribPick[p]!=null||!G.hands[p].some(c=>c.id===e.id))return true;
      G.tribPick[p]=e.id;
      if(p===0){sel=new Set();NET.pending=false}
      tribWait();
      return true;
    }
    case'ready':
      if(G.phase!=='prep')return false;
      if(!G.ready.includes(p))G.ready.push(p);
      if([...NET.humans].every(h=>G.ready.includes(h)))beginPlay();else render();
      return true;
    case'begin':
      if(G.phase!=='prep')return false;
      beginPlay();return true;
    case'next':{
      if(G.phase!=='roundEnd'&&G.phase!=='over')return false;
      const nr=G.nextReady||(G.nextReady=[]);
      if(!nr.includes(p))nr.push(p);
      if(!$('#overlay').hidden&&$('#panel').dataset.kind==='result')showResult();
      // after this event has gone out to everyone, so the new round follows it
      setTimeout(startNextIfReady,0);
      return true;
    }
    case'pause':
      // only the player who paused can resume, and a game already paused is not paused again by someone else
      if(G.paused&&G.pausedBy!==p)return true;
      setPaused(!!e.on,p);return true;
    case'humans':
      setHumans(e.list.map(toLocal),e.names);
      if(e.left)playerLeft(e.left,e.how);
      if(e.back){
        setMsg(`${e.back} 回到了游戏`);
        // the seat was the computer's a moment ago: if it was thinking about its move, the player gets the turn now
        const c=G.clock;
        if(G.phase==='play'&&c&&typeof c.who==='number'&&c.think!=null&&isHumanSeat(c.who)){G.clock={who:c.who,left:PLAY_MS,total:PLAY_MS};renderClocks()}
      }
      setTimeout(startNextIfReady,0);
      return true;
    case'play':case'pass':{
      if(G.phase!=='play'||G.turn!==p)return false;
      // your own move came back: you are no longer waiting on it (it may have ended the round, with no next turn to clear this)
      if(p===0)NET.pending=false;
      if(e.k==='pass'){doPlay(p,null);return true}
      const cards=e.ids.map(id=>G.hands[p].find(c=>c.id===id));
      if(cards.some(c=>!c))return true;
      doPlay(p,{type:e.type,value:e.value,n:e.n,cards,wu:cards.filter(c=>isWild(c,G.L)).length});
      return true;
    }
  }
  return true;
}
// a friend's page applies the host's events in order, each as soon as it fits
setInterval(()=>{
  if(NET.mode!=='guest')return;
  for(let i=0;i<20&&NET.inbox.length;i++){
    if(!applyEvt(NET.inbox[0]))break;
    NET.inbox.shift();
  }
},60);
// who is a person (local seats) and what their seats are called
function setHumans(list,names){
  NET.humans=new Set(list);
  NAMES=BASE_NAMES.slice();
  if(names)for(const a in names){const l=toLocal(+a);if(l!==0&&NET.humans.has(l))NAMES[l]=names[a]}
  if(SPEC&&names)NET.pn=[0,1,2,3].map(l=>NET.humans.has(l)&&names[l]?names[l]:'电脑');
  for(let q=1;q<4;q++)$('#seat'+q+' .name').textContent=NAMES[q];
  VC.prune();
  if(G&&G.paused&&!NET.humans.has(G.pausedBy))setPaused(false);
  if(TEST)testNames();
  if(G)render();
}

