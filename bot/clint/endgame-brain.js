/* ---------- 残局大脑: the last few cards of a round, worked out exactly ---------- */
// When every hand is down to a few cards (BRAIN.max), the round can be searched to the end. A player never sees the other hands, so the
// computer cannot just solve the real position: it deals the cards it has not seen (not played, not in its hand) at random to the other
// three, BRAIN.k times, each deal weighted by how well it fits what those players have shown (inferEvents / eventFactor, the same
// reading of passes and plays the playing rules use); in each deal the exact solver gives the result of every play it could make
// (the side of seats 0 and 2 wins or loses levels, as in a real round); and the play with the best weighted result is the one.
// The playing rules' own play is the starting point: it is kept unless another play is better by BRAIN.edge levels or more. Tried out against the
// rules (the rules' play first, the brain only where it can change it, the other side all rules), per endgame, in levels gained over a round played by
// the rules alone: 600 endgames of up to 6 cards a hand: +0.15 (a player who saw every hand: +0.30); 400 endgames of up to 10 cards a hand: +0.16 (±0.06),
// the search finishing in time for 70% of the plays it was asked about, 1.2 seconds a play on average. A search that runs out of time (BRAIN.ms) or finds
// the deals too hard is dropped, and the rules' play stands. Only stezer0's computer partner searches the true deal; other seats use public information.
// A position: h the four hands, tr the play to beat {p, play} or null, ps how many passed on it, t whose turn, out who is out so
// far (in order), L the level.
const mcOver=S=>(!S.h[0].length&&!S.h[2].length)||(!S.h[1].length&&!S.h[3].length);
// the levels the side of seats 0 and 2 wins (+) or loses (-) in a finished round (the players not out fill the last places in turn order)
function mcReward(S){
  const out=S.out.slice();
  for(let k=1;k<=4;k++){const j=(out[out.length-1]+k)%4;if(!out.includes(j))out.push(j)}
  const first=out[0],pos=out.indexOf((first+2)%4),up=pos===1?3:pos===2?2:1;
  return first%2===0?up:-up;
}
// every play of the cards each hand can make is worked out once, whatever the position (the hand array is the key)
const mcPlaysCache=new WeakMap();
function mcPlays(hand,L){let r=mcPlaysCache.get(hand);if(!r){r=genPlays(hand,L);mcPlaysCache.set(hand,r)}return r}
// the plays open to the player to move: leading, any; following, those that beat the play on the table, and a pass (null)
function mcMoves(S){
  const all=mcPlays(S.h[S.t],S.L);
  if(!S.tr)return all;
  const cur=S.tr.play,mv=[];
  for(const pl of all)if(beats(pl,cur))mv.push(pl);
  mv.push(null);
  return mv;
}
// the position after the player to move plays `pl` (null: passes), as the round goes on at the table
function mcStep(S,pl){
  const p=S.t,T={h:S.h.slice(),tr:S.tr,ps:S.ps,t:p,out:S.out,L:S.L};
  if(pl){
    const ids=new Set(pl.cards.map(c=>c.id));
    T.h[p]=S.h[p].filter(c=>!ids.has(c.id));
    T.tr={p,play:pl};T.ps=0;
    if(!T.h[p].length){T.out=S.out.concat(p);if(mcOver(T))return T}
  }else T.ps=S.ps+1;
  const w=T.tr.p;
  let others=0;
  for(let i=0;i<4;i++)if(i!==w&&T.h[i].length)others++;
  const next=i=>{for(let k=1;k<=4;k++){const j=(i+k)%4;if(T.h[j].length)return j}return i};
  if(T.ps>=others){
    // the trick is won: its winner leads, or, if out, the partner, or else the next player still in
    T.t=T.h[w].length?w:T.h[(w+2)%4].length?(w+2)%4:next(w);
    T.tr=null;T.ps=0;
  }else T.t=next(p);
  return T;
}
const mcNow=()=>typeof performance!=='undefined'?performance.now():Date.now();
/* ---------- 残局: worked out to the end (every hand open: minimax over the plays, with a table of the positions done) ---------- */
// With every hand open the round is a game with nothing hidden, so the best play of each of the four can be found for certain: the side of
// seats 0 and 2 wants the levels (mcReward) as high as it can make them, the side of 1 and 3 as low, each player choosing among every play
// there is (genPlays) or a pass. "Is the result at least g?" is asked by a search over the plays that stops as soon as the answer is clear
// (alpha-beta), every position finished is kept (the same position comes up again by other orders of play) and, g being tried from the
// middle (bisection), the exact result is found in three questions at most. Cards that are the same (the same rank and suit) are one in the
// table. The order the plays are tried in decides how soon the answer is clear and suits different positions, so several orders are tried,
// each for longer than the one before (ES_PORT). After that, the line: from the position, a play that keeps the result is chosen again and
// again, so every play of it is one of the best (of several equally good ones, the first in the order).
const ES_SUIT={S:0,H:1,C:2,D:3,J:4},ES_TYPE={single:0,pair:1,triple:2,full:3,straight:4,pairs3:5,trip2:6,bomb:7,sflush:8,jokers:9};
const ES_SORT={
  A:(a,b)=>(b.full-a.full)||(a.bomb-b.bomb)||(b.idx.length-a.idx.length)||(a.value-b.value),
  D:(a,b)=>(b.full-a.full)||(a.bomb-b.bomb)||(b.value-a.value)||(b.idx.length-a.idx.length),
  F:(a,b)=>(b.full-a.full)||(b.idx.length-a.idx.length)||(a.bomb-b.bomb)||(b.value-a.value)
};
// the orders tried (kill: the plays that cut the search short at the same depth are tried first; ordL leading, ordF following)
const ES_PORT=[{kill:1,ordL:'A',ordF:'A'},{kill:0,ordL:'A',ordF:'F'},{kill:0,ordL:'D',ordF:'A'},{kill:1,ordL:'F',ordF:'D'},{kill:0,ordL:'A',ordF:'A'}];
class EsSolver{
  constructor(S0,opt={},ttMax=5e6){
    this.opt={kill:opt.kill||0,ordL:opt.ordL||'A',ordF:opt.ordF||'A'};
    this.L=S0.L;this.ttMax=ttMax;
    // the hands in one fixed order (cards that are the same stand side by side), so equal hands read the same
    this.S0={h:S0.h.map(h=>sortHand(h.slice(),S0.L)),tr:S0.tr,ps:S0.ps,t:S0.t,out:S0.out.slice(),L:S0.L};
    this.nodes=0;this.deadline=Infinity;
    this.tt=new Map();   // position (a number) -> lowest result known (3 bits) | highest (3 bits) | best play (the rest)
    this.hs=new Map();this.infos=[];this.kill=[];
    this.vlo=-3;this.vhi=3;this.done=false;this.value=0;
    this.hi0=this.S0.h.map(h=>this.info(h));
  }
  // a hand: its plays (from the first hand seen with those cards) in the order to try them
  info(h){
    let k='';
    for(const c of h)k+=(c.r*8+ES_SUIT[c.s])+',';
    let o=this.hs.get(k);
    if(!o){
      const tpl=genPlays(h,this.L).map(pl=>({type:pl.type,value:pl.value,n:pl.n,wu:pl.wu,idx:pl.cards.map(c=>h.indexOf(c)),full:pl.cards.length===h.length,bomb:isBomb(pl)}));
      const sg=new Map();
      tpl.forEach((t,i)=>{t.i=i;t.sg=ES_TYPE[t.type]+16*(t.value+128*t.n);sg.set(t.sg,t)});
      o={id:this.infos.length,tpl,order:tpl.slice().sort(ES_SORT[this.opt.ordL]),orderF:tpl.slice().sort(ES_SORT[this.opt.ordF]),sg};
      this.infos.push(o);this.hs.set(k,o);
    }
    return o;
  }
  key(S,hi){
    const tr=S.tr,trs=tr?1+tr.p+4*(ES_TYPE[tr.play.type]+16*(tr.play.value+128*tr.play.n)):0;
    let outs=0;for(const x of S.out)outs=outs*5+x+1;
    let a=0x811c9dc5,b=0x1234567;
    const vs=[hi[0].id,hi[1].id,hi[2].id,hi[3].id,S.t+4*S.ps,trs,outs];
    for(const v of vs){a=Math.imul(a^v,0x01000193);a^=a>>>15;b=Math.imul(b+v+0x9e3779b9,0x85ebca6b);b^=b>>>13}
    return(a>>>0)*2097152+(b&0x1FFFFF);
  }
  // the result for seats 0 and 2 as far as the window (alpha, beta) tells (a result at or below alpha, or at or above beta, is a bound only)
  ab(S,hi,alpha,beta,ply){
    if(mcOver(S))return mcReward(S);
    if((++this.nodes&1023)===0&&mcNow()>this.deadline)throw'stop';
    const k=this.key(S,hi),e=this.tt.get(k);
    let hint=-1;
    if(e!==undefined){
      const lo=(e&7)-3,hg=((e>>3)&7)-3;
      hint=(e>>6)-1;
      if(lo===hg||lo>=beta)return lo;
      if(hg<=alpha)return hg;
      if(lo>alpha)alpha=lo;if(hg<beta)beta=hg;
    }
    const a0=alpha,b0=beta,p=S.t,max=p%2===0,hand=S.h[p],inf=hi[p];
    let best=max?-99:99,bi=-1;
    const tr=S.tr&&S.tr.play,mate=S.tr&&S.tr.p%2===p%2;
    const tryOne=t=>{
      const pl=t?{type:t.type,value:t.value,n:t.n,wu:t.wu,cards:t.idx.map(i=>hand[i])}:null;
      const T=mcStep(S,pl),hi2=hi.slice();
      if(pl)hi2[p]=this.info(T.h[p]);
      const v=this.ab(T,hi2,alpha,beta,ply+1);
      if(max){if(v>best){best=v;bi=t?t.i:-2}if(best>alpha)alpha=best}
      else{if(v<best){best=v;bi=t?t.i:-2}if(best<beta)beta=best}
      return alpha>=beta;
    };
    const okT=t=>!tr||beats(t,tr);
    let cut=false;
    if(hint>=0&&hint<inf.tpl.length&&okT(inf.tpl[hint]))cut=tryOne(inf.tpl[hint]);
    else if(hint===-2&&tr)cut=tryOne(null);
    // a pass first when the partner holds the table
    if(!cut&&tr&&mate&&hint!==-2)cut=tryOne(null);
    const kl=this.kill[ply]||(this.kill[ply]=[-1,-1]),K=this.opt.kill;
    if(K)for(let q=0;q<2&&!cut;q++){const t=kl[q]>=0?inf.sg.get(kl[q]):null;if(t&&t.i!==hint&&okT(t)){cut=tryOne(t);if(cut&&q===1){kl[1]=kl[0];kl[0]=t.sg}}}
    if(!cut)for(const t of(tr?inf.orderF:inf.order)){
      if(t.i===hint||!okT(t)||(K&&(t.sg===kl[0]||t.sg===kl[1])))continue;
      if(tryOne(t)){cut=true;if(K&&t.sg!==kl[0]){kl[1]=kl[0];kl[0]=t.sg}break}
    }
    if(!cut&&tr&&!mate&&hint!==-2)tryOne(null);
    let lo=-3,hg=3;
    if(best<=a0)hg=best;else if(best>=b0)lo=best;else lo=hg=best;
    if(e!==undefined){lo=Math.max(lo,(e&7)-3);hg=Math.min(hg,((e>>3)&7)-3)}
    if(this.tt.size>=this.ttMax&&e===undefined)this.tt.clear();
    this.tt.set(k,(lo+3)|((hg+3)<<3)|((bi+1)<<6));
    return best;
  }
  // work for at most ms milliseconds more (the table is kept, so it can be called again); true when the result is known
  step(ms){
    if(this.done)return true;
    this.deadline=mcNow()+ms;
    try{
      while(this.vlo<this.vhi){
        const g=(this.vlo+this.vhi+1)>>1,v=this.ab(this.S0,this.hi0,g-1,g,0);
        if(v>=g)this.vlo=g;else this.vhi=g-1;
      }
      this.done=true;this.value=this.vlo;return true;
    }catch(x){if(x!=='stop')throw x;return false}
  }
  // the line: from the position, each player plays the first play (in the order) that keeps the result
  line(){
    const v=this.value,out=[];
    let S=this.S0,hi=this.hi0;
    this.deadline=Infinity;
    for(let n=0;!mcOver(S)&&n<800;n++){
      const p=S.t,max=p%2===0,hand=S.h[p],inf=hi[p],tr=S.tr&&S.tr.play,mate=S.tr&&S.tr.p%2===p%2;
      const cand=[];
      if(tr&&mate)cand.push(null);
      for(const t of(tr?inf.orderF:inf.order))if(!tr||beats(t,tr))cand.push(t);
      if(tr&&!mate)cand.push(null);
      let pick=null,pickT=null,T=null,hi2=null,found=false;
      for(const t of cand){
        const pl=t?{type:t.type,value:t.value,n:t.n,wu:t.wu,cards:t.idx.map(i=>hand[i])}:null;
        const T1=mcStep(S,pl),h2=hi.slice();
        if(pl)h2[p]=this.info(T1.h[p]);
        const r=max?this.ab(T1,h2,v-1,v,0)>=v:this.ab(T1,h2,v,v+1,0)<=v;
        if(r){pick=pl;T=T1;hi2=h2;found=true;break}
      }
      if(!found)return null;
      out.push(pick?{p,cards:pick.cards,lead:!S.tr,type:pick.type,value:pick.value,n:pick.n}:{p,cards:null});
      S=T;hi=hi2;
    }
    return mcOver(S)?{line:out,S,value:v}:null;
  }
}

// the settings (an object so that the lab can try others): max = every hand at most this many cards; k = deals tried; edge = how much better
// another play must be (levels); ms = time for one decision; minWorlds = fewer deals than this are no evidence; worldMs = most time one deal
// may take (the exact search of a ten-card endgame is quick in most deals and very slow in a few: such a deal is dropped)
const BRAIN={max:10,k:16,edge:.2,ms:2500,minWorlds:3,worldMs:1200,stat:{calls:0,used:0,fallback:0,changed:0,ms:0}};
// a position's exact result for seats 0 and 2 (-3..3), from a solver that already holds part of the search (the table is shared)
function esValue(sv,T){
  if(mcOver(T))return mcReward(T);
  const hi=T.h.map(h=>sv.info(h));let lo=-3,hg=3;
  while(lo<hg){const g=(lo+hg+1)>>1,v=sv.ab(T,hi,g-1,g,0);if(v>=g)lo=g;else hg=g-1}
  return lo;
}
const brainOn=p=>{
  if(typeof G==='undefined'||!G||G.phase!=='play'||G.turn!==p)return false;
  for(let i=0;i<4;i++)if(G.hands[i].length>BRAIN.max)return false;
  return G.hands[p].length>0;
};
// one deal: the exact result of every play in it, or null if the search does not finish within `until`. Several orders of searching are tried in
// turn, each for longer than the one before (some deals are quick in one order and slow in another); the work goes on in slices of about
// 80 ms, between which the generator yields
function* esWorld(W,legal,until){
  const svs=[];let slice=250;
  while(mcNow()<until){
    for(let ci=0;ci<3;ci++){
      const t1=Math.min(until,mcNow()+slice);
      const sv=svs[ci]||(svs[ci]=new EsSolver(W,ES_PORT[ci],2e6));
      while(mcNow()<t1){
        sv.deadline=Math.min(t1,mcNow()+80);
        try{return legal.map(m=>esValue(sv,mcStep(W,m)))}catch(e){if(e!=='stop')throw e}
        yield;
      }
    }
    slice*=2;
  }
  return null;
}
// the play the rules chose (or null for a pass) and the better one, if there is one; the rules' play when the search has no better answer.
// Worked out deal by deal as a generator (it yields often), so the page can go on while the computer "thinks"
function* brainCore(p,rulesPl){
  const st=BRAIN.stat;
  try{
    if(!brainOn(p))return rulesPl;
    const S={h:G.hands.map(h=>h.slice()),tr:G.trick?{p:G.trick.player,play:G.trick.play}:null,ps:G.passes||0,t:p,out:(G.out||[]).slice(),L:G.L};
    const legal=mcMoves(S);
    if(legal.length<2)return rulesPl;
    const same=(m,q)=>(m===null&&q===null)||(m&&q&&m.cards.length===q.cards.length&&m.cards.every(c=>q.cards.includes(c)));
    const ri=legal.findIndex(m=>same(m,rulesPl));
    if(ri<0)return rulesPl;
    st.calls++;
    if(aiSeesAll(p)){
      const t0=mcNow();
      try{
        const vals=yield* esWorld(S,legal,t0+BRAIN.ms);
        if(!vals){st.fallback++;return rulesPl}
        const sign=p%2===0?1:-1;
        let bi=ri;
        for(let i=0;i<legal.length;i++)if(sign*vals[i]>sign*vals[bi])bi=i;
        st.used++;if(bi!==ri)st.changed++;
        return bi===ri?rulesPl:legal[bi];
      }finally{st.ms+=mcNow()-t0}
    }
    const t0=mcNow(),ev=inferEvents(p);
    const gone=new Set((G.seen||[]).concat(G.hands[p]).map(c=>c.id));
    const pool=makeDeck().filter(c=>!gone.has(c.id));
    const others=[1,2,3].map(k=>(p+k)%4),sizes=others.map(q=>S.h[q].length);
    if(pool.length<sizes.reduce((a,b)=>a+b,0))return rulesPl;
    const sign=p%2===0?1:-1,score=legal.map(()=>0);
    let wsum=0,worlds=0,dropped=0;
    try{
      for(let w=0;w<BRAIN.k&&mcNow()-t0<BRAIN.ms;w++){
        const cards=pool.slice();
        for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]]}
        const h=S.h.slice();let at=0;
        others.forEach((q,i)=>{h[q]=sortHand(cards.slice(at,at+sizes[i]),S.L);at+=sizes[i]});
        let wt=1;
        others.forEach((q,i)=>{const ks=handCounts(h[q],S.L);for(const x of ev[q])wt*=eventFactor(x,ks)});
        const W={h,tr:S.tr,ps:S.ps,t:S.t,out:S.out,L:S.L};
        const vals=yield* esWorld(W,legal,Math.min(t0+BRAIN.ms,mcNow()+BRAIN.worldMs));
        if(!vals){if(++dropped>=2&&!worlds)break;continue} // two deals in a row too hard to finish: give up
        vals.forEach((v,i)=>{score[i]+=wt*sign*v});wsum+=wt;worlds++;
        yield;
      }
    }finally{st.ms+=mcNow()-t0}
    if(worlds<BRAIN.minWorlds||!wsum){st.fallback++;return rulesPl}
    st.used++;
    const avg=score.map(x=>x/wsum);
    avg[ri]+=BRAIN.edge;
    let bi=ri;for(let i=0;i<legal.length;i++)if(avg[i]>avg[bi]+1e-9)bi=i;
    if(bi!==ri)st.changed++;
    return bi===ri?rulesPl:legal[bi];
  }catch(e){console.warn('残局大脑出错，用规则的出法',e);return rulesPl}
}
// all at once (the training version, where a computer moves at the press of 继续)
function endgameBrain(p,rulesPl){
  const g=brainCore(p,rulesPl);let r;
  do{r=g.next()}while(!r.done);
  return r.value;
}
// a little at a time: done(play) when finished; `alive()` says whether the table is still where it was
function endgameBrainAsync(p,rulesPl,alive,done){
  const g=brainCore(p,rulesPl);
  const step=()=>{
    if(!alive())return;
    const r=g.next();
    if(r.done)done(r.value);else setTimeout(step,0);
  };
  step();
}
