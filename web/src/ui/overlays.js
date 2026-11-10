/* ---------- overlays ---------- */
// dock: the round result sits low and see-through around the edges, so the last cards on the table stay in view
function showPanel(html,dock){$('#panel').innerHTML=html;$('#panel').dataset.kind='';$('#overlay').classList.toggle('dock',!!dock);$('#overlay').hidden=false}
function hideOverlay(){$('#overlay').hidden=true}
function showResult(){
  const r=G.result;
  const ours=r.team===0;
  const upText=['','单下，升 1 级','对手二人分列二、三游，升 2 级','双下对手，升 3 级'][r.up];
  const side=t=>t===0?'我方':'对方',next=rankName(G.levels[G.lvlTeam]);
  let head,body;
  if(r.draw&&r.lastTry){
    head='冲 A 没有成功，本场平局';
    body=`<p>${side(r.aOut)}三次打 A 都没打过，${side(r.aTeam)}轮到打 A 只有一次机会，也没打过。</p><p class="muted">共打了 ${G.round} 局。</p>`;
  }else if(r.draw){
    head='三次打 A 未过，本场平局';
    body=`<p>${side(r.aTeam)}打 A 三次都没有打过。</p><p class="muted">共打了 ${G.round} 局。</p>`;
  }else if(r.win){
    head=ours?'我方打过 A，赢下整场':'对方打过 A，本场告负';
    body=`<p class="muted">共打了 ${G.round} 局。</p>`;
  }else if(r.reset&&r.aTeam===r.team){
    head=`${side(r.team)}三次没打过 A`;
    body=`<p>按规则从 2 重新打。下一局打 <b>${next}</b>，${dblText(r)}</p>`;
  }else{
    head=ours?`我方升级：${rankName(r.before)} → ${rankName(r.after)}`:`对方升级：${rankName(r.before)} → ${rankName(r.after)}`;
    body=`<p>${upText}。下一局打 <b>${next}</b>，${dblText(r)}</p>`;
    if(r.before===14&&r.after===14)body=`<p>${side(r.team)}在 A 级，但队友是末游，没能打过 A。下一局继续打 A，${dblText(r)}</p>`;
    if(r.spent)body+=`<p>${side(r.aTeam)}三次打 A 都没打过。${side(1-r.aTeam)}轮到打 A 时只有一次机会：打过 A 赢下整场，没打过算双方平局。</p>`;
    else if(r.reset)body+=`<p>${side(r.aTeam)}三次没打过 A，从 2 重新打。</p>`;
    else if(r.aTry)body+=`<p>${side(r.aTeam)}打 A 第 ${r.aTry} 次没过，还剩 ${3-r.aTry} 次机会。</p>`;
  }
  showPanel(`<h2>${head}</h2>${body}
    ${waitHtml()}
    ${TEST?'<p class="muted">点桌上的任意一手牌，回到当时所有人的牌，可以接着写评语；写完了点“生成记录交给 Claude”。</p>':''}
    <div class="btns">${TEST?'<button class="btn" id="replayBtn">回放</button><button class="btn" id="doneBtn">生成记录交给 Claude</button>':''}${nextBtnHtml()}</div>`,true);
  $('#panel').dataset.kind='result';
  if(TEST){$('#replayBtn').onclick=()=>testView(TREC.rounds.length-1,0,true);$('#doneBtn').onclick=testFinish}
  const nb=$('#nextBtn');if(nb){nb.onclick=askNext;placeActionBtns();if(!nb.disabled)nb.focus()}
}
// with friends at the table: who has pressed the button and who everyone is waiting for
const nextDone=p=>(G.nextReady||[]).includes(p);
function waitHtml(){
  if(NET.humans.size<2)return'';
  const done=[...NET.humans].filter(nextDone),wait=[...NET.humans].filter(h=>!nextDone(h));
  return`<p class="wait">${done.length?`已按：${done.map(h=>NAMES[h]).join('、')}<br>`:''}${wait.length?`等待 ${wait.map(h=>NAMES[h]).join('、')} 按“${G.phase==='over'?'再来一场':'下一局'}”`:''}</p>`;
}
function nextBtnHtml(){
  const label=G.phase==='over'?'再来<br>一场':'下一局';
  return nextDone(0)?`<button class="btn primary round" id="nextBtn" disabled>等待<br>他人</button>`:`<button class="btn primary round" id="nextBtn">${label}</button>`;
}
function dblText(r){
  const o=r.order;
  if(!RULES.trib)return`本场不进贡，由${NAMES[o[0]]}先出。`;
  return o[1]%2===o[0]%2?`${NAMES[o[2]]}和${NAMES[o[3]]}双下，两人都要进贡。`:`末游${NAMES[o[3]]}要向头游进贡。`;
}
// 规则: see ui/rules.js
// leaving the table, after a confirmation; the others are told and can carry on with the computer in that seat
// pausing: the turn clocks, the computer players' thinking and the sorting minute all stop until the player who
// paused resumes (G.pausedBy, a local seat); the others can only wait or leave the game
function setPaused(on,by){
  G.paused=on;G.pausedBy=on?by:null;
  syncPauseBtn();
  if(on){
    const mine=by===0,host=NET.mode==='host';
    // the microphone stays in reach while the game is paused (the header's buttons are under this panel); the room's host can also
    // end somebody else's pause
    const mic=VC.info().active?'<button class="btn" id="pauseMic"></button>':'';
    showPanel(`<h2>暂停中</h2><p class="muted">${mine?'你暂停了游戏，大家休息一下。':host?`${NAMES[by]}暂停了游戏。你是房主，可以取消暂停；也可以等一等，或者退出游戏。`:`${NAMES[by]}暂停了游戏，只有暂停的人（或房主）能继续。你可以等一等，也可以退出游戏。`}</p>
      <div class="btns">${mic}${mine?'<button class="btn primary" id="resumeBtn">继续游戏</button>':`${host?'<button class="btn primary" id="pauseCancel">取消暂停</button>':''}<button class="btn" id="pauseQuit">退出游戏</button>`}</div>`);
    $('#panel').dataset.kind='pause';
    syncPauseMic();
    if(mic)$('#pauseMic').onclick=()=>VC.toggle();
    if(mine){$('#resumeBtn').onclick=()=>act({k:'pause',on:false,p:toAbs(0)});$('#resumeBtn').focus()}
    else{
      $('#pauseQuit').onclick=askQuit;
      if(host)$('#pauseCancel').onclick=()=>act({k:'pause',on:false,p:toAbs(0),force:1});
    }
  }else if(!$('#overlay').hidden&&$('#panel').dataset.kind==='pause'){
    hideOverlay();
    if(G.phase==='roundEnd'||G.phase==='over')showResult();
  }
}
// the microphone button on the pause panel says what the microphone is doing
function syncPauseMic(){
  const b=$('#pauseMic');if(!b)return;
  const i=VC.info();
  b.textContent=i.locked?'语音已关':i.on?'麦克风：开':'麦克风：关';
  b.disabled=!!i.locked;
  b.classList.toggle('primary',!!i.on&&!i.locked);
}
// 暂停 / 继续: while someone else has paused, the button only says so and cannot be pressed
function syncPauseBtn(){
  const b=$('#pauseBtn'),other=!!G&&!!G.paused&&G.pausedBy!==0;
  b.textContent=G&&G.paused?other?'暂停中':'继续':'暂停';
  b.classList.toggle('on',!!G&&!!G.paused);b.disabled=other;
}
function askQuit(){
  if(SPEC){try{NET.hostConn&&NET.hostConn.open&&NET.hostConn.send({t:'bye'})}catch(_){}setTimeout(()=>location.reload(),300);return}
  const why=NET.mode==='host'?'你是房主，退出后其他玩家可以选择和电脑继续打。':NET.mode==='guest'?'你的座位会交给电脑接着打。':TEST?'出牌记录不会保存，要留着请先点“保存记录”。':'这一场的级数和牌都不会保存。';
  showPanel(`<h2>退出游戏？</h2><p class="muted">${why}</p>
  <div class="btns"><button class="btn" id="stayBtn">${G&&G.paused?'返回':'继续打'}</button>${TEST?'<button class="btn" id="quitSave">保存记录</button>':''}<button class="btn primary" id="quitYes">退出</button></div>`);
  if(TEST)$('#quitSave').onclick=testSave;
  $('#stayBtn').onclick=()=>{hideOverlay();if(G.paused)setPaused(true,G.pausedBy);else if(G.phase==='roundEnd'||G.phase==='over')showResult()};
  $('#quitYes').onclick=quitGame;
  $('#stayBtn').focus();
}
function quitGame(){
  try{
    if(NET.mode==='host')broadcast({t:'bye'});
    if(NET.mode==='guest'&&NET.hostConn&&NET.hostConn.open)NET.hostConn.send({t:'bye'});
  }catch(_){}
  // a moment for the goodbye to go out, then back to the lobby
  setTimeout(()=>location.reload(),NET.mode==='solo'?0:400);
}
// someone else left: the computer has their seat, and everyone still here can play on or leave too
function playerLeft(name,how){
  showPanel(`<h2>${name} ${how==='drop'?'掉线了':'退出了游戏'}</h2><p class="muted">${name}的座位由电脑接着打。</p>
  <div class="btns"><button class="btn primary" id="goOnBtn">继续打</button><button class="btn" id="leaveBtn">退出游戏</button></div>`,true);
  $('#goOnBtn').onclick=()=>{hideOverlay();if(G.phase==='roundEnd'||G.phase==='over')showResult()};
  $('#leaveBtn').onclick=askQuit;
}

