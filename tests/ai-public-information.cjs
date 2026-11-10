const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

(async () => {
  const m = await import(pathToFileURL(path.join(root,'bot/reason/assets/reason-client.mjs')));
  const files = ['web/src/core/cards.js','web/src/core/combinations.js','web/src/core/moves.js',
    'bot/clint/clint-bot.js','bot/clint/endgame-brain.js','web/src/hand/hints.js','web/src/game/state.js'];
  for (const file of ['sources','index.html']) {
    const script = file==='sources'?files.map(read).join('\n'):
      read(file).match(/<script>([\s\S]*?)<\/script>/)[1];
    new vm.Script(script);
    const jobs = [];
    const ctx = vm.createContext({assert,m,performance,console,NeuralBot:{},
      setTimeout:fn=>jobs.push(fn),crypto:{getRandomValues:a=>a.fill(123)}});
    vm.runInContext((file==='sources'?script:script.split('function resetGame(){')[0])+'\n'+
      read('web/src/game/reason-bot.js')+'\n'+read('web/src/game/computer-players.js')+'\n'+
      read('web/src/coach/coach.js').split("$('#coachName').textContent=")[0]+`
      let myNick='stezer0';const TOP5_NAMES=['stezer0','koala'];
      NeuralBot.has=()=>true;
      const deck=makeDeck();let nnCalls=0,reasonCalls=0;
      const decide=(g,p)=>genPlays(g.hands[p],g.L)[0];
      NeuralBot.decide=(id,g,p)=>{nnCalls++;return Promise.resolve(decide(g,p))};
      reasonDecide=(p,g)=>{reasonCalls++;return Promise.resolve(decide(g,p))};
      for(const name of ['stezer0','SteZer0','other'])for(const model of ['danmcai','guanzero',REASON_ID]){
        myNick=name;RULES.bot=model;
        G={tok:1,round:1,L:2,levels:[2,2],phase:'play',turn:2,log:[],out:[],passes:0,trick:null,
          hands:[0,1,2,3].map(p=>deck.slice(p*27,(p+1)*27))};
        const before=model===REASON_ID?reasonCalls:nnCalls;
        botStart(2);
        assert.equal(G.nn.id,model);assert.equal(G.brain,undefined);
        assert.equal((model===REASON_ID?reasonCalls:nnCalls),before+1);
      }
      assert.equal(BOT_WAIT_MS,60000);
      assert.equal(inferNow(2),false); // Early-game knowledge never depends on the nickname.
      const hidden={get id(){throw Error('Another hand was read')}};
      G.hands=[Array(27).fill(hidden),Array(27).fill(hidden),deck.slice(54,81),Array(27).fill(hidden)];
      assert.equal(inferDeals(2).length,AIP.inferSamples);
      assert.ok(outside(2).plays.length);
      // The viewer still has private strength labels and normal coaching, even with the host toggle off.
      myNick='stezer0';G.turn=0;G.hands=[deck.slice(0,4),Array(4).fill(hidden),Array(4).fill(hidden),Array(4).fill(hidden)];
      RULES.coach=false;assert.equal(coachShown(),true);assert.equal(coachTop5(),true);
      NeuralBot.actionKey=m.actionKey;
      NeuralBot.rate=async(id,g)=>{
        assert.ok(g.hands[1].every(c=>c===undefined));
        const actions=m.candidates(g.hands[0],g.L,null).map(pl=>pl?pl.cards.map(c=>c.id):[]);
        return{actions,values:actions.map((_,i)=>-i)};
      };
      renderCoach=()=>{};reasonWarm=()=>{};
      reasonClient=async()=>{RSM=m;return{m,client:{evaluate:async(bot,payload)=>{
        assert.equal(payload.fullHands,undefined);
        assert.deepEqual(payload.hand,G.hands[0].map(c=>c.id));
        return null;
      }}}};
      coachSnap();
    `,ctx,{timeout:30000});
    await jobs.shift()();
    vm.runInContext(`
      assert.equal(CO.turn.error,false);assert.equal(CO.turn.source,'champion');
      assert.ok(CO.turn.ranked.length>0);assert.equal(CO.turn.payload.fullHands,undefined);
      myNick='other';assert.equal(coachShown(),false);
    `,ctx);
    console.log(file+': selected models, public-information inference and normal coaching passed');
  }
})().catch(e=>{console.error(e);process.exitCode=1});
