/* ---------- the test version: a solo game for checking how the computer plays ---------- */
// Behind a password in the lobby. Every hand is face up and arranged the computer's way: the computer's are the very
// arrangement it plays from, yours is a suggestion you can change (成组 / 拆开 / 复原), and its 牌力 follows your groups.
// Every play gets a number and goes into the record down the right-hand side; 上一步 (or the ← key) opens a view of the
// table as it stood after any earlier play, where each play can be given a comment, 回放 plays a round through again,
// and 重打这一局 deals the same hands again to see whether the computer now plays it better. The records stay in this
// browser, and save as a text file (which can be brought back in with 导入).
const TEST_PW='985';
const TREC={started:null,rounds:[]};
$('#testBtn').onclick=()=>{const r=$('#testRow');r.hidden=!r.hidden;if(!r.hidden)$('#testPw').focus()};
$('#testPw').addEventListener('keydown',e=>{if(e.key==='Enter')$('#testGo').click()});
// 观战: the lobby's button asks for a room number and, once the host's room answers, shows that room's game in the test version's picture,
// with every hand face up and nothing to press (see hostWatch, enterSpec)
$('#specBtn').onclick=()=>{const r=$('#specRow');r.hidden=!r.hidden;if(!r.hidden)$('#specCode').focus()};
$('#specCode').addEventListener('keydown',e=>{if(e.key==='Enter')$('#specGo').click()});
$('#specGo').onclick=()=>{
  const code=$('#specCode').value.replace(/\D/g,'');
  if(isPhone()){lobbyStatus('观战不支持手机，请用电脑或 iPad');return}
  if(code.length!==4){lobbyStatus('房间号是 4 位数字');return}
  Sound.unlock();
  if(lobbyMode!=='solo')setMode('solo');
  $('#specGo').disabled=true;
  watchRoom(code);
};
$('#testGo').onclick=()=>{
  if($('#testPw').value!==TEST_PW){lobbyStatus('训练密码不对');$('#testPw').select();return}
  if(lobbyMode!=='solo')setMode('solo');
  myNick=nickNow()||'测试';myDir='S';
  Sound.unlock();
  // the right password opens the choice of practice: 配牌, 牌局 (the practice that was here before) or 残局
  $('#lobby').hidden=true;$('#trainMenu').hidden=false;
};
$('#tmPlay').onclick=()=>{ENDG=false;$('#trainMenu').hidden=true;enterTest()};
$('#tmEnd').onclick=()=>{ENDG=true;document.body.classList.add('endg');$('#trainMenu').hidden=true;enterTest()};
$('#tmBack').onclick=()=>{$('#trainMenu').hidden=true;$('#lobby').hidden=false};
function enterTest(spec){
  TEST=true;SPEC=!!spec;document.body.classList.add('test');document.body.classList.toggle('spec',!!spec);syncPhone();
  TREC.started=new Date();TREC.rounds=spec?[]:testLoad();
  if(!spec){NET.mode='solo';NET.off=0;setHumans([0])}
  testNames();
  $('#lobby').hidden=true;
  for(const p of [1,2,3]){
    const e=document.createElement('div');
    e.className='peek';e.id='peek'+p;e.innerHTML='<div class="pw"></div><div class="pbody"><div class="prows"></div></div>';
    e.onclick=ev=>{
      const b=ev.target.closest('button[data-a]');
      if(b){if(b.dataset.a==='reset')testCompReset(p);else if(b.dataset.a==='sf')testCompSF(p);else testCompGroup(p,b.dataset.a==='split');return}
    };
    if(!spec)testPeekDrag(e,p);
    $('#seat'+p).appendChild(e);
  }
  $('#mebar .whorow').insertAdjacentHTML('beforeend','<span class="mypw" id="myPw"></span>');
  $('#fixBtn').insertAdjacentHTML('afterend','<button class="link" id="splitBtn" title="选中的牌拆成单张">拆开</button>');
  $('#splitBtn').onclick=()=>{const have=new Set(G.hands[0].map(c=>c.id));testRegroup([...sel].filter(id=>have.has(id)),true)};
  $('#sortBtn').insertAdjacentHTML('afterend','<button class="link" id="undoBtn" title="撤销刚才这一手，回到它之前（游戏画面不变）" disabled>上一步</button>');
  $('#undoBtn').onclick=testUndo;
  $('#mebar .whorow').appendChild($('#myPlace')); // (the place label stands beside your plate)
  $('#btns').insertAdjacentHTML('beforebegin','<button class="link" id="goBtn" title="走下一步（空格，或点屏幕空白处）" hidden>继续</button>');
  $('#goBtn').onclick=testStepGo;
  $('#fixBtn').title='选中的牌组成一组';$('#sortBtn').title='改回电脑自己的配法';
  const s=document.createElement('aside');
  s.className='tside';s.id='tside';
  s.innerHTML=`<div class="tsh"><b>出牌记录</b><span id="tsRound"></span></div>
    <div class="tsb"><button class="link" id="tsDone" title="这一局和评语都写完了：生成记录，交给 Claude 读">生成记录交给 Claude</button><button class="link" id="tsClose">关闭</button></div>
    <div class="tsb"><button class="link" id="tsPrev" title="看上一手牌打出后桌上的样子（键盘 ←）">上一步</button><button class="link" id="tsReplay">回放</button><button class="link" id="tsSave">保存记录</button><button class="link" id="tsCopy">复制</button><button class="link" id="tsLoad">导入</button><button class="link" id="tsClear">清空</button></div>
    <div class="tshint">点桌上或这里的任意一手牌旁的“评”写评语；点一手牌看当时四家的牌、重打这一局</div>
    <ol class="tlist" id="tsList"></ol>`;
  document.body.appendChild(s);
  const v=document.createElement('div');
  v.className='tview';v.id='tview';v.hidden=true;
  document.body.appendChild(v);
  v.onclick=tvClick;
  v.onchange=e=>{if(e.target.id==='tvRound'){tvPlay(false);TV.ri=+e.target.value;TV.step=0;tvDraw()}};
  v.oninput=e=>{if(e.target.id==='tvNote')tvNote(e.target.value)};
  v.addEventListener('focusin',e=>{if(e.target.id==='tvNote')tvStop()});
  $('#tsPrev').onclick=testBack;
  $('#tsReplay').onclick=()=>{if(TREC.rounds.length)testView(TREC.rounds.length-1,0,true)};
  $('#tsSave').onclick=testSave;
  $('#tsCopy').onclick=testCopy;
  $('#tsLoad').onclick=testImport;
  $('#tsClear').onclick=testClear;
  $('#tsList').onclick=e=>{
    const ed=e.target.closest('.tedit,.tnote,.tchg');
    if(ed){testNoteEdit(+(ed.closest('li').dataset.k||0));return}
    const li=e.target.closest('li.tp');if(li)testView(TREC.rounds.length-1,+li.dataset.k,false);
  };
  $('#tsDone').onclick=testFinish;
  $('#tsClose').onclick=()=>{s.classList.remove('open');$('#tsBtn').classList.remove('on')};
  // a play in the middle of the table: tap it to write its comment
  // once the round is over: back to the table as it stood after that play, every hand as it was, to finish the comments
  $('#table').addEventListener('click',e=>{
    const t=e.target.closest('#tplays .tq[data-k]');if(!t||SPEC)return;
    if(['roundEnd','over'].includes(G.phase)&&TREC.rounds.length)testView(TREC.rounds.length-1,+t.dataset.k,false);
    else testNoteEdit(+t.dataset.k);
  });
  if(!spec)testDbLoad();
  // a 记牌器 button beside each name
  for(let q=0;q<4;q++){
    const at=q?$('#seat'+q+' .name'):$('#myName');
    at.insertAdjacentHTML('afterend',`<button class="tcb" data-p="${q}" title="点一下看他出的每一手，再点看他出过的所有牌，再点看他眼里外面还剩的牌">记牌器</button>`);
  }
  document.addEventListener('click',e=>{const b=e.target.closest('.tcb[data-p]');if(b){e.stopPropagation();testCounterNext(+b.dataset.p)}});
  $('#tsBtn').onclick=()=>{s.classList.toggle('open');$('#tsBtn').classList.toggle('on',s.classList.contains('open'));$('#tsList').dataset.k='';testList()};
  document.body.classList.toggle('fsok',!!(document.fullscreenEnabled||document.webkitFullscreenEnabled));
  $('#fsBtn').onclick=testFull;
  if(ENDG){
    // 残局: the controls: how long a move may take in the first round, going on to the next position by itself, another position now, a batch against the old rules
    $('.acts').insertAdjacentHTML('afterbegin','<select id="endMs" title="摸索第一轮每手想多久，以后每一轮加倍"><option value="50">起步每手 0.05 秒</option><option value="100" selected>起步每手 0.1 秒</option><option value="300">起步每手 0.3 秒</option><option value="1000">起步每手 1 秒</option></select><button class="link tog" id="autoBtn" aria-pressed="true" title="一个局面摸索完了，自己接着摸索下一个局面">自动下一局</button><button class="link" id="nextEndBtn" title="不等这个局面了，换一个新的">换一局</button><button class="link" id="batchBtn" title="后台打一批残局，看这种摸索对老规则的胜负">批量对比</button>');
    $('#endMs').onchange=e=>{ENDMS=+e.target.value};
    $('#autoBtn').onclick=()=>{
      ENDAUTO=!ENDAUTO;$('#autoBtn').setAttribute('aria-pressed',ENDAUTO);
      if(ENDAUTO&&G.phase==='roundEnd'&&!ENDRUN)endgameNext();
    };
    $('#nextEndBtn').onclick=endgameNext;
    $('#batchBtn').onclick=endgameBatchPanel;
    const tb=document.createElement('div');tb.id='etrain';document.body.appendChild(tb);
    tb.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.id==='etView'){testView(TREC.rounds.indexOf(ENDREC),0,true)}
      else if(b.id==='etStop'){ENDTOK++;ENDRUN=false;endgameShow('停下来了。可以“换一局”，或者回放已经打完的局。',true)}
      else if(b.id==='etNext')endgameNext();
    });
  }
  testFull(true);fsMark();
  testSize();
  // the boxes of plays follow the table when it changes size (the hand below it getting shorter, say)
  let t=0;
  if(window.ResizeObserver)new ResizeObserver(()=>{clearTimeout(t);t=setTimeout(testPlays,120)}).observe($('#table'));
  if(!spec)newGame();
}
// full screen: asked for on the way in (the click on 进入 allows it) and toggled by the 全屏 button; where the page may
// not take the screen (the claude.ai viewer, say) it simply stays in the window
const fsOn=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
function testFull(on){
  const d=document.documentElement;
  try{
    if(on!==true&&fsOn())(document.exitFullscreen||document.webkitExitFullscreen).call(document);
    else if(!fsOn()){const r=(d.requestFullscreen||d.webkitRequestFullscreen).call(d);if(r&&r.catch)r.catch(()=>{})}
  }catch(_){}
}
const fsMark=()=>{
  // full screen on a phone also holds the screen upright, where the browser allows it
  if(fsOn()&&isPhone())try{const r=screen.orientation&&screen.orientation.lock&&screen.orientation.lock('portrait');if(r&&r.catch)r.catch(()=>{})}catch(_){}
  $('#fsBtn').textContent=fsOn()?'退出全屏':'回到全屏';document.body.classList.toggle('fs',fsOn());
  $('#fsOptBtn').textContent=fsOn()?'退出全屏':'全屏';$('#fsOptBtn').setAttribute('aria-pressed',fsOn());
};
// 全屏 in 选项: only where the page may take the whole screen (not the claude.ai viewer, not an iPhone)
$('#fsOptBtn').hidden=!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
$('#fsOptBtn').onclick=()=>testFull();
for(const ev of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(ev,fsMark);
// the one card size for every hand: the side hands in five rows are about 5.5 cards wide (each further card shows 0.42 of
// one), with the table about 6 between them; upright, your partner's and your three rows (about 3 cards high each), the
// side hands' five (about 4.7) and the plates, buttons and margins (about 250px)
function testSize(){
  if(!TEST)return;
  const w=(innerWidth-48)/17,h=(innerHeight-250)/11;
  document.body.style.setProperty('--tcw',Math.round(Math.max(28,Math.min(w,h,100)))+'px');
}
// again whenever the window changes size (turning the iPad, going full screen)
let testWH='';
const testResize=()=>{const k=innerWidth+'x'+innerHeight;if(TEST&&k!==testWH){testWH=k;testSize();layoutHand();setTimeout(testPlays,200)}};
addEventListener('resize',testResize);
if(window.ResizeObserver)new ResizeObserver(testResize).observe(document.documentElement);
// everyone by number: you are 1, then counterclockwise, the order of play, 2 (your next), 3 (your partner), 4; each has
// its own colour on the table and in the record
const pcol=p=>p%2?'var(--blue-team)':'var(--red-team)';
// (a spectator's plates also carry the player's own name, behind the number; the plays in the record keep the number alone)
function testNames(){
  for(let p=0;p<4;p++)NAMES[p]=`${p+1}号`;
  const plate=p=>SPEC&&NET.pn&&NET.pn[p]?`${NAMES[p]} ${NET.pn[p]}`:NAMES[p];
  for(let q=1;q<4;q++){const e=$('#seat'+q+' .name');e.textContent=plate(q);e.style.color=pcol(q)}
  $('#myName').textContent=plate(0);$('#myName').style.color=pcol(0);
}
const tierNum=pw=>pw>=AIP.tier1?1:pw>=AIP.tier2?2:pw>=AIP.tier3?3:4;
const powerText=pw=>`牌力 ${pw}（第 ${tierNum(pw)} 档）`;
const playName=e=>e.type==='bomb'?e.n+'张炸弹':TYPE_NAME[e.type];
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
// how a trick ended: its winner leads the next, or went out and the lead passed on
const trickEnd=(w,lead)=>w===lead?`${NAMES[w]}收回出牌权`:`${NAMES[w]}出完，${NAMES[lead]}接风`;
const roundName=r=>`第 ${r.no} 局${r.endgame?'（残局）':''}${r.replayOf?`（重打第 ${r.replayOf} 局）`:''}`;

