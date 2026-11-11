/* ---------- connections (PeerJS: browsers talk to each other directly, matched by the room number) ---------- */
const ROOM_PREFIX='guandan-room-';
// the page's version (stamped by build.py when the public page is built). A browser can keep an older copy of
// the page for a while, and players on different versions can fall out of step, so a room compares them.
const VERSION='dev';
// the page's content hash for the round records (stamped by build.py: c1977 and five hex digits)
const APP_HASH='dev';
$('#verTag').textContent=VERSION==='dev'?'':'版本 '+VERSION;
const OLD_PAGE='页面版本和房主不同，请刷新页面（电脑按 Ctrl+F5）后重新加入';
// the claude.ai viewer (window.claude) does not allow direct connections between browsers
const peerReady=()=>{if(window.Peer&&!window.claude)return true;lobbyStatus('联机需要在 clintsun1977.github.io/guandan 打开');return false};
// A page can be found by others only while its line to the PeerJS matching server is up. An iPad or phone that locks or
// switches apps, or a tab left in the background, can lose that line: a room then still shows its number and the friends
// already in it play on, but nobody new can reach it (「没有这个房间」), nor come back after dropping out. So the line is
// put back whenever it drops (waiting longer each time it fails), and at once when the page comes to the front again;
// the room keeps its number.
function keepSignal(peer){
  let tries=0,timer=0;
  peer.on('open',()=>{tries=0});
  peer.on('disconnected',()=>{clearTimeout(timer);timer=setTimeout(()=>signalBack(peer),Math.min(30000,1000*2**tries++))});
}
function signalBack(peer){
  if(!peer||peer!==NET.peer||peer.destroyed||!peer.disconnected)return;
  try{peer.reconnect()}catch(_){}
}
