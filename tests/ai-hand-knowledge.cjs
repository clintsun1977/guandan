const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const sourceFiles = ['web/src/core/cards.js', 'web/src/core/combinations.js',
  'web/src/core/moves.js', 'bot/clint/clint-bot.js', 'bot/clint/endgame-brain.js',
  'web/src/hand/hints.js', 'web/src/game/state.js'];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
for (const file of ['sources', 'index.html']) {
  const script = file === 'sources' ? sourceFiles.map(read).join('\n') :
    read(file).match(/<script>([\s\S]*?)<\/script>/)[1];
  new vm.Script(script, { filename: file });
  // Exercise the actual rules and AI without booting the DOM, audio or networking.
  const ctx = vm.createContext({ assert, performance, setTimeout, console });
  const prefix = file === 'sources' ? script : script.slice(0, script.indexOf('function resetGame(){'));
  vm.runInContext(prefix + '\n' + read('web/src/game/computer-players.js') + `
    let myNick='stezer0';
    G={L:2,open:false,hands:[[],[],[],[]],log:[],seen:[]};
    for(const name of ['stezer0','SteZer0','STEZER0']){
      myNick=name;
      assert.deepEqual([0,1,2,3].map(aiSeesAll),[false,false,true,false]);
    }
    for(const name of ['other','stezerO','stezer00','stezer','']){
      myNick=name;
      assert.ok([0,1,2,3].every(p=>!aiSeesAll(p)));
    }
    // Online host decision-making must work for every human seat and table rotation.
    NET.mode='host';myNick='host';
    for(let off=0;off<4;off++)for(let human=0;human<4;human++){
      NET.off=off;NET.humans=new Set([human]);NAMES=BASE_NAMES.slice();
      if(human===0)myNick='stezer0';else{myNick='host';NAMES[human]='stezer0'}
      for(let p=0;p<4;p++)assert.equal(aiSeesAll(p),p===(human+2)%4);
      NET.humans.add((human+2)%4);
      assert.equal(aiSeesAll((human+2)%4),false);
      NET.humans.clear();
      assert.ok([0,1,2,3].every(p=>!aiSeesAll(p)));
    }
    NET.mode='solo';NET.off=0;NET.humans=new Set([0]);myNick='stezer0';
    const deck=makeDeck();
    const card=(s,r,k=0)=>deck.filter(c=>c.s===s&&c.r===r)[k];
    const single=c=>genPlays([c],G.L)[0];
    const cur=single(card('S',10));
    G.hands=[[card('S',14)],[card('S',3)],[card('S',9)],[card('S',4)]];
    assert.equal(inferNow(2),true);
    assert.equal(mateBeatChance(2,cur),1);
    assert.equal(oppBeatChance(2,cur),0);
    assert.equal(inferDeals(2).length,1);
    // Knowledge follows the current cards, without a stale inferred-deal cache.
    G.hands[1]=[card('J',17)];
    assert.equal(oppBeatChance(2,cur),1);
    G.hands[0]=[card('S',5)];
    assert.equal(mateBeatChance(2,cur),0);
    // Cards from different hands must never be combined into a fictitious bomb.
    G.hands=[[card('S',8),card('H',8)],[card('C',8)],
      [card('S',3),card('S',6)],[card('D',8)]];
    assert.equal(outside(2).topBomb,0);
    assert.equal(feedMate(2,null),null); // The teammate has no pair to finish with.
    G.hands[0]=[card('S',8),card('H',8)];
    G.hands[2]=[card('S',3),card('H',3),card('S',6)];
    assert.equal(feedMate(2,null).type,'pair');
    G.hands[3]=[card('S',14),card('H',14)];
    assert.equal(feedMate(2,null),null); // The intervening opponent can finish first.
    // Real-hand knowledge stays active in the early game, without revealing the table.
    G.hands=Array.from({length:4},(_,p)=>deck.slice(p*27,(p+1)*27));
    assert.equal(inferNow(2),true);
    assert.equal(inferNow(1),false);
    for(let p=1;p<4;p++){
      const pl=aiDecide(p);
      assert.ok(pl&&pl.cards.every(c=>G.hands[p].includes(c)));
      assert.ok(analyze(pl.cards,G.L).some(x=>x.type===pl.type&&x.value===pl.value));
    }
    assert.equal(G.open,false);
    myNick='other';
    assert.ok([0,1,2,3].every(p=>!aiSeesAll(p)));
    // No global display/practice flag can grant another username this ability.
    G.open=true;
    assert.ok([0,1,2,3].every(p=>!aiSeesAll(p)));
    myNick='stezer0';
    // The endgame brain must solve the real deal rather than inventing other hands.
    G={L:2,phase:'play',turn:2,tok:1,hands:[[card('S',9)],
      [card('S',10)],[card('S',3),card('H',3),card('S',4)],[card('S',11)]],
      trick:null,passes:0,out:[],log:[],seen:[]};
    const realWorld=esWorld;let searched=0;
    esWorld=function*(world,legal,until){
      assert.deepEqual(world.h,G.hands);
      searched++;
      return yield* realWorld(world,legal,until);
    };
    const rules=aiDecide(2),brain=endgameBrain(2,rules);
    assert.equal(searched,1);
    assert.ok(brain===null||brain.cards.every(c=>G.hands[2].includes(c)));
    esWorld=realWorld;
    // Even when a neural model is selected, this seat starts the full-information path.
    RULES.bot='danmcai';
    botStart(2);
    assert.equal(G.nn,null);
    assert.ok(G.brain&&G.brain.done);
    const move=aiMove(2);
    assert.notEqual(move,undefined);
    assert.ok(move===null||move.cards.every(c=>G.hands[2].includes(c)));
    // Losing the qualifying teammate invalidates a move already computed with full knowledge.
    G.brain={key:G.tok+':'+G.log.length+':2',open:true,done:true,pl:{stale:true}};
    myNick='other';G.phase='prep';
    const after=aiMove(2);
    assert.equal(G.brain,null);
    assert.ok(after===null||!after.stale);
  `, ctx, { filename: file, timeout: 30000 });
  console.log(file + ': hand-knowledge checks passed');
}
