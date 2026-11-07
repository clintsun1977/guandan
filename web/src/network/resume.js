/* ---------- coming back after a drop: the room number again, then the same seat, with the table as it stands ---------- */
// the seats as a returning player sees them: a name where someone sits (or the computer plays for a player who never was),
// empty where a player dropped out
function resumeLobby(){
  const seats={};
  for(const d of DIRS){
    const a=absOf(d,NET.hostDir);
    seats[d]=a===0?(NET.names[0]||'房主'):NET.names[a]?(NET.humans.has(a)?NET.names[a]:null):'电脑';
  }
  return{t:'lobby',seats,you:'',rules:RULES,ver:VERSION,started:true};
}
// a player asks for a seat: free (the player dropped out), or held by a line that has gone quiet under the same name
function hostResume(conn,info,d){
  const dir=d.dir,name=String(d.name||'').replace(/[<>&"']/g,'').slice(0,8)||'玩家';
  const a=DIRS.includes(dir)?absOf(dir,NET.hostDir):-1;
  const holder=[...NET.conns.values()].find(v=>v!==info&&v.dir===dir);
  const ok=a>0&&NET.names[a]&&(!NET.humans.has(a)||(holder&&holder.name===name));
  if(!ok||info.dir){if(conn.open)conn.send(resumeLobby());return}
  if(holder){holder.dir='';NET.conns.delete(holder.conn.peer);try{holder.conn.close()}catch(_){}}
  info.dir=dir;info.name=name;NET.names[a]=name;
  (NET.resumeQ||(NET.resumeQ=[])).push({conn,info,a});
}
// the table is still while it waits for the next step; a snapshot is only taken then
function tableStill(){
  if(!G||G.busy||G.stepWait!=null)return false;
  switch(G.phase){
    case'tribPick':case'return':case'prep':return true;
    case'play':return G.turn>=0&&!G.tribHold;
    case'roundEnd':case'over':return G.reveal>=4;
  }
  return false;
}
const REJ_SKIP=new Set(['inf','nn','replay','ua','tgLock','tgKey','tgRound','stepGo','stepWait','myOrder','fixed','rest','fresh','pw','tribHold']);
function snapG(){
  return JSON.stringify(G,function(k,v){
    if(this===G&&REJ_SKIP.has(k))return undefined;
    if(v&&typeof v==='object'&&!Array.isArray(v)&&typeof v.id==='number'&&typeof v.r==='number')return{__c:v.id};
    return v;
  });
}
// the host's picture of the table turned to the view of the seat k places further round (seat 0 is always yourself, and the
// two sides swap places when k is odd)
function rotateG(g,k){
  const f=i=>typeof i==='number'&&i>=0?(i-k+4)%4:i;
  const fl=a=>Array.isArray(a)?a.map(f):a;
  const perm=a=>{if(!Array.isArray(a))return a;const o=[];for(let i=0;i<4;i++)o[f(i)]=a[i];return o};
  const keyed=o=>{if(!o||typeof o!=='object')return o;const r={};for(const q in o)r[f(+q)]=o[q];return r};
  const tm=t=>typeof t==='number'?(t+k)%2:t;
  const swap=a=>Array.isArray(a)&&k%2?[a[1],a[0]]:a;
  g.hands=perm(g.hands);g.last=perm(g.last);
  for(const q of['out','prevOut','ready','nextReady','tribGivers'])g[q]=fl(g[q]);
  for(const q of['turn','nextLeader','leader','firstLeader','cutter','shuffler','dealIdx','pausedBy'])if(q in g)g[q]=f(g[q]);
  if(g.trick)g.trick.player=f(g.trick.player);
  for(const t of g.trickPlays||[])t.p=f(t.p);
  g.tribPick=keyed(g.tribPick);g.retPick=keyed(g.retPick);
  for(const t of g.trib||[]){t.g=f(t.g);t.r=f(t.r)}
  for(const t of[...(g.returns||[]),...(g.gives||[])]){t.from=f(t.from);t.to=f(t.to)}
  if(g.kang){for(const x of g.kang.has||[])x.g=f(x.g);g.kang.leader=f(g.kang.leader)}
  if(g.clock){const c=g.clock;if(typeof c.who==='number')c.who=f(c.who);if('seat'in c)c.seat=f(c.seat);if(c.seats)c.seats=fl(c.seats)}
  if(g.result){const r=g.result;r.order=fl(r.order);r.team=tm(r.team);r.aTeam=tm(r.aTeam);r.aOut=tm(r.aOut)}
  for(const e of g.log||[])e.p=f(e.p);
  g.levels=swap(g.levels);g.aFails=swap(g.aFails);g.lvlTeam=tm(g.lvlTeam);g.aOut=tm(g.aOut);
  return g;
}
function loadSnap(str,k){
  const byId=new Map(makeDeck().map(c=>[c.id,c]));
  return rotateG(JSON.parse(str,(key,v)=>v&&typeof v==='object'&&v.__c!==undefined?byId.get(v.__c):v),k);
}
// every half second: a returning player is sent the table as soon as it is still
setInterval(()=>{
  const q=NET.resumeQ;
  if(NET.mode!=='host'||!q||!q.length||!tableStill())return;
  for(const r of q.splice(0)){
    if(!r.conn.open||NET.conns.get(r.conn.peer)!==r.info)continue;
    const list=[...new Set([...NET.humans,r.a])];
    const peers=vcPeers();
    r.conn.send({t:'resume',dir:r.info.dir,hostDir:NET.hostDir,names:NET.names,rules:RULES,peers,humans:list,snap:snapG()});
    // after the picture, so the events that follow reach the returning page behind it
    act({k:'humans',list,names:NET.names,back:r.info.name});
  }
},500);
setInterval(()=>{
  if(NET.mode!=='host'||!NET.started||!NET.specs.size||!tableStill())return;
  for(const v of NET.specs.values()){
    if(v.ready||!v.conn.open)continue;
    v.ready=true;
    v.conn.send({t:'spec',hostDir:NET.hostDir,names:NET.names,rules:RULES,humans:[...NET.humans],snap:snapG(),sid:v.sid,peers:vcPeers(),mics:NET.mics,muted:mutedIds()});
    broadcastPeers();syncRoomOpt();
  }
},500);
// voice: who can be called (the seats' and the ready spectators' connections, spectators under numbers from 10 up), told to everyone
// whenever it changes; and the host's switch for a spectator's voice
function vcPeers(){
  const peers={0:NET.peer.id};
  for(const v of NET.conns.values())if(v.dir)peers[absOf(v.dir,NET.hostDir)]=v.conn.peer;
  for(const v of NET.specs.values())if(v.ready)peers[v.sid]=v.conn.peer;
  return peers;
}
const mutedIds=()=>[...NET.specs.values()].filter(v=>v.muted).map(v=>v.sid);
function broadcastPeers(){const peers=vcPeers();broadcast({t:'vpeers',peers});VC.update(peers)}
function hostSpecMute(sid){
  const sp=[...NET.specs.values()].find(v=>v.sid===sid);if(!sp)return;
  sp.muted=!sp.muted;
  if(sp.muted)NET.mics[sid]=false;
  if(sp.conn.open)sp.conn.send({t:'vmute',off:sp.muted});
  broadcast({t:'vmuted',ids:mutedIds()});broadcast({t:'mics',m:NET.mics});
  VC.setMuted(mutedIds());VC.paint();syncRoomOpt();
}
function hostOnClose(conn,how='drop'){
  const sp=NET.specs.get(conn.peer);
  if(sp&&sp.conn===conn){
    NET.specs.delete(conn.peer);delete NET.mics[sp.sid];
    if(NET.started)setMsg(`${sp.name} 离开了观战`);
    broadcastPeers();broadcast({t:'mics',m:NET.mics});syncRoomOpt();
    return;
  }
  const info=NET.conns.get(conn.peer);if(!info)return;
  NET.conns.delete(conn.peer);
  if(!NET.started){if(info.dir)NET.lobby[info.dir]=null;broadcastLobby();renderLobby();return}
  if(!info.dir)return;
  // a friend who drops out mid-game: the computer takes over their seat from here on
  const seat=absOf(info.dir,NET.hostDir);
  const list=[...NET.humans].filter(h=>h!==seat);
  act({k:'humans',list,names:NET.names,left:info.name,how});
  const c=G.clock;
  if(c&&(c.who===seat||c.seat===seat)){G.clock=null;timeUp(c)}
  if(owesReturn(seat))act({k:'return',p:seat,id:aiReturnCard(G.hands[seat],G.L).id});
  if(G.phase==='tribPick'&&G.tribGivers.includes(seat)&&G.tribPick[seat]==null)act({k:'tribute',p:seat,id:tributeCard(G.hands[seat],G.L).id});
  if(G.phase==='prep'&&[...NET.humans].every(h=>G.ready.includes(h)))act({k:'begin'});
}
