/* ---------- 牌谱上传: the outbox that sends finished rounds to guandanai's collector ---------- */
// Ported from stevensun1005/guandanai web/src/collection/outbox.mjs and client.js. A finished round is kept in this browser
// (IndexedDB) until the collector answers stored=true; a failed send is tried again later (after 10 s, 20 s, ... at most an hour),
// also after the page is closed and opened again, so a round played offline still arrives
const COLLECT_URL='https://guandan-human-games-collector.couple-ledger-service.workers.dev/rounds';
const Outbox=(()=>{
  const memory=new Map();
  let busy=false,storageFailed=false,saved=0,opening=null;
  function db(){
    if(!opening)opening=new Promise((resolve,reject)=>{
      const q=indexedDB.open('guandan-human-games',1);
      q.onupgradeneeded=()=>q.result.createObjectStore('pending',{keyPath:'id'});
      q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    });
    return opening;
  }
  async function run(mode,method,value){
    const d=await db();
    return new Promise((resolve,reject)=>{
      const tx=d.transaction('pending',mode),r=tx.objectStore('pending')[method](value);
      tx.oncomplete=()=>resolve(r.result);tx.onerror=tx.onabort=()=>reject(tx.error||Error('outbox_unavailable'));
    });
  }
  const store={list:()=>run('readonly','getAll'),put:e=>run('readwrite','put',e),remove:id=>run('readwrite','delete',id)};
  function status(){
    const el=$('#collectStatus');
    if(!el)return;
    const n=memory.size,live=NET.mode==='host'&&NET.humans.size>=2&&!TEST;
    el.hidden=!(n||live);
    el.textContent=n?`牌谱待上传 ${n} 局${storageFailed?' · 本机暂存不可用':''}`:saved?'牌谱已上传':'牌谱自动上传';
  }
  async function add(payload){
    const e={id:payload.id,payload,attempts:0,nextAttempt:0};
    memory.set(e.id,e);
    try{await store.put(e)}catch(_){storageFailed=true}
    status();
    await flush();
  }
  async function flush(){
    if(busy)return;
    busy=true;
    try{
      try{for(const e of await store.list())if(!memory.has(e.id))memory.set(e.id,e)}catch(_){storageFailed=true}
      for(const e of memory.values()){
        if(e.nextAttempt>Date.now())continue;
        try{
          const res=await fetch(COLLECT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(e.payload),signal:AbortSignal.timeout(15000)});
          if(!res.ok)throw Error('upload_failed '+res.status+' '+(await res.text().catch(()=>'')));
          const receipt=await res.json();
          if(receipt.id!==e.id||receipt.stored!==true)throw Error('invalid_receipt');
          // removed only once the collector says it is stored (a repeat send gets the same answer)
          try{await store.remove(e.id)}catch(_){storageFailed=true}
          memory.delete(e.id);saved++;
        }catch(err){
          console.warn('牌谱上传失败，稍后重试',err);
          e.attempts++;e.nextAttempt=Date.now()+Math.min(3600000,5000*2**Math.min(10,e.attempts));
          try{await store.put(e)}catch(_){storageFailed=true}
        }
      }
    }finally{busy=false;status()}
  }
  addEventListener('online',()=>flush());
  setInterval(()=>flush(),15000);
  setTimeout(()=>flush(),3000);
  return{add,flush,status,pending:()=>memory.size};
})();
