/* ---------- 残局: the computers explore by themselves (Monte Carlo tree search) ---------- */
// In a 残局 all four players are computers and every hand is open. They use none of the playing rules above: a computer to play looks
// at every play it could make (or a pass) and tries them out, each many times to the end of the round, the others playing at random;
// the plays that did best are tried more (UCT), and in the end it plays the one tried most. What it is after is the levels won (or lost)
// by its side as at the end of a real round: the side whose player goes out first gains 3 if that side's second player is second out,
// 2 if third, 1 if last. Nothing is learnt from round to round: each move is worked out afresh from the position, and the more time
// (the more tries) it has the better the move.
// A position: h the four hands (arrays of cards, never changed, only replaced), tr the play to beat {p, play} or null, ps how many have
// passed on it, t whose turn, out who is out so far (in order), L the level.
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
function mcRollout(S){
  let T=S;
  for(let n=0;n<600&&!mcOver(T);n++){const mv=mcMoves(T);T=mcStep(T,mv[Math.random()*mv.length|0])}
  return mcOver(T)?mcReward(T)/3:0;
}
const mcNode=S=>({S,mv:null,un:null,ch:[],N:0,W:0,done:mcOver(S)});
// one try: down the tree by the best-looking plays to a play not yet tried, then a random game to the end, and the result back up
// (W adds the results as they stand for the side of seats 0 and 2, between -1 and 1; each player looks at it from their own side)
function mcIter(root,C){
  const path=[root];let node=root,r;
  for(;;){
    if(node.done){r=mcReward(node.S)/3;break}
    if(!node.mv){
      node.mv=mcMoves(node.S);node.un=node.mv.map((_,i)=>i);
      for(let i=node.un.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[node.un[i],node.un[j]]=[node.un[j],node.un[i]]}
    }
    if(node.un.length){
      const i=node.un.pop(),c=mcNode(mcStep(node.S,node.mv[i]));
      c.mi=i;node.ch.push(c);path.push(c);
      r=c.done?mcReward(c.S)/3:mcRollout(c.S);
      break;
    }
    const sg=node.S.t%2?-1:1,ln=Math.log(node.N);
    let best=null,bv=-Infinity;
    for(const c of node.ch){const v=sg*c.W/c.N+C*Math.sqrt(ln/c.N);if(v>bv){bv=v;best=c}}
    node=best;path.push(node);
  }
  for(const n of path){n.N++;n.W+=r}
}
// the play tried most (null: a pass)
function mcBest(root){
  if(!root.mv)root.mv=mcMoves(root.S);
  let b=null;
  for(const c of root.ch)if(!b||c.N>b.N)b=c;
  return b?root.mv[b.mi]:root.mv[0];
}
// a position from the game's own state: whose turn it is is given
const mcFromGame=t=>({h:G.hands.map(h=>h.slice()),tr:G.trick?{p:G.trick.player,play:G.trick.play}:null,ps:G.passes||0,t,out:(G.out||[]).slice(),L:G.L});
const mcNow=()=>typeof performance!=='undefined'?performance.now():Date.now();
// the best play for the player to move: by time (ms, at most `max` tries: a position that is as good as decided needs no more) or by number
// of tries (iters); only one play open: no search. UCT constant C
function mcSearch(S,{ms=1000,iters=0,C=1,max=20000}={}){
  const mv=mcMoves(S);
  if(mv.length===1)return{pl:mv[0],n:0,q:0};
  const root=mcNode(S);
  if(iters)for(let i=0;i<iters;i++)mcIter(root,C);
  else{const end=mcNow()+ms;let n=0;while(n++<8||n<max&&mcNow()<end)mcIter(root,C)}
  const pl=mcBest(root),ch=root.ch.find(c=>root.mv[c.mi]===pl);
  return{pl,n:root.N,q:ch?(S.t%2?-1:1)*ch.W/ch.N*3:0};
}

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
