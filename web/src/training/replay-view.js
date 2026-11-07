/* the look-back view, over the whole screen; the game waits while it is open */
TV.speed=1500;
function testView(ri,step,play){
  TV.open=true;TV.ri=ri;TV.step=step;TV.sure=false;
  $('#tview').hidden=false;
  tvPlay(!!play);
}
function tvClose(){tvPlay(false);TV.open=false;$('#tview').hidden=true}
const tvRec=()=>TREC.rounds[TV.ri];
const tvCount=()=>tvRec().log.length;
function tvPlay(on){
  clearInterval(TV.timer);TV.play=on;
  if(on){
    if(TV.step>=tvCount())TV.step=0;
    TV.timer=setInterval(()=>{if(TV.step>=tvCount()){tvPlay(false);return}TV.step++;tvDraw()},TV.speed);
  }
  tvDraw();
}
// starting to write a comment stops the replay where it is, without drawing the view again under the cursor
function tvStop(){
  if(!TV.play)return;
  clearInterval(TV.timer);TV.play=false;
  const b=$('#tvPlay');if(b){b.textContent='回放';b.classList.remove('on')}
}
function tvNote(text){
  const rec=tvRec(),t=text.trim();
  if(t)rec.notes[TV.step]=t;else delete rec.notes[TV.step];
  rec.nv++;
  const l=$('#tview .tvl .tlist');if(l)l.innerHTML=recListHTML(rec,TV.step);
  testList();testStore();testPlays();
}
function tvClick(e){
  const b=e.target.closest('button,li[data-k]');if(!b)return;
  if(b.dataset.k){tvPlay(false);TV.step=+b.dataset.k;tvDraw();return}
  if(b.dataset.ms){TV.speed=+b.dataset.ms;tvPlay(TV.play);return}
  if(b.id==='tvClose'){tvClose();return}
  if(b.id==='tvPlay'){tvPlay(!TV.play);return}
  if(b.id==='tvRe'){
    // a round still being played asks once more: the second press gives it up
    const busy=!['roundEnd','over','start'].includes(G.phase);
    if(busy&&!TV.sure){TV.sure=true;b.textContent='放弃当前这局，确定重打？';return}
    testReplay(tvRec());return;
  }
  const n=tvCount();
  TV.step={tvFirst:0,tvLast:n,tvPrev:TV.step-1,tvNext:TV.step+1}[b.id]??TV.step;
  TV.step=Math.max(0,Math.min(n,TV.step));
  tvPlay(false);
}
document.addEventListener('keydown',e=>{
  if(!TV.open||e.target.closest('textarea,input,select'))return;
  if(e.key==='Escape')tvClose();
  else if(e.key===' '){e.preventDefault();tvPlay(!TV.play)}
  else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    e.preventDefault();
    TV.step=Math.max(0,Math.min(tvCount(),TV.step+(e.key==='ArrowLeft'?-1:1)));tvPlay(false);
  }
});
// how the play being looked at was made: the hand as arranged just before it, the cards played raised, and whether a group
// was broken up (which one, what was taken out and what is left) or whole groups were played
function tvBreak(rec,plays,cur){
  if(!cur||!cur.cards)return'';
  const L=rec.L,p=cur.p,ct=c=>cardText(c)+(isWild(c,L)?'*':'');
  const before=new Set(plays.slice(0,-1).flatMap(e=>e.cards.map(c=>c.id)));
  const units=recUnits(rec,p,rec.hands[p].filter(c=>!before.has(c.id))),played=new Set(cur.cards.map(c=>c.id));
  const gd=cs=>{const u=readGroup(cs,L);return`[${u?playName(u):'散牌'} ${cs.map(ct).join(' ')}]`};
  const info=units.map(u=>({cs:u.cards,out:u.cards.filter(c=>played.has(c.id))})).filter(x=>x.out.length);
  const part=info.filter(x=>x.out.length<x.cs.length),whole=info.filter(x=>x.out.length===x.cs.length);
  const verdict=part.length
    ?`拆牌了：`+part.map(x=>`从 ${gd(x.cs)} 里拿出 ${x.out.map(ct).join(' ')}，剩 ${x.cs.filter(c=>!played.has(c.id)).map(ct).join(' ')}`).join('；')+(whole.length?`；另外整组出了 ${whole.map(x=>gd(x.cs)).join(' ')}`:'')
    :`没有拆牌：出的是整组 ${whole.map(x=>gd(x.cs)).join(' ')}`;
  return`<div class="tvbrk"><div class="tvbh">${NAMES[p]}出牌前的配牌（出的牌抬起）</div><div class="peek"><div class="prows">${rowsHTML(units,L,played)}</div></div><div class="tvbv${part.length?' broke':''}">${verdict}</div></div>`;
}
// the table after the k-th play of the round (0: as play began): every hand, the trick so far, the comment on this play,
// the record beside it
function tvDraw(){
  const rec=tvRec(),L=rec.L,n=tvCount(),k=TV.step=Math.min(TV.step,n);
  const end=k,done=rec.log.slice(0,end),plays=done.filter(e=>e.cards),cur=done[k-1];
  const gone=new Set(plays.flatMap(e=>e.cards.map(c=>c.id)));
  const hands=rec.hands.map(h=>h.filter(c=>!gone.has(c.id)));
  // who has gone out so far, in order
  const left=rec.hands.map(h=>h.length),outs=[];
  for(const e of plays){left[e.p]-=e.cards.length;if(!left[e.p])outs.push(e.p)}
  // this trick, from its lead
  let s=-1;
  for(let i=end-1;i>=0;i--)if(done[i].cards&&done[i].lead){s=i;break}
  const trick=s<0?[]:done.slice(s);
  let note='';
  if(s>0)for(let i=s-1;i>=0;i--)if(done[i].cards){note='上一圈：'+trickEnd(done[i].p,done[s].p);break}
  const pw=p=>p===0&&rec.myGroups&&rec.myPower!==rec.power[0]?`${powerText(rec.myPower)}，电脑配牌 ${rec.power[0]}`:
    p&&rec.userPower[p]!=null?`${powerText(rec.power[p])}，你改后 ${rec.userPower[p]}`:powerText(rec.power[p]);
  const seat=p=>`<div class="tvs" data-p="${p}"><div class="tvn">${NAMES[p]}<small>${
    hands[p].length?`剩 ${hands[p].length} 张`:PLACE[outs.indexOf(p)]||''} · ${pw(p)}</small></div>
    <div class="peek"><div class="prows">${hands[p].length?rowsHTML(recUnits(rec,p,hands[p]),L):''}</div></div></div>`;
  const mid=`<div class="tvmid">${note?`<div class="tvnote">${note}</div>`:''}${trick.map(e=>e.cards?
    `<div class="tvp${e===cur?' cur':''}"><span class="no">${done.indexOf(e)+1}</span><span class="tw">${NAMES[e.p]} ${e.lead?'领出':'跟'}</span><span class="grp">${displayOrder(e,L).map(c=>cardHTML(c,L)).join('')}</span><small>${playName(e)}</small></div>`:
    `<div class="tvp pass${e===cur?' cur':''}"><span class="no">${done.indexOf(e)+1}</span><span class="tw">${NAMES[e.p]}</span>过</div>`).join('')}${
    k?'':`<div class="tvnote">${NAMES[rec.leader]}先出</div>`}${k===n&&rec.result?`<div class="tvnote">${rec.result}</div>`:''}${tvBreak(rec,plays,cur)}</div>`;
  const cm=`<div class="tvcm"><label for="tvNote">${k?`对第 ${k} 手的评语`:'对这一局开局（配牌）的评语'}</label>
      <textarea id="tvNote" rows="2" placeholder="${!k?'比如：这手牌应该配成…':cur.cards?'比如：这里应该出…，因为…':'比如：这里不该过，应该出…，因为…'}">${esc(rec.notes[k]||'')}</textarea></div>`;
  const v=$('#tview');
  v.innerHTML=`<div class="tvh">
      <div class="tvi">${roundName(rec)} · 打 ${rankName(L)}<small>${k?`第 ${k} / ${n} 手：${cur.cards?`${NAMES[cur.p]}${cur.lead?'领出':'跟'} ${playName(cur)}`:`${NAMES[cur.p]} 过`}`:`开局（共 ${n} 手）`}</small></div>
      <select id="tvRound" title="看哪一局">${TREC.rounds.map((r,i)=>`<option value="${i}"${i===TV.ri?' selected':''}>${roundName(r)}</option>`).join('')}</select>
      <button class="link" id="tvFirst">开头</button><button class="link" id="tvPrev">上一步</button><button class="link" id="tvNext">下一步</button><button class="link" id="tvLast">最后</button>
      <button class="link${TV.play?' on':''}" id="tvPlay">${TV.play?'暂停':'回放'}</button>
      <span class="muted">速度</span>${[['慢',2500],['中',1500],['快',700]].map(([t,ms])=>`<button class="link${TV.speed===ms?' on':''}" data-ms="${ms}">${t}</button>`).join('')}
      <button class="link" id="tvRe" title="同样的四手牌再打一次">${TV.sure?'放弃当前这局，确定重打？':'重打这一局'}</button>
      <button class="btn primary" id="tvClose">回到牌局</button></div>
    ${cm}
    <div class="tvb"><div class="tvt">${[2,3,1,0].map(seat).join('')}${mid}</div>
      <div class="tvl"><ol class="tlist">${recListHTML(rec,k)}</ol></div></div>`;
  const on=v.querySelector('.tlist li.on');if(on)on.scrollIntoView({block:'nearest'});
}
// 重打这一局: the same four hands (as play began, after the tribute), the same level and the same first player; you sort
// and play again, the computer plays with the rules it has now
function testReplay(rec){
  tvClose();hideOverlay();
  if(G.paused)setPaused(false);
  G.tok++;G.round++;G.shown=null;
  const byId=new Map(makeDeck().map(c=>[c.id,c]));
  G.levels=rec.levels?rec.levels.slice():G.levels.slice();G.levels[rec.lvlTeam]=rec.L;
  G.lvlTeam=rec.lvlTeam;G.L=rec.L;
  G.hands=rec.hands.map(h=>sortHand(h.map(c=>byId.get(c.id)),G.L));
  G.deck=[];G.trick=null;G.passes=0;G.last=[null,null,null,null];G.out=[];G.fresh=[];G.result=null;
  G.turn=-1;G.notice='';G.trib=[];G.kang=null;G.returns=[];G.gives=[];G.afterTrib=false;G.clock=null;G.stepWait=null;G.busy=false;G.reveal=0;
  G.trickPlays=[];G.heapN=0;G.seen=[];G.log=[];G.pw=[];G.rest=[];G.myOrder=[];G.fixed=[];G.ready=[];G.nextReady=[];
  G.tgRound=null;G.ua=null;NET.pending=false;sel=new Set();
  removeDeck();pileRebuild();
  G.replay={of:rec.replayOf||rec.no,trib:rec.trib,kang:rec.kang};
  startPrep(rec.leader);
}

