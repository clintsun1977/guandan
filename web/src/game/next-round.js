// next round / another match: each player at the table presses the button, and once all have, the host deals
function askNext(){act({k:'next',p:toAbs(0)})}
function startNextIfReady(){
  if(!isHost()||!G||![...NET.humans].every(h=>(G.nextReady||[]).includes(h)))return;
  if(G.phase==='roundEnd')act(roundEvt(false));
  else if(G.phase==='over')newGame();
}
$('#sfxBtn').onclick=()=>{Sound.toggle('sfx');syncAudioBtns()};
if(window.ResizeObserver)new ResizeObserver(()=>{if(G&&miniMode())testPlays()}).observe($('#table'));
$('#confirmBtn').setAttribute('aria-pressed',confirmPlay);
