/* Skilleaze themed dropdowns + date picker. Replaces the browser's native select / date popups everywhere. */
(function(){
if(window.__skui)return;window.__skui=1;
const NAVY='#042D7C',INK='#2C3E50',LINE='#E3E4E8',MUTE='#5B6470',TINT='#EEF2FA';
const css=document.createElement('style');css.textContent=`
.skui-pop{position:fixed;z-index:2147483000;background:#fff;border:1px solid ${LINE};border-radius:16px;box-shadow:0 18px 48px rgba(4,45,124,.18);padding:6px;font-family:Lato,system-ui,sans-serif;color:${INK};box-sizing:border-box;animation:skuiIn .14s ease-out}
@keyframes skuiIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.skui-list{max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:2px;overscroll-behavior:contain}
.skui-opt{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;font-size:14px;line-height:1.3;cursor:pointer;color:${INK};min-height:40px}
.skui-opt:hover,.skui-opt.kb{background:#F3F5F9}
.skui-opt[aria-selected=true]{background:${TINT};color:${NAVY};font-weight:700}
.skui-opt[aria-disabled=true]{opacity:.45;cursor:default}
.skui-opt .ck{width:16px;flex:none;display:flex;justify-content:center}
.skui-grp{font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:${MUTE};padding:10px 12px 4px}
.skui-btn{display:inline-flex!important;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;text-align:left;white-space:nowrap;box-sizing:border-box;-webkit-appearance:none;appearance:none}
.skui-btn:focus-visible{outline:2px solid ${NAVY};outline-offset:2px}
.skui-btn .lbl{overflow:hidden;text-overflow:ellipsis;min-width:0}
.skui-btn .lbl.ph{color:#8A919C;font-weight:400}
.skui-btn svg{flex:none;color:${NAVY}}
.skui-cal{width:296px;padding:12px}
.skui-cal-h{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:8px}
.skui-cal-h b{font-size:15px;color:${NAVY};font-weight:900}
.skui-ib{all:unset;cursor:pointer;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:${NAVY}}
.skui-ib:hover{background:#F3F5F9}
.skui-sel{all:unset;cursor:pointer;font-size:14px;font-weight:900;color:${NAVY};padding:6px 8px;border-radius:8px}
.skui-sel:hover{background:#F3F5F9}
.skui-g{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.skui-g span{font-size:11px;font-weight:900;color:${MUTE};text-align:center;padding:4px 0;letter-spacing:.04em}
.skui-d{all:unset;box-sizing:border-box;height:36px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;color:${INK}}
.skui-d:hover{background:#F3F5F9}
.skui-d.o{color:#B5BAC3}
.skui-d.t{box-shadow:inset 0 0 0 1.5px ${NAVY};color:${NAVY};font-weight:700}
.skui-d.s{background:${NAVY}!important;color:#fff;font-weight:900}
.skui-yg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-height:252px;overflow:auto}
.skui-yg button{all:unset;cursor:pointer;text-align:center;padding:10px 0;border-radius:10px;font-size:14px}
.skui-yg button:hover{background:#F3F5F9}
.skui-yg button.s{background:${NAVY};color:#fff;font-weight:900}
.skui-f{display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid ${LINE}}
.skui-f button{all:unset;cursor:pointer;font-size:13px;font-weight:900;color:${NAVY};padding:8px 12px;border-radius:999px}
.skui-f button:hover{background:${TINT}}
`;document.head.appendChild(css);
const CHEV='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const CAL='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>';
const TICK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const L=(d,p)=>`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>`;
const MS=['January','February','March','April','May','June','July','August','September','October','November','December'];
let pop=null,popFor=null;
function close(){if(pop){pop.remove();pop=null;}if(popFor){popFor.setAttribute('aria-expanded','false');popFor=null;}}
document.addEventListener('mousedown',e=>{if(pop&&!pop.contains(e.target)&&!(popFor&&popFor.contains(e.target)))close();},true);
document.addEventListener('touchstart',e=>{if(pop&&!pop.contains(e.target)&&!(popFor&&popFor.contains(e.target)))close();},{capture:true,passive:true});
window.addEventListener('resize',close);
document.addEventListener('scroll',e=>{if(pop&&!pop.contains(e.target))place();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pop){const b=popFor;close();b&&b.focus();}});
function place(){if(!pop||!popFor)return;const r=popFor.getBoundingClientRect();const W=Math.max(pop.offsetWidth,0),H=pop.offsetHeight,vw=innerWidth,vh=innerHeight;
 let x=Math.min(Math.max(8,r.left),vw-W-8),y=r.bottom+6;if(y+H>vh-8&&r.top-H-6>8)y=r.top-H-6;if(y+H>vh-8)y=Math.max(8,vh-H-8);pop.style.left=x+'px';pop.style.top=y+'px';}
function open(btn,node){close();pop=node;popFor=btn;btn.setAttribute('aria-expanded','true');document.body.appendChild(pop);place();}
const setVal=(el,v)=>{const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
function mkBtn(el,icon){const b=document.createElement('button');b.type='button';b.className='skui-btn';b.setAttribute('aria-haspopup','listbox');b.setAttribute('aria-expanded','false');
 const lab=el.getAttribute('aria-label');if(lab)b.setAttribute('aria-label',lab);b.style.cssText=el.style.cssText;b.style.display='';const cs=getComputedStyle(el);
 if(!el.style.font&&!el.style.fontFamily)b.style.fontFamily='inherit';if(!el.style.background&&!el.style.backgroundColor)b.style.background='#fff';if(!el.style.border)b.style.border='1px solid #D9DCE3';if(!el.style.borderRadius)b.style.borderRadius='12px';if(!el.style.padding)b.style.padding='9px 12px';if(!el.style.color)b.style.color=INK;
 if(!b.style.minHeight)b.style.minHeight='38px';b.innerHTML=`<span class="lbl"></span>${icon}`;b._el=el;el._skb=b;el.style.display='none';el.setAttribute('data-skui','1');el.insertAdjacentElement('afterend',b);return b;}
/* ---- select ---- */
function syncSel(el){const b=el._skb;if(!b)return;const o=el.options[el.selectedIndex];const t=o?o.text:'';const l=b.firstChild;if(l.textContent!==t)l.textContent=t;b.disabled=el.disabled;b.style.opacity=el.disabled?'.45':'';}
function openSel(el){const b=el._skb;const p=document.createElement('div');p.className='skui-pop';p.setAttribute('role','listbox');p.style.minWidth=Math.max(b.offsetWidth,200)+'px';p.style.maxWidth='min(420px,calc(100vw - 16px))';
 const list=document.createElement('div');list.className='skui-list';p.appendChild(list);const opts=[];
 [...el.children].forEach(c=>{const add=(o)=>{const it=document.createElement('button');it.type='button';it.className='skui-opt';it.setAttribute('role','option');const sel=o.selected;it.setAttribute('aria-selected',sel?'true':'false');if(o.disabled)it.setAttribute('aria-disabled','true');it.innerHTML=`<span class="ck">${sel?TICK:''}</span><span></span>`;it.lastChild.textContent=o.text;
   it.onclick=()=>{if(o.disabled)return;close();b.focus();if(el.value!==o.value)setVal(el,o.value);syncSel(el);};list.appendChild(it);opts.push(it);};
  if(c.tagName==='OPTGROUP'){const g=document.createElement('div');g.className='skui-grp';g.textContent=c.label;list.appendChild(g);[...c.children].forEach(add);}else if(c.tagName==='OPTION'&&!(c.hidden))add(c);});
 open(b,p);let k=Math.max(0,opts.findIndex(o=>o.getAttribute('aria-selected')==='true'));const hl=()=>{opts.forEach((o,i)=>o.classList.toggle('kb',i===k));opts[k]&&opts[k].scrollIntoView&&0;if(opts[k]){const r=opts[k].offsetTop;if(r<list.scrollTop||r>list.scrollTop+list.clientHeight-40)list.scrollTop=r-list.clientHeight/2;}};hl();
 p.onkeydown=e=>{if(e.key==='ArrowDown'){k=Math.min(opts.length-1,k+1);hl();e.preventDefault();}else if(e.key==='ArrowUp'){k=Math.max(0,k-1);hl();e.preventDefault();}else if(e.key==='Enter'||e.key===' '){opts[k]&&opts[k].click();e.preventDefault();}else if(e.key==='Tab')close();};
 (opts[k]||p).focus({preventScroll:true});}
function enhanceSel(el){if(el._skb||el.multiple||el.size>1)return;const b=mkBtn(el,CHEV);syncSel(el);
 b.onclick=()=>{if(popFor===b){close();return;}openSel(el);};b.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();openSel(el);}};}
/* ---- date ---- */
const pad=n=>String(n).padStart(2,'0');const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;};
const fmt=d=>d.getDate()+' '+MS[d.getMonth()].slice(0,3)+' '+d.getFullYear();
function syncDate(el){const b=el._skb;if(!b)return;const d=parse(el.value);const l=b.firstChild;const t=d?fmt(d):(el.getAttribute('placeholder')||(el.getAttribute('aria-label')||'Pick a date'));if(l.textContent!==t)l.textContent=t;l.classList.toggle('ph',!d);}
function openDate(el){const b=el._skb;const sel=parse(el.value);const today=new Date();today.setHours(0,0,0,0);let vm=sel?new Date(sel.getFullYear(),sel.getMonth(),1):new Date(today.getFullYear(),today.getMonth(),1);let mode='d';
 const mn=parse(el.min),mx=parse(el.max);const p=document.createElement('div');p.className='skui-pop skui-cal';p.setAttribute('role','dialog');p.setAttribute('aria-label','Choose date');
 const pick=d=>{close();b.focus();const v=d?iso(d):'';if(el.value!==v)setVal(el,v);syncDate(el);};
 const draw=()=>{if(mode==='y'){const y0=vm.getFullYear();let h=`<div class="skui-cal-h"><b>Choose year</b><button class="skui-ib" data-a="back" aria-label="Back">${L(0,'m15 18-6-6 6-6')}</button></div><div class="skui-yg">`;for(let y=today.getFullYear()+5;y>=1960;y--)h+=`<button data-y="${y}" class="${y===y0?'s':''}">${y}</button>`;p.innerHTML=h+'</div>';const s=p.querySelector('.skui-yg .s');if(s)s.parentNode.scrollTop=s.offsetTop-110;
   p.querySelectorAll('[data-y]').forEach(x=>x.onclick=()=>{vm=new Date(+x.dataset.y,vm.getMonth(),1);mode='d';draw();});p.querySelector('[data-a=back]').onclick=()=>{mode='d';draw();};place();return;}
  const y=vm.getFullYear(),m=vm.getMonth();const first=(new Date(y,m,1).getDay()+6)%7;const start=new Date(y,m,1-first);
  let h=`<div class="skui-cal-h"><button class="skui-ib" data-a="p" aria-label="Previous month">${L(0,'m15 18-6-6 6-6')}</button><button class="skui-sel" data-a="y">${MS[m]} ${y} ▾</button><button class="skui-ib" data-a="n" aria-label="Next month">${L(0,'m9 18 6-6-6-6')}</button></div><div class="skui-g">${['Mo','Tu','We','Th','Fr','Sa','Su'].map(x=>`<span>${x}</span>`).join('')}`;
  for(let i=0;i<42;i++){const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i);const off=(mn&&d<mn)||(mx&&d>mx);const c=['skui-d'];if(d.getMonth()!==m)c.push('o');if(+d===+today)c.push('t');if(sel&&+d===+sel)c.push('s');h+=`<button class="${c.join(' ')}" data-d="${iso(d)}"${off?' disabled style="opacity:.3;cursor:default"':''}>${d.getDate()}</button>`;}
  h+=`</div><div class="skui-f"><button data-a="c">Clear</button><button data-a="t">Today</button></div>`;p.innerHTML=h;
  p.querySelector('[data-a=p]').onclick=()=>{vm=new Date(y,m-1,1);draw();};p.querySelector('[data-a=n]').onclick=()=>{vm=new Date(y,m+1,1);draw();};p.querySelector('[data-a=y]').onclick=()=>{mode='y';draw();};
  p.querySelector('[data-a=c]').onclick=()=>pick(null);p.querySelector('[data-a=t]').onclick=()=>pick(today);
  p.querySelectorAll('[data-d]').forEach(x=>x.onclick=()=>{if(!x.disabled)pick(parse(x.dataset.d));});place();};
 open(b,p);draw();}
function enhanceDate(el){if(el._skb)return;const b=mkBtn(el,CAL);b.setAttribute('aria-haspopup','dialog');syncDate(el);b.onclick=()=>{if(popFor===b){close();return;}openDate(el);};}
/* ---- wiring ---- */
function scan(root){(root.querySelectorAll?root:document).querySelectorAll('select:not([data-skui]),input[type=date]:not([data-skui]),input[type=month]:not([data-skui])').forEach(el=>{if(el.closest('[data-skui-off]'))return;el.tagName==='SELECT'?enhanceSel(el):enhanceDate(el);});}
function sweep(){document.querySelectorAll('.skui-btn').forEach(b=>{const el=b._el;if(!el||!el.isConnected){if(popFor===b)close();b.remove();return;}if(el.style.display!=='none')el.style.display='none';if(b.previousElementSibling!==el&&el.parentNode&&!b._moved){b._moved=(b._moved||0)+1;el.insertAdjacentElement('afterend',b);}el.tagName==='SELECT'?syncSel(el):syncDate(el);});}
let busy=false;const tick=()=>{if(busy)return;busy=true;try{scan(document);sweep();}catch(e){}busy=false;};tick();setInterval(tick,400);
})();
