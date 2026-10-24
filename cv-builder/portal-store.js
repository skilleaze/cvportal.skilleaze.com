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
const R={
  async login(u,p){const j=await rpc('portal_login',{p_username:u,p_password:p});if(!j)throw new Error('Username or password is incorrect.');setSess({token:j.token,user:j.user});return j.user;},
  async me(){const t=tok();if(!t)return null;try{const u=await rpc('portal_me',{p_token:t});if(!u){setSess(null);return null;}setSess({token:t,user:u});return u;}catch(e){const s=sess();return s&&s.user;}},
  async logout(){const t=tok();setSess(null);if(t)try{await rpc('portal_logout',{p_token:t})}catch(e){}},
  listUsers:()=>rpc('portal_users_list',{p_token:tok()}),
  createUser:o=>rpc('portal_user_create',{p_token:tok(),p_username:o.username,p_name:o.name,p_password:o.password,p_role:'user'}),
  updateUser:(u,o)=>rpc('portal_user_update',{p_token:tok(),p_username:u,p_active:o.active==null?null:o.active,p_password:o.password||null}),
  deleteUser:u=>rpc('portal_user_delete',{p_token:tok(),p_username:u}),
  saveCV:r=>rpc('portal_cv_save',{p_token:tok(),p_code:r.code,p_kind:r.kind,p_customer:r.customer||'',p_phone:r.phone||'',p_email:r.email||'',p_label:r.label||'',p_doc:r.doc}),
  getCV:c=>rpc('portal_cv_get',{p_token:tok(),p_code:c}),
  searchCVs:(q,kind,by)=>rpc('portal_cv_search',{p_token:tok(),p_q:q||'',p_kind:kind||null,p_by:by||null}),
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
const meta=c=>({code:c.code,kind:c.kind,customer:c.customer,phone:c.phone,email:c.email,label:c.label,created_by:c.created_by,updated_by:c.updated_by,created_at:c.created_at,updated_at:c.updated_at});
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
  async saveCV(r){const d=db();const u=need(d);if(u.role==='admin')throw new Error('Admin accounts manage the portal and cannot create or edit CVs.');const now=new Date().toISOString();let c=d.cvs.find(x=>x.code===r.code);
    if(!c){c={code:r.code,created_by:u.username,created_at:now};d.cvs.push(c);}Object.assign(c,{kind:r.kind,customer:r.customer||'',phone:r.phone||'',email:r.email||'',label:r.label||'',doc:r.doc,updated_by:u.username,updated_at:now});
    try{put(d);}catch(e){throw new Error('Browser storage is full. Connect the shared database (see SETUP.md).');}return true;},
  async getCV(code){const d=db();need(d);const c=d.cvs.find(x=>x.code.toLowerCase()===String(code).trim().toLowerCase());return c?Object.assign(meta(c),{doc:c.doc}):null;},
  async searchCVs(q,kind,by){const d=db();need(d);const n=norm(q);
    return d.cvs.filter(c=>(!kind||c.kind===kind)&&(!by||c.created_by===by)&&(!n||norm(c.customer).includes(n)||norm(c.phone).includes(n)||norm(c.code).includes(n)||norm(c.email).includes(n)))
      .sort((a,b)=>b.updated_at.localeCompare(a.updated_at)).slice(0,100).map(meta);},
  async deleteCV(code){const d=db();need(d,true);d.cvs=d.cvs.filter(c=>c.code!==code);put(d);return true;},
  async stats(){const d=db();need(d);const t=new Date().toISOString().slice(0,10);
    const ex=d.users.filter(u=>u.role!=='admin');return {experts:ex.length,active_experts:ex.filter(u=>u.active).length,logins:ex.reduce((a,u)=>a+(u.login_count||0),0),users:d.users.length,active_users:d.users.filter(u=>u.active).length,cvs:d.cvs.length,ats:d.cvs.filter(c=>c.kind==='ats').length,europass:d.cvs.filter(c=>c.kind==='europass').length,customers:new Set(d.cvs.map(c=>norm(c.phone)||norm(c.customer)).filter(Boolean)).size,cvs_week:d.cvs.filter(c=>Date.now()-new Date(c.created_at)<7*864e5).length,cvs_today:d.cvs.filter(c=>(c.created_at||'').slice(0,10)===t).length};}
};
window.SKP=Object.assign({},REMOTE?R:L,{remote:REMOTE,newCode,session:sess});
})();
