/* Skilleaze contrast guard.
   Rule for every screen of the app: dark background -> light text, light background -> dark text.
   It checks each piece of text against the colour actually behind it and, only when the two are too close
   (contrast below 3.5:1), swaps the text to the right ink. CV pages and template thumbnails are never touched,
   so a customer's chosen CV colours stay exactly as designed. Runs after every render. */
(function(){
if(window.__skContrast)return;window.__skContrast=1;
const INK='#1F2D3D',INK_MUTED='#5B6B7F',LIGHT='#FFFFFF',LIGHT_MUTED='#D6DEF0';
const MIN=3.5;
const parse=c=>{const m=/rgba?\(([^)]+)\)/.exec(c||'');if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x));return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};};
const lin=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
const lum=c=>.2126*lin(c.r)+.7152*lin(c.g)+.0722*lin(c.b);
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const mix=(top,bot)=>({r:top.r*top.a+bot.r*(1-top.a),g:top.g*top.a+bot.g*(1-top.a),b:top.b*top.a+bot.b*(1-top.a),a:1});
const isCV=el=>{if(el.closest&&el.closest('[data-skb="prev"],[data-skb="jdprev"],[data-skb="cover"],[data-tpl-thumb],[data-sk-cv]'))return true;for(let e=el;e&&e!==document.body;e=e.parentElement){const s=e.getAttribute&&e.getAttribute('style')||'';if(/width:\s*(794|816)px;\s*height:\s*(1123|1056)px/.test(s)||e.hasAttribute&&(e.hasAttribute('data-cv-page')||e.hasAttribute('data-no-contrast')))return true;}return false;};
function bgOf(el){const stack=[];for(let e=el;e;e=e.parentElement){const cs=getComputedStyle(e);if(cs.backgroundImage&&cs.backgroundImage!=='none'&&/gradient|url\(/.test(cs.backgroundImage)){const c=parse(cs.backgroundColor);if(!c||c.a===0){const g=/rgba?\([^)]+\)/.exec(cs.backgroundImage);if(g){const gc=parse(g[0]);if(gc){stack.push(Object.assign({},gc,{a:Math.max(gc.a,.6)}));if(gc.a>=.6)break;}}else return null;}}
  const c=parse(cs.backgroundColor);if(c&&c.a>0){stack.push(c);if(c.a>=.98)break;}}
  let out={r:255,g:255,b:255,a:1};for(let i=stack.length-1;i>=0;i--)out=mix(stack[i],out);return out;}
const muted=(c,el)=>{const mx=Math.max(c.r,c.g,c.b),mn=Math.min(c.r,c.g,c.b);const fw=+getComputedStyle(el).fontWeight||400;return c.a<.9||(mx-mn<40&&fw<700);};
function fix(el){if(!el||el.nodeType!==1||el.closest('svg'))return;if(isCV(el))return;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')return;
  const fg=parse(cs.color);if(!fg)return;const bg=bgOf(el);if(!bg)return;const eff=mix(fg,bg);if(ratio(eff,bg)>=MIN)return;
  const darkBg=lum(bg)<.36;const want=darkBg?(muted(fg,el)?LIGHT_MUTED:LIGHT):(muted(fg,el)?INK_MUTED:INK);
  el.style.setProperty('color',want,'important');el.dataset.skFixed='1';}
function scan(root){const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});const seen=new Set();let n;while((n=walker.nextNode())){const el=n.parentElement;if(el&&!seen.has(el)){seen.add(el);try{fix(el);}catch(e){}}}
  (root||document.body).querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]),textarea,select').forEach(el=>{if(!seen.has(el))try{fix(el);}catch(e){}});}
let t=0;const run=()=>{clearTimeout(t);t=setTimeout(()=>{try{scan(document.body);}catch(e){}},120);};
const start=()=>{run();new MutationObserver(run).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
window.SK_CONTRAST={scan,ratio:(a,b)=>ratio(parse(a),parse(b))};
})();
