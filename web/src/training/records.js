/* the record of each round */
// a round's record starts when play starts (the tribute and returns done): the four hands, each one's 牌力 (yours also as
// you grouped it), the log, the comments; numbered on from the rounds already kept in this browser
function testRoundStart(){
  TSNAP.length=0;TDEC.clear();
  const L=G.L,rp=G.replay;G.replay=null;
  const mine=testGrouped()?G.fixed.map(gr=>gr.slice()):null;
  const power=G.hands.map(h=>rawPower(h,L)),ug={},up={};
  for(const p of [1,2,3])if(uaOf(p)){ug[p]=seatGroups(p);up[p]=handPower(G.hands[p],L)}
  // the computer's own arrangement of each hand you changed (and of yours), to compare with
  const raw={};
  for(const p of [0,1,2,3])if(p?ug[p]:mine)raw[p]=armPlaysRaw(G.hands[p],L).map(u=>displayOrder(u,L).map(c=>c.id));
  TSEL.ids=new Set();
  TREC.rounds.push({uid:Date.now().toString(36)+Math.random().toString(36).slice(2,6),no:TREC.rounds.reduce((m,r)=>Math.max(m,r.no),0)+1,
    at:new Date().toLocaleString(),live:true,g:G.round,L,lvlTeam:G.lvlTeam,levels:G.levels.slice(),leader:G.turn,
    hands:G.hands.map(h=>h.slice()),power,myGroups:mine,myPower:mine?scorePower(armScore(myUnits())):power[0],userGroups:ug,userPower:up,rawGroups:raw,
    trib:rp?rp.trib:(G.trib||[]).map(t=>`${NAMES[t.g]}进贡 ${cardText(t.tc)} 给${NAMES[t.r]}`+(t.rc?`，${NAMES[t.r]}还 ${cardText(t.rc)}`:'')),
    kang:rp?rp.kang:G.kang?kangHtml(true).replace(/<[^>]+>/g,''):'',
    log:G.log,result:'',notes:{},nk:'all',nv:0,replayOf:rp?rp.of:null,endgame:!!G.endgame,preHands:G.endgame?G.preHands||null:null,
    // a 残局 starts in the middle of the round: the plays so far, who is next, the 牌力 tiers worked out at the deal
    endStart:G.endgame?{turn:G.turn,pw:(G.pw||[]).map(x=>x==null?null:x),pre:G.log.map(e=>({p:e.p,c:e.cards?e.cards.map(c=>c.id):null,lead:e.lead,type:e.type,value:e.value,n:e.n}))}:null});
  recName(curRec());
  testStore();
}
function testRoundEnd(){
  const rec=curRec();
  if(!rec||!rec.live||rec.g!==G.round)return;
  const r=G.result,side=t=>t===0?'我方':'对方';
  rec.result=r.order.map((p,i)=>PLACE[i]+' '+NAMES[p]).join('，')+'；'+(r.draw?(r.lastTry?'冲 A 没有成功，平局':'三次打 A 未过，平局'):r.win?`${side(r.team)}打过 A，赢下整场`:
    r.before===r.after?`${side(r.team)}在 A 级，没能打过`:`${side(r.team)}升 ${r.up} 级（${rankName(r.before)} → ${rankName(r.after)}）`);
  testStore();
}
// kept in this browser (the last 200 rounds), cards by their number in the deck
const TKEY='guandan-test-records',DECK=makeDeck();
const recOut=r=>({uid:r.uid,no:r.no,at:r.at,L:r.L,lvlTeam:r.lvlTeam,levels:r.levels,leader:r.leader,hands:r.hands.map(h=>h.map(c=>c.id)),
  power:r.power,myGroups:r.myGroups,myPower:r.myPower,userGroups:r.userGroups,userPower:r.userPower,rawGroups:r.rawGroups,done:!!r.done,name:r.name,trib:r.trib,kang:r.kang,result:r.result,notes:r.notes,nk:'all',replayOf:r.replayOf,endgame:!!r.endgame,preHands:r.preHands,endStart:r.endStart,train:r.train,
  log:r.log.map(e=>({p:e.p,c:e.cards?e.cards.map(c=>c.id):null,lead:e.lead,type:e.type,value:e.value,n:e.n,mq:e.mq,mn:e.mn}))});
// every turn has its number, a 过 as much as a play; records kept before then numbered the plays alone
function notesIn(o){
  if(o.nk==='all'||!o.notes)return o.notes||{};
  const m={};let c=0;
  if(o.notes[0]!=null)m[0]=o.notes[0];
  o.log.forEach((e,i)=>{if(e.c&&o.notes[++c]!=null)m[i+1]=o.notes[c]});
  return m;
}
const recIn=o=>({...o,nv:0,notes:notesIn(o),nk:'all',userGroups:o.userGroups||{},userPower:o.userPower||{},hands:o.hands.map(h=>h.map(id=>DECK[id])),
  log:o.log.map(e=>({p:e.p,cards:e.c?e.c.map(id=>DECK[id]):null,lead:e.lead,type:e.type,value:e.value,n:e.n,mq:e.mq,mn:e.mn}))});
let storeT=0;
function testStore(){
  if(SPEC)return;
  clearTimeout(storeT);
  storeT=setTimeout(()=>{try{localStorage.setItem(TKEY,JSON.stringify(TREC.rounds.slice(-200).map(recOut)))}catch(_){}},300);
  testDbSoon();
}
// in the claude.ai viewer the round being played (with its comments) is kept in this page's own store a few seconds after
// each change, so Claude can read it whenever asked, without anything to press; one write at a time
let dbT=0,dbBusy=Promise.resolve();
function testDbSoon(){
  if(!window.claude||!window.claude.use)return;
  clearTimeout(dbT);
  dbT=setTimeout(()=>{const r=curRec();if(r)dbBusy=dbBusy.then(()=>testDbPut(r)).catch(()=>{})},4000);
}
async function testDbPut(r){
  const db=await window.claude.use('db').catch(()=>null);
  if(!db)return false;
  await db.collection('rounds').doc(r.uid).set({uid:r.uid,no:r.no,name:recName(r),at:r.at||'',result:r.result||'',done:!!r.done,
    notes:Object.keys(r.notes).length,saved:new Date().toLocaleString(),text:testText([r]),data:recOut(r)});
  return true;
}
function testLoad(){try{return JSON.parse(localStorage.getItem(TKEY)||'[]').map(recIn)}catch(_){return[]}}
// a hand as groups to show: the computer's arrangement (bombs first, then runs, then the rest, larger first, the way the
// hand is sorted), or, not arranged (while dealing), one group per rank
const T_ORDER=['jokers','sflush','bomb','trip2','pairs3','straight','full','triple','pair','single'];
function handUnits(cards,L,grouped){
  if(grouped)return armPlays(cards,L).slice()
    .sort((a,b)=>T_ORDER.indexOf(a.type)-T_ORDER.indexOf(b.type)||(isBomb(a)?power(b)-power(a):b.value-a.value))
    .map(u=>({cards:displayOrder(u,L),name:u.type==='bomb'?u.n+'张炸弹':TYPE_NAME[u.type]}));
  const out=[];
  for(const c of sortHand(cards.slice(),L)){
    const g=out[out.length-1];
    if(g&&val(g.cards[0],L)===val(c,L)&&isWild(g.cards[0],L)===isWild(c,L))g.cards.push(c);else out.push({cards:[c],name:''});
  }
  return out;
}
// a seat's cards as a record shows them: yours in the groups you had when play began, a computer's as you rearranged it
// (less what has been played since), or else the computer's own arrangement
function recUnits(rec,p,cards){
  const gs=p?rec.userGroups&&rec.userGroups[p]:rec.myGroups;
  if(!gs)return handUnits(cards,rec.L,true);
  const by=new Map(cards.map(c=>[c.id,c]));
  return gs.map(gr=>gr.filter(id=>by.has(id)).map(id=>by.get(id))).filter(g=>g.length).map(g=>({cards:g,name:''}));
}
// the groups in at most three rows (or as many as asked), as even in length as the groups allow (lengths in card widths:
// each further card shows 0.42 of a card, a gap of 0.22 between groups)
function rowsOf(units,k=3){
  const W=units.map(u=>1.22+.42*(u.cards.length-1)),n=units.length,pre=[0];
  for(const w of W)pre.push(pre[pre.length-1]+w);
  // best[r][i]: the widest row when the first i groups go in r rows, and where its last row starts
  const best=[[{m:0,at:0}].concat(Array(n).fill({m:Infinity,at:0}))];
  for(let r=1;r<=k;r++){
    const row=[{m:0,at:0}];
    for(let i=1;i<=n;i++){
      let b={m:Infinity,at:0};
      for(let j=0;j<i;j++){const m=Math.max(best[r-1][j].m,pre[i]-pre[j]);if(m<b.m-1e-9)b={m,at:j}}
      row.push(b.m<best[r-1][i].m-1e-9?b:{...best[r-1][i],same:true});
    }
    best.push(row);
  }
  const rows=[];
  for(let r=k,i=n;r>0&&i>0;r--){const b=best[r][i];if(b.same)continue;rows.unshift(units.slice(b.at,i));i=b.at}
  return rows;
}
// the 2号 and 4号 hands: groups in order into rows of at most six cards each (a bomb of more than six stands alone in its row)
function rowsMax6(units){
  const multi=units.filter(u=>u.cards.length>1),singles=units.filter(u=>u.cards.length===1);
  const rows=[];let cur=[],n=0;
  for(const u of multi){
    const m=u.cards.length;
    if(cur.length&&n+m>6){rows.push(cur);cur=[];n=0}
    cur.push(u);n+=m;
  }
  if(cur.length)rows.push(cur);
  // the single cards go last, each row of them laid close like a run, no wider than the widest row above (in card widths: a
  // group is 1 + .42 a card for each card after the first, and groups overlap by .16)
  const wOf=r=>r.reduce((t,u)=>t+1+.42*(u.cards.length-1),0)-.16*(r.length-1);
  const maxW=Math.max(3.1,...rows.map(wOf));
  const per=Math.floor((maxW-1)/.42+1e-6)+1;
  for(let i=0;i<singles.length;i+=per)rows.push([{cards:singles.slice(i,i+per).map(u=>u.cards[0]),name:''}]);
  return rows;
}
const rowsHTML=(units,L,picked,k)=>(Array.isArray(k)?k:rowsOf(units,k)).map(r=>`<div class="prow">${
  r.map(u=>`<span class="grp"${u.name?` title="${u.name}"`:''}>${u.cards.map(c=>cardHTML(c,L,picked&&picked.has(c.id)?'sel':'')).join('')}</span>`).join('')}</div>`).join('');
const handRowsHTML=(cards,L,grouped)=>rowsHTML(handUnits(cards,L,grouped),L);
const curRec=()=>TREC.rounds[TREC.rounds.length-1];
function testRender(){testPeeks();testMine();testList();testPlays();testCounter();syncUndo()}
