// Skilleaze Internal CV Portal data layer.
// If portal-config.js has a Supabase URL + anon key, everything is shared across all devices.
// Without it, the portal runs in "preview mode" (data stays in this one browser).
(function(){
const CFG=window.SKP_CONFIG||{};
const REMOTE=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey);
const SKEY='skp_session_v1',DKEY='skp_db_v1';
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode=kind=>(kind==='europass'?'EUP':'ATS')+'-'+Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>AL[b%AL.length]).join('');
const sess=()=>{try{return JSON.parse(localStorage.getItem(SKEY)||'null')}catch(e){return null}};
const setSess=v=>v?localStorage.setItem(SKEY,JSON.stringify(v)):localStorage.removeItem(SKEY);
const norm=s=>String(s||'').toLowerCase().replace(/[\s\-+()]/g,'');

// ---------- remote (Supabase RPC) ----------
async function rpc(fn,args){
  const r=await fetch(CFG.supabaseUrl.replace(/\/$/,'')+'/rest/v1/rpc/'+fn,{method:'POST',headers:{'apikey':CFG.supabaseAnonKey,'Authorization':'Bearer '+CFG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify(args||{})});
  const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}
  if(!r.ok)throw new Error((j&&(j.message||j.hint))||('Server error '+r.status));
  return j;
}
const tok=()=>{const s=sess();return s&&s.token};
const MISS=e=>/could not find the function|PGRST202/i.test(String(e&&e.message||e)+' '+String(e&&e.code||''));
const flag=()=>{if(window.SKP)window.SKP.needsUpgrade=true;};
const day=x=>String(x||'').slice(0,10);
async function searchRaw(q,kind,by,from,to){
  try{return await rpc('portal_cv_search',{p_token:tok(),p_q:q||'',p_kind:kind||null,p_by:by||null,p_from:from||null,p_to:to||null});}
  catch(e){if(!MISS(e))throw e;flag();const l=await rpc('portal_cv_search',{p_token:tok(),p_q:q||'',p_kind:kind||null,p_by:by||null});return (l||[]).filter(c=>(!from||day(c.created_at)>=from)&&(!to||day(c.created_at)<=to));}}
const R={
  async login(u,p){const j=await rpc('portal_login',{p_username:u,p_password:p});if(!j)throw new Error('Username or password is incorrect.');setSess({token:j.token,user:j.user});return j.user;},
  async me(){const t=tok();if(!t)return null;try{const u=await rpc('portal_me',{p_token:t});if(!u){setSess(null);return null;}setSess({token:t,user:u});return u;}catch(e){const s=sess();return s&&s.user;}},
  async logout(){const t=tok();setSess(null);if(t)try{await rpc('portal_logout',{p_token:t})}catch(e){}},
  listUsers:()=>rpc('portal_users_list',{p_token:tok()}),
  createUser:o=>rpc('portal_user_create',{p_token:tok(),p_username:o.username,p_name:o.name,p_password:o.password,p_role:'user'}),
  updateUser:(u,o)=>rpc('portal_user_update',{p_token:tok(),p_username:u,p_active:o.active==null?null:o.active,p_password:o.password||null}),
  deleteUser:u=>rpc('portal_user_delete',{p_token:tok(),p_username:u}),
  async saveCV(r){const base={p_token:tok(),p_code:r.code,p_kind:r.kind,p_customer:r.customer||'',p_phone:r.phone||'',p_email:r.email||'',p_label:r.label||'',p_doc:r.doc};
    try{return await rpc('portal_cv_save',Object.assign({p_seconds:r.seconds||0},base));}catch(e){if(!MISS(e))throw e;flag();return await rpc('portal_cv_save',base);}},
  async logCV(c,a,d){try{return await rpc('portal_cv_log',{p_token:tok(),p_code:c,p_action:a,p_detail:d||''});}catch(e){if(MISS(e)){flag();return false;}throw e;}},
  async activity(o){o=o||{};try{return await rpc('portal_activity_list',{p_token:tok(),p_code:o.code||null,p_user:o.user||null,p_from:o.from||null,p_to:o.to||null});}catch(e){if(MISS(e)){flag();return [];}throw e;}},
  async report(f,t){try{return await rpc('portal_report',{p_token:tok(),p_from:f||null,p_to:t||null});}catch(e){if(!MISS(e))throw e;flag();
    const me=(sess()||{}).user||{};const cs=await searchRaw('',null,me.role==='admin'?null:me.username,f,t);let users=[];if(me.role==='admin')try{users=await rpc('portal_users_list',{p_token:tok()})||[];}catch(_){}
    const to=t||new Date().toISOString().slice(0,10);const from=f||(cs.length?cs.map(c=>day(c.created_at)).sort()[0]:to);const daily=[];let x=new Date(from+'T00:00:00Z');const en=new Date(to+'T00:00:00Z');if((en-x)/864e5>89)x=new Date(en-89*864e5);
    for(;x<=en;x=new Date(+x+864e5)){const k=x.toISOString().slice(0,10);daily.push({d:k,n:cs.filter(c=>day(c.created_at)===k).length});}
    return {totals:{cvs:cs.length,ats:cs.filter(c=>c.kind==='ats').length,europass:cs.filter(c=>c.kind==='europass').length,customers:new Set(cs.map(c=>String(c.phone||'').replace(/\D/g,'')||norm(c.customer)).filter(Boolean)).size,seconds:0,downloads:0},daily,
      experts:users.filter(u=>u.role!=='admin').map(u=>({username:u.username,name:u.name,active:u.active,last_login:u.last_login,login_count:u.login_count,created_at:u.created_at,cvs:cs.filter(c=>c.created_by===u.username).length,seconds:0,downloads:0,cvs_all:u.cv_count||0}))};}},
  getCV:c=>rpc('portal_cv_get',{p_token:tok(),p_code:c}),
  searchCVs:(q,kind,by,from,to)=>searchRaw(q,kind,by,from,to),
  deleteCV:c=>rpc('portal_cv_delete',{p_token:tok(),p_code:c}),
  stats:()=>rpc('portal_stats',{p_token:tok()})
};

// ---------- local preview ----------
const db=()=>{let d;try{d=JSON.parse(localStorage.getItem(DKEY)||'null')}catch(e){}return d||{users:[],cvs:[],sessions:{}}};
const put=d=>localStorage.setItem(DKEY,JSON.stringify(d));
async function seed(){const d=db();if(!d.users.some(u=>u.username==='skilleazeadmin')){d.users.push({username:'skilleazeadmin',name:'Skilleaze Admin',role:'admin',pass:await sha(window.SKP_SEED_ADMIN_PW||''),active:true,created_by:null,created_at:new Date().toISOString(),last_login:null,login_count:0});put(d);}return d;}
const curUser=d=>{const s=sess();if(!s)return null;const un=d.sessions[s.token];const u=d.users.find(x=>x.username===un&&x.active);return u||null;};
const pub=u=>u&&({username:u.username,name:u.name,role:u.role,active:u.active,created_by:u.created_by,created_at:u.created_at,last_login:u.last_login,login_count:u.login_count});
const need=(d,admin)=>{const u=curUser(d);if(!u)throw new Error('Please sign in again.');if(admin&&u.role!=='admin')throw new Error('Admins only.');return u;};
const meta=c=>({serial:c.serial,time_spent:c.time_spent||0,edit_count:c.edit_count||0,downloads:c.downloads||0,last_download:c.last_download||null,code:c.code,kind:c.kind,customer:c.customer,phone:c.phone,email:c.email,label:c.label,created_by:c.created_by,updated_by:c.updated_by,created_at:c.created_at,updated_at:c.updated_at});
const L={
  async login(u,p){const d=await seed();const h=await sha(p);const x=d.users.find(z=>z.username.toLowerCase()===String(u).trim().toLowerCase());
    if(!x||x.pass!==h)throw new Error('Username or password is incorrect.');if(!x.active)throw new Error('This account is disabled. Ask the admin.');
    const t=crypto.randomUUID();d.sessions[t]=x.username;x.last_login=new Date().toISOString();x.login_count=(x.login_count||0)+1;put(d);setSess({token:t,user:pub(x)});return pub(x);},
  async me(){const d=await seed();const u=curUser(d);if(!u){setSess(null);return null;}return pub(u);},
  async logout(){const d=db();const s=sess();if(s){delete d.sessions[s.token];put(d);}setSess(null);},
  async listUsers(){const d=db();need(d,true);return d.users.map(u=>Object.assign(pub(u),{cv_count:d.cvs.filter(c=>c.created_by===u.username).length}));},
  async createUser(o){const d=db();const a=need(d,true);const un=String(o.username||'').trim().toLowerCase();
    if(!/^[a-z0-9._-]{3,32}$/.test(un))throw new Error('Username: 3–32 letters, numbers, dot, dash or underscore.');
    if(String(o.password||'').length<8)throw new Error('Password must be at least 8 characters.');
    if(d.users.some(u=>u.username===un))throw new Error('That username already exists.');
    d.users.push({username:un,name:String(o.name||un).trim(),role:'user',pass:await sha(o.password),active:true,created_by:a.username,created_at:new Date().toISOString(),last_login:null,login_count:0});put(d);return true;},
  async updateUser(un,o){const d=db();need(d,true);const u=d.users.find(x=>x.username===un);if(!u)throw new Error('User not found.');
    if(o.active!=null){if(un==='skilleazeadmin')throw new Error('The main admin cannot be disabled.');u.active=!!o.active;}
    if(o.password){if(o.password.length<8)throw new Error('Password must be at least 8 characters.');u.pass=await sha(o.password);}put(d);return true;},
  async deleteUser(un){const d=db();need(d,true);if(un==='skilleazeadmin')throw new Error('The main admin cannot be deleted.');d.users=d.users.filter(u=>u.username!==un);put(d);return true;},
  async saveCV(r){const d=db();const u=need(d);if(u.role==='admin')throw new Error('Admin accounts manage the portal and cannot create or edit CVs.');const now=new Date().toISOString();const sec=Math.max(0,Math.min(r.seconds||0,3600));let c=d.cvs.find(x=>x.code===r.code);d.act=d.act||[];
    if(!c){d.seq=(d.seq||d.cvs.length)+1;c={code:r.code,serial:d.seq,created_by:u.username,created_at:now,time_spent:0,edit_count:0,downloads:0};d.cvs.push(c);d.act.push({id:Date.now(),code:r.code,username:u.username,action:'created',seconds:sec,at:now});}
    else{const last=[...d.act].reverse().find(a=>a.code===r.code&&a.username===u.username&&(a.action==='created'||a.action==='edited'));if(last&&Date.now()-new Date(last.at)<20*60e3)last.seconds+=sec;else d.act.push({id:Date.now(),code:r.code,username:u.username,action:'edited',seconds:sec,at:now});}
    if(!c.serial){d.seq=(d.seq||0)+1;c.serial=d.seq;}c.time_spent=(c.time_spent||0)+sec;c.edit_count=(c.edit_count||0)+1;
    Object.assign(c,{kind:r.kind,customer:r.customer||'',phone:r.phone||'',email:r.email||'',label:r.label||'',doc:r.doc,updated_by:u.username,updated_at:now});
    try{put(d);}catch(e){throw new Error('Browser storage is full. Connect the shared database (see SETUP.md).');}return {serial:c.serial,code:c.code};},
  async logCV(code,action,detail){const d=db();const u=need(d);d.act=d.act||[];d.act.push({id:Date.now(),code,username:u.username,action,seconds:0,detail:detail||'',at:new Date().toISOString()});const c=d.cvs.find(x=>x.code===code);if(c&&/^download_/.test(action)){c.downloads=(c.downloads||0)+1;c.last_download=new Date().toISOString();}put(d);return true;},
  async activity(o){o=o||{};const d=db();const u=need(d);if(!o.code&&u.role!=='admin')throw new Error('Admins only.');const day=x=>String(x||'').slice(0,10);
    return (d.act||[]).filter(a=>(!o.code||a.code===o.code)&&(!o.user||a.username===o.user)&&(!o.from||day(a.at)>=o.from)&&(!o.to||day(a.at)<=o.to)).slice(-300).reverse().map(a=>{const c=d.cvs.find(x=>x.code===a.code)||{};return Object.assign({},a,{customer:c.customer||'',serial:c.serial||null});});},
  async report(from,to){const d=db();const u=need(d);const day=x=>String(x||'').slice(0,10);const today=new Date().toISOString().slice(0,10);const t=to||today;
    const mine=c=>u.role==='admin'||c.created_by===u.username;const f=from||(d.cvs.length?d.cvs.map(c=>day(c.created_at)).sort()[0]:today);
    const inR=c=>day(c.created_at)>=f&&day(c.created_at)<=t;const cs=d.cvs.filter(c=>inR(c)&&mine(c));const act=(d.act||[]).filter(a=>day(a.at)>=f&&day(a.at)<=t);
    const daily=[];let st=new Date(f+'T00:00:00Z');const en=new Date(t+'T00:00:00Z');if((en-st)/864e5>89)st=new Date(en-89*864e5);for(let x=new Date(st);x<=en;x=new Date(+x+864e5)){const k=x.toISOString().slice(0,10);daily.push({d:k,n:d.cvs.filter(c=>mine(c)&&day(c.created_at)===k).length});}
    return {totals:{cvs:cs.length,ats:cs.filter(c=>c.kind==='ats').length,europass:cs.filter(c=>c.kind==='europass').length,customers:new Set(cs.map(c=>norm(c.phone).replace(/\D/g,'')||norm(c.customer)).filter(Boolean)).size,seconds:cs.reduce((a,c)=>a+(c.time_spent||0),0),downloads:cs.reduce((a,c)=>a+(c.downloads||0),0)},daily,
      experts:u.role!=='admin'?[]:d.users.filter(x=>x.role==='user').map(x=>({username:x.username,name:x.name,active:x.active,last_login:x.last_login,login_count:x.login_count,cvs:d.cvs.filter(c=>c.created_by===x.username&&inR(c)).length,seconds:act.filter(a=>a.username===x.username).reduce((a,b)=>a+(b.seconds||0),0),downloads:act.filter(a=>a.username===x.username&&/^download_/.test(a.action)).length,cvs_all:d.cvs.filter(c=>c.created_by===x.username).length})).sort((a,b)=>b.cvs-a.cvs)};},
  async getCV(code){const d=db();need(d);const k=String(code).trim().toLowerCase(),nn=k.replace(/\D/g,'');const c=d.cvs.find(x=>x.code.toLowerCase()===k||(nn&&String(x.serial)===String(+nn)&&/^#?\d+$/.test(k)));return c?Object.assign(meta(c),{doc:c.doc}):null;},
  async searchCVs(q,kind,by,from,to){const d=db();need(d);const n=norm(q).replace('#','');const nd=n.replace(/\D/g,'');const day=x=>String(x||'').slice(0,10);
    return d.cvs.filter(c=>(!kind||c.kind===kind)&&(!by||c.created_by===by)&&(!from||day(c.created_at)>=from)&&(!to||day(c.created_at)<=to)&&(!n||norm(c.customer).includes(n)||norm(c.phone).includes(n)||norm(c.code).includes(n)||norm(c.email).includes(n)||(nd&&String(c.serial)===String(+nd))))
      .sort((a,b)=>b.updated_at.localeCompare(a.updated_at)).slice(0,300).map(meta);},
  async deleteCV(code){const d=db();need(d,true);d.cvs=d.cvs.filter(c=>c.code!==code);put(d);return true;},
  async stats(){const d=db();need(d);const t=new Date().toISOString().slice(0,10);
    const ex=d.users.filter(u=>u.role!=='admin');return {experts:ex.length,active_experts:ex.filter(u=>u.active).length,logins:ex.reduce((a,u)=>a+(u.login_count||0),0),users:d.users.length,active_users:d.users.filter(u=>u.active).length,cvs:d.cvs.length,ats:d.cvs.filter(c=>c.kind==='ats').length,europass:d.cvs.filter(c=>c.kind==='europass').length,customers:new Set(d.cvs.map(c=>norm(c.phone)||norm(c.customer)).filter(Boolean)).size,cvs_week:d.cvs.filter(c=>Date.now()-new Date(c.created_at)<7*864e5).length,cvs_today:d.cvs.filter(c=>(c.created_at||'').slice(0,10)===t).length};}
};
window.SKP=Object.assign({},REMOTE?R:L,{remote:REMOTE,newCode,session:sess});
})();
