-- Skilleaze Internal CV Portal · upgrade v3
-- Admin can delete any CV. Every CV deletion and every expert added, disabled, enabled or removed
-- is written to the activity log with the name of the person who did it.
-- Run once in Supabase → SQL Editor. Safe to run again.

create or replace function portal_cv_delete(p_token text,p_code text) returns boolean
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; c portal_cvs; begin u:=portal_auth(p_token,true);
  select * into c from portal_cvs where code=p_code;
  if c.code is null then raise exception 'CV not found. Refresh the page.'; end if;
  delete from portal_cvs where code=p_code;
  insert into portal_activity(code,username,action,detail)
   values(p_code,u.username,'deleted',coalesce(nullif(c.customer,''),'(no name)')||' · No. '||lpad(coalesce(c.serial,0)::text,5,'0'));
  return true; end $$;

create or replace function portal_log_users() returns trigger
language plpgsql security definer set search_path=public, extensions as $$
declare who text:=coalesce(nullif(current_setting('portal.actor',true),''),'system'); begin
  if tg_op='INSERT' and new.role='user' then
    insert into portal_activity(code,username,action,detail) values(null,coalesce(new.created_by,who),'user_created',new.name||' (@'||new.username||')');
  elsif tg_op='DELETE' and old.role='user' then
    insert into portal_activity(code,username,action,detail) values(null,who,'user_deleted',old.name||' (@'||old.username||')');
  elsif tg_op='UPDATE' and old.active is distinct from new.active then
    insert into portal_activity(code,username,action,detail) values(null,who,case when new.active then 'user_enabled' else 'user_disabled' end,new.name||' (@'||new.username||')');
  end if; return null; end $$;
drop trigger if exists portal_users_log on portal_users;
create trigger portal_users_log after insert or update of active or delete on portal_users for each row execute function portal_log_users();

-- remember who is acting, for the trigger above
create or replace function portal_auth(p_token text, p_admin boolean default false) returns portal_users
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; begin
  select pu.* into u from portal_sessions s join portal_users pu on pu.username=s.username
   where s.token=p_token and pu.active and s.created_at > now() - interval '30 days';
  if u.username is null then raise exception 'Please sign in again.'; end if;
  if p_admin and u.role<>'admin' then raise exception 'Admins only.'; end if;
  perform set_config('portal.actor',u.username,true);
  return u; end $$;

-- activity list keeps entries for deleted CVs and user events
create or replace function portal_activity_list(p_token text,p_code text default null,p_user text default null,p_from date default null,p_to date default null) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; begin u:=portal_auth(p_token);
  if p_code is null and u.role<>'admin' then raise exception 'Admins only.'; end if;
  return coalesce((select json_agg(x) from (select a.id,a.code,a.username,a.action,a.seconds,a.detail,a.at,c.customer,c.serial from portal_activity a left join portal_cvs c on c.code=a.code
     where (p_code is null or a.code=p_code) and (p_user is null or a.username=p_user)
       and (p_from is null or a.at::date>=p_from) and (p_to is null or a.at::date<=p_to)
     order by a.at desc limit 500) x),'[]'::json); end $$;
