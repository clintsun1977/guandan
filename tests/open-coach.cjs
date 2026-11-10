const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

(async () => {
  const m = await import(pathToFileURL(path.join(root, 'bot/reason/assets/reason-client.mjs')));
  const workerText = read('bot/reason/assets/open-coach-worker.mjs');
  assert.equal(workerText, read('bot/reason/assets/search-worker.mjs') + '\n' + read('bot/reason/open-coach-extension.js'));
  const worker = vm.createContext({ assert, performance, URL, structuredClone, setTimeout,
    self: {}, ort: { env: { wasm: {} } } });
  vm.runInContext(workerText.replace(/^import \* as ort from .*;$/m, '')
    .replaceAll('import.meta.url', JSON.stringify(pathToFileURL(path.join(root, 'bot/reason/assets/open-coach-worker.mjs')).href)), worker);
  vm.runInContext(`
    engine={budget:{midgameMs:50000,endgameMs:50000,solverMs:3000,solverTable:100000},
      values:async state=>state.actions.map((_,i)=>-i),
      probabilities:()=>{throw Error('Full-information search tried to infer hands')}};
  `, worker);
  const evaluate = async payload => {
    worker.payload = structuredClone(payload);
    return vm.runInContext('coach(payload,{cancelled:false})', worker, { timeout: 30000 });
  };
  const files = ['web/src/core/cards.js','web/src/core/combinations.js','web/src/core/moves.js',
    'bot/clint/clint-bot.js','bot/clint/endgame-brain.js','web/src/hand/hints.js',
    'web/src/game/state.js','web/src/game/reason-bot.js'];
  const jobs = [];
  let fullRequests = 0, publicRequests = 0;
  const ctx = vm.createContext({ assert, m, performance, console, structuredClone,
    crypto: { getRandomValues: a => a.fill(123) },
    setTimeout: fn => jobs.push(fn),
    requestFull: async payload => { fullRequests++; return evaluate(payload); },
    requestPublic: async () => { publicRequests++; return null; } });
  const coachText = read('web/src/coach/coach.js').split("$('#coachName').textContent=")[0];
  vm.runInContext(files.map(read).join('\n') + '\n' + coachText + `
    let myNick='stezer0';
    const TOP5_NAMES=['stezer0','koala'];
    const NeuralBot={has:()=>true,actionKey:m.actionKey,relativeRating:m.relativeRating,
      rate:async(id,g)=>{const actions=m.candidates(g.hands[0],g.L,g.trick?.play).map(p=>p?p.cards.map(c=>c.id):[]);
        return{actions,values:actions.map((_,i)=>-i)}}};
    renderCoach=()=>{};reasonWarm=()=>{};
    reasonOpenClient=async()=>{RSM=m;return{m,client:{evaluate:(bot,payload)=>requestFull(payload)}}};
    reasonClient=async()=>{RSM=m;return{m,client:{evaluate:(bot,payload)=>requestPublic(payload)}}};
    const deck=makeDeck(),card=(s,r)=>deck.find(c=>c.s===s&&c.r===r);
    G={tok:1,round:1,L:2,levels:[2,2],phase:'play',turn:0,log:[],out:[],passes:0,trick:null,
      hands:[[card('S',3),card('H',3),card('S',4),card('H',4),card('S',5),card('S',6)],
        [card('S',9)],[card('S',10)],[card('S',11)]]};
    RULES.coach=false;
    for(const name of ['stezer0','SteZer0','STEZER0']){
      myNick=name;assert.equal(coachShown(),true);assert.equal(coachTop5(),true);assert.equal(coachOpen(),true);
    }
    myNick='other';assert.equal(coachShown(),false);assert.equal(coachOpen(),false);
    myNick='stezer0';coachSnap();
  `, ctx);
  await jobs.shift()();
  assert.equal(fullRequests, 1);
  assert.equal(publicRequests, 0);
  vm.runInContext(`
    assert.equal(CO.turn.error,false);
    assert.equal(CO.turn.reasoning.worlds,1);
    assert.equal(CO.turn.ranked.length,5);
    assert.ok(CO.turn.ranked.every(row=>Number.isFinite(row.value)));
    assert.ok(CO.turn.ranked.every((row,i,rows)=>!i||rows[i-1].value>=row.value));
    assert.match(coachGrade(CO.turn,{ids:CO.turn.ranked[0].ids}),/^合理性 /);
    assert.deepEqual(CO.turn.payload.fullHands,G.hands.map(h=>h.map(c=>c.id)));
    // Search failure must never be presented as a full-information ranking.
    const failed={open:true};coachValues(failed,null);assert.equal(failed.error,true);
    const duplicate=structuredClone(CO.turn.payload);duplicate.fullHands[1][0]=duplicate.fullHands[0][0];
    globalThis.invalid=duplicate;
    myNick='koala';CO.turn=null;G.tok++;coachSnap();
  `, ctx);
  await assert.rejects(evaluate(ctx.invalid), /Invalid open coach cards/);
  await jobs.shift()();
  assert.equal(fullRequests, 1);
  assert.equal(publicRequests, 1);
  vm.runInContext(`assert.equal(CO.turn.payload.fullHands,undefined);assert.equal(CO.turn.open,false)`, ctx);
  // Full-information reasoning also runs above the original 40-card search limit.
  worker.opening = undefined;
  await vm.runInContext(`(async()=>{
    const game=createRound(123);game.openHands=true;
    let sampled=0;
    const original=publicWorlds;
    const worlds=await beliefWorlds(game,123,8,{probabilities:()=>{sampled++;throw Error('inference')}});
    assert.equal(sampled,0);assert.equal(worlds.length,1);
    assert.deepEqual(worlds[0],game.hands.map(h=>h.map(c=>c.id)));
    const result=await coachSearchValues(game,123,{values:engine.values,probabilities:engine.probabilities,
      offset:0,now:()=>performance.now(),deadline:performance.now()+30000},
      {...SEARCH_BOT_V1,hi:108,minWorlds:1});
    assert.equal(result.kind,'midgame');assert.equal(result.worlds,1);
    assert.ok(result.values.filter(Number.isFinite).length>=5);
  })()`, worker, { timeout: 30000 });
  console.log('Open coach: host toggle, username scope, true-hand search, Top 5, failure handling and early-game checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
