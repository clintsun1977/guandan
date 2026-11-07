/* ---------- human actions ---------- */
function selectedCards(){return G.hands[0].filter(c=>sel.has(c.id))}
// waiting for the host to confirm your last move; never for more than four seconds
const waitingHost=()=>NET.pending&&Date.now()-(NET.pendingAt||0)<4000;
function onPlay(){
  if(ENDG)return;
  // you lead next but the finished trick is still on show: the play goes out the moment your turn starts
  if(G.phase==='play'&&G.turn===-1&&G.nextLeader===0){
    if(!selectedCards().length){setMsg('先选几张牌',true);return}
    if(askConfirm())return;
    G.queuedPlay=true;setMsg('这一轮的牌收起后马上出');return;
  }
  if(G.phase!=='play')return;
  if(G.turn!==0){setMsg('还没轮到你出牌',true);return}
  const cards=selectedCards();
  if(!cards.length){setMsg('先选几张牌',true);return}
  const cur=G.trick?G.trick.play:null;
  const reads=analyze(cards,G.L);
  if(!reads.length){setMsg('这几张牌不成牌型',true);return}
  const ok=reads.filter(r=>beats(r,cur)).sort((a,b)=>strength(b)-strength(a));
  if(!ok.length){setMsg(`管不上${cur?TYPE_NAME[cur.type]:''}`,true);return}
  if(waitingHost())return;
  if(askConfirm())return;
  act(playEvt(0,{...ok[0],cards}));
}
// 出牌需确认 (an option): the first press only shows the picked cards large and turns 出牌 into 确认; pressing it again
// with the same cards still picked plays them, and any change to the picked cards or the turn calls it off
let confirmPlay=false,cfm=null;
try{confirmPlay=localStorage.getItem('guandan-confirm')==='1'}catch(_){}
// 极简出牌区 (an option, computer and tablet only): this player's table shows the plays the way the test version does, in
// one framed box in the middle, in the order they were made, instead of the cards thrown down by each player
// (the 极简出牌区 option is gone: the table's cards lie in front of each player, as in the first versions; the test version keeps its own box)
const miniPlays=false;
function miniMode(){return miniPlays&&!TEST&&!isPhone()}
function syncMini(){
  const on=miniMode(),b=document.body;
  if(b.classList.contains('mini')!==on){b.classList.toggle('mini',on);if(!on){const t=$('#tplays');if(t){t.innerHTML='';t.dataset.k=''}}}
}
const selKey=()=>[...sel].sort((a,b)=>a-b).join(',');
function askConfirm(){
  if(!confirmPlay||cfm===selKey())return false;
  cfm=selKey();renderControls();return true;
}
// the cards waiting for 确认, in the order the play reads, 1.8 times the size of the hand's cards and side by side in the
// middle of the table; a long play keeps every card's corner in view by overlapping, and shrinks only if it must
function syncCfmShow(){
  let box=$('#cfmShow');
  if(!cfm){if(box)box.hidden=true;return}
  if(!box){box=document.createElement('div');box.id='cfmShow';document.body.appendChild(box)}
  const cards=selectedCards(),r=analyze(cards,G.L)[0],shown=r?displayOrder({...r,cards},G.L):cards,n=shown.length;
  const t=$('#table').getBoundingClientRect(),hc=$('#hand .card'),maxW=t.width*.9;
  const cw=Math.min((hc?hc.offsetWidth:60)*1.8,t.height*.5/1.4,maxW/(1+.45*(n-1)));
  const step=n>1?Math.min(cw*1.08,(maxW-cw)/(n-1)):cw;
  box.style.setProperty('--cw',cw+'px');box.style.setProperty('--step',step-cw+'px');
  box.innerHTML=shown.map(c=>cardHTML(c,G.L)).join('');
  box.style.left=t.left+t.width/2+'px';box.style.top=t.top+t.height/2+'px';
  box.hidden=false;
}
addEventListener('resize',()=>{if(cfm)syncCfmShow()});
function onPass(){
  if(ENDG)return;
  if(G.phase!=='play'||G.turn!==0||!G.trick||waitingHost())return;
  sel=new Set();
  act(playEvt(0,null));
}
function onHint(){
  if(ENDG)return;
  if(G.phase!=='play'||G.turn!==0)return;
  if(!hints.length){setMsg('没有能管上的牌，可以点“过”');return}
  const h=hints[hintIdx%hints.length];hintIdx++;
  sel=new Set(h.cards.map(c=>c.id));
  renderHand();
}
function onReturn(){
  if(waitingHost())return;
  if(G.phase==='tribPick'){
    if(!G.tribGivers.includes(0)||G.tribPick[0]!=null)return;
    const cards=selectedCards(),ok=tribOptions(0);
    if(cards.length!==1||!ok.includes(cards[0])){setMsg('要进贡手里最大的一张牌（百搭除外）',true);return}
    act({k:'tribute',p:toAbs(0),id:cards[0].id});
    return;
  }
  if(!owesReturn(0))return;
  const cards=selectedCards();
  if(cards.length!==1){setMsg('选一张 10 或以下的牌还贡',true);return}
  const c=cards[0];
  if(c.r>10||isWild(c,G.L)){setMsg('还贡的牌要在 10 或以下，且不能是百搭',true);return}
  act({k:'return',p:toAbs(0),id:c.id});
}

