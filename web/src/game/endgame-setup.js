// 残局: the cards are dealt as in any round (no tribute, no sorting) and the computers play all four hands, yours too, from the start, with
// no screen to draw, until every hand holds at most ENDLIM (10) cards: there play stops, wherever in a trick it is (the next player to play
// is whoever comes after the last), and the practice begins from that table. The plays so far stay in the record; the hands are open:
// G.open is set, the computers see every hand, yours too, and work with the true hands instead of guessing. (A deal in which a player
// goes out before the rest are down to ENDLIM is dropped, and dealt again)
function endgameSim(leader){
  G.trick=null;G.passes=0;G.out=[];G.log=[];G.seen=[];G.pw=[];G.open=false;
  let turn=leader;
  for(let n=0;n<1500;n++){
    const p=turn;
    let pl=aiDecide(p);
    if(!pl&&!G.trick)pl=genPlays(G.hands[p],G.L)[0]; // (a lead is always something)
    if(pl){
      G.seen.push(...pl.cards);
      G.log.push({p,cards:pl.cards,lead:!G.trick,type:pl.type,value:pl.value,n:pl.n});
      const ids=new Set(pl.cards.map(c=>c.id));
      G.hands[p]=G.hands[p].filter(c=>!ids.has(c.id));
      if(!G.hands[p].length)return null;
      G.trick={player:p,play:pl};G.passes=0;
      if(G.hands.every(h=>h.length<=ENDLIM))return(p+1)%4;
    }else{G.passes++;G.log.push({p,cards:null})}
    if(G.passes>=3){turn=G.trick.player;G.trick=null;G.passes=0}else turn=(p+1)%4;
  }
  return null;
}
// the trick on the table (who played what in it, who passed, the play to beat) worked out from the log, as the screen needs it
function endgameRestoreTrick(){
  const lg=G.log;let s0=-1;
  for(let i=lg.length-1;i>=0;i--)if(lg[i].cards&&lg[i].lead){s0=i;break}
  G.trick=null;G.passes=0;G.trickPlays=[];G.last=[null,null,null,null];
  if(s0<0)return;
  let top=null;
  for(let i=s0;i<lg.length;i++){
    const e=lg[i];
    if(e.cards){top=e;G.passes=0;G.last[e.p]={play:e};G.trickPlays.push({p:e.p,play:{type:e.type,value:e.value,n:e.n,cards:e.cards}})}
    else{G.passes++;G.last[e.p]='pass'}
  }
  G.trick={player:top.p,play:{type:top.type,value:top.value,n:top.n,cards:top.cards,wu:top.cards.filter(c=>isWild(c,G.L)).length}};
}
function endgameDeal(){
  // (the level is 2 to K: passing A would end a match, and every 残局 stands on its own)
  const L=2+Math.floor(Math.random()*12);
  G.levels=[L,L];G.L=L;
  let deck=G.deck.slice();
  for(let tries=0;tries<40;tries++){
    if(tries)deck=shuffle(makeDeck());
    for(let p=0;p<4;p++)G.hands[p]=sortHand(deck.slice(p*27,p*27+27),L);
    G.preHands=G.hands.map(h=>h.map(c=>c.id));
    const turn=endgameSim(G.firstLeader);
    if(turn==null)continue;
    G.deck=[];G.open=true;G.endgame=true;
    G.out=[];G.heapN=0;
    endgameRestoreTrick();
    G.notice=`残局：电脑已经自动打了 ${G.log.length} 手，现在每家都不超过 ${ENDLIM} 张，所有人的牌都看得见。`;
    startPlay(turn);
    return;
  }
  // (never in practice) no deal gave an endgame: a table of a few cards dealt at random
  deck=shuffle(makeDeck());
  for(let p=0;p<4;p++)G.hands[p]=sortHand(deck.splice(0,5+Math.floor(Math.random()*6)),L);
  G.seen=deck;G.deck=[];G.log=[];G.trick=null;G.open=true;G.endgame=true;G.preHands=null;
  startPlay(G.firstLeader);
}
