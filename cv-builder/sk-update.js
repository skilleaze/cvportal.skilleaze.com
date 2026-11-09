/* Skilleaze auto-update + self-heal. Loaded first on every editor page. */
(function(){var BUILD='20261109.1';window.SK_BUILD=BUILD;
var NEED=[['SKCV','render'],['SKRT','unwrap'],['SKRT','plain'],['SKRT','toEdit']];
function stamp(v){try{var u=new URL(location.href);u.searchParams.set('_v',v);return u.toString();}catch(e){return location.href;}}
function hard(v,why){var k='sk_upd_'+v;try{if(sessionStorage.getItem(k))return false;sessionStorage.setItem(k,why||'1');}catch(e){}
  var go=function(){location.replace(stamp(v));};
  try{if(window.caches&&caches.keys)caches.keys().then(function(ks){return Promise.all(ks.map(function(x){return caches.delete(x);}));}).then(go,go);else go();}catch(e){go();}
  try{if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations)navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.update&&r.update();});});}catch(e){}
  return true;}
function editing(){var a=document.activeElement;return !!(a&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)));}
function check(){fetch('/version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
  if(!j||!j.v||j.v===BUILD)return;
  var run=function(){if(editing()){setTimeout(run,4000);return;}banner();setTimeout(function(){hard(j.v,'version');},1200);};run();}).catch(function(){});}
function banner(){if(document.getElementById('sk-upd'))return;var d=document.createElement('div');d.id='sk-upd';
  d.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483647;background:#042D7C;color:#FFFFFF;border-radius:999px;padding:10px 18px;font:700 13px Lato,system-ui,sans-serif;box-shadow:0 10px 30px rgba(4,45,124,.3)';
  d.textContent='Updating to the latest version. Your work is saved.';(document.body||document.documentElement).appendChild(d);}
function missing(){return NEED.filter(function(n){return !(window[n[0]]&&typeof window[n[0]][n[1]]==='function');}).map(function(n){return n.join('.');});}
window.SKUpdate={build:BUILD,check:check,missing:missing,heal:function(why){banner();return hard(BUILD+'-'+Date.now().toString(36).slice(-4),why||'heal');}};
window.addEventListener('load',function(){setTimeout(function(){var m=missing();if(m.length){console.warn('Skilleaze: outdated files',m);hard(BUILD+'-fix','missing '+m.join(','));}},300);check();});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')check();});
setInterval(check,3*60*1000);
})();
