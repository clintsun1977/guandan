// 电脑: the computers at a table play by the Clint rules (bot/clint) or by one of the networks in bot/models.json, chosen in the lobby
// by whoever plays alone or opens the room (only the host's computers move, so only the host's page runs a network). A network's
// move is worked out while the computer "thinks"; if it is not ready by then the computer waits a little longer, and if the
// network cannot be loaded the Clint rules play instead, which the table is told once. danMCai-reason (reason-bot.js) searches
// first and falls back to the danMCai network, so it needs only that network to be there. Tribute and the return card always
// follow the Clint rules
// a computer's whole move, from the start of its turn (botStart): 60 s, like anyone's (guandanai's 60/50/10 turn rule: at most
// 50 s of search, 10 s kept for 017). Only a network that is still not done by then counts as failing (botFail)
const BOT_WAIT_MS=60000;
const botId=()=>RULES.bot===REASON_ID?(NeuralBot.has(REASON_BASE)?REASON_ID:''):RULES.bot&&RULES.bot!=='clint'&&NeuralBot.has(RULES.bot)?RULES.bot:'';
const botLabel=()=>{const m=NeuralBot.models.find(x=>x.id===(RULES.bot||'clint'));return m?m.label:'Clint 规则机器人'};
let botFailed='';
const BOT_USED=[]; // which computer actually made each seat's last move (for the round records)
function botPreload(){
  const id=botId();
  if(!id||!isHost()||botFailed===id)return;
  NeuralBot.preload(id===REASON_ID?REASON_BASE:id).catch(e=>console.warn('电脑模型没能加载',e));
  if(id===REASON_ID)reasonWarm();
}
function botStart(p){
  const id=botId();
  if(!id||botFailed===id){G.nn=null;brainStart(p);return}
  // at: the start of the turn, on the page clock the search client keeps too (its 50 s are counted from here)
  const nn={key:G.tok+':'+G.log.length+':'+p,id,at:performance.now(),done:false,pl:null,err:null};
  G.nn=nn;
  // the network gets a copy of the table as it stands; it reads only seat p's own hand from it, the rest is public
  const g={hands:G.hands.map(h=>h.slice()),trick:G.trick?{player:G.trick.player,play:G.trick.play}:null,passes:G.passes||0,
    log:G.log.slice(),levels:G.levels.slice(),L:G.L};
  (id===REASON_ID?reasonDecide(p,g,nn.at):NeuralBot.decide(id,g,p,NET.off)).then(pl=>{nn.pl=pl;nn.done=true},e=>{nn.err=e;nn.done=true;console.warn('电脑模型出错',e)});
}
// the playing rules' move; when every hand is down to a few cards the 残局大脑 may put a better play in its place (bot/clint/endgame-brain.js)
const rulesMove=p=>endgameBrain(p,aiDecide(p));
// a computer on the rules, down to the last few cards: the 残局大脑 works while it "thinks" (a little at a time), and its play waits in G.brain
const BRAIN_WAIT_MS=32000; // (a little over the brain's own limit, BRAIN.ms)
function brainStart(p){
  G.brain=null;
  if(!brainOn(p))return;
  const key=G.tok+':'+G.log.length+':'+p,rules=aiDecide(p),b={key,at:performance.now(),done:false,pl:rules,rules};
  G.brain=b;
  endgameBrainAsync(p,rules,()=>G.brain===b,pl=>{b.pl=pl;b.done=true});
}
// the computer's move now; undefined while its network is still working on it
function aiMove(p){
  const nn=G.nn;
  BOT_USED[p]='clint';
  const br=G.brain;
  if(!nn&&br&&br.key===G.tok+':'+G.log.length+':'+p){
    if(!br.done&&performance.now()-br.at<BRAIN_WAIT_MS)return undefined;
    G.brain=null;
    return br.done?br.pl:br.rules;
  }
  if(!nn||nn.key!==G.tok+':'+G.log.length+':'+p)return rulesMove(p);
  if(!nn.done){
    if(performance.now()-nn.at<BOT_WAIT_MS)return undefined;
    nn.err=Error('timeout');
  }
  G.nn=null;
  if(nn.err){botFail(nn.id);return rulesMove(p)}
  if(!nn.pl){if(!G.trick)return rulesMove(p);BOT_USED[p]=nn.id;return null}
  const cards=nn.pl.cards.map(c=>G.hands[p].find(x=>x.id===c.id));
  if(cards.some(c=>!c)||!beats(nn.pl,G.trick&&G.trick.play))return rulesMove(p);
  BOT_USED[p]=nn.id;
  return{...nn.pl,cards};
}
function botFail(id){
  if(botFailed===id)return;
  botFailed=id;
  setMsg(`${botLabel()} 没能加载，电脑改用 Clint 规则出牌`,true);
}
