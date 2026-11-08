// flat rows of about equal length, the player's choice of one to three; a single row too cramped to read becomes two
// a phone's hand: the groups made with 成组 come first, each kept together, from the left of the first row, then the
// other cards, a small gap after each group; in as few rows as keep every card's rank and suit in view - at most three
// upright, two on its side, closing the cards up if they must - and clear of the play buttons at the right
function phoneHandGeo(n,keys){
  const el=$('#hand'),probe=el.firstElementChild,Wall=el.clientWidth,cw=probe.offsetWidth,ch=probe.offsetHeight;
  // (on its side the hand always takes two rows, each card the easier to read)
  const b=$('#btns'),W=Wall-(b.hidden?0:b.offsetWidth+8),maxRows=phoneRows()?3:2,cap=phoneRows()?Infinity:Math.ceil((n+(G&&G.fixed||[]).flat().length)/2);
  const lift=Math.round(ch*.22),rowGap=Math.round(ch*ROW_STEP),gapW=Math.round(cw*.3);
  const groups=G&&G.fixed||[],seq=[];
  groups.forEach(gr=>gr.forEach((id,j)=>seq.push({id,start:j===0,len:gr.length})));
  for(let i=0;i<n;i++)seq.push({id:null,start:i===0&&seq.length>0,len:n});
  const fill=off=>{
    let x=0,r=0,k=0;const pos=[];
    for(const it of seq){
      // the first row stops at half the cards on its side (a group is not broken for it)
      if(r===0&&x>0&&(it.id==null||it.start)&&k+(it.id!=null&&it.start?it.len:1)>cap){x=0;r++}
      else if(it.start&&x>0){
        // a group moves to the next row whole rather than breaking (the other cards may run on)
        const need=it.id!=null?cw+off*(it.len-1):cw;
        if(x+gapW+need>W){x=0;r++}else x+=gapW;
      }else if(x>0&&x+cw>W){x=0;r++}
      pos.push({x,r});x+=off;k++;
    }
    return{pos,rows:r+1};
  };
  let best=null;
  for(let R=1;R<=maxRows&&!best;R++)for(let f=.5;f>=.399;f-=.02){const t=fill(cw*f);if(t.rows<=R){best=t;break}}
  if(!best)for(let f=.38;;f-=.02){const t=fill(cw*f);if(t.rows<=maxRows||f<.21){best=t;break}}
  const fix=new Map(),slots=[],counts=Array(best.rows).fill(0);
  best.pos.forEach((q,i)=>{
    const sl={x:q.x,y:lift+q.r*rowGap,rot:0};
    if(seq[i].id!=null)fix.set(seq[i].id,sl);else{slots.push(sl);counts[q.r]++}
  });
  flatShown=best.rows;flatOneFits=true;
  return{slots,fix,fixTags:[],fixW:0,fixH:0,cw,ch,counts,fixEmpty:true,fixEdge:-1,inFix:()=>false,
    height:lift+ch+(best.rows-1)*rowGap+4};
}
function flatGeo(n,W,cw,ch,keys){
  let rows=Math.max(1,Math.min(TEST?3:flatRows,Math.ceil(n/5)));
  flatOneFits=!(n>12&&(W-cw)/(n-1)<cw*.36);
  if(rows===1&&!flatOneFits)rows=2;
  flatShown=rows;
  const counts=rowCounts(n,keys,rows,[1,1,1].slice(0,rows),false);
  const most=Math.max(...counts);
  const off=Math.min(most>1?(W-cw)/(most-1):0,cw*.5);
  // each row steps down far enough that the row behind still shows its whole corner: rank and suit
  const lift=Math.round(ch*.22),rowGap=Math.round(ch*ROW_STEP);
  const slots=[];
  counts.forEach((k,r)=>{
    for(let j=0;j<k;j++)slots.push({x:(W-(cw+off*(k-1)))/2+j*off,y:lift+r*rowGap,rot:0});
  });
  return{slots,cw,ch,counts,height:lift+ch+(counts.length-1)*rowGap+4};
}
// 竖式: one column per rank, side by side (apart if there is room, else overlapping but every corner in view); every
// column stands on the same bottom row and piles upward, each card behind showing its rank and suit above the one in
// front, closer together in a tall column so the hand stays low
function vertGeo(n,W,cw,ch,keys){
  const cols=[];
  for(let i=0;i<n;i++){if(!i||keys[i]!==keys[i-1])cols.push(0);cols[cols.length-1]++}
  const C=cols.length,most=Math.max(1,...cols);
  const dx=C>1?Math.min(cw*1.08,(W-cw)/(C-1)):0;
  const dy=most>1?Math.max(ch*.25,Math.min(ch*.3,ch*1.2/(most-1))):0;
  const lift=Math.round(ch*.22),x0=(W-(cw+dx*(C-1)))/2;
  const slots=[];
  cols.forEach((k,c)=>{for(let j=0;j<k;j++)slots.push({x:x0+c*dx,y:lift+(most-k+j)*dy,rot:0})});
  return{slots,cw,ch,counts:[n],vert:true,height:lift+ch+(most-1)*dy+4};
}
// cards held the way people hold 27 of them: two or three concentric fanned rows turning about one point below the hand.
// The back (top) ring is the widest and holds the most cards; each ring in front is smaller and holds fewer,
// and only the corners of a ring show above the one in front of it.
// how many cards go in each ring, back to front: close to 5:4:3 (or 5:4), cut only where the rank changes so a run
// of equal cards always stays in one ring, and preferring splits where each ring holds no more than the one behind it
function rowCounts(n,keys,rows,w,decreasing){
  if(rows<=1)return[n];
  const sum=w.reduce((a,b)=>a+b,0);
  const ideal=w.map(x=>n*x/sum);
  const edges=[];
  for(let b=1;b<n;b++)if(!keys||keys[b]!==keys[b-1])edges.push(b);
  const cost=c=>{
    let e=0;
    c.forEach((k,r)=>{e+=Math.abs(k-ideal[r]);if(decreasing&&r&&k>c[r-1])e+=3*(k-c[r-1])});
    return e;
  };
  let best=[n],bestE=Infinity;
  if(rows===2){
    for(const a of edges){const c=[a,n-a],e=cost(c);if(e<bestE){bestE=e;best=c}}
  }else{
    for(const a of edges)for(const b of edges){
      if(b<=a)continue;
      const c=[a,b-a,n-b],e=cost(c);
      if(e<bestE){bestE=e;best=c}
    }
  }
  return best;
}
function fanGeo(n,W,cw,ch,keys){
  const rows=Math.max(1,Math.min(handRows,Math.ceil(n/10)));
  const counts=rowCounts(n,keys,rows,[5,4,3].slice(0,rows),true);
  const rowGap=ch*ROW_STEP,lift=ch*.2;
  // radius at the back ring's top edge, and one angular step shared by every ring
  let r0=ch*2.6;
  const step=counts[0]>1?Math.min(cw*.6/r0,1.2/(counts[0]-1)):0;
  const wide=2*r0*Math.sin(step*(counts[0]-1)/2)+cw;
  if(wide>W*.94)r0*=(W*.94-cw)/(wide-cw);
  const raw=[];
  let i=0;
  counts.forEach((k,r)=>{
    const rTop=r0-r*rowGap,rc=rTop-ch/2;
    // smaller rings open up a little so their corners stay readable
    const st=Math.max(step,cw*.42/rTop);
    for(let j=0;j<k;j++,i++){
      const th=(j-(k-1)/2)*st;
      raw.push({cx:W/2+rc*Math.sin(th),cy:-rc*Math.cos(th),rot:th*180/Math.PI});
    }
  });
  const top=Math.min(...raw.map(s=>s.cy));
  const slots=raw.map(s=>({x:s.cx-cw/2,y:s.cy-top+lift,rot:s.rot}));
  return{slots,cw,ch,counts,height:Math.max(...slots.map(s=>s.y))+ch+cw*.25};
}
function cardKey(id){const c=G.hands[0].find(x=>x.id===id);return c?val(c,G.L):0}
// row-split keys for the active cards in this order: each card's rank, so the rows never split a rank
const handKeys=ids=>ids.map(cardKey);
// a dragged group lands tidied: if it makes a combination it is laid out the way that combination reads
// (a straight runs low to high), otherwise it is sorted by rank
function tidyGroup(ids){
  const cards=ids.map(id=>G.hands[0].find(c=>c.id===id)).filter(Boolean);
  const reads=analyze(cards,G.L).sort((a,b)=>strength(b)-strength(a));
  const out=reads.length?displayOrder({...reads[0],cards},G.L):sortHand(cards.slice(),G.L);
  return out.map(c=>c.id);
}
function placeCard(c,slot,i){
  const fresh=!c.style.left;
  if(fresh)c.style.transition='none';
  c.style.left=slot.x+'px';c.style.top=slot.y+'px';c.style.zIndex=i;
  c.style.setProperty('--rot',slot.rot.toFixed(2)+'deg');
  if(fresh){c.getBoundingClientRect();c.style.transition=''}
}
// a phone: the tallest the hand area has been this round (reset with a new round or a new window size)
let handPeak={k:'',h:0};
function layoutHand(){
  phoneRefit();
  const el=$('#hand'),cards=[...el.children],n=cards.length;
  el.classList.toggle('fan',fanMode());el.classList.toggle('vert',vertMode());
  // while dealing, each card goes straight into its slot in a full 27-card hand,
  // so cards already dealt never shift and the hand's height (and the table above it) stays put
  const dealing=G&&(G.phase==='deal'||G.phase==='shuffle'||G.phase==='cut');
  // (the test version keeps the hand area's height once your last card has gone, and to the end of the round, so the plates below it do not move)
  // (a phone keeps the hand area's height, and so the name row above it, where the round's full hand put them: see handPeak)
  const keepH=!TEST&&isPhone()&&handPeak.h>0&&['play','roundEnd','over'].includes(G.phase);
  if(!n&&!dealing){if(keepH)el.style.height=handPeak.h+'px';else if(!(TEST&&['play','roundEnd','over'].includes(G.phase)))el.style.height='';drawFixZone(null);placeActionBtns();return}
  let probe=null;
  if(!n){probe=document.createElement('div');probe.className='card';probe.style.visibility='hidden';el.appendChild(probe)}
  const fixed=new Set((G.fixed||[]).flat()),act=cards.filter(c=>!fixed.has(+c.dataset.id));
  const g=handGeo(dealing?27:act.length,dealing?null:handKeys(act.map(c=>+c.dataset.id)));
  if(probe)probe.remove();
  act.forEach((c,i)=>placeCard(c,g.slots[i],100+i));
  cards.filter(c=>fixed.has(+c.dataset.id)).forEach((c,i)=>{const s=g.fix.get(+c.dataset.id);placeCard(c,s,s.z??i)});
  // a phone marks the cards of its groups with a gold edge along the top
  cards.forEach(c=>c.classList.toggle('grp',isPhone()&&fixed.has(+c.dataset.id)));
  if(!TEST&&isPhone()){
    const pk=G.round+'|'+innerWidth+'x'+innerHeight+'|'+handView;
    if(handPeak.k!==pk)handPeak={k:pk,h:0};
    handPeak.h=Math.max(handPeak.h,g.height);g.height=handPeak.h;
  }
  el.style.height=g.height+'px';
  drawFixZone(g);
  placeLastPlay();
  placeButtons(g);
  syncHandBtns();
  // (the hand's height moves the table's lower edge, and the box of plays with it)
  if(!TEST&&miniMode())testPlays();
}
