let TLOCK=null,TCOLX=null;
// every player's plays this round, in order, in a framed box on their side of the table (in place of the cards thrown
// on the table, which the test version does not show): the plays of the trick now on the table are lit, the latest most;
// once the round is over, what a player was left holding follows, dashed
const testMidHalf=.17;
const tcwNow=()=>parseFloat(getComputedStyle(document.body).getPropertyValue('--tcw'))||50;
function testPlays(){
  if(!(TEST||miniMode())||!G)return;
  let box=$('#tplays');
  if(!box){box=document.createElement('div');box.id='tplays';$('#table').appendChild(box)}
  // (in 极简出牌区 the box holds only the trick on the table now, and clears the moment the trick is taken in: with nothing
  // to show there is no box, and the tribute notice and the like keep the middle to themselves)
  if(!['play','roundEnd','over'].includes(G.phase)||(!TEST&&!(G.trickPlays||[]).length&&!(G.rest||[]).length)){if(box.innerHTML)box.innerHTML='';box.dataset.k='';return}
  const g=pileGeo();
  // in 极简出牌区 the box keeps one place and size (see miniBoxRect); the test version's follows the table's middle
  const R=TEST?{left:g.left+6,top:g.top+6,w:Math.max(60,g.right-g.left-12),h:Math.max(40,g.near-g.top-12)}:miniBoxRect(g);
  const key=[G.round,G.log.length,(G.trickPlays||[]).length,(G.rest||[]).length,G.out.length,R.left,R.top,R.w,R.h,TEST&&curRec()?curRec().nv:0].map(Math.round).join('|');
  if(box.dataset.k===key)return;
  box.dataset.k=key;
  // the trick on the table now: from its lead on (none once it has been taken in)
  let from=Infinity;
  if((G.trickPlays||[]).length)for(let i=G.log.length-1;i>=0;i--)if(G.log[i].cards&&G.log[i].lead){from=i;break}
  // the latest cards played (a pass after them does not take the frame away)
  let last=-1;
  for(let i=G.log.length-1;i>=0;i--)if(G.log[i].cards){last=i;break}
  const rec=TEST&&curRec()&&curRec().live&&curRec().g===G.round?curRec():null;
  const item=(x,i)=>{
    const k=i+1,sep=x.cards&&x.lead&&i?'<span class="tsep"></span>':'';
    return`${sep}<span class="tq${x.cards?'':' pass'}${i>=from?' cur':''}${i===last?' last':''}${rec&&rec.notes[k]?' noted':''}" data-k="${k}" style="--pc:${pcol(x.p)}"${TEST&&!SPEC?' title="点一下写评语"':''}><b><span>${k}</span><em>${NAMES[x.p]}</em></b>${
      x.cards?`<span class="mcs">${displayOrder(x,G.L).map(miniCard).join('')}</span>`:'<span class="pchip">过</span>'}</span>`;
  };
  const rest=(G.rest||[]).map(r=>`<span class="tq rest" style="--pc:${pcol(r.p)}"><b><span>剩牌</span><em>${NAMES[r.p]}</em></b><span class="mcs">${r.cards.map(miniCard).join('')}</span></span>`).join('');
  // the whole middle of the table, between the four hands
  box.innerHTML=`<div class="tpb" style="left:${R.left}px;top:${R.top}px;width:${R.w}px;height:${R.h}px">${G.log.map((x,i)=>TEST||i>=from?item(x,i):'').join('')}${rest}</div>`;
  // the cards as large as will still fit (in 极简出牌区 never smaller than 24 wide: past that the box scrolls, to the
  // newest play)
  // (the test version's cards keep one size, whatever is in the box; 极简出牌区 goes smaller as the box fills, to a limit)
  const b=box.firstElementChild;
  let start=72;
  if(TEST){
    // one size for good (until the box itself changes size): a full box scrolls, to the newest play
    const k=R.w+'|'+R.h;
    if(!TPW||TPW.k!==k)TPW={k,w:Math.max(26,Math.min(44,Math.round(R.w/11)))};
    b.style.setProperty('--mcw',TPW.w+'px');
    b.scrollTop=b.scrollHeight;
    return;
  }
  let used=start;
  for(let w=start;w>=24;w-=2){
    used=w;
    b.style.setProperty('--mcw',w+'px');
    if(b.scrollHeight<=b.clientHeight+1&&b.scrollWidth<=b.clientWidth+1)break;
  }
  b.scrollTop=b.scrollHeight;
}
let TPW=null;
// 极简出牌区: the box is fixed by the screen, not by what is happening round the table (a clock widening a plate, a message,
// the hand growing or shrinking): the middle 58% of the table's width, from under the partner's plate to the line of
// messages. It is worked out when the first play of a round lands and kept until the window changes (or the layout does)
let miniRect=null;
function miniBoxRect(g){
  const k=[G.round,innerWidth,innerHeight,handView].join('|');
  if(!miniRect||miniRect.k!==k||(G.phase==='play'&&!miniRect.play)){
    const w=Math.round(g.L.width*.58),top=Math.round(g.top)+6;
    miniRect={k,play:G.phase==='play',left:Math.round((g.L.width-w)/2),top,w,h:Math.max(80,Math.round(g.L.height-52-top))};
  }
  return miniRect;
}
// a played card as its rank over its suit, nothing more (wild cards gold, level cards marked, jokers 大王 / 小王)
function miniCard(c){
  if(c.r>=16)return`<span class="mc jk${c.r===17?' red':''}"><i>${c.r===17?'大':'小'}</i><i>王</i></span>`;
  const red=c.s==='H'||c.s==='D',wild=isWild(c,G.L);
  return`<span class="mc${red?' red':''}${wild?' wild':c.r===G.L?' lvl':''}"><i${c.r===10?' class="ten"':''}>${rankName(c.r)}</i><i>${SUIT_CH[c.s]}</i></span>`;
}
// a comment on the k-th play of the round being played (or just finished): written in a small box over the table, kept
// with the record at once; the game waits meanwhile
function testNoteEdit(k){
  const rec=curRec();if(!rec)return;
  const e=k?rec.log[k-1]:null;if(k&&!e)return;
  let b=$('#tnbox');
  if(!b){b=document.createElement('div');b.id='tnbox';b.className='tnbox';document.body.appendChild(b);testNoteMove(b)}
  b.innerHTML=`<h3 class="tnh" title="拖这里可以移动">${k?`第 ${k} 手：${turnHTML(rec,k)}`:'开局（理牌）的评语'}</h3>
    <textarea id="tnText" placeholder="${!k?'比如：这手牌应该这样理，因为…':e.cards?'比如：这里应该出…，因为…':'比如：这里不该过，应该出…，因为…'}">${esc(rec.notes[k]||'')}</textarea>
    <div class="btns">${rec.notes[k]?'<button class="btn" id="tnDel">删掉评语</button>':''}<button class="btn" id="tnNo">取消</button><button class="btn primary" id="tnOk">保存</button></div>`;
  b.hidden=false;TV.edit=true;
  const close=()=>{b.hidden=true;TV.edit=false};
  const put=t=>{if(t)rec.notes[k]=t;else delete rec.notes[k];rec.nv++;testStore();testList();testPlays();close()};
  $('#tnOk').onclick=()=>put($('#tnText').value.trim());
  $('#tnNo').onclick=close;
  if($('#tnDel'))$('#tnDel').onclick=()=>put('');
  $('#tnText').onkeydown=ev=>{if(ev.key==='Escape')close();else if(ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey))$('#tnOk').click()};
  $('#tnText').focus();
}
// the box opens where you last left it, at first in the bottom-right corner beside your hand, clear of the played cards;
// dragging its title bar moves it
function testNoteMove(b){testDragBox(b,'guandan-tnbox2')}
function testDragBox(b,store){
  let at=null;
  try{at=JSON.parse(localStorage.getItem(store)||'null')}catch(_){}
  const place=(x,y)=>{
    x=Math.max(0,Math.min(innerWidth-b.offsetWidth,x));y=Math.max(0,Math.min(innerHeight-b.offsetHeight,y));
    b.style.left=x+'px';b.style.top=y+'px';b.style.right=b.style.bottom='auto';
  };
  if(at)requestAnimationFrame(()=>place(at.x,at.y));
  let d=null;
  b.addEventListener('pointerdown',e=>{
    if(!e.target.closest('.tnh')||e.target.closest('button'))return;
    e.preventDefault();
    const r=b.getBoundingClientRect();d={dx:e.clientX-r.left,dy:e.clientY-r.top};
    try{b.setPointerCapture(e.pointerId)}catch(_){}
  });
  b.addEventListener('pointermove',e=>{if(d)place(e.clientX-d.dx,e.clientY-d.dy)});
  const end=()=>{if(!d)return;d=null;const r=b.getBoundingClientRect();try{localStorage.setItem(store,JSON.stringify({x:r.left,y:r.top}))}catch(_){}};
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
}
// a round's record has a short name, the same for its file and in the page's store: 掼蛋记录-1028-第3局
function recName(r){
  if(!r.name){const d=new Date(),z=x=>String(x).padStart(2,'0');r.name=`掼蛋记录-${z(d.getMonth()+1)}${z(d.getDate())}-第${r.no}局`}
  return r.name;
}
// a name to the clipboard, with a word to say so
function testCopy1(t){
  const ok=()=>testToast(`已复制：${t}`),no=()=>testToast('没能复制，请手动选中');
  try{navigator.clipboard.writeText(t).then(ok,no)}catch(_){no()}
}
function testToast(t){
  let e=$('#ttoast');
  if(!e){e=document.createElement('div');e.id='ttoast';e.className='ttoast';document.body.appendChild(e)}
  e.textContent=t;e.hidden=false;clearTimeout(e._t);e._t=setTimeout(()=>{e.hidden=true},1800);
}
// what was changed in the sorting, seat by seat: the groups of the computer's own arrangement taken apart, the groups
// made instead, and the 牌力 before and after
function testChanges(rec){
  const out=[];
  for(const p of [0,1,2,3]){
    const after=p?rec.userGroups&&rec.userGroups[p]:rec.myGroups,before=rec.rawGroups&&rec.rawGroups[p];
    if(!after||!before)continue;
    const by=new Map(rec.hands[p].map(c=>[c.id,c])),key=g=>g.slice().sort((a,b)=>a-b).join();
    const A=new Set(after.map(key)),B=new Set(before.map(key));
    const gone=before.filter(g=>!A.has(key(g))),made=after.filter(g=>!B.has(key(g)));
    if(!gone.length&&!made.length)continue;
    const desc=g=>{const cs=g.map(id=>by.get(id)).filter(Boolean),u=readGroup(cs,rec.L);return`[${u?playName(u):'散牌'} ${cs.map(c=>cardText(c)+(isWild(c,rec.L)?'*':'')).join(' ')}]`};
    out.push(`${NAMES[p]}${p?'（你改了电脑的理牌）':'（你理的牌和电脑的配法不同）'}：拆掉 ${gone.map(desc).join('、')||'没有'}；新组成 ${made.map(desc).join('、')||'没有'}；牌力 ${p?`${rec.power[p]} → ${rec.userPower[p]}`:`电脑配法 ${rec.power[0]} → 你理的 ${rec.myPower}`}`);
  }
  return out;
}
// the k-th turn in words: who played what, or who passed on what
function turnHTML(rec,k){
  const e=rec.log[k-1];
  if(e.cards)return`${NAMES[e.p]}${e.lead?'领出':'跟'} ${playName(e)} ${displayOrder(e,rec.L).map(cardTag).join('')}`;
  const t=passedOn(rec,k);
  return`${NAMES[e.p]} 过${t?`（桌上是${NAMES[t.p]}的${playName(t)} ${displayOrder(t,rec.L).map(cardTag).join('')}）`:''}`;
}
// the play on the table when the k-th turn passed
function passedOn(rec,k){for(let i=k-2;i>=0;i--)if(rec.log[i].cards)return rec.log[i];return null}
// the record: each play numbered, who played it, leading or following, its comment; the passes and how each trick ended
// in between; a replayed round starts with how it went the first time
function recListHTML(rec,on){
  const out=[];let last=null;
  const note=k=>rec.notes[k]?`<li class="tnote" data-k="${k}">${k?'评语':'开局评语'}：${esc(rec.notes[k])}</li>`:'';
  if(rec.replayOf){const o=TREC.rounds.find(r=>r.no===rec.replayOf);out.push(`<li class="thead">重打第 ${rec.replayOf} 局${o&&o.result?`；原来：${o.result}`:''}</li>`)}
  for(const t of testChanges(rec))out.push(`<li class="tchg" data-k="0">理牌改动：${esc(t)}</li>`);
  out.push(note(0));
  rec.log.forEach((e,i)=>{
    const k=i+1;
    if(!e.cards){out.push(`<li class="tp pass${k===on?' on':''}" data-k="${k}"><span class="no">${k}</span><span class="tw" style="color:${pcol(e.p)}">${NAMES[e.p]}</span><span class="lt">过</span><button class="tedit" title="写评语">评</button></li>`,note(k));return}
    if(e.lead&&last!=null)out.push(`<li class="tend">—— ${trickEnd(last,e.p)}</li>`);
    last=e.p;
    out.push(`<li class="tp${k===on?' on':''}" data-k="${k}"><span class="no">${k}</span><span class="tw" style="color:${pcol(e.p)}">${NAMES[e.p]}</span><span class="lt">${e.lead?'领出':'跟'} ${playName(e)}</span><span class="tc">${displayOrder(e,rec.L).map(cardTag).join('')}</span><button class="tedit" title="写评语">评</button></li>`,note(k));
  });
  if(rec.result)out.push(`<li class="thead">${rec.result}</li>`);
  return out.join('');
}
function testList(){
  const el=$('#tsList');if(!el)return;
  const rec=curRec(),key=rec?rec.uid+'|'+rec.log.length+'|'+rec.result+'|'+rec.nv:'';
  // a new play is kept at once, so a closed page loses nothing
  if(rec&&rec.live&&TREC.kept!==key){if(TREC.kept)testStore();TREC.kept=key}
  // the list itself is built only while it is open
  if(!$('#tside').classList.contains('open')){el.dataset.k='';return}
  if(el.dataset.k===key)return;
  el.dataset.k=key;
  $('#tsRound').textContent=rec?`${recName(rec)} · 打 ${rankName(rec.L)}`:'';
  el.innerHTML=rec?recListHTML(rec,-1):'<li class="tend">开始出牌后，每一手牌都记在这里</li>';
  el.scrollTop=el.scrollHeight;
}
