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
// 残局: the computers work the position out to the end (EsSolver: every play of the four, the best of them found for certain). They try one
// order of the plays for a while, then another for twice as long, and so on round, 40 ms at a time so the page stays alive (nothing is drawn
// meanwhile), until the result is known or ENDCAP seconds are up (then the position is given up). The line of best plays is what 回放 shows.
let ENDRUN=false,ENDREC=null;
// the training's box over the table: where it is, and the buttons
function endgameShow(head,done,note=''){
  const box=$('#etrain');if(!box)return;
  box.innerHTML=`<h3>残局 · 四家电脑自己算出最好的打法</h3><div class="eh">${head}</div>${note?`<div class="en">${note}</div>`:''}
    <div class="eb">${ENDREC&&!ENDREC.training?'<button class="btn primary" id="etView">回放这个最好的打法</button>':''}${ENDRUN?'<button class="btn" id="etStop">停</button>':''}<button class="btn" id="etNext">换一局</button></div>`;
}
async function endgameTrain(){
  const tok=++ENDTOK,rec=curRec(),S0=mcFromGame(G.turn),t0=mcNow(),cap=ENDCAP*1000,nodeText=n=>n<1e4?n:n<1e8?(n/1e4).toFixed(n<1e5?1:0)+' 万':(n/1e8).toFixed(1)+' 亿';
  ENDREC=rec;ENDRUN=true;rec.training=true;rec.log=[];
  let solver=null,ci=0,round=0,slice=2000,sliceEnd=0,nodes=0,tries=0,found=false,lastShow=0;
  const sec=()=>((mcNow()-t0)/1000).toFixed(0);
  endgameShow('正在算：四家的牌都看得见，每一手都试遍，找出双方都打到最好时的结果…',false);
  while(mcNow()-t0<cap){
    if(!solver){solver=new EsSolver(S0,ES_PORT[ci],ENDTT);sliceEnd=mcNow()+slice;tries++}
    if(solver.step(40)){found=true;break}
    if(mcNow()>sliceEnd){nodes+=solver.nodes;solver=null;if(++ci>=ES_PORT.length){ci=0;round++;slice*=2}}
    if(mcNow()-lastShow>400){lastShow=mcNow();endgameShow(`正在算……已用 ${sec()} 秒，看过 ${nodeText(nodes+(solver?solver.nodes:0))} 个局面，试过 ${tries} 种试探顺序（最多算 ${ENDCAP} 秒）`,false)}
    await new Promise(r=>setTimeout(r,0));
    if(tok!==ENDTOK)return;
  }
  if(tok!==ENDTOK)return;
  if(solver)nodes+=solver.nodes;
  const ln=found?solver.line():null;
  if(!ln){
    // too big to finish: the position is given up (the record is dropped by 换一局)
    ENDRUN=false;
    endgameShow(`这个局面太复杂，${ENDCAP} 秒没有算完，放弃了。${ENDAUTO?'马上换下一局。':'可以“换一局”。'}`,true);
    if(ENDAUTO)setTimeout(()=>{if(tok===ENDTOK&&ENDAUTO)endgameNext()},2500);
    return;
  }
  const S=ln.S,order=S.out.slice();
  for(let k=1;k<=4;k++){const j=(order[order.length-1]+k)%4;if(!order.includes(j))order.push(j)}
  const r=ln.value,took=(mcNow()-t0)/1000;
  rec.log=ln.line;rec.live=false;rec.training=false;
  rec.result=order.map((p,i)=>PLACE[i]+' '+NAMES[p]).join('，')+'；'+(r>0?'1号3号一方':'2号4号一方')+`赢 ${Math.abs(r)} 级`;
  rec.train={value:r,sec:took,nodes,tries,moves:ln.line.length};
  rec.nv++;testStore();testList();
  ENDRUN=false;G.phase='roundEnd';
  endgameShow(`算完了：两边都打到最好，结果是 <b>${r>0?'1号3号一方':'2号4号一方'}赢 ${Math.abs(r)} 级</b>（${ln.line.length} 手，用了 ${took.toFixed(1)} 秒）。`,true,'每一手都是当时最好的一手；几种同样好的打法里，选的是先试到的（能一手出完的、一次出牌多的、不用炸弹的优先，同样的取小牌）。点“回放”一步一步看。');
  if(ENDAUTO)setTimeout(function wait(){if(tok!==ENDTOK||!ENDAUTO)return;if(TV.open||TV.edit){setTimeout(wait,1000);return}endgameNext()},3000);
}
// another position now (what is being worked on is given up, and a round not finished is not kept)
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

