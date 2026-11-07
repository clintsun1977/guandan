/* ---------- 接着上一把: a match (一把, from 2 up to A) can be stopped and taken up again later as the same match ---------- */
// After every round the page that runs the table (alone or as host) remembers in this browser where the match stands, in
// 选级's terms: each side's level, the side whose level is played, the finishing order, the tries at A. The lobby then offers
// 「继续上一把」, which fills 选级 with it; a match started from exactly that state (by the button or by hand) is the same
// match again: its rounds go up under the same match ID, numbered on from where it stopped, so all the rounds of one
// match can be put together however many sittings it took. A match that is won or drawn is forgotten
const MATCH_KEY='guandan-match-v1',MATCH_KEEP_MS=30*86400000;
const ML={g:null,id:'',seats:[],base:0};
function mlLoad(){
  try{const m=JSON.parse(localStorage.getItem(MATCH_KEY)||'null');return m&&m.id&&m.state&&Date.now()-m.savedAt<MATCH_KEEP_MS?m:null}
  catch(_){return null}
}
function mlStore(m){try{m?localStorage.setItem(MATCH_KEY,JSON.stringify(m)):localStorage.removeItem(MATCH_KEY)}catch(_){}}
const mlOwn=()=>NET.mode!=='guest'&&!TEST&&!ENDG&&!SPEC;
const mlHostDir=()=>NET.mode==='solo'?myDir:NET.hostDir;
const mlDir=p=>DIRS[(DIRS.indexOf(mlHostDir())+toAbs(p))%4];
const mlSide=t=>dirSide(mlDir(t)); // team t sits at seats t and t+2
// the side whose level a 选级 state plays: chosen, or else the side of the last round's winner
const mlPlays=s=>s.playSide||(s.order&&s.order.length===4&&s.order[0]?dirSide(s.order[0]):'');
function mlSame(a,b){
  return(a.lvSN||2)===b.lvSN&&(a.lvEW||2)===b.lvEW&&(a.aSN||0)===b.aSN&&(a.aEW||0)===b.aEW&&mlPlays(a)===mlPlays(b)&&
    (a.order||[]).join()===b.order.join();
}
// the match this game belongs to (called as each round is dealt): the remembered one when the game started from its state
function mlMatch(){
  if(ML.g===G)return ML;
  const m=G.round===1&&levelChosen()?mlLoad():null;
  if(m&&mlSame(RULES,m.state)){
    Object.assign(ML,{g:G,id:m.id,seats:m.seats.slice(),base:m.nextRound-1});
    // 一次机会: a side that used up its tries at A, which 选级 has no button for
    if(m.state.aOut)G.aOut=[0,1].find(t=>mlSide(t)===m.state.aOut)??null;
  }else Object.assign(ML,{g:G,id:crypto.randomUUID(),seats:[0,1,2,3].map(()=>crypto.randomUUID()),base:0});
  return ML;
}
// a round is over (after finishRound has set the next round's levels and order)
function mlRoundEnd(){
  if(!mlOwn()||ML.g!==G||!G.result)return;
  if(G.result.win||G.result.draw){mlStore(null);return}
  const st={playSide:mlSide(G.lvlTeam),order:G.prevOut.map(mlDir),aOut:G.aOut==null?'':mlSide(G.aOut)};
  for(const t of [0,1]){const s=mlSide(t);st['lv'+s]=G.levels[t];st['a'+s]=(G.aFails||[0,0])[t]}
  mlStore({id:ML.id,seats:ML.seats,nextRound:ML.base+G.round+1,state:st,savedAt:Date.now()});
}
// 「继续上一把」 in the lobby, for whoever plays alone or opens the room
function mlRenderBtn(){
  const b=$('#contBtn'),m=lobbyMode!=='join'?mlLoad():null;
  b.hidden=!m;
  if(!m)return;
  const s=m.state,on=mlSame(RULES,s);
  b.textContent=on?`已接上一把：南北打${rankName(s.lvSN)}，东西打${rankName(s.lvEW)}`:`继续上一把（南北打${rankName(s.lvSN)}，东西打${rankName(s.lvEW)}）`;
  b.classList.toggle('on',on);
}
$('#contBtn').onclick=()=>{
  const m=mlLoad();
  if(!m||lobbyMode==='join')return;
  const s=m.state;
  Object.assign(RULES,{lvSN:s.lvSN,lvEW:s.lvEW,aSN:s.aSN,aEW:s.aEW,playSide:s.playSide,order:s.order.slice()});
  Sound.unlock();Sound.play('select');
  renderRules();
  if(lobbyMode==='host')broadcastLobby();
};
