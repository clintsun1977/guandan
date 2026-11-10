// These readouts belong to this viewer only; no scores or display flags are broadcast to the room.
const seatPowersVisible=()=>!!G&&!SPEC&&!TEST&&isHumanSeat(0)&&
  (myNick||'').trim().toLowerCase()==='stezer0'&&
  ['tribPick','tribute','return','prep','play','roundEnd','over'].includes(G.phase);
function renderSeatPowers(){
  if(!seatPowersVisible()){
    document.querySelectorAll('.seat-power').forEach(el=>el.remove());
    return;
  }
  for(let p=0;p<4;p++){
    const plate=p===0?$('#mebar .meinfo'):$('#seat'+p+' .who');
    let el=plate.querySelector('.seat-power');
    if(!el){
      el=document.createElement('span');el.className='seat-power';
      el.title='当前手牌牌力（0–100）';plate.appendChild(el);
    }
    const hand=G.hands[p],key=G.L+':'+hand.map(c=>c.id).sort((a,b)=>a-b).join(',');
    if(el.dataset.key===key)continue;
    el.dataset.key=key;
    el.textContent=hand.length?'牌力 '+handPower(hand,G.L):'已出完';
  }
}
