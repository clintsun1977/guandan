function leaveNet(){
  VC.stop();
  try{NET.peer&&NET.peer.destroy()}catch(_){}
  NET.peer=null;NET.peerOpen=false;NET.hostConn=null;NET.refused=false;NET.conns=new Map();NET.specs=new Map();NET.watching=false;NET.inbox=[];
}
// the host: claims a free room number and keeps the seat list
// the room number 8888 belongs to Clint: whoever opens a room under that nickname gets 8888 (and only 8888), and nobody else is given it
const isClint=()=>nickNow().toLowerCase()==='clint';
function openRoom(){
  if(!peerReady())return;
  const clint=isClint();
  let code=clint?'8888':String(1000+(Math.random()*9000|0));
  while(!clint&&code==='8888')code=String(1000+(Math.random()*9000|0));
  const peer=new Peer(ROOM_PREFIX+code,PEER_OPTS);
  let opened=false;
  NET.peer=peer;keepSignal(peer);
  lobbyStatus('正在开房间…');
  peer.on('open',()=>{
    // (the line to the matching server coming back (keepSignal) opens the peer again: the room is already set up)
    if(NET.peer!==peer||opened)return;
    opened=true;
    NET.peerOpen=true;NET.code=code;
    $('#roomCodeShow').textContent=code;$('#roomInfo').hidden=false;
    lobbyStatus('把房间号告诉朋友，再选你的座位');
    renderLobby();
  });
  peer.on('error',err=>{
    if(NET.peer!==peer)return;
    // once the room is open, an error is about its line to the matching server (keepSignal puts it back), or a voice call
    if(opened)return;
    if(err.type==='unavailable-id'){
      if(!clint){peer.destroy();openRoom();return}
      // 8888 is still held: by another page that has it open, or by a page that has just closed or been refreshed, whose
      // number the matching server lets go only when it notices (often a minute or more later): wait and ask again, for 90 seconds
      peer.destroy();
      if((NET.clintTries=(NET.clintTries||0)+1)<=36){lobbyStatus('8888 号房间还被占用，正在重试…');setTimeout(()=>{if(lobbyMode==='host'&&!NET.started&&!NET.peerOpen)openRoom()},2500)}
      else lobbyStatus('8888 号房间被占用，请稍后再试（关掉旧的房间页面）');
      return;
    }
    lobbyStatus('开房间失败，请检查网络后重试');
  });
  hostListen(peer);
}
// the room's peer answers voice calls and takes friends' connections
function hostListen(peer){
  peer.on('call',c=>VC.incoming(c));
  peer.on('connection',conn=>{
    conn.on('open',()=>{
      NET.conns.set(conn.peer,{conn,dir:'',name:'',seen:Date.now()});
      // the game is on: a player who dropped out may come back to their seat (see hostResume)
      if(NET.started){conn.send(resumeLobby());return}
      conn.send({t:'lobby',seats:NET.lobby,you:'',rules:RULES,ver:VERSION});
    });
    conn.on('data',d=>hostOnData(conn,d));
    conn.on('close',()=>hostOnClose(conn));
  });
}
function broadcast(msg){
  for(const v of NET.conns.values())if(v.conn.open)v.conn.send(msg);
  // spectators get the moves (once they have been sent the table) and the goodbye
  if(['evt','bye','mics','vpeers','vmuted'].includes(msg.t))for(const v of NET.specs.values())if(v.conn.open&&(v.ready||msg.t==='bye'))v.conn.send(msg);
}
function broadcastLobby(){for(const v of NET.conns.values())if(v.conn.open)v.conn.send({t:'lobby',seats:NET.lobby,you:v.dir,rules:RULES,ver:VERSION})}
function hostOnData(conn,d){
  const sp=NET.specs.get(conn.peer);
  if(sp&&sp.conn===conn){
    sp.seen=Date.now();
    // a spectator's microphone: on only if the host has not turned the spectator's voice off
    if(d&&d.t==='mic'){NET.mics[sp.sid]=!!d.on&&!sp.muted;broadcast({t:'mics',m:NET.mics});VC.paint()}
    return;
  }
  const info=NET.conns.get(conn.peer);if(!info||!d)return;
  info.seen=Date.now();
  if(d.t==='bye'){hostOnClose(conn,'quit');try{conn.close()}catch(_){}return}
  if(d.t==='watch'){hostWatch(conn,info,d);return}
  if(d.t==='emote'){if(NET.started&&info.dir)Emotes.hostEmote(absOf(info.dir,NET.hostDir),d.id,d.to);return}
  if(d.t==='mic'){if(NET.started&&info.dir){NET.mics[absOf(info.dir,NET.hostDir)]=!!d.on;broadcast({t:'mics',m:NET.mics});VC.paint()}return}
  if(d.t==='sit'&&!NET.started){
    // random seats: the friend does not choose; they are put on a free seat now (just a place to stand: the real seats are drawn at the start)
    let dir=d.dir;
    if(RULES.seatMode==='random'){dir=info.dir||DIRS.find(x=>!NET.lobby[x]);if(!dir)return}
    if(!DIRS.includes(dir)||(NET.lobby[dir]&&info.dir!==dir))return;
    if(info.dir)NET.lobby[info.dir]=null;
    info.dir=dir;info.name=String(d.name||'').replace(/[<>&"']/g,'').slice(0,8)||'玩家';
    NET.lobby[dir]=info.name;
    broadcastLobby();renderLobby();
    if(d.ver&&d.ver!==VERSION)lobbyStatus(`${info.name}的页面版本不同（${d.ver}），请他刷新页面`);
  }
  if(d.t==='sit'&&NET.started){hostResume(conn,info,d);return}
  if(d.t==='act'&&NET.started&&info.dir&&!hostGuestAct(absOf(info.dir,NET.hostDir),d.e||{})&&conn.open)conn.send({t:'nope',k:(d.e||{}).k});
}
// 观战: a page that asks to watch is not a player: it takes no seat and is not counted among the people at the table. It is sent the
// table (as for a player coming back) as soon as the game is on and the table is still, then every move as it is made
const SPEC_MAX=6;
function hostWatch(conn,info,d){
  NET.conns.delete(conn.peer);
  // (a spectator on another version of the page is let in too: a new version is often put up while a game is on, and
  // watching only shows the host's table; players, who make moves, must still have the host's version)
  if(NET.specs.size>=SPEC_MAX){if(conn.open)conn.send({t:'specfull'});return}
  const name=String(d.name||'').replace(/[<>&"']/g,'').slice(0,8)||'观众';
  NET.specs.set(conn.peer,{conn,name,seen:Date.now(),ready:false,sid:NET.specSeq=(NET.specSeq||9)+1,muted:false});
  const n=NET.specs.size,say=`${name} 来观战（现在 ${n} 人观战）`;
  if(NET.started)setMsg(say);else lobbyStatus(say);
  if(conn.open)conn.send({t:'wait',started:!!NET.started,ver:VERSION});
  syncRoomOpt();
}
// a friend's move: only for their own seat, and a play must be legal, exactly what their own buttons check
// false when the move is refused (the friend's page is then told, so it does not keep waiting)
function hostGuestAct(seat,e){
  if(!isHumanSeat(seat))return false;
  switch(e.k){
    case'next':if(e.p!==seat)return false;break;
    case'shuffle':if(G.shuffler!==seat)return false;break;
    case'cut':if(G.cutter!==seat)return false;break;
    case'pass':case'return':case'ready':if(e.p!==seat)return false;break;
    case'pause':if(e.p!==seat||(G.paused&&G.pausedBy!==seat))return false;break;
    case'tribute':if(e.p!==seat||G.phase!=='tribPick'||!tribOptions(seat).some(c=>c.id===e.id))return false;break;
    case'play':{
      if(e.p!==seat||G.phase!=='play'||G.turn!==seat)return false;
      const cards=(e.ids||[]).map(id=>G.hands[seat].find(c=>c.id===id));
      if(!cards.length||cards.some(c=>!c))return false;
      const cur=G.trick?G.trick.play:null;
      // the cards decide what the play is: if the friend's page named it differently (an older page, say),
      // take the strongest reading that beats the table, exactly as the player's own button would
      const ok=analyze(cards,G.L).filter(r=>beats(r,cur)).sort((a,b)=>strength(b)-strength(a));
      if(!ok.length)return false;
      if(!ok.some(r=>r.type===e.type&&r.value===e.value))e={...e,type:ok[0].type,value:ok[0].value,n:ok[0].n};
      break;
    }
    default:return false;
  }
  act(e);
  return true;
}
