// 观战: once you are out of the round, the cards the others still hold are shown, face up, where your own hand was
let watchOn=false;
try{watchOn=localStorage.getItem('guandan-watch')==='1'}catch(_){}
$('#watchBtn').setAttribute('aria-pressed',watchOn);
$('#watchBtn').onclick=()=>{
  watchOn=!watchOn;
  try{localStorage.setItem('guandan-watch',watchOn?'1':'0')}catch(_){}
  $('#watchBtn').setAttribute('aria-pressed',watchOn);
  renderWatch();
};
// watching: out of the round, with 观战 on. Then the face-down heap and the turning over of the cards are done without
const watching=()=>!!(watchOn&&!TEST&&!isPhone()&&G&&G.phase==='play'&&G.out.includes(0));
let watchWas=false;
function renderWatch(){
  const on=watching();
  for(const p of [1,2,3]){
    let box=$('#watch'+p);
    if(!on||!G.hands[p].length){if(box&&!box.hidden){box.hidden=true;box.innerHTML='';box.dataset.k=''}continue}
    if(!box){box=document.createElement('div');box.id='watch'+p;box.className='watchbox';$('#seat'+p+' .whorow').appendChild(box)}
    box.hidden=false;
    const h=G.hands[p],k=h.map(c=>c.id).join()+'|'+G.L;
    if(box.dataset.k===k)continue;
    box.dataset.k=k;
    // each group as the player had arranged it (a computer's own arrangement; a person's cannot be seen, so that is used for them too)
    // laid out as in the test version: the sides' groups in rows of at most six cards, your partner's in one row (two when it is long)
      const units=handUnits(h,G.L,true);
      box.innerHTML=`<div class="prows">${rowsHTML(units,G.L,null,p!==2?rowsMax6(units):rowsOf(units,h.length<=14?1:2))}</div>`;
  }
  // watching starts or stops: the cards on the table are laid again (no heap, partner's plays in the middle, or the other way)
  if(on!==watchWas){watchWas=on;if(G&&pileEl())pileRebuild()}
}
$('#confirmBtn').onclick=()=>{
  confirmPlay=!confirmPlay;
  try{localStorage.setItem('guandan-confirm',confirmPlay?'1':'0')}catch(_){}
  $('#confirmBtn').setAttribute('aria-pressed',confirmPlay);
  if(cfm){cfm=null;if(G)renderControls()}
};
