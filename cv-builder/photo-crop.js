/* Skilleaze photo cropper: drag to position, zoom, auto-centre on face. Bakes a clean square image used by preview, PDF and Word. */
(function(){
if(window.SKPHOTO)return;
const NAVY='#042D7C',INK='#2C3E50',LINE='#E3E4E8',MUTE='#5B6470';
const OUT=520,VIEW=300;
function load(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
async function shrink(src,max){const im=await load(src);const k=Math.min(1,max/Math.max(im.width,im.height));if(k>=1&&/^data:image\/jpeg/.test(src))return src;const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.88);}
async function face(im){try{if(!('FaceDetector' in window))return null;const fd=new window.FaceDetector({fastMode:true,maxDetectedFaces:1});const f=(await fd.detect(im))[0];if(!f)return null;const b=f.boundingBox;return {cx:(b.x+b.width/2)/im.width,cy:(b.y+b.height/2)/im.height,fw:b.width/Math.min(im.width,im.height)};}catch(e){return null;}}
async function auto(im){const f=await face(im);const por=im.height>=im.width;
  if(f){const z=Math.max(1,Math.min(3,0.42/f.fw));return {cx:f.cx,cy:Math.min(1,f.cy+0.06),z};}
  return {cx:.5,cy:por?Math.min(.5,(im.width/im.height)*.5+.02):.5,z:1};}
function bake(im,c){const m=Math.min(im.width,im.height)/c.z;let sx=c.cx*im.width-m/2,sy=c.cy*im.height-m/2;sx=Math.max(0,Math.min(im.width-m,sx));sy=Math.max(0,Math.min(im.height-m,sy));
  const cv=document.createElement('canvas');cv.width=cv.height=OUT;const x=cv.getContext('2d');x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,OUT,OUT);x.drawImage(im,sx,sy,m,m,0,0,OUT,OUT);return cv.toDataURL('image/jpeg',.9);}
function clamp(im,c){c.z=Math.max(1,Math.min(4,c.z));const h=.5/c.z;const ax=Math.min(im.width,im.height)/im.width,ay=Math.min(im.width,im.height)/im.height;c.cx=Math.max(h*ax,Math.min(1-h*ax,c.cx));c.cy=Math.max(h*ay,Math.min(1-h*ay,c.cy));return c;}

async function open(opt){opt=opt||{};const src=opt.src;if(!src)return;const im=await load(src);let c=clamp(im,Object.assign({},opt.crop||await auto(im)));const start=Object.assign({},c);
  const round=opt.shape==='square'?'6px':opt.shape==='rounded'?'18%':'50%';
  const bg=document.createElement('div');bg.setAttribute('role','dialog');bg.setAttribute('aria-label','Adjust photo');
  bg.style.cssText='position:fixed;inset:0;z-index:2147483100;background:rgba(15,30,61,.45);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:Lato,system-ui,sans-serif';
  bg.innerHTML=`<div style="background:#fff;border-radius:24px;width:min(420px,100%);max-height:calc(100vh - 32px);overflow:auto;box-shadow:0 24px 60px rgba(4,45,124,.3);padding:22px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px;color:${INK}">
   <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div style="font-family:'Cormorant Garamond',serif;font-weight:700;font-size:26px;color:${NAVY};line-height:1">Adjust photo</div><button data-a="x" aria-label="Close" style="all:unset;cursor:pointer;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:${MUTE};font-size:18px">✕</button></div>
   <div data-v style="position:relative;width:min(${VIEW}px,100%);aspect-ratio:1;align-self:center;border-radius:16px;overflow:hidden;background:#EEF1F5;touch-action:none;cursor:grab;user-select:none">
    <img data-i src="${src}" alt="" draggable="false" style="position:absolute;left:0;top:0;transform-origin:0 0;max-width:none;pointer-events:none">
    <div style="position:absolute;inset:0;pointer-events:none;border-radius:${round};box-shadow:0 0 0 999px rgba(255,255,255,.55);outline:2px solid #fff"></div>
   </div>
   <div style="font-size:13px;color:${MUTE};text-align:center">Drag to move. Use the slider or pinch to zoom.</div>
   <div style="display:flex;align-items:center;gap:12px"><span style="font-size:13px;font-weight:700;color:${NAVY}">−</span><input data-z type="range" min="1" max="4" step="0.01" aria-label="Zoom" style="flex:1;accent-color:${NAVY}"><span style="font-size:15px;font-weight:700;color:${NAVY}">+</span></div>
   <div style="display:flex;gap:8px;flex-wrap:wrap">
    <button data-a="auto" style="all:unset;cursor:pointer;border:1px solid ${LINE};border-radius:999px;padding:9px 14px;font-size:13px;font-weight:700;color:${NAVY}">Auto-centre</button>
    <button data-a="rep" style="all:unset;cursor:pointer;border:1px solid ${LINE};border-radius:999px;padding:9px 14px;font-size:13px;font-weight:700;color:${NAVY}">Replace photo</button>
    <button data-a="ok" style="all:unset;cursor:pointer;margin-left:auto;background:${NAVY};color:#fff;border-radius:999px;padding:10px 20px;font-size:14px;font-weight:900">Apply</button>
   </div></div>`;
  document.body.appendChild(bg);
  const V=bg.querySelector('[data-v]'),I=bg.querySelector('[data-i]'),Z=bg.querySelector('[data-z]');
  const draw=()=>{const vw=V.clientWidth;const m=Math.min(im.width,im.height)/c.z;const k=vw/m;I.style.width=im.width+'px';I.style.height=im.height+'px';I.style.transform=`translate(${-(c.cx*im.width-m/2)*k}px,${-(c.cy*im.height-m/2)*k}px) scale(${k})`;Z.value=c.z;};
  draw();new ResizeObserver(draw).observe(V);
  const pts=new Map();let last=null;
  const ppx=()=>Math.min(im.width,im.height)/c.z/V.clientWidth;
  V.addEventListener('pointerdown',e=>{V.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});V.style.cursor='grabbing';last=null;});
  V.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const p=pts.get(e.pointerId);
    if(pts.size===2){const [a,b]=[...pts.values()];const d0=Math.hypot(a.x-b.x,a.y-b.y);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const [a2,b2]=[...pts.values()];const d1=Math.hypot(a2.x-b2.x,a2.y-b2.y);if(d0>0){c.z*=d1/d0;clamp(im,c);draw();}return;}
    const s=ppx();c.cx-=(e.clientX-p.x)*s/im.width;c.cy-=(e.clientY-p.y)*s/im.height;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});clamp(im,c);draw();});
  const up=e=>{pts.delete(e.pointerId);if(!pts.size)V.style.cursor='grab';};V.addEventListener('pointerup',up);V.addEventListener('pointercancel',up);
  V.addEventListener('wheel',e=>{e.preventDefault();c.z*=e.deltaY<0?1.06:1/1.06;clamp(im,c);draw();},{passive:false});
  Z.addEventListener('input',()=>{c.z=+Z.value;clamp(im,c);draw();});
  const close=()=>{bg.remove();document.removeEventListener('keydown',kd);};
  const kd=e=>{if(e.key==='Escape')close();if(e.key==='Enter'){e.preventDefault();ok();}};document.addEventListener('keydown',kd);
  const ok=()=>{const u=bake(im,c);close();opt.onApply&&opt.onApply(u,{cx:+c.cx.toFixed(4),cy:+c.cy.toFixed(4),z:+c.z.toFixed(3)});};
  bg.addEventListener('mousedown',e=>{if(e.target===bg)close();});
  bg.querySelector('[data-a=x]').onclick=close;bg.querySelector('[data-a=ok]').onclick=ok;
  bg.querySelector('[data-a=auto]').onclick=async()=>{c=clamp(im,await auto(im));draw();};
  bg.querySelector('[data-a=rep]').onclick=()=>{close();opt.onReplace&&opt.onReplace();};
}
async function fromFile(file,opt){if(!file)return;const raw=await new Promise(r=>{const rd=new FileReader();rd.onload=()=>r(rd.result);rd.readAsDataURL(file);});const orig=await shrink(raw,1200);
  if(opt&&opt.direct){const im=await load(orig);const c=clamp(im,await auto(im));opt.onApply&&opt.onApply(bake(im,c),c,orig);return;}
  open(Object.assign({},opt,{src:orig,crop:null,onApply:(u,c)=>opt.onApply&&opt.onApply(u,c,orig)}));}
window.SKPHOTO={open,fromFile};
})();
