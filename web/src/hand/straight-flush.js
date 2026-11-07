// every straight flush the hand can make, wild cards filling the gaps: those needing fewer wild cards first, then low to
// high; each press of 同花顺 picks the next one, so the player can look them over and set one aside while sorting
function straightFlushes(hand=G.hands[0]){
  const L=G.L,w=hand.filter(c=>isWild(c,L)),out=[];
  for(const su of SUITS)for(let s=1;s<=10;s++){
    const nat=[];let wu=0;
    for(let q=s;q<s+5;q++){const r=q===1?14:q,c=hand.find(x=>!isWild(x,L)&&x.s===su&&x.r===r);if(c)nat.push(c);else wu++}
    if(wu<=w.length&&wu<5){const cards=nat.concat(w.slice(0,wu));if(analyze(cards,L).some(a=>a.type==='sflush'))out.push({cards,wu,s,su})}
  }
  return out.sort((a,b)=>a.wu-b.wu||a.s-b.s||SUIT_ORDER[a.su]-SUIT_ORDER[b.su]);
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
