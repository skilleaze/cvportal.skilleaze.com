/* Skilleaze vector PDF export.
   Draws the exact CV preview into a real PDF: selectable, ATS-readable text, same layout,
   same margins, exactly one PDF page per CV page, no browser headers or page numbers. */
(function(){
if(window.SKPDF)return;
const FONT_CDN='https://cdn.jsdelivr.net/fontsource/fonts/';
// metric-compatible open fonts so text widths match the browser preview exactly
const FAM={lato:'lato','open sans':'open-sans',arial:'arimo',helvetica:'arimo','sans-serif':'arimo',georgia:'gelasio','times new roman':'tinos',times:'tinos',serif:'tinos'};
const loaded={};let jsLoad=null;
function loadJs(){if(window.jspdf&&window.jspdf.jsPDF)return Promise.resolve();if(jsLoad)return jsLoad;
  jsLoad=new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';s.onload=ok;s.onerror=()=>no(new Error('PDF library failed to load'));document.head.appendChild(s);});return jsLoad;}
function b64(buf){let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s);}
async function fontFile(slug,w,it){const k=slug+w+it;if(k in loaded)return loaded[k];
  loaded[k]=fetch(FONT_CDN+slug+'@latest/latin-'+w+'-'+(it?'italic':'normal')+'.ttf').then(r=>r.ok?r.arrayBuffer():null).then(b=>b?b64(b):null).catch(()=>null);return loaded[k];}
function famSlug(ff){const list=String(ff||'').split(',').map(x=>x.trim().replace(/^['"]|['"]$/g,'').toLowerCase());for(const f of list)if(FAM[f])return FAM[f];return 'arimo';}
function rgba(c){const m=/rgba?\(([^)]+)\)/.exec(c||'');if(!m)return null;const p=m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);const a=p.length>3?p[3]:1;if(a<=0.01)return null;
  // flatten onto white so the PDF needs no transparency
  return [0,1,2].map(i=>Math.round(p[i]*a+255*(1-a)));}
const isBold=w=>(parseInt(w,10)||400)>=600;
async function ensureFont(doc,cache,slug,bold,it){const name=slug+(bold?'-b':'')+(it?'-i':'');if(cache[name]!==undefined)return cache[name];
  let data=await fontFile(slug,bold?700:400,it);if(!data&&it)data=await fontFile(slug,bold?700:400,false);
  if(!data){cache[name]=null;return null;}
  const file=name+'.ttf';doc.addFileToVFS(file,data);doc.addFont(file,name,'normal');cache[name]=name;return name;}
function stdFont(slug){return /gelasio|tinos/.test(slug)?'times':'helvetica';}

function bgBehind(el){let e=el&&el.parentElement;while(e){const c=getComputedStyle(e).backgroundColor;const m=/rgba?\(([^)]+)\)/.exec(c||'');if(m){const v=m[1].split(',').map(x=>parseFloat(x));if(v.length<4||v[3]>0.5)return 'rgb('+v[0]+','+v[1]+','+v[2]+')';}e=e.parentElement;}return '#FFFFFF';}
async function imgData(el,w,h,radius,bg){
  const src=el.currentSrc||el.src;if(!src)return null;
  const img=await new Promise(r=>{if(el.complete&&el.naturalWidth)return r(el);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
  if(!img||!img.naturalWidth)return null;
  const S=3,c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*S));c.height=Math.max(1,Math.round(h*S));const x=c.getContext('2d');
    if(radius>0&&bg){x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);}
    if(radius>0){const r=Math.min(radius*S,c.width/2,c.height/2);x.beginPath();x.moveTo(r,0);x.arcTo(c.width,0,c.width,c.height,r);x.arcTo(c.width,c.height,0,c.height,r);x.arcTo(0,c.height,0,0,r);x.arcTo(0,0,c.width,0,r);x.closePath();x.clip();}
  const fit=getComputedStyle(el).objectFit;const iw=img.naturalWidth,ih=img.naturalHeight;let sx=0,sy=0,sw=iw,sh=ih;
  if(fit==='cover'){const k=Math.max(c.width/iw,c.height/ih);sw=c.width/k;sh=c.height/k;sx=(iw-sw)/2;sy=(ih-sh)/2;}
  if(fit==='cover'){const op=(getComputedStyle(el).objectPosition||'50% 50%').split(/\s+/);const py=/%$/.test(op[1]||'')?parseFloat(op[1])/100:.5,px=/%$/.test(op[0]||'')?parseFloat(op[0])/100:.5;sx=(iw-sw)*px;sy=(ih-sh)*py;}
  try{x.drawImage(img,sx,sy,sw,sh,0,0,c.width,c.height);return bg&&radius>0?c.toDataURL('image/jpeg',0.92):c.toDataURL('image/png');}catch(e){return null;}}
async function svgData(el,w,h){try{const s=new XMLSerializer().serializeToString(el).replace(/currentColor/g,getComputedStyle(el).color);
  const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s.includes('xmlns=')?s:s.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"'));
  const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=url;});if(!img)return null;
  const S=4,c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*S));c.height=Math.max(1,Math.round(h*S));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/png');}catch(e){return null;}}

async function drawPage(doc,page,fonts){
  const P=page.getBoundingClientRect();const K=0.75;// px -> pt
  const X=v=>(v-P.left)*K,Y=v=>(v-P.top)*K;
  const all=[page,...page.querySelectorAll('*')];
  // 1. boxes: backgrounds and borders, in document order
  for(const el of all){if(el.closest('svg')&&el.tagName.toLowerCase()!=='svg')continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)===0)continue;
    const r=el.getBoundingClientRect();if(r.width<0.5||r.height<0.5)continue;if(r.bottom<=P.top||r.top>=P.bottom)continue;
    const rr=cs.borderTopLeftRadius||'0';const rad=/%/.test(rr)?parseFloat(rr)/100*Math.min(r.width,r.height):(parseFloat(rr)||0);const bg=rgba(cs.backgroundColor);
    if(bg&&el!==page&&el.tagName.toLowerCase()!=='img'){doc.setFillColor(...bg);if(rad>0)doc.roundedRect(X(r.left),Y(r.top),r.width*K,r.height*K,Math.min(rad,r.width/2,r.height/2)*K,Math.min(rad,r.width/2,r.height/2)*K,'F');else doc.rect(X(r.left),Y(r.top),r.width*K,r.height*K,'F');}
    const sides=[['Top',r.left,r.top,r.right,r.top],['Bottom',r.left,r.bottom,r.right,r.bottom],['Left',r.left,r.top,r.left,r.bottom],['Right',r.right,r.top,r.right,r.bottom]];
    if(rad>0&&['Top','Right','Bottom','Left'].every(s=>parseFloat(cs['border'+s+'Width'])>0&&cs['border'+s+'Style']!=='none')){const c=rgba(cs.borderTopColor);const bw=parseFloat(cs.borderTopWidth);if(c){doc.setDrawColor(...c);doc.setLineWidth(bw*K);doc.roundedRect(X(r.left+bw/2),Y(r.top+bw/2),(r.width-bw)*K,(r.height-bw)*K,Math.min(rad,r.width/2)*K,Math.min(rad,r.height/2)*K,'S');}}
    else for(const [s,x1,y1,x2,y2] of sides){const bw=parseFloat(cs['border'+s+'Width']);if(!(bw>0)||cs['border'+s+'Style']==='none')continue;const c=rgba(cs['border'+s+'Color']);if(!c)continue;doc.setFillColor(...c);
      if(s==='Top')doc.rect(X(x1),Y(y1),(x2-x1)*K,bw*K,'F');else if(s==='Bottom')doc.rect(X(x1),Y(y1-bw),(x2-x1)*K,bw*K,'F');else if(s==='Left')doc.rect(X(x1),Y(y1),bw*K,(y2-y1)*K,'F');else doc.rect(X(x1-bw),Y(y1),bw*K,(y2-y1)*K,'F');}
    const tag=el.tagName.toLowerCase();
    if(tag==='img'){const bl=parseFloat(cs.borderLeftWidth)||0,bt=parseFloat(cs.borderTopWidth)||0,br=parseFloat(cs.borderRightWidth)||0,bb=parseFloat(cs.borderBottomWidth)||0;const iw=r.width-bl-br,ih=r.height-bt-bb;if(iw>0&&ih>0){const ir=Math.max(0,rad-Math.max(bl,bt));const d=await imgData(el,iw,ih,ir,ir>0?bgBehind(el):null);if(d)doc.addImage(d,ir>0?'JPEG':'PNG',X(r.left+bl),Y(r.top+bt),iw*K,ih*K);}}
    else if(tag==='svg'){const d=await svgData(el,r.width,r.height);if(d)doc.addImage(d,'PNG',X(r.left),Y(r.top),r.width*K,r.height*K);}
    else if(cs.backgroundImage&&/url\(/.test(cs.backgroundImage)){const u=/url\(["']?([^"')]+)/.exec(cs.backgroundImage)[1];const fake=new Image();fake.src=u;Object.defineProperty(fake,'complete',{value:false});const d=await imgData(fake,r.width,r.height,rad);if(d)doc.addImage(d,'JPEG',X(r.left),Y(r.top),r.width*K,r.height*K);}
  }
  // 2. text, line by line, with real fonts
  const tw=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);let n;const rng=document.createRange();
  while((n=tw.nextNode())){const raw=n.nodeValue;if(!raw||!raw.trim())continue;const el=n.parentElement;if(!el||el.closest('svg'))continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;
    const col=rgba(cs.color);if(!col)continue;const fsz=parseFloat(cs.fontSize);const slug=famSlug(cs.fontFamily);const bold=isBold(cs.fontWeight);const it=cs.fontStyle==='italic';
    const fname=await ensureFont(doc,fonts,slug,bold,it);if(fname)doc.setFont(fname,'normal');else doc.setFont(stdFont(slug),bold&&it?'bolditalic':bold?'bold':it?'italic':'normal');
    doc.setFontSize(fsz*K);doc.setTextColor(...col);const ls=cs.letterSpacing==='normal'?0:(parseFloat(cs.letterSpacing)||0);
    const tf=cs.textTransform;const T=s=>tf==='uppercase'?s.toUpperCase():tf==='lowercase'?s.toLowerCase():tf==='capitalize'?s.replace(/\b\w/g,c=>c.toUpperCase()):s;
    // collect words with their boxes
    const words=[];const re=/\S+/g;let m;while((m=re.exec(raw))){rng.setStart(n,m.index);rng.setEnd(n,m.index+m[0].length);const rs=[...rng.getClientRects()].filter(x=>x.width>0);if(!rs.length)continue;
      if(rs.length===1)words.push({t:m[0],r:rs[0]});else{// a hyphen/line split inside one word: place per character run
        let i0=m.index;for(let i=m.index;i<m.index+m[0].length;i++){rng.setStart(n,i);rng.setEnd(n,i+1);const cr=rng.getClientRects()[0];if(!cr)continue;const last=words[words.length-1];if(last&&last._n===n&&last._i===i-1&&Math.abs(last.r.top-cr.top)<2){last.t+=raw[i];last.r={left:last.r.left,top:last.r.top,bottom:last.r.bottom,right:cr.right,width:cr.right-last.r.left,height:last.r.height};last._i=i;}else words.push({t:raw[i],r:cr,_n:n,_i:i});}}}
    // group into lines
    const lines=[];for(const w of words){const L=lines[lines.length-1];if(L&&Math.abs(L.top-w.r.top)<fsz*0.35)L.w.push(w);else lines.push({top:w.r.top,w:[w]});}
    for(const L of lines){const f=L.w[0].r,l=L.w[L.w.length-1].r;const base=Y(f.bottom)-((f.height-fsz*1.0)/2+fsz*0.22)*K;const str=T(L.w.map(w=>w.t).join(' '));
      const want=(l.right-f.left)*K;const got=doc.getTextWidth(str)+ls*K*Math.max(0,str.length-1);
      if(L.w.length===1||Math.abs(got-want)<=Math.max(1.2,want*0.02))doc.text(str,X(f.left),base,{charSpace:ls*K,baseline:'alphabetic'});
      else for(const w of L.w){const bw=Y(w.r.bottom)-((w.r.height-fsz)/2+fsz*0.22)*K;doc.text(T(w.t),X(w.r.left),bw,{charSpace:ls*K,baseline:'alphabetic'});}}
  }
}

async function make(pagesHtml,opt){opt=opt||{};await loadJs();const letter=opt.paper==='letter';const Wpx=letter?816:794,Hpx=letter?1056:1123;
  const host=document.createElement('div');host.setAttribute('aria-hidden','true');host.style.cssText='position:fixed;left:-20000px;top:0;width:'+Wpx+'px;pointer-events:none;z-index:-1;background:#fff';
  host.innerHTML=pagesHtml.map(p=>'<div data-pdfpg="1" style="width:'+Wpx+'px;height:'+Hpx+'px;overflow:hidden;position:relative;background:#fff">'+p+'</div>').join('');
  host.querySelectorAll('[contenteditable]').forEach(e=>e.removeAttribute('contenteditable'));host.querySelectorAll('[data-skedit-ui],[data-ph-empty]').forEach(e=>e.remove());
  document.body.appendChild(host);
  try{
    const imgs=[...host.querySelectorAll('img')];await Promise.race([Promise.all([document.fonts?document.fonts.ready:1,...imgs.map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r;}))]),new Promise(r=>setTimeout(r,5000))]);
    const doc=new window.jspdf.jsPDF({unit:'pt',format:letter?'letter':'a4',orientation:'portrait',compress:true,putOnlyUsedFonts:true});
    doc.setProperties({title:opt.title||'CV',creator:'Skilleaze',author:opt.author||''});
    const fonts={};const pgs=[...host.querySelectorAll('[data-pdfpg]')];
    for(let i=0;i<pgs.length;i++){if(i)doc.addPage(letter?'letter':'a4','portrait');await drawPage(doc,pgs[i],fonts);}
    return doc.output('blob');
  }finally{host.remove();}}

function save(blob,name){const fn=(name||'CV').replace(/[\\/:*?"<>|]+/g,'').trim()+'.pdf';const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=fn;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
  // iOS Safari ignores download on blob links in some versions: open the PDF so it can be saved from the share sheet
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&!('download' in HTMLAnchorElement.prototype))location.href=url;
  setTimeout(()=>URL.revokeObjectURL(url),60000);}

window.SKPDF={make,save,ready:loadJs};
})();
