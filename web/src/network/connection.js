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
