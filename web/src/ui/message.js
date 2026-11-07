function setMsg(t,err){
  const m=$('#msg');
  m.textContent=t;m.classList.toggle('err',!!err);
  if(err)Sound.play('error');
  clearTimeout(msgTimer);
  msgTimer=setTimeout(()=>{msgTimer=0;renderMsg()},1600);
}

