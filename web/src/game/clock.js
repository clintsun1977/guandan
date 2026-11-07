/* ---------- clocks: one ticker drives turn limits, computer thinking and the pre-play countdown ---------- */
const PLAY_MS=60000,TRIB_MS=30000,RET_MS=60000,PREP_MS=90000,HURRY_MS=10000;
// computer "thinking" time per move; shortened for testing (the full-feel setting was 2000-5000)
const AI_THINK_MIN=500,AI_THINK_MAX=1000;
