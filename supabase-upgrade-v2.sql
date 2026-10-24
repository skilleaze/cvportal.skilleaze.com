-- Run this ONCE in Supabase → SQL Editor (your existing users and CVs are kept).

-- ===== CRM upgrade (v2): CV numbers, time tracking, downloads, activity log, reports =====
alter table portal_cvs add column if not exists serial bigserial;
alter table portal_cvs add column if not exists time_spent int not null default 0;
alter table portal_cvs add column if not exists edit_count int not null default 0;
alter table portal_cvs add column if not exists downloads int not null default 0;
alter table portal_cvs add column if not exists last_download timestamptz;
create unique index if not exists portal_cvs_serial on portal_cvs(serial);
create index if not exists portal_cvs_created on portal_cvs(created_at);
create table if not exists portal_activity(
  id bigserial primary key, code text, username text, action text not null, seconds int not null default 0,
  detail text default '', at timestamptz not null default now());
create index if not exists portal_activity_at on portal_activity(at);
create index if not exists portal_activity_code on portal_activity(code);
create index if not exists portal_activity_user on portal_activity(username);
alter table portal_activity enable row level security;

drop function if exists portal_cv_save(text,text,text,text,text,text,text,jsonb);
create or replace function portal_cv_save(p_token text,p_code text,p_kind text,p_customer text,p_phone text,p_email text,p_label text,p_doc jsonb,p_seconds int default 0) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; isnew boolean; sec int:=greatest(0,least(coalesce(p_seconds,0),3600)); r portal_cvs; begin u:=portal_auth(p_token);
  if u.role='admin' then raise exception 'Admin accounts manage the portal and cannot create or edit CVs.'; end if;
  isnew:=not exists(select 1 from portal_cvs where code=p_code);
  insert into portal_cvs(code,kind,customer,phone,email,label,doc,created_by,updated_by,time_spent,edit_count)
   values(p_code,p_kind,p_customer,p_phone,p_email,p_label,p_doc,u.username,u.username,sec,1)
  on conflict(code) do update set kind=excluded.kind,customer=excluded.customer,phone=excluded.phone,email=excluded.email,
   label=excluded.label,doc=excluded.doc,updated_by=u.username,updated_at=now(),
   time_spent=portal_cvs.time_spent+sec,edit_count=portal_cvs.edit_count+1
  returning * into r;
  if isnew then insert into portal_activity(code,username,action,seconds) values(p_code,u.username,'created',sec);
  elsif not exists(select 1 from portal_activity where code=p_code and username=u.username and action in('created','edited') and at>now()-interval '20 minutes') then
    insert into portal_activity(code,username,action,seconds) values(p_code,u.username,'edited',sec);
  else update portal_activity set seconds=seconds+sec where id=(select id from portal_activity where code=p_code and username=u.username and action in('created','edited') order by at desc limit 1); end if;
  return json_build_object('serial',r.serial,'code',r.code); end $$;

create or replace function portal_cv_get(p_token text,p_code text) returns json
language plpgsql security definer set search_path=public, extensions as $$
begin perform portal_auth(p_token);
  return (select row_to_json(c) from portal_cvs c where lower(c.code)=lower(trim(p_code)) or c.serial::text=regexp_replace(p_code,'[^0-9]','','g')); end $$;

create or replace function portal_cv_log(p_token text,p_code text,p_action text,p_detail text default '') returns boolean
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; begin u:=portal_auth(p_token);
  if p_action not in('download_pdf','download_docx','viewed','imported') then raise exception 'Bad action'; end if;
  insert into portal_activity(code,username,action,detail) values(p_code,u.username,p_action,coalesce(p_detail,''));
  if p_action like 'download_%' then update portal_cvs set downloads=downloads+1,last_download=now() where code=p_code; end if;
  return true; end $$;

drop function if exists portal_cv_search(text,text,text);
drop function if exists portal_cv_search(text,text,text,text);
create or replace function portal_cv_search(p_token text,p_q text,p_kind text default null,p_by text default null,p_from date default null,p_to date default null) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare n text:=regexp_replace(lower(coalesce(p_q,'')),'[\s\-+()#]','','g'); begin perform portal_auth(p_token);
  return coalesce((select json_agg(x) from (
    select serial,code,kind,customer,phone,email,label,created_by,updated_by,created_at,updated_at,time_spent,edit_count,downloads,last_download from portal_cvs c
     where (p_kind is null or c.kind=p_kind) and (p_by is null or c.created_by=p_by)
       and (p_from is null or c.created_at::date>=p_from) and (p_to is null or c.created_at::date<=p_to) and (n='' or
       regexp_replace(lower(c.customer),'[\s\-+()]','','g') like '%'||n||'%' or
       regexp_replace(c.phone,'[\s\-+()]','','g') like '%'||n||'%' or
       lower(c.code) like '%'||n||'%' or lower(c.email) like '%'||n||'%' or c.serial::text=ltrim(regexp_replace(n,'[^0-9]','','g'),'0'))
     order by updated_at desc limit 300) x),'[]'::json); end $$;

create or replace function portal_activity_list(p_token text,p_code text default null,p_user text default null,p_from date default null,p_to date default null) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; begin u:=portal_auth(p_token);
  if p_code is null and u.role<>'admin' then raise exception 'Admins only.'; end if;
  return coalesce((select json_agg(x) from (select a.id,a.code,a.username,a.action,a.seconds,a.detail,a.at,c.customer,c.serial from portal_activity a left join portal_cvs c on c.code=a.code
     where (p_code is null or a.code=p_code) and (p_user is null or a.username=p_user)
       and (p_from is null or a.at::date>=p_from) and (p_to is null or a.at::date<=p_to)
     order by a.at desc limit 300) x),'[]'::json); end $$;

create or replace function portal_report(p_token text,p_from date default null,p_to date default null) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; f date; t date:=coalesce(p_to,current_date); begin u:=portal_auth(p_token);
  f:=coalesce(p_from,(select coalesce(min(created_at)::date,current_date) from portal_cvs));
  return json_build_object(
   'totals',(select json_build_object('cvs',count(*),'ats',count(*) filter(where kind='ats'),'europass',count(*) filter(where kind='europass'),
      'customers',count(distinct coalesce(nullif(regexp_replace(phone,'[^0-9]','','g'),''),lower(nullif(customer,'')))),
      'seconds',coalesce(sum(time_spent),0),'downloads',coalesce(sum(downloads),0)) from portal_cvs where created_at::date between f and t
      and (u.role='admin' or created_by=u.username)),
   'daily',coalesce((select json_agg(json_build_object('d',d::date,'n',(select count(*) from portal_cvs c where c.created_at::date=d::date and (u.role='admin' or c.created_by=u.username))) order by d)
      from generate_series(greatest(f,t-89),t,interval '1 day') d),'[]'::json),
   'experts',case when u.role='admin' then coalesce((select json_agg(x order by x.cvs desc) from (
      select pu.username,pu.name,pu.active,pu.last_login,pu.login_count,
       (select count(*) from portal_cvs c where c.created_by=pu.username and c.created_at::date between f and t) cvs,
       (select coalesce(sum(a.seconds),0) from portal_activity a where a.username=pu.username and a.at::date between f and t) seconds,
       (select count(*) from portal_activity a where a.username=pu.username and a.action like 'download_%' and a.at::date between f and t) downloads,
       (select count(*) from portal_cvs c where c.created_by=pu.username) cvs_all
      from portal_users pu where pu.role='user') x),'[]'::json) else '[]'::json end); end $$;

-- Expert accounts: clear messages + real delete
create or replace function portal_user_create(p_token text,p_username text,p_name text,p_password text,p_role text default 'user') returns boolean
language plpgsql security definer set search_path=public, extensions as $$
declare a portal_users; un text:=lower(trim(p_username)); ex portal_users; begin
  a:=portal_auth(p_token,true);
  if un !~ '^[a-z0-9._-]{3,32}$' then raise exception 'Username: 3-32 lowercase letters, numbers, dot, dash or underscore.'; end if;
  if length(coalesce(p_password,''))<8 then raise exception 'Password must be at least 8 characters.'; end if;
  select * into ex from portal_users where username=un;
  if ex.username is not null then
    if ex.active then raise exception 'That username is already used by %.', ex.name;
    else raise exception 'That username belongs to a disabled account (%). Enable or delete it first.', ex.name; end if; end if;
  insert into portal_users(username,name,role,pass,created_by)
   values(un,coalesce(nullif(trim(p_name),''),un),'user',crypt(p_password,gen_salt('bf')),a.username);
  return true; end $$;

create or replace function portal_user_delete(p_token text,p_username text) returns boolean
language plpgsql security definer set search_path=public, extensions as $$
declare n int; begin perform portal_auth(p_token,true);
  if lower(p_username)='skilleazeadmin' then raise exception 'The main admin cannot be deleted.'; end if;
  delete from portal_sessions where username=lower(p_username);
  delete from portal_users where username=lower(p_username);
  get diagnostics n = row_count;
  if n=0 then raise exception 'User not found. Refresh the page.'; end if;
  return true; end $$;

grant execute on function portal_user_create, portal_user_delete, portal_cv_save, portal_cv_get, portal_cv_search, portal_cv_log, portal_activity_list, portal_report to anon;
revoke all on portal_activity from anon, authenticated;
