/* ---------- 出牌评价: danMCai's score for the cards you pick, and for your last move ---------- */
// Taken from stevensun1005/guandanai (web/src/coach/evaluation.mjs and controller.js, https://github.com/stevensun1005/guandanai);
// the danMCai network is guandanai's too (bot/danmcai/README.md).
// On your own turn the danMCai network (bot/models.json) scores, once, every move you could make, from what you can see:
// your own hand, the plays so far, how many cards each player holds and the levels (guandanai's 出牌评价, without its
// Top 5 list). The cards you pick show as 合理性 N%: 100 for the move the network values most, 0 for the one it values
// least. It is a relative score, not a chance of winning. After you play, that move's score stays as 上一手 until the
// round is over. Whoever plays alone or opens the room turns it on or off in the lobby (出牌评价); × hides it on your own
// page for the rest of the game.
// Top 5 (guandanai's list of the network's five best plans, with their scores; a tap picks those cards, it does not play
// them) is only for the nicknames in TOP5_NAMES, whoever opened the room, and for them the box shows even with 出牌评价 off
const COACH_ID='danmcai'; // TOP5_NAMES: lobby.js
const CO={turn:null,last:null,hidden:false,topOpen:null};
const coachKey=()=>G.tok+':'+G.log.length;
const coachTop5=()=>TOP5_NAMES.includes((myNick||'').trim().toLowerCase());
const coachDeck=makeDeck();
const coachShown=()=>(RULES.coach!==false||coachTop5())&&!CO.hidden&&!TEST&&!SPEC&&!ENDG&&NeuralBot.has(COACH_ID)&&isHumanSeat(0)&&!!G&&
  ['play','roundEnd','over'].includes(G.phase);
// the table as you see it at the start of your turn; the other hands go in only as counts
function coachSnap(){
  if(CO.turn&&CO.turn.key===coachKey())return CO.turn;
  const s={key:coachKey(),G,round:G.round,scores:new Map(),values:null,error:false,extra:false,
    g:{hands:G.hands.map((h,i)=>i===0?h.slice():new Array(h.length)),trick:G.trick?{player:G.trick.player,play:G.trick.play}:null,
      passes:G.passes||0,log:G.log.slice(),levels:G.levels.slice(),L:G.L}};
  CO.turn=s;
  setTimeout(()=>NeuralBot.rate(COACH_ID,s.g)
    .then(r=>{s.values=r.values;s.actions=r.actions;r.actions.forEach((ids,i)=>s.scores.set(NeuralBot.actionKey(ids),r.values[i]))},e=>{s.error=true;console.warn('出牌评价出错',e)})
    .finally(renderCoach),150);
  return s;
}
// the picked cards read the strongest legal way, as 出牌 plays them; nothing picked when you may pass is a pass
function coachPick(){
  const cards=selectedCards(),cur=G.trick?G.trick.play:null;
  if(!cards.length)return cur?{ids:[],label:'过牌'}:null;
  const shape=analyze(cards,G.L).filter(s=>beats(s,cur)).sort((a,b)=>strength(b)-strength(a))[0];
  return shape?{ids:cards.map(c=>c.id),label:TYPE_NAME[shape.type]}:{invalid:true};
}
function coachGrade(s,a){
  if(s.error)return'评价暂不可用';
  if(!s.values)return'评价中…';
  const k=NeuralBot.actionKey(a.ids);
  if(!s.scores.has(k)){
    // a legal move the list of moves leaves out is scored by itself and joins the comparison
    if(!s.extra){
      s.extra=true;
      NeuralBot.rate(COACH_ID,s.g,a.ids).then(r=>{s.scores.set(k,r.values[0]);s.values.push(r.values[0]);s.actions.push(r.actions[0])},()=>{s.error=true})
        .finally(()=>{s.extra=false;renderCoach()});
    }
    return'评价中…';
  }
  const r=NeuralBot.relativeRating(s.values,s.scores.get(k));
  if(s===CO.turn&&G.phase==='play'&&G.turn===0)CO.shown=s.key; // a score was on show before this move (marked in the round record)
  return`合理性 ${r.percent}%${r.flat?' · 候选无明显分差':''}`;
}
// whether a score was shown on this turn before you moved
const coachAssisted=()=>!!G&&CO.shown===coachKey();
// called as you play or pass (not for a move the clock made for you)
function coachRemember(pl){
  if(!coachShown()||G.phase!=='play'||G.turn!==0)return;
  CO.last={s:coachSnap(),a:{ids:pl?pl.cards.map(c=>c.id):[],label:pl?TYPE_NAME[pl.type]:'过牌'}};
}
function renderCoach(){
  const box=$('#coach'),on=coachShown();
  box.hidden=!on;
  if(!on){$('#coachSide').hidden=true;top5Room(false);return}
  if(CO.last&&(CO.last.s.G!==G||CO.last.s.round!==G.round))CO.last=null;
  let now='轮到你时评价';
  if(G.phase==='play'&&G.turn===0){
    const s=coachSnap(),a=coachPick();
    now=!a?'选牌查看合理性':a.invalid?'这几张牌不能出，不评分':`${a.label} · ${coachGrade(s,a)}`;
  }
  let last=CO.last?`上一手 ${CO.last.a.label} · ${coachGrade(CO.last.s,CO.last.a)}`:'出牌后保留上一手评价';
  // a phone has room for a two-line chip only: the same, said shortly
  const phone=isPhone();
  if(phone){
    const short=t=>t.replace('合理性 ','').replace(' · 候选无明显分差','').replace('上一手','上手').replace(' · ',' ');
    now=G.phase==='play'&&G.turn===0?short(now).replace('选牌查看','选牌看').replace('这几张牌不能出，不评分','不能出'):'这手 —';
    last=CO.last?short(last):'上手 —';
  }
  $('#coach').classList.toggle('chip',phone);
  $('#coachNow').textContent=now;
  $('#coachLast').textContent=last;
  renderTop5(phone);
  coachPlace();
}
// Top 5, laid out as guandanai lays it out, so it covers nothing: on a computer 800px or wider it is a column of its own on the
// right and the whole table (header, plates, pile, hand, buttons) moves over to make room for it, giving the room back when
// it is folded away; on a phone or a narrower window it starts folded and opens as a pop-up under the header that stops short
// of the hand and the play buttons (a tap on the evaluation chip, or Top 5 in its box, opens and closes it)
const top5Wide=()=>!isPhone()&&innerWidth>=800;
function renderTop5(phone){
  const on=coachTop5(),side=$('#coachSide'),list=$('#coachTop'),btn=$('#coachTopBtn'),wide=top5Wide();
  // first shown, and whenever the window crosses 800px: open as a column, folded as a pop-up
  if(CO.topOpen===null||CO.wasWide!==wide){CO.topOpen=wide;CO.wasWide=wide}
  btn.hidden=!on||phone;
  btn.textContent=CO.topOpen?'收起 Top 5':'Top 5';
  $('#coach').classList.toggle('top5',on);
  const show=on&&CO.topOpen;
  side.hidden=!show;
  side.classList.toggle('pop',show&&!wide);
  top5Room(show&&wide);
  if(!show)return;
  const mine=G.phase==='play'&&G.turn===0,s=mine?coachSnap():null;
  if(!s||s.error||!s.values){
    $('#coachTopStatus').textContent=s&&s.error?'评价暂不可用':s?'正在比较所有出法…':'轮到你时显示推荐';
    list.innerHTML='';
    top5Pop();
    return;
  }
  const cur=G.trick?G.trick.play:null,top=NeuralBot.ranked(s.actions,s.values,G.L,cur,5),picked=NeuralBot.actionKey([...sel]);
  $('#coachTopStatus').textContent=`已比较 ${s.actions.length} 种出法 · 点一下选中，不会自动打出`;
  list.innerHTML=top.map((row,i)=>{
    const pct=NeuralBot.relativeRating(s.values,row.value).percent;
    const gap=i?` <small class="coach-gap" title="与第一名的模型值差（约等于本局升级分），越接近 0 差别越小">差 ${(row.value-top[0].value).toFixed(2)}</small>`:'';
    const cards=row.ids.length?row.ids.map(id=>{const c=coachDeck[id];return`<span class="coach-card${c.s==='H'||c.s==='D'||c.r===17?' red':''}">${cardText(c)}</span>`}).join(''):'<span class="coach-pass">本轮不跟牌</span>';
    const on1=row.ids.length&&NeuralBot.actionKey(row.ids)===picked?' on':'';
    return`<li><button type="button" class="coach-choice${on1}" data-i="${i}"><span class="coach-choice-head"><strong>${i+1}. ${row.ids.length?TYPE_NAME[row.shape.type]:'过牌'}</strong><b>${pct}%${gap}</b></span><span class="coach-cards">${cards}</span></button></li>`;
  }).join('');
  list.querySelectorAll('.coach-choice').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    if(G.phase!=='play'||G.turn!==0||CO.turn!==s)return;
    const row=top[+b.dataset.i];
    sel=new Set(row.ids);hintIdx=0;
    renderHand();
  });
  CO.shown=s.key; // the numbers were on show before this move (marked in the round record)
  top5Pop();
}
// the column takes its room from the table: when that changes, everything is laid out again as for a new window size
function top5Room(on){
  if(document.body.classList.contains('has-top5')===on)return;
  document.body.classList.toggle('has-top5',on);
  requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
}
// the pop-up: from under the header down to just above the hand and the play buttons
function top5Pop(){
  const side=$('#coachSide');
  if(side.hidden||!side.classList.contains('pop'))return;
  const top=Math.round($('.bar').getBoundingClientRect().bottom+6);
  let floor=innerHeight-8;
  for(const el of document.querySelectorAll('#hand,#btns .btn')){const r=el.getBoundingClientRect();if(r.height&&r.top>top+80)floor=Math.min(floor,r.top-8)}
  side.style.setProperty('--top5-top',top+'px');
  side.style.setProperty('--top5-h',Math.max(120,floor-top)+'px');
}
// the evaluation box stands in the bottom-left corner over the felt, whatever the screen
function coachPlace(){
  const box=$('#coach');
  if(box.hidden)return;
  if(box.classList.contains('chip')){
    // a phone: right of the 选项 … 退出 row in the header
    const a=$('.bar .acts').getBoundingClientRect();
    box.style.setProperty('--coach-top',Math.round(a.top)+'px');
    box.style.setProperty('--coach-left',Math.round(a.right+8)+'px');
    return;
  }
  // it sits on whatever comes first under it in its column: the 成组区 frame, your name row, 同花顺 / 成组 (which a narrow
  // table moves left of your name), so it covers none of them
  const left=box.getBoundingClientRect().left,width=Math.min(260,innerWidth-24);
  let floor=innerHeight-8,found=false;
  for(const el of document.querySelectorAll('#fixZone,#mebar .meinfo,#mebar .stat,#mebar .cnt,#sfBtn,#fixBtn')){
    const r=el.getBoundingClientRect();
    if(r.width&&r.height&&r.left<left+width&&r.right>left){floor=Math.min(floor,r.top-8);found=true}
  }
  box.style.width=width+'px';
  box.style.setProperty('--coach-bottom',(found?Math.max(8,innerHeight-floor):Math.round(innerHeight*.42))+'px');
}
const coachModel=NeuralBot.models.find(m=>m.id===COACH_ID)||{};
$('#coachName').textContent=coachModel.name||'';
$('#coachName').parentElement.title=`${coachModel.label||''}：`+$('#coachName').parentElement.title;
$('#coachClose').onclick=()=>{CO.hidden=true;renderCoach()};
$('#coachTopBtn').onclick=e=>{e.stopPropagation();CO.topOpen=!CO.topOpen;renderCoach()};
$('#coachSideClose').onclick=e=>{e.stopPropagation();CO.topOpen=false;renderCoach()};
$('#coach').addEventListener('click',e=>{
  if(!$('#coach').classList.contains('chip')||!coachTop5())return;
  CO.topOpen=!CO.topOpen;renderCoach();
});
// a window that grows past 800px or shrinks below it switches between the column (open) and the pop-up (folded)
addEventListener('resize',()=>{if(G&&!$('#coach').hidden&&coachTop5()&&top5Wide()!==CO.wasWide)renderTop5(isPhone());coachPlace();top5Pop()});
