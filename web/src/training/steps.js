// 上一步 (the button in the 成组 column): the play just made is taken back. Every stop of the game (before each turn) keeps a
// copy of the game, and going back puts the one before the latest back as it was, the game waiting there, the screen as it
// was then; the space bar plays the step again
const TSNAP=[];
function testSnap(){
  const top=TSNAP[TSNAP.length-1];
  if(top&&top.log.length===G.log.length)return; // the stop and the start of the same turn are one step
  try{TSNAP.push(structuredClone(G))}catch(_){TSNAP.length=0}
}
// a computer's move is remembered by how the round had gone to that point: taking a step back and going on plays the same
// move again (a different move of yours before it makes the position a new one, and it is thought out afresh)
const TDEC=new Map();
// 残局: the computers train on the position by themselves. They play it out from where it stands, all four hands by search (mcSearch's way: a play
// tried many times to the end of the round, the best-looking tried more), each move for ENDMS milliseconds; then again, each move
// given twice the time, and again... Every play-through is a whole round. They stop when two play-throughs in a row (from the third) come to
// the same result (the levels won or lost), or after ENDMAX of them; the last, the one with the longest thinking, is the line they
// settle on, and is what 回放 shows. The work is done a slice at a time (nothing is drawn meanwhile), so the page stays alive.
const ENDMAX=6;
let ENDRUN=false,ENDREC=null;
// the training's box over the table: where it is, the play-throughs so far, and the buttons
function endgameShow(head,done,rounds=[]){
  const box=$('#etrain');if(!box)return;
  const t=ms=>ms<1000?(ms/1000).toFixed(2).replace(/0$/,''):(ms/1000).toFixed(ms%1000?1:0);
  const res=r=>r>0?`1号3号一方赢 ${r} 级`:r<0?`2号4号一方赢 ${-r} 级`:'平';
  box.innerHTML=`<h3>残局 · 四家电脑自己摸索</h3><div class="eh">${head}</div>
    <ol class="er">${rounds.map(r=>`<li>第 ${r.k} 轮（每手想 ${t(r.ms)} 秒，${r.moves} 手）：${res(r.reward)}</li>`).join('')}</ol>
    <div class="eb">${ENDREC&&!ENDREC.training?'<button class="btn primary" id="etView">回放最后这一轮</button>':''}${ENDRUN?'<button class="btn" id="etStop">停</button>':''}<button class="btn" id="etNext">换一局</button></div>`;
}
async function endgameLine(S0,ms,tok,prog){
  let S=S0;const line=[];
  for(let moves=0;!mcOver(S)&&moves<800;moves++){
    if(tok!==ENDTOK)return null;
    const p=S.t,mv=mcMoves(S);
    let pl,q=0,n=0;
    if(mv.length===1)pl=mv[0];
    else{
      const root=mcNode(S),end=mcNow()+ms;let k=0;
      do{
        const t1=mcNow()+30;
        while(mcNow()<t1&&(k<8||(mcNow()<end&&k<20000))){mcIter(root,1);k++}
        await new Promise(r=>setTimeout(r,0));
        if(tok!==ENDTOK)return null;
      }while(k<8||(mcNow()<end&&k<20000));
      pl=mcBest(root);
      const ch=root.ch.find(c=>root.mv[c.mi]===pl);
      q=ch?(p%2?-1:1)*ch.W/ch.N*3:0;n=root.N;
    }
    line.push(pl?{p,cards:pl.cards,lead:!S.tr,type:pl.type,value:pl.value,n:pl.n,mq:q,mn:n}:{p,cards:null});
    S=mcStep(S,pl);
    if(prog)prog(line.length);
  }
  return mcOver(S)?{line,reward:mcReward(S),S}:null;
}
async function endgameTrain(){
  const tok=++ENDTOK,rec=curRec(),S0=mcFromGame(G.turn),rounds=[];
  ENDREC=rec;ENDRUN=true;rec.training=true;rec.log=[];
  let ms=ENDMS,stable=false,last=null;
  for(let k=1;k<=ENDMAX;k++){
    endgameShow(`第 ${k} 轮：每手想 ${ms<1000?(ms/1000).toFixed(2):ms/1000} 秒，正在打…`,false,rounds);
    last=await endgameLine(S0,ms,tok,m=>{if(m%4===0)endgameShow(`第 ${k} 轮：每手想 ${ms<1000?(ms/1000).toFixed(2):ms/1000} 秒，打到第 ${m} 手…`,false,rounds)});
    if(tok!==ENDTOK)return;
    if(!last){ENDRUN=false;endgameShow('这一轮没有打完（出牌太多手），停下了。可以换一局。',true,rounds);return}
    rounds.push({k,ms,reward:last.reward,moves:last.line.length});
    if(k>=3&&rounds[k-1].reward===rounds[k-2].reward){stable=true;break}
    ms*=2;
  }
  // the line they settle on
  const S=last.S,order=S.out.slice();
  for(let k=1;k<=4;k++){const j=(order[order.length-1]+k)%4;if(!order.includes(j))order.push(j)}
  const r=last.reward;
  rec.log=last.line;rec.live=false;rec.training=false;
  rec.result=order.map((p,i)=>PLACE[i]+' '+NAMES[p]).join('，')+'；'+(r>0?'1号3号一方':'2号4号一方')+`赢 ${Math.abs(r)} 级`;
  rec.train={stable,rounds:rounds.map(x=>({ms:x.ms,reward:x.reward,moves:x.moves}))};
  rec.nv++;testStore();testList();
  ENDRUN=false;G.phase='roundEnd';
  endgameShow(stable?`摸索稳定了：连着两轮结果一样。最后一轮的打法就是它认为这一局最好的打法。`:`打满 ${ENDMAX} 轮，结果还在变，用最后一轮的打法。`,true,rounds);
  if(ENDAUTO)setTimeout(function wait(){if(tok!==ENDTOK||!ENDAUTO)return;if(TV.open||TV.edit){setTimeout(wait,1000);return}endgameNext()},3000);
}
// another position now (what is being trained on is given up, and a round not finished is not kept)
function endgameNext(){
  ENDTOK++;ENDRUN=false;
  const rec=curRec();
  if(rec&&rec.training){TREC.rounds.pop();testStore();testList()}
  G.phase='roundEnd';hideOverlay();
  act(roundEvt(false));
}
function testDecide(who){
  const sig=G.round+'#'+G.log.map(e=>e.p+':'+(e.cards?e.cards.map(c=>c.id).join('.'):'p')).join('|');
  const hit=TDEC.get(sig);
  if(hit&&hit.p===who){
    if(!hit.ids)return null;
    const cards=hit.ids.map(id=>G.hands[who].find(c=>c.id===id));
    if(cards.every(Boolean))return{...hit.rest,cards};
  }
  const pl=aiDecide(who);
  if(pl){const{cards,...rest}=pl;TDEC.set(sig,{p:who,ids:cards.map(c=>c.id),rest})}else TDEC.set(sig,{p:who,ids:null});
  return pl;
}
function syncUndo(){
  const b=$('#undoBtn');if(b)b.disabled=!(G&&G.phase==='play'&&TSNAP.length>=2);
  const go=$('#goBtn');if(go)go.hidden=!(G&&G.phase==='play'&&G.stepWait!=null);
}
function testUndo(){
  if(!TEST||!G||G.phase!=='play'||TSNAP.length<2)return;
  TSNAP.pop();
  const snap=TSNAP[TSNAP.length-1],tok=G.tok;
  for(const k of Object.keys(G))if(!(k in snap))delete G[k];
  Object.assign(G,structuredClone(snap));
  G.tok=tok+1; // whatever was still waiting to happen belongs to the step taken back
  const rec=curRec();
  if(rec&&rec.live&&rec.g===G.round){
    rec.log=G.log;
    for(const k of Object.keys(rec.notes))if(+k>G.log.length)delete rec.notes[k];
    rec.nv++;testStore();
  }
  sel=new Set();hints=[];hintIdx=0;cfm=null;
  pileRebuild();
  render();
  // back at the start of a turn that had not stopped (yours, or the computer's right after yours): yours begins again, the
  // computer's waits for its step
  if(G.phase==='play'&&G.turn===0)startTurn();
  else if(G.phase==='play'&&G.turn>0){G.stepWait=G.turn;G.turn=-1;G.nextLeader=-1;render()}
}
// 上一步 (the look-back): the table as it stands after the latest play, with how that play was made (the view's own 上一步 goes further back)
function testBack(){
  const rec=curRec();if(!rec)return;
  testView(TREC.rounds.length-1,rec.log.length,false);
}

