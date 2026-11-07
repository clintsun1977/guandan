const ROW_NAME={1:'一排',2:'两排',3:'三排'};
// what a click on the rows button switches to: held hands toggle 3/2 rows, flat hands cycle 1 -> 2 -> 3
// (a single flat row that would be too cramped to read is skipped)
const nextRows=()=>fanMode()?(handRows===3?2:3):flatShown===3?(flatOneFits?1:2):flatShown+1;
function syncHandBtns(){
  // one button for the three layouts: it names the one in use, and a click moves on to the next
  const v=fanMode()?'fan':vertMode()?'vert':'flat';
  $('#fanBtn').textContent=VIEW_NAME[v];
  $('#fanBtn').title=`理牌方式，点一下换成${VIEW_NAME[VIEW_NEXT[v]]}`;
  // the button names what a click switches to (竖式 has no rows to choose: the button keeps its place, unseen, so
  // 手持 and 竖式 never move under the pointer)
  $('#rowsBtn').style.visibility=vertMode()?'hidden':'';
  $('#rowsBtn').textContent=ROW_NAME[nextRows()];
  $('#rowsBtn').title=`改成${ROW_NAME[nextRows()]}`;
}
// 横式 (flat rows) -> 竖式 (a column per rank) -> 手持 (held in a fan) -> 横式
const VIEW_NAME={flat:'横式',vert:'竖式',fan:'手持'},VIEW_NEXT={flat:'vert',vert:'fan',fan:'flat'};
const setHandView=v=>{
  handView=v;
  try{localStorage.setItem('guandan-view',handView)}catch(_){}
  syncHandBtns();
  // the cards slide to their new places (竖式 puts them in another order)
  if(G&&G.hands)reflowHand();else layoutHand();
};
$('#fanBtn').onclick=()=>setHandView(VIEW_NEXT[fanMode()?'fan':vertMode()?'vert':'flat']);
$('#rowsBtn').onclick=()=>{
  if(fanMode())handRows=nextRows();else flatRows=nextRows();
  try{localStorage.setItem('guandan-rows',handRows);localStorage.setItem('guandan-flatrows',flatRows)}catch(_){}
  syncHandBtns();
  layoutHand();
};
syncHandBtns();
// 复原 sorts the active cards back by rank; the fixed groups stay as they are
$('#sortBtn').onclick=()=>{G.myOrder=[];if(TEST){G.tgLock=[];G.tgKey=''}renderHand();Sound.play('shuffle')};
// 固定: the picked cards go to the fixed zone as one group; when every picked card is already there, 放回 puts them back
$('#fixBtn').onclick=()=>{
  const have=new Set(G.hands[0].map(c=>c.id)),ids=[...sel].filter(id=>have.has(id));
  if(!ids.length)return;
  if(testGrouped()){testRegroup(ids,false);return}
  const fixed=new Set((G.fixed||[]).flat());
  if(ids.every(id=>fixed.has(id)))unfixCards(ids);else fixCards(ids,-1);
  sel=new Set();
  reflowHand();
  Sound.play('play');
};
// 重选 puts the picked cards down and starts the hints (and the straight flushes) over from the first
$('#clearBtn').onclick=()=>{sel=new Set();hintIdx=0;sfIdx=0;renderHand()};
