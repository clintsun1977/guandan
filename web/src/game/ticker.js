let lastTick=performance.now();
setInterval(()=>{
  const now=performance.now(),dt=Math.min(now-lastTick,1000);
  lastTick=now;
  const c=G&&G.clock;
  if(!c||G.paused||(NET.mode==='solo'&&!$('#overlay').hidden)||TV.open||TV.edit)return; // paused, a solo game with a panel open, or looking back or writing a comment in the test version
  if(TEST&&c.think==null)return; // the test version has no time limits: nobody is hurried, nothing runs out
  const before=c.left;
  c.left-=dt;
  if(c.think==null&&c.left>0&&c.left<=HURRY_MS&&Math.ceil(before/1000)!==Math.ceil(c.left/1000))Sound.play('tick');
  if(c.think!=null&&c.total-c.left>=c.think){
    const pl=TEST?testDecide(c.who):aiMove(c.who);
    if(pl!==undefined){G.clock=null;act(playEvt(c.who,pl));return}
  }
  if(c.left<=0){if(isHost()){G.clock=null;timeUp(c)}else c.left=0;return}
  renderClocks();
},100);
// a clock ran out (host only): the computer makes the move for whoever's turn it was
// 超时: what the system plays for a player whose clock ran out. Following, it is always a pass. Leading, in this order, the first that
// exists: from the active zone (the cards not set in a group), the smallest single, pair, three, three with a pair, straight,
// pairs in a row, plate, each made of whole groups only (a lone card is a single; a pair is never split into two singles) and
// without wild cards; else a play that is not a bomb from the group zone (the smallest); else the smallest bomb; else any play
// at random
const TIMEOUT_TYPES=['single','pair','triple','full','straight','pairs3','trip2'];
function timeoutPlay(who){
  const hand=G.hands[who],L=G.L;
  if(!hand.length||G.trick)return null;
  const small=(a,b)=>a.value-b.value||cardSum(a,L)-cardSum(b,L);
  // the group zone is the player's own: only the player's own page knows it
  const fixed=new Set(who===0?(G.fixed||[]).flat():[]);
  const act=hand.filter(c=>!fixed.has(c.id));
  if(act.length){
    const ag=handGroups(act,L),plays=genPlays(act,L).concat(fullHouses(act,L)).filter(pl=>!pl.wu&&hintTier(pl,ag)===0);
    for(const t of TIMEOUT_TYPES){
      const pick=plays.filter(pl=>pl.type===t).sort(small)[0];
      if(pick)return pick;
    }
  }
  // the group zone: a group set as it is, not a bomb, the smallest
  if(who===0&&G.fixed&&G.fixed.length){
    const own=[];
    for(const gr of G.fixed){
      const cards=gr.map(id=>hand.find(c=>c.id===id)).filter(Boolean);
      if(!cards.length)continue;
      for(const a of analyze(cards,L))if(!isBomb(a))own.push({...a,cards,wu:cards.filter(c=>isWild(c,L)).length});
    }
    if(own.length)return own.sort(small)[0];
  }
  const all=genPlays(hand,L).concat(fullHouses(hand,L));
  const bombs=all.filter(isBomb).sort((a,b)=>power(a)-power(b));
  if(bombs.length)return bombs[0];
  return all.length?all[Math.floor(Math.random()*all.length)]:null;
}
function timeUp(c){
  const who=c.who;
  if(who==='prep'){act({k:'begin'});return}
  if(who==='deck'){act({k:G.phase==='shuffle'?'shuffle':'cut'});return}
  if(who==='tribute'){
    for(const s of c.seats)if(G.phase==='tribPick'&&G.tribPick[s]==null){
      const card=tributeCard(G.hands[s],G.L);
      if(s===0){sel=new Set();setMsg(`时间到，已自动进贡 ${cardText(card)}`)}
      act({k:'tribute',p:toAbs(s),id:card.id});
    }
    return;
  }
  if(who==='return'){
    for(const s of c.seats)if(owesReturn(s)){
      const card=aiReturnCard(G.hands[s],G.L);
      if(s===0){sel=new Set();setMsg(`时间到，已自动还贡 ${cardText(card)}`)}
      act({k:'return',p:toAbs(s),id:card.id});
    }
    return;
  }
  if(typeof who==='number'&&G.phase==='play'&&G.turn===who){
    const pl=timeoutPlay(who);
    if(who===0){sel=new Set();setMsg(pl?'时间到，已自动出牌':'时间到，自动过')}
    REC.auto=who; // the round record calls this move a timeout, not the player's
    try{act(playEvt(who,pl))}finally{REC.auto=-1}
  }
}
// the sorting countdown flanks the level disc: 理牌 on its left, the seconds on its right, both clear of the
// side players' plates; where the sides are too narrow (a phone) the two sit together above the disc
function placePrepBig(){
  const T=$('#table').getBoundingClientRect(),e=$('.emblem').getBoundingClientRect();
  const l=$('#prepL'),r=$('#prepR'),lw=l.offsetWidth,rw=r.offsetWidth;
  const cy=e.top+e.height/2-T.top,h=Math.max(l.offsetHeight,r.offsetHeight),w=lw+rw+12;
  // the sign and the clock stand side by side, close together, in the middle of the table
  let lx=e.left+e.width/2-w/2,rx=lx+lw+12,y=cy;
  // the test version's face-up hands take the room around the disc: the two sit together in the middle of the open table
  if(TEST){
    const g=pileGeo(),w=lw+rw+12;
    l.style.left=g.cx-w/2+'px';r.style.left=g.cx-w/2+lw+12+'px';
    l.style.top=g.cy-l.offsetHeight/2+'px';r.style.top=g.cy-r.offsetHeight/2+'px';
    return;
  }
  // a phone's box of who paid whom stands over the sign, under your partner's plate: where the two do not fit there
  // (a short screen) the sign steps down to make room
  const tb=$('#tribBox');
  if(isPhone()&&tb&&!tb.hidden)y=Math.max(y,phoneSignTop()+tb.offsetHeight+8-T.top+h/2);
  l.style.left=lx-T.left+'px';r.style.left=rx-T.left+'px';
  l.style.top=y-l.offsetHeight/2+'px';r.style.top=y-r.offsetHeight/2+'px';
  syncTribBox();
}
// the test version's step: after a move the game waits here; the next turn begins with the space bar or 继续
function testStepGo(){
  if(!TEST||!G||G.phase!=='play'||G.stepWait==null)return false;
  const p=G.stepWait;G.stepWait=null;G.turn=p;G.stepGo=true;
  startTurn();
  return true;
}
function renderClocks(){
  const c=G.clock;
  for(let p=0;p<4;p++){
    const el=p===0?$('#myClock'):$('#seat'+p+' .clock');
    const on=!!c&&(c.who===p||(c.who==='deck'&&c.seat===p)||((c.who==='tribute'||c.who==='return')&&c.seats.includes(p)));
    const n=on?String(Math.max(0,Math.ceil(c.left/1000))):'';
    if(el.dataset.n!==n){el.dataset.n=n;el.innerHTML=n?`<b>${n}</b>`:''}
    el.classList.toggle('hurry',on&&c.left<=HURRY_MS);
  }
  const prep=!!c&&c.who==='prep';
  $('#prep').hidden=!prep;$('#prepBig').hidden=!prep;
  if(prep){
    $('#prepBigNum').textContent=Math.max(0,Math.ceil(c.left/1000));
    $('#prepR').classList.toggle('hurry',c.left<=HURRY_MS);
    placePrepBig();
    $('#prepText').textContent=(G.returns&&G.returns.length?'理牌后还贡，':'')+`${G.turn===0?'你':NAMES[G.turn]}先出`;
    $('#readyBtn').hidden=(G.ready||[]).includes(0);
  }
}
