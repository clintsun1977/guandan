/* ---------- hand evaluation: roughly how many turns of control the hand still needs ---------- */
// every number the computer players weigh; tuned by self-play in the 07-guandan-ai training folder
const AIP={
  // hand evaluation: a single, pair or three counts 1 turn, less for big cards; runs, bombs and wild cards
  ucTop:.25,ucA:.5,ucQK:.75,tripPairMax:14,seqUnit:.9,fourJokers:1.5,smallJoker:.3,bigJoker:.2,bombBase:.4,bombExtra:.1,wild:.9,
  // following: when to beat an opponent's cards
  urgentWin:7,urgentOpp:5,followFree:.35,followMaybe:1.2,followMaybeProb:.3,saveJokerCurBelow:13,saveJokerHand:8,saveJokerProb:.6,topFree:1,
  // when to bomb
  bombWinLeft:7,bombRest:2,bombOverBomb:12,bombBigVal:14,bombBigProb:.25,safeBombRest:3,
  // what counts as a play that wins the lead back; arranging the hand: what each play (not bombs) costs on top of its score
  ctrlSingle:14,ctrlPair:13,ctrlTrip:12,ctrlSeq:9,armHand:.3,armNodes:400,
  // early and middle game: how often a play that would win the lead back is kept, or a fit left to your partner
  saveCtrlProb:0,midLeaveProb:.2,
  // 牌力 tiers (0-100, the hand as dealt): 1 aims to put both opponents last, 2 to go out first, 3 for second or third,
  // 4 not to end up both last; the weaker tiers leave more to the partner
  tier1:85,tier2:55,tier3:20,leaveWeak:.5,
  // no bomb when the partner, still to play, can most likely beat it (the unseen cards dealt at random this many times)
  mateBeatProb:.8,mateSamples:40,
  // from the player's comments on the test version (07-guandan-ai/第1局评语分析.txt):
  // a small card is 10 or below
  smallMax:10,
  // an opponent's bomb, bombed back or not by how many bombs you hold (straight flushes and the four jokers count), how
  // many levels your smallest one that beats it is above theirs (one level: the smallest bomb there is that beats it),
  // and how many cards they have left. One bomb: bomb when they hold this many or fewer; not when your partner is yet to
  // play and yours is this many levels above or more. Two bombs: bomb when yours is within this many levels; not when it
  // is further above and they hold this many or more. Three or more: always, with the smallest that beats it
  bbOneLeft:7,bbOneFar:10,bbTwoNear:6,bbTwoFarMin:18,
  // late game, no bomb that leaves a small single to get rid of while an opponent still holds more than this many cards
  lateBombOppMax:10,
  // top your partner's small single or pair with an ace or the level card when the next opponent holds this many or fewer
  topMateNextMax:7,
  // each of those rules on (1) or off (0), to test them one at a time: keep big singles early, the smallest pair with a three,
  // bomb back, no hurry to bomb late, leave the joker to the partner, top the partner's small card, hand the partner a play
  // they may go out on, no three-with-a-pair or straight led to an opponent with five cards
  rKeepBig:1,rSmallPair:1,rBombBack:1,rLateBomb:1,rMateJoker:1,rTopMate:1,rFeed:1,rNoFive:1,
  // from the 12th test round (07-guandan-ai/第12局评语分析.txt): the last cards are a bomb that could go out over your partner's
  // play: leave it when no opponent is likely to beat that play (the unseen cards dealt at random: at most this share of the
  // deals gives an opponent something over it, a bomb included) and each opponent holds more than this many cards
  rMateBomb:1,mateBombMax:.2,mateBombOppMin:5,
  // from the player's lead principles (07-guandan-ai/领出按阶段综合考虑草案.txt), each on (1) or off (0):
  // rLeadMate: a weak hand (tier 3 or 4) whose partner looks stronger (holds this many cards fewer, or has won this many tricks
  // more) leads a kind the partner beats at least leadMateMin likely and the next opponent at most leadNextMax;
  // rDry: lead a kind the opponents pass on (an opponent who passed on it at least dryPasses times, on plays no bigger than this
  // one, and never played that kind himself is taken to lack it); rWildPlain: when arranging, a wild card put into a play that is
  // not a bomb costs wildPlain
  rLeadMate:1,mateGap:4,mateTricks:2,leadMateMin:.5,leadNextMax:.3,rDry:1,dryPasses:2,rWildPlain:1,wildPlain:.2,
  // rGoAlong: on your partner's play, a group of yours that fits exactly and is not a big one (isCtrl) is always played
  rGoAlong:1,
  // from the 27th test round (07-guandan-ai/第27局评语分析.txt), each on (1) or off (0): rPureFit: an exactly fitting group that is
  // pure (no wild card) and not a big one always goes on any opponent's play, at any phase and tier (no more leaving it to the
  // partner by chance); rUrgentLate: an opponent holding urgentOpp cards or fewer puts you in the late-game play, whoever played
  // last; rMateEvid: early game, an ace or more is bombed (tier 1) only once the partner is known to lack anything bigger of that
  // kind (they were the last to play in a trick and did not beat an opponent's play of it); rBombPlain: of the bombs that beat an
  // opponent's, one without a wild card is used when it is at most bombPlainGap levels above the smallest one; rLeadPartner: a lead
  // with no big card to win the lead back in it follows a kind the partner has led
  // from the 28th test round (07-guandan-ai/第28局评语分析.txt): rFourBomb: an opponent left with 4 cards may be holding a bomb, so
  // no bomb on his play unless it is bigger than any bomb that can be out there and the rest of the hand is one play; rFiveLead:
  // an opponent with 7 or 8 cards: lead a five-card group first (he cannot go down to 4 or 5 cards, which may be a bomb); with 9
  // or 10 cards: do not lead one (he would be left with 4 or 5)
  // rMateBomb2: the last hand a bomb and the partner's bomb on the table: leave it, whatever the opponents hold or how few cards they have; rBuildFull: beating a three-with-a-pair, a lone three (not a big pair needed) and the
  // smallest spare pair (a pair, or the pair of another three-with-a-pair, whose three stays) make a play too
  // from the 29th test round (07-guandan-ai/第29局评语分析.txt): rTwoBombs: an opponent's big play (one that wins the lead back) that
  // no group of yours beats, with two bombs or more in hand: bomb it in the middle game, and in the late game always; rSingleLast:
  // leading, a small single is the last choice (bombs aside)
  rTwoBombs:1,rSingleLast:1,
  // rOneBomb: with just one bomb in hand, it is used only in the late game
  rOneBomb:1,
  // rLastGroup: leading with only bombs and one other group in hand, the group goes first, unless an opponent holds as many cards as
  // the group or four cards
  rLastGroup:1,
  // rKeepWild: late game, a play with a wild card is left when the wild card could make a bomb with a pure three in hand and the partner,
  // still to play, beats it at least keepWildMate likely (not when urgent, or when it goes out)
  rKeepWild:1,keepWildMate:.5,
  rMateBomb2:1,rBuildFull:1,rNeverMateBomb:1,
  rFourBomb:1,rFiveLead:1,
  // rInfer: late game (the player who played last, or you, holds 10 cards or fewer), the partner and opponents are worked out
  // from the unseen cards and the way each has played, not by dealing the unseen cards at random (inferSamples deals, each
  // weighed: infAEarly/Mid/Late a pass holding a group that fit, infB a big card played holding a smaller group that fit,
  // infC a lead holding a smaller one of the kind); rMateCant: late game, an ace or more of the opponents' that the partner
  // is unlikely (at most mateCantMax) to beat, with a bomb in hand: bomb it
  rInfer:1,rMateCant:1,mateCantMax:.1,inferSamples:100,infAEarly:.9,infAMid:.6,infALate:.2,infB:.5,infBLate:.8,infC:.7,
  rPureFit:1,rUrgentLate:1,rMateEvid:1,rBombPlain:1,bombPlainGap:6,rLeadPartner:1,
  // rSingleAlong: on a single (the partner's or an opponent's), a lone single of yours of singleAlongMax (an ace) or below that beats
  // it always goes, the smallest one; rLevelFirst: on an opponent's single that a level card beats, if no such lone single can,
  // a level card of yours (not the wild heart) goes, a pair of them broken if need be, so the jokers stay in hand
  rSingleAlong:1,singleAlongMax:14,rLevelFirst:1,
  // rMateTypeLead: leading, after the partner led a pair, three-with-a-pair or straight that an opponent beat and the partner did
  // not take back (the latest such kind first): the smallest play of that kind in hand, ahead of the lead rules of the partner's
  // help, the dry kinds and the usual lead, behind the defence against an opponent down to one, two or five cards
  rMateTypeLead:1,
  // rMateFirstJoker: the first single an opponent plays this round, the partner yet to play to the trick, the single not the small
  // joker, and no single of yours beats it but the big joker: the big joker stays, the partner tries first (unless the tribute
  // shows the partner holds no small joker: he paid a card below it)
  rMateFirstJoker:1,
};
// how good each kind of play is to hold, by its value (runs: their lowest card, 1 = A played low), from self-play in
// 07-guandan-ai (stats.js): how often it wins the lead back, and how often an opponent's smaller one of its kind comes
// along so it can follow; between -1 (a small single: hardly ever wins, rarely gets a chance to follow) and +1, bombs 1-2
const UNIT_SCORE={
  single1:{2:-.94,3:-.8,4:-.66,5:-.55,6:-.44,7:-.36,8:-.28,9:-.18,10:-.11,11:-.03,12:.08,13:.18,14:.25,15:.39,16:.55,17:.77},
  pair2:{2:-.66,3:-.61,4:-.52,5:-.46,6:-.41,7:-.34,8:-.26,9:-.2,10:-.12,11:-.01,12:.08,13:.2,14:.32,15:.48,16:.61,17:.69},
  triple3:{2:0,3:-.05,4:.1,5:.1,6:.08,7:.13,8:.18,9:.2,10:.29,11:.32,12:.27,13:.37,14:.32,15:.18},
  full5:{2:-.65,3:-.48,4:-.36,5:-.24,6:-.16,7:-.09,8:-.01,9:.07,10:.14,11:.2,12:.25,13:.39,14:.45,15:.52},
  straight5:{1:-.46,2:-.3,3:-.18,4:-.08,5:.03,6:.12,7:.2,8:.26,9:.38,10:.59},
  pairs36:{1:-.16,2:-.07,3:-.05,4:.01,5:-.01,6:.05,7:.08,8:.08,9:.15,10:.18,11:.25,12:.28},
  trip26:{1:.26,2:.32,3:.34,4:.29,5:.3,6:.29,7:.32,8:.25,9:.25,10:.22,11:.23,12:.18,13:.13},
  bomb4:{2:1.54,3:1.55,4:1.55,5:1.56,6:1.55,7:1.57,8:1.57,9:1.58,10:1.59,11:1.6,12:1.62,13:1.63,14:1.6,15:1.61},
  bomb5:{2:1.64,3:1.66,4:1.68,5:1.7,6:1.7,7:1.7,8:1.71,9:1.73,10:1.72,11:1.73,12:1.72,13:1.73,14:1.69,15:1.74},
  bomb6:{2:1.91,3:1.91,4:1.91,5:1.92,6:1.93,7:1.93,8:1.95,9:1.95,10:1.96,11:1.98,12:1.98,13:1.99,14:1.97,15:1.97},
  bomb7:{2:1.98,3:2,4:2,5:1.96,6:2,7:2,8:2,9:1.94,10:2,11:1.94,12:2,13:2,14:2},
  bomb8:{2:2,3:2,4:2,5:2,9:2,11:2},
  sflush5:{1:1.8,2:1.82,3:1.85,4:1.83,5:1.85,6:1.85,7:1.87,8:1.88,9:1.91,10:1.94},
  jokers4:{99:2},
};
const unitCost=v=>v>=15?AIP.ucTop:v>=14?AIP.ucA:v>=12?AIP.ucQK:1;
function baseCost(cnt,L){
  const pairs=[],trips=[];let c=0;
  for(let r=2;r<=14;r++){
    const k=cnt[r];if(!k)continue;
    const v=r===L?15:r;
    if(k===1)c+=unitCost(v);else if(k===2)pairs.push(v);else trips.push(v);
  }
  pairs.sort((a,b)=>a-b);
  for(const t of trips){c+=unitCost(t);if(pairs.length&&pairs[0]<AIP.tripPairMax)pairs.shift()}
  for(const p of pairs)c+=unitCost(p);
  return c;
}
function seqCost(cnt,L,depth){
  let best=baseCost(cnt,L);
  if(depth>=2)return best;
  for(const [len,need] of SEQS){
    for(let s=1;s+len-1<=14;s++){
      let ok=true;
      for(let p=s;p<s+len;p++)if(cnt[p===1?14:p]<need){ok=false;break}
      if(!ok)continue;
      for(let p=s;p<s+len;p++)cnt[p===1?14:p]-=need;
      const v=AIP.seqUnit+seqCost(cnt,L,depth+1);
      for(let p=s;p<s+len;p++)cnt[p===1?14:p]+=need;
      if(v<best)best=v;
    }
  }
  return best;
}
function handCost(hand,L){
  const cnt=new Array(15).fill(0);let w=0,sj=0,bj=0;
  for(const c of hand){if(isWild(c,L))w++;else if(c.r===16)sj++;else if(c.r===17)bj++;else cnt[c.r]++}
  let cost=0;
  if(sj+bj===4)cost-=AIP.fourJokers;else{if(sj)cost+=AIP.smallJoker;if(bj)cost+=AIP.bigJoker}
  for(let r=2;r<=14;r++)if(cnt[r]>=4){cost-=AIP.bombBase+AIP.bombExtra*(cnt[r]-4);cnt[r]=0}
  cost+=seqCost(cnt,L,0);
  return cost-AIP.wild*w;
}

/* ---------- arranging the hand (配牌) and its strength (牌力) ---------- */
// the computer splits its hand into plays the way a player sorts their cards: it tries the runs, pairs in a row,
// steel plates and straight flushes the hand allows (a wild card may fill a gap), deals with the rest rank by rank,
// and keeps the arrangement that scores best: the scores of its plays (UNIT_SCORE), less a little for each play
const isSeq=t=>t==='straight'||t==='pairs3'||t==='trip2';
// a play that can win the lead back: a big single, pair, three or run
const isCtrl=u=>u.type==='single'?u.value>=AIP.ctrlSingle:u.type==='pair'?u.value>=AIP.ctrlPair:
  u.type==='triple'||u.type==='full'?u.value>=AIP.ctrlTrip:isSeq(u.type)&&u.value>=AIP.ctrlSeq;
function unitScore(u){
  const t=UNIT_SCORE[u.type+u.n];
  if(!t)return isBomb(u)?2:0;
  if(t[u.value]!==undefined)return t[u.value];
  // a value never seen in self-play: the nearest one
  let best=0,d=99;
  for(const v in t)if(Math.abs(v-u.value)<d){d=Math.abs(v-u.value);best=t[v]}
  return best;
}
function armScore(units,care){
  let s=0;
  for(const u of units)s+=unitScore(u)-(isBomb(u)?0:AIP.armHand+(care&&AIP.rWildPlain&&u.n>1?AIP.wildPlain*(u.wu||0):0));
  return s;
}
const armUnit=(type,value,cards,wu=0)=>({type,value,n:cards.length,cards,wu});
// what is left after the runs, rank by rank: four or more make a bomb, a three takes along the pair that gains most (if any),
// unused wild cards are kept as big singles
function armRest(by,jk,wild,L){
  const units=[],pairs=[],trips=[];
  if(jk.length===4)units.push(armUnit('jokers',99,jk));
  else for(const c of jk)units.push(armUnit('single',c.r,[c])); // two jokers alike are kept as two singles, never a pair
  for(let r=2;r<=14;r++){
    const g=by[r];if(!g||!g.length)continue;
    const v=r===L?15:r;
    if(g.length>=4)units.push(armUnit('bomb',v,g.slice()));
    else if(g.length===3)trips.push(g.slice());
    else if(g.length===2)pairs.push(g.slice());
    else units.push(armUnit('single',v,g.slice()));
  }
  pairs.sort((a,b)=>val(a[0],L)-val(b[0],L));
  for(const t of trips){
    const v=val(t[0],L),alone=unitScore({type:'triple',n:3,value:v});
    let i=-1,gain=0;
    pairs.forEach((q,k)=>{
      const g=unitScore({type:'full',n:5,value:v})+AIP.armHand-alone-unitScore({type:'pair',n:2,value:val(q[0],L)});
      if(g>gain){gain=g;i=k}
    });
    units.push(i>=0?armUnit('full',v,t.concat(pairs.splice(i,1)[0])):armUnit('triple',v,t));
  }
  for(const q of pairs)units.push(armUnit('pair',val(q[0],L),q));
  for(const c of wild)units.push(armUnit('single',15,[c],1));
  return units;
}
// a kept wild card joins whatever it improves most: a single becomes a pair, a pair a three, a three or bomb a bigger bomb
function armWilds(units){
  for(;;){
    const wi=units.findIndex(u=>u.wu&&u.n===1);
    if(wi<0)return units;
    const w=units[wi],rest=units.filter((_,i)=>i!==wi);
    let best=null,bs=armScore(units,1);
    rest.forEach((u,i)=>{
      if(u.value>=16||!['single','pair','triple','bomb'].includes(u.type))return;
      const n=u.n+1,cand=rest.slice();
      cand[i]=armUnit(n===2?'pair':n===3?'triple':'bomb',u.value,u.cards.concat(w.cards),u.wu+1);
      const s=armScore(cand,1);if(s>bs){bs=s;best=cand}
    });
    if(!best)return units;
    units=best;
  }
}
// every run, pair-run, steel plate and straight flush shape: [type, length, cards of each rank, lowest rank, suit]
const ARM_SHAPES=[];
for(const [type,len,need] of [['straight',5,1],['pairs3',3,2],['trip2',2,3]])for(let s=1;s+len-1<=14;s++)ARM_SHAPES.push([type,len,need,s]);
for(const su of SUITS)for(let s=1;s<=10;s++)ARM_SHAPES.push(['sflush',5,1,s,su]);
function arrange(hand,L){
  const wild=hand.filter(c=>isWild(c,L)),jk=hand.filter(c=>c.r>=16),by={};
  for(const c of hand)if(!isWild(c,L)&&c.r<16)(by[c.r]||(by[c.r]=[])).push(c);
  const runs=[];let best=null,bs=-1e9,nodes=0;
  (function dfs(i0,wl){
    const units=runs.concat(armRest(by,jk,wild.slice(0,wl),L));
    const s=armScore(units,1);if(s>bs){bs=s;best=units}
    // each shape may be taken again, but never one listed before the last one taken
    for(let i=i0;i<ARM_SHAPES.length&&nodes<AIP.armNodes;i++){
      const [type,len,need,st,su]=ARM_SHAPES[i];
      let gap=0;
      for(let q=st;q<st+len;q++){
        const g=by[q===1?14:q]||[];
        gap+=su?(g.some(c=>c.s===su)?0:1):Math.max(0,need-g.length);
      }
      if(gap>wl||gap>=len)continue;
      nodes++;
      const cards=[];
      for(let q=st;q<st+len;q++){
        const g=by[q===1?14:q];if(!g)continue;
        if(su){const k=g.findIndex(c=>c.s===su);if(k>=0)cards.push(g.splice(k,1)[0])}
        else cards.push(...g.splice(g.length-Math.min(need,g.length)));
      }
      const all=cards.concat(wild.slice(wl-gap,wl)),a=analyze(all,L).find(a=>a.type===type);
      if(a){runs.push({...a,cards:all,wu:gap});dfs(i,wl-gap);runs.pop()}
      for(const c of cards)by[c.r].push(c);
    }
  })(0,wild.length);
  return armWilds(best);
}
// arranging runs a small search, so each hand is arranged once per round (per set of numbers, while training
// compares two); a new round deals new card objects, so the cache only holds for the round it was made in
let armCache=new WeakMap();
// the test version lets the player rearrange a computer's hand while sorting, and the computer then plays from that
function armPlays(hand,L){return(typeof testArm==='function'&&testArm(hand,L))||armPlaysRaw(hand,L)}
function armPlaysRaw(hand,L){
  let m=armCache.get(AIP);if(!m)armCache.set(AIP,m=new Map());
  const key=L+':'+hand.map(c=>c.id).sort((a,b)=>a-b).join();
  let x=m.get(key);
  if(!x||x.round!==G.hands){if(m.size>500)m.clear();m.set(key,x={round:G.hands,u:arrange(hand,L)})}
  return x.u;
}
// 牌力 1-10: plays that cannot win the lead back count against the hand, bombs for it
// 牌力 0-100: how the arranged hand's score ranks among dealt hands (70 = better than 70 of 100), from self-play
// in 07-guandan-ai (power-dist.js); one entry every 5 points, in between it is interpolated
const POWER_CUTS=[-3.8,-1.13,-.67,-.35,-.09,.15,.36,.56,.75,.93,1.12,1.31,1.51,1.71,1.94,2.18,2.46,2.76,3.15,3.78,10.25];
const handPower=(hand,L)=>scorePower(armScore(armPlays(hand,L)));
// an arrangement's score as 牌力 0-100
function scorePower(s){
  const c=POWER_CUTS;
  if(s<=c[0])return 0;
  for(let i=1;i<c.length;i++)if(s<c[i])return Math.round(5*(i-1+(s-c[i-1])/(c[i]-c[i-1])));
  return 100;
}

/* ---------- AI ---------- */
// the computer plays from its arranged hand; late in the round it may break groups, in the hint order
const restCost=(hand,pl,L)=>handCost(hand.filter(c=>!pl.cards.includes(c)),L);
// card memory: the cards the other three still hold between them (the deck less your hand and everything played),
// and every play they could make from them; pooling the three hands errs on the safe side
function outside(p){
  if(aiSeesAll(p)){
    const plays=[1,2,3].flatMap(k=>genPlays(G.hands[(p+k)%4],G.L));
    return{plays,topBomb:plays.filter(isBomb).reduce((m,x)=>Math.max(m,power(x)),0)};
  }
  const gone=new Set((G.seen||[]).concat(G.hands[p]).map(c=>c.id));
  const plays=genPlays(makeDeck().filter(c=>!gone.has(c.id)),G.L);
  return{plays,topBomb:plays.filter(isBomb).reduce((m,x)=>Math.max(m,power(x)),0)};
}
// the card counter: every card each player has played, rank by rank (the level card counted as its own rank, wild cards
// among it), and what is still out; two decks, so 8 of each rank and 2 of each joker
const TALLY_RANKS=L=>[17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2].filter(k=>k!==L);
const tallyKey=(c,L)=>c.r>=16?c.r:c.r===L?15:c.r;
function tallyPlayed(log,L){
  const per=[{},{},{},{}];
  for(const e of log)if(e.cards)for(const c of e.cards){const k=tallyKey(c,L);(per[e.p][k]||(per[e.p][k]=[])).push(c)}
  return per;
}
// the cards of one rank still out (not played by anyone)
function tallyLeft(log,L,k){
  const gone=new Set();
  for(const e of log)if(e.cards)for(const c of e.cards)gone.add(c.id);
  return makeDeck().filter(c=>tallyKey(c,L)===k&&!gone.has(c.id));
}
// nobody can beat it: for a bomb, no bigger bomb is left; otherwise nothing but a bomb can
const isTop=(pl,o)=>isBomb(pl)?power(pl)>o.topBomb:!o.plays.some(x=>!isBomb(x)&&beats(x,pl));
// 牌力 tier for the round, from the hand as dealt (a player's hand is untouched until their first play)
function tierOf(p){
  const pw=G.pw||(G.pw=[]);
  if(pw[p]===undefined)pw[p]=handPower(G.hands[p],G.L);
  return pw[p]>=AIP.tier1?1:pw[p]>=AIP.tier2?2:pw[p]>=AIP.tier3?3:4;
}
// card memory: how likely the partner holds something (not a bomb) that beats this play, dealing them the unseen cards at random
function mateBeatChance(p,cur){
  if(inferNow(p))return inferMateBeat(p,cur);
  const n=G.hands[(p+2)%4].length;
  if(!n)return 0;
  const gone=new Set((G.seen||[]).concat(G.hands[p]).map(c=>c.id));
  const pool=makeDeck().filter(c=>!gone.has(c.id));
  let k=0;
  for(let t=0;t<AIP.mateSamples;t++){
    for(let i=0;i<n;i++){const j=i+Math.floor(Math.random()*(pool.length-i));[pool[i],pool[j]]=[pool[j],pool[i]]}
    if(genPlays(pool.slice(0,n),G.L).some(x=>!isBomb(x)&&beats(x,cur)))k++;
  }
  return k/AIP.mateSamples;
}
// card memory: how likely an opponent holds anything (a bomb too) that beats this play, dealing the unseen cards at random to the
// other three players by how many cards each holds
function oppBeatChance(p,cur){
  if(inferNow(p))return inferBeat(p,cur,opps(p));
  const gone=new Set((G.seen||[]).concat(G.hands[p]).map(c=>c.id));
  const pool=makeDeck().filter(c=>!gone.has(c.id));
  const ns=[(p+1)%4,(p+2)%4,(p+3)%4].map(i=>G.hands[i].length),need=ns[0]+ns[1]+ns[2];
  if(pool.length<need)return 1; // the memory is short of cards: no telling
  const N=AIP.mateSamples*2;let k=0;
  for(let t=0;t<N;t++){
    for(let i=0;i<need;i++){const j=i+Math.floor(Math.random()*(pool.length-i));[pool[i],pool[j]]=[pool[j],pool[i]]}
    const a=pool.slice(0,ns[0]),b=pool.slice(ns[0]+ns[1],need);
    if(genPlays(a,G.L).some(x=>beats(x,cur))||genPlays(b,G.L).some(x=>beats(x,cur)))k++;
  }
  return k/N;
}
// leading: the two-plays-from-out case, then help a partner about to go out, keep an opponent about to go out from
// getting their kind of play, and otherwise lead from the arranged hand (see pickLead)
// how many tricks a player has won this round (the last player to play before the next lead)
function tricksWon(q){
  const n=[0,0,0,0];let last=-1;
  for(const e of G.log){if(!e.cards)continue;if(e.lead&&last>=0)n[last]++;last=e.p}
  if(G.trick&&G.trick.player===last)return n[q];
  return n[q]+(last===q?1:0);
}
// the partner looks stronger than you: fewer cards (by mateGap), or more tricks won (by mateTricks). Their hand is not seen
const mateStronger=p=>{
  const m=(p+2)%4,n=G.hands[m].length;
  return n>0&&(n+AIP.mateGap<=G.hands[p].length||tricksWon(m)>=tricksWon(p)+AIP.mateTricks);
};
// the plays each player passed on: for every pass over the other team's play (a bomb excepted), the value passed on,
// by the kind of play; and whether the player ever played that kind himself
function passStats(){
  const st=[{},{},{},{}];let top=null;
  for(const e of G.log){
    if(e.cards){top=e;(st[e.p][e.type]||(st[e.p][e.type]={v:[],played:false})).played=true}
    else if(top&&top.p%2!==e.p%2&&top.type!=='bomb'&&top.type!=='sflush'&&top.type!=='jokers')
      (st[e.p][top.type]||(st[e.p][top.type]={v:[],played:false})).v.push(top.value);
  }
  return st;
}
// an opponent who passed on this kind of play at least dryPasses times, on plays no bigger than u, and never played that
// kind, most likely cannot beat u
const dryFor=(st,q,u)=>{const s=st[q][u.type];return!!s&&!s.played&&s.v.filter(v=>v<=u.value).length>=AIP.dryPasses};
function dryUnits(p,pool,st){
  const ops=[(p+1)%4,(p+3)%4].filter(q=>G.hands[q].length);
  return ops.length?pool.filter(u=>ops.every(q=>dryFor(st,q,u))):[];
}
// a weak hand with a stronger partner: lead the kind the partner most likely beats and the next opponent most likely does
// not (the unseen cards dealt at random to the other three); of those, one the opponents pass on first
function mateLead(p,pool,st){
  const m=(p+2)%4,nx=(p+1)%4,ns=[nx,m,(p+3)%4].map(i=>G.hands[i].length),need=ns[0]+ns[1]+ns[2];
  if(!ns[1])return null;
  const gone=new Set((G.seen||[]).concat(G.hands[p]).map(c=>c.id));
  const cards=makeDeck().filter(c=>!gone.has(c.id));
  const open=aiSeesAll(p);
  if(cards.length<need&&!open)return null;
  const by=(a,b)=>a.value-b.value||b.n-a.n,kinds={};
  for(const u of pool)(kinds[u.type+u.n]||(kinds[u.type+u.n]=[])).push(u);
  const firsts=Object.values(kinds).map(g=>g.slice().sort(by)[0]),mc=firsts.map(()=>0),nc=firsts.map(()=>0);
  const N=open?1:AIP.mateSamples;
  for(let t=0;t<N;t++){
    let nh,mh;
    if(open){nh=genPlays(G.hands[nx],G.L);mh=genPlays(G.hands[m],G.L).filter(x=>!isBomb(x))}
    else{
      for(let i=0;i<need;i++){const j=i+Math.floor(Math.random()*(cards.length-i));[cards[i],cards[j]]=[cards[j],cards[i]]}
      nh=genPlays(cards.slice(0,ns[0]),G.L);mh=genPlays(cards.slice(ns[0],ns[0]+ns[1]),G.L).filter(x=>!isBomb(x));
    }
    firsts.forEach((u,i)=>{if(mh.some(x=>beats(x,u)))mc[i]++;if(ns[0]&&nh.some(x=>beats(x,u)))nc[i]++});
  }
  const c=firsts.map((u,i)=>({u,m:mc[i]/N,x:nc[i]/N})).filter(o=>o.m>=AIP.leadMateMin&&o.x<=AIP.leadNextMax);
  if(!c.length)return null;
  const dry=AIP.rDry?c.filter(o=>dryUnits(p,[o.u],st).length):[];
  return(dry.length?dry:c).sort((a,b)=>b.m-b.x-(a.m-a.x)||by(a.u,b.u))[0].u;
}
/* ---------- inferring the other hands (推断) ---------- */
// the unseen cards are dealt to the other three at random many times, each deal fitting what is certain: how many cards
// each holds, and the tribute (a payer holds nothing above the card they paid, wild cards aside; the paid and returned
// cards stay with whoever got them until played). Each deal is then weighed by how well it fits the way each player
// has played: it counts less when they passed on an opponent's play holding a group that fit (rule A), beat with a big
// card holding a smaller group that fit (rule B), or led a kind holding a smaller one of it (rule C)
const RUNS={straight:[5,1],pairs3:[3,2],trip2:[2,3]},SAME={single:1,pair:2,triple:3};
// counts of a hand: c by value (level cards 15), nat by rank (an ace also as 1), w wild cards
function handCounts(cards,L){
  const c=new Array(18).fill(0),nat=new Array(18).fill(0);let w=0;
  for(const x of cards){if(isWild(x,L)){w++;continue}c[val(x,L)]++;nat[x.r]++;if(x.r===14)nat[1]++}
  return{c,nat,w};
}
const addCounts=(a,b)=>({c:a.c.map((x,i)=>x+b.c[i]),nat:a.nat.map((x,i)=>x+b.nat[i]),w:a.w+b.w});
// holds a group of this kind with a value between lo and hi (both left out): exact = a group of just that size and no
// wild card (what the computer plays before the late game); otherwise breaking a group or adding wild cards is fine
function holds(k,type,lo,hi,exact){
  const {c,w}=k,need=SAME[type];
  const ok=(x,m)=>exact?c[x]===m:c[x]>=m&&c[x]<4||x<=15&&c[x]>0&&c[x]<4&&c[x]+w>=m;
  if(need){
    for(let x=lo+1;x<hi&&x<=17;x++)if(ok(x,need))return true;
    return need===1&&!exact&&w>0&&lo<15&&hi>15;
  }
  if(type==='full'){
    for(let x=lo+1;x<hi&&x<=15;x++)if(ok(x,3))for(let y=2;y<=17;y++)if(y!==x&&(exact?c[y]===2:c[y]>=2&&c[y]<4))return true;
    return false;
  }
  const r=RUNS[type];
  if(r){
    const [len,m]=r;
    for(let st=lo+1;st<hi&&st+len-1<=14;st++){
      let gap=0;
      for(let q=st;q<st+len;q++)gap+=Math.max(0,m-k.nat[q]);
      if(gap<=(exact?0:w))return true;
    }
  }
  return false;
}
// the bombs a hand can make, by counts (four or more of a rank, wild cards added; four jokers); straight flushes aside
function bombsOf(k){
  const b=[];
  for(let x=2;x<=15;x++){const c=k.c[x];if(c>=4||c&&c+k.w>=4)b.push({type:'bomb',n:c+k.w,value:x})}
  if(k.c[16]===2&&k.c[17]===2)b.push({type:'jokers',n:4,value:99});
  return b;
}
// can this hand beat the play: a bomb only with a bigger bomb, anything else without a bomb; exact: only with a group
// of just that kind (before the late game the computer does not break a group to beat a play)
const canBeat=(k,pl,exact)=>isBomb(pl)?bombsOf(k).some(b=>beats(b,pl)):holds(k,pl.type,pl.value,99,exact);
// what each player has shown: rule A, B and C events, with the cards they played from then on (they still held them)
function inferEvents(p){
  const ev=[[],[],[],[]],left=[0,1,2,3].map(i=>G.hands[i].length),log=G.log||[];
  for(const e of log)if(e.cards)left[e.p]+=e.cards.length;
  let top=null;
  const known=t=>SAME[t]||t==='full';
  for(let i=0;i<log.length;i++){
    const e=log[i],q=e.p,ph=left[q]>19?0:left[q]>10?1:2;
    if(e.cards&&e.lead)top=null;
    if(q!==p){
      if(!e.cards){if(top&&top.p%2!==q%2&&known(top.e.type))ev[q].push({i,r:'A',type:top.e.type,v:top.e.value,ph})}
      else if(e.lead){if(known(e.type))ev[q].push({i,r:'C',type:e.type,v:e.value,ph})}
      else if(top&&top.p%2!==q%2&&known(e.type)&&e.type===top.e.type)ev[q].push({i,r:'B',type:e.type,v:top.e.value,w:e.value,ph});
    }
    if(e.cards){top={p:q,e};left[q]-=e.cards.length}
  }
  for(let q=0;q<4;q++)for(const x of ev[q]){
    const later=[];for(let j=x.i;j<log.length;j++)if(log[j].p===q&&log[j].cards)later.push(...log[j].cards);
    x.k=handCounts(later,G.L);
  }
  return ev;
}
function eventFactor(x,k){
  const h=addCounts(k,x.k);
  if(x.r==='A')return holds(h,x.type,x.v,99,x.ph<2)?[AIP.infAEarly,AIP.infAMid,AIP.infALate][x.ph]:1;
  if(x.r==='B')return holds(h,x.type,x.v,x.w,true)?(x.ph<2?AIP.infB:AIP.infBLate):1;
  return holds(h,x.type,1,x.v,true)?AIP.infC:1;
}
// weighted deals of the unseen cards to the other three (worked out once per move)
function inferDeals(p){
  // Full hand knowledge bypasses sampled deals and their cache.
  if(aiSeesAll(p))return[{ks:[1,2,3].map(k=>handCounts(G.hands[(p+k)%4],G.L)),w:1}];
  const log=G.log||[],key=p+':'+log.length;
  if(G.inf&&G.inf.key===key&&G.inf.hands===G.hands&&G.inf.aip===AIP)return G.inf.deals;
  const L=G.L,others=[1,2,3].map(k=>(p+k)%4);
  const gone=new Set((G.seen||[]).concat(G.hands[p]).map(c=>c.id));
  const fixed=new Map(),cap=[99,99,99,99];
  for(const t of G.trib||[]){
    if(t.tc){cap[t.g]=Math.min(cap[t.g],val(t.tc,L));if(t.r!==p&&!gone.has(t.tc.id))fixed.set(t.tc.id,t.r)}
    if(t.rc&&t.g!==p&&!gone.has(t.rc.id))fixed.set(t.rc.id,t.g);
  }
  const pool=makeDeck().filter(c=>!gone.has(c.id)),free=pool.filter(c=>!fixed.has(c.id));
  const ev=inferEvents(p),deals=[];
  for(let s=0;s<AIP.inferSamples;s++){
    const hs=[[],[],[]],room=others.map(q=>G.hands[q].length);
    for(const c of pool)if(fixed.has(c.id)){const k=others.indexOf(fixed.get(c.id));if(k>=0&&room[k]>0){hs[k].push(c);room[k]--}}
    for(let i=free.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[free[i],free[j]]=[free[j],free[i]]}
    for(const c of free){
      let el=[0,1,2].filter(k=>room[k]>0&&(isWild(c,L)||val(c,L)<=cap[others[k]]));
      if(!el.length)el=[0,1,2].filter(k=>room[k]>0);
      if(!el.length)break;
      let r=Math.random()*el.reduce((a,k)=>a+room[k],0),k=el[0];
      for(const e of el){if(r<room[e]){k=e;break}r-=room[e]}
      hs[k].push(c);room[k]--;
    }
    const ks=hs.map(h=>handCounts(h,L));
    let w=1;
    others.forEach((q,k)=>{for(const x of ev[q])w*=eventFactor(x,ks[k])});
    deals.push({ks,w});
  }
  G.inf={key,hands:G.hands,aip:AIP,deals};
  return deals;
}
const opps=p=>[(p+1)%4,(p+3)%4];
// how likely any of these players will beat the play (a player with 10 cards or fewer may break a group; against a bomb only
// a bigger bomb counts, otherwise bombs aside)
function inferBeat(p,pl,who){
  const deals=inferDeals(p);let s=0,t=0;
  for(const d of deals){t+=d.w;if(who.some(q=>G.hands[q].length&&canBeat(d.ks[(q-p+3)%4],pl,G.hands[q].length>10)))s+=d.w}
  return t?s/t:0;
}
// the late game: the player who played last, or you, hold 10 cards or fewer
// Full hand knowledge applies at every stage of the round.
const inferNow=p=>aiSeesAll(p)||AIP.rInfer&&(G.hands[p].length<=10||!!G.trick&&G.hands[G.trick.player].length<=10);
// how likely the partner holds a play (not a bomb) over this one, by the inferred hands
function inferMateBeat(p,cur){
  const m=(p+2)%4;
  if(isBomb(cur)||!G.hands[m].length)return 0;
  let s=0,t=0;
  for(const d of inferDeals(p)){t+=d.w;if(holds(d.ks[(m-p+3)%4],cur.type,cur.value,99,false))s+=d.w}
  return t?s/t:0;
}
// plays of a lone three plus the smallest spare pair (not a big one, no wild card): a pair of its own, or the pair of another
// three-with-a-pair, whose three stays. For beating a three-with-a-pair
function builtFulls(units,cur){
  const L=G.L,pairs=[];
  for(const u of units){
    if(u.wu||isBomb(u))continue;
    if(u.type==='pair'&&!isCtrl(u))pairs.push({v:u.value,cards:u.cards});
    else if(u.type==='full'){const q=u.cards.filter(c=>val(c,L)!==u.value);if(q.length===2&&!isCtrl({type:'pair',value:val(q[0],L)}))pairs.push({v:val(q[0],L),cards:q})}
  }
  pairs.sort((a,b)=>a.v-b.v);
  const out=[];
  for(const t of units){
    if(t.type!=='triple'||t.wu||t.value<=cur.value)continue;
    const q=pairs.find(x=>x.v!==t.value&&!x.cards.some(c=>t.cards.includes(c)));
    if(q)out.push({type:'full',value:t.value,n:5,cards:t.cards.concat(q.cards),wu:0});
  }
  return out;
}
// the partner has nothing bigger than this value of a kind: they were the last to play in a trick, and passed on an
// opponent's play of that kind. null when nothing is known
function mateCeilings(p){
  const m=(p+2)%4,lg=G.log||[],out={};
  let top=null,last=null;
  const close=()=>{
    if(top&&last&&last.p===m&&!last.cards&&top.p%2!==m%2&&!isBomb(top)){
      const c=out[top.type];if(c===undefined||top.value<c)out[top.type]=top.value;
    }
  };
  for(const e of lg){
    if(e.cards&&e.lead){close();top=null}
    if(e.cards)top=e;
    last=e;
  }
  return out; // the trick still going is not counted
}
// the partner most likely cannot beat this play
const mateLacks=(p,cur)=>{const c=mateCeilings(p)[cur.type];return c!==undefined&&c<=cur.value};
// of the bombs that beat the opponent's, sorted from the smallest: the smallest, unless that one has a wild card and one
// without is at most bombPlainGap levels above it
function plainBomb(list,L){
  const b=list[0];
  if(!AIP.rBombPlain||!b||!b.wu)return b;
  const lv=bombLevels(L),i=lv.indexOf(power(b));
  return list.find(u=>!u.wu&&lv.indexOf(power(u))-i<=AIP.bombPlainGap)||b;
}
// rMateTypeLead: the kinds (pair, full, straight) the partner led in a trick that an opponent won, the partner making no
// play after his lead (he passed, or never got the turn); latest first, each once
function mateBeatenKinds(p){
  const m=(p+2)%4,lg=G.log||[],out=[];
  let lead=null,mateAgain=false,win=null;
  const close=()=>{
    if(lead&&!mateAgain&&win&&win.p%2!==m%2&&(lead.type==='pair'||lead.type==='full'||lead.type==='straight')){
      const i=out.indexOf(lead.type);if(i>=0)out.splice(i,1);
      out.unshift(lead.type);
    }
  };
  for(const e of lg){
    if(e.cards&&e.lead){close();lead=e.p===m?e:null;mateAgain=false;win=e;continue}
    if(!lead)continue;
    if(e.cards){win=e;if(e.p===m)mateAgain=true}
  }
  close(); // the last trick is over when you lead
  return out;
}
function aiLead(p,units,plays,ph){
  const hand=G.hands[p],L=G.L;
  // nothing in hand but bombs and one other group: that group goes first, unless an opponent holds as many cards as the group
  // or four cards
  if(AIP.rLastGroup){
    const rest=units.filter(u=>!isBomb(u));
    if(rest.length===1&&units.some(isBomb)){
      const oc=[(p+1)%4,(p+3)%4].map(i=>G.hands[i].length).filter(n=>n>0);
      if(!oc.some(n=>n===rest[0].n||n===4))return rest[0];
    }
  }
  // two plays from going out: lead the one nobody can beat, then the other
  if(hand.length<=16){
    let o;
    for(const pl of plays){
      const rest=hand.filter(c=>!pl.cards.includes(c));
      if(analyze(rest,L).length&&isTop(pl,o||(o=outside(p))))return pl;
    }
  }
  // early and middle game the wild cards stay in hand; bombs are led only when nothing else is left
  let pool=units.filter(u=>!isBomb(u)&&!(ph!=='late'&&u.wu));
  if(!pool.length)pool=units.filter(u=>!isBomb(u));
  if(!pool.length)return units.slice().sort((a,b)=>power(a)-power(b))[0];
  const mateLeft=G.hands[(p+2)%4].length;
  const oppMin=Math.min(...[(p+1)%4,(p+3)%4].map(i=>G.hands[i].length||99));
  // an opponent down to five cards: no three-with-a-pair or straight led (they could go out on one)
  if(AIP.rNoFive&&[(p+1)%4,(p+3)%4].some(i=>G.hands[i].length===5)){const q=pool.filter(u=>u.type!=='full'&&u.type!=='straight');if(q.length)pool=q}
  const of=t=>pool.filter(u=>u.type===t);
  if(AIP.rFiveLead){
    const oc=[(p+1)%4,(p+3)%4].map(i=>G.hands[i].length).filter(n=>n>0);
    const five=u=>u.n===5&&(u.type==='full'||u.type==='straight');
    if(oc.some(n=>n===9||n===10)){const q=pool.filter(u=>!five(u));if(q.length)pool=q}
    else if(oc.some(n=>n===7||n===8)){const f=pool.filter(five).sort((a,b)=>a.value-b.value)[0];if(f)return f}
  }
  if(AIP.rFeed){const f=feedMate(p,null);if(f)return f}
  // partner down to one or two cards: hand them the smallest single or pair
  else for(const [n,t] of [[1,'single'],[2,'pair']])if(mateLeft===n&&of(t).length)return of(t).reduce((m,u)=>u.value<m.value?u:m);
  // an opponent down to one or two cards: lead something else, or else the largest of that kind
  for(const [n,t] of [[1,'single'],[2,'pair']])if(oppMin===n){
    const other=pool.filter(u=>u.type!==t);
    if(other.length)return pickLead(other,p);
    return of(t).reduce((m,u)=>u.value>m.value?u:m);
  }
  // the partner led a pair, three-with-a-pair or straight, an opponent beat it and the partner did not take it back: the
  // partner most likely holds a big one of that kind still, so lead the smallest of it (the latest such kind first)
  if(AIP.rMateTypeLead&&mateLeft){
    for(const t of mateBeatenKinds(p)){
      const c=of(t).sort((a,b)=>a.value-b.value||b.n-a.n)[0];
      if(c)return c;
    }
  }
  const st=AIP.rLeadMate||AIP.rDry?passStats():null;
  // a weak hand with a stronger partner helps the partner; then a kind the opponents pass on; then the usual lead
  if(AIP.rLeadMate&&tierOf(p)>=3&&mateStronger(p)){const u=mateLead(p,pool,st);if(u)return u}
  if(AIP.rDry){const d=dryUnits(p,pool,st).sort((a,b)=>a.value-b.value||b.n-a.n)[0];if(d)return d}
  return pickLead(pool,p);
}
// lead the kind of play you are strong in: where a big one can win the lead back, its smallest one goes first;
// otherwise the smallest play that could not win the lead back anyway
function pickLead(pool,p){
  const kinds={};
  for(const u of pool)(kinds[u.type+u.n]||(kinds[u.type+u.n]=[])).push(u);
  let best=null,most=0;
  for(const k in kinds){
    const g=kinds[k].sort((a,b)=>a.value-b.value),small=g.filter(u=>!isCtrl(u)).length;
    if(!small||small===g.length)continue;
    if(small>most||small===most&&g[0].value<best.value){most=small;best=g[0]}
  }
  if(best)return best;
  const by=(a,b)=>a.value-b.value||b.n-a.n;
  // nothing here wins the lead back: follow a kind the partner has led, then the smallest
  if(AIP.rLeadPartner&&p!==undefined){
    const m=(p+2)%4,led=new Set((G.log||[]).filter(e=>e.cards&&e.lead&&e.p===m).map(e=>e.type));
    const f=pool.filter(u=>led.has(u.type)&&!isCtrl(u)).sort(by)[0];
    if(f)return f;
  }
  if(AIP.rSingleLast){
    const ns=pool.filter(u=>u.type!=='single');
    if(ns.length)return ns.filter(u=>!isCtrl(u)).sort(by)[0]||ns.sort(by)[0];
  }
  return pool.filter(u=>!isCtrl(u)).sort(by)[0]||pool.slice().sort(by)[0];
}
// each player has a phase of their own, by the cards in their own hand: early: more than 19; middle: 11 to 19;
// late: 10 or fewer. The computer plays by the phase of the player who played last
const gamePhase=p=>{const n=G.hands[p].length;return n>19?'early':n>10?'mid':'late'};
// a three-with-a-pair goes out with the smallest pair the hand can spare (a free pair, or one arranged with another three),
// the larger pairs kept
function aiDecide(p){
  const pl=aiChoose(p);
  if(!AIP.rSmallPair||!pl||pl.type!=='full'||pl.cards.some(c=>isWild(c,G.L)))return pl;
  const L=G.L,trip=pl.cards.filter(c=>val(c,L)===pl.value);
  const now=pl.cards.filter(c=>!trip.includes(c)),nowV=Math.min(...now.map(c=>val(c,L)));
  if(trip.length!==3||now.length!==2)return pl;
  const units=armPlays(G.hands[p],L),pairs=[];
  for(const u of units){
    if(u.type==='pair'&&u.value<16&&!u.wu)pairs.push(u.cards);
    else if(u.type==='full'&&u!==pl){const q=u.cards.filter(c=>val(c,L)!==u.value);if(q.length===2&&!q.some(c=>isWild(c,L)))pairs.push(q)}
  }
  const best=pairs.filter(q=>val(q[0],L)<nowV&&!q.some(c=>trip.includes(c))).sort((a,b)=>val(a[0],L)-val(b[0],L))[0];
  return best?{...pl,cards:trip.concat(best),wu:trip.filter(c=>isWild(c,L)).length}:pl;
}
// every bomb there can be, from the smallest up: four of a kind (the level card above the ace), five, the straight
// flushes, six, seven, eight of a kind, the four jokers; a bomb's level is its place in this order
function bombLevels(L){
  const pw=[];
  for(let n=4;n<=8;n++)for(let r=2;r<=14;r++)pw.push(n*100+(r===L?15:r));
  for(let v=1;v<=10;v++)pw.push(550+v);
  pw.push(10000);
  return pw.sort((a,b)=>a-b);
}
// the opponent's bomb on the table: {pl} to bomb it with, {} to let it go, or null when these rules do not decide
function bombBack(p,units,cur,winLeft,ph,mateYet){
  const mine=units.filter(isBomb),over=mine.filter(u=>beats(u,cur)).sort((a,b)=>power(a)-power(b));
  if(!over.length)return null;
  const b=plainBomb(over,G.L),lv=bombLevels(G.L),up=lv.indexOf(power(b))-lv.indexOf(power(cur));
  if(mine.length===1){
    if(ph!=='late')return{};
    if(winLeft<=AIP.bbOneLeft)return{pl:b};
    if(mateYet()&&up>=AIP.bbOneFar)return{};
    return null;
  }
  if(mine.length===2){
    if(up<=AIP.bbTwoNear)return{pl:b};
    if(winLeft>=AIP.bbTwoFarMin)return{};
    return null;
  }
  return{pl:b};
}
// the cards p has not seen: the other three hands together
function unseenOf(p){
  const gone=new Set((G.seen||[]).concat(G.hands[p]).map(c=>c.id));
  return makeDeck().filter(c=>!gone.has(c.id));
}
// whether the unseen cards could make a play of this kind above value v (wild cards filling in): a single, a pair, a
// three-with-a-pair, a straight
function couldMake(pool,type,v){
  const L=G.L,cnt={},rc={},w=pool.filter(c=>isWild(c,L)).length;
  for(const c of pool)if(!isWild(c,L)){const x=val(c,L);cnt[x]=(cnt[x]||0)+1;if(c.r<16)rc[c.r]=(rc[c.r]||0)+1}
  const has=(x,k)=>(cnt[x]||0)+(x<16?w:0)>=k;
  if(type==='single')return pool.some(c=>val(c,L)>v);
  if(type==='pair'){for(let x=Math.floor(v)+1;x<=17;x++)if(has(x,2))return true;return false}
  if(type==='full'){
    for(let t=Math.floor(v)+1;t<=15;t++)if(has(t,3))for(let q=2;q<=17;q++)if(q!==t&&(cnt[q]||0)>=2)return true;
    return false;
  }
  if(type==='straight'){
    for(let s=Math.floor(v)+1;s<=10;s++){let gap=0;for(let q=s;q<s+5;q++)if(!rc[q===1?14:q])gap++;if(gap<=w)return true}
    return false;
  }
  return false;
}
// your partner (3 if you are 1) down to one, two or five cards: a play they may go out on, led or played over the
// opponent's, never one they surely cannot beat (judged from the unseen cards). 2 is the opponent who plays between you.
// Partner 1 card: the smallest single (the largest such, when 2 is down to one card too). Partner 2 cards: the smallest
// pair, unless 2 also holds two that may be a pair. Partner 5 cards: the smallest three-with-a-pair or straight, unless 2
// also holds five that may be one play (4 holding five does not stop it: your partner plays first). null: nothing to hand
// over, play as usual
function feedMate(p,cur){
  const m=(p+2)%4,nx=(p+1)%4,mn=G.hands[m].length,xn=G.hands[nx].length;
  if(mn!==1&&mn!==2&&mn!==5)return null;
  const L=G.L,pool=unseenOf(p),hand=G.hands[p];
  const inBomb=new Set(armPlays(hand,L).filter(isBomb).flatMap(u=>u.cards.map(c=>c.id)));
  const all=genPlays(hand,L).filter(x=>!isBomb(x)&&!x.cards.some(c=>inBomb.has(c.id))&&beats(x,cur));
  if(aiSeesAll(p)){
    const mate=genPlays(G.hands[m],L).filter(x=>x.n===mn&&!isBomb(x));
    const next=genPlays(G.hands[nx],L).filter(x=>x.n===xn);
    const fits=all.filter(x=>mate.some(y=>beats(y,x))&&!next.some(y=>beats(y,x)));
    return fits.sort((a,b)=>a.value-b.value||b.n-a.n)[0]||null;
  }
  const pick=(types,largest)=>{
    const c=all.filter(x=>types.includes(x.type)&&couldMake(pool,x.type,x.value)).sort((a,b)=>a.value-b.value||b.n-a.n);
    return c.length?c[largest?c.length-1:0]:null;
  };
  if(mn===1)return pick(['single'],xn===1);
  if(mn===2)return xn===2&&couldMake(pool,'pair',0)?null:pick(['pair']);
  if(xn===5&&(couldMake(pool,'full',0)||couldMake(pool,'straight',0)))return null;
  return pick(['full','straight']);
}
// rSingleAlong: on a single, the smallest lone single of the arranged hand (no wild card, not a bomb) that beats it and is
// singleAlongMax (an ace) or below; null when there is none
function smallSingle(units,cur){
  if(!cur||cur.type!=='single')return null;
  return units.filter(u=>u.type==='single'&&!isBomb(u)&&!u.wu&&u.value<=AIP.singleAlongMax&&beats(u,cur)).sort((a,b)=>a.value-b.value)[0]||null;
}
function aiChoose(p){
  const hand=G.hands[p],L=G.L,cur=G.trick?G.trick.play:null;
  tierOf(p); // fixed on the hand as dealt, before the first play
  let plays=genPlays(hand,L).filter(pl=>beats(pl,cur));
  if(!plays.length)return null;
  const fin=plays.find(pl=>pl.cards.length===hand.length);
  // going out wins, except when the way out is the last bomb and your partner's play on the table cannot be beaten: the
  // bomb stays in hand, a sure way out for later
  // never bomb the partner's play: not even with the last hand
  if(fin&&AIP.rNeverMateBomb&&cur&&isBomb(fin)&&G.trick.player!==p&&G.trick.player%2===p%2)return null;
  if(fin&&AIP.rMateBomb&&cur&&isBomb(fin)&&G.trick.player!==p&&G.trick.player%2===p%2&&
    (isBomb(cur)?AIP.rMateBomb2:G.hands[(p+1)%4].length>AIP.mateBombOppMin&&G.hands[(p+3)%4].length>AIP.mateBombOppMin&&oppBeatChance(p,cur)<=AIP.mateBombMax))return null;
  if(fin)return fin;
  // the phase is the one of whoever played last (the player holding the table), partner or opponent alike; leading,
  // with nobody on the table, it is your own
  let ph=gamePhase(cur?G.trick.player:p);let units=armPlays(hand,L);
  if(!cur)return aiLead(p,units,plays,ph);
  if(AIP.rBuildFull&&cur.type==='full'&&G.trick.player%2!==p%2)units=units.concat(builtFulls(units,cur));

  const winner=G.trick.player;
  if(winner%2===p%2){
    // your partner's single or pair of 10 or below, and the opponent next to play is down to a few cards: top it with
    // an ace or the level card (breaking a pair if need be), so they cannot slip a small card through
    const nx=(p+1)%4;
    if(AIP.rTopMate&&(cur.type==='single'||cur.type==='pair')&&cur.value<=AIP.smallMax&&G.hands[nx].length&&G.hands[nx].length<=AIP.topMateNextMax){
      const top=plays.filter(x=>x.type===cur.type&&x.n===cur.n&&!isBomb(x)&&!x.wu&&x.value>=14&&x.value<=15).sort((a,b)=>a.value-b.value)[0];
      if(top)return top;
    }
    // your partner's single: a lone single of yours up to an ace that beats it always goes along (the ace too)
    if(AIP.rSingleAlong){const s=smallSingle(units,cur);if(s)return s}
    // your partner's play is on the table: a big one needs no help, but a group of yours that fits exactly and is not a big
    // one (no wild card in it) always goes along, e.g. their 5, the opponent before you passed, your J
    if(AIP.rGoAlong){
      const along=units.filter(u=>!isBomb(u)&&!u.wu&&u.type===cur.type&&u.n===cur.n&&beats(u,cur)&&!isCtrl(u)).sort((a,b)=>a.value-b.value)[0];
      if(along)return along;
    }
    return null; // let partner's cards ride
  }
  const winLeft=G.hands[winner].length;
  const oppMin=Math.min(...[(p+1)%4,(p+3)%4].map(i=>G.hands[i].length||99));
  const urgent=winLeft<=AIP.urgentWin||oppMin<=AIP.urgentOpp;
  // an opponent about to go out: the late-game play (break groups, bomb, wild cards), whoever played last
  if(AIP.rUrgentLate&&oppMin<=AIP.urgentOpp)ph='late';
  let o;const out=()=>o||(o=outside(p));
  const t=tierOf(p);
  // the partner still gets to play to this trick (the opponent who leads it sits just before you)
  const mateAfter=winner===(p+3)%4&&G.hands[(p+2)%4].length>0;
  let mb;const mateCan=()=>mateAfter&&(mb===undefined?mb=mateBeatChance(p,cur)>=AIP.mateBeatProb:mb);
  // your partner about to go out: a play over the opponent's that they may beat with their last cards
  if(AIP.rFeed){const f=feedMate(p,cur);if(f)return f}
  // your partner led a small single, an opponent beat it and your partner plays again after you: they most likely hold the
  // big joker (it is not in your hand and has not been played), so a joker of yours stays in hand
  const lead=(()=>{for(let i=G.log.length-1;i>=0;i--)if(G.log[i].cards&&G.log[i].lead)return G.log[i];return null})();
  const mateLed=lead&&lead.p===(p+2)%4&&lead.type==='single'&&lead.value<=AIP.smallMax&&mateAfter&&winLeft>AIP.urgentWin;
  const bigUnseen=hand.filter(c=>c.r===17).length+(G.seen||[]).filter(c=>c.r===17).length<2;
  const keepJoker=pl=>AIP.rMateJoker&&mateLed&&pl.value>=16&&bigUnseen;
  // your partner has not yet had a turn in this trick (and is still in the round)
  const mateYet=()=>{
    const m=(p+2)%4;if(!G.hands[m].length)return false;
    for(let i=G.log.length-1;i>=0;i--){if(G.log[i].p===m)return false;if(G.log[i].cards&&G.log[i].lead)break}
    return true;
  };
  // an opponent left with 4 cards: no bomb on his play, unless it is bigger than any bomb that can be out there and it leaves
  // one play in the hand
  const four=b=>AIP.rFourBomb&&winLeft===4&&!(isTop(b,out())&&restCost(hand,b,L)<=1);
  // the first single an opponent plays this round, the partner yet to play to this trick, the table's single not the small joker,
  // and nothing of yours beats it but the big joker (unless the tribute shows the partner holds no small joker): the big joker
  // stays in hand, the partner tries first
  if(AIP.rMateFirstJoker&&cur.type==='single'&&cur.value<16&&mateYet()){
    const mine=cur.cards||[];
    const firstSingle=!(G.log||[]).some(e=>e.cards&&e.type==='single'&&e.p%2!==p%2&&!e.cards.some(c=>mine.some(x=>x.id===c.id)));
    const m=(p+2)%4;
    // a payer pays the biggest card they hold (wild cards aside): one below the small joker means no jokers at all
    const mateNoSmall=(G.trib||[]).some(t=>t.g===m&&t.tc&&val(t.tc,L)<16);
    const singles=plays.filter(x=>x.type==='single');
    if(firstSingle&&!mateNoSmall&&singles.length&&singles.every(x=>x.cards[0].r===17)){
      plays=plays.filter(x=>x.type!=='single'||x.cards[0].r!==17);
      units=units.filter(u=>u.type!=='single'||u.cards[0].r!==17);
      if(!plays.length)return null;
    }
  }
  // an opponent's bomb: the bomb rules from the player's comments decide first (the older rules only where they say nothing)
  if(AIP.rBombBack&&isBomb(cur)){const d=bombBack(p,units,cur,winLeft,ph,mateYet);if(d)return d.pl&&four(d.pl)?null:d.pl||null}
  // an opponent's single: a lone single of yours up to an ace that beats it always goes (the smallest); failing that a level card
  // goes before any joker, at any phase and however many cards or level cards are in hand
  if(AIP.rSingleAlong){const s=smallSingle(units,cur);if(s)return s}
  if(AIP.rLevelFirst&&cur.type==='single'&&cur.value<15){
    const lv=plays.find(x=>x.type==='single'&&x.cards.length===1&&x.cards[0].r===L&&!isWild(x.cards[0],L));
    if(lv)return lv;
  }
  // a pure group that fits exactly and is not a big one always goes along, at any phase
  if(AIP.rPureFit){
    const pure=units.filter(u=>!isBomb(u)&&!u.wu&&u.type===cur.type&&u.n===cur.n&&beats(u,cur)&&!isCtrl(u)).sort((a,b)=>a.value-b.value)[0];
    if(pure)return pure;
  }
  // a group of the arranged hand that fits exactly: the smallest one (no wild cards before the late game)
  const early=ph!=='late';
  const twoBombs=units.filter(isBomb).length>=2;
  // a single bomb is kept for the late game (the player who played last holding 10 cards or fewer; your own cards do not count)
  const keepOne=AIP.rOneBomb&&units.filter(isBomb).length===1;
  // a wild card that could make a bomb with a pure three in hand stays when the partner, still to play, is likely to beat it
  const keepWildFor=pl=>{
    if(!AIP.rKeepWild||urgent||!mateAfter||ph!=='late'||pl.cards.length>=hand.length||!pl.cards.some(c=>isWild(c,L)))return false;
    const cnt={};for(const c of hand)if(!isWild(c,L)&&c.r<16)cnt[c.r]=(cnt[c.r]||0)+1;
    return Object.values(cnt).some(n=>n===3)&&inferMateBeat(p,cur)>=AIP.keepWildMate;
  };
  const fit=units.filter(u=>!isBomb(u)&&u.type===cur.type&&u.n===cur.n&&beats(u,cur)&&!(early&&u.wu)).sort((a,b)=>a.value-b.value)[0];
  if(fit&&keepJoker(fit))return null;
  if(fit){
    let ok=!keepWildFor(fit);
    if(early){
      // in the middle game, with your partner still to play after this opponent, you may leave it to them
      // (tier 1 never does, tiers 3 and 4 more often)
      const leave=t===1?0:t>=3?AIP.leaveWeak:AIP.midLeaveProb;
      // early game, an opponent's single below an ace that only a joker of yours beats (no single of yours that could
      // follow it out), and your partner yet to play to this trick: the joker stays in hand
      if(AIP.rKeepBig&&ph==='early'&&fit.type==='single'&&fit.value>=16&&cur.value<14&&mateYet()&&
        !units.some(u=>u.type==='single'&&u.value<16&&beats(u,cur)))ok=false;
      else if(!AIP.rPureFit&&ph==='mid'&&mateAfter&&Math.random()<leave)ok=false;
      else if(isCtrl(fit)&&Math.random()<AIP.saveCtrlProb)ok=false;
    }
    if(ok)return fit;
  }
  if(early){
    // early and middle game: nothing that breaks a group; a bomb only when it nearly finishes the hand
    // (tier 1 also bombs an ace or more), and not when the partner can most likely beat it
    const b=units.filter(u=>isBomb(u)&&!u.wu&&beats(u,cur)).sort((a,b)=>power(a)-power(b))[0];
    const twoMid=AIP.rTwoBombs&&ph==='mid'&&twoBombs&&!isBomb(cur)&&isCtrl(cur);
    return b&&(restCost(hand,b,L)<=AIP.bombRest||twoMid||t===1&&cur.value>=AIP.bombBigVal&&(!AIP.rMateEvid||ph!=='early'||mateLacks(p,cur)))&&!mateCan()&&!four(b)&&!keepOne?b:null;
  }
  // late game: break groups if need be, in the hint order, and bomb when it matters
  const base=handCost(hand,L);
  const order=hintOrder(hand,L,cur,plays);
  const normal=order.filter(pl=>!isBomb(pl));
  if(normal.length){
    const b={pl:normal[0]},delta=restCost(hand,b.pl,L)-base;
    if(keepJoker(b.pl))return null;
    let ok=delta<=AIP.followFree||urgent||(delta<=AIP.followMaybe&&Math.random()<AIP.followMaybeProb);
    if(ok&&b.pl.value>=16&&cur.value<AIP.saveJokerCurBelow&&!urgent&&hand.length>AIP.saveJokerHand&&Math.random()<AIP.saveJokerProb)ok=false;
    const keepWild=keepWildFor(b.pl);
    if(keepWild)ok=false;
    // a play nobody can beat wins the lead back, so it is worth more
    if(!ok&&!keepWild&&delta<=AIP.topFree&&isTop(b.pl,out()))ok=true;
    if(ok)return b.pl;
  }
  const bombs=order.filter(isBomb);
  if(bombs.length){
    let pb=plainBomb(bombs.slice().sort((a,b)=>power(a)-power(b)),L)||bombs[0];
    // a bomb that beats it by four of a bigger group of the same rank (four aces out of five): the whole group goes, not four and a single left
    const whole=pb.type==='bomb'&&!pb.wu?bombs.filter(u=>u.type==='bomb'&&!u.wu&&u.value===pb.value&&u.n>pb.n).sort((a,b)=>b.n-a.n)[0]:null;
    if(whole)pb=whole;
    const b={pl:pb,rc:restCost(hand,pb,L)};
    // left after the bomb: a small single hard to get rid of, while an opponent still holds many cards (and may bomb
    // back): then "nearly out" is no reason to bomb yet
    const rest=hand.filter(c=>!b.pl.cards.includes(c)),cnt={};
    for(const c of rest)if(!isWild(c,L)&&c.r<16)cnt[c.r]=(cnt[c.r]||0)+1;
    const smallLeft=rest.some(c=>!isWild(c,L)&&c.r<16&&cnt[c.r]===1&&val(c,L)<=AIP.smallMax);
    const many=Math.max(...[(p+1)%4,(p+3)%4].map(i=>G.hands[i].length))>AIP.lateBombOppMax;
    const nearOut=b.rc<=AIP.bombRest&&!(AIP.rLateBomb&&smallLeft&&many);
    // tier 1 bombs an ace or more every time; tier 4 keeps its bombs for an opponent about to go out
    // an ace or more that the partner, still to play, is unlikely to beat: the lead comes back with a bomb
    const mateCant=AIP.rMateCant&&mateAfter&&!isBomb(cur)&&cur.value>=AIP.bombBigVal&&inferMateBeat(p,cur)<=AIP.mateCantMax;
    const twoLate=AIP.rTwoBombs&&twoBombs&&!isBomb(cur)&&isCtrl(cur);
    const want=twoLate||mateCant||winLeft<=AIP.bombWinLeft||nearOut||t<4&&((isBomb(cur)&&winLeft<=AIP.bombOverBomb)||
      (cur.value>=AIP.bombBigVal&&(t===1||Math.random()<AIP.bombBigProb))||(b.rc<=AIP.safeBombRest&&isTop(b.pl,out())));
    // a bomb that uses a wild card is left sooner for the partner: at keepWildMate likely rather than mateBeatProb
    const wildBomb=AIP.rKeepWild&&b.pl.cards.some(c=>isWild(c,L))&&mateAfter&&inferMateBeat(p,cur)>=AIP.keepWildMate;
    if(want&&(twoLate||!mateCan()&&!wildBomb)&&!four(b.pl))return b.pl;
  }
  return null;
}
function aiReturnCard(hand,L){
  let pool=hand.filter(c=>c.r<=10&&!isWild(c,L)&&c.r!==L);
  if(!pool.length)pool=hand.filter(c=>c.r<=10&&!isWild(c,L));
  if(!pool.length)pool=hand.filter(c=>!isWild(c,L)&&c.r<16);
  if(!pool.length)pool=hand.slice();
  let best=null,bs=1e9;
  for(const c of pool){
    const sc=handCost(hand.filter(x=>x!==c),L)+val(c,L)*.01;
    if(sc<bs){bs=sc;best=c}
  }
  return best;
}
const tributeCard=(hand,L)=>hand.filter(c=>!isWild(c,L)).reduce((m,c)=>!m||val(c,L)>val(m,L)?c:m,null);

