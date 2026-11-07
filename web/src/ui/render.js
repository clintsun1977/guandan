// a seat's side colour, from the direction you sit at: north and south red, east and west blue
const isRedSeat=p=>(DIRS.indexOf(myDir||'S')+p)%2===0;
function render(){
  phoneRefit();
  syncPauseBtn();
  for(let p=0;p<4;p++){const el=p===0?$('#mebar'):$('#seat'+p);el.classList.toggle('t-red',isRedSeat(p));el.classList.toggle('t-blue',!isRedSeat(p))}
  // a side playing A shows which try at A it is on: A1, A2 or A3 (the third is the last)
  for(const t of [0,1]){
    const n=(G.aFails||[0,0])[t];
    // (一次机会: once the other side has used its three tries, this side's turn at A is its one last try)
    const last=G.levels[t]===14&&G.aOut!=null&&G.aOut!==t;
    $('#lv'+t).textContent=G.levels[t]===14?(last?'A末':`A${Math.min(3,n+1)}`):rankName(G.levels[t]);
    $('#lvx'+t).textContent='';
  }
  for(const t of [0,1]){
    const el=$('#team'+t);
    el.classList.toggle('playing',G.lvlTeam===t);
    el.classList.toggle('t-red',isRedSeat(t));el.classList.toggle('t-blue',!isRedSeat(t));
    el.title=G.lvlTeam===t?'本局打这一方的级':'';
    $('#tn'+t).textContent=(t===0?'我方':'对方')+(G.lvlTeam===t?'打':'');
  }
  const lv=$('#curLv');if(lv.dataset.v!==rankName(G.L)){lv.dataset.v=lv.textContent=rankName(G.L);centerRank()}
  // the disc takes the colour of the side whose level is played; once a round is over it keeps that side's colour
  // (lvlTeam already names the side for the next round) until the next round starts
  const lt=(G.phase==='roundEnd'||G.phase==='over')&&G.result?G.result.aTeam:G.lvlTeam,em=$('.emblem');
  em.classList.toggle('t-red',isRedSeat(lt));em.classList.toggle('t-blue',!isRedSeat(lt));
  em.title=`本局打${lt===0?'我方':'对方'}的级`;
  for(let p=0;p<4;p++){
    const seat=$('#seat'+p);
    seat.classList.toggle('turn',G.phase==='play'&&G.turn===p&&p!==0);
    const place=G.out.indexOf(p);
    if(p!==0){
      showCount(seat.querySelector('.cnt'),place>=0?0:G.hands[p].length);
      showPlace(seat.querySelector('.place'),place);
    }
  }
  showCount($('#myCnt'),G.out.includes(0)?0:G.hands[0].length);
  const myPlace=G.out.indexOf(0);
  showPlace($('#myPlace'),myPlace);
  for(let p=0;p<4;p++){
    const [k,t]=statusOf(p),el=p===0?$('.meinfo .stat'):$('#seat'+p+' .stat');
    if(el.dataset.s!==k){el.dataset.s=k;el.textContent=t}
  }
  $('#mebar').classList.toggle('turn',G.phase==='play'&&G.turn===0);
  renderLastPlay();
  renderControls();
  renderHand();
  renderMsg();
  renderClocks();
  if(TEST)testRender();else{syncMini();testPlays()}
  symPlates();renderWatch();
}
// the line under the disc: the play now on the table and who made it, or who leads when the table is clear
function renderLastPlay(){
  let t='';
  // (what each player has just played is no longer written out here: the cards are on the table to be seen)
  if(G.phase==='play'&&G.trick){
    t='';
  }else if(G.phase==='play'&&G.turn>=0)t=`${G.turn===0?'你':NAMES[G.turn]} 先出`;
  const el=$('#lastPlay');
  if(el.dataset.t!==t){el.dataset.t=t;el.innerHTML=t}
  placeLastPlay();
}
// the line hangs just under the disc, no wider than the middle of the table
function placeLastPlay(){
  const el=$('#lastPlay');if(!el.textContent)return;
  const T=$('#table').getBoundingClientRect(),e=$('.emblem').getBoundingClientRect();
  // no wider than the middle of the table; on a phone, whose middle is very narrow, as wide as the room between the
  // side players' plates, so it stays on one or two lines
  const g=sideBtns()?null:pileGeo();
  el.style.maxWidth=(TEST&&G&&['play','roundEnd','over'].includes(G.phase)?Math.max(120,(()=>{const q=pileGeo();return Math.round((q.right-q.left)*testMidHalf*2)-8})()):
    Math.max(120,g?g.right-g.left-8:$('.mid').offsetWidth))+'px';
  // just under the disc; when that leaves the near player too little room for a row of cards, it rides up over the
  // disc's lower edge (below the figure) to give some back
  const cw=$('#pile .probe').offsetWidth||48;
  let y=e.bottom+16-T.top;
  const short=cw*CR*.75-(nearBottom()-T.top-(y+el.offsetHeight)-2*PASS_Y);
  if(short>0)y=Math.max(e.top+e.height*.74-T.top,y-short);
  const top=y+'px';
  el.style.left=e.left+e.width/2-T.left+'px';
  // the disc moved (the table grew as the hand got shorter): the line follows and the cards make way for it again
  el.style.top=top;
  const k=Math.round(y)+'|'+el.offsetHeight;
  if(el.dataset.k!==k){el.dataset.k=k;if(pileGroups.length)pileRefit()}
}
// a player's status tag: sorting or done sorting (the computer is done at once), then on the table whose turn it is
// and what each player did in the trick so far; nothing once they are out or between rounds
function statusOf(p){
  if(G.phase==='prep')return isHumanSeat(p)&&!(G.ready||[]).includes(p)?['sort','理牌中']:['sorted','理牌结束'];
  if(G.phase==='play'&&active(p)){
    if(G.turn===p)return['turn','准备出牌'];
    if(G.last[p]==='pass')return['pass','过'];
    if(G.last[p])return['played','已出牌'];
  }
  return['',''];
}
function renderControls(){
  const my=G.phase==='play'&&G.turn===0;
  // leading next while the finished trick is still on show: 出牌 can already be pressed
  const soon=G.phase==='play'&&G.turn===-1&&G.nextLeader===0&&G.hands[0].length>0;
  const pay=G.phase==='tribPick'&&G.tribGivers.includes(0)&&G.tribPick[0]==null;
  const ret=owesReturn(0)||pay;
  $('#playBtn').hidden=ret;$('#passBtn').hidden=ret;$('#hintBtn').hidden=ret;
  $('#returnBtn').hidden=!ret;
  $('#returnBtn').textContent=pay?'进贡':'还贡';
  // once your hand is empty (out, or the round is over) the play buttons have nothing left to do
  // while you are sorting, the "done sorting" button takes the play buttons' place
  $('#btns').hidden=(!ret&&G.phase!=='deal'&&!G.hands[0].length)||(sideBtns()&&G.phase==='prep'&&!ret&&!(G.ready||[]).includes(0));
  // every button that does something right now is lit, the others are dimmed and cannot be pressed:
  // 出牌 once the picked cards make a play that may go out now (beats the table, or any combination when you are
  // about to lead), 提示 on your turn, 过 when there is something on the table to pass on, 重选 while any cards are picked
  const picked=sel.size>0,cur=my&&G.trick?G.trick.play:null;
  const playable=(my||soon)&&picked&&analyze(selectedCards(),G.L).some(r=>beats(r,cur));
  const can={playBtn:playable,hintBtn:my,passBtn:my&&!!G.trick,clearBtn:picked};
  if(cfm&&(!playable||cfm!==selKey()))cfm=null;
  $('#playBtn').textContent=cfm?'确认':'出牌';
  $('#playBtn').classList.toggle('cfm',!!cfm);
  syncCfmShow();
  for(const id in can){const b=$('#'+id);b.disabled=!can[id];b.classList.toggle('primary',can[id])}
  // 同花顺 beside your name while you sort your cards and while you play them
  $('#sfBtn').hidden=!['prep','play'].includes(G.phase)||!G.hands[0].length;
  // (the test version's button says so when the hand has no straight flush)
  if(TEST&&!$('#sfBtn').hidden){const none=!straightFlushes().length;$('#sfBtn').disabled=none;$('#sfBtn').textContent=none?'无同花顺':'同花顺'}
  const fb=$('#fixBtn'),fixedNow=new Set((G.fixed||[]).flat());
  fb.disabled=!picked||!G.hands[0].length;
  fb.textContent=testGrouped()?'成组':picked&&[...sel].every(id=>fixedNow.has(id))?'放回':'成组';
  if(testGrouped()){
    fb.disabled=sel.size<2;
    const sp=$('#splitBtn');if(sp){sp.disabled=!picked;sp.hidden=false}
    const rb=$('#sortBtn');rb.disabled=!(G.tgLock&&G.tgLock.length);
  }
  const deckTurn=(G.phase==='shuffle'&&G.shuffler===0)||(G.phase==='cut'&&G.cutter===0);
  $('#deckBtn').hidden=!deckTurn||!!G.busy;
  $('#deckBtn').textContent=G.phase==='cut'?'切牌':'洗牌';
  placeActionBtns();
  renderCoach();
  Emotes.sync();
}
// the table speaks for itself: only things you could not otherwise see get a line here
// (what changed hands in the tribute, a lead passing to a partner, which card you still owe)
function renderMsg(){
  if(msgTimer)return;
  const m=$('#msg');m.classList.remove('err');
  let t='';
  if(G.phase==='return'){
    const mine=G.returns.find(x=>x.from===0);
    t=tribHtml();
    if(owesReturn(0))t+=`<div>还一张 10 或以下的牌给${NAMES[mine.to]}</div>`;
    const wait=G.returns.filter(x=>x.from!==0&&G.retPick[x.from]==null);
    if(wait.length)t+=`<div>等待${wait.map(x=>NAMES[x.from]).join('、')}还贡</div>`;
  }else if(G.phase==='tribPick'){
    const opts=[...new Map(tribOptions(0).map(c=>[cardText(c),c])).values()];
    if(G.tribGivers.includes(0)&&G.tribPick[0]==null)t=`<div class="trib">进贡最大的牌：${opts.map(cardTag).join(' ')}${opts.length>1?'，选一张':''}</div>`;
    const wait=G.tribGivers.filter(g=>g!==0&&G.tribPick[g]==null);
    if(wait.length)t+=`<div>等待${wait.map(g=>NAMES[g]).join('、')}进贡</div>`;
  }else if(G.phase==='tribute'||G.phase==='prep'){
    t=G.notice?`<div>${G.notice}</div>`:'';
    // done sorting and owing a return: it can go now, without waiting for the others to finish sorting
    if(owesReturn(0))t+=`<div class="trib">还一张 10 或以下的牌给${NAMES[G.returns.find(x=>x.from===0).to]}</div>`;
  }else if(G.phase==='play'){
    t=G.notice?`<div>${G.notice}</div>`:'';
  }
  m.innerHTML=t;
  syncTribBox();
  syncTribInfo();
}
