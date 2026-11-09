/* ---------- 牌谱采集: every round with at least two people at the table goes to guandanai's collector, for AI training ---------- */
// The record is the format of stevensun1005/guandanai's human-game collector (web/src/collection/record.mjs there; the server
// checks it in validate.mjs by replaying the round): the dealt hands, the tribute, every play and pass with who made it
// (human, bot or timeout) and the finishing order. Only the host records, only rounds that start with two or more people
// seated, never the training version, a 残局 or a spectator, and nothing once the host has gone back to playing alone.
// With the room number (room) and each person's nickname (seats[].name, null for a computer's seat), which guandanai's
// collector takes from this site only; no chat, voice or IP. The four seats also get random IDs that last for one match (a match
// taken up again (选级 set by hand to the state it stopped in) keeps its match ID, seat IDs and round numbers: see match-link.js).
// Cards are the 0-107 ids of makeDeck(). appVersion starts with c1977 so these rounds can be told from guandanai's own.
const REC={byGame:new WeakMap(),auto:-1};
const recHumans=()=>[...NET.humans].sort((a,b)=>a-b);
const recMask=h=>h.reduce((m,p)=>m|(1<<p),0);
const recEligible=()=>NET.mode==='host'&&!TEST&&!SPEC&&NET.humans.size>=2;
// a computer as guandanai's records name it: its release number and weights for a network, guandanai's search bot identity (9001) for
// danMCai-reason, clint-rule for the Clint rules
function recModel(id){
  const m=NeuralBot.models.find(x=>x.id===id);
  if(m&&m.identity)return{...m.identity}; // danMCai-reason: guandanai's search bot 9001, its 017 fallback plays included
  if(m&&m.file)return{id:m.guandanaiId,sha256:m.sha256,version:m.source.version};
  return{id:'clint-rule',sha256:null,version:'clintsun1977-'+VERSION};
}
// as the collector takes them: no spaces at either end, no control characters, at most 24 characters (16 for the room), else none
function recLabel(v,max){
  const t=[...String(v??'').replace(/[\u0000-\u001f\u007f]/g,'').trim()].slice(0,max).join('').trim();
  return t||null;
}
const recNick=p=>recLabel(p===0?(NET.names[0]||myNick):NET.names[p],24);
const REC_TIMEOUT={id:'clint-rule',sha256:null,version:'clintsun1977-timeout'};
// right after the deal, before any tribute
function recDeal(){
  if(!recEligible())return;
  const m=mlMatch(),round=m.base+G.round;
  let s=REC.byGame.get(G);
  if(!s){s={match:m.id,seats:m.seats};REC.byGame.set(G,s)}
  s.t0=performance.now();
  s.rec={schema:1,kind:new URLSearchParams(location.search).get('test')==='1'?'test':'game',encoding:'physical-108-v1',
    id:`${s.match}:${round}`,matchId:s.match,round,appVersion:APP_HASH,startedAt:new Date().toISOString(),level:G.L,
    match:{levels:G.levels.slice(),lvlTeam:G.lvlTeam,L:G.L,aFails:(G.aFails||[0,0]).slice(),aOut:G.aOut??null},
    rules:{trib:!!RULES.trib,aFail:RULES.aFail},dealtHands:G.hands.map(h=>h.map(c=>c.id)),actions:[]};
}
// as play starts: the hands after the tribute, who leads, who is a person
function recStart(leader){
  const s=REC.byGame.get(G),r=s&&s.rec;
  if(!r||r.round!==ML.base+G.round||r.hands||!recEligible())return;
  const humans=recHumans(),bot=recModel(RULES.bot);
  r.leader=leader;r.hands=G.hands.map(h=>h.map(c=>c.id));r.humanMask=recMask(humans);
  r.seats=s.seats.map((id,p)=>({id,human:humans.includes(p),bot,name:humans.includes(p)?recNick(p):null}));
  const room=recLabel(NET.code,16);if(room)r.room=room;
  r.tribute=(G.trib||[]).map(t=>({from:t.g,to:t.r,card:t.tc.id,returnCard:t.rc?t.rc.id:null}));
}
// every play or pass, as the host applies it (before doPlay, while the turn's clock still shows how long it took)
function recAction(p,e,play){
  const s=REC.byGame.get(G),r=s&&s.rec;
  if(!r||!r.hands||r.round!==ML.base+G.round||r.endedAt||NET.mode!=='host')return;
  const humans=recHumans(),human=humans.includes(p),actor=human?(REC.auto===p?'timeout':'human'):'bot',c=G.clock;
  r.actions.push({seat:p,cards:play?play.cards.map(c=>c.id):null,...(play?{type:play.type,value:play.value,n:play.n}:{}),actor,
    ...(actor==='human'&&e.as?{assisted:true}:{}),humanMask:recMask(humans),
    model:actor==='human'?null:actor==='timeout'?REC_TIMEOUT:recModel(BOT_USED[p]||'clint'),
    decisionMs:actor==='human'&&c&&c.who===p?Math.min(120000,Math.max(0,Math.round(c.total-c.left))):null,
    elapsedMs:Math.max(0,Math.round(performance.now()-s.t0))});
}
// the round is over: the record goes into the outbox, which keeps it until the collector has stored it
function recDone(){
  const s=REC.byGame.get(G),r=s&&s.rec;
  if(!r||!r.hands||r.round!==ML.base+G.round||!G.result||NET.mode!=='host'||TEST)return;
  if(r.endedAt)return;
  r.endedAt=new Date().toISOString();r.order=G.result.order.slice();
  Outbox.add(JSON.parse(JSON.stringify(r)));
}
