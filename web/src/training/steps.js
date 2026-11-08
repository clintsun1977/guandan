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
function testDecide(who){
  const sig=G.round+'#'+G.log.map(e=>e.p+':'+(e.cards?e.cards.map(c=>c.id).join('.'):'p')).join('|');
  const hit=TDEC.get(sig);
  if(hit&&hit.p===who){
    if(!hit.ids)return null;
    const cards=hit.ids.map(id=>G.hands[who].find(c=>c.id===id));
    if(cards.every(Boolean))return{...hit.rest,cards};
  }
  const pl=rulesMove(who);
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

