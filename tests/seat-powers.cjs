const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const files = ['web/src/core/cards.js','web/src/core/combinations.js','web/src/core/moves.js',
  'bot/clint/clint-bot.js','web/src/game/state.js'];
for (const source of ['sources','index.html']) {
  const plates = Array.from({length:4}, () => ({
    child: null, querySelector() { return this.child; },
    appendChild(el) { this.child = el; el.remove = () => { this.child = null; }; }
  }));
  const document = {
    createElement: () => ({dataset:{},textContent:''}),
    querySelectorAll: () => plates.flatMap(p=>p.child?[p.child]:[])
  };
  const ctx = vm.createContext({assert,document,plates,
    $: selector => plates[selector.includes('mebar')?0:Number(selector.match(/seat(\d)/)[1])]
  });
  const inline = source==='sources'?files.map(read).join('\n'):
    read(source).match(/<script>([\s\S]*?)<\/script>/)[1].split('function resetGame(){')[0];
  vm.runInContext(inline + '\n' + read('web/src/ui/seat-powers.js') + `
    let myNick='other';
    const d=makeDeck();G={L:2,phase:'play',hands:[d.slice(0,27),d.slice(27,54),d.slice(54,81),d.slice(81)],pw:[1,2,3,4]};
    let calls=0;const actualPower=handPower;
    // Count arrangement work without replacing the actual hand evaluation.
    const originalScore=scorePower;scorePower=s=>{calls++;return originalScore(s)};
    renderSeatPowers();assert.equal(calls,0);assert.ok(plates.every(p=>!p.child));
    for(const name of ['stezer0','SteZer0','STEZER0']){
      myNick=name;renderSeatPowers();assert.ok(plates.every(p=>p.child));
    }
    assert.equal(calls,4);renderSeatPowers();assert.equal(calls,4);
    for(let p=0;p<4;p++)assert.equal(plates[p].child.textContent,'牌力 '+actualPower(G.hands[p],G.L));
    const before=calls;G.hands[1]=G.hands[1].slice(1);renderSeatPowers();assert.equal(calls,before+1);
    assert.deepEqual(G.pw,[1,2,3,4]); // UI must not change the AI's initial strength tiers.
    G.hands[2]=[];renderSeatPowers();assert.equal(plates[2].child.textContent,'已出完');
    for(const name of ['koala','stezer00','other','']){
      myNick=name;renderSeatPowers();assert.ok(plates.every(p=>!p.child));
    }
    myNick='stezer0';SPEC=true;renderSeatPowers();assert.ok(plates.every(p=>!p.child));
    SPEC=false;NET.humans.clear();renderSeatPowers();assert.ok(plates.every(p=>!p.child));
    NET.humans.add(0);G.phase='deal';renderSeatPowers();assert.ok(plates.every(p=>!p.child));
    G.phase='prep';renderSeatPowers();assert.ok(plates.every(p=>p.child));
  `, ctx, {timeout:30000});
  console.log(source+': private seat-strength checks passed');
}
