// Appended to the verified danMCai search bundle by web/build.py, in a separate coach Worker.
// The original table/search Worker remains unchanged. Only stezer0's coach sends fullHands.
const publicCoach = coach;
const publicWorlds = beliefWorlds;
beliefWorlds = async function(game, seed, count, guard) {
  if(game.openHands)return [game.hands.map(hand=>hand.map(card=>card.id))];
  return publicWorlds(game,seed,count,guard);
};
coach = async function(payload,job) {
  if(!payload.fullHands)return publicCoach(payload,job);
  const started=performance.now(),game=restoreGame(payload);
  const hands=payload.fullHands;
  if(hands.length!==4||hands.some((h,p)=>!Array.isArray(h)||h.length!==payload.counts[p]))
    throw Error('Invalid open coach hands');
  const ids=hands.flat(),seen=new Set(payload.log.flatMap(e=>e.cards||[]));
  if(new Set(ids).size!==ids.length||ids.some(id=>!Number.isInteger(id)||!deck2[id]||seen.has(id))||
    hands[payload.p].some((id,i)=>id!==payload.hand[i]))throw Error('Invalid open coach cards');
  game.hands=hands.map(h=>h.map(id=>deck2[id]));game.openHands=true;
  const params={...SEARCH_BOT_V1,hi:108,minWorlds:1};
  const band=searchBand(remainingCards(game),params);
  let last=started;
  const pause=async()=>{if(performance.now()-last>=50){await nextTask();last=performance.now()}};
  const ctx={
    values:async state=>{await pause();return engine.values(state)},
    probabilities:()=>{throw Error('Open coach must not infer hidden hands')},
    solver:createSolver({maxNodes:params.solverMaxNodes,maxMs:engine.budget.solverMs,maxTable:engine.budget.solverTable}),
    solverTimeIsBudget:engine.budget.solverMs<NODE_SOLVER_MS,
    solverMs:engine.budget.solverMs,cappedSolver,offset:payload.offset,pause,
    now:()=>{if(job.cancelled)throw new SearchBudgetError('cancelled');return performance.now()},
    deadline:deadlineOf(started,band),counter:{inferences:0}
  };
  let result;
  try{result=await coachSearchValues(game,payload.seed,ctx,params)}
  catch(error){
    if(error instanceof SearchBudgetError)return{fallback:true,reason:error.stage==='cancelled'?'cancelled':'budget'};
    throw error;
  }
  if(!result?.values)return{fallback:true,reason:'unfinished'};
  return{ok:true,openHands:true,kind:result.kind,
    plays:result.plays.map(play=>play?play.cards.map(card=>card.id):[]),
    base:Array.from(result.base),values:result.values,worlds:1,used:1,
    evaluated:result.evaluated,ms:performance.now()-started};
};
