// slot positions for n cards: a flat row (or two), or a fan held in the hand, bowed along a wide arc
// keys: each position's card value, so the fanned rows never split cards of the same rank
const sideBtns=()=>matchMedia('(min-width:561px)').matches;
const BTN_GAP=18;
// the action column: the play buttons, and in their place the shuffle / cut and "done sorting" buttons, all centred
// the same distance in from the right edge, where a right thumb on a tablet reaches without stretching
let colW=90;
// the action spot sits this far up from the bottom of the hand area: high enough that the two buttons below the
// hint button (pass, clear) still clear the hand tools in the corner
const SPOT_UP=226;
const actionInset=w=>Math.min(150,Math.max(colW/2+16,w*.12));
// The hand has two parts: on the left the fixed zone, where the groups the player has set aside (the combinations
// they mean to play) sit one per row; to the right the active zone, the rest of the cards, fanned or flat.
// n: how many active cards, keys: their row-split keys. Also returns where each fixed card goes (fix), the row
// tags (fixTags), the zone's size (fixW, fixH) and the line a dragged card crosses to land in the zone (fixEdge).
const FIX_GAP=14,FIX_TAG=62; // (FIX_TAG: room right of a group for its tag, the longest being 同花顺, clear of the frame)
let fixPeak={k:'',w:0,h:0};
function handGeo(n,keys){
  if(testGrouped())return testGeo();
  if(isPhone())return phoneHandGeo(n,keys);
  const el=$('#hand'),probe=el.firstElementChild,Wall=el.clientWidth;
  // the active cards stay centred under your name, with the action column's room kept free on both sides,
  // as long as the fixed zone fits in the free room on the left; a wider zone pushes them right
  if(sideBtns()&&$('#btns').offsetWidth)colW=$('#btns').offsetWidth;
  const side=sideBtns()?isPhone()?colW+BTN_GAP:actionInset(Wall)+colW/2+BTN_GAP:0;
  const cw=probe.offsetWidth,ch=probe.offsetHeight;
  // each group in one row, overlapping just enough to show every card's corner; a long group closes up
  // (in 竖式 each group stands as one column, its cards piled upward, and the next group is another column beside it, the
  // columns just far enough apart to show a rank and suit side by side)
  const vert=vertMode();
  const rows=(G&&G.fixed||[]).map(gr=>{
    if(vert)return{gr,cs:gr.map(id=>G.hands[0].find(x=>x.id===id)).filter(Boolean).sort(cmpVert)};
    const k=gr.length,off=k>1?Math.min(cw*.42,(Wall*.34-cw)/(k-1)):0;
    return{gr,off,w:cw+off*(k-1)};
  });
  const vdx=vert&&rows.length>1?Math.max(cw*.78,Math.min(cw*1.08,(Wall*.34-cw)/(rows.length-1))):0;
  if(vert)rows.forEach(r=>r.w=cw+vdx*(rows.length-1));
  // with no groups yet the zone is an empty frame: on a computer or tablet at least as wide as a group of three with
  // its tag (wider if the free room on the left allows, leaving the button its strip), a narrow strip on a phone,
  // where the button sits in the row under the hand
  const bw=0; // (成组 stands beside 同花顺 now, so the frame keeps no strip for it)
  // while a round is played the zone only ever grows: it keeps the largest width and height it has had until the next
  // deal (or until the window or the cards change size), so it never shrinks as groups are played out
  // (on a phone the frame instead hugs the cards in it, and an empty one is just a narrow strip)
  const pk=`${G&&G.round}|${Wall}|${cw}`;
  if(TEST||isPhone()||!G||['start','shuffle','cut','deal'].includes(G.phase)||fixPeak.k!==pk)fixPeak={k:pk,w:0,h:0};
  const fw=fixPeak.w=TEST?0:Math.max(fixPeak.w,rows.length?Math.max(...rows.map(r=>r.w))+FIX_TAG:isPhone()?60:side?Math.max(Math.round(cw*1.84+FIX_TAG),Math.round(side-bw-FIX_GAP)):30);
  // (the test version has no fixed zone: its groups are made with 成组 and 拆开)
  const x0=TEST?side:Math.max(side,fw+bw+FIX_GAP),W=Wall-side-x0;
  // (while dealing there are no ranks to stack yet: 竖式 lays the cards out flat until they are all in)
  const g=fanMode()?fanGeo(n,W,cw,ch,keys):vertMode()&&keys?vertGeo(n,W,cw,ch,keys):flatGeo(n,W,cw,ch,keys);
  g.slots=g.slots.map(sl=>({...sl,x:sl.x+x0}));
  // the groups step down like flat rows (each still shows its row of corners), closer together if there are many
  const lift=ch*.22,pad=4,base=n?g.height:0;
  // 竖式 while playing: the hand area is only as tall as the cards left in it (and the groups still standing), so as cards
  // go out the name bar settles down and the table gains the room; while sorting it keeps its height so nothing jumps
  if(vert&&G&&G.phase==='play')fixPeak.h=0;
  let gap=ch*ROW_STEP,need=0;
  g.fix=new Map();g.fixTags=[];
  if(vert&&rows.length){
    // the columns stand on the bottom, their cards closing up to fit the height the hand area already has (more cards
    // don't push the name bar up and squeeze the cards played on the table); only when even the closest won't fit does
    // the area grow. Each column's tag sits over its top.
    const TP=25,most=Math.max(...rows.map(r=>r.cs.length));
    const dy=most>1?Math.max(ch*.25,Math.min(ch*.3,(Math.max(base,fixPeak.h)-TP-ch-6)/(most-1))):ch*.3;
    let z=0;
    rows.forEach((r,i)=>{
      const top=TP+(most-r.cs.length)*dy;
      r.cs.forEach((c,j)=>g.fix.set(c.id,{x:i*vdx,y:top+j*dy,rot:0,z:z++}));
      g.fixTags.push({x:i*vdx,y:top-TP,gr:r.gr});
    });
    need=TP+ch+(most-1)*dy+6;
    // a card dropped on a group's column joins that group, anywhere else in the zone it makes a new one
    g.fixAt=px=>rows.findIndex((r,i)=>px>=i*vdx&&px<i*vdx+(i<rows.length-1?vdx:cw));
  }else{
    if(rows.length>1)gap=Math.max(ch*.3,Math.min(gap,(Math.max(base,ch*2.4)-lift-ch-pad)/(rows.length-1)));
    // (the tags stand at the upper right of their groups' cards, all in one column: where the longest group's cards end)
    const tagX=Math.max(0,...rows.map(r=>r.w))+5;
    rows.forEach((r,i)=>{const y=lift+i*gap;r.gr.forEach((id,j)=>g.fix.set(id,{x:j*r.off,y,rot:0}));g.fixTags.push({x:tagX,y,gr:r.gr})});
    need=lift+ch+(rows.length-1)*gap+6;
  }
  // an empty frame stands as tall as the hand (never less than one card and its margin)
  g.fixH=fixPeak.h=TEST?0:Math.max(fixPeak.h,rows.length?need:Math.max(base,ch+20));
  g.fixW=fw;g.cw=cw;g.ch=ch;g.fixEmpty=!rows.length;
  g.fixEdge=fw+bw/2+FIX_GAP/2;
  g.height=Math.max(base,g.fixH+(rows.length&&!vert?pad:0));
  // 竖式 stands on the hand area's bottom edge: when cards leave (played, or into the fixed zone) the area keeps its
  // height, and the columns stay down on the bottom row rather than floating up
  if(g.vert){const d=g.height-base;g.slots.forEach(sl=>{sl.y+=d})}
  // (and so do the groups' columns, in a frame as tall as the area)
  if(vert&&rows.length){const d=g.height-need;g.fix.forEach(s=>{s.y+=d});g.fixTags.forEach(t=>{t.y+=d});g.fixH=g.height}
  return g;
}
// the fixed zone's outline (behind the cards) and, beside each group, what kind of play it makes (over them);
// the outline also shows while cards are being dragged, as the place to drop them
function drawFixZone(g){
  let z=$('#fixZone'),t=$('#fixTags');
  if(!z){
    z=document.createElement('div');z.id='fixZone';handEl.parentNode.insertBefore(z,handEl);
    t=document.createElement('div');t.id='fixTags';handEl.parentNode.insertBefore(t,handEl.nextSibling);
  }
  const on=!!g;
  z.hidden=t.hidden=$('#fixBtn').hidden=!on;
  if(!on){
    // (the test version: with no cards left in your hand 上一步 stays, and 继续 with it, or the game could not be played on)
    if(TEST&&G&&['play','roundEnd','over'].includes(G.phase)){const u=$('#undoBtn');if(u)u.hidden=false}
    return;
  }
  if(TEST&&!g.test){z.hidden=t.hidden=true;for(const id of ['#fixBtn','#splitBtn','#sortBtn','#undoBtn']){const b=$(id);if(b)b.hidden=true}return}
  for(const id of ['#splitBtn','#sortBtn','#undoBtn']){const b=$(id);if(b)b.hidden=false}
  // the test version's groups need no frame: its 成组, 拆开 and 复原 stand in a column just right of the cards (clear
  // of every row), like the computer's
  if(g.test){
    z.hidden=t.hidden=true;
    const tb=$('#fixBtn').parentNode;
    const col=['#fixBtn','#splitBtn','#sortBtn','#undoBtn'].map(id=>$(id)).filter(Boolean);
    // the column starts level with the first row of cards, but no lower than will keep its last button on the hand's area
    const total=col.reduce((s,b)=>s+b.offsetHeight+6,-6),limit=handEl.offsetTop+handEl.offsetHeight-tb.offsetTop;
    let y=Math.min(handEl.offsetTop+g.lift-tb.offsetTop,limit-total);
    // the sorting column and the play column beside it must both stay on the screen
    let colLeft=handEl.offsetLeft+g.right+14-tb.offsetLeft;
    colLeft+=24; // (the nine buttons stand a little further right)
    const over=tb.getBoundingClientRect().left+colLeft+60+10+60+10+60-(innerWidth-8);
    if(over>0)colLeft-=over;
    // once the play begins the columns (and 继续 with them) keep the place they have, however narrow the hand gets
    if(['play','roundEnd','over'].includes(G.phase)){
      const k=G.round+'|'+innerWidth+'x'+innerHeight;
      if(!TCOLX||TCOLX.k!==k)TCOLX={k,left:colLeft};
      colLeft=TCOLX.left;
    }else TCOLX=null;
    for(const id of ['#fixBtn','#splitBtn','#sortBtn','#undoBtn']){
      const b=$(id);if(!b)continue;
      b.style.left=colLeft+'px';b.style.top=y+'px';
      y+=b.offsetHeight+6;
    }
    return;
  }
  const L=handEl.offsetLeft,T=handEl.offsetTop;
  z.style.left=L-6+'px';z.style.top=T+'px';z.style.width=g.fixW+6+'px';z.style.height=(g.fixH||handEl.offsetHeight)+'px';
  z.classList.toggle('empty',g.fixEmpty);
  z.innerHTML=`<span class="fzl">成组区</span>`+(g.fixEmpty?'<span class="fzh">把牌拖到这里，或选好牌点“成组”</span>':'');
  t.style.left=L+'px';t.style.top=T+'px';
  // the button by the frame's bottom right corner (on a phone it stays in the row under the hand)
  const b=$('#fixBtn'),tb=b.parentNode;
  b.style.left=b.style.top='';
  t.innerHTML=g.fixTags.map(r=>{
    const cards=r.gr.map(id=>G.hands[0].find(c=>c.id===id)).filter(Boolean);
    const a=analyze(cards,G.L).sort((x,y)=>strength(y)-strength(x))[0];
    const name=!a?'散牌':a.type==='bomb'?'炸弹':TYPE_NAME[a.type];
    return`<span class="fzt${!a?' loose':isBomb(a)?' boom':''}" style="left:${r.x}px;top:${r.y+3}px">${name}</span>`;
  }).join('');
}
