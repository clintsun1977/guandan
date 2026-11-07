/* a computer's hand rearranged by you while sorting: the groups you set stay as you set them, every other card is arranged
   again the computer's way; shown with its 牌力 beside the computer's own, and the computer plays from it (its groups read
   as plays, those that make none as their cards rank by rank) */
const uaOf=p=>G&&G.ua&&G.ua.r===G.round&&G.ua.lock[p]&&G.ua.lock[p].length?G.ua.lock[p]:null;
const rawPower=(h,L)=>scorePower(armScore(armPlaysRaw(h,L)));
function testArm(hand,L){
  if(!TEST||!G)return null;
  for(const p of [1,2,3]){
    if(hand!==G.hands[p]||!uaOf(p))continue;
    return seatGroups(p).flatMap(gr=>groupUnits(gr.map(id=>hand.find(c=>c.id===id)),L)).map(u=>({...u,wu:u.cards.filter(c=>isWild(c,L)).length}));
  }
  return null;
}
// the groups you set that are still whole, and the rest of the hand arranged the computer's way, in the order shown
function lockedAndRest(hand,locks,L){
  const have=new Set(hand.map(c=>c.id));
  const kept=locks.filter(gr=>gr.every(id=>have.has(id)));
  const used=new Set(kept.flat()),free=hand.filter(c=>!used.has(c.id));
  const auto=free.length?armPlaysRaw(free,L).map(u=>displayOrder(u,L).map(c=>c.id)):[];
  return{kept,groups:sortGroups(kept.concat(auto),new Map(hand.map(c=>[c.id,c])),L)};
}
// a computer's groups now: yours plus its own arrangement of the rest, or all its own
function seatGroups(p){
  const h=G.hands[p],locks=uaOf(p);
  if(!locks)return handUnits(h,G.L,true).map(u=>u.cards.map(c=>c.id));
  return lockedAndRest(h,locks,G.L).groups;
}
// what a press of 成组 or 拆开 (or a drag) does to the groups you set: 成组 makes the picked cards one group of yours;
// 拆开 makes each picked card a single of its own; a drag onto a group makes that whole group, with the cards, yours;
// a group of yours that cards are taken out of (or played from) is yours no more: what is left of it goes back to the
// computer's arranging
const untouched=(locks,ids)=>locks.filter(gr=>!gr.some(id=>ids.includes(id)));
function lockGroup(locks,ids,hand){return untouched(locks,ids).concat([tidyIds(ids,hand)])}
function lockSingles(locks,ids){return untouched(locks,ids).concat(ids.map(id=>[id]))}
function lockJoin(locks,groups,ids,target,hand){
  const into=target!=null?groups.find(gr=>gr.includes(target)):null;
  const join=into?into.filter(id=>!ids.includes(id)).concat(ids):ids;
  return untouched(locks,join).concat([tidyIds(join,hand)]);
}
const setLocks=(p,locks)=>{if(!G.ua||G.ua.r!==G.round)G.ua={r:G.round,lock:{}};G.ua.lock[p]=locks};
const TSEL={p:0,ids:new Set()};
function testCompSel(p,id){
  if(G.phase!=='prep')return;
  if(TSEL.p!==p){TSEL.p=p;TSEL.ids=new Set()}
  if(TSEL.ids.has(id))TSEL.ids.delete(id);else TSEL.ids.add(id);
  testPeeks();Sound.play('select');
}
// 同花顺 on a computer's hand: each press picks the next straight flush its cards can make, to set aside with 成组
const sfIdxP={};
let TSFI=null;
function testCompSF(p){
  if(G.phase!=='prep')return;
  const list=straightFlushes(G.hands[p]);
  if(!list.length){TSFI={p,k:TSEL.p===p?[...TSEL.ids].join():'',text:'这手牌组不成同花顺'};testPeeks();return}
  // every one has been shown: one more press takes it all back
  if((sfIdxP[p]||0)>=list.length){sfIdxP[p]=0;TSEL.ids=new Set();TSFI=null;testPeeks();Sound.play('select');return}
  const k=sfIdxP[p]||0,f=list[k];sfIdxP[p]=k+1;
  TSEL.p=p;TSEL.ids=new Set(f.cards.map(c=>c.id));
  // the information stands in the computer's own heading, over its cards, never on them
  TSFI=null; // (no words about it: the cards picked are the answer)
  testPeeks();Sound.play('select');
}
function testCompGroup(p,split){
  if(G.phase!=='prep'||TSEL.p!==p||TSEL.ids.size<(split?1:2))return;
  const ids=[...TSEL.ids],locks=uaOf(p)||[];
  setLocks(p,split?lockSingles(locks,ids):lockGroup(locks,ids,G.hands[p]));
  TSEL.ids=new Set();testPeeks();Sound.play('play');
}
const hotOff=root=>root.querySelectorAll('.card.hot').forEach(c=>c.classList.remove('hot'));
// your own cards follow the pointer; the group under it lights up
function testDragMove(e){
  if(!mv.active){
    if(Math.hypot(e.clientX-mv.x0,e.clientY-mv.y0)<6)return;
    mv.ids=sel.has(mv.id)&&sel.size>1?orderedHand().filter(c=>sel.has(c.id)).map(c=>c.id):[mv.id];
    mv.grab=mv.ids.indexOf(mv.id);
    const L=handEl.getBoundingClientRect(),el=cardEl(mv.id);
    mv.dx=mv.x0-L.left-parseFloat(el.style.left);mv.dy=mv.y0-L.top-parseFloat(el.style.top);
    mv.ids.forEach((id,j)=>{const c=cardEl(id);c.classList.add('drag');c.style.zIndex=1000+j;c.style.pointerEvents='none'});
    mv.active=true;mv.test=true;mv.tid=null;lastDown=null;
  }
  const L=handEl.getBoundingClientRect(),cw=cardEl(mv.id).offsetWidth;
  const x=e.clientX-L.left-mv.dx,y=e.clientY-L.top-mv.dy;
  mv.ids.forEach((id,j)=>{const c=cardEl(id);c.style.left=x+(j-mv.grab)*cw*.36+'px';c.style.top=y+'px'});
  const t=document.elementFromPoint(e.clientX,e.clientY),tc=t&&t.closest('#hand .card');
  const tid=tc&&!mv.ids.includes(+tc.dataset.id)?+tc.dataset.id:null;
  mv.out=!t||!t.closest('.handwrap');
  if(tid===mv.tid)return;
  mv.tid=tid;hotOff(handEl);
  if(tid!=null)for(const id of G.fixed.find(gr=>gr.includes(tid)))if(!mv.ids.includes(id))cardEl(id).classList.add('hot');
}
// dropped on a group: they join it; on a gap in your hand: a group of their own; anywhere else: back where they were
function testDropMine(m){
  hotOff(handEl);
  for(const id of m.ids){const c=cardEl(id);if(c)c.style.pointerEvents=''}
  if(!m.cancel&&!(m.out&&m.tid==null)){
    G.tgLock=lockJoin(G.tgLock,G.fixed,m.ids,m.tid,G.hands[0]);
    for(const id of m.ids)sel.delete(id);
    Sound.play('play');
  }
  renderHand();
}
// a computer's cards while sorting: a tap picks a card, a drag carries it (or the picked cards) the same way as yours
function testPeekDrag(el,p){
  let d=null;
  el.addEventListener('pointerdown',e=>{
    if(G.phase!=='prep')return;
    const c=e.target.closest('.card');if(!c)return;
    e.preventDefault();
    d={id:+c.dataset.id,x0:e.clientX,y0:e.clientY,on:false,tid:null};
    try{el.setPointerCapture(e.pointerId)}catch(_){}
  });
  el.addEventListener('pointermove',e=>{
    if(!d)return;
    if(!d.on){
      if(Math.hypot(e.clientX-d.x0,e.clientY-d.y0)<6)return;
      d.on=true;
      d.ids=TSEL.p===p&&TSEL.ids.has(d.id)&&TSEL.ids.size>1?seatGroups(p).flat().filter(id=>TSEL.ids.has(id)):[d.id];
      const g=document.createElement('div');
      g.className='tghost';g.style.setProperty('--cw',el.querySelector('.card').offsetWidth+'px');
      g.innerHTML=`<span class="grp">${d.ids.map(id=>cardHTML(G.hands[p].find(c=>c.id===id),G.L)).join('')}</span>`;
      document.body.appendChild(g);d.ghost=g;
      for(const id of d.ids){const c=el.querySelector(`.card[data-id="${id}"]`);if(c)c.style.opacity=.3}
    }
    d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';
    const t=document.elementFromPoint(e.clientX,e.clientY),tc=t&&el.contains(t)&&t.closest('.card');
    const tid=tc&&!d.ids.includes(+tc.dataset.id)?+tc.dataset.id:null;
    d.out=!t||!el.contains(t);
    if(tid===d.tid)return;
    d.tid=tid;hotOff(el);
    if(tid!=null)for(const id of seatGroups(p).find(gr=>gr.includes(tid)))if(!d.ids.includes(id)){const c=el.querySelector(`.card[data-id="${id}"]`);if(c)c.classList.add('hot')}
  });
  const end=cancel=>{
    if(!d)return;
    const m=d;d=null;
    if(m.ghost)m.ghost.remove();
    if(!m.on){if(!cancel)testCompSel(p,m.id);return}
    if(cancel||m.out&&m.tid==null){el.dataset.k='';testPeeks();return}
    setLocks(p,lockJoin(uaOf(p)||[],seatGroups(p),m.ids,m.tid,G.hands[p]));
    TSEL.ids=new Set();testPeeks();Sound.play('play');
  };
  el.addEventListener('pointerup',()=>end(false));
  el.addEventListener('pointercancel',()=>end(true));
}
function testCompReset(p){
  if(G.ua&&G.ua.r===G.round)delete G.ua.lock[p];
  TSEL.ids=new Set();testPeeks();Sound.play('shuffle');
}
// your hand: the groups you set (G.tgLock) stay, the rest is arranged again the computer's way whenever the hand or your
// groups change
function testArrangeMine(){
  if(!G||['start','shuffle','cut','deal'].includes(G.phase)||!G.hands[0].length)return;
  if(G.tgRound!==G.round){G.tgRound=G.round;G.tgLock=[];G.tgKey=''}
  const key=G.hands[0].map(c=>c.id).sort((a,b)=>a-b).join()+'|'+JSON.stringify(G.tgLock);
  if(G.tgKey===key)return;
  G.tgKey=key;
  const r=lockedAndRest(G.hands[0],G.tgLock,G.L);
  G.tgLock=r.kept;G.fixed=r.groups;G.myOrder=[];
}
// 成组 / 拆开 on your own cards
function testRegroup(ids,split){
  if(ids.length<(split?1:2))return;
  G.tgLock=split?lockSingles(G.tgLock,ids):lockGroup(G.tgLock,ids,G.hands[0]);
  sel=new Set();
  renderHand();
  Sound.play('play');
}
// your groups laid out like the computer's: in two rows, a small gap between groups
function testGeo(){
  const el=$('#hand'),probe=el.firstElementChild,W=el.clientWidth,cw=probe.offsetWidth,ch=probe.offsetHeight;
  // two rows; once 14 cards or fewer are left, one row (if they fit in it)
  const us=G.fixed.map(gr=>({cards:gr})),w1=us.reduce((t,u)=>t+(1.22+.42*(u.cards.length-1)),0)*cw;
  const rows=rowsOf(us,G.fixed.flat().length<=14&&w1<=W-8?1:2);
  const off=cw*.42,gap=cw*.22,lift=Math.round(ch*.22),rowGap=Math.round(ch*ROW_STEP),fix=new Map();
  let right=0;
  rows.forEach((r,i)=>{
    const w=r.reduce((s,u)=>s+cw+off*(u.cards.length-1),0)+gap*(r.length-1);
    let x=Math.max(0,(W-w)/2);
    for(const u of r){u.cards.forEach((id,j)=>fix.set(id,{x:x+j*off,y:lift+i*rowGap,rot:0}));x+=cw+off*(u.cards.length-1)+gap}
    right=Math.max(right,x-gap);
  });
  return{test:true,slots:[],fix,fixTags:[],fixW:0,fixH:0,cw,ch,counts:[0],fixEmpty:true,fixEdge:-1,right,lift,
    height:lift+ch+Math.max(1,rows.length-1)*rowGap+4}; // (two rows' height even when one is left: nothing below the hand moves)
}
// beside your name: the 牌力 of your groups (and of the computer's arrangement, when it differs); during play, as play began
function testMine(){
  const el=$('#myPw');if(!el)return;
  let t='';
  const rec=curRec();
  if(G.phase!=='prep'){if(el.textContent)el.textContent='';return}
  if(G.phase==='play'&&rec&&rec.live&&rec.g===G.round)t=`开局${powerText(rec.myPower)}`+(rec.myPower!==rec.power[0]?`　电脑配牌 ${rec.power[0]}`:'');
  else if(testGrouped()&&G.hands[0].length){
    const mine=scorePower(armScore(myUnits())),pc=handPower(G.hands[0],G.L);
    t=powerText(mine)+(mine!==pc?`　电脑配牌 ${pc}`:'')+(G.phase==='prep'?'　（拖动牌重新分组，电脑的牌也可以）':'');
  }
  if(el.textContent!==t)el.textContent=t;
}

