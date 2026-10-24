(function(){let D;const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const cv=document.createElement('canvas').getContext('2d');
function lines(segs,w){let n=1,x=0;for(const [t,f] of segs){cv.font=f;for(const wd of String(t).split(/\s+/).filter(Boolean)){const ww=cv.measureText(wd+' ').width,sw=cv.measureText(wd).width;if(x>0&&x+sw>w){n++;x=0;}x+=ww;}}return n;}
const fnt=(F,fs,b)=>(b?'700 ':'400 ')+fs+'px '+F;
const FONTS={Arial:"Arial,Helvetica,sans-serif",Georgia:"Georgia,'Times New Roman',serif",Lato:"'Lato',sans-serif",'Open Sans':"'Open Sans',sans-serif"};
const TINT='#F1F3F6';
const HDRS=['photoR','photoL','photoband','bandR','centerPhoto','tintPhoto','splitPhoto','photoSq','sideDark','sideL','sideR'];
const HN={photoR:'Photo Right',photoL:'Photo Left',photoband:'Photo Band',bandR:'Band, Photo Right',centerPhoto:'Centred Photo',tintPhoto:'Tinted Photo Header',splitPhoto:'Three-Column Header',photoSq:'Square Photo',sideDark:'Dark Sidebar',sideL:'Light Sidebar',sideR:'Right Panel'};
const HS=['rule','line','center','shade','solid','tintbar','marker','pill','thick','upper','caps'];
const HSN={rule:'Ruled',line:'Line',center:'Centred',shade:'Shaded',solid:'Solid Bar',tintbar:'Accent Bar',marker:'Square Marker',pill:'Pill',thick:'Short Underline',upper:'Spaced Caps',caps:'Small Caps'};
const EX=['std','cofirst','timeline','datecol'],SK=['inline','grid2'],FN=['Lato','Open Sans','Arial','Georgia'];
const CL=[['Navy','#1F3A5F'],['Black','#1C1C1C'],['Charcoal','#3B4450'],['Dark Blue','#1E4D8C'],['Maroon','#6E2633'],['Forest','#2E5E4E'],['Slate','#44505C'],['Teal','#1F5F6B']];
const NAMES='AURORA ORBIT MERIDIAN REGENT SUMMIT HALO LEDGER TRACK NOIR ATLAS VERTEX SIGNET EDGE PRISM KEYSTONE CHRONO CREST FOLIO PORTRAIT PILLAR BEACON ZENITH ONYX CARBON HARBOR SIERRA QUARTZ NOVA ASPEN CEDAR MARBLE IVORY COBALT SLATE GRANITE FALCON HERON LYNX ORION VEGA ALTAIR POLARIS LUMEN APEX AXIS CANVAS DELTA EMBER FJORD GLACIER HORIZON INDIGO JADE KESTREL LAUREL MOSAIC NORTH OPAL PIONEER QUILL RIDGE SAGE TERRA UNION VALOR WILLOW XENON YORK ZEPHYR ARBOR BRISTOL CAMDEN DOVER EATON FAIRFAX GRAFTON HAMPTON IRVING JASPER KENSINGTON LANCASTER MAYFAIR NEWPORT OXFORD PRESTON QUINCY RADLEY STRAND TRINITY UPTON VICTORIA WINDSOR YARDLEY BEDFORD CHELSEA DUNMORE ELGIN FENWICK GLENMORE HOLBORN ISLINGTON'.split(' ');
const DES=[];for(let j=0;j<9;j++)for(let i=0;i<11;i++){const n=j*11+i,hdr=HDRS[i],side=hdr.startsWith('side'),band=['photoband','bandR'].includes(hdr);
 const h=HS[(i+j)%11];DES.push({k:NAMES[n],nm:HN[hdr]+' · '+HSN[h]+' Headings',f:FN[(i+2*j)%4],c:CL[(n*3+j)%8],hdr:side?'side':hdr,h,ex:EX[(i+j*3)%4],sk:SK[(i+j)%2],sh:side?hdr:band?['plain','bar','edge'][n%3]:['plain','bar','edge','frame'][n%4]});}

function HD(k,t,C,fs){const s=fs+.5,b=`margin:0 0 7px;font-size:${s}px;line-height:1.3;font-weight:700;letter-spacing:.08em;text-transform:uppercase;`,L=s*1.3;
 switch(k){
 case 'rule':return [`<h2 style="${b}color:${C};border-bottom:1.5px solid ${C};padding-bottom:4px">${t}</h2>`,L+12.5];
 case 'line':return [`<h2 style="${b}color:${C};display:flex;align-items:center;gap:10px">${t}<span style="flex:1;height:1px;background:${C}"></span></h2>`,L+7];
 case 'center':return [`<h2 style="${b}color:${C};display:flex;align-items:center;gap:12px"><span style="flex:1;height:1px;background:${C}"></span>${t}<span style="flex:1;height:1px;background:${C}"></span></h2>`,L+7];
 case 'shade':return [`<h2 style="${b}color:${C};background:${TINT};padding:5px 8px">${t}</h2>`,L+17];
 case 'solid':return [`<h2 style="${b}color:#FFFFFF;background:${C};padding:5px 10px">${t}</h2>`,L+17];
 case 'tintbar':return [`<h2 style="${b}color:${C};background:${TINT};border-left:4px solid ${C};padding:4px 10px">${t}</h2>`,L+15];
 case 'marker':return [`<h2 style="${b}color:#111;display:flex;align-items:center;gap:9px"><span style="width:9px;height:9px;background:${C};flex-shrink:0"></span>${t}</h2>`,L+7];
 case 'pill':return [`<div style="margin:0 0 8px"><h2 style="${b}margin:0;font-size:${fs-.5}px;color:#FFFFFF;background:${C};display:inline-block;padding:4px 12px;border-radius:999px">${t}</h2></div>`,(fs-.5)*1.3+16];
 case 'thick':return [`<h2 style="${b}color:#111;padding-bottom:6px;background:linear-gradient(${C},${C}) left bottom/40px 3px no-repeat">${t}</h2>`,L+13];
 case 'upper':return [`<h2 style="margin:0 0 6px;font-size:${fs}px;line-height:1.3;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${C}">${t}</h2>`,fs*1.3+6];
 case 'caps':return [`<h2 style="margin:0 0 7px;font-size:${fs+3}px;line-height:1.3;font-weight:700;font-variant:small-caps;letter-spacing:.05em;color:${C};border-bottom:1px solid #9AA0A6;padding-bottom:3px">${t.toLowerCase()}</h2>`,(fs+3)*1.3+11];
 }}
function items(S,C,F,fs,W){
 const lh=fs*1.42,lab=S.h==='label',LW=128,IW=lab?W-146:W;const out=[];let pend=null;
 const sec=t=>{if(lab){pend=t;return;}const [h,hh]=HD(S.h,t,C,fs);out.push({keep:true,mt:15,html:()=>h,h:()=>hh});};
 const add=(mt,html,hf,bul)=>{const label=pend;pend=null;out.push({mt:label?15:mt,bullets:bul,
  html:(x,c)=>lab?`<div style="display:grid;grid-template-columns:${LW}px 1fr;gap:18px"><div style="font-size:${fs-.5}px;line-height:1.35;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C};padding-top:2px">${label&&!c?label:''}</div><div>${html(x,c)}</div></div>`:html(x,c),
  h:(x,c)=>{const v=hf(x,c);return lab&&label&&!c?Math.max(v,lines([[label,fnt(F,fs-.5,1)]],LW)*(fs-.5)*1.35+2):v;}});};
 const side=S.sh.startsWith('side');
 const MK=[];const mk=k=>MK.push([k,out.length]);mk('summary');if(D.summary){sec(HT('summary','Professional Summary'));add(0,()=>`<p style="margin:0">${tf('summary',D.summary)}</p>`,()=>lines([[D.summary,fnt(F,fs)]],IW)*lh);}
 mk('skills');if(D.skills.length&&!(side&&IS('skills'))){sec(HT('skills','Core Skills'));
  if(S.sk==='grid2'){const cw=(IW-18)/2;for(let i=0;i<D.skills.length;i+=2){const pr=D.skills.slice(i,i+2);
   add(i?6:0,()=>`<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">${pr.map(s=>`<div><div style="font-weight:700;color:${C}">${tf(s._i!=null&&'skills.'+s._i+'.cat',s[0])}</div><div>${tf(s._i!=null&&'skills.'+s._i+'.list',s[1])}</div></div>`).join('')}</div>`,()=>Math.max(...pr.map(s=>(lines([[s[0],fnt(F,fs,1)]],cw)+lines([[s[1],fnt(F,fs)]],cw))*lh)));}}
  else D.skills.forEach((s,i)=>add(i?3:0,()=>`<div><strong style="color:#111">${tf(s._i!=null&&'skills.'+s._i+'.cat',s[0])}:</strong> ${tf(s._i!=null&&'skills.'+s._i+'.list',s[1])}</div>`,()=>lines([[s[0]+':',fnt(F,fs,1)],[s[1],fnt(F,fs)]],IW)*lh));}
 mk('exp');if(D.exp.length)sec(HT('exp','Work Experience'));
 const dt=e=>`<span style="font-size:${fs-.5}px;color:#333;white-space:nowrap">${tf('exp.'+e._i+'.d',e.d)}</span>`;
 const ul=(b,p)=>`<ul${D.edit&&p?` data-f="${p}" data-ul="1"`:''} style="margin:0;padding-left:18px">${b.map(x=>`<li style="margin:0 0 2px">${esc(x)}</li>`).join('')}</ul>`;
 const bh=(b,w)=>b.reduce((a,x)=>a+lines([[x,fnt(F,fs)]],w-18)*lh+2,0);
 const stdHead=(e,w)=>[`<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span style="font-weight:700;font-size:${fs+1}px;line-height:1.42;color:#111">${tf('exp.'+e._i+'.t',e.t)}</span>${dt(e)}</div><div style="font-size:${fs}px;color:#333;margin:1px 0 4px">${tf('exp.'+e._i+'.c',e.c)}</div>`,lines([[e.t,fnt(F,fs+1,1)]],w-140)*(fs+1)*1.42+lines([[e.c,fnt(F,fs)]],w)*lh+5];
 const coHead=(e,w)=>[`<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span style="font-weight:700;font-size:${fs+1}px;line-height:1.42;color:${C}">${tf('exp.'+e._i+'.c',e.c)}</span>${dt(e)}</div><div style="font-size:${fs}px;font-weight:700;font-style:italic;color:#111;margin:1px 0 4px">${tf('exp.'+e._i+'.t',e.t)}</div>`,lines([[e.c,fnt(F,fs+1,1)]],w-140)*(fs+1)*1.42+lh+5];
 D.exp.forEach((e,i)=>{
  if(S.ex==='datecol'){const w=IW-118;add(i?11:0,(b,c)=>`<div style="display:grid;grid-template-columns:104px 1fr;gap:14px"><div style="font-size:${fs-1}px;line-height:1.4;font-weight:700;color:${C};padding-top:2px">${c?'':tf('exp.'+e._i+'.d',e.d)}</div><div>${c?'':`<div style="font-weight:700;font-size:${fs+1}px;line-height:1.42;color:#111">${tf('exp.'+e._i+'.t',e.t)}</div><div style="font-size:${fs}px;color:#333;margin:1px 0 4px">${tf('exp.'+e._i+'.c',e.c)}</div>`}${ul(b,'exp.'+e._i+'.b')}</div></div>`,(b,c)=>(c?0:lines([[e.t,fnt(F,fs+1,1)]],w)*(fs+1)*1.42+lines([[e.c,fnt(F,fs)]],w)*lh+5)+bh(b,w),e.b);}
  else if(S.ex==='timeline'){const w=IW-22;add(i?0:0,(b,c)=>`<div style="position:relative;padding:0 0 11px 20px;border-left:2px solid #D3D8DE;margin-left:5px">${c?'':`<span style="position:absolute;left:-7px;top:4px;width:12px;height:12px;border-radius:50%;background:${C}"></span>`}${c?'':stdHead(e,w)[0]}${ul(b,'exp.'+e._i+'.b')}</div>`,(b,c)=>(c?0:stdHead(e,w)[1])+bh(b,w)+11,e.b);}
  else{const hd=S.ex==='cofirst'?coHead:stdHead;add(i?11:0,(b,c)=>`${c?'':hd(e,IW)[0]}${ul(b,'exp.'+e._i+'.b')}`,(b,c)=>(c?0:hd(e,IW)[1])+bh(b,IW),e.b);}
 });
 mk('edu');if(!(side&&IS('edu'))&&D.edu.length){sec(HT('edu','Education'));}if(!(side&&IS('edu')))D.edu.forEach((e,i)=>add(i?6:0,()=>`<div style="display:flex;justify-content:space-between;gap:12px"><div><strong style="color:#111">${tf('edu.'+e._i+'.deg',e[0])}</strong><div>${tf('edu.'+e._i+'.school',e[1])}</div></div><span style="white-space:nowrap;color:#333">${tf('edu.'+e._i+'.yrs',e[2])}</span></div>`,()=>(lines([[e[0],fnt(F,fs,1)]],IW-100)+lines([[e[1],fnt(F,fs)]],IW-100))*lh));
 mk('langs');if(!(side&&IS('langs'))&&D.langs){sec(HT('langs','Languages'));}if(!(side&&IS('langs'))&&D.langs)add(0,()=>`<div>${tf('langs',D.langs)}</div>`,()=>lines([[D.langs,fnt(F,fs)]],IW)*lh);
 mk('extra');(D.extra||[]).forEach((x,xi)=>{if(!x.items.length)return;sec(tf('extra.'+xi+'.title',x.title||'Additional'));add(0,()=>ul(x.items,'extra.'+xi+'.items'),()=>bh(x.items,IW));});
 if(!D.order&&!D.hide)return out;MK.push(['_end',out.length]);const seg={};for(let k=0;k<MK.length-1;k++)seg[MK[k][0]]=out.slice(MK[k][1],MK[k+1][1]);const od=D.order||[];const ord=[...od.filter(k=>seg[k]),...Object.keys(seg).filter(k=>!od.includes(k))];return ord.flatMap(k=>(D.hide||[]).includes(k)?[]:seg[k]);}
const PH=(sz,bd,r)=>{if(D.photoMode==='hide')return '';r=D.photoShape==='square'?'0':D.photoShape==='rounded'?Math.round(sz*.14)+'px':D.photoShape==='circle'?'50%':r;return PH0(sz,bd,r);};
const PH0=(sz,bd,r)=>D.photo?`<img${D.edit?' data-photo="1"':''} src="${D.photo}" alt="" style="width:${sz}px;height:${sz}px;border-radius:${r||'50%'};object-fit:cover;object-position:50% 15%;flex-shrink:0;background:#EAEAEA;${bd}">`:`<div style="width:${sz}px;height:${sz}px;border-radius:${r||'50%'};background:#E6E9EE;color:#5B6470;display:flex;align-items:center;justify-content:center;font-size:${Math.round(sz/2.8)}px;${D.edit?'cursor:pointer;':''};font-weight:700;letter-spacing:.04em;flex-shrink:0;box-sizing:border-box;${bd}">${esc(D.ini)}</div>`.replace('<div style',D.edit?'<div data-photo="1" title="Add photo" style':'<div style');
function header(S,C,F,fs,W){
 const tH=(fs+3)*1.42+5,subH=w=>D.sub?lines([[D.sub,fnt(F,fs-.5)]],w)*(fs-.5)*1.42+2:0;
 const ctH=w=>lines([[D.contact.join('  |  '),fnt(F,fs-1)]],w)*(fs-1)*1.42+9+(D.visa?lines([[D.visa,fnt(F,fs-1)]],w)*(fs-1)*1.42+3:0);
 const core=w=>33+tH+subH(w);
 const name=(col,al)=>`<h1 style="margin:0;font-size:30px;line-height:1.1;font-weight:700;letter-spacing:.04em;color:${col};text-align:${al}">${tf('name',D.name)}</h1>`;
 const tl=(col,al,sc)=>`<div style="font-size:${fs+3}px;line-height:1.42;font-weight:700;color:${col};margin-top:5px;text-align:${al}">${tf('title',D.title)}</div>${D.sub?`<div style="font-size:${fs-.5}px;line-height:1.42;margin-top:2px;text-align:${al};color:${sc}">${tf('sub',D.sub)}</div>`:''}`;
 const ct=(al,col,sc)=>`<div style="font-size:${fs-1}px;line-height:1.42;margin-top:9px;text-align:${al};color:${col}">${D.contact.map(c=>tf(c._k,c)).join(`<span style="color:${sc}"> &nbsp;|&nbsp; </span>`)}</div>${D.visa?`<div style="font-size:${fs-1}px;line-height:1.42;margin-top:3px;text-align:${al};color:${col}">${tf('extraLine',D.visa)}</div>`:''}`;
 const edgeS=S.sh==='edge',BM=edgeS?`-${PY}px -${PX}px 0 -${PX+14}px`:`-${PY}px -${PX}px 0`,BP=edgeS?`${PX+14}px`:`${PX}px`;const W1='#FFFFFF',WS='rgba(255,255,255,.85)',WP='rgba(255,255,255,.5)';
 switch(S.hdr){
 case 'left':return [`<div>${name(C,'left')}${tl('#111','left','#444')}${ct('left','#333','#9AA0A6')}</div>`,core(W)+ctH(W)];
 case 'center':return [`<div style="padding-bottom:14px;border-bottom:1.5px solid ${C}">${name('#111','center')}${tl(C,'center','#444')}${ct('center','#333','#9AA0A6')}</div>`,core(W)+ctH(W)+15.5];
 case 'exec':return [`<div style="padding-bottom:12px;border-bottom:3px double ${C}">${name(C,'left')}${tl('#111','left','#444')}${ct('left','#333','#9AA0A6')}</div>`,core(W)+ctH(W)+15];
 case 'band':return [`<div style="background:${C};margin:${BM};padding:34px 52px 26px ${BP}">${name(W1,'left')}${tl(W1,'left',WS)}${ct('left',WS,WP)}</div>`,34+core(W)+ctH(W)+26-46];
 case 'photoband':return [`<div style="background:${C};margin:${BM};padding:30px 52px 30px ${BP};display:flex;gap:26px;align-items:center">${PH(112,'border:3px solid #FFFFFF')}<div>${name(W1,'left')}${tl(W1,'left',WS)}${ct('left',WS,WP)}</div></div>`,30+Math.max(118,core(W-138)+ctH(W-138))+30-46];
 case 'photoR':return [`<div style="display:flex;gap:24px;align-items:center;padding-bottom:14px;border-bottom:1.5px solid ${C}"><div style="flex:1">${name('#111','left')}${tl(C,'left','#444')}${ct('left','#333','#9AA0A6')}</div>${PH(110,`border:3px solid ${C}`)}</div>`,Math.max(116,core(W-134)+ctH(W-134))+15.5];
 case 'photoL':return [`<div style="display:flex;gap:24px;align-items:center;padding-bottom:14px;border-bottom:1.5px solid ${C}">${PH(110,`border:3px solid ${TINT};outline:2px solid ${C}`)}<div style="flex:1">${name(C,'left')}${tl('#111','left','#444')}${ct('left','#333','#9AA0A6')}</div></div>`,Math.max(116,core(W-134)+ctH(W-134))+15.5];
 case 'split':{const stk=[...D.contact,D.visa].filter(Boolean);const sh=stk.reduce((a,c)=>a+lines([[c,fnt(F,fs-1)]],220)*(fs-1)*1.42+2,0);
  return [`<div style="display:grid;grid-template-columns:1fr 220px;gap:24px;align-items:end;padding-bottom:14px;border-bottom:2px solid ${C}"><div>${name(C,'left')}${tl('#111','left','#444')}</div><div style="display:flex;flex-direction:column;gap:2px;font-size:${fs-1}px;line-height:1.42;color:#333;text-align:right">${stk.map(c=>`<div>${tf(c&&c._k,c)}</div>`).join('')}</div></div>`,Math.max(core(W-244),sh)+16];}
 case 'bandR':return [`<div style="background:${C};margin:${BM};padding:30px 52px 30px ${BP};display:flex;gap:26px;align-items:center"><div style="flex:1">${name(W1,'left')}${tl(W1,'left',WS)}${ct('left',WS,WP)}</div>${PH(112,'border:3px solid #FFFFFF')}</div>`,30+Math.max(118,core(W-138)+ctH(W-138))+30-46];
 case 'centerPhoto':return [`<div style="display:flex;flex-direction:column;align-items:center;padding-bottom:14px;border-bottom:1.5px solid ${C}">${PH(96,'border:3px solid '+C)}<div style="margin-top:10px;width:100%">${name('#111','center')}${tl(C,'center','#444')}${ct('center','#333','#9AA0A6')}</div></div>`,102+10+core(W)+ctH(W)+15.5];
 case 'tintPhoto':return [`<div style="background:${TINT};border-left:5px solid ${C};padding:20px 24px;display:flex;gap:22px;align-items:center"><div style="flex:1">${name(C,'left')}${tl('#111','left','#444')}${ct('left','#333','#9AA0A6')}</div>${PH(108,'border:3px solid #FFFFFF')}</div>`,Math.max(114,core(W-183)+ctH(W-183))+40];
 case 'splitPhoto':{const stk=[...D.contact,D.visa].filter(Boolean);const sh=stk.reduce((a,c)=>a+lines([[c,fnt(F,fs-1)]],200)*(fs-1)*1.42+2,0);
  return [`<div style="display:grid;grid-template-columns:104px 1fr 200px;gap:22px;align-items:center;padding-bottom:14px;border-bottom:2px solid ${C}">${PH(104,'border:3px solid '+C)}<div>${name(C,'left')}${tl('#111','left','#444')}</div><div style="display:flex;flex-direction:column;gap:2px;font-size:${fs-1}px;line-height:1.42;color:#333;text-align:right">${stk.map(c=>`<div>${tf(c&&c._k,c)}</div>`).join('')}</div></div>`,Math.max(110,core(W-348),sh)+16];}
 case 'photoSq':return [`<div style="display:flex;gap:28px;align-items:center;padding-bottom:14px;border-bottom:1.5px solid ${C}"><div style="padding:0 8px 8px 0;flex-shrink:0"><div style="box-shadow:8px 8px 0 ${C};border-radius:4px">${PH(112,'','4px')}</div></div><div style="flex:1">${name('#111','left')}${tl(C,'left','#444')}${ct('left','#333','#9AA0A6')}</div></div>`,Math.max(124,core(W-152)+ctH(W-152))+15.5];
 case 'mono':return [`<div><div style="display:flex;gap:18px;align-items:center"><div style="width:66px;height:66px;background:${C};color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;letter-spacing:.04em;flex-shrink:0">MA</div><div>${name('#111','left')}${tl(C,'left','#444')}</div></div>${ct('left','#333','#9AA0A6')}</div>`,Math.max(66,core(W-84))+ctH(W)];
 case 'boxed':return [`<div><div style="border:2px solid ${C};padding:10px 22px;width:fit-content;margin:0 auto">${name(C,'center')}</div>${tl('#111','center','#444')}${ct('center','#333','#9AA0A6')}</div>`,61+tH+subH(W)+ctH(W)];
 case 'tint':return [`<div style="background:${TINT};border-left:5px solid ${C};padding:20px 24px">${name(C,'left')}${tl('#111','left','#444')}${ct('left','#333','#9AA0A6')}</div>`,core(W-53)+ctH(W-53)+40];
 case 'side':return [`<div>${name(S.sh==='sideDark'?C:'#111','left')}${tl(S.sh==='sideDark'?'#111':C,'left','#444')}</div>`,core(W)];
 }}
function aside(S,C,F,afs,photo){
 const dark=S.sh==='sideDark',hc=dark?'#FFFFFF':C,bc=dark?'rgba(255,255,255,.4)':C,tc=dark?'rgba(255,255,255,.88)':'#222',bd=dark?'#FFFFFF':'#111';
 const h=t=>`<h2 style="margin:0 0 7px;font-size:${afs+.5}px;line-height:1.3;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${hc};border-bottom:1.5px solid ${bc};padding-bottom:4px">${t}</h2>`;
 return `<div style="display:flex;justify-content:center">${PH(140,'border:4px solid '+(dark?'#FFFFFF':C))}</div><div>${h(HT('contact','Contact'))}<div style="display:flex;flex-direction:column;gap:4px;word-break:break-word;color:${tc}">${D.contact.map(c=>`<div>${tf(c&&c._k,c)}</div>`).join('')}${D.visa?`<div style="margin-top:4px">${tf('extraLine',D.visa)}</div>`:''}</div></div>${IS('skills')&&D.skills.length?`<div>${h(HT('skills','Skills'))}<div style="display:flex;flex-direction:column;gap:7px;color:${tc}">${D.skills.map(s=>`<div><strong style="color:${bd}">${tf(s._i!=null&&'skills.'+s._i+'.cat',s[0])}</strong><div>${tf(s._i!=null&&'skills.'+s._i+'.list',s[1])}</div></div>`).join('')}</div></div>`:''}${IS('edu')&&D.edu.length?`<div>${h(HT('edu','Education'))}<div style="display:flex;flex-direction:column;gap:9px">${D.edu.map(e=>`<div><strong style="color:${bd}">${tf('edu.'+e._i+'.deg',e[0])}</strong><div style="color:${tc}">${tf('edu.'+e._i+'.school',e[1])}<br>${tf('edu.'+e._i+'.yrs',e[2])}</div></div>`).join('')}</div></div>`:''}${IS('langs')&&D.langs?`<div>${h(HT('langs','Languages'))}<div style="display:flex;flex-direction:column;gap:3px;color:${tc}">${(D.edit?`<div data-f="langs">${esc(D.langs)}</div>`:D.langs.split(/,\s*/).map(l=>`<div>${esc(l)}</div>`).join(''))}</div></div>`:''}`;}
function asideH(F,afs,W,photo){const lh=afs*1.4,hh=afs*1.3+12.5;let t=92+(photo?136:0)+hh*2+16;
 t+=D.contact.reduce((a,c)=>a+lines([[c,fnt(F,afs)]],W)*lh+3,0)+4+(D.visa?lines([[D.visa,fnt(F,afs)]],W)*lh:0);
 t+=D.skills.reduce((a,s)=>a+(lines([[s[0],fnt(F,afs,1)]],W)+lines([[s[1],fnt(F,afs)]],W))*lh+6,0);return t;}
const GEO={plain:[690,92],bar:[690,92],edge:[676,92],frame:[678,104],sideL:[472,92],sideR:[472,92],sideDark:[462,92]};
let KEEP=false;const IS=k=>((D.col||{})[k]||(k==='skills'?'main':'side'))==='side'&&!(D.hide||[]).includes(k);let PX=52,PY=46,PGW=794,PGH=1123;const GW=S=>GEO[S.sh][0]+(PGW-794)+2*(52-PX);
const HT=(k,t)=>tf('heads.'+k,(D.heads&&D.heads[k])||t);
const tf=(p,t)=>D.edit&&p?`<span data-f="${p}">${esc(t)}</span>`:esc(t);
function shell(S,C,F,fs,p,flow,photo){
 const base=`width:${PGW}px;height:${PGH}px;background:#FFFFFF;font-family:${F};color:#222;font-size:${fs}px;line-height:1.42;box-sizing:border-box;overflow:hidden;position:relative`;
 const fl=`<div style="flex:1;min-height:0;overflow:hidden">${flow}</div>`;
 const hd=p===0?header(S,C,F,fs,GW(S))[0]:'';const g=p===0?16:0;
 if(S.sh.startsWith('side')){const dark=S.sh==='sideDark',aw=dark?260:250,afs=fs-1.5;
  const as=`<aside style="background:${dark?C:TINT};padding:${PY}px 22px;display:flex;flex-direction:column;gap:16px;font-size:${afs}px;line-height:1.4;overflow:hidden">${p===0?aside(S,C,F,afs,photo):''}</aside>`;
  const mn=`<main style="padding:${PY}px ${PX-16}px;display:flex;flex-direction:column;gap:${g}px;min-height:0">${hd}${fl}</main>`;
  return `<div style="${base};display:grid;grid-template-columns:${S.sh==='sideR'?`1fr ${aw}px`:`${aw}px 1fr`}">${S.sh==='sideR'?mn+as:as+mn}</div>`;}
 let deco='',pad=`${PY}px ${PX}px`;
 if(S.sh==='bar'||(p>0&&(S.hdr==='band'||S.hdr==='photoband')))deco+=`<div style="position:absolute;left:0;right:0;top:0;height:8px;background:${C}"></div>`;
 if(S.sh==='edge'){deco+=`<div style="position:absolute;left:0;top:0;bottom:0;width:14px;background:${C}"></div>`;pad=`${PY}px ${PX}px ${PY}px ${PX+14}px`;}
 if(S.sh==='frame'){deco+=`<div style="position:absolute;inset:18px;border:1.5px solid ${C};pointer-events:none"></div>`;pad=`${PY+6}px ${PX+6}px`;}
 return `<div style="${base};padding:${pad};display:flex;flex-direction:column;gap:${g}px">${deco}${hd}${fl}</div>`;}
function paginate(S,C,F,fs,photo){
 const W=GW(S),VP=GEO[S.sh][1]+2*(PY-46);const its=items(S,C,F,fs,W);const pages=[];let i=0,bi=0;
 while(i<its.length&&pages.length<6){
  const p=pages.length;const av=PGH-VP-(p===0?header(S,C,F,fs,W)[1]+16:0)-10;let used=0,html='';const K=1.02;
  const put=(h,mt,hh)=>{const a=(used?mt:0)+hh*K;if(used+a>av)return false;html+=`<div style="margin-top:${used?mt:0}px">${h}</div>`;used+=a;return true;};
  let placed=0;
  while(i<its.length){const it=its[i];
   if(it.keep){const nx=its[i+1];const fh=nx.bullets?nx.h(nx.bullets.slice(0,2),false):nx.h();if(used+(used?it.mt:0)+(it.h()+fh)*K>av)break;put(it.html(),it.mt,it.h());i++;placed++;continue;}
   if(it.bullets){const rest=it.bullets.slice(bi),c=bi>0;
    if(put(it.html(rest,c),c?0:it.mt,it.h(rest,c))){i++;bi=0;placed++;continue;}
    if(KEEP&&!c&&placed>0)break;let done=false;for(let k=rest.length-1;k>=1;k--){if(k<2&&!c)break;if(put(it.html(rest.slice(0,k),c),c?0:it.mt,it.h(rest.slice(0,k),c))){bi+=k;done=true;break;}}
    if(!done&&placed===0){html+=it.html(rest,c);i++;bi=0;}break;}
   if(put(it.html(),it.mt,it.h())){i++;placed++;continue;}
   if(placed===0){html+=it.html();i++;}break;}
  pages.push({html:shell(S,C,F,fs,p,html,photo),fill:Math.round(used/av*100)});}
 if(!pages.length)pages.push({html:shell(S,C,F,fs,0,'',photo),fill:0});
 return pages;}
function render(data,n,opt){opt=opt||{};D=data;KEEP=!!opt.keep;const MG={compact:[34,30],default:[52,46],roomy:[66,58]}[opt.margin||'default']||[52,46];PX=MG[0];PY=MG[1];PGW=opt.paper==='letter'?816:794;PGH=opt.paper==='letter'?1056:1123;const S0=DES[n]||DES[0];const F=FONTS[opt.font]||FONTS[S0.f],C=opt.color||S0.c[1];let pg,fs,S=S0;
 const tries=[S0,{...S0,sk:'inline'}];outer:for(const T of tries){S=T;for(fs of (opt.tight?[14,13.6,13.3,13,12.6,12.2,11.8]:[14,13.6,13.3])){pg=paginate(S,C,F,fs,true);if(pg.length<=(opt.max||2))break outer;}}
 return {pages:pg.map(x=>x.html),fs,code:'SKZ-'+String(n+1).padStart(2,'0')+' '+S0.k,name:S0.nm,font:opt.font||S0.f,color:C,photo:S0.hdr!=='left',w:PGW,h:PGH};}
function letter(data,n,opt,body){opt=opt||{};const P=opt.paper==='letter'?[816,1056]:[794,1123];const M={compact:[44,52],default:[60,68],roomy:[72,82]}[opt.margin||'default']||[60,68];const S=DES[n]||DES[0];const F=FONTS[opt.font]||FONTS[S.f],C=opt.color||S.c[1];const v=n%4;const x=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const ct=(data.contact||[]).filter(Boolean).map(x).join(' &nbsp;·&nbsp; ');const al=v===1?'center':'left';
const nm=`<div style="font-size:26px;font-weight:700;letter-spacing:${v===2?'.08em':'.02em'};${v===2?'text-transform:uppercase;':''}color:${C};line-height:1.15">${x(data.name)}</div>`;
const tt=data.title?`<div style="font-size:14px;font-weight:700;color:#333;margin-top:4px">${x(data.title)}</div>`:'';
const cl=ct?`<div style="font-size:12px;color:#555;margin-top:6px">${ct}</div>`:'';
const head=v===3?`<div style="border-left:4px solid ${C};padding-left:14px;margin-bottom:30px">${nm}${tt}${cl}</div>`:`<div style="text-align:${al};border-bottom:${v===2?'2px':'1px'} solid ${C};padding-bottom:14px;margin-bottom:30px">${nm}${tt}${cl}</div>`;
return {html:`<div style="width:${P[0]}px;height:${P[1]}px;background:#fff;box-sizing:border-box;padding:${M[1]}px ${M[0]}px;font-family:${F};font-size:14px;line-height:1.6;color:#222;overflow:hidden">${head}${body}</div>`,w:P[0],h:P[1],color:C};}
window.SKCV={DES,CL,FONTS,render,letter,code:n=>'SKZ-'+String(n+1).padStart(2,'0')+' '+DES[n].k};})();