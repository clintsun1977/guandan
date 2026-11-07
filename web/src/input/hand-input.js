/* ---------- input ---------- */
const handEl=$('#hand');
let lastDown=null,mv=null,sweep=null;
const cardEl=id=>handEl.querySelector(`.card[data-id="${id}"]`);
// the cards a tap picks: the card's whole group if it is in one (made with 成组), else the card alone
function groupOf(id){
  const gr=(G.fixed||[]).find(g=>g.includes(id));
  return gr?gr.filter(x=>G.hands[0].some(c=>c.id===x)):[id];
}
function setSel(id,on,lazy){
  if(on)sel.add(id);else sel.delete(id);
  // a card being put back down waits out the double-tap window, so a double tap never dips it first
  const show=()=>{const el=handEl.querySelector(`.card[data-id="${id}"]`);if(el)el.classList.toggle('sel',sel.has(id))};
  if(lazy&&!on)setTimeout(show,360);else show();
  renderControls();
}
handEl.addEventListener('pointerdown',e=>{
  if(G.phase!=='play'&&G.phase!=='return'&&G.phase!=='prep'&&G.phase!=='tribPick')return;
  // a tap on the hand's empty felt, beside or between the cards, puts every picked card back
  const el=e.target.closest('.card');if(!el){if(e.target===handEl)clearPicked();return}
  e.preventDefault();
  const id=+el.dataset.id,t=performance.now();
  if(lastDown&&lastDown.id===id&&t-lastDown.t<350){
    // double tap: undo the first tap's toggle, keep this card (or its whole group) in the selection, then play it
    // (paying or returning a tribute card is never done by a double tap: the card is picked and the button pressed)
    sel=new Set(lastDown.prev);for(const x of groupOf(id))sel.add(x);
    lastDown=null;
    renderHand();
    if(G.phase==='play')onPlay();
    return;
  }
  lastDown={id,t,prev:[...sel]};
  // nothing happens until we know what the press is: a tap selects, a drag moves cards
  mv={id,x0:e.clientX,y0:e.clientY,t0:t,active:false};
  try{handEl.setPointerCapture(e.pointerId)}catch(_){}
});
handEl.addEventListener('pointermove',e=>{
  // a press-and-sweep that starts on an unpicked card picks the cards it passes over; one that starts on a picked card
  // carries the picked cards (into the fixed zone, or to another place) - while sorting as much as while playing, so a
  // bomb or a run can be swept up and dragged into the fixed zone in one go
  if(mv&&!mv.active&&!sel.has(mv.id)&&!testGrouped()){
    if(Math.hypot(e.clientX-mv.x0,e.clientY-mv.y0)<6)return;
    const id=mv.id,on=!sel.has(id),px=mv.x0,py=mv.y0;
    mv=null;lastDown=null;
    sweep={on,seen:new Set([id]),last:[...handEl.children].findIndex(c=>+c.dataset.id===id),px,py};
    setSel(id,on);
    Sound.play('select');
  }
  // the test version's groups: dragged onto another group to join it, or onto a gap to make one of their own
  if(mv){if(testGrouped())testDragMove(e);else moveCards(e);return}
  if(!sweep)return;
  // 竖式: the hand's order runs down each column, so a sweep picks just the cards it passes over (looked up along the
  // way, as a fast sweep can skip some between two pointer events)
  if(vertMode()){
    const k=Math.max(1,Math.ceil(Math.hypot(e.clientX-sweep.px,e.clientY-sweep.py)/6));
    for(let s=1;s<=k;s++){
      const t=document.elementFromPoint(sweep.px+(e.clientX-sweep.px)*s/k,sweep.py+(e.clientY-sweep.py)*s/k);
      const el=t&&t.closest('#hand .card'),id=el&&+el.dataset.id;
      if(el&&!sweep.seen.has(id)){sweep.seen.add(id);setSel(id,sweep.on)}
    }
    sweep.px=e.clientX;sweep.py=e.clientY;
    return;
  }
  const t=document.elementFromPoint(e.clientX,e.clientY);
  const el=t&&t.closest('#hand .card');if(!el)return;
  // a fast sweep can skip cards between two pointer events, so fill in everything between the last card and this one
  const kids=[...handEl.children],i=kids.indexOf(el);
  if(i<0||i===sweep.last)return;
  const step=i>sweep.last?1:-1;
  for(let j=sweep.last+step;;j+=step){
    const id=+kids[j].dataset.id;
    if(!sweep.seen.has(id)){sweep.seen.add(id);setSel(id,sweep.on)}
    if(j===i)break;
  }
  sweep.last=i;
});
handEl.addEventListener('pointerup',()=>{if(mv)dropCards();sweep=null});
handEl.addEventListener('pointercancel',()=>{if(mv){mv.cancel=true;dropCards()}sweep=null});

// picking up a selected card carries the whole selection with it, so a combination can be moved as one block
function moveCards(e){
  if(!mv.active){
    if(Math.hypot(e.clientX-mv.x0,e.clientY-mv.y0)<6)return;
    const all=[...handEl.children].map(c=>+c.dataset.id),fixed=new Set(G.fixed.flat()),ord=all.filter(i=>!fixed.has(i));
    mv.ids=sel.has(mv.id)&&sel.size>1?all.filter(i=>sel.has(i)):[mv.id];
    mv.grab=mv.ids.indexOf(mv.id);
    mv.others=ord.filter(i=>!mv.ids.includes(i));
    mv.order=ord;
    // the active zone as it will be with the dragged cards dropped into it
    // (竖式 keeps every card in its rank's column, so there the others just close up without the dragged cards)
    mv.g=vertMode()?handGeo(mv.others.length,handKeys(mv.others)):handGeo(mv.others.length+mv.ids.length,null);
    mv.rowOf=mv.g.counts.flatMap((k,r)=>Array(k).fill(r));
    const L=handEl.getBoundingClientRect(),el=cardEl(mv.id);
    mv.dx=mv.x0-L.left-parseFloat(el.style.left);
    mv.dy=mv.y0-L.top-parseFloat(el.style.top);
    mv.ids.forEach((id,j)=>{const c=cardEl(id);c.classList.add('drag');c.style.zIndex=1000+j});
    mv.active=true;lastDown=null;
    drawFixZone(mv.g);
  }
  const L=handEl.getBoundingClientRect(),g=mv.g,k=mv.ids.length;
  const x=e.clientX-L.left-mv.dx,y=e.clientY-L.top-mv.dy;
  mv.ids.forEach((id,j)=>{const c=cardEl(id);c.style.left=x+(j-mv.grab)*g.cw*.36+'px';c.style.top=y+'px'});
  // over the fixed zone: on a group's cards they will join that group (its tag lights up); anywhere else in the zone
  // (beside the groups, on the tags) they make a new group
  const px=e.clientX-L.left,py=e.clientY-L.top,fz=$('#fixZone');
  if(g.inFix?g.inFix(px,py):px<g.fixEdge){
    let row=-1;
    if(g.fixAt)row=g.fixAt(px,py);else g.fixTags.forEach((r,i)=>{if(py>=r.y-4&&py<r.y+g.ch&&px<r.x-5)row=i});
    if(mv.t==='fix'&&mv.row===row)return;
    mv.t='fix';mv.row=row;
    mv.others.forEach((id,i)=>placeCard(cardEl(id),g.slots[i],100+i));
    const lm=$('#landMark');if(lm)lm.remove();
    fz.classList.add('over');
    fz.querySelector('.fzl').textContent=row<0?'放下成为新的一组':'放下加入这一组';
    document.querySelectorAll('#fixTags .fzt').forEach((t,i)=>t.classList.toggle('hot',i===row));
    Sound.play('deal');
    return;
  }
  if(fz.classList.contains('over')){
    fz.classList.remove('over');
    fz.querySelector('.fzl').textContent='成组区';
    document.querySelectorAll('#fixTags .fzt').forEach(t=>t.classList.remove('hot'));
  }
  if(mv.t==='fix')mv.t=null;
  // 竖式: dropped anywhere but the fixed zone, the cards go back to their columns (out of any group they were in)
  if(vertMode()){
    if(mv.t!=='vert'){mv.t='vert';mv.others.forEach((id,i)=>placeCard(cardEl(id),g.slots[i],100+i))}
    return;
  }
  const cx=x+g.cw/2,cy=y+g.ch/2;
  let s=0,best=Infinity;
  g.slots.forEach((sl,i)=>{const d=(sl.x+g.cw/2-cx)**2+((sl.y+g.ch/2-cy)*1.6)**2;if(d<best){best=d;s=i}});
  const t=Math.max(0,Math.min(g.slots.length-k,s-mv.grab));
  if(t===mv.t)return;
  mv.t=t;
  mv.order=[...mv.others.slice(0,t),...mv.ids,...mv.others.slice(t)];
  mv.order.forEach((id,i)=>{if(!mv.ids.includes(id))placeCard(cardEl(id),spreadSlot(i),100+i)});
  showLanding();
  Sound.play('deal');
}
// the cards in the landing row step aside, the nearest ones most, so a clear gap opens where the dragged cards will go
function spreadSlot(i){
  const g=mv.g,t=mv.t,k=mv.ids.length,sl=g.slots[i],row=mv.rowOf[t];
  if(mv.rowOf[i]!==row)return sl;
  const d=i<t?t-i:i-(t+k-1),shift=g.cw*.45*Math.max(0,1-(d-1)/4);
  return{...sl,x:sl.x+(i<t?-shift:shift)};
}
function showLanding(){
  const g=mv.g,a=g.slots[mv.t],b=g.slots[Math.min(g.slots.length-1,mv.t+mv.ids.length-1)];
  let m=$('#landMark');
  if(!m){m=document.createElement('div');m.id='landMark';m.className='land';handEl.parentNode.insertBefore(m,handEl)}
  const w=(mv.rowOf[mv.t]===mv.rowOf[mv.t+mv.ids.length-1]?b.x-a.x:0)+g.cw;
  m.style.left=handEl.offsetLeft+a.x+'px';m.style.top=handEl.offsetTop+a.y+'px';
  m.style.width=w+'px';m.style.height=g.ch+'px';
  m.style.transform=`rotate(${a.rot}deg)`;
}
function dropCards(){
  const m=mv;mv=null;
  const lm=$('#landMark');if(lm)lm.remove();
  if(!m.active){
    if(!m.cancel){const on=!sel.has(m.id);for(const id of groupOf(m.id))setSel(id,on,true);Sound.play('select')}
    return;
  }
  if(m.test){testDropMine(m);return}
  if(!m.cancel){
    if(m.t==='fix')fixCards(m.ids,m.row);
    else if(m.t==='vert'){const f=new Set(G.fixed.flat()),back=m.ids.filter(id=>f.has(id));if(back.length)unfixCards(back)}
    else if(m.t!=null){
      // dropped among the active cards: out of any group, and several cards land tidied as a combination reads
      unfixCards(m.ids);
      G.myOrder=m.order;
      if(m.ids.length>1){
        const tidy=tidyGroup(m.ids),at=G.myOrder.indexOf(m.ids[0]);
        const rest=G.myOrder.filter(id=>!m.ids.includes(id));
        G.myOrder=[...rest.slice(0,at),...tidy,...rest.slice(at)];
      }
    }
  }
  for(const id of m.ids)sel.delete(id);
  const z=$('#fixZone');if(z)z.classList.remove('over');
  if(m.dirty)renderHand();else reflowHand();
  Sound.play('play');
}
// the cards move to their new places without being rebuilt, so each one slides there; on your turn the hints follow
// the new zones
function reflowHand(){
  for(const c of orderedHand()){const el=cardEl(c.id);if(el){el.classList.remove('drag');el.classList.toggle('sel',sel.has(c.id));handEl.appendChild(el)}}
  if(G.phase==='play'&&G.turn===0&&isHumanSeat(0)){
    const cur=G.trick?G.trick.play:null;
    hints=sortHints(genPlays(G.hands[0],G.L).filter(pl=>beats(pl,cur)));hintIdx=0;
  }
  layoutHand();
  renderControls();
}
// cards set aside in the fixed zone: joining the group they were dropped on, or as a group of their own (tidied the way
// the combination reads); unfixCards puts cards back among the active ones, where they slot in by rank
function fixCards(ids,row){
  const target=row>=0?G.fixed[row]:null;
  G.fixed=G.fixed.map(gr=>gr===target?gr:gr.filter(id=>!ids.includes(id)));
  if(target){const i=G.fixed.indexOf(target);G.fixed[i]=tidyGroup(target.filter(id=>!ids.includes(id)).concat(ids))}
  else G.fixed.push(tidyGroup(ids));
  G.fixed=G.fixed.filter(gr=>gr.length);
  G.myOrder=(G.myOrder||[]).filter(id=>!ids.includes(id));
}
function unfixCards(ids){
  G.fixed=(G.fixed||[]).map(gr=>gr.filter(id=>!ids.includes(id))).filter(gr=>gr.length);
  G.myOrder=(G.myOrder||[]).filter(id=>!ids.includes(id));
}
$('#playBtn').onclick=onPlay;
// if anything goes wrong, quietly keep the last error (with the page version) on this device for checking later
function showError(m){
  try{localStorage.setItem('guandan-lastError',`${new Date().toLocaleString()} 版本${VERSION} ${m}`)}catch(_){}
}
addEventListener('error',e=>showError(e.message||'未知错误'));
addEventListener('unhandledrejection',e=>showError((e.reason&&e.reason.message)||'未知错误'));
$('#passBtn').onclick=onPass;
$('#hintBtn').onclick=onHint;
$('#returnBtn').onclick=onReturn;
