/* ---------- clocks: one ticker drives turn limits, computer thinking and the pre-play countdown ---------- */
const TRIB_MS=30000,RET_MS=60000,HURRY_MS=10000;
// the sorting and playing times are the host's choice in the lobby (RULES.prepSec, RULES.playSec; a room of an older page sends none: 90 and 60)
const PREP_CHOICES=[30,60,90,120,180],PLAY_CHOICES=[15,30,60,90,120];
const prepMs=()=>(PREP_CHOICES.includes(RULES.prepSec)?RULES.prepSec:90)*1000;
const playMs=()=>(PLAY_CHOICES.includes(RULES.playSec)?RULES.playSec:60)*1000;
// computer "thinking" time per move; shortened for testing (the full-feel setting was 2000-5000)
const AI_THINK_MIN=500,AI_THINK_MAX=1000;
