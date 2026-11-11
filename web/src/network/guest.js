// the host starts: everyone learns where everyone sits, then the first deal goes out
function startOnline(){
  NET.started=true;NET.hostDir=myDir;
  const names={};
  for(const d of DIRS)if(NET.lobby[d])names[absOf(d,myDir)]=NET.lobby[d];
  NET.names=names;
  // each person's connection name, so the people at the table can call each other for voice
  const peers={0:NET.peer.id};
  for(const v of NET.conns.values())if(v.dir&&NET.lobby[v.dir])peers[absOf(v.dir,myDir)]=v.conn.peer;
  broadcast({t:'start',hostDir:myDir,names,rules:RULES,peers});
  enterOnline('host',myDir,names);
  newGame();
  VC.start(peers);
}
function enterOnline(mode,hostDir,names){
  NET.mode=mode;NET.hostDir=hostDir;NET.off=absOf(myDir,hostDir);
  setHumans(Object.keys(names).map(a=>toLocal(+a)),names);
  $('#myName').textContent=myNick;
  $('#lobby').hidden=true;
}
// a friend: connects to the room number and follows the host
function joinRoom(code){
  if(!peerReady())return;
  leaveNet();
  NET.resumeSent=false;
  lobbyStatus('正在连接…');
  const peer=new Peer();
  NET.peer=peer;keepSignal(peer);
  peer.on('call',c=>VC.incoming(c));
  peer.on('open',()=>{
    // (only the first time: the line to the matching server coming back (keepSignal) opens the peer again)
    if(NET.peer!==peer||NET.hostConn)return;
    const conn=peer.connect(ROOM_PREFIX+code,{reliable:true});
    NET.hostConn=conn;
    conn.on('open',()=>{NET.hostSeen=Date.now();lobbyStatus('选一个空座位');$('#roomCodeShow').textContent=code;$('#roomInfo').hidden=false;renderLobby()});
    conn.on('data',guestOnData);
    // (only the current line's closing counts: an old one closed on the way back in must not start another round)
    conn.on('close',()=>{if(NET.hostConn===conn)hostGone(true)});
    noAnswer(conn,()=>{$('#joinBtn').disabled=false;$('#roomCode').classList.add('call')});
  });
  peer.on('error',err=>{
    // (once in the room, an error is about the line to the matching server (keepSignal) or a voice call, not the room)
    if(NET.peer!==peer||(NET.hostConn&&NET.hostConn.open))return;
    lobbyStatus(err.type==='peer-unavailable'?'没有这个房间，请核对房间号':'连接失败，请检查网络后重试');
    $('#joinBtn').disabled=false;$('#roomCode').classList.add('call');
  });
}
// a room number still held for a page that has just closed or been refreshed answers nothing, and the matching server lets
// it go only when it notices (often a minute or more later): in the lobby, a join or watch that has had no answer in
// 15 seconds gives up and says so, rather than staying at 正在连接… for good (a player coming back to the table has its own wait)
function noAnswer(conn,reset){
  if(NET.mode==='guest')return;
  setTimeout(()=>{
    if(NET.hostConn!==conn||conn.open||NET.mode==='guest')return;
    leaveNet();
    lobbyStatus('房间没有回应：房主可能刚关掉或刷新了页面，请稍后再试');
    reset();
  },15000);
}
// 观战: connects to the room number and asks to watch (the host answers with the table once it is on and still)
function watchRoom(code){
  if(!peerReady()){$('#specGo').disabled=false;return}
  leaveNet();
  NET.watching=true;NET.gone=false;
  lobbyStatus('正在连接…');
  const peer=new Peer();
  NET.peer=peer;NET.specCode=code;keepSignal(peer);
  peer.on('call',c=>VC.incoming(c));
  peer.on('open',()=>{
    // (only the first time: the line to the matching server coming back (keepSignal) opens the peer again)
    if(NET.peer!==peer||NET.hostConn)return;
    const conn=peer.connect(ROOM_PREFIX+code,{reliable:true});
    NET.hostConn=conn;
    // (the page's version goes as pv, not ver: a room whose page is an older version turned away spectators whose ver differed,
    // and a new version is often put up while a game is on; a spectator watches whichever version the host has)
    conn.on('open',()=>{NET.hostSeen=Date.now();conn.send({t:'watch',name:nickNow(),pv:VERSION})});
    conn.on('data',specOnData);
    conn.on('close',()=>{if(NET.hostConn===conn)hostGone(true)});
    noAnswer(conn,()=>{NET.watching=false;$('#specGo').disabled=false});
  });
  peer.on('error',err=>{
    if(NET.peer!==peer||(NET.hostConn&&NET.hostConn.open))return;
    lobbyStatus(err.type==='peer-unavailable'?'没有这个房间，请核对房间号':'连接失败，请检查网络后重试');
    NET.watching=false;$('#specGo').disabled=false;
  });
}
function specOnData(d){
  if(!d)return;
  NET.hostSeen=Date.now();
  if(d.t==='ping'){NET.hostConn&&NET.hostConn.open&&NET.hostConn.send({t:'pong'});return}
  if(d.t==='bye'){hostGone(false);return}
  if(d.t==='old'||d.t==='specfull'){
    lobbyStatus(d.t==='old'?OLD_PAGE:'观战的人数已满，请稍后再试');
    NET.watching=false;$('#specGo').disabled=false;
    try{NET.peer&&NET.peer.destroy()}catch(_){}
    NET.peer=null;NET.hostConn=null;
    return;
  }
  if(d.t==='mics'){NET.mics=d.m||{};VC.paint();return}
  if(d.t==='vpeers'){VC.update(d.peers);return}
  if(d.t==='vmuted'){VC.setMuted(d.ids||[]);return}
  if(d.t==='vmute'){VC.lock(!!d.off);return}
  if(d.t==='wait')lobbyStatus((d.started?'已连上房间，正在进入牌局…':'已连上房间，牌局还没开始，开始后自动进入观战')+(d.ver&&d.ver!==VERSION?'（和房主的页面版本不同，画面可能有小出入）':''),true);
  else if(d.t==='spec')enterSpec(d);
  else if(d.t==='evt'&&SPEC)NET.inbox.push(d.e);
}
// the host's picture of the table as it stands, seen from the host's seat (seat 0, at the bottom), in the test version's screen
function enterSpec(d){
  if(SPEC)return;
  myNick=nickNow()||'观众';
  if(d.rules)Object.assign(RULES,d.rules);
  NET.mode='guest';NET.hostDir=d.hostDir;NET.off=0;NET.watching=false;NET.gone=false;NET.sid=d.sid;NET.mics=d.mics||{};NET.pn=[0,1,2,3].map(a=>d.humans.includes(a)&&d.names&&d.names[a]?d.names[a]:'电脑');
  enterTest(true);
  resetGame();
  Object.assign(G,loadSnap(d.snap,0),{tok:G.tok+1,myOrder:[],fixed:[],rest:[],fresh:[],pw:[],busy:false,stepWait:null});
  setHumans(d.humans.map(toLocal));
  NET.inbox=[];NET.pending=false;sel=new Set();
  hideOverlay();pileRebuild();
  $('#quitBtn').textContent='退出观战';
  if(G.phase==='tribPick'){G.clock=null;tribWait()}
  else if(G.phase==='return')retWait();
  else if(G.phase==='play')startTurn();
  else if(G.phase==='roundEnd'||G.phase==='over'){G.reveal=4;render();showResult()}
  else render();
  VC.setMuted(d.muted||[]);
  VC.start(d.peers);
}
// the host left, or the line broke: the watching is over
function specGone(lost){
  if(NET.gone)return;
  NET.gone=true;
  showPanel(`<h2>${lost?'和房间的连接断了':'房主退出了游戏'}</h2><p class="muted">观战结束。</p>
    <div class="btns"><button class="btn primary keep" id="specBack">回到大厅</button></div>`);
  $('#specBack').onclick=()=>location.reload();
}
function sendSit(d){if(NET.hostConn&&NET.hostConn.open)NET.hostConn.send({t:'sit',dir:d,name:nickNow(),ver:VERSION})}
function guestOnData(d){
  if(!d)return;
  NET.hostSeen=Date.now();
  if(d.t==='ping'){NET.hostConn&&NET.hostConn.open&&NET.hostConn.send({t:'pong'});return}
  if(d.t==='bye'){hostGone(false);return}
  if(d.t==='mics'){NET.mics=d.m||{};VC.paint();return}
  if(d.t==='vpeers'){VC.update(d.peers);return}
  if(d.t==='vmuted'){VC.setMuted(d.ids||[]);return}
  // the host turned a move down: stop waiting for it and let the player try again
  if(d.t==='emote'){Emotes.guestEmote(d.seat,d.id,d.to);return}
  if(d.t==='nope'){NET.pending=false;if(['play','pass','return','tribute'].includes(d.k))setMsg('这一步没有成功，请再试一次',true);render();return}
  if(d.t==='lobby'){
    NET.lobby=d.seats;myDir=d.you||'';
    if(myDir){NET.rejoinDir=null;NET.rejoinTries=0}
    // back in after a broken line: the seat held before is taken again if it is still free
    else if(NET.rejoinDir&&!d.seats[NET.rejoinDir]){const r=NET.rejoinDir;NET.rejoinDir=null;sendSit(r)}
    if(d.rules)Object.assign(RULES,d.rules);
    NET.resumeMode=!!d.started;
    if(d.ver&&d.ver!==VERSION)lobbyStatus(OLD_PAGE);
    else if(d.started){
      // the game is on: the seat that was yours is free (or still held by your old line, under your name)
      const nick=nickNow(),mine=DIRS.filter(x=>d.seats[x]===null||d.seats[x]===nick&&x!==myDir);
      if(!NET.resumeSent&&mine.length===1){NET.resumeSent=true;lobbyStatus('正在回到游戏…',true);sendSit(mine[0])}
      else lobbyStatus(mine.length?'游戏已经开始，选你原来的座位':'游戏已经开始，没有空座位可以回去');
    }else lobbyStatus(myDir?'已坐下，等待房主开始':'选一个空座位',!!myDir);
    renderLobby();
  }else if(d.t==='full'){
    NET.refused=true;lobbyStatus('这个房间已经开始打了');
  }else if(d.t==='start'){
    if(!myDir)return;
    myNick=nickNow();
    try{localStorage.setItem('guandan-nick',myNick)}catch(_){}
    if(d.rules)Object.assign(RULES,d.rules);
    enterOnline('guest',d.hostDir,d.names);
    resetGame();render();
    VC.start(d.peers);
  }else if(d.t==='evt'){
    NET.inbox.push(d.e);
  }else if(d.t==='resume'){
    resumeGame(d);
  }
}
// back at the table after a drop: the host's picture of it, turned to this seat, and the game goes on from there
function resumeGame(d){
  myDir=d.dir;myNick=nickNow();
  try{localStorage.setItem('guandan-nick',myNick)}catch(_){}
  if(d.rules)Object.assign(RULES,d.rules);
  NET.resumeSent=false;NET.resumeMode=false;NET.gone=false;NET.resumeAt=Date.now();
  enterOnline('guest',d.hostDir,d.names);
  resetGame();
  Object.assign(G,loadSnap(d.snap,NET.off),{tok:G.tok+1,myOrder:[],fixed:[],rest:[],fresh:[],pw:[],busy:false,stepWait:null});
  setHumans(d.humans.map(toLocal),d.names);
  NET.inbox=[];NET.pending=false;sel=new Set();
  hideOverlay();pileRebuild();
  if(G.phase==='tribPick'){G.clock=null;tribWait()}
  else if(G.phase==='return')retWait();
  else if(G.phase==='play')startTurn();
  else if(G.phase==='roundEnd'||G.phase==='over'){G.reveal=4;render();showResult()}
  else render();
  VC.start(d.peers);
}
// lost: the line broke (the host may still be there, so the table can be rejoined); otherwise the host said goodbye
function hostGone(lost){
  if(NET.gone)return;
  if(SPEC){specGone(lost);return}
  if(NET.watching){
    // still waiting in the lobby: back to asking for a room number
    NET.watching=false;NET.hostConn=null;lobbyStatus(lost?'和房间断开了，请重新进入':'房主退出了游戏');$('#specGo').disabled=false;
    return;
  }
  VC.stop();
  if(NET.mode==='guest'){
    NET.gone=true;
    const back=lost&&NET.lastCode;
    showPanel(`<h2>${back?'和房主的连接断了':'房主退出了游戏'}</h2><p class="muted">${back?'可以重新回到游戏，或者':'可以'}和电脑继续打完这一场，也可以退出。</p>
      <div class="btns">${back?'<button class="btn primary" id="rejoinBtn">回到游戏</button>':''}<button class="btn${back?'':' primary'}" id="soloOnBtn">和电脑继续打</button><button class="btn" id="backBtn">退出游戏</button></div>`);
    if(back)$('#rejoinBtn').onclick=()=>{
      // the same room number again; the host sends the table back to this seat. If nothing has come back in 15 seconds, ask again
      hideOverlay();NET.gone=false;
      const t0=Date.now();
      setMsg('正在重新连接…');
      joinRoom(NET.lastCode);
      setTimeout(()=>{if((NET.resumeAt||0)<t0){NET.hostConn=null;hostGone(true)}},15000);
    };
    $('#soloOnBtn').onclick=goSolo;
    $('#backBtn').onclick=()=>location.reload();
  }else if(lobbyMode==='join'){
    if(NET.refused)return;
    // the line to the room broke while waiting (the phone switched to another app, say): the page goes straight back
    // in and takes the same seat again, a few times at most, before asking the player to enter again
    if(NET.lastCode&&(NET.rejoinTries||0)<3){
      NET.rejoinTries=(NET.rejoinTries||0)+1;NET.rejoinDir=myDir||NET.rejoinDir;myDir='';
      lobbyStatus('和房间断开了，正在重新连接…');renderLobby();
      joinRoom(NET.lastCode);
      return;
    }
    NET.hostConn=null;myDir='';lobbyStatus('和房间断开了，请重新进入');renderLobby();
    $('#joinBtn').disabled=false;$('#roomCode').classList.add('call');
  }
}
// the host left: this table carries on alone from wherever the game stood, the computer taking every other seat
function goSolo(){
  VC.stop();
  try{NET.peer&&NET.peer.destroy()}catch(_){}
  NET.peer=null;NET.hostConn=null;NET.inbox=[];NET.pending=false;
  NET.mode='solo';NET.off=0;
  setHumans([0]);
  hideOverlay();
  const c=G.clock;G.clock=null;
  if(G.phase==='shuffle'&&!G.busy)startShuffle();
  else if(G.phase==='cut'&&!G.busy)startCut();
  else if(G.phase==='return')retWait();
  else if(G.phase==='tribPick')tribWait();
  else if(G.phase==='prep'){if(G.ready.includes(0))beginPlay();else{G.clock=c&&c.who==='prep'?c:{who:'prep',left:PREP_MS,total:PREP_MS};render()}}
  else if(G.phase==='play'&&G.turn>=0)startTurn();
  else if(G.phase==='roundEnd'||G.phase==='over')showResult();
  render();
}
// a closed tab or a lost phone signal is not always reported by the connection itself, so both ends say hello
// every two seconds, and 20 seconds of silence counts as leaving
const SILENT_MS=20000;
setInterval(()=>{
  const now=Date.now();
  for(const v of [...NET.conns.values()]){
    if(now-v.seen>SILENT_MS){try{v.conn.close()}catch(_){}hostOnClose(v.conn);continue}
    if(v.conn.open)v.conn.send({t:'ping'});
  }
  for(const v of [...NET.specs.values()]){
    if(now-v.seen>SILENT_MS){try{v.conn.close()}catch(_){}hostOnClose(v.conn);continue}
    if(v.conn.open)v.conn.send({t:'ping'});
  }
  if(NET.hostConn&&NET.hostSeen&&now-NET.hostSeen>SILENT_MS){
    const c=NET.hostConn;NET.hostSeen=0;try{c.close()}catch(_){}hostGone(true);
  }
},2000);
