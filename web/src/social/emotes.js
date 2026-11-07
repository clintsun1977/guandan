/* ---------- 表情: gifts thrown between seats, emoji beside your own seat and quick phrases read aloud ---------- */
// Taken from stevensun1005/guandanai (web/src/social/emotes.mjs and controller.js, https://github.com/stevensun1005/guandanai).
// Players pick a preset: a gift thrown at another seat (卡布奇诺, 鲜花, 炸弹), an emoji with an effect beside their own seat
// (墨镜, 哭) or a quick phrase that pops up and is read aloud. Only preset ids (plus the receiving seat for gifts) travel over
// the room connection; the host checks the id, the receiver and a per-seat rate limit, then passes it on with the sender's
// seat, so nobody can post free text or speak for another seat. A computer seat that gets a gift from a person answers with
// an emote of its own. Emotes are not game actions: they are not logged, replayed or uploaded, and never change how a bot plays.
// Everything lives inside one closure, so its helper names (later, place, ...) cannot clash with the page's own
const Emotes=(()=>{
  const entry=(id,kind,text,label)=>Object.freeze({id,kind,text,label});
  const EMOTES=Object.freeze([
    entry('g01','gift','☕','卡布奇诺'),
    entry('g02','gift','🌹','鲜花'),
    entry('g03','gift','💣','炸弹'),
    entry('e01','emoji','😎','墨镜'),
    entry('e02','emoji','😭','哭'),
    // small talk only: nothing that tells a partner how to play (no "bomb now", "hold it"); ids as guandanai published them
    ...[['p01','快点吧，我等的花儿都谢了'],['p02','给阿姨倒一杯卡布奇诺'],['p03','你的牌打得也太好了'],['p04','和你合作真是太愉快了'],
      ['p05','不要走，决战到天亮'],['p06','大家好，很高兴见到各位'],['p07','不好意思，刚才网络卡了'],['p12','再来一局！']]
      .map(([id,text])=>entry(id,'phrase',text,text)),
  ]);
  const byId=new Map(EMOTES.map(e=>[e.id,e]));
  const emoteById=id=>(typeof id==='string'&&byId.get(id))||null;
  // gifts need another seat as the receiver; every other kind must not name one
  function validTarget(item,from,to){
    if(!item)return false;
    if(item.kind!=='gift')return to===undefined||to===null;
    return Number.isInteger(to)&&to>=0&&to<=3&&to!==from;
  }
  const COOLDOWN_MS=2500;
  function limiter(cooldown){
    const last=new Map();
    return seat=>{const t=Date.now();if(last.has(seat)&&t-last.get(seat)<cooldown)return false;last.set(seat,t);return true};
  }
  // a computer that gets a gift answers: 卡布奇诺 / 鲜花 come back or it puts on sunglasses, a bomb comes back or it cries
  const BOT_REPLIES={g01:['g01','e01'],g02:['g02','e01'],g03:['g03','e02']};
  const botReply=id=>{const o=BOT_REPLIES[id];return o?o[Math.floor(Math.random()*o.length)%o.length]:null};

  const SHOW_MS=3500,FLIGHT_MS=750,LAND_MS=2600,BOT_COOLDOWN_MS=6000,MUTE_KEY='guandan-emote-muted-v1';
  const SEAT_NAMES=['你','下家','对家','上家'];
  const SEAT_PITCH=[1,1.35,.8,1.15]; // each seat's own voice pitch, so the phrases are told apart by ear
  const hostLimiter=limiter(COOLDOWN_MS),botLimiter=limiter(BOT_COOLDOWN_MS),timers=new Map();
  let muted=false,coolingUntil=0,pendingGift=null;
  const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seatName(local){
    if(local===0)return'你';
    const name=$(`#seat${local} .name`)?.textContent?.trim();
    return name||SEAT_NAMES[local];
  }
  // the name plate a seat's emotes point at, in this page's own numbering (0 = you)
  const plateOf=local=>local===0?$('#mebar .meinfo'):$(`#seat${local} .who`);
  function centerOf(local){const r=plateOf(local)?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null}
  // beside the plate: below the far seat, inward for the sides, above your own; kept inside the window
  function place(bubble,local){
    const plate=plateOf(local);
    if(!plate)return;
    const r=plate.getBoundingClientRect(),gap=8;
    const [left,top,translate]=local===2?[r.left+r.width/2,r.bottom+gap,'-50% 0']:local===3?[r.right+gap,r.top+r.height/2,'0 -50%']
      :local===1?[r.left-gap,r.top+r.height/2,'-100% -50%']:[r.left+r.width/2,r.top-gap,'-50% -100%'];
    Object.assign(bubble.style,{left:`${left}px`,top:`${top}px`,translate});
    const box=bubble.getBoundingClientRect(),margin=6;
    const shift=box.left<margin?margin-box.left:box.right>innerWidth-margin?innerWidth-margin-box.right:0;
    if(shift)bubble.style.left=`${left+shift}px`;
  }
  function sound(name,arg){try{Sound.play(name,arg)}catch(_){}}
  // a quick phrase read aloud by the browser's own speech synthesis (when it has a Chinese voice, and 音效 is on)
  function speak(text,local){
    try{
      const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
      if(!synth||!Sound.prefs.sfx||typeof Utterance!=='function')return;
      const say=new Utterance(text);
      say.lang='zh-CN';say.rate=1.05;say.pitch=SEAT_PITCH[local]??1;
      const voice=synth.getVoices().find(v=>/^zh(-|_)?CN/i.test(v.lang)||/^zh/i.test(v.lang));
      if(voice)say.voice=voice;
      synth.cancel();synth.speak(say);
    }catch(_){}
  }
  function announce(text){const live=$('#emoteLive');if(live)live.textContent=text}
  const removeLater=(el,ms)=>setTimeout(()=>el.remove(),ms);
  // a few pieces flying out of (x, y) and fading: bomb fire, flower petals or coffee steam
  function burst(x,y,kind){
    if(reducedMotion())return;
    const pieces={
      g01:{text:['','','','',''],spread:30,rise:-70,ms:1300,cls:'steam'},
      g02:{text:['🌸','🌸','🌹','🌸','💮','🌸','🌸','🌸'],spread:90,rise:70,ms:1500},
      g03:{text:['💥','🔥','✨','🔥','💥','✨','🔥','💥'],spread:110,rise:0,ms:900},
      e01:{text:['✨','⭐','✨','✨'],spread:45,rise:-10,ms:1100},
      e02:{text:['💧','💧','💧','💧','💧','💧'],spread:28,rise:60,ms:1200},
    }[kind];
    if(!pieces)return;
    pieces.text.forEach((text,i)=>{
      const piece=document.createElement('div');
      piece.className=`emote-particle ${pieces.cls||''}`;
      piece.textContent=text;piece.style.left=`${x}px`;piece.style.top=`${y}px`;
      document.body.append(piece);
      const angle=(i/pieces.text.length)*Math.PI*2+Math.random()*.6;
      const dx=Math.cos(angle)*pieces.spread*(.6+Math.random()*.4);
      const dy=Math.sin(angle)*pieces.spread*.5+pieces.rise*(.6+Math.random()*.6);
      piece.animate([
        {transform:'translate(-50%, -50%) scale(0.4)',opacity:0},
        {transform:'translate(-50%, -50%) scale(1)',opacity:1,offset:.15},
        {transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.8) rotate(${dx}deg)`,opacity:0},
      ],{duration:pieces.ms,delay:i*40,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'});
      removeLater(piece,pieces.ms+i*40+60);
    });
  }
  function shake(local){
    const seat=local===0?$('#mebar'):$(`#seat${local}`);
    if(!seat||reducedMotion())return;
    seat.classList.remove('emote-shake');void seat.offsetWidth;seat.classList.add('emote-shake');
    setTimeout(()=>seat.classList.remove('emote-shake'),600);
  }
  // the gift lands on the receiver's plate with its own effect and sound
  function land(from,to,e){
    const at=centerOf(to);
    if(!at)return;
    document.querySelector(`.emote-gift[data-to="${to}"]`)?.remove();
    const gift=document.createElement('div');
    gift.className=`emote-gift ${e.id}`;gift.dataset.from=String(from);gift.dataset.to=String(to);
    gift.textContent=e.text;gift.title=`${seatName(from)} → ${seatName(to)}：${e.label}`;
    gift.style.left=`${at.x}px`;gift.style.top=`${at.y}px`;
    document.body.append(gift);
    removeLater(gift,LAND_MS);
    if(e.id==='g03'){
      const blast=document.createElement('div');
      blast.className='emote-blast';blast.style.left=`${at.x}px`;blast.style.top=`${at.y}px`;
      document.body.append(blast);removeLater(blast,700);
      shake(to);sound('bomb',true);
    }else sound(e.id==='g02'?'ding':'pop');
    burst(at.x,at.y,e.id);
  }
  // throw a gift from one seat to another (both in this page's numbering)
  function throwGift(from,to,e){
    const start=centerOf(from),end=centerOf(to);
    if(!start||!end)return false;
    announce(`${seatName(from)}送给${seatName(to)}：${e.label}`);
    if(reducedMotion()||typeof document.body.animate!=='function'){land(from,to,e);return true}
    const flight=document.createElement('div');
    flight.className=`emote-flight ${e.id}`;flight.textContent=e.text;
    flight.style.left=`${start.x}px`;flight.style.top=`${start.y}px`;
    document.body.append(flight);
    const dx=end.x-start.x,dy=end.y-start.y,lift=Math.min(140,40+Math.hypot(dx,dy)*.25);
    const spin=e.id==='g03'?540:e.id==='g02'?200:0;
    flight.animate([
      {transform:'translate(-50%, -50%) scale(0.6) rotate(0deg)'},
      {transform:`translate(calc(-50% + ${dx/2}px), calc(-50% + ${dy/2-lift}px)) scale(1.25) rotate(${spin/2}deg)`},
      {transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${spin}deg)`},
    ],{duration:FLIGHT_MS,easing:'ease-in-out',fill:'forwards'});
    sound('whoosh');
    setTimeout(()=>{flight.remove();land(from,to,e)},FLIGHT_MS);
    return true;
  }
  // a bubble beside the sender's plate: the emoji with its effect, or the phrase (read aloud)
  function popBubble(local,e){
    if(!plateOf(local))return false;
    document.querySelector(`.emote-bubble[data-seat="${local}"]`)?.remove();
    const bubble=document.createElement('div');
    bubble.className=`emote-bubble kind-${e.kind} ${e.id}`;bubble.dataset.seat=String(local);
    bubble.textContent=e.text;bubble.title=e.label;
    document.body.append(bubble);
    place(bubble,local);
    clearTimeout(timers.get(local));
    timers.set(local,setTimeout(()=>bubble.remove(),SHOW_MS));
    announce(`${seatName(local)}：${e.label}`);
    if(e.kind==='phrase'){sound('pop');speak(e.text,local)}
    else{const r=bubble.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,e.id);sound(e.id==='e02'?'sob':'whoosh')}
    return true;
  }
  // show an emote from a seat in this page's own numbering (0 = you); gifts name the receiver in the same numbering
  function showEmote(local,id,to){
    const e=emoteById(id);
    if(!e||!Number.isInteger(local)||local<0||local>3||!validTarget(e,local,to))return false;
    if(muted&&local!==0)return false;
    return e.kind==='gift'?throwGift(local,to,e):popBubble(local,e);
  }
  // to the friends at the table (the host's own connections; spectators do not get them)
  function relay(msg){for(const v of NET.conns.values())if(v.conn&&v.conn.open)v.conn.send(msg)}
  // on the host (or alone): show an emote from an absolute seat, tell the friends, let a computer answer a gift
  function publish(seat,id,to){
    const gift=Number.isInteger(to);
    showEmote(toLocal(seat),id,gift?toLocal(to):undefined);
    relay(gift?{t:'emote',seat,id,to}:{t:'emote',seat,id});
    if(gift)answerGift(seat,id,to);
  }
  // a computer seat answers a person's gift after a short pause, at most once in six seconds, so two bots never ping-pong
  function answerGift(from,id,to){
    if(NET.mode==='guest')return;
    if(isHumanSeat(toLocal(to))||!isHumanSeat(toLocal(from)))return;
    if(!botLimiter(to))return;
    const reply=botReply(id);
    if(!reply)return;
    setTimeout(()=>{
      if(!G||isHumanSeat(toLocal(to)))return;
      publish(to,reply,emoteById(reply).kind==='gift'?from:undefined);
    },1000+Math.random()*1000);
  }
  // the host got an emote from a friend's seat (absolute numbering)
  function hostEmote(seat,id,to){
    const e=emoteById(id);
    if(!e||!Number.isInteger(seat)||!validTarget(e,seat,to)||!hostLimiter(seat))return false;
    publish(seat,id,e.kind==='gift'?to:undefined);
    return true;
  }
  // a friend's page got the host's relay (absolute numbering); its own emote already showed when it was sent
  function guestEmote(seat,id,to){
    const e=emoteById(id);
    if(!e||!Number.isInteger(seat)||seat<0||seat>3||!validTarget(e,seat,to)||seat===toAbs(0))return false;
    return showEmote(toLocal(seat),id,e.kind==='gift'?toLocal(to):undefined);
  }
  // send one of the presets from this page's own seat; a gift names its receiver in this page's numbering
  function sendEmote(id,toSeat){
    const e=emoteById(id);
    if(!e||!G||!validTarget(e,0,toSeat))return false;
    const now=Date.now();
    if(now<coolingUntil)return false;
    coolingUntil=now+COOLDOWN_MS;
    const to=e.kind==='gift'?toAbs(toSeat):undefined;
    if(NET.mode==='guest'){
      showEmote(0,id,toSeat);
      if(NET.hostConn&&NET.hostConn.open)NET.hostConn.send(e.kind==='gift'?{t:'emote',id,to}:{t:'emote',id});
    }else{hostLimiter(toAbs(0));publish(toAbs(0),id,to)}
    paintCooldown();
    return true;
  }
  // the button stays disabled during the cooldown, with a ring that sweeps round until it is ready
  function paintCooldown(){
    const button=$('#emoteBtn'),wait=coolingUntil-Date.now();
    button.disabled=wait>0;
    if(wait>0&&!button.classList.contains('cooling')){button.style.setProperty('--cool-ms',`${wait}ms`);button.classList.add('cooling')}
    else if(wait<=0)button.classList.remove('cooling');
    if(wait>0)setTimeout(paintCooldown,wait+20);
  }
  function showTargets(e){
    const box=$('#emoteTargets');
    pendingGift=e;
    box.replaceChildren();
    const title=document.createElement('div');
    title.className='emote-targets-title';title.textContent=`把${e.label}送给`;
    box.append(title);
    for(const local of [3,2,1]){
      const b=document.createElement('button');
      b.type='button';b.className='emote-target';b.dataset.to=String(local);
      const name=seatName(local);
      b.textContent=name===SEAT_NAMES[local]?name:`${SEAT_NAMES[local]} · ${name}`;
      b.onclick=()=>{if(sendEmote(pendingGift.id,local))setPanel(false)};
      box.append(b);
    }
    box.hidden=false;
    for(const c of document.querySelectorAll('#emoteGrid .emote-choice'))c.setAttribute('aria-pressed',String(c.dataset.id===e.id));
    box.querySelector('.emote-target')?.focus();
  }
  function hideTargets(){
    pendingGift=null;
    $('#emoteTargets').hidden=true;
    for(const c of document.querySelectorAll('#emoteGrid .emote-choice'))c.removeAttribute('aria-pressed');
  }
  // the panel opens just above the button, kept inside the window
  function placePanel(){
    const panel=$('#emotePanel'),button=$('#emoteBtn');
    if(panel.hidden)return;
    const r=button.getBoundingClientRect(),margin=10,width=panel.offsetWidth,center=r.left+r.width/2;
    const left=Math.max(margin,Math.min(innerWidth-margin-width,center-width/2));
    panel.style.left=`${left}px`;
    panel.style.bottom=`${Math.max(margin,innerHeight-r.top+10)}px`;
    panel.style.setProperty('--arrow-x',`${Math.max(18,Math.min(width-18,center-left))}px`);
  }
  function setTab(name){
    for(const tab of document.querySelectorAll('#emoteTabs [role=tab]')){
      const on=tab.dataset.tab===name;
      tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;
      $(`#${tab.getAttribute('aria-controls')}`).hidden=!on;
    }
    hideTargets();
  }
  function setPanel(open){
    const panel=$('#emotePanel');
    hideTargets();
    panel.hidden=!open;
    $('#emoteBtn').setAttribute('aria-expanded',String(open));
    if(!open)return;
    placePanel();
    panel.querySelector('.emote-page:not([hidden]) button')?.focus();
  }
  function buildPanel(){
    const grid=$('#emoteGrid'),phrases=$('#emotePhrases');
    for(const e of EMOTES){
      const b=document.createElement('button');
      b.type='button';b.className=`emote-choice kind-${e.kind}`;b.dataset.id=e.id;
      b.title=e.kind==='gift'?`送${e.label}`:e.label;
      b.setAttribute('aria-label',e.kind==='phrase'?e.text:b.title);
      if(e.kind==='phrase')b.textContent=e.text;
      else{
        const icon=document.createElement('span');icon.className='emote-icon';icon.textContent=e.text;
        const label=document.createElement('span');label.className='emote-label';label.textContent=e.label;
        b.append(icon,label);
      }
      b.onclick=()=>{if(e.kind==='gift')showTargets(e);else if(sendEmote(e.id))setPanel(false)};
      (e.kind==='phrase'?phrases:grid).append(b);
    }
    const mute=$('#emoteMute');
    mute.checked=muted;
    mute.onchange=()=>{
      muted=mute.checked;
      try{localStorage.setItem(MUTE_KEY,String(muted))}catch(_){}
      if(muted){
        for(const n of document.querySelectorAll('.emote-bubble:not([data-seat="0"]), .emote-gift:not([data-from="0"])'))n.remove();
        try{window.speechSynthesis?.cancel()}catch(_){}
      }
    };
  }
  // the 😊 button is there while a game is on the table: not in the lobby, the training version, a 残局 or for a spectator
  function sync(){
    const on=!!G&&G.phase!=='start'&&!TEST&&!SPEC&&!ENDG&&$('#lobby').hidden;
    $('#emoteBtn').hidden=!on;
    if(!on&&!$('#emotePanel').hidden)setPanel(false);
  }
  try{muted=localStorage.getItem(MUTE_KEY)==='true'}catch(_){}
  buildPanel();
  for(const tab of document.querySelectorAll('#emoteTabs [role=tab]'))tab.onclick=()=>setTab(tab.dataset.tab);
  $('#emoteTabs').addEventListener('keydown',ev=>{
    if(ev.key!=='ArrowLeft'&&ev.key!=='ArrowRight')return;
    const tabs=[...document.querySelectorAll('#emoteTabs [role=tab]')];
    const next=tabs[(tabs.indexOf(document.activeElement)+1)%tabs.length]||tabs[0];
    setTab(next.dataset.tab);next.focus();
  });
  setTab('emotes');
  addEventListener('resize',placePanel);
  $('#emoteBtn').onclick=ev=>{ev.stopPropagation();Sound.unlock();setPanel($('#emotePanel').hidden)};
  $('#emotePanel').onclick=ev=>ev.stopPropagation();
  document.addEventListener('click',()=>{if(!$('#emotePanel').hidden)setPanel(false)});
  document.addEventListener('keydown',ev=>{
    if(ev.key!=='Escape'||$('#emotePanel').hidden)return;
    if(pendingGift){const id=pendingGift.id;hideTargets();$(`#emoteGrid .emote-choice[data-id="${id}"]`)?.focus();return}
    setPanel(false);$('#emoteBtn').focus();
  });
  return{sendEmote,hostEmote,guestEmote,showEmote,sync,EMOTES};
})();
