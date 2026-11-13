/* ---------- game state ---------- */
let G=null;
let sel=new Set();
// the test version (entered from the lobby with a password): every hand face up, every play numbered; TV is its look-back view
let TEST=false;
// 观战 (a spectator's page): the test version's picture, fed by the host, nothing to press
let SPEC=false;
const TV={open:false};
// Who sits where. Seat 0 is always you: every player's view is turned so they sit at the bottom.
// Online, the host decides everything (deals, computer moves, timeouts) and sends each step as an event;
// events name seats in the host's numbering, and NET.off turns those into your own.
const NET={mode:'solo',off:0,humans:new Set([0]),inbox:[],pending:false,conns:new Map(),specs:new Map(),lobby:{S:null,E:null,N:null,W:null},mics:{}};
const isHost=()=>NET.mode!=='guest';
// table rules, chosen in the lobby (online, by the host): tribute on or off, and what happens after three failed tries at A
const RULES={trib:true,aFail:'draw',bot:'clint',coach:false,prepSec:90,playMode:'60',seatMode:'pick',lvSN:2,lvEW:2,playSide:'',order:[],aSN:0,aEW:0};
const isHumanSeat=p=>NET.humans.has(p);
const toAbs=p=>(p+NET.off)%4,toLocal=a=>(a-NET.off+4)%4;
let hints=[],hintIdx=0;
let msgTimer=0;

