/* Skilleaze DOCX-from-preview: builds the Word file from the same rendered pages the PDF uses,
   so text, bullets, colours, sizes, spacing, columns and bands match the PDF. */
(function(){
const PX=15; // twips per CSS px
const hp=px=>Math.max(2,Math.round(px*1.5)); // half-points
const tw=px=>Math.round(px*PX);
const hex=c=>{const m=/rgba?\(([^)]+)\)/.exec(c||'');if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x));if(p.length>3&&p[3]<0.08)return null;return p.slice(0,3).map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();};
const fam=cs=>String(cs.fontFamily||'Calibri').split(',')[0].replace(/['"]/g,'').trim()||'Calibri';
const inlineish=cs=>/^inline/.test(cs.display)||cs.display==='contents';
function visible(el){const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)<0.05)return false;const r=el.getBoundingClientRect();if(el.tagName==='IMG')return r.width>2&&r.height>2;return r.width>0&&r.height>0;}
function hasText(el){return /\S/.test(el.textContent||'')||!!el.querySelector('img');}
function blockKids(el){return [...el.children].filter(c=>visible(c)&&!(/^(absolute|fixed)$/.test(getComputedStyle(c).position)&&!hasText(c))&&(!inlineish(getComputedStyle(c))||(c.tagName==='IMG'&&c.getBoundingClientRect().width>40)));}
function dataBytes(src){const m=/^data:image\/(png|jpe?g);base64,(.*)$/i.exec(src||'');if(!m)return null;const b=atob(m[2]);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
async function imgRun(X,img){const r=img.getBoundingClientRect();const cs=getComputedStyle(img);let data=null;
  try{if(window.SKRT&&SKRT.photoPng){const rr=cs.borderTopLeftRadius||'0';const v=parseFloat(rr)||0;const shape=/%/.test(rr)?(v>=50?'circle':v/100):(v>=Math.min(r.width,r.height)/2-0.5?'circle':(v<=1?'square':Math.min(.5,v/r.width)));data=await SKRT.photoPng(img.currentSrc||img.src,shape);}}catch(e){}
  if(!data)data=dataBytes(img.currentSrc||img.src);if(!data){try{const rs=await fetch(img.currentSrc||img.src);if(rs.ok)data=new Uint8Array(await rs.arrayBuffer());}catch(e){}}if(!data)return null;
  return new X.ImageRun({data,transformation:{width:Math.round(r.width),height:Math.round(r.height)}});}
// collect runs of an inline subtree
async function runs(X,node,out,st){
  for(const n of node.childNodes){
    if(n.nodeType===3){let t=n.nodeValue.replace(/\s+/g,' ');if(!t)continue;const p=n.parentElement;const cs=getComputedStyle(p);if(cs.display==='none')continue;
      if(!out.length||out[out.length-1]._br)t=t.replace(/^ /,'');if(!t)continue;
      if(cs.textTransform==='uppercase')t=t.toUpperCase();else if(cs.textTransform==='lowercase')t=t.toLowerCase();
      const o={text:t,font:fam(cs),size:hp(parseFloat(cs.fontSize)||14),bold:(parseInt(cs.fontWeight)||400)>=600,italics:cs.fontStyle==='italic',color:hex(cs.color)||'000000'};
      const ls=parseFloat(cs.letterSpacing);if(ls)o.characterSpacing=tw(ls);if(/underline/.test(cs.textDecorationLine||''))o.underline={};
      const r=new X.TextRun(o);out.push(r);}
    else if(n.nodeType===1){if(!visible(n)&&n.tagName!=='BR')continue;
      if(n.tagName==='BR'){const r=new X.TextRun({break:1});r._br=1;out.push(r);continue;}
      if(n.tagName==='IMG'){const ir=await imgRun(X,n);if(ir)out.push(ir);continue;}
      const cs=getComputedStyle(n);
      if(st&&st.tabs&&!inlineish(cs)){/* flex leaf child separated by tab */}
      await runs(X,n,out,st);}
  }
  return out;}
function trimEnd(rs){while(rs.length&&rs[rs.length-1]._br)rs.pop();return rs;}
function paraProps(X,el,ctx,extra){const cs=getComputedStyle(el);const r=el.getBoundingClientRect();
  const pl=parseFloat(cs.paddingLeft)||0,pr=parseFloat(cs.paddingRight)||0,pt=parseFloat(cs.paddingTop)||0,pb=parseFloat(cs.paddingBottom)||0;
  const fs=parseFloat(cs.fontSize)||14;let lh=parseFloat(cs.lineHeight);if(!lh)lh=fs*1.25;
  const before=Math.max(0,r.top-ctx.last)+pt;
  const o={spacing:{before:tw(before),after:tw(pb),line:tw(lh),lineRule:X.LineRuleType?X.LineRuleType.EXACT:'exact'},
    indent:{left:tw(r.left+pl-ctx.left),right:tw(ctx.right-(r.right-pr))}};
  const ta=cs.textAlign;if(ta==='center')o.alignment=X.AlignmentType.CENTER;else if(ta==='right'||ta==='end')o.alignment=X.AlignmentType.RIGHT;else if(ta==='justify')o.alignment=X.AlignmentType.JUSTIFIED;
  const bg=hex(cs.backgroundColor);if(bg&&bg!==ctx.bg)o.shading={type:X.ShadingType.CLEAR,color:'auto',fill:bg};
  const bd={};for(const [s,k] of [['Bottom','bottom'],['Top','top'],['Left','left'],['Right','right']]){const w=parseFloat(cs['border'+s+'Width'])||0;const c=hex(cs['border'+s+'Color']);if(w>=0.5&&c&&cs['border'+s+'Style']!=='none')bd[k]={style:X.BorderStyle.SINGLE,size:Math.max(2,Math.round(w*6)),color:c,space:Math.round(((k==='bottom'?pb:k==='top'?pt:k==='left'?pl:pr))*0.75)};}
  if(Object.keys(bd).length)o.border=bd;
  ctx.last=r.bottom;return Object.assign(o,extra||{});}
async function leafPara(X,el,ctx,extra){const rs=trimEnd(await runs(X,el,[],null));if(!rs.length)return null;const pp=paraProps(X,el,ctx,extra);if(el.querySelector('img'))delete pp.spacing.line,delete pp.spacing.lineRule;return new X.Paragraph(Object.assign({children:rs},pp));}
function rowsOf(kids){const rows=[];kids.forEach(k=>{const r=k.getBoundingClientRect();const row=rows.find(R=>r.top<R.bottom-2&&r.bottom>R.top+2);if(row){row.items.push(k);row.top=Math.min(row.top,r.top);row.bottom=Math.max(row.bottom,r.bottom);}else rows.push({items:[k],top:r.top,bottom:r.bottom});});
  rows.forEach(R=>R.items.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left));return rows.sort((a,b)=>a.top-b.top);}
const NOB=X=>({top:{style:X.BorderStyle.NONE,size:0,color:'FFFFFF'},bottom:{style:X.BorderStyle.NONE,size:0,color:'FFFFFF'},left:{style:X.BorderStyle.NONE,size:0,color:'FFFFFF'},right:{style:X.BorderStyle.NONE,size:0,color:'FFFFFF'},insideHorizontal:{style:X.BorderStyle.NONE,size:0,color:'FFFFFF'},insideVertical:{style:X.BorderStyle.NONE,size:0,color:'FFFFFF'}});
async function cellOf(X,el,width,ctxBg,opt){const cs=getComputedStyle(el);const r=el.getBoundingClientRect();const pl=parseFloat(cs.paddingLeft)||0,pr=parseFloat(cs.paddingRight)||0,pt=parseFloat(cs.paddingTop)||0,pb=parseFloat(cs.paddingBottom)||0;
  const bg=(el.tagName==='IMG'?null:hex(cs.backgroundColor))||ctxBg;const ctx={left:r.left+pl,right:r.right-pr,last:r.top+pt,bg};
  let ch=await conv(X,el,ctx,true);if(!ch.length)ch=[new X.Paragraph({children:[]})];
  const c={children:ch,width:{size:tw(width),type:X.WidthType.DXA},margins:{top:tw(pt),bottom:tw(pb),left:tw(pl),right:tw(pr),marginUnitType:X.WidthType.DXA},borders:NOB(X)};
  const bl=parseFloat(cs.borderLeftWidth)||0,blc=hex(cs.borderLeftColor);if(bl>=0.5&&blc)c.borders=Object.assign({},c.borders,{left:{style:X.BorderStyle.SINGLE,size:Math.round(bl*6),color:blc}});
  if(bg&&bg!==ctxBg)c.shading={type:X.ShadingType.CLEAR,color:'auto',fill:bg};
  if(opt&&opt.vcenter)c.verticalAlign=X.VerticalAlign.CENTER;return new X.TableCell(c);}
async function tableOf(X,cont,rows,ctx,opt){const cr=cont.getBoundingClientRect();const L=Math.min(...rows.flatMap(R=>R.items.map(i=>i.getBoundingClientRect().left))),Rr=Math.max(...rows.flatMap(R=>R.items.map(i=>i.getBoundingClientRect().right)));
  const W=Math.max(10,Rr-L);const trs=[];let colW=null;
  for(const R of rows){const its=R.items;const cells=[];
    for(let i=0;i<its.length;i++){const a=its[i].getBoundingClientRect();const nx=i+1<its.length?its[i+1].getBoundingClientRect().left:Rr;const w=Math.max(8,nx-a.left);cells.push(await cellOf(X,its[i],w,ctx.bg,{vcenter:opt&&opt.vcenter}));}
    if(!colW)colW=its.map((it,i)=>{const a=it.getBoundingClientRect();const nx=i+1<its.length?its[i+1].getBoundingClientRect().left:Rr;return tw(Math.max(8,nx-a.left));});
    const row={children:cells,cantSplit:false};if(opt&&opt.minH)row.height={value:tw(opt.minH),rule:X.HeightRule.ATLEAST};trs.push(new X.TableRow(row));}
  const before=Math.max(0,rows[0].top-ctx.last);ctx.last=Math.max(...rows.map(R=>R.bottom));
  const t=new X.Table({rows:trs,width:{size:tw(W),type:X.WidthType.DXA},columnWidths:rows.length===1?colW:undefined,layout:X.TableLayoutType.FIXED,borders:NOB(X),indent:{size:tw(L-ctx.left),type:X.WidthType.DXA},margins:{top:0,bottom:0,left:0,right:0}});
  const out=[];if(before>3)out.push(new X.Paragraph({children:[],spacing:{before:0,after:0,line:tw(before),lineRule:X.LineRuleType?X.LineRuleType.EXACT:'exact'}}));out.push(t);return out;}
async function listItems(X,ul,ctx){const out=[];const ord=ul.tagName==='OL';
  for(const li of [...ul.children].filter(visible)){const cs=getComputedStyle(li);const rs=trimEnd(await runs(X,li,[],null));if(!rs.length)continue;
    const pp=paraProps(X,li,ctx);const left=pp.indent.left;pp.indent={left,hanging:Math.round((parseFloat(cs.fontSize)||14)*0.9*PX),right:pp.indent.right};
    const none=cs.listStyleType==='none';
    out.push(new X.Paragraph(Object.assign({children:rs},pp,none?{}:{numbering:{reference:ord?'skdo':'skdb',level:0}})));}
  return out;}
async function conv(X,el,ctx,inCell){const out=[];
  if(el.tagName==='IMG'){const ir=await imgRun(X,el);if(ir){const r=el.getBoundingClientRect();out.push(new X.Paragraph({children:[ir],spacing:{before:tw(Math.max(0,r.top-ctx.last)),after:0},indent:{left:tw(r.left-ctx.left)}}));ctx.last=r.bottom;}return out;}
  const kids=blockKids(el);
  if(!kids.length){if(hasText(el)){const p=await leafPara(X,el,ctx);if(p)out.push(p);}return out;}
  // loose inline text alongside blocks -> wrap
  const looseText=[...el.childNodes].some(n=>n.nodeType===3&&/\S/.test(n.nodeValue));
  if(looseText&&kids.length){const p=await leafPara(X,el,ctx);if(p)out.push(p);return out;}
  const rows=rowsOf(kids);
  for(const R of rows){
    if(R.items.length>1){
      const allLeaf=R.items.every(k=>k.tagName!=='IMG'&&!k.querySelector('img')&&!blockKids(k).length&&k.tagName!=='UL'&&k.tagName!=='OL'&&!getComputedStyle(k).backgroundColor.match(/rgb\((?!255, 255, 255)/));
      if(allLeaf&&R.items.length<=4){// one paragraph with tab stops
        const rs=[];const tabs=[];const base=R.items[0];
        for(let i=0;i<R.items.length;i++){const it=R.items[i];const r=it.getBoundingClientRect();const cs=getComputedStyle(it);
          if(i>0){const right=Math.abs(r.right-ctx.right)<6&&(cs.textAlign==='right'||r.left>ctx.left+(ctx.right-ctx.left)*0.5||i===R.items.length-1&&Math.abs(r.right-ctx.right)<6);
            tabs.push(right?{type:X.TabStopType.RIGHT,position:tw(r.right-ctx.left)}:{type:X.TabStopType.LEFT,position:tw(r.left-ctx.left)});rs.push(new X.TextRun({text:'\t'}));}
          rs.push(...trimEnd(await runs(X,it,[],null)));}
        const top=R.top;const fake={getBoundingClientRect:()=>({top,bottom:R.bottom,left:base.getBoundingClientRect().left,right:ctx.right})};
        const pp=paraProps(X,base,Object.assign({},ctx));pp.indent={left:0,right:0};pp.spacing.before=tw(Math.max(0,top-ctx.last));ctx.last=R.bottom;
        out.push(new X.Paragraph(Object.assign({children:rs,tabStops:tabs},pp)));continue;}
      const big=!inCell&&(R.bottom-R.top)>600;
      out.push(...await tableOf(X,el,[R],ctx,{minH:big?(R.bottom-R.top)*0.96:0,vcenter:false}));continue;}
    const k=R.items[0];const cs=getComputedStyle(k);const tag=k.tagName;
    if(tag==='UL'||tag==='OL'){out.push(...await listItems(X,k,ctx));continue;}
    if(tag==='IMG'){const ir=await imgRun(X,k);const r=k.getBoundingClientRect();if(ir){const pp={spacing:{before:tw(Math.max(0,r.top-ctx.last)),after:0},indent:{left:tw(r.left-ctx.left)}};ctx.last=r.bottom;out.push(new X.Paragraph(Object.assign({children:[ir]},pp)));}continue;}
    if(tag==='HR'||(!hasText(k)&&k.getBoundingClientRect().height<=8)){const r=k.getBoundingClientRect();const c=hex(cs.backgroundColor)||hex(cs.borderTopColor)||hex(cs.borderBottomColor);if(c){const th=Math.max(0.5,r.height||parseFloat(cs.borderTopWidth)||1);out.push(new X.Paragraph({children:[],spacing:{before:tw(Math.max(0,r.top-ctx.last)),after:0,line:20,lineRule:X.LineRuleType?X.LineRuleType.EXACT:'exact'},indent:{left:tw(r.left-ctx.left),right:tw(ctx.right-r.right)},border:{bottom:{style:X.BorderStyle.SINGLE,size:Math.max(2,Math.round(th*6)),color:c,space:0}}}));ctx.last=r.bottom;}continue;}
    if(!hasText(k))continue;
    const sub=blockKids(k);const bg=hex(cs.backgroundColor);
    const boxed=sub.length&&((bg&&bg!==ctx.bg)||['Top','Bottom','Left','Right'].filter(s=>(parseFloat(cs['border'+s+'Width'])||0)>=0.5).length>=2);
    if(boxed){out.push(...await tableOf(X,el,[{items:[k],top:k.getBoundingClientRect().top,bottom:k.getBoundingClientRect().bottom}],ctx,{}));continue;}
    if(!sub.length){const p=await leafPara(X,k,ctx);if(p)out.push(p);continue;}
    // transparent container: recurse with padding-aware context
    const r=k.getBoundingClientRect();const pt=parseFloat(cs.paddingTop)||0;
    const bl=parseFloat(cs.borderLeftWidth)||0;
    const c2={left:ctx.left,right:ctx.right,last:ctx.last,bg:ctx.bg};
    const inner=await conv(X,k,c2,inCell);out.push(...inner);ctx.last=Math.max(c2.last,r.bottom-(parseFloat(cs.paddingBottom)||0));
  }
  return out;}
async function sections(X,pages,opt){opt=opt||{};const W=opt.w||794,H=opt.h||1123;
  const host=document.createElement('div');host.setAttribute('aria-hidden','true');host.style.cssText='position:fixed;left:-20000px;top:0;width:'+W+'px;pointer-events:none;z-index:-1';document.body.appendChild(host);
  const secs=[];
  try{for(const html of pages){host.innerHTML='<div style="width:'+W+'px;height:'+H+'px;position:relative;overflow:hidden;background:#fff">'+html+'</div>';
      const imgs=[...host.querySelectorAll('img')];await Promise.race([Promise.all([document.fonts?document.fonts.ready:1,...imgs.map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r;}))]),new Promise(r=>setTimeout(r,2500))]);
      const wrap=host.firstElementChild;let root=wrap.firstElementChild||wrap;while(root.children.length===1&&blockKids(root).length===1&&!hasOwnText(root)&&!hex(getComputedStyle(root).backgroundColor)&&root.firstElementChild&&root.firstElementChild.getBoundingClientRect().width>=W-2)root=root.firstElementChild;
      const pr=wrap.getBoundingClientRect();const cs=getComputedStyle(root);const rr=root.getBoundingClientRect();
      const pl=(parseFloat(cs.paddingLeft)||0)+(rr.left-pr.left),prr=(parseFloat(cs.paddingRight)||0)+(pr.right-rr.right),pt=(parseFloat(cs.paddingTop)||0)+(rr.top-pr.top),pb=parseFloat(cs.paddingBottom)||0;
      const bg=hex(cs.backgroundColor);const ctx={left:pr.left+pl,right:pr.right-prr,last:pr.top+pt,bg:bg||'FFFFFF'};
      let ch=await conv(X,root,ctx,false);if(!ch.length)ch=[new X.Paragraph({children:[]})];
      const sp={page:{size:{width:tw(W),height:tw(H)},margin:{top:tw(pt),bottom:tw(Math.max(pb,8)),left:tw(pl),right:tw(prr),header:0,footer:0}}};
      const fr=[...root.querySelectorAll('*')].find(e=>{const c=getComputedStyle(e);if(!/^(absolute|fixed)$/.test(c.position)||hasText(e))return false;const b=e.getBoundingClientRect();return b.width>W*0.8&&b.height>H*0.8&&['Top','Right','Bottom','Left'].every(s=>(parseFloat(c['border'+s+'Width'])||0)>=0.5);});
      const strip=!fr&&[...root.querySelectorAll('*')].find(e=>{const c=getComputedStyle(e);if(!/^(absolute|fixed)$/.test(c.position)||hasText(e))return false;const b=e.getBoundingClientRect();return b.height>H*0.8&&b.width<=22&&b.width>=2&&hex(c.backgroundColor)&&(b.left-pr.left<4||pr.right-b.right<4);});
      if(strip&&X.PageBorderOffsetFrom){const c=getComputedStyle(strip);const b=strip.getBoundingClientRect();const k=(b.left-pr.left<4)?'pageBorderLeft':'pageBorderRight';sp.page.borders={pageBorders:{offsetFrom:X.PageBorderOffsetFrom.PAGE},[k]:{style:X.BorderStyle.SINGLE,size:Math.min(96,Math.max(4,Math.round(b.width*6))),color:hex(c.backgroundColor),space:0}};}
      if(fr&&X.PageBorderOffsetFrom){const c=getComputedStyle(fr);const b=fr.getBoundingClientRect();const col=hex(c.borderTopColor)||'000000';const w=parseFloat(c.borderTopWidth)||1;const pt2=px=>Math.max(0,Math.min(31,Math.round(px*0.75)));
        const mk=d=>({style:X.BorderStyle.SINGLE,size:Math.max(2,Math.round(w*6)),color:col,space:pt2(d)});
        sp.page.borders={pageBorders:{display:X.PageBorderDisplay?X.PageBorderDisplay.ALL_PAGES:undefined,offsetFrom:X.PageBorderOffsetFrom.PAGE,zOrder:X.PageBorderZOrder?X.PageBorderZOrder.BACK:undefined},pageBorderTop:mk(b.top-pr.top),pageBorderBottom:mk(pr.bottom-b.bottom),pageBorderLeft:mk(b.left-pr.left),pageBorderRight:mk(pr.right-b.right)};}
      if(bg&&bg!=='FFFFFF')sp.page.background=undefined;
      secs.push({properties:sp,children:ch});}}
  finally{host.remove();}
  return secs;}
function hasOwnText(el){return [...el.childNodes].some(n=>n.nodeType===3&&/\S/.test(n.nodeValue));}
function numbering(X){return {config:[{reference:'skdb',levels:[{level:0,format:X.LevelFormat.BULLET,text:'\u2022',alignment:X.AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:220}}}}]},{reference:'skdo',levels:[{level:0,format:X.LevelFormat.DECIMAL,text:'%1.',alignment:X.AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]};}
window.SKDOCX={sections,numbering};
})();
