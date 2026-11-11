/* ---------- clocks: one ticker drives turn limits, computer thinking and the pre-play countdown ---------- */
const TRIB_MS=30000,RET_MS=60000,HURRY_MS=10000;
// the sorting and playing times are the host's choice in the lobby (RULES.prepSec; RULES.playMode: a room of an older page sends none: 90 s, and 60 s a move).
// Playing: '20+60' is 20 s for each move and, over the whole round, 60 s of overtime for each player to draw on once a move has run past its 20 s;
// when that is used up the next move that runs over is made for the player. '30+60' the same with 30 s, and '60' is 60 s a move with no overtime
const PREP_CHOICES=[30,60,90];
const PLAY_MODES={'20+60':[20,60],'30+60':[30,60],'60':[60,0]};
const prepMs=()=>(PREP_CHOICES.includes(RULES.prepSec)?RULES.prepSec:90)*1000;
const playMode=()=>PLAY_MODES[RULES.playMode]?RULES.playMode:'60';
const playMs=()=>PLAY_MODES[playMode()][0]*1000;
const resMs=()=>PLAY_MODES[playMode()][1]*1000;
// a human player's clock for a move: the move's own time and what is left of their round's overtime (computers keep to the move's time)
const turnClock=(p,extra)=>({who:p,left:playMs(),total:playMs(),res:isHumanSeat(p)?(G.res&&G.res[p]!=null?G.res[p]:resMs()):0,...extra});
// what is left to show: the move's time, then the overtime
const clockShown=c=>c.left>0?c.left:(c.res||0)+c.left;
// a move is over: what it ran past its time comes off the player's overtime
function commitRes(c){
  if(!c||typeof c.who!=='number'||!(c.res>0)||c.left>=0)return;
  if(!G.res)G.res=[null,null,null,null];
  G.res[c.who]=Math.max(0,c.res+c.left);
}
// computer "thinking" time per move; shortened for testing (the full-feel setting was 2000-5000)
const AI_THINK_MIN=500,AI_THINK_MAX=1000;
// how the help page says it
const playText=()=>{const[m,r]=PLAY_MODES[playMode()];return r?`每次出牌 ${m} 秒，每局每人另有最多 ${r} 秒超时时间（一步超过 ${m} 秒后从中扣，用完后再超时就由系统代出）`:`每次出牌 ${m} 秒`};
