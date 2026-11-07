// the deck travels to whoever is handling it: it is shuffled right in front of the shuffler, slid across to
// the cutter and cut in front of them, then comes back to the middle to be dealt; their plate glows meanwhile
function startShuffle(){
  G.phase='shuffle';
  showDeck();
  // (the test version does not shuffle or cut for show: the deal begins at once)
  if(!TEST){markActor(G.shuffler,'洗牌');slideDeck(actorSpot(G.shuffler))}
  if(isHumanSeat(G.shuffler)&&!TEST){G.clock={who:'deck',seat:G.shuffler,left:DECK_MS,total:DECK_MS};render();return}
  render();
  if(isHost())later(()=>act({k:'shuffle'}),TEST?0:1000);
}
function doShuffle(){
  if(G.phase!=='shuffle'||G.busy)return;
  G.busy=true;G.clock=null;render();
  animShuffle(()=>{G.busy=false;startCut()},actorSpot(G.shuffler));
}
function startCut(){
  G.phase='cut';
  if(!TEST){markActor(G.cutter,'切牌');slideDeck(actorSpot(G.cutter))}
  if(isHumanSeat(G.cutter)&&!TEST){G.clock={who:'deck',seat:G.cutter,left:DECK_MS,total:DECK_MS};render();return}
  render();
  if(isHost())later(()=>act({k:'cut'}),TEST?0:1000);
}
function doCut(){
  if(G.phase!=='cut'||G.busy)return;
  G.busy=true;G.clock=null;render();
  animCut(()=>{
    markActor(-1);
    slideDeck(null);
    later(()=>{G.busy=false;beginDeal()},TEST?0:520);
  },actorSpot(G.cutter));
}
// where the deck sits when a player handles it: on the table right in front of them
function actorSpot(p){
  const g=pileGeo();
  // a computer or tablet: the deck is shuffled and cut in the middle of the table, whoever does it (their plate still lights up)
  if(!isPhone())return{x:g.cx,y:g.cy};
  if(p===0)return{x:g.cx,y:g.bottom-g.ch*.8};
  if(p===2)return{x:g.cx,y:g.top+g.ch*.8};
  if(p===3)return{x:g.left+g.cw*1.9,y:g.sideY[3]};
  return{x:g.right-g.cw*1.9,y:g.sideY[1]};
}
function slideDeck(spot){
  const d=$('#deck');if(!d)return;
  const g=pileGeo(),at=spot||{x:g.cx,y:g.hy};
  d.style.transition=TEST?'none':'transform .5s cubic-bezier(.3,.7,.3,1)';
  d.style.transform=`translate(${at.x}px,${at.y}px)`;
}
// the player handling the deck: their plate glows and a large label beside it says what they are doing
function markActor(p,text){
  document.querySelectorAll('.acting').forEach(e=>e.classList.remove('acting'));
  document.querySelectorAll('.fx-act').forEach(e=>e.remove());
  if(p<0)return;
  (p===0?$('.meinfo'):$('#seat'+p+' .who')).classList.add('acting');
  // on your own turn the button is the only thing to look at, so no label competes with it
  if(p===0)return;
  // the label belongs to the plate's row, so it moves with the plate: over it for the side players (above their tags),
  // to the right of the row for the player across the table
  const e=document.createElement('div');
  e.className='fx-act actlbl';e.textContent=text;
  $('#seat'+p+' .whorow').appendChild(e);
}
function beginDeal(){
  G.phase='deal';G.busy=false;G.clock=null;
  render();
  if(TEST){later(finishDeal,0);return} // (the test version does not deal card by card: every hand is complete at once)
  later(dealNext,300);
}
const DECK_MS=15000; // time you get to shuffle or cut before it is done for you
// one card leaves the centre every 20ms and lands in a hand 240ms later
function dealNext(){
  if(G.phase!=='deal')return;
  if(G.dealCount>=108){later(finishDeal,450);return}
  const p=(G.dealIdx+G.dealCount++)%4;
  fly(p);
  Sound.play('flick');
  later(()=>{
    const c=G.deck.pop();if(!c)return;
    G.hands[p].push(c);
    dealView(p,c);
  },240);
  later(dealNext,reduceMotion()?0:20);
}
function finishDeal(){
  // a spectator's page deals as the host's does (one card to each seat in turn from the cutter's seat, popped off the end of the deck):
  // the test version's fill below gives a whole hand to one seat at a time, which makes four different hands
  if(SPEC)while(G.deck.length)G.hands[(G.dealIdx+G.dealCount++)%4].push(G.deck.pop());
  // also fills hands at once if the page was reloaded mid-deal
  for(let p=0;p<4;p++)while(G.hands[p].length<27&&G.deck.length)G.hands[p].push(G.deck.pop());
  G.deck=[];
  for(const h of G.hands)sortHand(h,G.L);
  removeDeck();
  if(!G.prevOut){
    G.turn=G.firstLeader;
    G.notice='';
    startPrep(G.turn);
  }else if(!RULES.trib){
    G.notice='';
    startPrep(G.prevOut[0]);
  }else{
    // the tribute is paid straight after the deal; the returns come after the sorting minute
    G.notice='';
    doTribute();
  }
}
