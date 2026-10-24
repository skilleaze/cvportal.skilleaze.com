(function(){
const ATS=window.SKCV&&!window.SKCV.ep?window.SKCV:null;
const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const FONTS={Arial:"Arial,Helvetica,sans-serif",Georgia:"Georgia,'Times New Roman',serif",Lato:"'Lato',sans-serif",'Open Sans':"'Open Sans',sans-serif"};
const CL=[['Europass Blue','#0B4F8A'],['Navy','#1F3A5F'],['Black','#1C1C1C'],['Charcoal','#3B4450'],['Dark Blue','#1E4D8C'],['Maroon','#6E2633'],['Forest','#2E5E4E'],['Teal','#1F5F6B']];
const EB=CL[0];
const DES=[
 {k:'CLASSIC',nm:'Europass Classic · Header band, round photo',f:'Arial',c:EB,hdr:'photoband',L:1},
 {k:'GRID',nm:'Classic · CEFR language grid',f:'Arial',c:EB,hdr:'photoL',L:2},
 {k:'ACCENT',nm:'Accent · Label column, dates left',f:'Open Sans',c:EB,hdr:'photoR',L:3},
 {k:'TIMELINE',nm:'Timeline · Corner frame',f:'Open Sans',c:EB,hdr:'photoR',L:4},
 {k:'PROGRESS',nm:'Progress · Sidebar, timeline dots',f:'Open Sans',c:EB,hdr:'side',L:5},
 {k:'ELEGANT',nm:'Elegant · Header band, uppercase roles',f:'Open Sans',c:EB,hdr:'photoband',L:6},
 {k:'MODERN',nm:'Modern · Photo badge, skills column',f:'Lato',c:EB,hdr:'photoSq',L:7}];
const code=n=>'SKZ-EP-'+String(n+1).padStart(2,'0')+' '+DES[n].k;
const KL={location:'Address',phone:'Phone',email:'Email address',website:'Website',linkedin:'LinkedIn'};
const kind=s=>s._k||(/@/.test(s)?'email':/linkedin/i.test(s)?'linkedin':/^[+\d][\d\s()-]{6,}$/.test(String(s).trim())?'phone':/\.[a-z]{2,}/i.test(s)&&!/\s/.test(String(s).trim())?'website':'location');
function contacts(D){return (D.contact||[]).map(s=>({k:kind(s),v:String(s)})).filter(x=>x.v.trim());}
function langs(t){const out={mother:[],grid:[],other:[]};String(t||'').split(/[\n,;·|]+/).map(s=>s.trim()).filter(Boolean).forEach(s=>{const nm=s.replace(/[\(\[].*?[\)\]]/g,'').replace(/[-–:]\s*.*$/,'').replace(/\b[ABC][12]\b/g,'').trim()||s;
 if(/native|mother|first language/i.test(s))out.mother.push(nm);else{const lv=s.match(/\b([ABC][12])\b/gi);if(lv){const L=lv.map(x=>x.toUpperCase());while(L.length<5)L.push(L[L.length-1]);out.grid.push([nm,L.slice(0,5)]);}else if(/fluent|proficient/i.test(s))out.grid.push([nm,['C1','C1','C1','C1','C1']]);else if(/intermediate|conversational/i.test(s))out.grid.push([nm,['B1','B1','B1','B1','B1']]);else if(/basic|beginner/i.test(s))out.grid.push([nm,['A2','A2','A2','A2','A2']]);else out.other.push(s);}});return out;}
const EPL=(document.currentScript&&document.currentScript.src)?document.currentScript.src.replace(/[^/]*$/,''):'cv-builder/';function logo(col){const dark=/^#?(f|e|d)/i.test(String(col).replace('#',''))||/fff|white/i.test(col);const im=`<img src="${EPL}europass-logo.png" alt="europass" style="height:${dark?20:24}px;width:auto;display:block">`;return dark?`<span style="display:inline-flex;background:#fff;padding:6px 9px;border-radius:4px">${im}</span>`:im;}
function photo(D,size,shape,ring){if(D.photoMode==='hide')return '';const r=shape==='square'||D.photoShape==='square'?'6px':D.photoShape==='rounded'?'14px':'50%';if(!D.photo){if(!D.edit)return '';const ic=Math.round(size*.42);return `<div data-photo-slot onclick="var i=document.querySelector('input[type=file][accept^=image]');if(i)i.click()" title="Add your photo" style="width:${size}px;height:${size}px;border-radius:${r};flex-shrink:0;box-sizing:border-box;border:2px dashed #9FB3CC;background:#F1F4F8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:#5B7290;font-family:Arial,sans-serif"><svg width="${ic}" height="${ic}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>${size>=70?'<span style="font-size:10px;font-weight:700;letter-spacing:.04em">ADD PHOTO</span>':''}</div>`;}return `<img src="${esc(D.photo)}" alt="" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:${r};flex-shrink:0;${ring?`box-shadow:0 0 0 3px ${ring}`:''}">`;}
const RULE='#7B9BB7';
function blocks(S,C,D,fs,o){const B=[];const H=(t)=>{const T=esc(t);
  if(S.L===3)return '';
  if(S.L===1||S.L===2)return `<div style="font-weight:700;font-size:${fs+1.5}px;color:${C};padding-bottom:4px;border-bottom:${S.L===2?'1px':'.6px'} solid ${S.L===2?C:RULE};margin-bottom:8px">${T}</div>`;
  if(S.L===7)return `<div style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:${fs+1}px;color:${C};text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${T}<span style="flex:1;height:1px;background:${RULE}"></span></div>`;
  return `<div style="font-weight:700;font-size:${fs+1}px;color:${C};text-transform:uppercase;letter-spacing:.08em;padding-bottom:4px;border-bottom:1.5px solid ${C};margin-bottom:8px">${T}</div>`;};
 const wrapL=(lab,html,first)=>S.L===3?`<div style="display:grid;grid-template-columns:128px minmax(0,1fr);gap:16px"><div style="font-size:${fs-1.5}px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C};padding-top:2px">${first?esc(lab):''}</div><div>${html}</div></div>`:html;
 const hd=D.heads||{};const sec=(key,def,items)=>{if(!items.length)return;const lab=hd[key]||def;items.forEach((h,i)=>B.push({gap:i===0?16:8,html:(i===0?H(lab):'')+wrapL(lab,h,i===0)}));};
 const bl=a=>a.length?`<ul style="margin:4px 0 0;padding-left:16px">${a.map(x=>`<li style="margin:0 0 2px">${esc(x)}</li>`).join('')}</ul>`:'';
 if(D.summary)sec('summary','About myself',[`<div style="line-height:1.5">${esc(D.summary).replace(/\n/g,'<br>')}</div>`]);
 const exp=(D.exp||[]).map(e=>{const tl=S.L===6?esc(e.t).toUpperCase():esc(e.t);const dot=S.L===4||S.L===5;
  const inner=S.L===3?`<div style="font-size:${fs-1}px;color:#555">${esc(e.d)}</div><div style="font-weight:700;font-size:${fs+.5}px">${tl}</div><div style="color:${C};font-weight:700">${esc(e.c)}</div>${bl(e.b)}`
   :`<div style="font-size:${fs-1}px;color:#555">${esc(e.d)}</div><div style="font-weight:700;font-size:${fs+.5}px;${S.L===6?'letter-spacing:.04em;':''}">${tl}</div><div style="color:${C};font-weight:700">${esc(e.c)}</div>${bl(e.b)}`;
  return dot?`<div style="position:relative;padding-left:18px;border-left:1.5px solid ${RULE};margin-left:4px"><span style="position:absolute;left:-6px;top:3px;width:9px;height:9px;border-radius:50%;background:${C}"></span>${inner}</div>`:inner;});
 sec('exp','Work experience',exp);
 sec('edu','Education and training',(D.edu||[]).map(e=>`<div style="font-size:${fs-1}px;color:#555">${esc(e[2])}</div><div style="font-weight:700;font-size:${fs+.5}px">${esc(e[0])}</div><div style="color:${C};font-weight:700">${esc(e[1])}</div>`));
 const lg=langs(D.langs);const li=[];
 if(lg.mother.length)li.push(`<div>Mother tongue(s): <strong>${lg.mother.map(esc).join(', ')}</strong></div>`);
 if(lg.grid.length){const th=`padding:5px 4px;font-weight:700;font-size:${fs-2}px;text-align:center`;const filled=S.L===2;
  li.push(`<div style="margin-top:4px">Other language(s):</div><table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:${fs-1.5}px"><tr><td></td><td colspan="2" style="${th};border-bottom:1px solid ${RULE}">UNDERSTANDING</td><td colspan="2" style="${th};border-bottom:1px solid ${RULE}">SPEAKING</td><td style="${th};border-bottom:1px solid ${RULE}">WRITING</td></tr><tr><td></td>${['Listening','Reading','Spoken production','Spoken interaction',''].map(x=>`<td style="${th};font-weight:400;color:#555">${x}</td>`).join('')}</tr>${lg.grid.map(([n,L])=>`<tr><td style="padding:5px 6px;font-weight:700;${filled?`background:${C};color:#fff`:''}">${esc(n)}</td>${L.map(v=>`<td style="padding:5px 4px;text-align:center;border:1px solid ${filled?'#fff':'#D6DEE8'};${filled?`background:${C}1A`:''}">${v}</td>`).join('')}</tr>`).join('')}</table><div style="font-size:${fs-3}px;color:#666;margin-top:4px">Levels: A1 and A2: Basic user; B1 and B2: Independent user; C1 and C2: Proficient user</div>`);}
 if(lg.other.length)li.push(`<div>${lg.other.map(esc).join(' · ')}</div>`);
 if(li.length&&!(S.L===5||S.L===7))sec('langs','Language skills',[li.join('')]);
 if(!(S.L===7))sec('skills','Digital skills',(D.skills||[]).length?[(D.skills||[]).map(s=>`<div style="margin-bottom:4px"><strong>${esc(s[0])}:</strong> ${esc(s[1])}</div>`).join('')]:[]);
 (D.extra||[]).forEach(x=>{if(x.items.length)sec('x'+x.title,x.title,[bl(x.items).replace('margin:4px 0 0','margin:0')]);});
 if(S.L===5&&li.length)o.sideLang=li.join('');
 if(S.L===7&&li.length)sec('langs','Language skills',[li.join('')]);
 return B;}
function header(S,C,D,fs){const ct=contacts(D);const nm=esc(D.nameCase||D.name);const vis=D.visa?esc(D.visa):'';
 const line=(col)=>`<div style="font-size:${fs-1.5}px;line-height:1.55;color:${col}">${[...(vis?[vis]:[]),...ct.map(x=>`<strong>${KL[x.k]}:</strong> ${esc(x.v)}`)].join(' &nbsp;|&nbsp; ')}</div>`;
 const title=D.title?`<div style="font-size:${fs+1}px;font-weight:700;margin-top:2px">${esc(D.title)}</div>`:'';
 if(S.L===1||S.L===6)return `<div style="background:${C};color:#fff;margin:-${PY}px -${PX}px 22px;padding:${PY-14}px ${PX}px 20px;display:flex;gap:18px;align-items:center">${photo(D,86,'',null)}<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div style="font-size:${S.L===6?24:26}px;font-weight:700;${S.L===6?'letter-spacing:.06em;text-transform:uppercase;':''}line-height:1.15">${nm}</div>${logo('#fff')}</div><div style="color:#fff">${title}</div><div style="margin-top:6px">${line('#fff')}</div></div></div>`;
 if(S.L===2)return `<div style="margin-bottom:22px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">${logo(C)}</div><div style="display:flex;gap:18px;align-items:center">${photo(D,84,'',null)}<div style="flex:1;min-width:0"><div style="font-size:26px;font-weight:700;color:${C}">${nm}</div>${title}<div style="margin-top:6px">${line('#333')}</div></div></div><div style="height:2px;background:${C};margin-top:16px"></div></div>`;
 if(S.L===3)return `<div style="display:grid;grid-template-columns:128px minmax(0,1fr);gap:16px;margin-bottom:22px;align-items:center"><div>${photo(D,104,'',null)||logo(C)}</div><div><div style="display:flex;justify-content:space-between;gap:10px"><div style="font-size:26px;font-weight:700;color:${C}">${nm}</div>${D.photo&&D.photoMode!=='hide'?logo(C):''}</div>${title}<div style="margin-top:8px;font-size:${fs-1.5}px;line-height:1.6">${[...(vis?[vis]:[]),...ct.map(x=>`<div><strong>${KL[x.k]}:</strong> ${esc(x.v)}</div>`)].join('')}</div></div></div>`;
 if(S.L===4)return `<div style="position:relative;margin-bottom:22px;padding:18px 0 0 18px"><span style="position:absolute;left:-${PX-18}px;top:-${PY-18}px;width:120px;height:10px;background:${C}"></span><span style="position:absolute;left:-${PX-18}px;top:-${PY-18}px;width:10px;height:120px;background:${C}"></span><div style="display:flex;gap:18px;align-items:center"><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div style="font-size:26px;font-weight:700;color:${C}">${nm}</div>${logo(C)}</div>${title}<div style="margin-top:6px">${line('#333')}</div></div>${photo(D,90,'',null)}</div></div>`;
 if(S.L===7)return `<div style="display:flex;gap:20px;align-items:center;margin-bottom:22px;padding-bottom:16px;border-bottom:1px solid ${RULE}">${photo(D,92,'square',C)}<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:10px"><div style="font-size:26px;font-weight:700;color:${C}">${nm}</div>${logo(C)}</div>${title}<div style="margin-top:6px">${line('#333')}</div></div></div>`;
 return `<div style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div style="font-size:24px;font-weight:700;color:${C}">${nm}</div>${logo(C)}</div>${title}${vis?`<div style="font-size:${fs-1.5}px;margin-top:4px">${vis}</div>`:''}</div>`;}
let PX,PY,PGW,PGH;
function sideHtml(S,C,D,fs,o,first){if(S.L===5){const ct=contacts(D);return `<aside style="background:${C};color:#fff;width:220px;flex-shrink:0;padding:${PY}px 20px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px;font-size:${fs-1.5}px;line-height:1.5">${first?`${photo(D,120,'',null)?`<div>${photo(D,120,'','#fff')}</div>`:''}<div><div style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">Contact</div>${ct.map(x=>`<div style="margin-bottom:4px;word-break:break-word">${esc(x.v)}</div>`).join('')}</div>${o.sideLang?`<div><div style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">Languages</div><div style="font-size:${fs-2}px">${langs(D.langs).mother.concat(langs(D.langs).grid.map(g=>g[0]+' · '+g[1][0]),langs(D.langs).other).map(esc).join('<br>')}</div></div>`:''}<div style="margin-top:auto">${logo('#fff')}</div>`:''}</aside>`;}
 if(S.L===7&&first&&(D.skills||[]).length)return `<aside style="width:200px;flex-shrink:0;background:#F1F4F8;padding:${PY}px 18px;box-sizing:border-box;font-size:${fs-1.5}px;line-height:1.5"><div style="font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C};margin-bottom:8px">Skills</div>${D.skills.map(s=>`<div style="margin-bottom:10px"><div style="font-weight:700">${esc(s[0])}</div><div>${esc(s[1])}</div></div>`).join('')}</aside>`;
 if(S.L===7)return `<aside style="width:200px;flex-shrink:0;background:#F1F4F8"></aside>`;return '';}
function mainW(S){return PGW-2*PX-(S.L===5?220-PX+24:S.L===7?200-PX+24:0);}
let probe;function measure(w,F,fs,list){if(!probe){probe=document.createElement('div');probe.style.cssText='position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none';document.body.appendChild(probe);}
 probe.style.width=w+'px';probe.style.fontFamily=F;probe.style.fontSize=fs+'px';probe.style.lineHeight='1.45';probe.style.color='#222';
 probe.innerHTML=list.map(h=>`<div style="display:flow-root">${h}</div>`).join('');const r=[...probe.children].map(e=>e.getBoundingClientRect().height);probe.innerHTML='';return r;}
function build(S,C,F,fs,D,o){const w=mainW(S);const B=blocks(S,C,D,fs,o);const hd=header(S,C,D,fs);
 const hs=measure(w,F,fs,[hd,...B.map(b=>b.html)]);const hH=hs[0];const pages=[];let cur=[],used=0,p=0;
 const avail=()=>PGH-2*PY-(p===0?hH:0)-6;
 B.forEach((b,i)=>{const h=hs[i+1]+(cur.length?b.gap:0);if(used+h>avail()&&cur.length){pages.push(cur);cur=[];used=0;p++;}cur.push(`<div style="margin-top:${cur.length?b.gap:0}px">${b.html}</div>`);used+=hs[i+1]+(cur.length>1?b.gap:0);});
 pages.push(cur);
 return pages.map((c,i)=>{const side=sideHtml(S,C,D,fs,o,i===0);const padL=S.L===5||S.L===7?24:PX;const padR=PX;
  const main=`<div style="flex:1;min-width:0;padding:${PY}px ${padR}px ${PY}px ${padL}px;box-sizing:border-box;position:relative">${i===0?hd:''}${c.join('')}</div>`;
  return `<div style="width:${PGW}px;height:${PGH}px;background:#fff;font-family:${F};font-size:${fs}px;line-height:1.45;color:#222;box-sizing:border-box;overflow:hidden;position:relative;display:flex">${S.L===7?main+side:side+main}<div style="position:absolute;right:${PX}px;bottom:16px;font-size:9px;color:#8A96A6">${esc(D.name)} · Page ${i+1} / ${pages.length}</div></div>`;});}
function render(data,n,opt){opt=opt||{};const MG={compact:[34,30],default:[44,40],roomy:[56,50]}[opt.margin||'default']||[44,40];PX=MG[0];PY=MG[1];PGW=opt.paper==='letter'?816:794;PGH=opt.paper==='letter'?1056:1123;
 const S=DES[n]||DES[0];const F=FONTS[opt.font]||FONTS[S.f],C=opt.color||S.c[1];const D=Object.assign({},data);D.nameCase=String(D.name||'').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());let pg,fs;
 for(fs of [13,12.6,12.2]){pg=build(S,C,F,fs,D,{});if(pg.length<=(opt.max||2))break;}
 return {pages:pg,fs,code:code(n),name:S.nm,font:opt.font||S.f,color:C,photo:true,w:PGW,h:PGH};}
function letter(d,n,o,b){const S=DES[n]||DES[0];const o2=Object.assign({},o||{});if(!o2.color)o2.color=S.c[1];if(!o2.font)o2.font=S.f;return (window.SKCV_ATS||ATS).letter(d,n,o2,b);}
if(ATS)window.SKCV_ATS=ATS;
const EPX={DES,CL,FONTS,render,letter,code,ep:true};window.SKCV_EP=EPX;window.SKCV=EPX;
let _lock=0;const fix=()=>{if(window.SKCV!==EPX){if(window.SKCV&&!window.SKCV.ep)window.SKCV_ATS=window.SKCV;window.SKCV=EPX;}};fix();const iv=setInterval(()=>{fix();if(++_lock>100)clearInterval(iv);},50);document.addEventListener('DOMContentLoaded',fix);window.addEventListener('load',fix);
})();
