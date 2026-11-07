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
// (letters or Chinese characters), so the name fits its small plates, a computer or tablet eight.
// The nicknames that get Top 5 (coach.js) are allowed in full on a phone too: while what is typed could still become one of
// them the box takes eight characters, and the name is kept whole only if it is one of them exactly
const TOP5_NAMES=['stezer0','koala'];
const nickClean=v=>v.replace(/[<>&"']/g,'').trim();
const nickTop5Start=v=>{const s=nickClean(v).toLowerCase();return!!s&&TOP5_NAMES.some(n=>n.startsWith(s))};
const nickMax=()=>isPhone()&&!nickTop5Start($('#nick').value)?3:8;
const nickNow=()=>{const v=nickClean($('#nick').value);return v.slice(0,isPhone()&&!TOP5_NAMES.includes(v.toLowerCase())?3:8)};
// (the box itself always takes eight, so a whole name pasted or typed at once is still seen before it is cut down)
function syncNickMax(){const n=$('#nick'),m=nickMax();n.maxLength=8;if(n.value.length>m)n.value=n.value.slice(0,m)}
syncNickMax();addEventListener('resize',syncNickMax);
$('#nick').addEventListener('input',e=>{if(!e.isComposing)syncNickMax()});
// (typing Chinese, the length can only be checked once the characters are in)
$('#nick').addEventListener('compositionend',syncNickMax);
function showStart(){
  resetGame();render();
  $('#nick').value=myNick;syncNickMax();
  setMode('solo');
  $('#lobby').hidden=false;
  if(!myNick)$('#nick').focus();
}
