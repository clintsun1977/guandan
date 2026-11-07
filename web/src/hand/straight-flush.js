// every straight flush the hand can make, wild cards filling the gaps: those needing fewer wild cards first, then low to
// high; each press of 同花顺 picks the next one, so the player can look them over and set one aside while sorting
function straightFlushes(hand=G.hands[0]){
  const L=G.L,w=hand.filter(c=>isWild(c,L)),out=[];
  for(const su of SUITS)for(let s=1;s<=10;s++){
    const nat=[];let wu=0;
    for(let q=s;q<s+5;q++){const r=q===1?14:q,c=hand.find(x=>!isWild(x,L)&&x.s===su&&x.r===r);if(c)nat.push(c);else wu++}
    if(wu<=w.length&&wu<5){const cards=nat.concat(w.slice(0,wu));if(analyze(cards,L).some(a=>a.type==='sflush'))out.push({cards,wu,s,su})}
  }
  // the same cards are one straight flush, however the wild cards are read (4 natural cards of a run and a wild card fit the run
  // above them or below them: one flush, shown once, as the higher run)
  const same=new Map();
  for(const o of out){const k=o.cards.map(c=>c.id).sort((a,b)=>a-b).join(),p=same.get(k);if(!p||o.s>p.s)same.set(k,o)}
  const all=[...same.values()];
  // and a flush that puts a wild card in where the hand holds a natural card of its own is no other way to make it: a hand with a
  // whole flush and two wild cards is one flush, not that and four more made of its cards with a wild card at either end
  const real=a=>a.cards.filter(c=>!isWild(c,L));
  const list=all.filter(a=>!all.some(b=>b!==a&&b.wu<a.wu&&real(a).every(c=>b.cards.includes(c))));
  return list.sort((a,b)=>a.wu-b.wu||a.s-b.s||SUIT_ORDER[a.su]-SUIT_ORDER[b.su]);
}
let sfIdx=0;
$('#sfBtn').onclick=()=>{
  const list=straightFlushes();
  if(!list.length){setMsg('手里的牌组不成同花顺');return}
  // every one has been shown: one more press puts the picked cards down again
  if(sfIdx>=list.length){sfIdx=0;sel=new Set();renderHand();setMsg(`共 ${list.length} 种同花顺，已放下`);Sound.play('select');return}
  const k=sfIdx,f=list[k];sfIdx++;
  sel=new Set(f.cards.map(c=>c.id));
  renderHand();
  // (how many there are and which one is lifted, never the ranks or suits)
  setMsg(`共 ${list.length} 种同花顺，抬起的是第 ${k+1} 种`);
  Sound.play('select');
};
$('#rulesBtn').onclick=showRules;
