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

