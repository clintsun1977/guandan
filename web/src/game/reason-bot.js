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
// the turn rule (the owner's, guandanai 699674b): a computer has 60 s for a move like anyone else, at most 50 s of it searching,
// and the last 10 s kept for 017 should the search not finish. The 50 s count from the start of the turn (botStart), the
// "thinking" pause, the first load and any wait behind the coach included: the client stops the search 50 s in and gives up
// 52 s in. One move falling back changes nothing for the next: every move searches afresh
const reasonCapMs=()=>Math.max(1000,Math.min(53000,playMs()-7000)); // HARD_MS (52 s) + 1 s: our own last limit on the whole search, the module load included, from the start of the turn
// the table: the search's play for seat p, null for a pass, or undefined when there is no search (017 plays instead)
async function reasonSearch(p,startedAt){
  const now=()=>G.tok+':'+G.log.length+':'+G.turn,at=now();
  if(G.turn!==p||G.phase!=='play'||isHumanSeat(p))return undefined;
  // no search over 40 cards: do not even load the module there
  if(G.hands.reduce((s,h)=>s+h.length,0)>40)return undefined;
  const{m,client}=await reasonClient();
  if(now()!==at)return undefined;
  if(!m.searchBand(G.hands.reduce((s,h)=>s+h.length,0)))return undefined;
  const plays=m.candidates(G.hands[p],G.L,G.trick&&G.trick.play);
  if(plays.length<=1||plays.some(x=>x&&x.cards.length===G.hands[p].length))return undefined;
  const payload=m.searchPayload(G,p,NET.off,reasonSeed(REASON_SEEDS));
  const r=await client.decide(REASON_BOT,payload,{startedAt});
  if(!r||!r.ok||now()!==at)return undefined;
  const trick=G.trick&&G.trick.play;
  if(!r.ids.length)return!r.shape&&trick?null:undefined;
  // the play rebuilt from its card numbers and its reading, in this table's own cards (never by the search's candidate index)
  const cards=r.ids.map(id=>G.hands[p].find(c=>c.id===id));
  if(cards.some(c=>!c)||!r.shape)return undefined;
  const s=analyze(cards,G.L).find(x=>x.type===r.shape.type&&x.value===r.shape.value&&x.n===r.shape.n&&beats(x,trick));
  return s?{...s,cards,wu:cards.filter(c=>isWild(c,G.L)).length}:undefined;
}
// search, else 017. 017 is worked out at the same time as the search, so it is ready the moment the search falls back; only
// 017 failing reaches botFail (and the Clint rules), never the search
async function reasonDecide(p,g,startedAt){
  const champion=Promise.resolve().then(()=>NeuralBot.decide(REASON_BASE,g,p,NET.off));
  champion.catch(()=>{});
  let timer;
  const pl=await Promise.race([
    reasonSearch(p,startedAt).catch(e=>{console.warn('推理搜索出错，改用 danMCai',e);return undefined}),
    new Promise(res=>{timer=setTimeout(()=>res(undefined),Math.max(0,startedAt+reasonCapMs()-performance.now()))}),
  ]).finally(()=>clearTimeout(timer));
  return pl!==undefined?pl:champion;
}
