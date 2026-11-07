function resetGame(){
  // levels start at 2 for both sides; lvlTeam counts from the host's side, so a seat across a gap of one sees it flipped
  G={levels:[2,2],lvlTeam:NET.off%2,L:2,round:0,hands:[[],[],[],[]],trick:null,passes:0,last:[null,null,null,null],
     out:[],prevOut:null,turn:-1,phase:'start',notice:'',fresh:[],returns:[],leader:0,result:null,tok:(G&&G.tok||0)+1,
     trickPlays:[],heapN:0,ready:[],aFails:[0,0],aOut:null,nextReady:[]};
  applyStart();
}
// 选级: the state chosen in the lobby is the first match's start: each side's level, the side whose level is played, the order the
// last round ended in (so the tribute is paid straight away) and the tries at A already missed. Seats are named by direction, so
// each page works out for itself which of its own seats and sides they are. It is used once; a new match starts from 2
function levelChosen(){
  return(RULES.lvSN||2)!==2||(RULES.lvEW||2)!==2||!!RULES.playSide||(RULES.order||[]).some(Boolean)||(RULES.aSN||0)>0||(RULES.aEW||0)>0;
}
function applyStart(){
  if(NET.startDone||!levelChosen())return;
  const hd=NET.mode==='solo'?myDir:NET.hostDir;
  if(!DIRS.includes(hd))return;
  const tl=d=>toLocal(absOf(d,hd)),tOf=side=>tl(side[0])%2;
  G.levels[tOf('SN')]=RULES.lvSN||2;G.levels[tOf('EW')]=RULES.lvEW||2;
  const o=RULES.order||[],full=o.length===4&&o.every(Boolean);
  const side=RULES.playSide||(full?('SN'.includes(o[0])?'SN':'EW'):('SN'.includes(hd)?'SN':'EW'));
  G.lvlTeam=tOf(side);G.L=G.levels[G.lvlTeam];
  G.aFails=[0,0];G.aFails[tOf('SN')]=RULES.aSN||0;G.aFails[tOf('EW')]=RULES.aEW||0;
  if(full)G.prevOut=o.map(tl);
}
function newGame(){
  resetGame();render();
  botPreload();
  if(isHost())act(roundEvt(true));
}
