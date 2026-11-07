// the button column hugs the right edge of the cards, centred on the hand's height
function placeButtons(g){
  const b=$('#btns');
  if(!sideBtns())b.style.left=b.style.top='';
  // also after turning a phone from sideways to upright, so the big buttons leave their desktop spot
  placeActionBtns();
}
// one action spot for the buttons pressed again and again: shuffle / cut, "done sorting", tribute / return, the hint
// button while playing, and next round. It is measured up from the bottom of the hand area, so it stays put whether
// or not the hand has been dealt; phones keep their own places
function placeActionBtns(){
  const on=sideBtns(),h=$('#hand').getBoundingClientRect();
  // what a phone's layouts set is undone when the screen is no longer one
  {const b=$('#btns');if(!phoneRows())b.style.bottom='';if(!(on&&isPhone()))b.style.columnGap=''}
  // the test version's side hands fill the table's sides, so the buttons stand in a row beside your hand instead
  if(on&&TEST){
    // (the buttons stand in a column right of the sorting column, level with its first button; 继续 right of them)
    const b=$('#btns'),w=$('.handwrap').getBoundingClientRect(),colEls=['#fixBtn','#splitBtn','#sortBtn','#undoBtn'].map(i=>$(i)).filter(Boolean);
    if(!colEls.length)return;
    // the column's top: from its first button that is showing (the first ones go when your hand is empty), 32px a row
    const vis=colEls.filter(e=>e.offsetHeight&&!e.hidden);
    if(!vis.length)return;
    const vr=vis[0].getBoundingClientRect(),fx={top:vr.top-colEls.indexOf(vis[0])*32},colR=Math.max(...vis.map(e=>e.getBoundingClientRect().right));
    const top=fx.top-w.top+'px',left=colR-w.left+10+'px';
    if(b.style.left!==left)b.style.left=left;
    // 继续 stands right of 过 (the third row of the play column)
    const go=$('#goBtn');
    if(go){go.style.left=colR-w.left+10+60+10+'px';go.style.top=fx.top-w.top+(26+6)*2+'px'}
    if(b.style.top!==top){b.style.top=top;if(pileGroups.length&&!b.hidden)pileRefit()}
    for(const id of ['#deckBtn','#readyBtn','#nextBtn']){
      const e=$(id);if(!e)continue;
      e.classList.add('atcol');
      // (where 继续 stands: its place worked out just above, as a centre in the window)
      const go=$('#goBtn');
      if(go&&go.style.left){e.style.left=w.left+parseFloat(go.style.left)+30+'px';e.style.top=w.top+parseFloat(go.style.top)+13+'px'}
      else{e.style.left=h.right-70+'px';e.style.top=h.bottom-90+'px'}
    }
    return;
  }
  // a phone on its side: the play buttons two by two, their right edge on 复原's and standing just over it
  if(on&&isPhone()){
    const b=$('#btns'),w=$('.handwrap').getBoundingClientRect(),s=$('#sortBtn').getBoundingClientRect();
    b.style.left=s.right-w.left-b.offsetWidth+'px';
    const top=s.top-w.top-6-b.offsetHeight+'px';
    if(b.style.top!==top){b.style.top=top;if(pileGroups.length&&!b.hidden)pileRefit()}
  }else if(on){
    // the column is placed so its tribute / return button, or else its hint button, stands on the spot
    const b=$('#btns'),rb=$('#returnBtn'),anchor=rb.hidden?$('#hintBtn'):rb;
    // in a short window the buttons above the spot could reach the right-hand player's plate: they get smaller
    // (never below 48px) so the column stays clear of it
    const s1=$('#seat1 .whorow').getBoundingClientRect(),cx=h.right-actionInset(h.width),gap=8;
    const above=[...b.children].slice(0,[...b.children].indexOf(anchor)).filter(e=>!e.hidden).length;
    let d=68;
    if(s1.left<cx+d/2&&s1.right>cx-d/2){const room=h.bottom-SPOT_UP-(s1.bottom+gap);d=Math.max(48,Math.min(68,Math.floor((room-above*gap)/(above+.5))))}
    if(b.style.getPropertyValue('--d')!==d+'px')b.style.setProperty('--d',d+'px');
    b.style.left=h.width-actionInset(h.width)-(b.offsetWidth||colW)/2+'px';
    const top=h.height-SPOT_UP-anchor.offsetTop-anchor.offsetHeight/2+'px';
    // the column moved (the hand got shorter): the table's cards make way for it again
    if(b.style.top!==top){b.style.top=top;if(pileGroups.length&&!b.hidden)pileRefit()}
  }else{
    const b=$('#btns');b.style.removeProperty('--d');
    // an upright phone: the row of buttons stands just over the hand tools
    b.style.bottom=phoneRows()?$('.handtools').offsetHeight+6+'px':'';
    if(!phoneRows())b.style.left=b.style.top='';
  }
  for(const id of ['#deckBtn','#readyBtn','#nextBtn']){
    const e=$(id);if(!e)continue;
    e.classList.toggle('atcol',on);
    if(!on){e.style.left=e.style.top='';continue}
    e.style.left=h.right-actionInset(h.width)+'px';
    // while sorting you may also owe a return: 还贡 then takes the spot and 理牌结束 stands just above it
    e.style.top=h.bottom-SPOT_UP-(id==='#readyBtn'&&!$('#returnBtn').hidden&&!$('#btns').hidden?120:0)+'px';
  }
}

