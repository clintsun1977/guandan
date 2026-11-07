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

function startTurn(){
  hints=[];hintIdx=0;
  // 残局: the table shows the position as it stands; nobody plays it here. The computers work on it by themselves (see endgameTrain), and
  // what they come to is looked at in the replay
  if(ENDG&&G.endgame&&G.phase==='play'){G.stepWait=null;G.clock=null;render();endgameTrain();return}
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
    G.clock={who:0,left:PLAY_MS,total:PLAY_MS};
    render();
    return;
  }
  // a friend's turn: their clock runs here too, and their move arrives as an event
  if(isHumanSeat(p)){G.clock={who:p,left:PLAY_MS,total:PLAY_MS};renderClocks();return}
  // once you are out the computers stop pretending to think so long; only the host's computers actually move
  // the test version gives the computer more time, so each play can be followed
  const think=TEST?0:active(0)?AI_THINK_MIN+Math.random()*(AI_THINK_MAX-AI_THINK_MIN):400+Math.random()*300;
  G.clock={who:p,left:PLAY_MS,total:PLAY_MS,think:isHost()?think:undefined};
  if(isHost()&&!TEST)botStart(p);
  renderClocks();
}

