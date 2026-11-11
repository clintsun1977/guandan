// the options drop down on a tap of 选项 and fold away on a tap anywhere outside them
// it hangs from the button's right edge; where the button sits near the left of the screen (a phone held upright) it
// hangs from the left edge instead, so it never runs off the screen
// the room's number, for telling a friend who wants to watch (or to join); and, for the host, a button for each spectator's voice
function syncRoomOpt(){
  const code=NET.mode==='host'?NET.code:NET.mode==='guest'?(SPEC?NET.specCode:NET.lastCode):'';
  $('#roomOpt').hidden=!code;$('#roomOptNum').textContent=code||'';
  const box=$('#specVoice'),list=NET.mode==='host'?[...NET.specs.values()].filter(v=>v.ready):[];
  box.hidden=!list.length;
  box.innerHTML=list.map(v=>`<button class="link tog" data-sid="${v.sid}" aria-pressed="${!v.muted}" title="关掉后这位观战的人不能说话（还能听）">观战 ${esc(v.name)}：语音${v.muted?'已关':'开'}</button>`).join('');
}
$('#specVoice').addEventListener('click',e=>{const b=e.target.closest('button[data-sid]');if(b)hostSpecMute(+b.dataset.sid)});
$('#optBtn').onclick=()=>{
  const m=$('#optMenu');m.hidden=!m.hidden;$('#optBtn').setAttribute('aria-expanded',!m.hidden);
  if(m.hidden)return;
  syncRoomOpt();
  m.style.left=m.style.right='';
  if(m.getBoundingClientRect().left<8){m.style.right='auto';m.style.left='0'}
};
document.addEventListener('click',e=>{if(!$('#optMenu').hidden&&!e.target.closest('.optwrap')){$('#optMenu').hidden=true;$('#optBtn').setAttribute('aria-expanded','false')}});
syncAudioBtns();
// browsers only allow audio after the first tap or key press; Safari on an iPad counts only the end of a tap (not
// the touch going down), so every kind of tap event tries, and each later tap tries again until the sound is on
for(const ev of ['pointerdown','pointerup','touchend','click','keydown'])document.addEventListener(ev,()=>{Sound.unlock();VC.wake()},{capture:true,passive:true});
// coming back to the page (after switching apps or unlocking the iPad) wakes the sound up again where allowed
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)return;
  Sound.wake();
  // and its line to the matching server, if it dropped meanwhile, is put back now (connection.js)
  signalBack(NET.peer);
  // a page that was out of sight may not have heard the others' hellos meanwhile: it gives them a fresh 20 seconds
  // rather than taking the silence for their leaving
  if(NET.hostSeen)NET.hostSeen=Date.now();
  for(const v of NET.conns.values())v.seen=Date.now();
});
$('#quitBtn').onclick=askQuit;
$('#micBtn').onclick=()=>VC.toggle();
$('#pauseBtn').onclick=()=>{if(G&&G.phase!=='start'&&!(G.paused&&G.pausedBy!==0))act({k:'pause',on:!G.paused,p:toAbs(0)})};
function clearPicked(){if(sel.size){sel=new Set();hintIdx=0;sfIdx=0;renderHand()}}
$('#table').addEventListener('click',e=>{if(e.target.closest('.who,.btn'))return;clearPicked()});
// so does a tap on the empty space around your name and under the hand (the hand itself is handled on pointerdown,
// since a drag or a sweep of the cards also ends in a click there)
for(const z of ['#mebar','.handwrap'])$(z).addEventListener('click',e=>{if(e.target.closest('#hand,button,input,textarea,.meinfo'))return;clearPicked()});
document.addEventListener('keydown',e=>{
  if(TV.open||TV.edit||!$('#overlay').hidden||!$('#lobby').hidden||e.target.closest('input,textarea,#emotePanel'))return;
  if(SPEC){e.preventDefault();return}
  if(TEST&&e.key==='ArrowLeft'){e.preventDefault();testBack();return}
  // the test version's steps: the space bar lets the game go on to the next turn
  if(TEST&&e.key===' '&&G&&G.stepWait!=null){e.preventDefault();if(document.activeElement)document.activeElement.blur();testStepGo();return}
  if(e.key==='Enter'){e.preventDefault();G.phase==='return'||G.phase==='tribPick'||owesReturn(0)?onReturn():sel.size?onPlay():onHint()}
  else if(e.key===' '){e.preventDefault();onPass()}
  else if(e.key==='h'||e.key==='H')onHint();
});
// the test version's steps: a tap on the empty table lets the game go on too (not on a button, a card, a plate, the hands'
// area or any panel that is open)
document.addEventListener('click',e=>{
  if(!TEST||SPEC||!G||G.stepWait==null||TV.open||TV.edit)return;
  if(e.target.closest('button,a,input,textarea,select,label,.card,.peek,.who,.meinfo,#mebar,.handwrap,#tside,#tview,#overlay,.tnbox,.tcount,.optmenu,.tpb,.tq,#fixZone,#fixTags,#tribInfo'))return;
  testStepGo();
});
