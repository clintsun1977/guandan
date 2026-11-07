/* ---------- 出牌评价: danMCai's score for the cards you pick, and for your last move ---------- */
// Taken from stevensun1005/guandanai (web/src/coach/evaluation.mjs and controller.js, https://github.com/stevensun1005/guandanai);
// the danMCai network is guandanai's too (bot/danmcai/README.md).
// On your own turn the danMCai network (bot/models.json) scores, once, every move you could make, from what you can see:
// your own hand, the plays so far, how many cards each player holds and the levels (guandanai's 出牌评价, without its
// Top 5 list). The cards you pick show as 合理性 N%: 100 for the move the network values most, 0 for the one it values
// least. It is a relative score, not a chance of winning. After you play, that move's score stays as 上一手 until the
// round is over. Whoever plays alone or opens the room turns it on or off in the lobby (出牌评价); × hides it on your own
// page for the rest of the game
const COACH_ID='danmcai';
const CO={turn:null,last:null,hidden:false};
const coachKey=()=>G.tok+':'+G.log.length;
const coachShown=()=>RULES.coach!==false&&!CO.hidden&&!TEST&&!SPEC&&!ENDG&&NeuralBot.has(COACH_ID)&&isHumanSeat(0)&&!!G&&
  ['play','roundEnd','over'].includes(G.phase);
// the table as you see it at the start of your turn; the other hands go in only as counts
function coachSnap(){
  if(CO.turn&&CO.turn.key===coachKey())return CO.turn;
  const s={key:coachKey(),G,round:G.round,scores:new Map(),values:null,error:false,extra:false,
    g:{hands:G.hands.map((h,i)=>i===0?h.slice():new Array(h.length)),trick:G.trick?{player:G.trick.player,play:G.trick.play}:null,
      passes:G.passes||0,log:G.log.slice(),levels:G.levels.slice(),L:G.L}};
  CO.turn=s;
  setTimeout(()=>NeuralBot.rate(COACH_ID,s.g)
    .then(r=>{s.values=r.values;r.actions.forEach((ids,i)=>s.scores.set(NeuralBot.actionKey(ids),r.values[i]))},e=>{s.error=true;console.warn('出牌评价出错',e)})
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
      NeuralBot.rate(COACH_ID,s.g,a.ids).then(r=>{s.scores.set(k,r.values[0]);s.values.push(r.values[0])},()=>{s.error=true})
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
  if(!on)return;
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
  coachPlace();
}
// the box stands just over the 成组区 frame (bottom left), whatever its height on this screen
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
  const f=$('#fixZone'),z=f?f.getBoundingClientRect():{height:0};
  box.style.setProperty('--coach-bottom',(z.height>0?Math.max(8,innerHeight-z.top+8):Math.round(innerHeight*.42))+'px');
}
const coachModel=NeuralBot.models.find(m=>m.id===COACH_ID)||{};
$('#coachName').textContent=coachModel.name||'';
$('#coachName').parentElement.title=`${coachModel.label||''}：`+$('#coachName').parentElement.title;
$('#coachClose').onclick=()=>{CO.hidden=true;renderCoach()};
addEventListener('resize',()=>requestAnimationFrame(coachPlace));
