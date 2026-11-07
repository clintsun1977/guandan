/* ---------- 残局: a batch against the old rules ---------- */
// Positions made as in a 残局 (dealt, played down by the old rules to at most 15 cards each, one trick in progress); each is played twice,
// the search on seats 0 and 2 and the other side by the old rules (open hands), then the sides changed over; the result is how many
// levels the search side wins per round (the side going out first gains, as in a real round). The game on the screen waits meanwhile.
function endgamePosition(){
  for(;;){
    const L=2+Math.floor(Math.random()*13),deck=shuffle(makeDeck()),hands=[[],[],[],[]];
    for(let i=0;i<108;i++)hands[i%4].push(deck[i]);
    for(const h of hands)sortHand(h,L);
    G={hands,trick:null,L,seen:[],log:[],pw:[],open:false,out:[],passes:0};
    let turn=Math.floor(Math.random()*4),passes=0,ok=null;
    for(let n=0;n<1500&&ok===null;n++){
      const p=turn;
      let pl=aiDecide(p);
      if(!pl&&!G.trick)pl=genPlays(G.hands[p],L)[0];
      if(pl){
        G.seen.push(...pl.cards);G.log.push({p,cards:pl.cards,lead:!G.trick,type:pl.type,value:pl.value,n:pl.n});
        G.hands[p]=G.hands[p].filter(c=>!pl.cards.includes(c));
        if(!G.hands[p].length){ok=false;break}
        G.trick={player:p,play:pl};passes=0;
        if(G.hands.every(h=>h.length<=15)){ok=true;turn=(p+1)%4;break}
      }else{passes++;G.log.push({p,cards:null})}
      if(passes>=3){turn=G.trick.player;G.trick=null;passes=0}else turn=(p+1)%4;
    }
    if(ok)return{hands:G.hands,trick:G.trick,L,seen:G.seen,log:G.log,passes,turn};
  }
}
// plays the position out, the search on the side `mcTeam`, the old rules on the other; the levels won by the search side
async function endgamePlayOut(pos,mcTeam,ms,opp){
  G={hands:pos.hands.slice(),trick:pos.trick,L:pos.L,seen:pos.seen.slice(),log:pos.log.slice(),pw:[],open:true,out:[],passes:pos.passes};
  let S={h:G.hands.slice(),tr:pos.trick?{p:pos.trick.player,play:pos.trick.play}:null,ps:pos.passes,t:pos.turn,out:[],L:pos.L},moves=0;
  while(!mcOver(S)&&moves++<800){
    const p=S.t;let pl;
    if(p%2===mcTeam){
      const mv=mcMoves(S);
      if(mv.length===1)pl=mv[0];
      else{
        const root=mcNode(S),end=mcNow()+ms;let n=0;
        while(n<8||(mcNow()<end&&n<20000)){
          const t1=mcNow()+30;
          while(mcNow()<t1&&(n<8||(mcNow()<end&&n<20000))){mcIter(root,1);n++}
          await new Promise(r=>setTimeout(r,0));
        }
        pl=mcBest(root);
      }
    }else if(opp==='random'){const mv=mcMoves(S);pl=mv[Math.floor(Math.random()*mv.length)]}
    else{G.hands=S.h.slice();G.trick=S.tr?{player:S.tr.p,play:S.tr.play}:null;G.passes=S.ps;G.out=S.out.slice();pl=aiDecide(p)}
    if(pl){G.seen.push(...pl.cards);G.log.push({p,cards:pl.cards,lead:!S.tr,type:pl.type,value:pl.value,n:pl.n})}else G.log.push({p,cards:null});
    S=mcStep(S,pl);
  }
  if(!mcOver(S))return 0;
  const r=mcReward(S);
  return mcTeam===0?r:-r;
}
let ENDBATCH=false;
async function endgameBatch(games,ms,opp,show){
  const keep=G,res=[];
  ENDBATCH=true;
  try{
    for(let g=0;g<games&&ENDBATCH;g++){
      const pos=endgamePosition();
      for(const t of [0,1]){res.push(await endgamePlayOut(pos,t,ms,opp));show(g+(t+1)/2,games,res)}
    }
  }finally{G=keep;ENDBATCH=false}
  return res;
}
function endgameBatchPanel(){
  const stat=res=>{
    const n=res.length;if(!n)return'';
    const m=res.reduce((a,b)=>a+b,0)/n,sd=Math.sqrt(Math.max(0,res.reduce((a,b)=>a+b*b,0)/n-m*m)),w=res.filter(x=>x>0).length;
    return`${n} 局：搜索队平均每局净赢 <b>${m.toFixed(2)}</b> 级（±${(1.96*sd/Math.sqrt(n)).toFixed(2)}），头游率 <b>${(w/n*100).toFixed(0)}%</b>`;
  };
  showPanel(`<h2>批量对比：自己摸索 对 老规则</h2>
    <p class="muted">每个局面打两次（搜索队坐 1、3 号位，再换过来），老规则队明牌。局面是电脑按老规则打到每家 ≤15 张的残局。打的时候牌桌上的局先停着。</p>
    <p><label>局面数 <input id="bN" type="number" min="1" max="500" value="20" style="width:5em"></label>　<label>搜索每手 <select id="bMs"><option value="30">0.03 秒</option><option value="100" selected>0.1 秒</option><option value="300">0.3 秒</option><option value="1000">1 秒</option></select></label>　<label>对手 <select id="bOpp"><option value="rules" selected>老规则</option><option value="random">随机出牌</option></select></label></p>
    <div class="trec" id="bOut" style="min-height:2.6em"></div>
    <div class="btns"><button class="btn primary" id="bGo">开始</button><button class="btn" id="bStop">停</button><button class="btn" id="bClose">关闭</button></div>`);
  $('#bGo').onclick=async()=>{
    $('#bGo').disabled=true;
    const out=$('#bOut');
    const res=await endgameBatch(+$('#bN').value||20,+$('#bMs').value,$('#bOpp').value,(k,N,r)=>{out.innerHTML=`已打 ${Math.floor(k)}/${N} 个局面<br>${stat(r)}`});
    out.innerHTML=`<b>完成</b><br>${stat(res)}<br><span class="muted">大于 0：搜索（自己摸索）比对手强。多局之间差别大，局数越多越准。</span>`;
    $('#bGo').disabled=false;
  };
  $('#bStop').onclick=()=>{ENDBATCH=false};
  $('#bClose').onclick=()=>{ENDBATCH=false;hideOverlay()};
}

