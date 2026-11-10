// web/src/ai/turn-timing.mjs
var TURN_MS = 6e4;
var REASON_MS = 5e4;
var HARD_MS = 52e3;

// web/src/ai/search/constants.mjs
var SEARCH_BOT_V1 = Object.freeze({
  lo: 21,
  hi: 40,
  worlds: 8,
  k: 6,
  net: 2,
  endgameHi: 20,
  endgameWorlds: 8,
  minWorlds: 4,
  tieTolerance: 1e-9,
  solverMaxNodes: 15e5,
  worldSeed: "(seed*1009 + ply*7919)>>>0"
});
function searchBand(cards, params = SEARCH_BOT_V1) {
  if (cards >= params.lo && cards <= params.hi) return "midgame";
  if (cards <= params.endgameHi) return "endgame";
  return null;
}
var SEARCH_BUDGETS = Object.freeze({
  desktop: Object.freeze({
    midgameMs: REASON_MS,
    endgameMs: REASON_MS,
    solverMs: 3e3,
    solverTable: 3e5
  }),
  mobile: Object.freeze({
    midgameMs: REASON_MS,
    endgameMs: REASON_MS,
    solverMs: 3e3,
    solverTable: 1e5
  })
});
var hardTimeoutMs = (budget) => Math.max(budget.midgameMs, budget.endgameMs) + (HARD_MS - REASON_MS);
var FIRST_LOAD_WAIT_MS = 1e4;

// web/src/ai/search/client.js
var PREEMPT_MS = 500;
function deviceClass(nav = globalThis.navigator) {
  if (!nav) return "desktop";
  if (nav.userAgentData?.mobile) return "mobile";
  if (/Mobi|iPhone|iPad|iPod|Android/i.test(nav.userAgent || "")) return "mobile";
  if (nav.platform === "MacIntel" && nav.maxTouchPoints > 1) return "mobile";
  if (Number.isFinite(nav.hardwareConcurrency) && nav.hardwareConcurrency <= 4) return "mobile";
  if (Number.isFinite(nav.deviceMemory) && nav.deviceMemory <= 4) return "mobile";
  return "desktop";
}
function createSearchClient({
  version,
  device = deviceClass(),
  spawn,
  now = () => performance.now()
} = {}) {
  const budget = SEARCH_BUDGETS[device];
  const reasonMs = Math.min(REASON_MS, Math.max(budget.midgameMs, budget.endgameMs));
  let worker = null, requestId = 0, initialized = null, loadedBot = null, active = null, preemptTimer = null;
  const queue = [];
  const stats = {
    device,
    budget,
    firstLoadWaitMs: FIRST_LOAD_WAIT_MS,
    hardTimeoutMs: hardTimeoutMs(budget),
    requests: 0,
    searched: 0,
    differs: 0,
    fallbacks: {},
    ms: [],
    coach: { requests: 0, searched: 0, fallbacks: {}, ms: [], preempted: 0 }
  };
  const create = spawn || (() => {
    const url = new URL("./assets/search-worker.mjs", document.baseURI);
    url.searchParams.set("v", version);
    return new Worker(url, { type: "module" });
  });
  function kill() {
    clearTimeout(preemptTimer);
    preemptTimer = null;
    worker?.terminate();
    worker = null;
    initialized = null;
  }
  function stop(reason) {
    kill();
    const jobs = [active, ...queue.splice(0)].filter(Boolean);
    active = null;
    for (const job of jobs) {
      clearTimeout(job.timer);
      job.reject(new Error(reason));
    }
  }
  function abandon(job, reason) {
    if (active !== job) return;
    kill();
    active = null;
    clearTimeout(job.timer);
    job.reject(new Error(reason));
    if (queue.length && loadedBot) void init(loadedBot).catch(() => {
    });
    pump();
  }
  function ensureWorker() {
    if (worker) return;
    worker = create();
    worker.onmessage = ({ data }) => {
      const job = active;
      if (!job || data.id !== job.id) return;
      clearTimeout(job.timer);
      clearTimeout(preemptTimer);
      preemptTimer = null;
      active = null;
      if (data.error) job.reject(new Error(data.error));
      else job.resolve(data.result);
      pump();
    };
    worker.onerror = () => stop("search-worker-error");
  }
  function pump() {
    if (active || !queue.length) return;
    let index = queue.findIndex((job2) => job2.owner !== "coach");
    if (index < 0) index = 0;
    const [job] = queue.splice(index, 1);
    if (job.deadline !== void 0) {
      const remainingMs = job.deadline - now();
      if (remainingMs <= 0) {
        clearTimeout(job.timer);
        job.reject(new Error("search-budget"));
        pump();
        return;
      }
      job.message = { ...job.message, remainingMs };
    }
    ensureWorker();
    active = job;
    job.id = ++requestId;
    if (job.timeout !== void 0)
      job.timer = setTimeout(
        () => job.owner === "coach" ? abandon(job, "search-timeout") : stop("search-timeout"),
        job.timeout
      );
    worker.postMessage({ id: job.id, ...job.message });
  }
  function call(message, timeout, owner = "table", front = false) {
    return new Promise((resolve, reject) => {
      const job = { message, timeout, owner, resolve, reject };
      if (front) queue.unshift(job);
      else queue.push(job);
      pump();
    });
  }
  function tableCall(message, deadline, expires) {
    return new Promise((resolve, reject) => {
      const job = { message, owner: "table", deadline, resolve, reject };
      job.timer = setTimeout(
        () => {
          if (active === job) return stop("search-timeout");
          const index = queue.indexOf(job);
          if (index >= 0) queue.splice(index, 1);
          reject(new Error("search-timeout"));
        },
        Math.max(0, expires - now())
      );
      queue.push(job);
      pump();
    });
  }
  function init(bot) {
    if (!initialized) {
      loadedBot = bot;
      initialized = call({ type: "init", bot, budget }, 6e4, "init", true).catch((error) => {
        initialized = null;
        throw error;
      });
    }
    return initialized;
  }
  function yieldToTable() {
    for (let i = queue.length - 1; i >= 0; i--)
      if (queue[i].owner === "coach") queue.splice(i, 1)[0].reject(new Error("search-preempted"));
    if (active?.owner !== "coach" || preemptTimer) return;
    const job = active;
    if (!job.cancelled) worker.postMessage({ type: "cancel", id: job.id });
    job.cancelled = true;
    stats.coach.preempted++;
    preemptTimer = setTimeout(() => abandon(job, "search-preempted"), PREEMPT_MS);
  }
  function cancelActiveCoach() {
    if (active?.owner !== "coach" || active.cancelled) return;
    active.cancelled = true;
    worker.postMessage({ type: "cancel", id: active.id });
  }
  async function ready(bot, limit = Infinity) {
    const loading = init(bot);
    loading.catch(() => {
    });
    let timer;
    await Promise.race([
      loading,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(Error("search-loading")),
          Math.max(0, Math.min(FIRST_LOAD_WAIT_MS, limit))
        );
      })
    ]).finally(() => clearTimeout(timer));
  }
  const reasonOf = (error) => /timeout/.test(error.message) ? "timeout" : error.message === "search-loading" ? "loading" : error.message === "search-budget" ? "budget" : error.message === "search-preempted" ? "preempted" : "error";
  function fallback(reason, extra = {}, bucket = stats) {
    bucket.fallbacks[reason] = (bucket.fallbacks[reason] || 0) + 1;
    return { fallback: true, reason, ...extra };
  }
  return {
    stats,
    /** Load the networks ahead of the first decision; failures are retried later. */
    warm(bot) {
      void init(bot).catch(() => {
      });
    },
    /**
     * One table decision. `startedAt` (same clock as `now`) is when the seat's turn started on
     * the host; the search ends by startedAt + 50 s and the reply is given up at startedAt + 52 s.
     */
    async decide(bot, payload, { startedAt = now() } = {}) {
      stats.requests++;
      yieldToTable();
      const deadline = startedAt + reasonMs, expires = startedAt + hardTimeoutMs(budget);
      let result;
      try {
        await ready(bot, deadline - now());
        result = await tableCall({ type: "search", payload }, deadline, expires);
      } catch (error) {
        return fallback(reasonOf(error), { message: error.message });
      }
      if (!result?.ok) return fallback(result?.reason || "error", result || {});
      stats.searched++;
      if (result.index !== result.championIndex) stats.differs++;
      stats.ms.push(Math.round(result.ms));
      if (stats.ms.length > 500) stats.ms.shift();
      return result;
    },
    /**
     * Move-coach values for the human player's own turn (same worlds, settings and budgets as
     * the table bot). Resolves to {ok, kind, plays, base, values, ...} or {fallback, reason}.
     */
    async evaluate(bot, payload) {
      const bucket = stats.coach;
      bucket.requests++;
      for (let i = queue.length - 1; i >= 0; i--)
        if (queue[i].owner === "coach") queue.splice(i, 1)[0].reject(new Error("search-preempted"));
      cancelActiveCoach();
      let result;
      try {
        await ready(bot);
        result = await call({ type: "coach", payload }, hardTimeoutMs(budget), "coach");
      } catch (error) {
        return fallback(reasonOf(error), { message: error.message }, bucket);
      }
      if (!result?.ok) return fallback(result?.reason || "error", {}, bucket);
      bucket.searched++;
      bucket.ms.push(Math.round(result.ms));
      if (bucket.ms.length > 200) bucket.ms.shift();
      return result;
    },
    /** The coach was switched off: stop its work without disturbing table jobs. */
    cancelCoach() {
      for (let i = queue.length - 1; i >= 0; i--)
        if (queue[i].owner === "coach") queue.splice(i, 1)[0].reject(new Error("search-cancelled"));
      cancelActiveCoach();
    }
  };
}

// web/src/core/cards.js
var SUITS = ["S", "H", "C", "D"];
var SEQS = [
  [5, 1],
  [3, 2],
  [2, 3]
];
var isWild = (c, L) => c.s === "H" && c.r === L;
function makeDeck() {
  const d = [];
  let id = 0;
  for (let k = 0; k < 2; k++) {
    for (const s of SUITS) for (let r = 2; r <= 14; r++) d.push({ id: id++, s, r });
    d.push({ id: id++, s: "J", r: 16 });
    d.push({ id: id++, s: "J", r: 17 });
  }
  return d;
}

// web/src/core/combinations.js
var isBomb = (p) => p.type === "bomb" || p.type === "sflush" || p.type === "jokers";
var power = (p) => p.type === "jokers" ? 1e4 : p.type === "sflush" ? 550 + p.value : p.n * 100 + p.value;
var strength = (p) => isBomb(p) ? 1e5 + power(p) : p.value;
function seqStarts(nat, w, len, need) {
  const out = [];
  if (nat.length + w !== len * need) return out;
  for (let s = 1; s + len - 1 <= 14; s++) {
    const cnt = {};
    let ok = true;
    for (const c of nat) {
      let p = c.r;
      if (p === 14 && s === 1) p = 1;
      if (p < s || p > s + len - 1) {
        ok = false;
        break;
      }
      cnt[p] = (cnt[p] || 0) + 1;
      if (cnt[p] > need) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(s);
  }
  return out;
}
function analyze(cards, L) {
  const n = cards.length, res = [];
  if (!n) return res;
  const wild = cards.filter((c) => isWild(c, L)), rest = cards.filter((c) => !isWild(c, L));
  const w = wild.length;
  const jok = rest.filter((c) => c.r >= 16), nat = rest.filter((c) => c.r < 16);
  const cnt = {};
  for (const c of nat) cnt[c.r] = (cnt[c.r] || 0) + 1;
  const ranks = Object.keys(cnt).map(Number);
  const v = (r) => r >= 16 ? r : r === L ? 15 : r;
  const add = (type, value) => res.push({ type, value, n });
  if (jok.length) {
    if (n === 1) add("single", jok[0].r);
    else if (n === 2 && jok.length === 2 && jok[0].r === jok[1].r) add("pair", jok[0].r);
    else if (n === 4 && jok.length === 4) add("jokers", 99);
    else if (n === 5 && jok.length === 2 && jok[0].r === jok[1].r && ranks.length === 1 && nat.length + w === 3)
      add("full", v(ranks[0]));
    return res;
  }
  if (ranks.length <= 1) {
    const sv = ranks.length ? v(ranks[0]) : 15;
    if (n === 1) add("single", sv);
    else if (n === 2) add("pair", sv);
    else if (n === 3) add("triple", sv);
    else add("bomb", sv);
  }
  if (n === 5) {
    if (ranks.length === 2) {
      for (const [t, p] of [
        [ranks[0], ranks[1]],
        [ranks[1], ranks[0]]
      ]) {
        if (cnt[t] <= 3 && cnt[p] <= 2) add("full", v(t));
      }
    }
    if (ranks.length === 1 && nat.length === 3 && w === 2 && ranks[0] !== L)
      add("full", v(ranks[0]));
    const ss = seqStarts(nat, w, 5, 1);
    if (ss.length) {
      const top = Math.max(...ss);
      if (new Set(nat.map((c) => c.s)).size <= 1) add("sflush", top);
      else add("straight", top);
    }
  }
  if (n === 6) {
    const a = seqStarts(nat, w, 3, 2);
    if (a.length) add("pairs3", Math.max(...a));
    const b = seqStarts(nat, w, 2, 3);
    if (b.length) add("trip2", Math.max(...b));
  }
  return res;
}
function beats(p, cur) {
  if (!cur) return true;
  const pb = isBomb(p), cb = isBomb(cur);
  if (pb && !cb) return true;
  if (!pb && cb) return false;
  if (pb) return power(p) > power(cur);
  return p.type === cur.type && p.n === cur.n && p.value > cur.value;
}

// web/src/ai/candidates.js
var cardKey = (c) => c.r + c.s;
function choose(cards, n) {
  const out = [];
  function visit(start, picked) {
    if (picked.length === n) {
      out.push(picked);
      return;
    }
    for (let i = start; i <= cards.length - (n - picked.length); i++) {
      if (i > start && cardKey(cards[i]) === cardKey(cards[i - 1])) continue;
      visit(i + 1, picked.concat(cards[i]));
    }
  }
  visit(0, []);
  return out;
}
function candidates(hand, L, cur) {
  const wild = hand.filter((c) => isWild(c, L));
  const by = {};
  for (const c of hand.filter((c2) => !isWild(c2, L))) (by[c.r] ||= []).push(c);
  for (const group of Object.values(by))
    group.sort((a, b) => a.s.localeCompare(b.s) || a.id - b.id);
  const out = [], seen = /* @__PURE__ */ new Set();
  function add(cards) {
    const faces = cards.map(cardKey).sort().join(",");
    for (const a of analyze(cards, L)) {
      if (!beats(a, cur)) continue;
      const key = a.type + ":" + a.value + ":" + faces;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...a, cards, wu: cards.filter((c) => isWild(c, L)).length });
    }
  }
  function groups(rank, n) {
    const result = [];
    for (let w = 0; w <= Math.min(wild.length, n); w++) {
      if (rank >= 16 && w) continue;
      for (const cards of choose(by[rank] || [], n - w)) result.push({ cards, w });
    }
    return result;
  }
  for (let rank = 2; rank <= 17; rank++) {
    if (rank === 15) continue;
    const max = rank >= 16 ? 2 : Math.min(10, (by[rank] || []).length + wild.length);
    for (let n = 1; n <= max; n++)
      for (const g of groups(rank, n)) add(g.cards.concat(wild.slice(0, g.w)));
  }
  const jokers = (by[16] || []).concat(by[17] || []);
  if (jokers.length === 4) add(jokers);
  for (let t = 2; t <= 14; t++)
    for (const triple of groups(t, 3)) {
      for (let p = 2; p <= 17; p++) {
        if (p === t || p === 15) continue;
        for (const pair of groups(p, 2))
          if (triple.w + pair.w <= wild.length) {
            add(triple.cards.concat(pair.cards, wild.slice(0, triple.w + pair.w)));
          }
      }
    }
  for (const [len, need] of SEQS)
    for (let start = 1; start + len - 1 <= 14; start++) {
      let run = function(offset, cards, w) {
        if (offset === len) {
          add(cards.concat(wild.slice(0, w)));
          return;
        }
        const rank = start + offset === 1 ? 14 : start + offset;
        for (const group of groups(rank, need))
          if (w + group.w <= wild.length) {
            run(offset + 1, cards.concat(group.cards), w + group.w);
          }
      };
      run(0, [], 0);
    }
  if (cur) out.push(null);
  return out;
}

// web/src/ai/hand-value.js
var AIP;
var UNIT_SCORE;
var unitCost;
function initialize() {
  AIP = {
    // hand evaluation: a single, pair or three counts 1 turn, less for big cards; runs, bombs and wild cards
    ucTop: 0.25,
    ucA: 0.5,
    ucQK: 0.75,
    tripPairMax: 14,
    seqUnit: 0.9,
    fourJokers: 1.5,
    smallJoker: 0.3,
    bigJoker: 0.2,
    bombBase: 0.4,
    bombExtra: 0.1,
    wild: 0.9,
    // following: when to beat an opponent's cards
    urgentWin: 7,
    urgentOpp: 5,
    followFree: 0.35,
    followMaybe: 1.2,
    followMaybeProb: 0.3,
    saveJokerCurBelow: 13,
    saveJokerHand: 8,
    saveJokerProb: 0.6,
    topFree: 1,
    // when to bomb
    bombWinLeft: 7,
    bombRest: 2,
    bombOverBomb: 12,
    bombBigVal: 14,
    bombBigProb: 0.25,
    safeBombRest: 3,
    // what counts as a play that wins the lead back; arranging the hand: what each play (not bombs) costs on top of its score
    ctrlSingle: 14,
    ctrlPair: 13,
    ctrlTrip: 12,
    ctrlSeq: 9,
    armHand: 0.3,
    armNodes: 400,
    // early and middle game: how often a play that would win the lead back is kept, or a fit left to your partner
    saveCtrlProb: 0,
    midLeaveProb: 0.2,
    // 牌力 tiers (0-100, the hand as dealt): 1 aims to put both opponents last, 2 to go out first, 3 for second or third,
    // 4 not to end up both last; the weaker tiers leave more to the partner
    tier1: 85,
    tier2: 55,
    tier3: 20,
    leaveWeak: 0.5,
    // no bomb when the partner, still to play, can most likely beat it (the unseen cards dealt at random this many times)
    mateBeatProb: 0.8,
    mateSamples: 40,
    // a small card is 10 or below
    smallMax: 10,
    // an opponent's bomb, bombed back or not by how many bombs you hold (straight flushes and the four jokers count), how
    // many levels your smallest one that beats it is above theirs (one level: the smallest bomb there is that beats it),
    // and how many cards they have left. One bomb: bomb when they hold this many or fewer; not when your partner is yet to
    // play and yours is this many levels above or more. Two bombs: bomb when yours is within this many levels; not when it
    // is further above and they hold this many or more. Three or more: always, with the smallest that beats it
    bbOneLeft: 7,
    bbOneFar: 10,
    bbTwoNear: 6,
    bbTwoFarMin: 18,
    // late game, no bomb that leaves a small single to get rid of while an opponent still holds more than this many cards
    lateBombOppMax: 10,
    // top your partner's small single or pair with an ace or the level card when the next opponent holds this many or fewer
    topMateNextMax: 7,
    // each of those rules on (1) or off (0), to test them one at a time: keep big singles early, the smallest pair with a three,
    // bomb back, no hurry to bomb late, leave the joker to the partner, top the partner's small card, hand the partner a play
    // they may go out on, no three-with-a-pair or straight led to an opponent with five cards
    rKeepBig: 1,
    rSmallPair: 1,
    rBombBack: 1,
    rLateBomb: 1,
    rMateJoker: 1,
    rTopMate: 1,
    rFeed: 1,
    rNoFive: 1
  };
  UNIT_SCORE = {
    single1: {
      2: -0.94,
      3: -0.8,
      4: -0.66,
      5: -0.55,
      6: -0.44,
      7: -0.36,
      8: -0.28,
      9: -0.18,
      10: -0.11,
      11: -0.03,
      12: 0.08,
      13: 0.18,
      14: 0.25,
      15: 0.39,
      16: 0.55,
      17: 0.77
    },
    pair2: {
      2: -0.66,
      3: -0.61,
      4: -0.52,
      5: -0.46,
      6: -0.41,
      7: -0.34,
      8: -0.26,
      9: -0.2,
      10: -0.12,
      11: -0.01,
      12: 0.08,
      13: 0.2,
      14: 0.32,
      15: 0.48,
      16: 0.61,
      17: 0.69
    },
    triple3: {
      2: 0,
      3: -0.05,
      4: 0.1,
      5: 0.1,
      6: 0.08,
      7: 0.13,
      8: 0.18,
      9: 0.2,
      10: 0.29,
      11: 0.32,
      12: 0.27,
      13: 0.37,
      14: 0.32,
      15: 0.18
    },
    full5: {
      2: -0.65,
      3: -0.48,
      4: -0.36,
      5: -0.24,
      6: -0.16,
      7: -0.09,
      8: -0.01,
      9: 0.07,
      10: 0.14,
      11: 0.2,
      12: 0.25,
      13: 0.39,
      14: 0.45,
      15: 0.52
    },
    straight5: {
      1: -0.46,
      2: -0.3,
      3: -0.18,
      4: -0.08,
      5: 0.03,
      6: 0.12,
      7: 0.2,
      8: 0.26,
      9: 0.38,
      10: 0.59
    },
    pairs36: {
      1: -0.16,
      2: -0.07,
      3: -0.05,
      4: 0.01,
      5: -0.01,
      6: 0.05,
      7: 0.08,
      8: 0.08,
      9: 0.15,
      10: 0.18,
      11: 0.25,
      12: 0.28
    },
    trip26: {
      1: 0.26,
      2: 0.32,
      3: 0.34,
      4: 0.29,
      5: 0.3,
      6: 0.29,
      7: 0.32,
      8: 0.25,
      9: 0.25,
      10: 0.22,
      11: 0.23,
      12: 0.18,
      13: 0.13
    },
    bomb4: {
      2: 1.54,
      3: 1.55,
      4: 1.55,
      5: 1.56,
      6: 1.55,
      7: 1.57,
      8: 1.57,
      9: 1.58,
      10: 1.59,
      11: 1.6,
      12: 1.62,
      13: 1.63,
      14: 1.6,
      15: 1.61
    },
    bomb5: {
      2: 1.64,
      3: 1.66,
      4: 1.68,
      5: 1.7,
      6: 1.7,
      7: 1.7,
      8: 1.71,
      9: 1.73,
      10: 1.72,
      11: 1.73,
      12: 1.72,
      13: 1.73,
      14: 1.69,
      15: 1.74
    },
    bomb6: {
      2: 1.91,
      3: 1.91,
      4: 1.91,
      5: 1.92,
      6: 1.93,
      7: 1.93,
      8: 1.95,
      9: 1.95,
      10: 1.96,
      11: 1.98,
      12: 1.98,
      13: 1.99,
      14: 1.97,
      15: 1.97
    },
    bomb7: {
      2: 1.98,
      3: 2,
      4: 2,
      5: 1.96,
      6: 2,
      7: 2,
      8: 2,
      9: 1.94,
      10: 2,
      11: 1.94,
      12: 2,
      13: 2,
      14: 2
    },
    bomb8: { 2: 2, 3: 2, 4: 2, 5: 2, 9: 2, 11: 2 },
    sflush5: {
      1: 1.8,
      2: 1.82,
      3: 1.85,
      4: 1.83,
      5: 1.85,
      6: 1.85,
      7: 1.87,
      8: 1.88,
      9: 1.91,
      10: 1.94
    },
    jokers4: { 99: 2 }
  };
  unitCost = (v) => v >= 15 ? AIP.ucTop : v >= 14 ? AIP.ucA : v >= 12 ? AIP.ucQK : 1;
}

// web/src/analysis/concepts.mjs
if (!AIP) initialize();
var deck = makeDeck();

// web/src/ai/encoding.mjs
function cardIndex(id) {
  const n = id % 54;
  return n >= 52 ? n : n % 13 * 4 + [1, 0, 2, 3][Math.floor(n / 13)];
}
function cardsArray(ids2) {
  const a = new Float32Array(54);
  if (ids2?.length === 1 && ids2[0] === -1) return a.fill(-1);
  for (const id of ids2 || []) a[cardIndex(id)]++;
  return a;
}

// web/src/ai/search/payload.mjs
var deck2 = makeDeck();
var ids = (cards) => cards.map((card) => card.id);
var shapeOf = ({ type, value, n }) => ({ type, value, n });
function searchPayload(game, p, offset, seed) {
  if (game.turn !== p) throw Error("Search payload is only built for the seat to move");
  const card = (c) => c && Number.isInteger(c.id) ? c.id : null;
  return {
    p,
    offset,
    seed: seed >>> 0,
    L: game.L,
    levels: game.levels.slice(),
    turn: game.turn,
    passes: game.passes || 0,
    out: game.out.slice(),
    hand: ids(game.hands[p]),
    counts: game.hands.map((hand) => hand.length),
    log: game.log.map(
      (e) => e.cards?.length ? { p: e.p, cards: ids(e.cards), ...shapeOf(e), lead: !!e.lead } : { p: e.p, cards: null }
    ),
    trick: game.trick ? {
      player: game.trick.player,
      ...shapeOf(game.trick.play),
      wu: game.trick.play.wu || 0,
      cards: ids(game.trick.play.cards)
    } : null,
    exchanges: {
      trib: (game.trib || []).map((t) => ({ g: t.g, r: t.r, tc: card(t.tc), rc: card(t.rc) })),
      kang: game.kang?.has ? { has: game.kang.has.map(({ g, n }) => ({ g, n })) } : null
    }
  };
}
var hidden = Object.freeze({
  get id() {
    throw Error("Hidden card read during search");
  }
});

// web/src/ai/model-catalog.json
var model_catalog_default = {
  schema: 1,
  defaultId: "017",
  models: [
    {
      id: "001",
      file: "policy.onnx",
      sha256: "d5038709af116c779e7f6a014ea1a68aab6a1a0026fddcf19862881d060e0422",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        version: "P0",
        status: "baseline"
      }
    },
    {
      id: "002",
      file: "bot-002.onnx",
      sha256: "260895a254dcffb7a9cd9d22ba4ee3e74c183711e9108611ea3772eb3af5af75",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-002/bot-002.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000198487",
        step: 198487,
        exportedAt: "2026-11-05T04:47:20Z",
        expectedSHA256: "260895a254dcffb7a9cd9d22ba4ee3e74c183711e9108611ea3772eb3af5af75",
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T04:52:28.151Z"
      }
    },
    {
      id: "003",
      file: "bot-003.onnx",
      sha256: "15ae4809731d843fdfca74ba5a5bd1cc30ed00cb2de9f110ee1ca0299a12127b",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-003/bot-003.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000009537",
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T05:15:35.468Z",
        step: 9537
      }
    },
    {
      id: "004",
      file: "bot-004.onnx",
      sha256: "a806747de50a46f76bd8b4d5de189411b902f3b46531e040daf19c76fdbd7da7",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-004/bot-004.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000331516",
        step: 331516,
        exportedAt: "2026-11-05T08:50:45Z",
        expectedSHA256: "a806747de50a46f76bd8b4d5de189411b902f3b46531e040daf19c76fdbd7da7",
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T08:54:34.926Z"
      }
    },
    {
      id: "005",
      file: "bot-005.onnx",
      sha256: "ff06717ee04155f780ccca45136f537ffd7704386125a70c91dd04630ae713af",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-005/bot-005.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000027771",
        status: "experimental-not-heldout-accepted",
        step: 27771,
        registeredAt: "2026-11-05T09:17:33.468Z"
      }
    },
    {
      id: "006",
      file: "bot-006.onnx",
      sha256: "6a31c7a9e80498fb13adc2bd210583686de5c59abe68a7eb8b1d7d1f6d06b0da",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-006/bot-006.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000481076",
        step: 481076,
        exportedAt: "2026-11-05T12:51:36Z",
        expectedSHA256: "6a31c7a9e80498fb13adc2bd210583686de5c59abe68a7eb8b1d7d1f6d06b0da",
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T12:55:17.396Z"
      }
    },
    {
      id: "007",
      file: "bot-007.onnx",
      sha256: "7ec0450d793b885bb0f7d9c1aa9871fed95df29a6173a8b4c799e1c362027a41",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-007/bot-007.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000044752",
        status: "experimental-not-heldout-accepted",
        step: 44752,
        registeredAt: "2026-11-05T13:18:12.809Z"
      }
    },
    {
      id: "008",
      file: "bot-008.onnx",
      sha256: "5a6a250b10ed33eea151a7dcae4e6396d36d8737107965db98d58912ec5b9af2",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-008/bot-008.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000091092",
        step: 91092,
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T14:37:31Z",
        champion: {
          gate: 104,
          acceptedAt: "2026-11-05T01:06:47.980Z",
          evidence: "ai/research/evaluation/champion-selection-20261105/gate-00104.json",
          evidenceSHA256: "6bb880e5063a73fd34e234348330c2b87941bde28594d3a4e88b227f4f77ae2a"
        }
      }
    },
    {
      id: "009",
      file: "bot-009.onnx",
      sha256: "104ca1cb8bcd63fffc3214148031e50054c5a3e13cdbfcc2a9eda26bba0ba2eb",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-009/bot-009.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000293055",
        status: "experimental-not-heldout-accepted",
        step: 293055,
        registeredAt: "2026-11-05T14:39:20.461Z",
        champion: {
          gate: 112,
          acceptedAt: "2026-11-05T08:11:50.077Z",
          evidence: "ai/research/evaluation/champion-selection-20261105/gate-00112.json",
          evidenceSHA256: "7e58ee57fadc5d7a0898ae0fcf952e4f7ad720adb01f34fcf91ea6d1a7a555a7"
        }
      }
    },
    {
      id: "010",
      file: "bot-010.onnx",
      sha256: "6fb37ef5c25059d550fd36d00459af6ddc20d83127da663800663f0457c45fbe",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-010/bot-010.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000061045",
        status: "experimental-not-heldout-accepted",
        step: 61045,
        registeredAt: "2026-11-05T17:15:32.032Z"
      }
    },
    {
      id: "011",
      file: "bot-011.onnx",
      sha256: "3cb8d3672bb014399cf8500940f6d27506eba0ede9540b46df7c5ac60c4f87a0",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-011/bot-011.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000078087",
        status: "experimental-not-heldout-accepted",
        step: 78087,
        registeredAt: "2026-11-05T21:44:57.015Z"
      }
    },
    {
      id: "012",
      file: "bot-012.onnx",
      sha256: "13b7a9373e9305bffa6e3c4d2b50532a306d75da8e67219ed1bfba9f9d68d0b2",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-012/bot-012.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "mac-20261105",
        version: "v000705434",
        status: "experimental-not-heldout-accepted",
        step: 705434,
        registeredAt: "2026-11-06T01:15:05.171Z",
        champion: {
          gate: 309,
          acceptedAt: "2026-11-06T00:22:21.010Z",
          evidence: "ai/research/evaluation/champion-selection-mac-20261105/gate-00309.json",
          evidenceSHA256: "9d0dddb9e67895a0c45aa0c4be76b7317a2dccc3b9fb635bb024781fb763e86c",
          manifest: "ai/research/evaluation/champion-selection-mac-20261105/champion.json"
        },
        trainingDevice: "mps"
      }
    },
    {
      id: "013",
      file: "bot-013.onnx",
      sha256: "041526bfe80612c48cd609b0b4a1e16095ea2d9c52bada3a888e55734f9ba696",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-013/bot-013.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000081302",
        status: "experimental-not-heldout-accepted",
        step: 81302,
        registeredAt: "2026-11-06T01:46:25.967Z"
      }
    },
    {
      id: "014",
      file: "bot-014.onnx",
      sha256: "b752ee8b8cfc572aae50c2b0fecc0e20f0db29f9d2309b14cb14d7f153e5d5d1",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-014/bot-014.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000104257",
        status: "experimental-not-heldout-accepted",
        step: 104257,
        registeredAt: "2026-11-06T05:42:10.604Z"
      }
    },
    {
      id: "015",
      file: "bot-015.onnx",
      sha256: "8ede9a08a84ad0acaff74c24c8e7287d3da7d19e86f846e0052c6c6d620051ba",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-015/bot-015.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000120154",
        status: "experimental-not-heldout-accepted",
        step: 120154,
        registeredAt: "2026-11-06T09:47:52.777Z"
      }
    },
    {
      id: "016",
      file: "bot-016.onnx",
      sha256: "c24f03730ad4e76f6acd91430374c3755058e118d1bf85ff207548ae4852b2bd",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-016/bot-016.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000135205",
        status: "experimental-not-heldout-accepted",
        step: 135205,
        registeredAt: "2026-11-06T13:46:09.173Z"
      }
    },
    {
      id: "017",
      file: "bot-017.onnx",
      sha256: "462afc99ee6bcfb788871d7a8f84d4298c008d57465c62d48ca1792cdb11b3f7",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-017/bot-017.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "mac-20261105",
        version: "v000855042",
        status: "experimental-not-heldout-accepted",
        step: 855042,
        registeredAt: "2026-11-06T15:28:31.478Z",
        champion: {
          gate: 330,
          acceptedAt: "2026-11-06T10:59:34.199Z",
          evidence: "ai/research/evaluation/champion-selection-mac-20261106/gate-00330.json",
          evidenceSHA256: "c151c57b37f905084c8374ae8868bbfd3eb90763b60aed7eb4f0b640bb561f3e",
          manifest: "ai/research/evaluation/champion-selection-mac-20261106/champion.json"
        },
        trainingDevice: "mps"
      }
    },
    {
      id: "018",
      file: "bot-018.onnx",
      sha256: "a9faa1898f6a5846aaa03a31a82249e25fc4f163b6f1da44a35d2ce2f006f65f",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-018/bot-018.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000138506",
        status: "experimental-not-heldout-accepted",
        step: 138506,
        registeredAt: "2026-11-07T03:13:06.962Z"
      }
    },
    {
      id: "019",
      file: "bot-019.onnx",
      sha256: "bb745cbf44b4a0f648ef93998b60f1f02211d5a4bdd4176b02cf607d6e26d754",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-019/bot-019.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000186280",
        status: "experimental-not-heldout-accepted",
        step: 186280,
        registeredAt: "2026-11-07T03:49:42.557Z"
      }
    },
    {
      id: "020",
      file: "bot-020.onnx",
      sha256: "435e5d494444fcdd73637c3c847706b4fcc46fd92bd9f70124339ef66d26dba7",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-020/bot-020.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000223067",
        status: "experimental-not-heldout-accepted",
        step: 223067,
        registeredAt: "2026-11-07T15:17:13.950Z"
      }
    },
    {
      id: "021",
      file: "bot-021.onnx",
      sha256: "43d72b65e773fb5acb6b8f86baed16a69a1977a97fb6fddf4fe5f23ee25261bc",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-021/bot-021.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000229609",
        status: "experimental-not-heldout-accepted",
        step: 229609,
        registeredAt: "2026-11-07T15:43:18.522Z"
      }
    },
    {
      id: "022",
      file: "bot-022.onnx",
      sha256: "00a1ec91244392963cf681d5d02ead66ab6b42be3bd504daed943df0613ca15b",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-022/bot-022.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000270292",
        status: "experimental-not-heldout-accepted",
        step: 270292,
        registeredAt: "2026-11-08T03:43:32.307Z"
      }
    },
    {
      id: "023",
      file: "bot-023.onnx",
      sha256: "e02bd26f3d90cb9ef90f7075ad1acd845c709bebac734611c44eb66d48fdbd4b",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-023/bot-023.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000303975",
        status: "experimental-not-heldout-accepted",
        step: 303975,
        registeredAt: "2026-11-08T15:13:05.630Z"
      }
    },
    {
      id: "024",
      file: "bot-024.onnx",
      sha256: "86dad83347535f38f7c131bb567b34b5f875cf2f613675d22605600fdb18b863",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-024/bot-024.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000310956",
        status: "experimental-not-heldout-accepted",
        step: 310956,
        registeredAt: "2026-11-08T15:40:14.563Z"
      }
    },
    {
      id: "025",
      file: "bot-025.onnx",
      sha256: "aa1bfd7fe972739ae6ea3c0f321379dd36360f1ab274765a0e42df8568b877b5",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-025/bot-025.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000352359",
        status: "experimental-not-heldout-accepted",
        step: 352359,
        registeredAt: "2026-11-09T03:42:10.298Z"
      }
    },
    {
      id: "026",
      file: "bot-026.onnx",
      sha256: "21300c36c7c273b43274a83fa70dc62ce85be0cc84decc6dda2080548e0096b1",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-026/bot-026.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000385979",
        status: "experimental-not-heldout-accepted",
        step: 385979,
        registeredAt: "2026-11-09T13:29:15.336Z"
      }
    }
  ],
  selection: {
    mode: "latest-v2",
    danMCaiChampions: [
      "017",
      "012"
    ],
    defaultChoice: "9001"
  },
  searchBots: [
    {
      id: "9001",
      kind: "belief-search",
      base: "017",
      belief: {
        file: "belief-v1-16d76783.onnx",
        sha256: "16d767830e4536180fac56d744e95934b7525ab67b18d27df4f33066033d65e9",
        bytes: 3931285,
        url: "https://github.com/stevensun1005/guandanai/releases/download/web-belief-v1-16d76783/belief-v1-16d76783.onnx",
        featureVersion: "belief-v1",
        trainReportSHA256: "7f022c7640e0102dd25bfe497b6c0bc2dc1e3480dc1dfcf5144fa73ab6c95f0d",
        trainingSeeds: [
          4255121e3,
          4255160999
        ],
        trainingBand: [
          21,
          80
        ]
      },
      search: {
        lo: 21,
        hi: 40,
        worlds: 8,
        k: 6,
        net: 2,
        endgameHi: 20,
        endgameWorlds: 8,
        minWorlds: 4,
        tieTolerance: 1e-9,
        solverMaxNodes: 15e5,
        worldSeed: "(seed*1009 + ply*7919)>>>0"
      },
      version: "v000855042-bsearch1-16d76783",
      sha256: "442d888ada3b59c56cb1e809bb24a97268f00c3daaa6345c6b53f2f84aca6a24",
      source: {
        status: "research-bot-not-champion-deployment-not-acceptance",
        tested: "Node bot midgame-search.mjs --worlds-source=belief --endgame=pimc --endgame-hi=20 --endgame-worlds=belief; held-out H4 990,023,757-990,026,756: +0.237 [0.208, 0.266] mean signed round points per deal pair vs champion-017 opponents, single rounds, no tribute; H3 midgame only +0.139 [0.111, 0.166]",
        scope: "validated only vs champion-017 opponents in single rounds without tribute; untested vs humans, human partners, mixed teams or tribute rounds; browser budget overruns play champion 017",
        evidence: [
          {
            file: "ai/research/evaluation/window2-20261109/results/C-h4.json",
            sha256: "17cf1dcf969ae0a1c9ffd0ab1bdbe58b349aafd9dfadccd5900e30ecd76075be"
          },
          {
            file: "ai/research/evaluation/window1-20261109/results/H3-compare.json",
            sha256: "876bb00067cb47783534c0577f9e42641aa096b53fca9ee884737b35baf08b4e"
          }
        ],
        deployment: "ai/research/evaluation/web-search-bot-9001.json",
        authorizedAt: "2026-11-09"
      }
    }
  ]
};

// web/src/ai/model-catalog.mjs
var MENU_MODE = "latest-v2";
var CLINT_RULE_ID = "clint-rule";
var RELEASE_ASSET = /^https:\/\/github\.com\/stevensun1005\/guandanai\/releases\/download\/[^/]+\/[\w.-]+\.onnx$/;
var sameParams = (a, b) => !!a && Object.keys(a).length === Object.keys(b).length && Object.entries(b).every(([key, v]) => a[key] === v);
function validateSearchBots(value) {
  const bots = value.searchBots ?? [];
  if (!Array.isArray(bots)) throw Error("Invalid search bots");
  const ids2 = new Set(value.models.map((m) => m.id)), files = new Set(value.models.map((m) => m.file));
  for (const bot of bots) {
    const base = value.models.find((m) => m.id === bot.base);
    if (!/^\d{3,}$/.test(bot.id) || ids2.has(bot.id) || bot.kind !== "belief-search" || !base || base.config.history || base.config.extraFeatures || !Number.isInteger(base.source?.champion?.gate) || !/^belief-[\w-]+\.onnx$/.test(bot.belief?.file) || files.has(bot.belief.file) || !/^[a-f0-9]{64}$/.test(bot.belief.sha256) || !RELEASE_ASSET.test(bot.belief.url) || bot.belief.featureVersion !== "belief-v1" || !/^[a-f0-9]{64}$/.test(bot.sha256) || typeof bot.version !== "string" || !/^[\w.-]{1,80}$/.test(bot.version) || !sameParams(bot.search, SEARCH_BOT_V1) || value.defaultId === bot.id)
      throw Error("Invalid or duplicate search bot entry");
    ids2.add(bot.id);
    files.add(bot.belief.file);
  }
}
function validateCatalog(value) {
  if (value?.schema !== 1 || !Array.isArray(value.models) || !value.models.length)
    throw Error("Invalid model catalog");
  const ids2 = /* @__PURE__ */ new Set(), files = /* @__PURE__ */ new Set();
  for (const model of value.models) {
    if (!/^\d{3,}$/.test(model.id) || ids2.has(model.id) || !/^[\w-]+\.onnx$/.test(model.file) || files.has(model.file) || !/^[a-f0-9]{64}$/.test(model.sha256) || model.config?.stateFeatures !== 513 || model.config?.actionFeatures !== 54 || model.config.extraFeatures && ![53, 61].includes(model.config.extraFeatures) || model.config.history && model.config.history !== "guanzero-v1")
      throw Error("Invalid or duplicate model entry");
    if (model.url && !RELEASE_ASSET.test(model.url))
      throw Error("Model must use a pinned repository Release asset");
    ids2.add(model.id);
    files.add(model.file);
  }
  if (!ids2.has(value.defaultId)) throw Error("Missing default model");
  if (value.selection) {
    const champions = value.selection.danMCaiChampions;
    if (value.selection.mode !== MENU_MODE || !Array.isArray(champions) || champions.length !== 2 || new Set(champions).size !== 2 || champions.some((id) => {
      const model = value.models.find((m) => m.id === id);
      return !model || model.config.history || !Number.isInteger(model.source?.champion?.gate);
    }) || value.defaultId !== champions[0])
      throw Error("Invalid champion selection");
  }
  validateSearchBots(value);
  validateDefaultChoice(value);
  return value;
}
function validateDefaultChoice(value) {
  const choice = value.selection?.defaultChoice;
  if (choice === void 0) return;
  const bot = (value.searchBots ?? []).find((b) => b.id === choice);
  if (choice !== value.defaultId && bot?.base !== value.selection.danMCaiChampions[0] || !selectableModels(value).some((entry) => entry.id === choice))
    throw Error("Invalid menu default");
}
validateCatalog(model_catalog_default);
var BOT_MODELS = Object.freeze(model_catalog_default.models.map((model) => Object.freeze(model)));
var NEURAL_DEFAULT_MODEL = model_catalog_default.defaultId;
var DEFAULT_BOT_MODEL = model_catalog_default.selection?.defaultChoice ?? model_catalog_default.defaultId;
var SEARCH_BOTS = Object.freeze(
  (model_catalog_default.searchBots || []).map((bot) => Object.freeze(bot))
);
var searchBot = (value) => SEARCH_BOTS.find((bot) => bot.id === value) || null;
var botModelId = (value) => value === CLINT_RULE_ID || BOT_MODELS.some((model) => model.id === value) || SEARCH_BOTS.some((bot) => bot.id === value) ? value : DEFAULT_BOT_MODEL;
var botModel = (value) => {
  if (value === CLINT_RULE_ID) throw Error("Clint rules do not use a neural model");
  const id = botModelId(value);
  const base = searchBot(id)?.base ?? id;
  return BOT_MODELS.find((model) => model.id === base);
};
var botIdentity = (value) => {
  const id = botModelId(value);
  if (id === CLINT_RULE_ID) return { id, sha256: null, version: "rules-v2" };
  const bot = searchBot(id);
  if (bot) return { id, sha256: bot.sha256, version: bot.version };
  const model = botModel(id);
  return { id, sha256: model.sha256, version: model.source?.version || id };
};
var botModelName = (value) => {
  if (value === CLINT_RULE_ID) return "Clint规则机器人";
  if (searchBot(value)) return "danMCai-reason-" + botModel(searchBot(value).base).source.version;
  const model = botModel(value);
  if (model.config.history === "guanzero-v1" && model.source?.run) {
    const checkpoint = Number.isSafeInteger(model.source.step) ? `${model.source.step}` : model.source.version;
    return checkpoint ? `${model.source.run}-${checkpoint}` : model.source.run;
  }
  return "danMCai-" + (model.source?.version === "P0" ? "v000000000" : model.source?.version || model.id);
};
function selectableModels(value) {
  const models = value.models;
  if (!value.selection) return models;
  const champion = value.selection.danMCaiChampions[0];
  return [
    { id: CLINT_RULE_ID, kind: "rule" },
    models.filter((m) => m.config.history === "guanzero-v1").at(-1),
    models.find((m) => m.id === champion),
    (value.searchBots || []).filter((bot) => bot.base === champion).at(-1)
  ].filter(Boolean);
}
var BOT_CHOICES = Object.freeze(selectableModels(model_catalog_default));

// web/src/coach/evaluation.mjs
var COACH_MODEL_ID = model_catalog_default.selection.danMCaiChampions[0];
var COACH_MODEL_NAME = botModelName(COACH_MODEL_ID);
var COACH_SEARCH_BOT_ID = BOT_CHOICES.find((choice) => searchBot(choice.id))?.id ?? null;
var COACH_NAME = botModelName(COACH_SEARCH_BOT_ID ?? COACH_MODEL_ID);
var actionKey = (ids2) => cardsArray(ids2).join(",");
var coachDeck = makeDeck();
function coachReading(ids2, level, current) {
  if (!ids2.length) return null;
  const cards = ids2.map((id) => coachDeck[id]);
  const shape = analyze(cards, level).filter((s) => beats(s, current)).sort((a, b) => strength(b) - strength(a))[0];
  if (!shape) throw Error("Illegal coach action");
  return { ...shape, cards, wu: cards.filter((card) => isWild(card, level)).length };
}
function rankedCoachActions(actions, values, level, limit = 5, current, tiebreak) {
  const valid = (v) => Number.isFinite(v) || tiebreak && v === null;
  if (actions.length !== values.length || !values.every(valid) || tiebreak && (tiebreak.length !== values.length || !tiebreak.every(Number.isFinite)))
    throw Error("Invalid ranked actions");
  const order = (a, b) => (a.value === null) - (b.value === null) || (b.value ?? 0) - (a.value ?? 0) || (b.base ?? 0) - (a.base ?? 0) || a.index - b.index;
  const plans = /* @__PURE__ */ new Map(), readings = /* @__PURE__ */ new Map();
  actions.forEach((ids2, index) => {
    const exact = actionKey(ids2);
    if (!readings.has(exact)) readings.set(exact, coachReading(ids2, level, current));
    const shape = readings.get(exact), cards = ids2.map((id) => coachDeck[id]);
    const key = !cards.length ? "pass" : `${shape?.type}|${shape?.value}|${cards.map((c) => isWild(c, level) ? "wild" : c.r).sort().join(",")}`;
    const row = { ids: ids2.slice(), value: values[index], shape, index };
    if (tiebreak) row.base = tiebreak[index];
    if (!plans.has(key) || order(row, plans.get(key)) < 0) plans.set(key, row);
  });
  return [...plans.values()].sort(order).slice(0, limit);
}
function mergeSearchValues(actions, search) {
  if (!search?.ok || !Array.isArray(search.plays) || search.plays.length !== search.values?.length)
    return null;
  const byKey = /* @__PURE__ */ new Map();
  search.plays.forEach((ids2, i) => {
    const value = search.values[i];
    if (Number.isFinite(value)) byKey.set(actionKey(ids2), value);
  });
  const shown = actions.map((ids2) => byKey.get(actionKey(ids2)) ?? null);
  return shown.some((value) => value !== null) ? shown : null;
}
function relativeRating(values, selected) {
  if (!values.length || !values.every(Number.isFinite) || !Number.isFinite(selected))
    throw Error("Invalid coach values");
  let low = selected, high = selected;
  for (const value of values) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  const flat = high - low < 1e-6;
  return { percent: flat ? 100 : Math.round(100 * (selected - low) / (high - low)), flat };
}
export {
  HARD_MS,
  REASON_MS,
  SEARCH_BOT_V1,
  SEARCH_BUDGETS,
  TURN_MS,
  actionKey,
  botIdentity,
  botModelName,
  candidates,
  createSearchClient,
  deviceClass,
  hardTimeoutMs,
  mergeSearchValues,
  rankedCoachActions,
  relativeRating,
  searchBand,
  searchPayload
};
