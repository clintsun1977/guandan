/* your own hand: arranged the computer's way once dealt (and again while the tribute changes it, until you change a group
   yourself); every card stays in a group, and the 牌力 is worked out from your groups */
const testGrouped=()=>TEST&&!!G&&G.tgRound===G.round&&!['start','shuffle','cut','deal'].includes(G.phase);
// a group read as the play it makes best (by its score), or null if its cards make no play
function readGroup(cards,L){
  return analyze(cards,L).map(a=>({...a,n:cards.length,cards})).sort((a,b)=>unitScore(b)-unitScore(a))[0]||null;
}
// a group that makes no play counts as its cards rank by rank (singles, pairs, threes)
function groupUnits(cards,L){
  const u=readGroup(cards,L);if(u)return[u];
  const by=new Map();
  for(const c of cards){const k=isWild(c,L)?'w':c.r>=16?c.r:val(c,L);(by.get(k)||by.set(k,[]).get(k)).push(c)}
  return[...by.values()].map(g=>readGroup(g,L)||{type:'single',n:1,value:val(g[0],L),cards:[g[0]]});
}
const myCards=()=>new Map(G.hands[0].map(c=>[c.id,c]));
function myUnits(){
  const h=myCards();
  return G.fixed.flatMap(gr=>{const cards=gr.map(id=>h.get(id)).filter(Boolean);return cards.length?groupUnits(cards,G.L):[]});
}
// your groups in the order the computer's are shown in: bombs first, then runs, then the rest, larger first; groups that
// make no play last
function sortGroups(groups,by,L){
  const key=gr=>{const u=readGroup(gr.map(id=>by.get(id)),L);return u?[T_ORDER.indexOf(u.type),isBomb(u)?-power(u):-u.value]:[99,0]};
  return groups.filter(gr=>gr.length).map(gr=>({gr,k:key(gr)})).sort((a,b)=>a.k[0]-b.k[0]||a.k[1]-b.k[1]).map(x=>x.gr);
}
function testSortMine(){G.fixed=sortGroups(G.fixed,myCards(),G.L)}
// several cards as one group, laid out the way their combination reads
function tidyIds(ids,hand){
  const cards=ids.map(id=>hand.find(c=>c.id===id)).filter(Boolean),u=readGroup(cards,G.L);
  return(u?displayOrder(u,G.L):sortHand(cards.slice(),G.L)).map(c=>c.id);
}

