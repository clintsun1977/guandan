// card backs: the goose photo, or the original red stripes; remembered on this computer
// card backs, in the order a click steps through them: the goose photo, the maple leaf, the original red stripes
const BACKS=[['goose','大雁'],['maple','枫叶'],['stripes','花纹'],['none','无']];
let cardBack='goose';
try{const v=localStorage.getItem('guandan-back');if(BACKS.some(b=>b[0]===v))cardBack=v}catch(_){}
function syncBack(){
  for(const [k] of BACKS)document.documentElement.classList.toggle('back-'+k,k===cardBack&&k!=='stripes');
  $('#backName').textContent=BACKS.find(b=>b[0]===cardBack)[1];
}
$('#cardBackBtn').onclick=()=>{
  cardBack=BACKS[(BACKS.findIndex(b=>b[0]===cardBack)+1)%BACKS.length][0];
  try{localStorage.setItem('guandan-back',cardBack)}catch(_){}
  syncBack();
  // the heap of finished tricks goes, or comes back, with the card back
  if(G){pileRebuild();render()}
};
syncBack();
$('#readyBtn').onclick=()=>act({k:'ready',p:toAbs(0)});
$('#deckBtn').onclick=()=>act({k:G.phase==='cut'?'cut':'shuffle'});
