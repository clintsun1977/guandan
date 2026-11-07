// once the play has begun, who paid whom waits behind a 贡 button under the score: a tap opens it, another closes it
// (the test version keeps it written out in the corner, for going over the round)
const TRIBUI={round:null,open:false};
function syncTribInfo(){
  const ti=$('#tribInfo'),showTi=!!G&&['play','roundEnd','over'].includes(G.phase)&&!G.tribHold;
  if(!showTi||!((G.trib&&G.trib.length)||G.kang)){ti.innerHTML='';TRIBUI.open=false;return}
  if(TRIBUI.round!==G.round){TRIBUI.round=G.round;TRIBUI.open=false}
  ti.innerHTML=`<button class="link tribbtn${TRIBUI.open?' on':''}" title="看进贡还贡">贡</button>`+
    (TRIBUI.open?`<div class="tribpop">${tribHtml('tl')+kangHtml(true)}</div>`:'');
}
$('#tribInfo').addEventListener('click',e=>{
  if(!e.target.closest('.tribbtn,.tribpop'))return;
  e.stopPropagation();TRIBUI.open=!TRIBUI.open;syncTribInfo();
});
// one line per pair: who paid whom with which card, and what came back
const cardTag=c=>`<b class="ct${c.r===17||c.s==='H'||c.s==='D'?' red':''}">${cardText(c)}</b>`;
// 抗贡: just whose big jokers they are (short: the line kept in the corner while the round is played)
function kangHtml(short){
  const k=G.kang;if(!k)return'';
  const who=k.has.length===1?`${NAMES[k.has[0].g]}两张大王`:`${k.has.map(x=>NAMES[x.g]).join('、')}各一张大王`;
  return`<div class="${short?'tl':'trib'}">抗贡：${who}</div>`;
}
// the highest a phone's box may stand: a little under your partner's plate and its tags
const phoneSignTop=()=>{const r=$('#seat2 .whorow').getBoundingClientRect();return r.bottom+8};
// who paid whom (or whose big jokers refused it), in a box in the middle of the table, just under the sorting sign:
// while the tribute is given and the hands are sorted, and for the three seconds before the first play
function syncTribBox(){
  let b=$('#tribBox');
  if(!b){b=document.createElement('div');b.id='tribBox';document.body.appendChild(b)}
  const on=!!G&&(G.phase==='tribute'||G.phase==='prep'||(G.phase==='play'&&G.tribHold))&&((G.trib&&G.trib.length)||!!G.kang);
  b.hidden=!on;
  if(!on)return;
  const html=tribHtml()+kangHtml();
  if(b.dataset.h!==html){b.dataset.h=html;b.innerHTML=html}
  const T=$('#table').getBoundingClientRect(),e=$('.emblem').getBoundingClientRect(),pb=$('#prepBig');
  const signs=pb.hidden?[]:[...pb.children].map(k=>k.getBoundingClientRect()).filter(r=>r.height);
  let y;
  // a phone has the side plates level with the space under the sign, so its box stands between your partner's plate
  // and the sign, as low as it can without reaching the sign (or the middle of the table, once the sign has gone)
  if(isPhone()){
    const top=phoneSignTop(),sign=signs.length?Math.min(...signs.map(r=>r.top)):Infinity;
    y=Math.max(top,Math.min(sign-8,e.top+e.height/2)-b.offsetHeight);
  }
  else y=Math.max(e.top+e.height/2,...signs.map(r=>r.bottom))+12;
  b.style.left=T.left+T.width/2+'px';b.style.top=y+'px';
}
addEventListener('resize',()=>{if(G)syncTribBox()});
function tribHtml(cls='trib'){
  const tr=G.trib||[],back=tr.length&&tr.every(t=>t.rc);
  return tr.map(t=>`<div class="${cls}">${NAMES[t.g]}进贡 ${cardTag(t.tc)} 给${NAMES[t.r]}${back?`，${NAMES[t.r]}还 ${cardTag(t.rc)}`:''}</div>`).join('');
}
