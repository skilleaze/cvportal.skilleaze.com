// QA PREVIEW BRANCH ONLY: never merge. Browser-only preview mode (no Supabase, no real data),
// seeded with demo data. Add ?as=admin to the URL to view as the admin, ?as=expert for an expert.
window.SKP_CONFIG={supabaseUrl:'',supabaseAnonKey:'',aiEnabled:false};
(function(){try{
const D='skp_db_v1',S='skp_session_v1';let d=JSON.parse(localStorage.getItem(D)||'null')||{users:[],cvs:[],sessions:{}};d.sessions=d.sessions||{};
if(d.demo!==3){let seed=7;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;const pick=a=>a[Math.floor(r()*a.length)];
 const now=Date.now(),iso=t=>new Date(t).toISOString();
 const EX=[['qa.expert','Aisha Rahman'],['priya.n','Priya Nair'],['rahul.m','Rahul Menon'],['fathima.s','Fathima Shaikh'],['arjun.p','Arjun Pillai'],['sneha.i','Sneha Iyer']];
 d={demo:3,users:[{username:'skilleazeadmin',name:'Skilleaze Admin',role:'admin',pass:'-',active:true,created_by:null,created_at:iso(now-90*864e5),last_login:iso(now-3600e3),login_count:48}],cvs:[],sessions:{},act:[],orders:[],seq:0,oseq:0};
 EX.forEach(([u,n],i)=>d.users.push({username:u,name:n,role:'user',pass:'-',active:i!==5,created_by:'skilleazeadmin',created_at:iso(now-(80-i*6)*864e5),last_login:iso(now-(i*5+1)*3600e3),login_count:20+i*7}));
 const FN=['Suresh','Meghasini','Nanhe','Ravi','Anitha','Mohammed','Deepa','Karthik','Lakshmi','Vikram','Neha','Imran','Divya','Sanjay','Pooja','Faisal','Harish','Kavya','Naveen','Sara'];
 const LN=['Kumar','Jain','Chaurasiya','Krishnan','Reddy','Ali','Menon','Raj','Iyer','Singh','Sharma','Khan','Pillai','Nair','Patel','Rahman','Das','Shetty','Joseph','Thomas'];
 const TT=['Accountant','Sales Executive','Software Engineer','HR Generalist','Nurse','Operations Manager','Civil Engineer','Marketing Executive','Customer Service Lead','Data Analyst'];
 const W=[3,1,1,1,1,.6];const who=()=>{let t=r()*W.reduce((a,b)=>a+b),k=0;for(;k<W.length;k++){t-=W[k];if(t<=0)break;}return EX[Math.min(k,5)][0];};
 for(let i=0;i<160;i++){const age=Math.pow(r(),1.3)*45;const t0=now-age*864e5-r()*8*3600e3;const by=who();const nm=pick(FN)+' '+pick(LN);const kind=r()<.74?'ats':'europass';d.seq++;
  const code=(kind==='ats'?'ATS-':'EUP-')+Math.floor(r()*36**6).toString(36).toUpperCase().padStart(6,'0');const secs=Math.round(600+r()*3000);const dl=r()<.82?1+Math.floor(r()*2.2):0;
  const ph='+91 9'+String(Math.floor(r()*1e9)).padStart(9,'0');
  d.cvs.push({code,serial:d.seq,kind,customer:nm,phone:ph,email:nm.toLowerCase().replace(' ','.')+'@gmail.com',label:nm+' CV',doc:{tpl:Math.floor(r()*99),data:{name:nm,title:pick(TT)}},created_by:by,updated_by:by,created_at:iso(t0),updated_at:iso(t0+secs*1000),time_spent:secs,edit_count:1+Math.floor(r()*6),downloads:dl,last_download:dl?iso(t0+secs*1000):null});
  d.act.push({id:i*10+1,code,username:by,action:'created',seconds:Math.round(secs*.6),at:iso(t0)});d.act.push({id:i*10+2,code,username:by,action:'edited',seconds:Math.round(secs*.4),at:iso(t0+secs*600)});
  if(dl){d.act.push({id:i*10+3,code,username:by,action:'download_pdf',seconds:0,detail:'',at:iso(t0+secs*1000)});
   const add=(svc,rate)=>{d.oseq++;const ct=iso(t0+secs*1000);d.orders.push({id:d.oseq,ref:code,service:svc,customer:nm,phone:ph,note:'',status:'completed',created_by:by,created_at:ct,completed_by:by,completed_at:ct,rate,updated_at:ct});};
   add('cv',30);if(r()<.4)add('cover',5);if(r()<.06)add('linkedin',50);}}
}
const as=(new URLSearchParams(location.search).get('as'))||sessionStorage.getItem('qa_as')||'expert';sessionStorage.setItem('qa_as',as);
const un=as==='admin'?'skilleazeadmin':'qa.expert';const u=d.users.find(x=>x.username===un);
const s=JSON.parse(localStorage.getItem(S)||'null');if(!s||d.sessions[s.token]!==un){const t='qa-'+as+'-'+Date.now();d.sessions[t]=un;localStorage.setItem(S,JSON.stringify({token:t,user:{username:un,name:u.name,role:u.role}}));}
localStorage.setItem(D,JSON.stringify(d));}catch(e){console.warn('qa seed',e)}})();
