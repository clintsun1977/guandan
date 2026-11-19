function doTribute(){
  G.trib=[];
  const o=G.prevOut,L=G.L;
  const dbl=o[1]%2===o[0]%2;
  const givers=dbl?[o[2],o[3]]:[o[3]];
  const bigJ=givers.reduce((s,g)=>s+G.hands[g].filter(c=>c.r===17).length,0);
  if(bigJ>=2){
    // who holds the big jokers, kept so the screen can spell out the resistance and what follows from it
    G.kang={has:givers.map(g=>({g,n:G.hands[g].filter(c=>c.r===17).length})).filter(x=>x.n),leader:o[0]};
    G.notice='';
    G.phase='tribute';render();
    const tok=G.tok,jokers=givers.flatMap(g=>G.hands[g].filter(c=>c.r===17).map(c=>({g,c})));
    kangAnim(jokers).then(()=>{if(G.tok===tok)startPrep(o[0])});
    return;
  }
  G.tribGivers=givers;G.tribPick={};G.clock=null;
  // Each payer is independent of the other: who pays whom, and who leads, are settled here, at the start, because the card a payer owes is
  // always the largest there is (only its suit can be chosen). Two payers with cards of one size: 贡左还右, each pays their 上家 and the
  // return goes back to them; the 头游's 下家 leads. Otherwise the larger card goes to 头游, the smaller to 二游, and its payer leads.
  const hv=g=>Math.max(...G.hands[g].filter(c=>!isWild(c,L)).map(c=>val(c,L)));
  G.tribTo={};
  if(dbl){
    const [a,b]=givers.slice().sort((x,y)=>hv(y)-hv(x));
    if(hv(a)===hv(b)){G.tribTo[a]=(a+3)%4;G.tribTo[b]=(b+3)%4;G.leader=(o[0]+1)%4}
    else{G.tribTo[a]=o[0];G.tribTo[b]=o[1];G.leader=a}
  }else{G.tribTo[givers[0]]=o[0];G.leader=givers[0]}
  G.tribSent=[];G.tribArrived=0;G.tribPrep=false;G.tribFlying=0;G.returns=[];G.gives=[];
  if(givers.includes(0))sel=new Set();
  tribWait();
}
// the largest cards a payer may give (never a wild card); with several of that rank in different suits, they choose
function tribOptions(p){
  const h=G.hands[p].filter(c=>!isWild(c,G.L)),m=Math.max(...h.map(c=>val(c,G.L)));
  return h.filter(c=>val(c,G.L)===m);
}
// the largest card goes at once, for the computer and for a player who has only one kind of it; a player whose
// largest card comes in several suits gets 30 seconds to choose, after which one goes for them
const tribChoice=g=>new Set(tribOptions(g).map(c=>c.s)).size>1;
function tribWait(){
  G.phase='tribPick';
  for(const g of G.tribGivers)if(G.tribPick[g]==null&&(!isHumanSeat(g)||!tribChoice(g)))G.tribPick[g]=tributeCard(G.hands[g],G.L).id;
  // every payer who has chosen pays at once: nobody waits for the other payer's choosing, and whoever receives may return and sort meanwhile
  for(const g of G.tribGivers)if(G.tribPick[g]!=null&&!G.tribSent.includes(g))payOne(g);
  const left=G.tribGivers.filter(g=>G.tribPick[g]==null);
  if(!left.length){G.clock=null;checkTribDone();if(G.phase==='tribPick')render();return}
  if(G.clock&&G.clock.who==='tribute')G.clock.seats=left;
  else G.clock={who:'tribute',seats:left,left:TRIB_MS,total:TRIB_MS};
  if(left.includes(0)&&!sel.size){const op=tribOptions(0);if(op.length===1)sel=new Set([op[0].id])}
  if(left.includes(0))Sound.play('turn');
  render();
}
// one payer's card goes across now, and its receiver owes a return that may be made as soon as the card is in their hand
function payOne(g){
  G.tribSent.push(g);
  const to=G.tribTo[g],id=G.tribPick[g],tok=G.tok,entry={from:to,to:g,ready:false};
  G.returns.push(entry);G.tribFlying=(G.tribFlying||0)+1;G.notice='';
  handOver({from:g,to,id,label:'进贡'},tok).then(ok=>{
    if(!ok)return;
    G.tribFlying--;entry.ready=true;G.tribArrived++;
    // a computer returns early, one after the other
    if(!isHumanSeat(to))later(()=>{if((G.phase==='tribPick'||G.phase==='prep')&&G.returns.includes(entry))returnNow(to,aiReturnCard(G.hands[to],G.L).id)},1500);
    checkTribDone();render();
  });
}
// every payer has chosen and every card has arrived: the sorting minute begins (its clock starts here, not before)
function checkTribDone(){
  if(G.tribPrep||G.phase!=='tribPick'||G.tribArrived<G.tribGivers.length||G.tribGivers.some(g=>G.tribPick[g]==null))return;
  G.tribPrep=true;G.clock=null;G.afterTrib=false;
  startPrep(G.leader);
}
// one card changes hands: it leaves the giver's hand as it sets off and joins the receiver's on arrival;
// false if a new round started meanwhile
async function handOver(x,tok){
  const card=G.hands[x.from].find(c=>c.id===x.id);
  if(!card)return true;
  let start=null;
  if(x.from===0){
    const el=handEl.querySelector(`.card[data-id="${card.id}"]`);
    if(el){const r=el.getBoundingClientRect();start={x:r.left+r.width/2,y:r.top+r.height/2}}
  }
  G.hands[x.from]=G.hands[x.from].filter(c=>c!==card);
  sel.delete(card.id);
  render();
  await giveAnim(x.from,x.to,card,x.label,start);
  if(G.tok!==tok)return false;
  G.hands[x.to].push(card);sortHand(G.hands[x.to],G.L);
  if(x.to===0){G.fresh.push(card.id);arrivals.set(card.id,performance.now())}
  if(x.label==='进贡')G.trib.push({g:x.from,r:x.to,tc:card});
  else{const t=G.trib.find(t=>t.r===x.from&&t.g===x.to);if(t)t.rc=card}
  return true;
}
// hand over queued cards one at a time, face up across the table, then carry on with the returns
async function runGives(){
  G.phase='tribute';
  render();
  const tok=G.tok;
  while(G.gives.length){
    if(!await handOver(G.gives[0],tok))return;
    G.gives.shift();
    render();
  }
  // the tribute is in: sort your cards first (whoever leads is known now), the returns follow
  if(G.afterTrib){G.afterTrib=false;startPrep(G.leader);return}
  processReturns();
}
function processReturns(){
  if(!G.returns.length){startPlay(G.leader);return}
  G.retPick=G.retPick||{};
  if(G.returns.some(x=>x.from===0))sel=new Set();
  retWait();
}
// everyone who owes a return chooses at the same time (the computer at once, a player within 20 seconds);
// once all have chosen, the cards go back together
function retWait(){
  for(const x of G.returns)if(G.retPick[x.from]==null&&!isHumanSeat(x.from))G.retPick[x.from]=aiReturnCard(G.hands[x.from],G.L).id;
  const left=G.returns.filter(x=>G.retPick[x.from]==null).map(x=>x.from);
  if(!left.length){
    G.clock=null;
    G.gives=G.returns.map(x=>({from:x.from,to:x.to,id:G.retPick[x.from],label:'还贡'}));
    G.returns=[];
    later(runGives,150);
    return;
  }
  G.phase='return';
  if(G.clock&&G.clock.who==='return')G.clock.seats=left;
  else{G.clock={who:'return',seats:left,left:RET_MS,total:RET_MS};if(left.includes(0))Sound.play('turn')}
  render();
}
// owes a return now: in the return phase, or during the sorting minute once they have said they are done sorting
// a player owing a return may give it any time from the start of the sorting, without first finishing their sorting
// (a return can be made while the other payer is still choosing, once the card it answers has arrived)
const owesReturn=p=>(G.phase==='return'||G.phase==='prep'||G.phase==='tribPick')&&(G.returns||[]).some(x=>x.from===p&&x.ready!==false)&&(G.retPick||{})[p]==null;
// a return made during the sorting minute goes across at once, while the others are still sorting
function returnNow(p,id){
  const x=G.returns.find(r=>r.from===p);if(!x)return;
  G.returns=G.returns.filter(r=>r!==x);
  handOver({from:p,to:x.to,id,label:'还贡'},G.tok).then(ok=>{if(ok)render()});
  render();
}
function startPrep(leader){
  G.phase='prep';G.turn=leader;G.ready=[];G.retPick={};
  // the test version gives ten minutes, to sort the computer's hands too
  G.clock={who:'prep',left:TEST?600000:prepMs(),total:TEST?600000:prepMs()};
  render();
  // the computer players return their card early in the sorting minute, one after the other
  (G.returns||[]).filter(x=>!isHumanSeat(x.from)).forEach((x,i)=>later(()=>{
    if(G.phase==='prep'&&G.returns.includes(x))returnNow(x.from,aiReturnCard(G.hands[x.from],G.L).id);
  },1500+i*1200));
}
function beginPlay(){
  if(G.phase!=='prep')return;
  G.clock=null;
  if(G.returns&&G.returns.length){processReturns();return}
  startPlay(G.turn);
}
// after a tribute (or a refused one) the play waits three seconds while who paid whom stays where it was shown during
// the sorting, over your name; the leader may already press 出牌 meanwhile, as between two tricks
const TRIB_SHOW_MS=3000;
