-- Skilleaze Internal CV Portal · Supabase schema
-- Run once in Supabase → SQL Editor. Tables are locked (RLS on, no policies);
-- the website only talks to them through the functions below.
create extension if not exists pgcrypto;

create table if not exists portal_users(
  username text primary key, name text not null, role text not null default 'user' check (role in ('admin','user')),
  pass text not null, active boolean not null default true, created_by text,
  created_at timestamptz not null default now(), last_login timestamptz, login_count int not null default 0);
create table if not exists portal_sessions(
  token text primary key, username text not null references portal_users(username) on delete cascade,
  created_at timestamptz not null default now());
create table if not exists portal_cvs(
  code text primary key, kind text not null, customer text default '', phone text default '', email text default '',
  label text default '', doc jsonb, created_by text, updated_by text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists portal_cvs_search on portal_cvs (lower(customer), phone, lower(code));
alter table portal_users enable row level security;
alter table portal_sessions enable row level security;
alter table portal_cvs enable row level security;

create or replace function portal_pub(u portal_users) returns json language sql immutable as $$
  select json_build_object('username',u.username,'name',u.name,'role',u.role,'active',u.active,'created_by',u.created_by,
    'created_at',u.created_at,'last_login',u.last_login,'login_count',u.login_count) $$;

create or replace function portal_auth(p_token text, p_admin boolean default false) returns portal_users
language plpgsql security definer set search_path=public as $$
declare u portal_users; begin
  select pu.* into u from portal_sessions s join portal_users pu on pu.username=s.username
   where s.token=p_token and pu.active and s.created_at > now() - interval '30 days';
  if u.username is null then raise exception 'Please sign in again.'; end if;
  if p_admin and u.role<>'admin' then raise exception 'Admins only.'; end if;
  return u; end $$;

create or replace function portal_login(p_username text, p_password text) returns json
language plpgsql security definer set search_path=public as $$
declare u portal_users; t text; begin
  select * into u from portal_users where username=lower(trim(p_username));
  if u.username is null or u.pass <> crypt(p_password,u.pass) then raise exception 'Username or password is incorrect.'; end if;
  if not u.active then raise exception 'This account is disabled. Ask the admin.'; end if;
  t:=encode(gen_random_bytes(32),'hex');
  insert into portal_sessions(token,username) values(t,u.username);
  update portal_users set last_login=now(), login_count=login_count+1 where username=u.username returning * into u;
  return json_build_object('token',t,'user',portal_pub(u)); end $$;

create or replace function portal_me(p_token text) returns json
language plpgsql security definer set search_path=public as $$
begin return portal_pub(portal_auth(p_token)); exception when others then return null; end $$;

create or replace function portal_logout(p_token text) returns void
language sql security definer set search_path=public as $$ delete from portal_sessions where token=p_token $$;

create or replace function portal_users_list(p_token text) returns json
language plpgsql security definer set search_path=public as $$
begin perform portal_auth(p_token,true);
  return coalesce((select json_agg((portal_pub(u)::jsonb || jsonb_build_object('cv_count',(select count(*) from portal_cvs c where c.created_by=u.username))) order by u.created_at)
    from portal_users u),'[]'::json); end $$;

create or replace function portal_user_create(p_token text,p_username text,p_name text,p_password text,p_role text default 'user') returns boolean
language plpgsql security definer set search_path=public as $$
declare a portal_users; un text:=lower(trim(p_username)); begin
  a:=portal_auth(p_token,true);
  if un !~ '^[a-z0-9._-]{3,32}$' then raise exception 'Username: 3–32 letters, numbers, dot, dash or underscore.'; end if;
  if length(coalesce(p_password,''))<8 then raise exception 'Password must be at least 8 characters.'; end if;
  if exists(select 1 from portal_users where username=un) then raise exception 'That username already exists.'; end if;
  insert into portal_users(username,name,role,pass,created_by)
   values(un,coalesce(nullif(trim(p_name),''),un),'user',crypt(p_password,gen_salt('bf')),a.username);
  return true; end $$;

create or replace function portal_user_update(p_token text,p_username text,p_active boolean,p_password text) returns boolean
language plpgsql security definer set search_path=public as $$
begin perform portal_auth(p_token,true);
  if p_active is not null then
    if p_username='skilleazeadmin' then raise exception 'The main admin cannot be disabled.'; end if;
    update portal_users set active=p_active where username=p_username;
    if not p_active then delete from portal_sessions where username=p_username; end if; end if;
  if p_password is not null then
    if length(p_password)<8 then raise exception 'Password must be at least 8 characters.'; end if;
    update portal_users set pass=crypt(p_password,gen_salt('bf')) where username=p_username;
    delete from portal_sessions where username=p_username and token<>p_token; end if;
  return true; end $$;

create or replace function portal_user_delete(p_token text,p_username text) returns boolean
language plpgsql security definer set search_path=public as $$
begin perform portal_auth(p_token,true);
  if p_username='skilleazeadmin' then raise exception 'The main admin cannot be deleted.'; end if;
  delete from portal_users where username=p_username; return true; end $$;

create or replace function portal_cv_save(p_token text,p_code text,p_kind text,p_customer text,p_phone text,p_email text,p_label text,p_doc jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
declare u portal_users; begin u:=portal_auth(p_token);
  if u.role='admin' then raise exception 'Admin accounts manage the portal and cannot create or edit CVs.'; end if;
  insert into portal_cvs(code,kind,customer,phone,email,label,doc,created_by,updated_by)
   values(p_code,p_kind,p_customer,p_phone,p_email,p_label,p_doc,u.username,u.username)
  on conflict(code) do update set kind=excluded.kind,customer=excluded.customer,phone=excluded.phone,email=excluded.email,
   label=excluded.label,doc=excluded.doc,updated_by=u.username,updated_at=now();
  return true; end $$;

create or replace function portal_cv_get(p_token text,p_code text) returns json
language plpgsql security definer set search_path=public as $$
begin perform portal_auth(p_token);
  return (select row_to_json(c) from portal_cvs c where lower(c.code)=lower(trim(p_code))); end $$;

drop function if exists portal_cv_search(text,text,text);
create or replace function portal_cv_search(p_token text,p_q text,p_kind text default null,p_by text default null) returns json
language plpgsql security definer set search_path=public as $$
declare n text:=regexp_replace(lower(coalesce(p_q,'')),'[\s\-+()]','','g'); begin perform portal_auth(p_token);
  return coalesce((select json_agg(x) from (
    select code,kind,customer,phone,email,label,created_by,updated_by,created_at,updated_at from portal_cvs c
     where (p_kind is null or c.kind=p_kind) and (p_by is null or c.created_by=p_by) and (n='' or
       regexp_replace(lower(c.customer),'[\s\-+()]','','g') like '%'||n||'%' or
       regexp_replace(c.phone,'[\s\-+()]','','g') like '%'||n||'%' or
       lower(c.code) like '%'||n||'%' or lower(c.email) like '%'||n||'%')
     order by updated_at desc limit 100) x),'[]'::json); end $$;

create or replace function portal_cv_delete(p_token text,p_code text) returns boolean
language plpgsql security definer set search_path=public as $$
begin perform portal_auth(p_token,true); delete from portal_cvs where code=p_code; return true; end $$;

create or replace function portal_stats(p_token text) returns json
language plpgsql security definer set search_path=public as $$
begin perform portal_auth(p_token);
  return json_build_object('users',(select count(*) from portal_users),'active_users',(select count(*) from portal_users where active),
   'experts',(select count(*) from portal_users where role='user'),'active_experts',(select count(*) from portal_users where role='user' and active),
   'logins',(select coalesce(sum(login_count),0) from portal_users where role='user'),'cvs',(select count(*) from portal_cvs),
   'ats',(select count(*) from portal_cvs where kind='ats'),'europass',(select count(*) from portal_cvs where kind='europass'),
   'customers',(select count(distinct coalesce(nullif(regexp_replace(phone,'[^0-9]','','g'),''),lower(nullif(customer,'')))) from portal_cvs),
   'cvs_week',(select count(*) from portal_cvs where created_at > now() - interval '7 days'),
   'cvs_today',(select count(*) from portal_cvs where created_at::date=current_date)); end $$;

revoke all on portal_users, portal_sessions, portal_cvs from anon, authenticated;
grant execute on function portal_login, portal_me, portal_logout, portal_users_list, portal_user_create, portal_user_update,
  portal_user_delete, portal_cv_save, portal_cv_get, portal_cv_search, portal_cv_delete, portal_stats to anon;

-- The main admin account. Change this password after first sign-in (Dashboard → Users → Reset password).
insert into portal_users(username,name,role,pass)
values('skilleazeadmin','Skilleaze Admin','admin',crypt('Skz!Adm-4Rq9#Vt72Lp',gen_salt('bf')))
on conflict(username) do nothing;
