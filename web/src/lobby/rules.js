// your own choice of rules (a room you join shows the host's instead)
function loadRules(){
  Object.assign(RULES,{trib:true,aFail:'draw',bot:'danmcai',coach:true,lvSN:2,lvEW:2,playSide:'',order:[],aSN:0,aEW:0});NET.startDone=false;
  try{const r=JSON.parse(localStorage.getItem('guandan-rules')||'{}');if(r.trib!==undefined)RULES.trib=r.trib;if(r.aFail)RULES.aFail=r.aFail;if(r.bot==='clint'||NeuralBot.has(r.bot))RULES.bot=r.bot;if(r.coach!==undefined)RULES.coach=!!r.coach}catch(_){}
}
const ruleBtns=[...document.querySelectorAll('.rule-btn')];
function renderRules(){
  const mine=lobbyMode!=='join';
  for(const b of ruleBtns){
    b.classList.toggle('on',b.dataset.val===(b.dataset.rule==='trib'?(RULES.trib?'1':'0'):b.dataset.rule==='bot'?(RULES.bot||'danmcai'):b.dataset.rule==='coach'?(RULES.coach===false?'0':'1'):RULES.aFail));
    b.disabled=!mine;
  }
  $('#rulesNote').textContent=mine?'':'规则由房主选定';
  mlRenderBtn();
  // 牌谱采集: said to everyone in a room before they sit down
  $('#collectNote').textContent=lobbyMode==='solo'?'':'两名以上真人时，每局牌谱匿名上传到 guandanai，用于 AI 训练（不含昵称、房间号、语音）';
  renderLevel();
}
// 选级: the state to start the first match from (see applyStart): so a table that cannot get back to a game it dropped out of can go
// on from where it was
const SIDE_NAME={SN:'南北',EW:'东西'},DIR_NAME={S:'南',E:'东',N:'北',W:'西'},RANK_NAME=['头游','二游','三游','末游'];
const dirSide=d=>'SN'.includes(d)?'SN':'EW';
function renderLevel(){
  const mine=lobbyMode!=='join',chosen=levelChosen();
  const b=$('#levelBtn');
  b.innerHTML=chosen?`南北${rankName(RULES.lvSN||2)}<br>东西${rankName(RULES.lvEW||2)}`:'选级';
  b.classList.toggle('on',chosen);
  const pk=$('#levelPick');
  if(pk.hidden)return;
  const dis=mine?'':' disabled';
  const lvRow=(side,cls,key)=>{
    const cur=RULES[key]||2;let h='';
    for(let n=2;n<=14;n++)h+=`<button type="button" class="rule-btn ${cls}${n===cur?' on':''}" data-lvk="${key}" data-lv="${n}"${dis}>${rankName(n)}</button>`;
    return`<div class="level-row"><span class="level-k">${SIDE_NAME[side]}打</span>${h}</div>`;
  };
  const o=RULES.order&&RULES.order.length===4?RULES.order:['','','',''];
  const ordRows=RANK_NAME.map((nm,i)=>`<div class="level-row"><span class="level-k">${nm}</span>${DIRS.map(d=>
    `<button type="button" class="rule-btn ${dirSide(d)==='SN'?'lv-red':'lv-blue'}${o[i]===d?' on':''}" data-ord="${i}" data-d="${d}"${dis}>${DIR_NAME[d]}</button>`).join('')}</div>`).join('');
  let pay='';
  if(o.every(Boolean)){
    const dbl=dirSide(o[0])===dirSide(o[1]);
    pay=dbl?`双下：${DIR_NAME[o[2]]}、${DIR_NAME[o[3]]}进贡，${DIR_NAME[o[0]]}、${DIR_NAME[o[1]]}收`:`${DIR_NAME[o[3]]}进贡给${DIR_NAME[o[0]]}`;
    pay='进贡：'+pay;
  }else if(o.some(Boolean))pay='名次没选全';
  const ps=RULES.playSide||'';
  const aRow=(side,cls,key)=>`<div class="level-row"><span class="level-k">${SIDE_NAME[side]}打A不过</span>${[0,1,2].map(n=>`<button type="button" class="rule-btn ${cls}${(RULES[key]||0)===n?' on':''}" data-ak="${key}" data-an="${n}"${dis}>${n} 次</button>`).join('')}</div>`;
  pk.innerHTML=`<div class="level-card">
    <h3>选级（接着之前的牌局）</h3>
    ${lvRow('SN','lv-red','lvSN')}${lvRow('EW','lv-blue','lvEW')}
    <div class="level-row"><span class="level-k">这一局打谁的级</span>
      <button type="button" class="rule-btn lv-red${ps==='SN'?' on':''}" data-side="SN"${dis}>南北</button>
      <button type="button" class="rule-btn lv-blue${ps==='EW'?' on':''}" data-side="EW"${dis}>东西</button>
      <button type="button" class="rule-btn${ps?'':' on'}" data-side=""${dis}>自动</button></div>
    <div class="hint">上一局的名次（决定谁进贡，不选就是第一局，不进贡）</div>
    ${ordRows}
    <div class="hint">${pay||'&nbsp;'}</div>
    ${aRow('SN','lv-red','aSN')}${aRow('EW','lv-blue','aEW')}
    <div class="level-row">${mine?'<button type="button" class="rule-btn" data-lvreset="1">还原</button>':'<span class="rule-note">由房主选定</span>'}<button type="button" class="rule-btn" data-lvdone="1">好</button></div>
  </div>`;
}
$('#levelBtn').onclick=()=>{
  Sound.unlock();Sound.play('select');
  const pk=$('#levelPick');pk.hidden=!pk.hidden;renderLevel();
};
$('#levelPick').addEventListener('click',e=>{
  if(e.target===$('#levelPick')){$('#levelPick').hidden=true;renderLevel();return}
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.lvdone){$('#levelPick').hidden=true;renderLevel();return}
  if(lobbyMode==='join')return;
  const d=t.dataset;
  if(d.lvk)RULES[d.lvk]=+d.lv;
  else if(d.side!==undefined)RULES.playSide=RULES.playSide===d.side?'':d.side;
  else if(d.ak)RULES[d.ak]=+d.an;
  else if(d.ord!==undefined){
    const i=+d.ord,o=RULES.order&&RULES.order.length===4?RULES.order.slice():['','','',''];
    if(o[i]===d.d)o[i]='';
    else{for(let j=0;j<4;j++)if(o[j]===d.d)o[j]='';o[i]=d.d}
    // three named: the fourth place is the one left
    if(o.filter(Boolean).length===3)o[o.indexOf('')]=DIRS.find(x=>!o.includes(x));
    RULES.order=o;
  }
  else if(d.lvreset){Object.assign(RULES,{lvSN:2,lvEW:2,playSide:'',order:[],aSN:0,aEW:0})}
  else return;
  Sound.play('select');
  renderLevel();
  if(lobbyMode==='host')broadcastLobby();
});
ruleBtns.forEach(b=>b.addEventListener('click',()=>{
  if(lobbyMode==='join')return;
  if(b.dataset.rule==='trib')RULES.trib=b.dataset.val==='1';else if(b.dataset.rule==='bot'){RULES.bot=b.dataset.val;botPreload()}else if(b.dataset.rule==='coach')RULES.coach=b.dataset.val==='1';else RULES.aFail=b.dataset.val;
  try{localStorage.setItem('guandan-rules',JSON.stringify({trib:RULES.trib,aFail:RULES.aFail,bot:RULES.bot,coach:RULES.coach}))}catch(_){}
  Sound.unlock();Sound.play('select');
  renderRules();
  if(lobbyMode==='host')broadcastLobby();
}));
