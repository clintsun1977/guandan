// 电脑: the computers at a table play by the Clint rules (bot/clint) or by one of the networks in bot/models.json, chosen in the lobby
// by whoever plays alone or opens the room (only the host's computers move, so only the host's page runs a network). A network's
// move is worked out while the computer "thinks"; if it is not ready by then the computer waits a little longer, and if the
// network cannot be loaded the Clint rules play instead, which the table is told once. Tribute and the return card always follow
// the Clint rules
const BOT_WAIT_MS=30000;
const botId=()=>RULES.bot&&RULES.bot!=='clint'&&NeuralBot.has(RULES.bot)?RULES.bot:'';
const botLabel=()=>{const m=NeuralBot.models.find(x=>x.id===(RULES.bot||'clint'));return m?m.label:'Clint 规则机器人'};
let botFailed='';
const BOT_USED=[]; // which computer actually made each seat's last move (for the round records)
function botPreload(){const id=botId();if(id&&isHost()&&botFailed!==id)NeuralBot.preload(id).catch(e=>console.warn('电脑模型没能加载',e))}
function botStart(p){
  const id=botId();
  if(!id||botFailed===id){G.nn=null;return}
  const nn={key:G.tok+':'+G.log.length+':'+p,id,at:performance.now(),done:false,pl:null,err:null};
  G.nn=nn;
  // the network gets a copy of the table as it stands; it reads only seat p's own hand from it, the rest is public
  const g={hands:G.hands.map(h=>h.slice()),trick:G.trick?{player:G.trick.player,play:G.trick.play}:null,passes:G.passes||0,
    log:G.log.slice(),levels:G.levels.slice(),L:G.L};
  NeuralBot.decide(id,g,p,NET.off).then(pl=>{nn.pl=pl;nn.done=true},e=>{nn.err=e;nn.done=true;console.warn('电脑模型出错',e)});
}
// the computer's move now; undefined while its network is still working on it
function aiMove(p){
  const nn=G.nn;
  BOT_USED[p]='clint';
  if(!nn||nn.key!==G.tok+':'+G.log.length+':'+p)return aiDecide(p);
  if(!nn.done){
    if(performance.now()-nn.at<BOT_WAIT_MS)return undefined;
    nn.err=Error('timeout');
  }
  G.nn=null;
  if(nn.err){botFail(nn.id);return aiDecide(p)}
  if(!nn.pl){if(!G.trick)return aiDecide(p);BOT_USED[p]=nn.id;return null}
  const cards=nn.pl.cards.map(c=>G.hands[p].find(x=>x.id===c.id));
  if(cards.some(c=>!c)||!beats(nn.pl,G.trick&&G.trick.play))return aiDecide(p);
  BOT_USED[p]=nn.id;
  return{...nn.pl,cards};
}
function botFail(id){
  if(botFailed===id)return;
  botFailed=id;
  setMsg(`${botLabel()} 没能加载，电脑改用 Clint 规则出牌`,true);
}
