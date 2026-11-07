// a card's corner index (rank over suit) takes about half its height, so rows of cards step down by a little more
// than that; a phone's cut-down cards are almost all index, so its rows hardly overlap
let ROW_STEP=.58,CR=1.4;
// a phone is told by its screen (the device itself, which an on-screen keyboard never shrinks, unlike the window):
// a touch screen whose short side is at most 500. A window narrowed to 560 or less on any device is laid out the
// same way. (Telling it by the window's height took an iPad for a phone on its side the moment its keyboard came up)
const PHONE_MQ=matchMedia('(max-width:560px)'),COARSE_MQ=matchMedia('(pointer: coarse)');
const phoneDevice=()=>COARSE_MQ.matches&&Math.min(screen.width,screen.height)<=500;
// which way the device is held: from the screen where the browser says, else from the window
const heldSideways=()=>screen.orientation&&screen.orientation.type?screen.orientation.type.startsWith('landscape')
  :typeof window.orientation==='number'?Math.abs(window.orientation)===90:innerWidth>innerHeight;
const isPhone=()=>!TEST&&(PHONE_MQ.matches||phoneDevice());
// each turn clock stands beside its plate, never inside it (so the plate keeps its size): after the plate, or before
// it for the right-hand player, whose plate is on the right of its row
for(const q of [1,2,3]){const w=$('#seat'+q+' .who'),c=w.querySelector('.clock');if(q===1)w.before(c);else w.after(c)}
$('#mebar .meinfo').after($('#myClock'));
// the side plates stand at the same height, halfway between the top plate and your own (the middle of the screen); see the CSS
function symPlates(){
  if(TEST||isPhone()||!G)return;
  const t=$('#seat2 .who'),m=$('#mebar .meinfo'),w=$('#seat3 .who'),seat=$('#seat3'),tab=$('#table');
  if(!t||!m||!w||!t.offsetHeight||!m.offsetHeight||!w.offsetHeight)return;
  const tr=t.getBoundingClientRect(),mr=m.getBoundingClientRect(),wr=w.getBoundingClientRect();
  const want=(tr.top+tr.height/2+mr.top+mr.height/2)/2,c=wr.top+wr.height/2;
  if(Math.abs(want-c)<.5)return;
  const cur=new DOMMatrix(getComputedStyle(seat).transform).m42;
  tab.style.setProperty('--mid-drop',(cur+want-c)+'px');
}
// a phone is played upright only: turned on its side it asks to be turned back
const phoneSideways=()=>!TEST&&phoneDevice()&&heldSideways();
function syncRotateTip(){
  let t=$('#rotateTip');
  if(!t){t=document.createElement('div');t.id='rotateTip';t.innerHTML='<b>📱</b><p>请把手机竖过来玩</p><small>手机上只支持竖屏</small>';document.body.appendChild(t)}
  t.hidden=!phoneSideways();
}
// a phone held upright (html.rows) or on its side (html.side)
const phoneRows=()=>isPhone()&&(phoneDevice()?!heldSideways():innerHeight>innerWidth);
function syncPhone(){
  const on=isPhone(),el=document.documentElement;
  el.classList.toggle('phone',on);el.classList.toggle('rows',phoneRows());el.classList.toggle('side',on&&!phoneRows());
  // 成组 stands beside 同花顺; in the test version it stays at the left end of the hand tools
  const fb=$('#fixBtn');
  if(!TEST&&fb.previousElementSibling!==$('#sfBtn')){$('#sfBtn').after(fb);fb.style.left=fb.style.top=''}
  else if(TEST&&fb.parentNode!==$('.handtools'))$('.handtools').prepend(fb);
  CR=on?.86:1.4;ROW_STEP=on?.92:.58;
}
syncPhone();syncRotateTip();
// turning the phone (or the window changing size) can switch these: the hand and the table are then laid out again
const phoneSwitch=()=>{
  syncRotateTip();
  const was=document.documentElement.className;syncPhone();
  if(document.documentElement.className!==was&&G){renderHand();render();pileRebuild()}
};
addEventListener('resize',phoneSwitch);addEventListener('orientationchange',phoneSwitch);PHONE_MQ.addEventListener('change',phoneSwitch);
