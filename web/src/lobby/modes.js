function setMode(m){
  leaveNet();
  loadRules();
  lobbyMode=m;myDir='';NET.lastCode=null;NET.rejoinDir=null;NET.clintTries=0;
  NET.lobby={S:null,E:null,N:null,W:null};
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));
  $('#joinRow').hidden=m!=='join';$('#joinPad').hidden=m!=='join';
  $('#roomCode').classList.toggle('call',m==='join');$('#joinBtn').disabled=false;
  $('#roomInfo').hidden=true;
  lobbyStatus('');
  if(m==='host')openRoom();
  if(m==='join')$('#roomCode').focus();
  renderLobby();
}
// random seats: the host stands on a free seat too, until the start draws them all
function autoSeatHost(){
  if(lobbyMode!=='host'||RULES.seatMode!=='random'||myDir||!NET.peerOpen)return;
  const d=DIRS.find(x=>!NET.lobby[x]);
  if(d){myDir=d;NET.lobby[d]=nickNow()||'房主';broadcastLobby()}
}
// the draw: everyone in the room, the host too, gets a seat by chance
function randomizeSeats(){
  const ents=[{host:true,name:NET.lobby[myDir]||nickNow()||'房主'}];
  for(const v of NET.conns.values())if(v.dir)ents.push({v,name:NET.lobby[v.dir]||v.name});
  const dirs=DIRS.slice();
  for(let i=dirs.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[dirs[i],dirs[j]]=[dirs[j],dirs[i]]}
  NET.lobby={S:null,E:null,N:null,W:null};
  ents.forEach((e,i)=>{const d=dirs[i];NET.lobby[d]=e.name;if(e.host)myDir=d;else e.v.dir=d});
  broadcastLobby();
}
function renderLobby(){
  autoSeatHost();
  const nick=nickNow(),solo=lobbyMode==='solo',rnd=RULES.seatMode==='random';
  for(const b of seatBtns){
    const d=b.dataset.seat,me=d===myDir,who=NET.lobby[d],taken=!solo&&!!who&&!me&&!(NET.resumeMode&&who===nick);
    b.classList.toggle('mine',me);
    b.classList.toggle('bot',solo&&!!myDir&&!me);
    b.classList.toggle('taken',taken);
    b.disabled=rnd||taken||(lobbyMode==='join'&&!(NET.hostConn&&NET.hostConn.open))||(lobbyMode==='host'&&!NET.peerOpen);
    b.querySelector('span').textContent=me?(nick||'你'):taken?who:solo&&myDir?'电脑':rnd?'随机':'空位';
  }
  renderRules();
  // the number keypad is for typing the room number: gone once the room is joined
  $('#joinPad').hidden=lobbyMode!=='join'||!!(NET.hostConn&&NET.hostConn.open);
  const go=$('#sitBtn');
  go.hidden=lobbyMode==='join';
  go.textContent=lobbyMode==='host'?'开始':'坐下开始';
  go.disabled=!nick||(!myDir&&!(solo&&rnd))||(lobbyMode==='host'&&!NET.peerOpen);
}
document.querySelectorAll('.mode-btn').forEach(b=>b.addEventListener('click',()=>{if(lobbyMode!==b.dataset.mode)setMode(b.dataset.mode)}));
$('#nick').addEventListener('input',()=>{
  // a nickname change while seated online is passed on so the others see it
  if(myDir&&lobbyMode==='host'){NET.lobby[myDir]=nickNow()||'房主';broadcastLobby()}
  if(myDir&&lobbyMode==='join')sendSit(myDir);
  renderLobby();
  // a room is Clint's (8888) or not by the nickname at the time: if the nickname changes across that line while the room is open
  // and the game has not started, the room is opened again under the right number
  if(lobbyMode==='host'){
    clearTimeout(NET.renameT);
    NET.renameT=setTimeout(()=>{
      if(lobbyMode!=='host'||NET.started||!NET.peerOpen||isClint()===(NET.code==='8888'))return;
      const dir=myDir;leaveNet();NET.peerOpen=false;NET.code=null;NET.clintTries=0;
      $('#roomInfo').hidden=true;myDir=dir;
      openRoom();
    },700);
  }
});
$('#nick').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('#sitBtn').disabled&&!$('#sitBtn').hidden)$('#sitBtn').click()});
// a phone goes full screen as its player takes a seat (a tap is needed for that); 选项 has the way back
const phoneFull=()=>{if(isPhone()&&!fsOn())testFull(true)};
seatBtns.forEach(b=>b.addEventListener('click',()=>{
  if(!nickNow()){lobbyStatus('先输入昵称');$('#nick').focus();return}
  phoneFull();
  const d=b.dataset.seat;
  Sound.unlock();Sound.play('select');
  if(lobbyMode==='host'){
    if(NET.lobby[d]&&d!==myDir)return;
    if(myDir)NET.lobby[myDir]=null;
    myDir=d;NET.lobby[d]=nickNow();
    broadcastLobby();
  }else if(lobbyMode==='join'){
    sendSit(d);return;
  }else myDir=d;
  renderLobby();
}));
$('#sitBtn').onclick=()=>{
  myNick=nickNow();
  // alone with random seats: the one seat is drawn too
  if(lobbyMode==='solo'&&RULES.seatMode==='random')myDir=DIRS[Math.random()*4|0];
  if(!myNick||!myDir)return;
  phoneFull();
  try{localStorage.setItem('guandan-nick',myNick)}catch(_){}
  Sound.unlock();
  if(lobbyMode==='host'){if(isClint()!==(NET.code==='8888')){lobbyStatus('房间号正在更换，请稍等');return}if(RULES.seatMode==='random')randomizeSeats();startOnline()}
  else{
    NET.mode='solo';NET.off=0;setHumans([0]);
    $('#myName').textContent=myNick;
    $('#lobby').hidden=true;
    newGame();
  }
};
$('#joinBtn').onclick=()=>{
  const code=$('#roomCode').value.replace(/\D/g,'');
  if(!nickNow()){lobbyStatus('先输入昵称');$('#nick').focus();return}
  if(code.length!==4){lobbyStatus('房间号是 4 位数字');return}
  Sound.unlock();
  // pressed once: the button dims and the box stops calling (both come back if the room cannot be reached)
  $('#joinBtn').disabled=true;$('#roomCode').classList.remove('call');
  NET.lastCode=code;NET.rejoinTries=0;
  joinRoom(code);
};
$('#roomCode').addEventListener('keydown',e=>{if(e.key==='Enter')$('#joinBtn').click()});
// the keypad: the room number is typed on it (the box asks for no keyboard of its own, which on an iPad would cover the box)
$('#joinPad').addEventListener('click',e=>{
  const b=e.target.closest('.pad-btn');if(!b)return;
  const k=b.dataset.k,box=$('#roomCode');
  Sound.unlock();Sound.play('select');
  if(k==='go'){$('#joinBtn').click();return}
  if(k==='del')box.value=box.value.slice(0,-1);
  else if(box.value.length<4)box.value+=k;
  box.dispatchEvent(new Event('input',{bubbles:true}));
});
if(myNick)$('#myName').textContent=myNick;

