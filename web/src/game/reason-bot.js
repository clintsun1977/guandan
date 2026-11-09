/* ---------- danMCai-reason: guandanai's danMCai with reasoning search (search bot 9001), for the table and the move coach ---------- */
// Taken from stevensun1005/guandanai, not written for this project, and wired in by its guide web/docs/REASON_BOT_INTEGRATION.md.
// The base is the danMCai network (bot/danmcai, guandanai's 017). Around it: a second network reads the public table (plays,
// passes, card counts, tribute) and says how likely each unseen card is to sit with each other player; from that 8 possible deals
// of the hidden cards are drawn and searched. With 21-40 cards left on the table, 017's top 6 plays (and a pass) are each played
// out to the end of the round in every deal, all four seats by 017; with 20 or fewer, every play is solved exactly in every deal.
// Over 40 cards left, one play possible or a hand that goes out in one play: 017 plays as it is. Only this seat's own hand and
// public information go in (searchPayload); the other three hands are never read.
// It runs in a module Worker of its own (bot/reason/assets: guandanai's bundle, unchanged; its two networks in bot/reason/models)
// so the page does not stall; one Worker for the whole page, the table first and the coach after. When a search does not finish
// in its time, fails, or does not fit the table, 017 (NeuralBot) plays instead, and if that fails too, the Clint rules (botFail).
const REASON_ID='danmcai-reason',REASON_BASE='danmcai',REASON_BOT='9001';
let RS=null,RSM=null; // the client (a promise), and the bundle's module once it has loaded
function reasonClient(){
  if(!/^https?:$/.test(location.protocol))return Promise.reject(Error('the search Worker needs the page served over http(s)'));
  return RS||(RS=import(new URL('bot/reason/assets/reason-client.mjs?v='+VERSION,location.href).href).then(m=>{
    RSM=m;
    return{m,client:m.createSearchClient({spawn:()=>new Worker(new URL('bot/reason/assets/search-worker.mjs?v='+VERSION,location.href),{type:'module'})})};
  },e=>{RS=null;throw e}));
}
function reasonWarm(){if(/^https?:$/.test(location.protocol))reasonClient().then(({client})=>client.warm(REASON_BOT)).catch(e=>console.warn('推理搜索没能加载',e))}
// one random number per round and page (not from the cards), the same for every search of that round: G is the whole match, so
// a round is G.tok and G.round
function reasonSeed(seeds){
  const key=G.tok+':'+G.round;
  if(!seeds.has(key)){seeds.clear();seeds.set(key,crypto.getRandomValues(new Uint32Array(1))[0])}
  return seeds.get(key);
}
const REASON_SEEDS=new Map();
// the table: the search's play for seat p, null for a pass, or undefined when there is no search (017 plays instead)
async function reasonSearch(p){
  const now=()=>G.tok+':'+G.log.length+':'+G.turn,at=now();
  if(G.turn!==p||G.phase!=='play'||isHumanSeat(p))return undefined;
  // no search over 40 cards: do not even wait for the module there
  if(G.hands.reduce((s,h)=>s+h.length,0)>40)return undefined;
  // the module gets a time limit too: a load that hangs must fall back to 017, never run into BOT_WAIT_MS (and botFail)
  let lt;
  const rc=await Promise.race([reasonClient(),new Promise(res=>{lt=setTimeout(res,5000)})]).finally(()=>clearTimeout(lt));
  if(!rc)return undefined;
  const{m,client}=rc;
  if(now()!==at)return undefined;
  if(!m.searchBand(G.hands.reduce((s,h)=>s+h.length,0)))return undefined;
  const plays=m.candidates(G.hands[p],G.L,G.trick&&G.trick.play);
  if(plays.length<=1||plays.some(x=>x&&x.cards.length===G.hands[p].length))return undefined;
  const payload=m.searchPayload(G,p,NET.off,reasonSeed(REASON_SEEDS));
  // a limit of our own, so that the search and then 017 together stay inside BOT_WAIT_MS
  const b=client.stats.budget;
  let timer;
  const r=await Promise.race([client.decide(REASON_BOT,payload),
    new Promise(res=>{timer=setTimeout(()=>res({fallback:true,reason:'caller-timeout'}),b.midgameMs+m.hardTimeoutMs(b)+1000)})])
    .finally(()=>clearTimeout(timer));
  if(!r||!r.ok||now()!==at)return undefined;
  const trick=G.trick&&G.trick.play;
  if(!r.ids.length)return!r.shape&&trick?null:undefined;
  // the play rebuilt from its card numbers and its reading, in this table's own cards (never by the search's candidate index)
  const cards=r.ids.map(id=>G.hands[p].find(c=>c.id===id));
  if(cards.some(c=>!c)||!r.shape)return undefined;
  const s=analyze(cards,G.L).find(x=>x.type===r.shape.type&&x.value===r.shape.value&&x.n===r.shape.n&&beats(x,trick));
  return s?{...s,cards,wu:cards.filter(c=>isWild(c,G.L)).length}:undefined;
}
// search, else 017; only 017 failing reaches botFail (and the Clint rules)
async function reasonDecide(p,g){
  let pl;
  try{pl=await reasonSearch(p)}catch(e){pl=undefined;console.warn('推理搜索出错，改用 danMCai',e)}
  return pl!==undefined?pl:NeuralBot.decide(REASON_BASE,g,p,NET.off);
}
