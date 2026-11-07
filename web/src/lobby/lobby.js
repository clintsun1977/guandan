/* ---------- the lobby: a nickname, then play alone or with friends ---------- */
// Solo: pick a seat and the computer takes the other three. Online: one player opens a room and gets a
// four-digit number, friends type it in to join, everyone picks a seat, and the host starts; empty seats
// are played by the computer. Sitting down is also the first click, which lets the browser play sound.
let myNick='',myDir='',lobbyMode='solo';
try{myNick=localStorage.getItem('guandan-nick')||''}catch(_){}
// seats in turn order, each player's next being the one on their right
const DIRS=['S','E','N','W'];
const absOf=(d,hostDir)=>(DIRS.indexOf(d)-DIRS.indexOf(hostDir)+4)%4;
const seatBtns=[...document.querySelectorAll('.seat-btn')];
const lobbyStatus=(t,hot)=>{const e=$('#lobbyStatus');e.textContent=t||'';e.classList.toggle('hot',!!hot)};
// names end up in the page's markup, so characters that could form tags are dropped; a phone allows three characters
// (letters or Chinese characters), so the name fits its small plates, a computer or tablet eight
const nickMax=()=>isPhone()?3:8;
const nickNow=()=>$('#nick').value.replace(/[<>&"']/g,'').trim().slice(0,nickMax());
function syncNickMax(){const n=$('#nick');n.maxLength=nickMax();if(n.value.length>n.maxLength)n.value=n.value.slice(0,n.maxLength)}
syncNickMax();addEventListener('resize',syncNickMax);
// (typing Chinese, the length can only be checked once the characters are in)
$('#nick').addEventListener('compositionend',syncNickMax);
function showStart(){
  resetGame();render();
  $('#nick').value=myNick;syncNickMax();
  setMode('solo');
  $('#lobby').hidden=false;
  if(!myNick)$('#nick').focus();
}
