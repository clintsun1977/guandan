function doPlay(p,play){
  if(G.phase!=='play'||G.turn!==p)return;
  // the clock goes at once, before the cards are laid out, so the plate is back to its own size for them
  G.clock=null;renderClocks();
  if(G.notice&&(play||G.trick))G.notice='';
  if(play)Sound.play(isBomb(play)?'bomb':'play',play.type==='jokers'||play.n>=6);
  else Sound.play('pass');
  if(play){
    let origins=null;
    if(p===0){
      origins={};
      for(const c of play.cards){
        const el=handEl.querySelector(`.card[data-id="${c.id}"]`);
        if(el){const r=el.getBoundingClientRect();origins[c.id]={x:r.left+r.width/2,y:r.top+r.height/2}}
      }
    }
    const goesOut=G.hands[p].every(c=>play.cards.includes(c));
    if(goesOut){G.out.push(p);G.reveal=G.out.length;showPlace(p===0?$('#myPlace'):$('#seat'+p+' .place'),G.out.length-1)}
    pileThrow(p,play,origins,true);
    G.trickPlays.push({p,play:{type:play.type,value:play.value,n:play.n,cards:play.cards}});
    G.seen.push(...play.cards); // every card played this round, for the computer's card memory
    G.log.push({p,cards:play.cards,lead:!G.trick,type:play.type,value:play.value,n:play.n,...(G.mcNote&&G.mcNote.p===p?{mq:G.mcNote.q,mn:G.mcNote.n}:null)}); // and who played what, in order, leading or following
    G.mcNote=null; // (in a 残局: how many levels the search expected from the move, and how many tries it made)
    const ids=new Set(play.cards.map(c=>c.id));
    G.hands[p]=G.hands[p].filter(c=>!ids.has(c.id));
    G.trick={player:p,play};
    G.passes=0;
    G.last[p]={play};
    if(p===0){sel=new Set();G.fresh=[]}
    if(goesOut){
      celebrate(p,G.out.length-1);
      if(roundOver()){finishRound();return}
    }
  }else{
    G.passes++;
    G.last[p]='pass';
    G.log.push({p,cards:null});
  }
  advance();
}
function roundOver(){return(!active(0)&&!active(2))||(!active(1)&&!active(3))}
function advance(){
  const winner=G.trick.player;
  const others=[0,1,2,3].filter(i=>i!==winner&&active(i)).length;
  if(G.passes>=others){
    let leader=winner,jf=null;
    if(!active(winner)){
      const mate=(winner+2)%4;
      leader=active(mate)?mate:nextActive(winner);
      G.notice=`${NAMES[leader]}接风，获得出牌权。`;
      jf={from:winner,to:leader};
    }
    G.turn=-1;G.nextLeader=leader;
    render();
    later(()=>{
      pileSweep();
      G.heapN+=G.trickPlays.reduce((s,t)=>s+t.play.cards.length,0);G.trickPlays=[];
      G.trick=null;G.passes=0;G.last=[null,null,null,null];G.turn=leader;startTurn();
      if(jf)jieFeng(jf.from,jf.to);
    },trickHold());
    return;
  }
  G.turn=nextActive(G.turn);
  startTurn();
}
function finishRound(){
  // the losing side's remaining players fill in the last places, in turn order
  let i=G.out[G.out.length-1];
  const k0=G.out.length;
  for(let k=1;k<=4;k++){const j=(i+k)%4;if(!G.out.includes(j))G.out.push(j)}
  const first=G.out[0],team=first%2,mate=(first+2)%4;
  const pos=G.out.indexOf(mate);
  const up=pos===1?3:pos===2?2:1;
  const before=G.levels[team];
  let win=false;
  const aTeam=G.lvlTeam,atA=G.L===14,once=RULES.aFail==='once';
  // (一次机会: a side that has used its three tries can no longer win by passing A, it only plays on at A)
  if(G.lvlTeam===team&&before===14&&pos<=2&&!(once&&G.aOut===team))win=true;
  else G.levels[team]=Math.min(14,before+up);
  const after=G.levels[team];
  // each side gets three tries at A: after the third miss the match is drawn, or that side starts again from 2, or (一次机会)
  // the other side gets one round at A when its turn comes: passing it wins the match, missing it draws the match
  let aTry=0,draw=false,reset=false,spent=false,lastTry=false;
  if(atA&&!win){
    const f=G.aFails||(G.aFails=[0,0]);
    if(once){
      if(G.aOut==null){aTry=++f[aTeam];if(aTry>=3){G.aOut=aTeam;spent=true}}
      else if(aTeam!==G.aOut){draw=true;lastTry=true}
    }else{
      aTry=++f[aTeam];
      if(aTry>=3){if(RULES.aFail==='draw')draw=true;else{G.levels[aTeam]=2;f[aTeam]=0;reset=true}}
    }
  }
  G.result={order:G.out.slice(),team,up,before,after,win,draw,reset,aTry,aTeam,spent,lastTry,aOut:G.aOut,playedLevel:G.L};
  if(TEST)testRoundEnd();
  G.prevOut=G.out.slice();
  G.lvlTeam=team;
  G.phase=win||draw?'over':'roundEnd';
  G.turn=-1;G.reveal=k0;
  render();
  // the end of a round plays out like a real table: the last trick stays face up for a moment,
  // then gets turned over onto the pile, then the places are called out one by one, then the result
  later(()=>{
    pileSweep();Sound.play('shuffle');
    G.heapN+=G.trickPlays.reduce((s,t)=>s+t.play.cards.length,0);G.trickPlays=[];G.last=[null,null,null,null];
    if(miniMode())testPlays();
  },END_SHOW_MS);
  // places already earned during play are on the plates; the rest (always including last place) are called out now
  const dbl=G.out[0]%2===G.out[1]%2;
  // and whoever is caught with cards left lays them face up on the table for everyone to see
  for(let k=k0;k<4;k++)later(()=>{G.reveal=k+1;render();showRest(G.out[k]);celebrate(G.out[k],k,dbl)},END_SHOW_MS+700+(k-k0)*500);
  later(()=>{
    if(win)victory(team,showResult);
    else if(draw)tieGame(showResult)
    else{Sound.play(team===0?'win':'lose');showResult()}
  },END_SHOW_MS+700+(4-k0)*500+1400);
}
const END_SHOW_MS=2600; // how long the final trick stays face up

