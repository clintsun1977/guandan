// the hand in the order the player arranged it; cards that arrive later slot in by rank
// the fixed groups first (each as the player set it aside), then the active cards; cards that leave the hand leave
// their group too, and a group left empty goes
function orderedHand(){
  const h=G.hands[0],byId=new Map(h.map(c=>[c.id,c]));
  G.fixed=(G.fixed||[]).map(gr=>gr.filter(id=>byId.has(id))).filter(gr=>gr.length);
  const fixed=new Set(G.fixed.flat()),act=h.filter(c=>!fixed.has(c.id));
  const ord=(G.myOrder||[]).filter(id=>byId.has(id)&&!fixed.has(id));
  if(ord.length!==act.length){
    const have=new Set(ord);
    for(const c of sortHand(act,G.L)){
      if(have.has(c.id))continue;
      const i=ord.findIndex(id=>cmpCards(byId.get(id),c,G.L)>0);
      if(i<0)ord.push(c.id);else ord.splice(i,0,c.id);
    }
  }
  G.myOrder=ord;
  // the test version keeps every card in a group: a card that arrives (a tribute or return) is a group of its own
  if(testGrouped()&&ord.length){G.fixed.push(...ord.map(id=>[id]));G.myOrder=[];return G.fixed.flat().map(id=>byId.get(id))}
  // 竖式 shows the active cards rank by rank, each rank's cards top to bottom by suit; the player's own order is kept
  // for the other layouts
  if(vertMode())return G.fixed.flat().map(id=>byId.get(id)).concat(act.sort(cmpVert));
  return G.fixed.flat().concat(ord).map(id=>byId.get(id));
}
// 竖式: ranks from big to small like the sorted hand; a rank's column is stacked up from the bottom 红心, 黑桃, 方块,
// 梅花 (the wild, a 红心, at the bottom), so it runs 梅花 first, from the top, down to 红心 in front
const VERT_SUIT={H:0,S:1,D:2,C:3,J:4};
const cmpVert=(a,b)=>val(b,G.L)-val(a,G.L)||VERT_SUIT[b.s]-VERT_SUIT[a.s]||b.id-a.id;
let handView='fan',handRows=3,flatRows=1,flatShown=1,flatOneFits=true;
try{
  handView=localStorage.getItem('guandan-view')||'fan';
  handRows=+localStorage.getItem('guandan-rows')||3;
  flatRows=+localStorage.getItem('guandan-flatrows')||1;
}catch(_){}
// the test version always lays the hand out flat, in three rows
const fanMode=()=>!TEST&&!isPhone()&&handView==='fan';
const vertMode=()=>!TEST&&!isPhone()&&handView==='vert';
// cards that just arrived in your hand, with when they came: they flash until ARRIVE_MS has passed
const arrivals=new Map(),ARRIVE_MS=4000;
function renderHand(){
  if(mv&&mv.active){mv.dirty=true;return} // never rebuild the hand under a card being dragged
  if(TEST)testArrangeMine();
  const el=$('#hand'),now=performance.now();
  const fresh=new Set(G.fresh);
  for(const [id,t] of arrivals)if(now-t>ARRIVE_MS)arrivals.delete(id);
  el.innerHTML=orderedHand().map(c=>cardHTML(c,G.L,(sel.has(c.id)?'sel ':'')+(fresh.has(c.id)?'fresh ':'')+(arrivals.has(c.id)?'arrive':''))).join('');
  // a rebuilt hand picks the flashing up where it had got to, rather than starting it again
  for(const [id,t] of arrivals){const c=el.querySelector(`.card[data-id="${id}"]`);if(c)c.style.animationDelay=-(now-t)+'ms'}
  layoutHand();
  renderControls();
  if(TEST)testMine();
}
