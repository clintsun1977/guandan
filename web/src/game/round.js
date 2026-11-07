// the host shuffles: the deck order, who cuts and (first round) who leads all travel in the event. Before it goes out
// the host quietly looks at the four hands it would make (every fourth card, as they are dealt): if any hand would
// hold six or more cards of one rank, or all four jokers, the deck is shuffled once more and dealt as it comes
function roundEvt(reset){
  const cutter=!reset&&G.prevOut?toAbs(G.prevOut[0]):Math.random()*4|0;
  let deck=shuffle(makeDeck());
  if(lopsided(deck))deck=shuffle(makeDeck());
  return{k:'round',reset,deck:deck.map(c=>c.id),cutter,first:Math.random()*4|0};
}
function lopsided(deck){
  for(let h=0;h<4;h++){
    const n={};let jokers=0;
    deck.forEach((c,i)=>{if(i%4!==h)return;if(c.r>=16)jokers++;else n[c.r]=(n[c.r]||0)+1});
    if(jokers===4||Object.values(n).some(k=>k>=6))return true;
  }
  return false;
}
function startRound(e){
  if(e.reset){resetGame();NET.startDone=true}
  if(G.paused)setPaused(false);
  G.tok++;
  G.round++;
  G.shown=null; // the new round's levels show now
  G.L=G.levels[G.lvlTeam];
  const byId=new Map(makeDeck().map(c=>[c.id,c]));
  G.deck=e.deck.map(id=>byId.get(id));
  G.hands=[[],[],[],[]];
  G.trick=null;G.passes=0;G.last=[null,null,null,null];G.out=[];G.fresh=[];G.result=null;
  G.turn=-1;G.notice='';G.trib=[];G.kang=null;G.returns=[];G.gives=[];G.afterTrib=false;G.clock=null;G.stepWait=null;G.busy=false;G.reveal=0;G.trickPlays=[];G.heapN=0;G.seen=[];G.log=[];G.pw=[];G.rest=[];G.myOrder=[];G.fixed=[];pileRebuild();G.dealCount=0;
  // as at a real table: the last round's first-out cuts and the player before them shuffles
  // (the very first round picks the cutter at random)
  G.cutter=toLocal(e.cutter);G.firstLeader=toLocal(e.first);
  G.shuffler=(G.cutter+3)%4;
  G.dealIdx=G.cutter;G.ready=[];G.nextReady=[];NET.pending=false;
  sel=new Set();
  hideOverlay();
  removeDeck();
  startShuffle();
}
