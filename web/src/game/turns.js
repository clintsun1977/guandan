function startPlay(leader){
  recStart(leader);
  G.phase='play';G.turn=leader;G.clock=null;
  if(TEST)testRoundStart();
  if((G.trib&&G.trib.length)||G.kang){
    G.turn=-1;G.nextLeader=leader;G.tribHold=true;
    render();
    later(()=>{G.tribHold=false;G.turn=leader;startTurn()},TEST?0:TRIB_SHOW_MS);
    return;
  }
  startTurn();
}

const active=i=>G.hands[i].length>0;
function nextActive(i){for(let k=1;k<=4;k++){const j=(i+k)%4;if(active(j))return j}return i}

function later(fn,ms){const t=G.tok;setTimeout(()=>{if(G.tok===t)fn()},ms)}

// fewer cards in hand than the play on the table has: nothing you hold can beat it (not even a bomb, which takes four), so
// the pass is made for you after a moment, nothing to wait for
function autoPassShort(){
  const cur=G.trick&&G.trick.play;
  if(TEST||SPEC||!cur||G.hands[0].length>=cur.n)return;
  const tok=G.tok,len=G.log.length;
  const go=()=>{
    if(G.tok!==tok||G.log.length!==len||G.phase!=='play'||G.turn!==0||!G.trick)return;
    if(G.paused){setTimeout(go,500);return}
    setMsg('牌数不够，管不上，自动过');
    onPass();
  };
  setTimeout(go,900);
}

function startTurn(){
  hints=[];hintIdx=0;
  // the test version stops before every turn, yours as much as a computer's, until the space bar (or 继续) is pressed,
  // so each step can be looked at and commented on before the next one is made
  // (your own turn needs no stop: after 4号 the game goes straight to you; a copy of the game is kept at its start all the same)
  if(TEST&&!SPEC&&G.phase==='play'&&G.turn>=0){
    // (no stop after your own move either: the game goes straight on to the next player)
    const after0=G.log.length>0&&G.log[G.log.length-1].p===0;
    if(G.turn!==0&&!G.stepGo&&!after0){G.stepWait=G.turn;G.turn=-1;G.nextLeader=-1;G.clock=null;testSnap();render();return}
    testSnap();
  }
  G.stepGo=false;
  render();
  if(G.phase!=='play')return;
  const p=G.turn;
  NET.pending=false;
  if(p===0&&isHumanSeat(0)&&!SPEC){
    const cur=G.trick?G.trick.play:null;
    hints=sortHints(genPlays(G.hands[0],G.L).filter(pl=>beats(pl,cur)));
    Sound.play('turn');
    G.clock=turnClock(0);
    render();
    autoPassShort();
    return;
  }
  // a friend's turn: their clock runs here too, and their move arrives as an event
  if(isHumanSeat(p)){G.clock=turnClock(p);renderClocks();return}
  // once you are out the computers stop pretending to think so long; only the host's computers actually move
  // the test version gives the computer more time, so each play can be followed
  const think=TEST?0:active(0)?AI_THINK_MIN+Math.random()*(AI_THINK_MAX-AI_THINK_MIN):400+Math.random()*300;
  G.clock=turnClock(p,{think:isHost()?think:undefined});
  if(isHost()&&!TEST)botStart(p);
  renderClocks();
}

