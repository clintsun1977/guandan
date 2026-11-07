/* ---------- 房主回到牌局: the host's page keeps the table in this browser, so a refresh or a closed page can take it up again ---------- */
// The whole game runs on the host's page, so before this a refresh or a closed tab lost the round being played. Now, after every
// move, the host's page keeps in this browser the table as it stands (the same picture a friend who drops out is sent when they
// come back: every hand, the plays so far, whose turn, the tribute), with the room number, who sat where and the round's record
// for the AI collector. Opened again in the same browser, the page goes straight back to the game (no button in the lobby): the
// room opens again under the same number and the table is exactly as it was. The friends' seats are played by the computer until they press
// 「回到游戏」 (or enter the room number again and take their seat), as when a friend drops out. Kept three hours; a match that
// is over, or the host leaving with 退出, forgets it
const HR_KEY='guandan-host-table-v1',HR_KEEP_MS=3*3600000;
function hrLoad(){
  try{const d=JSON.parse(localStorage.getItem(HR_KEY)||'null');return d&&d.v===1&&d.snap&&d.code&&Date.now()-d.savedAt<HR_KEEP_MS?d:null}
  catch(_){return null}
}
function hrClear(){try{localStorage.removeItem(HR_KEY)}catch(_){}}
// the host left with 退出: forgotten, and not kept again as the page goes away
let hrQuit=false;
function hrForget(){hrQuit=true;hrClear()}
// after every move the host applies, every few seconds, and as the page goes away
function hrSave(){
  if(hrQuit||NET.mode!=='host'||!NET.started||TEST||ENDG||SPEC||!G||G.phase==='start')return;
  if(G.phase==='over'){hrClear();return}
  const s=REC.byGame.get(G);
  const d={v:1,savedAt:Date.now(),code:NET.code,hostDir:NET.hostDir,myDir,nick:myNick,names:NET.names,rules:RULES,snap:snapG(),
    ml:ML.g===G?{id:ML.id,seats:ML.seats,base:ML.base}:null,
    rec:s&&s.rec?{match:s.match,seats:s.seats,rec:s.rec,elapsed:performance.now()-s.t0}:null};
  try{localStorage.setItem(HR_KEY,JSON.stringify(d))}catch(_){}
}
setInterval(hrSave,3000);
addEventListener('pagehide',hrSave);
// open the same room number again: the old page's hold on it is let go a few seconds after it closed, so ask again until it is free
function hrRestore(){
  const d=hrLoad();
  if(!d||!peerReady())return;
  leaveNet();
  myNick=d.nick;$('#nick').value=d.nick;myDir=d.myDir;
  Object.assign(RULES,d.rules);
  let tries=0;
  const open=()=>{
    const peer=new Peer(ROOM_PREFIX+d.code);
    NET.peer=peer;
    lobbyStatus(`正在找回房间 ${d.code}…`,true);
    peer.on('open',()=>{if(NET.peer!==peer)return;NET.peerOpen=true;NET.code=d.code;hrResume(d)});
    peer.on('error',err=>{
      if(NET.peer!==peer)return;
      if(err.type==='unavailable-id'&&++tries<=24){peer.destroy();lobbyStatus(`房间 ${d.code} 还没释放，正在重试…`,true);setTimeout(open,2500);return}
      lobbyStatus(err.type==='unavailable-id'?`房间 ${d.code} 一直被占用，刷新页面再试`:'连不上刚才的房间，请检查网络后刷新页面再试');
    });
    hostListen(peer);
  };
  open();
}
// the room is open again: the table as it was, the friends' seats with the computer until they come back
function hrResume(d){
  NET.started=true;NET.names=d.names;
  enterOnline('host',d.hostDir,d.names);
  resetGame();
  Object.assign(G,loadSnap(d.snap,0),{tok:G.tok+1,myOrder:[],fixed:[],rest:[],fresh:[],pw:[],busy:false,stepWait:null});
  setHumans([0],d.names);
  // the round's record goes on where it stopped (its clock counts the time the page was away), and the match keeps its ID
  if(d.ml)Object.assign(ML,{g:G,id:d.ml.id,seats:d.ml.seats.slice(),base:d.ml.base});
  if(d.rec)REC.byGame.set(G,{match:d.rec.match,seats:d.rec.seats,rec:d.rec.rec,t0:performance.now()-d.rec.elapsed-(Date.now()-d.savedAt)});
  sel=new Set();hideOverlay();pileRebuild();botPreload();
  const c=G.clock;G.clock=null;
  if(G.phase==='shuffle'||G.phase==='cut'){G.busy=false;if(G.phase==='shuffle')startShuffle();else startCut()}
  else if(G.phase==='deal')finishDeal();
  else if(G.phase==='tribute')runGives();
  else if(G.phase==='tribPick')tribWait();
  else if(G.phase==='return')retWait();
  else if(G.phase==='prep'){G.clock=c&&c.who==='prep'?c:{who:'prep',left:PREP_MS,total:PREP_MS};render()}
  else if(G.phase==='play'){
    // a finished trick that was still on show: it is turned over and its winner leads, as after a live page update
    if(G.turn===-1){
      G.heapN+=(G.trickPlays||[]).reduce((s,t)=>s+t.play.cards.length,0);G.trickPlays=[];
      G.trick=null;G.passes=0;G.last=[null,null,null,null];G.turn=G.nextLeader??G.leader??0;G.tribHold=false;
    }
    startTurn();
  }
  else if(G.phase==='roundEnd'||G.phase==='over'){G.reveal=4;render();showResult()}
  render();
  hrSave();
  // said on the table for five seconds (the computers may play on meanwhile)
  $('#msg').textContent=`已回到刚才的牌局，房间号 ${d.code}，朋友点「回到游戏」就能回来`;$('#msg').classList.remove('err');
  clearTimeout(msgTimer);msgTimer=setTimeout(()=>{msgTimer=0;renderMsg()},5000);
}
