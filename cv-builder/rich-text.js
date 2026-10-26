/* Skilleaze rich text: safe formatting inside CV fields (bold, italic, underline, colour, alignment, lists, links),
   the floating editing toolbar, and Word (DOCX) helpers. Plain text stays plain; formatted text is stored as a small safe HTML subset. */
(function(){
if(window.SKRT)return;
const RICH=/<\/?(b|strong|i|em|u|a|span|font|ul|ol|li|br|div|p)\b/i;
const escT=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escA=t=>escT(t).replace(/"/g,'&quot;');
const COLOR=/^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))$/i;
const ALIGN=/^(left|center|right|justify)$/;
function hex(c){c=String(c||'').trim();const m=/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);if(m)return '#'+[m[1],m[2],m[3]].map(n=>(+n).toString(16).padStart(2,'0')).join('');return COLOR.test(c)?c:'';}
function walk(node,out,top){
  for(const n of node.childNodes){
    if(n.nodeType===3){out.push(escT(n.nodeValue));continue;}
    if(n.nodeType!==1)continue;const t=n.tagName.toLowerCase();const inner=[];walk(n,inner,false);const h=inner.join('');
    if(t==='br'){out.push('<br>');continue;}
    if(t==='b'||t==='strong'||(n.style&&(n.style.fontWeight==='bold'||+n.style.fontWeight>=600))&&t!=='span'){out.push(h?'<b>'+h+'</b>':'');continue;}
    if(t==='i'||t==='em'){out.push(h?'<i>'+h+'</i>':'');continue;}
    if(t==='u'){out.push(h?'<u>'+h+'</u>':'');continue;}
    if(t==='a'){const href=n.getAttribute('href')||'';if(/^(https?:|mailto:|tel:)/i.test(href)&&h)out.push('<a href="'+escA(href)+'">'+h+'</a>');else out.push(h);continue;}
    if(t==='ul'||t==='ol'){if(h)out.push('<'+t+' style="margin:4px 0;padding-left:20px">'+h+'</'+t+'>');continue;}
    if(t==='li'){out.push('<li style="margin:0 0 2px">'+h+'</li>');continue;}
    let col='',w='',st='',dec='',al='';
    if(t==='font')col=hex(n.getAttribute('color'));
    if(n.style){col=col||hex(n.style.color);w=n.style.fontWeight;st=n.style.fontStyle;dec=n.style.textDecorationLine||n.style.textDecoration||'';al=n.style.textAlign;}
    let x=h;if(w==='bold'||+w>=600)x='<b>'+x+'</b>';if(st==='italic')x='<i>'+x+'</i>';if(/underline/.test(dec))x='<u>'+x+'</u>';
    if(col&&x)x='<span style="color:'+col+'">'+x+'</span>';
    if(t==='div'||t==='p'){if(ALIGN.test(al||'')&&x)x='<span style="display:block;text-align:'+al+'">'+x+'</span>';out.push((out.length&&!/<br>$/.test(out[out.length-1])?'<br>':'')+x);continue;}
    if(ALIGN.test(al||'')&&t==='span'&&/display:\s*block/.test(n.getAttribute('style')||''))x='<span style="display:block;text-align:'+al+'">'+x+'</span>';
    out.push(x);
  }
}
function clean(html){const d=document.createElement('template');d.innerHTML=String(html??'');const out=[];walk(d.content,out,true);
  return out.join('').replace(/^(<br>)+|(<br>)+$/g,'').replace(/(<br>){3,}/g,'<br><br>');}
function isRich(s){return RICH.test(String(s??''));}
function plain(s){s=String(s??'');if(!isRich(s))return s;const d=document.createElement('div');d.innerHTML=s.replace(/<br\s*\/?>/gi,'\n').replace(/<\/li>/gi,'\n');return d.textContent.replace(/\n{3,}/g,'\n\n').trim();}
// value -> safe HTML for display (plain strings are escaped)
function html(s){s=String(s??'');return isRich(s)?clean(s):escT(s);}
function hasFormat(h){return /<(b|i|u|a|span|ul|ol|li)\b/.test(h);}
// prepare a field for editing: alignment wrapper moves onto the element itself
function toEdit(n,v){v=String(v??'');let al='';const m=/^<span style="display:block;text-align:(left|center|right|justify)">([\s\S]*)<\/span>$/.exec(v);if(m){al=m[1];v=m[2];}
  n.innerHTML=isRich(v)?clean(v):escT(v).replace(/\n/g,'<br>');if(al){n.style.textAlign=al;n.style.display='block';}n.dataset.al=al||'';}
function fromEdit(n,multiline){let h=clean(n.innerHTML).replace(/&nbsp;/g,' ');const al=n.dataset.al||'';
  if(!hasFormat(h)&&!al){const d=document.createElement('div');d.innerHTML=h.replace(/<br>/g,'\n');let t=d.textContent;t=multiline?t.replace(/\n{3,}/g,'\n\n'):t.replace(/\s*\n+\s*/g,' ');return t.replace(/[ \t]+/g,' ').trim();}
  if(!multiline)h=h.replace(/<br>/g,' ');h=h.trim();return al&&al!=='left'?'<span style="display:block;text-align:'+al+'">'+h+'</span>':h;}

/* ---------- toolbar ---------- */
const I={clear:'<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l9.6-9.6a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
 b:'<path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/>',i:'<path d="M19 4h-9M14 20H5M15 4 9 20"/>',u:'<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 20h16"/>',
 color:'<path d="m5 16 7-13 7 13"/><path d="M7.5 11.5h9"/>',left:'<path d="M3 6h18M3 12h12M3 18h16"/>',center:'<path d="M3 6h18M6 12h12M4 18h16"/>',right:'<path d="M3 6h18M9 12h12M5 18h16"/>',justify:'<path d="M3 6h18M3 12h18M3 18h18"/>',
 ul:'<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>',ol:'<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 4v4M3 8h2M3 12.5a1 1 0 0 1 2 0c0 .8-2 1.5-2 2.5h2M3 17h1.5a1 1 0 0 1 0 2H3"/>',
 link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',unlink:'<path d="M18.8 13.2 21 11a5 5 0 0 0-7-7l-2.2 2.2M5.2 10.8 3 13a5 5 0 0 0 7 7l2.2-2.2M8 2v3M2 8h3M16 22v-3M22 16h-3"/>'};
const TIP={undo:'Undo',redo:'Redo',b:'Bold',i:'Italic',u:'Underline',color:'Text colour',left:'Align left',center:'Align centre',right:'Align right',justify:'Justify',ul:'Bullet list',ol:'Numbered list',link:'Add link',unlink:'Remove link',clear:'Clear formatting'};
const GROUPS=[['undo','redo'],['b','i','u','color'],['left','center','right','justify'],['ul','ol'],['link','unlink','clear']];
let bar=null,pal=null,cur=null,accent='#042D7C';
function css(){if(document.getElementById('skrt-css'))return;const s=document.createElement('style');s.id='skrt-css';s.textContent=`
.skrt{position:fixed;z-index:2147482000;display:flex;align-items:center;gap:2px;background:#FFFFFF;border:1px solid #E3E4E8;border-radius:14px;box-shadow:0 14px 36px rgba(4,45,124,.16);padding:5px;font-family:Lato,system-ui,sans-serif;max-width:calc(100vw - 16px);overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.skrt::-webkit-scrollbar{display:none}
.skrt button{all:unset;box-sizing:border-box;flex:none;width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#2C3E50;cursor:pointer;position:relative}
.skrt button:hover{background:#F1F3F6;color:#042D7C}.skrt button.on{background:#EEF2FA;color:#042D7C}.skrt button[disabled]{opacity:.3;cursor:default;background:none}
.skrt button:focus-visible{outline:2px solid #042D7C;outline-offset:1px}
.skrt i{flex:none;width:1px;height:20px;background:#E3E4E8;margin:0 4px}
.skrt .sw{position:absolute;left:9px;right:9px;bottom:5px;height:3px;border-radius:2px}
.skrt-pal{position:fixed;z-index:2147482001;background:#fff;border:1px solid #E3E4E8;border-radius:14px;box-shadow:0 14px 36px rgba(4,45,124,.16);padding:10px;display:grid;grid-template-columns:repeat(4,30px);gap:8px}
.skrt-pal button{all:unset;cursor:pointer;width:30px;height:30px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}.skrt-pal button:hover{transform:scale(1.08)}
.skrt-pal .ttl{grid-column:1/-1;font-size:11px;font-weight:900;letter-spacing:.1em;color:#5B6470}
.skrt.dock{position:static!important;z-index:auto;box-shadow:none;width:100%;max-width:100%;box-sizing:border-box;border-radius:14px;padding:6px 8px;flex-wrap:nowrap}
.skrt.dock .hint{flex:1 1 auto;min-width:0;padding:0 10px;font-size:12px;color:#5B6470;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right}
.skrt.dock.live .hint{color:#042D7C;font-weight:700}
.skrt:not(.dock) .hint{display:none}
@media (max-width:640px){.skrt{left:8px!important;right:8px;top:auto!important;bottom:calc(76px + env(safe-area-inset-bottom));justify-content:flex-start}}`;document.head.appendChild(s);}
const svg=d=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
function build(){css();bar=document.createElement('div');bar.className='skrt';bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Text formatting');
  bar.innerHTML=GROUPS.map(g=>g.map(k=>`<button type="button" data-k="${k}" title="${TIP[k]}" aria-label="${TIP[k]}">${svg(I[k])}${k==='color'?'<span class="sw"></span>':''}</button>`).join('')).join('<i></i>');
  bar.insertAdjacentHTML('beforeend','<span class="hint">Click any text on the CV to format it</span>');bar.style.display='none';document.body.appendChild(bar);
  bar.addEventListener('mousedown',e=>e.preventDefault());bar.addEventListener('touchstart',e=>{if(e.target.closest('button'))e.preventDefault();},{passive:false});
  bar.addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b||b.disabled||!cur)return;run(b.dataset.k,b);});
  bar.addEventListener('touchend',e=>{const b=e.target.closest('button[data-k]');if(!b||b.disabled||!cur)return;e.preventDefault();run(b.dataset.k,b);});}
function run(k,btn){const n=cur;if(!n)return;n.focus({preventScroll:true});
  if(k==='color'){openPal(btn);return;}
  if(['left','center','right','justify'].includes(k)){n.dataset.al=k==='left'?'':k;n.style.textAlign=k==='left'?'':k;n.style.display=k==='left'&&!n.dataset.wasBlock?'':'block';sync();return;}
  if(k==='link'){const sel=getSelection();if(!sel||sel.isCollapsed){alert('Select the text you want to link first.');return;}const r=sel.getRangeAt(0).cloneRange();let u=prompt('Link address (https://…, mailto: or tel:)','https://');if(!u)return;u=u.trim();if(!/^(https?:|mailto:|tel:)/i.test(u))u=(/@/.test(u)?'mailto:':'https://')+u.replace(/^\/+/,'');sel.removeAllRanges();sel.addRange(r);document.execCommand('createLink',false,u);sync();return;}
  const C={undo:'undo',redo:'redo',b:'bold',i:'italic',u:'underline',ul:'insertUnorderedList',ol:'insertOrderedList',unlink:'unlink',clear:'removeFormat'}[k];
  try{document.execCommand('styleWithCSS',false,false);}catch(e){}document.execCommand(C,false,null);sync();}
function openPal(btn){closePal();pal=document.createElement('div');pal.className='skrt-pal';const cols=[['Automatic',''],['Black','#111111'],['Dark grey','#444444'],['CV colour',accent],['Navy','#1F3A5F'],['Blue','#1E4D8C'],['Maroon','#6E2633'],['Green','#2E5E4E']];
  pal.innerHTML='<div class="ttl">TEXT COLOUR</div>'+cols.map(([l,c])=>`<button type="button" title="${l}" aria-label="${l}" data-c="${c}" style="background:${c||'linear-gradient(135deg,#fff 45%,#D33 46%,#D33 54%,#fff 55%)'}"></button>`).join('');
  document.body.appendChild(pal);const r=btn.getBoundingClientRect();pal.style.left=Math.min(innerWidth-pal.offsetWidth-8,Math.max(8,r.left-10))+'px';pal.style.top=(r.bottom+6+pal.offsetHeight>innerHeight?r.top-pal.offsetHeight-6:r.bottom+6)+'px';
  pal.addEventListener('mousedown',e=>e.preventDefault());pal.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;cur&&cur.focus({preventScroll:true});try{document.execCommand('styleWithCSS',false,true);}catch(x){}
    document.execCommand('foreColor',false,b.dataset.c||getComputedStyle(cur).color);try{document.execCommand('styleWithCSS',false,false);}catch(x){}closePal();sync();});}
function closePal(){if(pal){pal.remove();pal=null;}}
function sync(){if(!bar||!cur)return;const q=c=>{try{return document.queryCommandState(c);}catch(e){return false;}};
  const st={b:q('bold'),i:q('italic'),u:q('underline'),ul:q('insertUnorderedList'),ol:q('insertOrderedList')};const al=cur.dataset.al||'left';
  bar.querySelectorAll('button[data-k]').forEach(b=>{const k=b.dataset.k;b.classList.toggle('on',!!st[k]||k===al);});
  let col='';try{col=document.queryCommandValue('foreColor');}catch(e){}const sw=bar.querySelector('.sw');if(sw)sw.style.background=col||'#2C3E50';}
function place(){if(!bar||!cur||bar.classList.contains('dock'))return;if(innerWidth<=640){bar.style.top='';bar.style.left='';return;}const r=cur.getBoundingClientRect();const bw=bar.offsetWidth,bh=bar.offsetHeight;
  let y=r.top-bh-10;if(y<70)y=r.bottom+10;const x=Math.min(innerWidth-bw-8,Math.max(8,r.left+r.width/2-bw/2));bar.style.top=y+'px';bar.style.left=x+'px';}
function show(n,opt){if(!bar)build();dock();cur=n;bar.querySelectorAll('button[data-k]').forEach(b=>b.disabled=false);bar.classList.add('live');const ht=bar.querySelector('.hint');if(ht)ht.textContent='Formatting: '+(n.dataset.f?String(n.dataset.f).split('.')[0].replace(/^exp$/,'experience').replace(/^edu$/,'education'):'text');accent=(opt&&opt.accent)||accent;const multi=!!(opt&&opt.multi),list=!!(opt&&opt.lists);
  bar.querySelectorAll('[data-k=ul],[data-k=ol]').forEach(b=>b.disabled=!list);bar.querySelectorAll('[data-k=left],[data-k=center],[data-k=right],[data-k=justify]').forEach(b=>b.disabled=!!(opt&&opt.noAlign));
  bar.style.display='flex';place();sync();}
function hide(n){if(cur&&n&&cur!==n)return;cur=null;closePal();if(!bar)return;if(bar.classList.contains('dock')){idle();return;}bar.style.display='none';}
function idle(){if(!bar)return;bar.classList.remove('live');bar.querySelectorAll('button[data-k]').forEach(b=>{b.disabled=true;b.classList.remove('on');});const ht=bar.querySelector('.hint');if(ht)ht.textContent='Click any text on the CV to format it';}
function dock(){const h=document.querySelector('[data-skrt-dock]');const want=h&&innerWidth>640?h:null;if(want){if(!bar)build();if(bar.parentNode!==want){want.appendChild(bar);bar.classList.add('dock');bar.style.top='';bar.style.left='';bar.style.display='flex';if(!cur)idle();}}else if(bar&&bar.classList.contains('dock')){bar.classList.remove('dock');document.body.appendChild(bar);bar.querySelectorAll('button[data-k]').forEach(b=>b.disabled=false);if(!cur)bar.style.display='none';else place();}}
setInterval(dock,400);addEventListener('resize',dock);
document.addEventListener('selectionchange',()=>{if(cur&&document.activeElement===cur)sync();});
addEventListener('scroll',()=>{if(cur)place();},true);addEventListener('resize',()=>{if(cur)place();});
document.addEventListener('keydown',e=>{if(!cur||document.activeElement!==cur||!(e.metaKey||e.ctrlKey))return;const k=e.key.toLowerCase();if(k==='b'||k==='i'||k==='u'){e.preventDefault();run(k);}});

/* ---------- Word (DOCX) ---------- */
// rich string -> array of docx runs, honouring bold/italic/underline/colour/links and line breaks
function runs(X,s,base,mk){s=String(s??'');if(!isRich(s))return [mk(s,base)];const d=document.createElement('template');d.innerHTML=clean(s);const out=[];
  const go=(node,st)=>{for(const n of node.childNodes){if(n.nodeType===3){if(n.nodeValue)out.push({t:n.nodeValue,st:Object.assign({},st)});continue;}if(n.nodeType!==1)continue;const t=n.tagName.toLowerCase();const s2=Object.assign({},st);
    if(t==='br'){out.push({br:1,st});continue;}if(t==='b')s2.bold=true;if(t==='i')s2.italics=true;if(t==='u')s2.underline={};if(t==='span'&&n.style.color)s2.color=hex(n.style.color).replace('#','');if(t==='a')s2.link=n.getAttribute('href');if(t==='li'||t==='ul'||t==='ol')continue;go(n,s2);}};
  go(d.content,{});
  return out.map(o=>{if(o.br)return mk('',Object.assign({},base,{break:1}));const {link,...st}=o.st;const r=mk(o.t,Object.assign({},base,st,link?{color:'0563C1',underline:{}}:{}));return link&&X.ExternalHyperlink?new X.ExternalHyperlink({link,children:[r]}):r;});}
function align(X,s){const m=/^<span style="display:block;text-align:(left|center|right|justify)">/.exec(String(s??''));if(!m||!X.AlignmentType)return undefined;return {left:X.AlignmentType.LEFT,center:X.AlignmentType.CENTER,right:X.AlignmentType.RIGHT,justify:X.AlignmentType.JUSTIFIED}[m[1]];}
// a multi-paragraph rich field (e.g. summary) -> docx paragraphs, lists become bullets / numbers
function paras(X,s,base,mk,P){s=String(s??'');const al=align(X,s);const o=al?{alignment:al}:{};
  if(!isRich(s))return s.split(/\n+/).filter(t=>t.trim()).map(t=>P([mk(t,base)],o));
  const d=document.createElement('template');d.innerHTML=clean(s);const res=[];let buf=document.createElement('div');
  const flush=()=>{const h=buf.innerHTML.replace(/^(<br>)+|(<br>)+$/g,'');if(h.replace(/<[^>]+>/g,'').trim())h.split(/<br><br>/).forEach(part=>res.push(P(runs(X,part,base,mk),o)));buf=document.createElement('div');};
  const root=d.content.childNodes.length===1&&d.content.firstChild.nodeType===1&&/display:\s*block/.test(d.content.firstChild.getAttribute('style')||'')?d.content.firstChild:d.content;
  for(const n of [...root.childNodes]){const t=n.nodeType===1?n.tagName.toLowerCase():'';
    if(t==='ul'||t==='ol'){flush();[...n.children].forEach((li,i)=>res.push(P(runs(X,li.innerHTML,base,mk),Object.assign({},o,t==='ul'?{bullet:{level:0}}:{numbering:{reference:'sk-num',level:0}}))));}
    else buf.appendChild(n.cloneNode(true));}
  flush();return res;}
const numbering={config:[{reference:'sk-num',levels:[{level:0,format:'decimal',text:'%1.',alignment:'left',style:{paragraph:{indent:{left:360,hanging:260}}}}]}]};
// square/rounded/circle photo as PNG with transparent corners, matching the preview crop
function photoPng(src,shape){return new Promise(ok=>{if(!src)return ok(null);const img=new Image();img.crossOrigin='anonymous';img.onload=()=>{const S=360,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
  const r=shape==='circle'?S/2:shape==='square'?0:S*(typeof shape==='number'?shape:.14);if(r>0){x.beginPath();x.moveTo(r,0);x.arcTo(S,0,S,S,r);x.arcTo(S,S,0,S,r);x.arcTo(0,S,0,0,r);x.arcTo(0,0,S,0,r);x.closePath();x.clip();}
  const m=Math.min(img.width,img.height),sx=(img.width-m)/2,sy=(img.height-m)*.15;x.drawImage(img,sx,sy,m,m,0,0,S,S);
  c.toBlob(b=>{if(!b)return ok(null);b.arrayBuffer().then(a=>ok(new Uint8Array(a)));},'image/png');};img.onerror=()=>ok(null);img.src=src;});}

window.SKRT={clean,isRich,plain,html,toEdit,fromEdit,show,hide,runs,paras,align,numbering,photoPng};
})();
