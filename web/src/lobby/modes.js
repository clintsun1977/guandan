function setMode(m){
  leaveNet();
  loadRules();
  lobbyMode=m;myDir='';NET.lastCode=null;NET.rejoinDir=null;NET.clintTries=0;
  NET.lobby={S:null,E:null,N:null,W:null};
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));
  $('#joinRow').hidden=m!=='join';
  $('#roomCode').classList.toggle('call',m==='join');$('#joinBtn').disabled=false;
  $('#roomInfo').hidden=true;
  lobbyStatus('');
  if(m==='host')openRoom();
  if(m==='join')$('#roomCode').focus();
  renderLobby();
}
function renderLobby(){
  const nick=nickNow(),solo=lobbyMode==='solo';
  for(const b of seatBtns){
    const d=b.dataset.seat,me=d===myDir,who=NET.lobby[d],taken=!solo&&!!who&&!me&&!(NET.resumeMode&&who===nick);
    b.classList.toggle('mine',me);
    b.classList.toggle('bot',solo&&!!myDir&&!me);
    b.classList.toggle('taken',taken);
    b.disabled=taken||(lobbyMode==='join'&&!(NET.hostConn&&NET.hostConn.open))||(lobbyMode==='host'&&!NET.peerOpen);
    b.querySelector('span').textContent=me?(nick||'你'):taken?who:solo&&myDir?'电脑':'空位';
  }
  renderRules();
  const go=$('#sitBtn');
  go.hidden=lobbyMode==='join';
  go.textContent=lobbyMode==='host'?'开始':'坐下开始';
  go.disabled=!nick||!myDir||(lobbyMode==='host'&&!NET.peerOpen);
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
  if(!myNick||!myDir)return;
  phoneFull();
  try{localStorage.setItem('guandan-nick',myNick)}catch(_){}
  Sound.unlock();
  if(lobbyMode==='host'){if(isClint()!==(NET.code==='8888')){lobbyStatus('房间号正在更换，请稍等');return}startOnline()}
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
if(myNick)$('#myName').textContent=myNick;

