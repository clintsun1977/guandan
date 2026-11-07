// a player's card counter, in a window of its own that can be moved and closed; each press of the 记牌器 button beside
// their name shows the next view: the plays they have made (kind by kind, in order), every card they have played (by
// rank), and the cards still out as they see it (not played, not in their hand), by rank
const TCV=['出过的每一手','出过的所有牌','他看到的外面剩余'];
const TC={};
const rankLabel=(k,L)=>k===17?'大王':k===16?'小王':k===15?`级牌${rankName(L)}`:rankName(k);
function testCounterNext(p){
  let w=$('#tc'+p);
  if(!w){
    w=document.createElement('div');w.id='tc'+p;w.className='tcount';w.hidden=true;
    w.style.left=16+p*36+'px';w.style.top=90+p*36+'px';
    document.body.appendChild(w);testDragBox(w,'guandan-tc'+p);
    w.addEventListener('click',e=>{
      if(e.target.closest('.tcClose')){w.hidden=true;document.querySelector(`.tcb[data-p="${p}"]`).classList.remove('on');return}
      const t=e.target.closest('.tcv [data-v]');if(t){TC[p]=+t.dataset.v;w.dataset.k='';testCounter()}
    });
  }
  TC[p]=w.hidden?0:((TC[p]||0)+1)%3;
  w.hidden=false;document.querySelector(`.tcb[data-p="${p}"]`).classList.add('on');
  w.dataset.k='';testCounter();
}
// cards in rank groups, largest first: each rank's label, its cards, how many
function rankRows(cards,L){
  const by={};
  for(const c of cards)(by[tallyKey(c,L)]||(by[tallyKey(c,L)]=[])).push(c);
  return TALLY_RANKS(L).filter(k=>by[k]).map(k=>`<div class="tcr"><b>${rankLabel(k,L)}</b><div><span class="mcs">${
    sortHand(by[k].slice(),L).map(miniCard).join('')}</span><span class="cn">${by[k].length} 张</span></div></div>`).join('');
}
const KIND_ORDER=['single','pair','triple','full','straight','pairs3','trip2','bomb','sflush','jokers'];
function testCounter(){
  if(!TEST||!G)return;
  const L=G.L;
  for(let p=0;p<4;p++){
    const w=$('#tc'+p);if(!w||w.hidden)continue;
    const v=TC[p]||0,key=[G.round,L,G.log.length,v,G.hands[p].length].join('|');
    if(w.dataset.k===key)continue;
    w.dataset.k=key;
    const mine=G.log.map((e,i)=>({e,k:i+1})).filter(x=>x.e.p===p),plays=mine.filter(x=>x.e.cards);
    let body='';
    if(v===0){
      const kinds=KIND_ORDER.filter(t=>plays.some(x=>x.e.type===t));
      body=kinds.map(t=>`<div class="tcr"><b>${t==='bomb'?'炸弹':TYPE_NAME[t]}</b><div>${plays.filter(x=>x.e.type===t).map(x=>
        `<span class="tcp"><i>第 ${x.k} 手${x.e.lead?' 领出':''}</i><span class="mcs">${displayOrder(x.e,L).map(miniCard).join('')}</span></span>`).join('')}</div></div>`).join('')||'<div class="tcsum">还没出过牌</div>';
      body+=`<div class="tcsum">出了 ${plays.length} 手，过了 ${mine.length-plays.length} 次，剩 ${G.hands[p].length} 张</div>`;
    }else if(v===1){
      const cs=plays.flatMap(x=>x.e.cards);
      body=(rankRows(cs,L)||'<div class="tcsum">还没出过牌</div>')+`<div class="tcsum">一共出了 ${cs.length} 张</div>`;
    }else{
      const gone=new Set(G.log.filter(e=>e.cards).flatMap(e=>e.cards.map(c=>c.id)).concat(G.hands[p].map(c=>c.id)));
      const out=makeDeck().filter(c=>!gone.has(c.id));
      body=rankRows(out,L)+`<div class="tcsum">外面一共 ${out.length} 张（另外三家手里合起来）</div>`;
    }
    w.innerHTML=`<h3 class="tnh"><span style="color:${pcol(p)}">${NAMES[p]} 记牌器</span><button class="tcClose">关闭</button></h3>
      <div class="tcv">${TCV.map((t,i)=>`<span data-v="${i}"${i===v?' class="on"':''}>${t}</span>`).join('')}</div>${body}`;
  }
}
// the three computer hands, face up beside their plates; arranged once the cards are all dealt
function testPeeks(){
  if(!TEST||!G)return;
  const grouped=!['start','shuffle','cut','deal'].includes(G.phase),rec=curRec(),live=rec&&rec.live&&rec.g===G.round;
  // while sorting, a computer's cards can be picked and grouped (成组 / 拆开), or put back as it had them (复原)
  const edit=G.phase==='prep'&&!SPEC;
  let moved=false;
  for(const p of [1,2,3]){
    const el=$('#peek'+p);if(!el)continue;
    const h=G.hands[p],ua=uaOf(p),picked=TSEL.p===p?TSEL.ids:new Set();
    const key=[G.round,G.L,grouped,edit,h.map(c=>c.id).join(),JSON.stringify(ua),[...picked].join(),TSFI&&TSFI.p===p?TSFI.text:''].join('|');
    if(el.dataset.k===key)continue;
    el.dataset.k=key;moved=true;
    // the 牌力 line, in parts: the computer's own, and (when you changed its sorting) after your change
    let pw=[];
    if(live)pw=[powerText(rec.power[p])].concat(rec.userPower[p]!=null?[`你改后 ${powerText(rec.userPower[p])}`]:[]);
    else if(grouped&&h.length)pw=[powerText(rawPower(h,G.L))].concat(ua?[`你改后 ${powerText(handPower(h,G.L))}`]:[]);
    // the sorting buttons: a column beside the rows (never on a card), level with the first row for your partner, a
    // little lower for the sides
    const nsf=edit&&h.length?(straightFlushes(h).length?0:1):0;
    const btns=edit&&h.length?`<span class="tgrp${p===2?'':' low'}"><button class="tgbtn" data-a="sf"${nsf?' disabled':''} title="依次选出这手牌里能组成的同花顺（包括用百搭），再点成组">${nsf?'无同花顺':'同花顺'}</button><button class="tgbtn" data-a="grp"${picked.size>=2?'':' disabled'} title="选中的牌组成一组">成组</button><button class="tgbtn" data-a="split"${picked.size?'':' disabled'} title="选中的牌拆成单张">拆开</button><button class="tgbtn" data-a="reset"${ua?'':' disabled'} title="改回电脑自己的配法">复原</button></span>`:'';
    el.classList.toggle('edit',edit);
    // the 牌力 lines are for the sorting: once it is done they are put away
    if(G.phase!=='prep')pw=[];
    // (what 同花顺 found follows, while the cards it picked are still the ones picked)
    if(TSFI&&TSFI.p===p&&TSFI.k===[...picked].join())pw=pw.concat([{sfi:TSFI.text}]);
    // your partner's go beside its name (so the table's middle is clear), the sides' stand under their cards
    const pwEl=el.querySelector('.pw');
    pwEl.textContent='';
    let host=pwEl;
    if(p===2){
      host=$('#pwn2');
      if(!host){host=document.createElement('span');host.id='pwn2';host.className='pwn';$('#seat2 .whorow').appendChild(host)}
      host.textContent='';
    }
    for(const x of pw){
      const d=document.createElement(p===2?'span':'div');
      if(x.sfi)d.className='sfi';
      d.textContent=x.sfi||x;
      host.appendChild(d);
    }
    const units=ua?seatGroups(p).map(gr=>({cards:gr.map(id=>h.find(c=>c.id===id)),name:''})):handUnits(h,G.L,grouped);
    el.querySelector('.prows').innerHTML=h.length?rowsHTML(units,G.L,picked,p!==2?rowsMax6(units):(h.length<=14&&$('#table').clientWidth*.52>=units.reduce((t,u)=>t+(1.22+.42*(u.cards.length-1)),0)*tcwNow()?1:2)):'';
    const old=el.querySelector('.tgrp');if(old)old.remove();
    if(btns)el.querySelector('.pbody').insertAdjacentHTML('beforeend',btns);
  }
  // the top row keeps the height it has when the play begins (the 3号 hand shrinking to one row must not lift the side plates)
  const s2=$('#seat2');
  if(['play','roundEnd','over'].includes(G.phase)){
    const k=G.round+'|'+innerWidth+'x'+innerHeight;
    if(!TLOCK||TLOCK.k!==k){s2.style.minHeight='';TLOCK={k,h:s2.offsetHeight}}
    s2.style.minHeight=TLOCK.h+'px';
  }else if(TLOCK){s2.style.minHeight='';TLOCK=null}
  if(moved&&pileGroups.length)pileRefit();
}
