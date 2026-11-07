/* ---------- neural computer players: danMCai and GuanZero (bot/models.json), run in the browser with onnxruntime-web ---------- */
// Ported from stevensun1005/guandanai web/src/ai (encoding.mjs, history.mjs, candidates.js, observation.js, endgame.js,
// policy-inference.mjs, table-policy.mjs), keeping the exact inputs the networks were trained on. A network sees only its
// own hand and what is public at the table (the plays so far, how many cards each player holds, the levels). It scores
// every legal play (and the pass) and the highest score is played; a two-player ending that can be searched to the end is
// played out exactly instead. Tribute and the return card stay with the Clint rules.
// Uses the page's rules: analyze, beats, isWild, makeDeck, SEQS.
const NeuralBot=(()=>{
  const ORT_VER='1.31.1',ORT_BASE=`https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist/`;
  const models=new Map(BOT_MODELS.models.filter(m=>m.file).map(m=>[m.id,m]));
  let ortP=null;const sessions=new Map();
  function ort(){
    if(!ortP)ortP=import(ORT_BASE+'ort.wasm.min.mjs').then(o=>{
      o.env.wasm.numThreads=1;o.env.wasm.proxy=false;o.env.wasm.wasmPaths=ORT_BASE;return o;
    }).catch(e=>{ortP=null;throw e});
    return ortP;
  }
  function session(id){
    const m=models.get(id);if(!m)return Promise.reject(Error('unknown model '+id));
    if(!sessions.has(id)){
      const p=ort().then(o=>o.InferenceSession.create(new URL('bot/'+m.path,location.href).href,{executionProviders:['wasm'],graphOptimizationLevel:'all'}));
      p.catch(()=>sessions.delete(id));
      sessions.set(id,p);
    }
    return sessions.get(id);
  }

  /* --- features (encoding.mjs) --- */
  function cardIndex(id){const n=id%54;return n>=52?n:(n%13)*4+[1,0,2,3][Math.floor(n/13)]}
  function cardsArray(ids){
    const a=new Float32Array(54);
    if(ids&&ids.length===1&&ids[0]===-1)return a.fill(-1);
    for(const id of ids||[])a[cardIndex(id)]++;
    return a;
  }
  function universalFlags(hand,level){
    const result=new Float32Array(12),wild=(level-2)*4;
    if(!hand[wild])return result;
    result[0]=1;
    for(let suit=0;suit<4&&!result[1];suit++)
      for(let start=0;start<8;start++){
        let missing=0;
        for(let rank=start;rank<start+5;rank++)if(suit+rank*4===wild||!hand[suit+rank*4])missing++;
        if(missing<=1){result[1]=1;break}
      }
    const counts=Array.from({length:13},(_,rank)=>[0,1,2,3].filter(suit=>suit+rank*4!==wild&&hand[suit+rank*4]).length);
    for(let i=8-Math.max(1,Math.min(6,Math.max(...counts)));i<8;i++)result[i]=1;
    let tail=0;
    for(let i=0;i<13;i++){
      const c=counts[i];
      if(!c){tail=0;continue}
      tail++;
      if(i>=1){const prev=counts[i-1];if((c===2&&prev>=3)||(c>=3&&prev===2))result[9]=1;else if(c===2&&prev===2)result[11]=1}
      if(i>=2){const a=counts[i-2],b=counts[i-1];if((a===1&&b>=2&&c>=2)||(a>=2&&b===1&&c>=2)||(a>=2&&b>=2&&c===1))result[10]=1}
    }
    if(tail>=4)result[8]=1;
    return result;
  }
  // the public history as the networks were trained to see it, with markers for players who have gone out
  function replay(log){
    const histories=[[],[],[],[]],sequence=[],out=[],remaining=[27,27,27,27];
    let flag=1;
    const append=(p,cards)=>{histories[p].push(cards);sequence.push(cards)};
    for(const e of log){
      const p=e.p,cards=e.cards||[];
      append(p,cards);
      if(out.length===1){
        if(cards.length&&flag===1){flag=2;if(p===(out[0]+3)%4)append(out[0],[-1])}
        else if(flag===1&&(p+1)%4===out[0]){flag=2;append(out[0],[-1]);append((p+2)%4,[])}
        else if(p===(out[0]+3)%4&&flag===2)append(out[0],[-1]);
      }else if(out.length===2){
        if(cards.length&&flag<=2){flag=3;if(out.includes((p+1)%4)){append((p+1)%4,[-1]);append((p+2)%4,[-1])}}
        else if(flag<=2&&out.includes((p+1)%4)){flag=3;append((p+1)%4,[-1]);append((p+2)%4,[-1]);if(p===(out.at(-1)+2)%4)append((p+3)%4,[])}
        else if(out.includes((p+1)%4)&&flag===3){append((p+1)%4,[-1]);append((p+2)%4,[-1])}
      }
      remaining[p]-=cards.length;
      if(remaining[p]===0&&!out.includes(p))out.push(p);
    }
    return{histories,sequence,out};
  }
  function encode(state){
    const{p,log}=state,hand=cardsArray(state.hand),unseen=new Float32Array(54).fill(2);
    for(let i=0;i<54;i++)unseen[i]-=hand[i];
    for(const e of log)for(const id of e.cards||[])unseen[cardIndex(id)]--;
    const{histories,sequence,out}=replay(log),mate=(p+2)%4;
    const lastMate=histories[mate].length&&!out.includes(mate)?histories[mate].at(-1):[-1];
    const parts=[hand,universalFlags(hand,state.level),unseen,cardsArray(sequence.length?sequence.at(-1):[-1]),cardsArray(lastMate)];
    for(const offset of [1,2,3])parts.push(cardsArray(log.filter(e=>e.p===(p+offset)%4).flatMap(e=>e.cards||[])));
    for(const offset of [1,2,3]){const one=new Float32Array(28);one[state.counts[(p+offset)%4]]=1;parts.push(one)}
    for(const name of ['selfLevel','opponentLevel','level']){const one=new Float32Array(13);one[state[name]-2]=1;parts.push(one)}
    const result=new Float32Array(513);let at=0;
    for(const part of parts){result.set(part,at);at+=part.length}
    if(at!==513)throw Error('Invalid model feature size');
    return result;
  }
  // GuanZero: the last 20 public actions (history.mjs)
  function encodeHistory(state){
    const sequence=replay(state.log).sequence.slice(-20),result=new Float32Array(1080);
    sequence.forEach((cards,i)=>result.set(cardsArray(cards),(20-sequence.length+i)*54));
    return result;
  }

  /* --- every legal play, in the order the networks were trained with (candidates.js) --- */
  const faceKey=c=>c.r+c.s;
  function choose(cards,n){
    const out=[];
    (function visit(start,picked){
      if(picked.length===n){out.push(picked);return}
      for(let i=start;i<=cards.length-(n-picked.length);i++){
        if(i>start&&faceKey(cards[i])===faceKey(cards[i-1]))continue;
        visit(i+1,picked.concat(cards[i]));
      }
    })(0,[]);
    return out;
  }
  function candidates(hand,L,cur){
    const wild=hand.filter(c=>isWild(c,L)),by={};
    for(const c of hand.filter(c=>!isWild(c,L)))(by[c.r]||(by[c.r]=[])).push(c);
    for(const group of Object.values(by))group.sort((a,b)=>a.s.localeCompare(b.s)||a.id-b.id);
    const out=[],seen=new Set();
    function add(cards){
      const faces=cards.map(faceKey).sort().join(',');
      for(const a of analyze(cards,L)){
        if(!beats(a,cur))continue;
        const key=a.type+':'+a.value+':'+faces;
        if(seen.has(key))continue;
        seen.add(key);
        out.push({...a,cards,wu:cards.filter(c=>isWild(c,L)).length});
      }
    }
    function groups(rank,n){
      const result=[];
      for(let w=0;w<=Math.min(wild.length,n);w++){
        if(rank>=16&&w)continue;
        for(const cards of choose(by[rank]||[],n-w))result.push({cards,w});
      }
      return result;
    }
    for(let rank=2;rank<=17;rank++){
      if(rank===15)continue;
      const max=rank>=16?2:Math.min(10,(by[rank]||[]).length+wild.length);
      for(let n=1;n<=max;n++)for(const g of groups(rank,n))add(g.cards.concat(wild.slice(0,g.w)));
    }
    const jokers=(by[16]||[]).concat(by[17]||[]);
    if(jokers.length===4)add(jokers);
    for(let t=2;t<=14;t++)
      for(const triple of groups(t,3))
        for(let p=2;p<=17;p++){
          if(p===t||p===15)continue;
          for(const pair of groups(p,2))if(triple.w+pair.w<=wild.length)add(triple.cards.concat(pair.cards,wild.slice(0,triple.w+pair.w)));
        }
    for(const [len,need] of SEQS)
      for(let start=1;start+len-1<=14;start++){
        (function run(offset,cards,w){
          if(offset===len){add(cards.concat(wild.slice(0,w)));return}
          const rank=start+offset===1?14:start+offset;
          for(const group of groups(rank,need))if(w+group.w<=wild.length)run(offset+1,cards.concat(group.cards),w+group.w);
        })(0,[],0);
      }
    if(cur)out.push(null);
    return out;
  }

  /* --- a two-player ending: the other hand is known from the cards played, so it can be searched to the end (endgame.js) --- */
  const deck=makeDeck(),ENDGAME_MAX_CARDS=24;
  const handKey=hand=>hand.map(c=>c.r+c.s).sort().join(',');
  function endgameRequest(g,player,plays){
    const act=g.hands.map((h,s)=>h.length?s:-1).filter(s=>s>=0);
    if(act.length!==2||!act.includes(player)||act[0]%2===act[1]%2||g.hands.reduce((s,h)=>s+h.length,0)>ENDGAME_MAX_CARDS)return null;
    return{trick:g.trick&&{player:g.trick.player,play:{type:g.trick.play.type,value:g.trick.play.value,n:g.trick.play.n}},
      passes:g.passes||0,shapes:plays.map(pl=>pl&&{type:pl.type,value:pl.value,n:pl.n})};
  }
  function inferLastOpponent(state){
    if(state.counts.length!==4||state.counts.some(n=>!Number.isInteger(n)||n<0||n>27))return null;
    const opp=state.counts.map((n,s)=>n>0&&s!==state.p?s:-1).filter(s=>s>=0);
    if(opp.length!==1||opp[0]%2===state.p%2)return null;
    const known=state.hand.concat(state.log.flatMap(e=>e.cards||[]));
    if(known.some(id=>!Number.isInteger(id)||id<0||id>=108)||new Set(known).size!==known.length)return null;
    const ids=new Set(known),hand=deck.filter(c=>!ids.has(c.id));
    if(hand.length!==state.counts[opp[0]]||state.hand.length!==state.counts[state.p])return null;
    return{player:opp[0],hand};
  }
  function solvePublicEndgame(state,values,{maxNodes=40000,maxMs=80}={}){
    if(!state.endgame||state.hand.length+state.counts.reduce((s,n,seat)=>s+(seat===state.p?0:n),0)>ENDGAME_MAX_CARDS)return null;
    const other=inferLastOpponent(state);
    if(!other)return null;
    const own=state.hand.map(id=>deck[id]),shapes=state.endgame.shapes;
    if(!shapes||shapes.length!==state.actions.length||values.length!==state.actions.length)return null;
    const root=[];
    for(let i=0;i<state.actions.length;i++){
      const ids=state.actions[i],shape=shapes[i];
      if(!ids.length){if(!state.endgame.trick||shape)return null;root.push(null);continue}
      if(new Set(ids).size!==ids.length||!ids.every(id=>state.hand.includes(id)))return null;
      const cards=ids.map(id=>deck[id]);
      const reading=analyze(cards,state.level).find(r=>shape&&r.type===shape.type&&r.value===shape.value&&beats(r,state.endgame.trick&&state.endgame.trick.play));
      if(!reading)return null;
      root.push({...reading,cards});
    }
    const seats=[state.p,other.player],trick=state.endgame.trick;
    if(trick&&trick.player===state.p)return null;
    const initialOwner=trick?seats.indexOf(trick.player):-1;
    let finishedLeader=0;
    if(trick&&initialOwner<0){
      const mate=seats.indexOf((trick.player+2)%4);
      if(mate>=0)finishedLeader=mate;
      else for(let step=1;step<=4;step++){const next=seats.indexOf((trick.player+step)%4);if(next>=0){finishedLeader=next;break}}
    }
    const started=performance.now(),deadline=started+maxMs,budget={},memo=new Map(),legalCache=new Map();
    let nodes=0;
    const shapeKey=pl=>pl?`${pl.type}:${pl.value}:${pl.n}`:'-';
    function legal(hand,current){
      const key=hand.map(c=>c.id).sort((a,b)=>a-b).join(',')+'|'+shapeKey(current);
      if(!legalCache.has(key))legalCache.set(key,candidates(hand,state.level,current).sort((a,b)=>((b&&b.cards.length)||0)-((a&&a.cards.length)||0)));
      return legalCache.get(key);
    }
    function after(hands,turn,current,owner,passes,play){
      if(play){
        const ids=new Set(play.cards.map(c=>c.id)),remaining=hands[turn].filter(c=>!ids.has(c.id));
        if(!remaining.length)return turn===0?1:-1;
        const next=hands.slice();next[turn]=remaining;
        return search(next,1-turn,play,turn,0);
      }
      const nextPasses=passes+1;
      if(nextPasses>=(owner<0?2:1))return search(hands,owner<0?finishedLeader:owner,null,-1,0);
      return search(hands,1-turn,current,owner,nextPasses);
    }
    function search(hands,turn,current,owner,passes){
      if(++nodes>maxNodes||(nodes%64===0&&performance.now()>deadline))throw budget;
      const key=handKey(hands[0])+'|'+handKey(hands[1])+`|${turn}|${shapeKey(current)}|${owner}|${passes}`;
      if(memo.has(key))return memo.get(key);
      const desired=turn===0?1:-1;let result=-desired;
      for(const play of legal(hands[turn],current))if(after(hands,turn,current,owner,passes,play)===desired){result=desired;break}
      memo.set(key,result);
      return result;
    }
    try{
      const order=root.map((_,i)=>i).sort((a,b)=>values[b]-values[a]);
      for(const i of order)if(after([own,other.hand],0,trick?trick.play:null,initialOwner,state.endgame.passes,root[i])===1)return{index:i,winning:true,nodes};
      return null;
    }catch(e){if(e===budget)return null;throw e}
  }

  /* --- scoring the plays (policy-inference.mjs) --- */
  async function inferValues(o,engine,state,config){
    const stateT=new o.Tensor('float32',encode(state),[1,513]);
    const histT=config.history==='guanzero-v1'?new o.Tensor('float32',encodeHistory(state),[1,5,216]):null;
    const values=[];
    try{
      for(let first=0;first<state.actions.length;first+=128){
        const chunk=state.actions.slice(first,first+128),batch=new Float32Array(chunk.length*54);
        chunk.forEach((cards,i)=>batch.set(cardsArray(cards),i*54));
        let actT,output;
        try{
          actT=new o.Tensor('float32',batch,[chunk.length,54]);
          const inputs={state:stateT,actions:actT};
          if(histT)inputs.history=histT;
          output=await engine.run(inputs);
          const v=output.values&&output.values.data;
          if(!v||v.length!==chunk.length||!Array.from(v).every(Number.isFinite))throw Error('Invalid model output');
          values.push(...v);
        }finally{actT&&actT.dispose();if(output)for(const t of Object.values(output))t.dispose()}
      }
    }finally{stateT.dispose();histT&&histT.dispose()}
    return values;
  }

  // what seat p can see, at the moment it is to play (observation.js policyState)
  function observe(g,p,plays,off){
    return{
      p,hand:g.hands[p].map(c=>c.id),counts:g.hands.map(h=>h.length),
      log:g.log.map(e=>({p:e.p,cards:e.cards?e.cards.map(c=>c.id):null})),
      level:g.L,selfLevel:g.levels[(p+off)%2],opponentLevel:g.levels[(p+off+1)%2],
      canPass:!!g.trick,actions:plays.map(pl=>pl?pl.cards.map(c=>c.id):[]),
    };
  }

  // g: the table as it stands (hands, trick, passes, log, levels, L); p: the seat to play; off: this page's seat offset.
  // Resolves to the play (a play object of the page's rules) or null for a pass.
  async function decide(id,g,p,off=0){
    const m=models.get(id);if(!m)throw Error('unknown model '+id);
    const plays=candidates(g.hands[p],g.L,g.trick&&g.trick.play);
    if(!plays.length)return null;
    const finish=plays.findIndex(pl=>pl&&pl.cards.length===g.hands[p].length);
    if(finish>=0)return plays[finish];
    if(plays.length===1)return plays[0];
    const state=observe(g,p,plays,off);
    state.endgame=endgameRequest(g,p,plays);
    const o=await ort(),engine=await session(id);
    const values=await inferValues(o,engine,state,m.config);
    let index=0;
    for(let i=1;i<values.length;i++)if(values[i]>values[index])index=i;
    const end=state.endgame?solvePublicEndgame(state,values):null;
    if(end)index=end.index;
    return plays[index];
  }
  const preload=id=>session(id).then(()=>true);
  return{decide,preload,has:id=>models.has(id),models:BOT_MODELS.models,_test:{encode,encodeHistory,candidates,replay,cardIndex}};
})();
