let resizeT=0;
window.addEventListener('resize',()=>{layoutHand();symPlates();clearTimeout(resizeT);resizeT=setTimeout(()=>{centerRank();placeLastPlay();pileRebuild()},150)});
// 转屏: an iPad turned from landscape to upright (or back) reports its new size late, in pieces, or at times not by a resize event at
// all, so the page was left laid out for the old shape. The size is checked on every signal the browser gives (turning, the screen's
// orientation, the visible viewport, a resize) and again a moment after, and once more every second: whenever it differs from what
// the page was laid out for, everything is laid out again, from the state, as for a new size
let rotKey=innerWidth+'x'+innerHeight;
function checkRotate(){
  const k=innerWidth+'x'+innerHeight;
  if(k===rotKey)return;
  rotKey=k;
  if(TEST)return;
  window.scrollTo(0,0);
  phoneSwitch();
  if(!G)return;
  renderHand();render();layoutHand();symPlates();centerRank();placeLastPlay();pileRebuild();
}
// (The page's own part: laid out again whenever its size is seen to change, never by touching the viewport setting: that made the
// browser lay the page out again, which made another resize, which went round and round - the screen shook when 全屏 was pressed)
const rotSoon=()=>{for(const ms of [0,120,350,800,1500])setTimeout(checkRotate,ms)};
addEventListener('orientationchange',rotSoon);
addEventListener('resize',rotSoon);
if(screen.orientation&&screen.orientation.addEventListener)screen.orientation.addEventListener('change',rotSoon);
if(window.visualViewport)visualViewport.addEventListener('resize',rotSoon);
setInterval(checkRotate,1000);
// 诊断: with #debug at the end of the address, a small box in the corner shows what the browser tells the page about its size and
// how the device is held, live (to find out why a turned iPad is not laid out afresh)
if(location.hash==='#debug'){
  const d=document.createElement('pre');
  d.style.cssText='position:fixed;left:4px;bottom:4px;z-index:9999;margin:0;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.78);color:#8f8;font:12px/1.35 ui-monospace,Menlo,monospace;pointer-events:none;white-space:pre';
  document.body.appendChild(d);
  let rs=0,rt='-',os=0;
  addEventListener('resize',()=>{rs++;rt=new Date().toLocaleTimeString()});
  addEventListener('orientationchange',()=>{os++});
  const root=document.documentElement,vv=window.visualViewport;
  setInterval(()=>{
    const r=root.getBoundingClientRect(),so=screen.orientation;
    d.textContent=['inner '+innerWidth+'x'+innerHeight,'client '+root.clientWidth+'x'+root.clientHeight+'  scroll '+root.scrollWidth+'x'+root.scrollHeight,
      'visual '+(vv?Math.round(vv.width)+'x'+Math.round(vv.height)+' scale '+vv.scale.toFixed(2)+' off '+Math.round(vv.offsetLeft)+','+Math.round(vv.offsetTop):'none'),
      'screen '+screen.width+'x'+screen.height+' dpr '+devicePixelRatio,'orient '+(so?so.type:'-')+' / '+window.orientation,
      'resize x'+rs+' ('+rt+')  orientationchange x'+os,'html '+Math.round(r.width)+'x'+Math.round(r.height),
      (/Macintosh/.test(navigator.userAgent)?'UA Macintosh (desktop site)':'UA mobile'),'v '+document.querySelector('meta[name=viewport]').content].join(String.fromCharCode(10));
  },400);
}
// the page can be laid out before it is shown (zero width); lay the hand out again once it gets its real width
let handW=0;
if(window.ResizeObserver)new ResizeObserver(()=>{const w=handEl.clientWidth;if(w&&w!==handW){handW=w;layoutHand()}}).observe(handEl);

