-- Skilleaze Internal CV Portal · Orders & Expert Earnings
-- Run ONCE in Supabase -> SQL Editor. Safe to run again. Existing users, CVs and activity are kept.
-- Rates: Resume/CV 30 · Cover Letter 5 · LinkedIn 50 · Portfolio 100 (INR per completed order)

create table if not exists portal_rates(
  service text primary key check (service in ('cv','cover','linkedin','portfolio')),
  label text not null, amount numeric not null);
insert into portal_rates(service,label,amount) values
  ('cv','Resume / CV',30),('cover','Cover Letter',5),('linkedin','LinkedIn Profile',50),('portfolio','Portfolio Website',100)
on conflict (service) do nothing;
alter table portal_rates enable row level security;

create table if not exists portal_orders(
  id bigserial primary key,
  ref text not null,
  service text not null check (service in ('cv','cover','linkedin','portfolio')),
  customer text default '', phone text default '', note text default '',
  status text not null default 'completed' check (status in ('pending','completed','cancelled','rejected')),
  created_by text, created_at timestamptz not null default now(),
  completed_by text, completed_at timestamptz, rate numeric,
  updated_by text, updated_at timestamptz not null default now(),
  unique (ref, service));
create index if not exists portal_orders_done on portal_orders(completed_at);
create index if not exists portal_orders_by on portal_orders(completed_by);
alter table portal_orders enable row level security;

-- Internal: credit one order to one expert, exactly once.
create or replace function portal_order_credit(p_ref text,p_service text,p_user text,p_customer text default '',p_phone text default '',p_note text default '') returns json
language plpgsql security definer set search_path=public, extensions as $$
declare o portal_orders; rt numeric; c portal_cvs; begin
  select amount into rt from portal_rates where service=p_service;
  if rt is null then raise exception 'Unknown service.'; end if;
  select * into c from portal_cvs where code=p_ref;
  select * into o from portal_orders where ref=p_ref and service=p_service;
  if o.id is null then
    insert into portal_orders(ref,service,customer,phone,note,status,created_by,completed_by,completed_at,rate,updated_by)
    values(p_ref,p_service,coalesce(nullif(p_customer,''),c.customer,''),coalesce(nullif(p_phone,''),c.phone,''),coalesce(p_note,''),'completed',p_user,p_user,now(),rt,p_user)
    returning * into o;
    insert into portal_activity(code,username,action,detail) values(p_ref,p_user,'order_completed',p_service);
    return json_build_object('credited',true,'id',o.id,'by',p_user,'amount',rt);
  end if;
  if o.status='pending' then
    update portal_orders set status='completed',completed_by=p_user,completed_at=now(),rate=rt,updated_by=p_user,updated_at=now() where id=o.id;
    insert into portal_activity(code,username,action,detail) values(p_ref,p_user,'order_completed',p_service);
    return json_build_object('credited',true,'id',o.id,'by',p_user,'amount',rt);
  end if;
  return json_build_object('credited',false,'id',o.id,'by',o.completed_by,'status',o.status);
end $$;

-- Downloads now complete the order automatically (first download credits the expert who downloaded it).
create or replace function portal_cv_log(p_token text,p_code text,p_action text,p_detail text default '') returns boolean
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; begin u:=portal_auth(p_token);
  if p_action not in('download_pdf','download_docx','viewed','imported') then raise exception 'Bad action'; end if;
  insert into portal_activity(code,username,action,detail) values(p_code,u.username,p_action,coalesce(p_detail,''));
  if p_action like 'download_%' then
    update portal_cvs set downloads=downloads+1,last_download=now() where code=p_code;
    if u.role<>'admin' and exists(select 1 from portal_cvs where code=p_code) then
      perform portal_order_credit(p_code,case when coalesce(p_detail,'') ilike 'cover%' then 'cover' else 'cv' end,u.username);
    end if;
  end if;
  return true; end $$;

-- Expert completes an order by hand (LinkedIn, Portfolio, or a CV / cover letter delivered outside the builder).
create or replace function portal_order_complete(p_token text,p_ref text,p_service text,p_customer text default '',p_phone text default '',p_note text default '',p_force boolean default false) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; d text; ph text:=regexp_replace(coalesce(p_phone,''),'\D','','g'); begin
  u:=portal_auth(p_token);
  if u.role='admin' then raise exception 'Orders are completed by CV experts. Use Reassign to credit an expert.'; end if;
  if coalesce(p_ref,'')='' then raise exception 'Order reference is required.'; end if;
  if not coalesce(p_force,false) and length(ph)>=6 then
    select completed_by into d from portal_orders where service=p_service and status='completed'
      and regexp_replace(coalesce(phone,''),'\D','','g')=ph and completed_at > now() - interval '30 days' and ref<>p_ref limit 1;
    if d is not null then raise exception 'DUPLICATE: this customer already has a completed % order in the last 30 days (by %).',p_service,d; end if;
  end if;
  return portal_order_credit(p_ref,p_service,u.username,p_customer,p_phone,p_note);
end $$;

-- Operations Manager (admin): change status or reassign the credit.
create or replace function portal_order_set(p_token text,p_id bigint,p_status text default null,p_completed_by text default null) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; o portal_orders; rt numeric; begin
  u:=portal_auth(p_token,true);
  select * into o from portal_orders where id=p_id;
  if o.id is null then raise exception 'Order not found.'; end if;
  if p_completed_by is not null then
    if not exists(select 1 from portal_users where username=p_completed_by and role='user') then raise exception 'Expert not found.'; end if;
    update portal_orders set completed_by=p_completed_by,updated_by=u.username,updated_at=now() where id=p_id;
    insert into portal_activity(code,username,action,detail) values(o.ref,u.username,'order_reassigned',o.service||' -> '||p_completed_by);
  end if;
  if p_status is not null then
    if p_status not in ('pending','completed','cancelled','rejected') then raise exception 'Bad status.'; end if;
    select amount into rt from portal_rates where service=o.service;
    if p_status='completed' then
      update portal_orders set status='completed',completed_at=coalesce(completed_at,now()),rate=coalesce(rate,rt),
        completed_by=coalesce(p_completed_by,completed_by,created_by),updated_by=u.username,updated_at=now() where id=p_id;
    elsif p_status='pending' then
      update portal_orders set status='pending',completed_by=null,completed_at=null,rate=null,updated_by=u.username,updated_at=now() where id=p_id;
    else
      update portal_orders set status=p_status,updated_by=u.username,updated_at=now() where id=p_id;
    end if;
    insert into portal_activity(code,username,action,detail) values(o.ref,u.username,'order_'||p_status,o.service);
  end if;
  select * into o from portal_orders where id=p_id;
  return row_to_json(o);
end $$;

create or replace function portal_orders_list(p_token text,p_from date default null,p_to date default null,p_user text default null,p_service text default null,p_status text default null) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; who text; begin
  u:=portal_auth(p_token);
  who:=case when u.role='admin' then nullif(p_user,'') else u.username end;
  return coalesce((select json_agg(x order by x.sort_at desc) from (
    select o.*,coalesce(o.completed_at,o.created_at) as sort_at,pu.name as expert_name
    from portal_orders o left join portal_users pu on pu.username=o.completed_by
    where (who is null or o.completed_by=who or (o.completed_by is null and o.created_by=who))
      and (p_service is null or p_service='' or o.service=p_service)
      and (p_status is null or p_status='' or o.status=p_status)
      and (p_from is null or coalesce(o.completed_at,o.created_at)::date>=p_from)
      and (p_to is null or coalesce(o.completed_at,o.created_at)::date<=p_to)
    order by coalesce(o.completed_at,o.created_at) desc limit 1000) x),'[]'::json);
end $$;

-- Earnings: only completed orders, valued at the rate saved when each order was completed.
create or replace function portal_earnings(p_token text,p_from date default null,p_to date default null,p_user text default null,p_service text default null) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; who text; begin
  u:=portal_auth(p_token);
  who:=case when u.role='admin' then nullif(p_user,'') else u.username end;
  return json_build_object(
    'rates',(select json_object_agg(service,amount) from portal_rates),
    'experts',coalesce((select json_agg(e order by e.total desc,e.name) from (
      select pu.username,pu.name,pu.active,
        count(o.id) filter (where o.service='cv') as cv,
        count(o.id) filter (where o.service='cover') as cover,
        count(o.id) filter (where o.service='linkedin') as linkedin,
        count(o.id) filter (where o.service='portfolio') as portfolio,
        coalesce(sum(o.rate) filter (where o.service='cv'),0) as cv_amt,
        coalesce(sum(o.rate) filter (where o.service='cover'),0) as cover_amt,
        coalesce(sum(o.rate) filter (where o.service='linkedin'),0) as linkedin_amt,
        coalesce(sum(o.rate) filter (where o.service='portfolio'),0) as portfolio_amt,
        count(o.id) as orders, coalesce(sum(o.rate),0) as total
      from portal_users pu left join portal_orders o on o.completed_by=pu.username and o.status='completed'
        and (p_service is null or p_service='' or o.service=p_service)
        and (p_from is null or o.completed_at::date>=p_from) and (p_to is null or o.completed_at::date<=p_to)
      where pu.role='user' and (who is null or pu.username=who)
      group by pu.username,pu.name,pu.active) e),'[]'::json),
    'monthly',coalesce((select json_agg(m order by m.month desc) from (
      select to_char(date_trunc('month',o.completed_at),'YYYY-MM') as month,
        count(*) as orders, coalesce(sum(o.rate),0) as total,
        count(*) filter (where o.service='cv') as cv, count(*) filter (where o.service='cover') as cover,
        count(*) filter (where o.service='linkedin') as linkedin, count(*) filter (where o.service='portfolio') as portfolio
      from portal_orders o where o.status='completed' and (who is null or o.completed_by=who)
        and (p_service is null or p_service='' or o.service=p_service)
      group by 1) m),'[]'::json),
    'daily',coalesce((select json_agg(d order by d.day) from (
      select o.completed_at::date as day,count(*) as orders,coalesce(sum(o.rate),0) as total
      from portal_orders o where o.status='completed' and (who is null or o.completed_by=who)
        and (p_service is null or p_service='' or o.service=p_service)
        and (p_from is null or o.completed_at::date>=p_from) and (p_to is null or o.completed_at::date<=p_to)
      group by 1) d),'[]'::json));
end $$;

-- One-time backfill: every CV / cover letter already downloaded becomes one completed order,
-- credited to the expert who downloaded it first, at today's rate.
insert into portal_orders(ref,service,customer,phone,status,created_by,completed_by,completed_at,rate,updated_by)
select f.code,f.svc,coalesce(c.customer,''),coalesce(c.phone,''),'completed',f.username,f.username,f.at,r.amount,'backfill'
from (
  select distinct on (z.code,z.svc) z.code,z.username,z.at,z.svc from (
    select a.code,a.username,a.at,case when coalesce(a.detail,'') ilike 'cover%' then 'cover' else 'cv' end as svc
    from portal_activity a join portal_users pu on pu.username=a.username and pu.role='user'
    where a.action like 'download_%' and a.code is not null) z
  order by z.code,z.svc,z.at) f
join portal_cvs c on c.code=f.code
join portal_rates r on r.service=f.svc
on conflict (ref,service) do nothing;
